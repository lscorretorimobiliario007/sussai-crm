#!/usr/bin/env node
/**
 * Production baseline repair — Prisma Migrate only (NO db push, NO DROP of data).
 *
 * Detects which migrations are already reflected in the live schema, marks them
 * with `prisma migrate resolve --applied`, then runs `prisma migrate deploy`
 * for the remainder.
 *
 * Typical VPS state (confirmed diagnosis):
 * - `_prisma_migrations` missing
 * - `Empresa` exists WITHOUT `ativo` / `nomeFantasia`
 * → post `20260717031941_create_empresa`, pre `20260807013943_crm_full_modules`
 *
 * Usage (from backend/):
 *   node scripts/repair-production-baseline.mjs
 *   REPAIR_DRY_RUN=1 node scripts/repair-production-baseline.mjs
 *   FORCE_LOCAL=1 node scripts/repair-production-baseline.mjs   # allow localhost
 *
 * Prefer: bash scripts/repair-production-db.sh
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DRY_RUN = process.env.REPAIR_DRY_RUN === "1" || process.argv.includes("--dry-run");
const FORCE_LOCAL = process.env.FORCE_LOCAL === "1";
const SKIP_PM2 = process.env.SKIP_PM2 === "1";
const SKIP_SMOKE = process.env.SKIP_SMOKE === "1";

/** Ordered migration names (must match prisma/migrations folders). */
const ALL_MIGRATIONS = [
  "20260713021938_init",
  "20260713022303_init",
  "20260714000412_usuario_admin",
  "20260714011954_create_imovel",
  "20260716011200_crm_completo",
  "20260716024100_imoveis_completo",
  "20260716030500_imovel_historico_extra",
  "20260716040000_clientes_completo",
  "20260716050000_agenda_completa",
  "20260716060000_pipeline_crm",
  "20260716070000_proprietarios_corretores",
  "20260716120000_mvp_indexes",
  "20260716140000_financeiro_completo",
  "20260716180000_imoveis_refinamento_r1",
  "20260716190000_site_publicacao_imovel",
  "20260716200000_rc1_indexes",
  "20260716210000_empresa_implantacao",
  "20260716220000_v1_imoveis_operacao",
  "20260716230000_v1_imoveis_refinamento_final",
  "20260717025403_create_usuario", // DESTRUCTIVE — never re-execute
  "20260717031941_create_empresa",
  "20260717120000_create_property",
  "20260717130000_usuario_perfil",
  "20260717140000_properties_pt_br", // DROP TABLE properties — never re-execute if data exists
  "20260717150000_property_images",
  "20260717160000_property_slug",
  "20260717170000_create_leads",
  "20260717180000_pipeline_stages",
  "20260801032000_create_property_owners",
  "20260807013943_crm_full_modules",
  "20260807020000_empresa_branding_fields",
  "20260808010000_ensure_empresa_schema_columns",
];

const REQUIRED_EMPRESA_COLUMNS = [
  "ativo",
  "nomeFantasia",
  "plano",
  "razaoSocial",
  "logoUrl",
  "siteUrl",
  "whatsapp",
  "endereco",
  "cidade",
  "estado",
  "cep",
  "siteAtivo",
  "corPrimaria",
  "faviconUrl",
  "creci",
  "slogan",
];

function loadEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function maskUrl(url) {
  try {
    const u = new URL(url);
    if (u.password) u.password = "***";
    return u.toString();
  } catch {
    return "(invalid DATABASE_URL)";
  }
}

function run(cmd, args, opts = {}) {
  console.log(`$ ${cmd} ${args.join(" ")}`);
  if (DRY_RUN && opts.mutating) {
    console.log("  (dry-run — skipped)");
    return { status: 0, stdout: "", stderr: "" };
  }
  const result = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: "utf8",
    shell: process.platform === "win32",
    env: process.env,
    stdio: opts.inherit ? "inherit" : "pipe",
  });
  if (!opts.inherit) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  }
  return result;
}

function assertOk(result, label) {
  if ((result.status ?? 1) !== 0) {
    throw new Error(`${label} failed with exit ${result.status}`);
  }
}

async function regclass(prisma, ident) {
  // ident e.g. 'public."Empresa"' or 'public.properties'
  const rows = await prisma.$queryRawUnsafe(
    `SELECT to_regclass('${ident.replace(/'/g, "''")}')::text AS reg`,
  );
  return Boolean(rows[0]?.reg);
}

async function columnExists(prisma, table, column) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT 1 AS ok
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = $1
       AND column_name = $2
     LIMIT 1`,
    table,
    column,
  );
  return rows.length > 0;
}

async function listEmpresaColumns(prisma) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'Empresa'
     ORDER BY ordinal_position`,
  );
  return rows.map((r) => r.column_name);
}

async function migrationsTableExists(prisma) {
  return regclass(prisma, 'public."_prisma_migrations"');
}

async function appliedSet(prisma) {
  if (!(await migrationsTableExists(prisma))) return new Set();
  const rows = await prisma.$queryRawUnsafe(
    `SELECT migration_name
     FROM "_prisma_migrations"
     WHERE finished_at IS NOT NULL
       AND rolled_back_at IS NULL`,
  );
  return new Set(rows.map((r) => r.migration_name));
}

async function introspect(prisma) {
  const empresaExists = await regclass(prisma, 'public."Empresa"');
  const empresaCols = empresaExists ? await listEmpresaColumns(prisma) : [];
  const has = (c) => empresaCols.includes(c);

  return {
    empresaExists,
    empresaCols,
    hasAtivo: has("ativo"),
    hasNomeFantasia: has("nomeFantasia"),
    hasPlano: has("plano"),
    hasSiteAtivo: has("siteAtivo"),
    hasCorPrimaria: has("corPrimaria"),
    hasFaviconUrl: has("faviconUrl"),
    usuarioExists: await regclass(prisma, 'public."Usuario"'),
    usuarioPerfil: await columnExists(prisma, "Usuario", "perfil"),
    usuarioEmpresaId: await columnExists(prisma, "Usuario", "empresaId"),
    properties: await regclass(prisma, "public.properties"),
    propertiesEmpresaId: await columnExists(prisma, "properties", "empresaId"),
    propertiesCodigo: await columnExists(prisma, "properties", "codigo"),
    propertiesSlug: await columnExists(prisma, "properties", "slug"),
    propertiesCompanyId: await columnExists(prisma, "properties", "companyId"),
    propertyImages: await regclass(prisma, "public.property_images"),
    propertyOwners: await regclass(prisma, "public.property_owners"),
    proprietarioId: await columnExists(prisma, "properties", "proprietarioId"),
    leads: await regclass(prisma, "public.leads"),
    pipelineStages: await regclass(prisma, "public.pipeline_stages"),
    cliente: await regclass(prisma, 'public."Cliente"'),
    auditLog: await regclass(prisma, 'public."AuditLog"'),
    imovelOld: await regclass(prisma, 'public."Imovel"'),
    teste: await regclass(prisma, 'public."Teste"'),
    migrationsTable: await migrationsTableExists(prisma),
  };
}

/**
 * Decide which migrations must be marked --applied (already reflected / historical
 * and must never re-run) vs left for migrate deploy.
 */
function planBaseline(state) {
  const resolve = [];
  const reasons = {};

  const mark = (name, reason) => {
    resolve.push(name);
    reasons[name] = reason;
  };

  // Pre-reset + destructive reset + Empresa recreate: ALWAYS resolve when Empresa
  // exists in the post-create_empresa world (missing ativo/nomeFantasia) OR when
  // Empresa exists at all after the Nest English-schema era (properties present).
  // These must never be re-executed (especially create_usuario DROP).
  const historicalThroughCreateEmpresa = [
    "20260713021938_init",
    "20260713022303_init",
    "20260714000412_usuario_admin",
    "20260714011954_create_imovel",
    "20260716011200_crm_completo",
    "20260716024100_imoveis_completo",
    "20260716030500_imovel_historico_extra",
    "20260716040000_clientes_completo",
    "20260716050000_agenda_completa",
    "20260716060000_pipeline_crm",
    "20260716070000_proprietarios_corretores",
    "20260716120000_mvp_indexes",
    "20260716140000_financeiro_completo",
    "20260716180000_imoveis_refinamento_r1",
    "20260716190000_site_publicacao_imovel",
    "20260716200000_rc1_indexes",
    "20260716210000_empresa_implantacao",
    "20260716220000_v1_imoveis_operacao",
    "20260716230000_v1_imoveis_refinamento_final",
    "20260717025403_create_usuario",
    "20260717031941_create_empresa",
  ];

  if (!state.empresaExists) {
    throw new Error(
      'Tabela "Empresa" não existe. Este script assume baseline incompleto COM Empresa. Abortando para não criar schema do zero sem revisão.',
    );
  }

  // Signature: post create_empresa OR later (Empresa always exists after that point
  // in production path). Always resolve historical through create_empresa.
  for (const m of historicalThroughCreateEmpresa) {
    mark(m, "histórico pré/pós-reset — nunca reexecutar (preserva dados)");
  }

  // Post-create_empresa Nest path
  if (state.properties) {
    mark("20260717120000_create_property", "tabela properties existe");
  }
  if (state.usuarioPerfil) {
    mark("20260717130000_usuario_perfil", "Usuario.perfil existe");
  }
  if (state.propertiesEmpresaId && state.propertiesCodigo) {
    mark(
      "20260717140000_properties_pt_br",
      "properties PT-BR (empresaId+codigo) — NÃO reexecutar DROP",
    );
  } else if (state.properties && state.propertiesCompanyId) {
    throw new Error(
      "Detectado schema properties em inglês (companyId) sem PT-BR. " +
        "Aplicar properties_pt_br faria DROP TABLE e apagaria dados. Abortando. " +
        "Intervenção manual necessária.",
    );
  }
  if (state.propertyImages) {
    mark("20260717150000_property_images", "property_images existe");
  }
  if (state.propertiesSlug) {
    mark("20260717160000_property_slug", "properties.slug existe");
  }
  if (state.leads) {
    mark("20260717170000_create_leads", "leads existe");
  }
  if (state.pipelineStages) {
    mark("20260717180000_pipeline_stages", "pipeline_stages existe");
  }
  if (state.propertyOwners || state.proprietarioId) {
    mark(
      "20260801032000_create_property_owners",
      "property_owners / proprietarioId existe",
    );
  }

  // crm_full_modules: ONLY resolve if CRM tables already present.
  // If Empresa columns missing but Cliente exists → partial apply → resolve + deploy ensure.
  const crmTablesPresent = state.cliente && state.auditLog;
  const empresaColumnsFromCrm = state.hasAtivo && state.hasNomeFantasia;

  if (crmTablesPresent) {
    mark(
      "20260807013943_crm_full_modules",
      "Cliente+AuditLog já existem — não recriar (parcial ou completo)",
    );
  } else if (empresaColumnsFromCrm && !state.cliente) {
    // Unusual: columns exist without CRM tables — still need deploy for tables.
    // Do not resolve.
  }

  if (state.hasSiteAtivo && state.hasCorPrimaria && state.hasFaviconUrl) {
    mark(
      "20260807020000_empresa_branding_fields",
      "colunas de branding já presentes",
    );
  }

  const allRequired = REQUIRED_EMPRESA_COLUMNS.every((c) =>
    state.empresaCols.includes(c),
  );
  if (allRequired) {
    mark(
      "20260808010000_ensure_empresa_schema_columns",
      "todas as colunas Empresa já presentes",
    );
  }

  // Never resolve crm_full_modules if columns missing AND tables missing —
  // that pair must be deployed.
  if (!crmTablesPresent && !empresaColumnsFromCrm) {
    // leave for deploy — correct path for confirmed diagnosis
  }

  // Guard: never leave create_usuario as pending
  if (!resolve.includes("20260717025403_create_usuario")) {
    mark(
      "20260717025403_create_usuario",
      "FORÇADO — migration destrutiva nunca pode ficar pending",
    );
  }

  const resolveSet = new Set(resolve);
  const deployCandidates = ALL_MIGRATIONS.filter((m) => !resolveSet.has(m));

  return { resolve, reasons, deployCandidates, crmTablesPresent, empresaColumnsFromCrm };
}

async function main() {
  loadEnv();

  if (process.env.SIMULATE_PROD_DIAGNOSIS === "1") {
    console.log("=== SIMULAÇÃO: diagnóstico de produção confirmado ===");
    const fake = {
      empresaExists: true,
      empresaCols: ["id", "nome", "cnpj", "email", "telefone", "createdAt", "updatedAt"],
      hasAtivo: false,
      hasNomeFantasia: false,
      hasPlano: false,
      hasSiteAtivo: false,
      hasCorPrimaria: false,
      hasFaviconUrl: false,
      usuarioExists: true,
      usuarioPerfil: true,
      usuarioEmpresaId: true,
      properties: true,
      propertiesEmpresaId: true,
      propertiesCodigo: true,
      propertiesSlug: true,
      propertiesCompanyId: false,
      propertyImages: true,
      propertyOwners: true,
      proprietarioId: true,
      leads: true,
      pipelineStages: true,
      cliente: false,
      auditLog: false,
      imovelOld: false,
      teste: false,
      migrationsTable: false,
    };
    const plan = planBaseline(fake);
    console.log("RESOLVE:", plan.resolve.length, "migrations");
    console.log("DEPLOY:", plan.deployCandidates.join("\n  "));
    if (
      plan.deployCandidates.join() !==
      [
        "20260807013943_crm_full_modules",
        "20260807020000_empresa_branding_fields",
        "20260808010000_ensure_empresa_schema_columns",
      ].join()
    ) {
      console.error("Simulação divergiu do plano esperado!");
      process.exit(1);
    }
    console.log("OK: plano de produção esperado confirmado.");
    return;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("FATAL: DATABASE_URL ausente");
    process.exit(1);
  }

  let host = "";
  try {
    host = new URL(databaseUrl).hostname;
  } catch {
    console.error("FATAL: DATABASE_URL inválida");
    process.exit(1);
  }

  console.log("=== SUSSAI production DB baseline repair ===");
  console.log("DATABASE_URL:", maskUrl(databaseUrl));
  console.log("HOST:", host);
  console.log("DRY_RUN:", DRY_RUN ? "yes" : "no");
  console.log("");

  if (
    (host === "localhost" || host === "127.0.0.1") &&
    !FORCE_LOCAL
  ) {
    console.error(
      "ABORT: DATABASE_URL aponta para localhost. " +
        "Este reparo é para produção. Use FORCE_LOCAL=1 se for intencional.",
    );
    process.exit(2);
  }

  // Verify migration folders exist
  for (const name of ALL_MIGRATIONS) {
    const dir = path.join(ROOT, "prisma", "migrations", name);
    if (!fs.existsSync(dir)) {
      console.error(`FATAL: pasta de migration ausente: ${name}`);
      process.exit(1);
    }
  }

  const prisma = new PrismaClient();
  try {
    const state = await introspect(prisma);
    console.log("--- Introspecção ---");
    console.log(
      JSON.stringify(
        {
          migrationsTable: state.migrationsTable,
          empresaCols: state.empresaCols,
          hasAtivo: state.hasAtivo,
          hasNomeFantasia: state.hasNomeFantasia,
          properties: state.properties,
          leads: state.leads,
          pipelineStages: state.pipelineStages,
          propertyOwners: state.propertyOwners,
          cliente: state.cliente,
          auditLog: state.auditLog,
          imovelOld: state.imovelOld,
        },
        null,
        2,
      ),
    );

    if (!state.hasAtivo || !state.hasNomeFantasia) {
      console.log(
        "\nDiagnóstico: Empresa sem ativo/nomeFantasia → baseline pós-create_empresa, pré-crm_full_modules (ou parcial).",
      );
    }

    const plan = planBaseline(state);
    const already = await appliedSet(prisma);

    console.log("\n--- Plano: resolve --applied ---");
    const toResolve = plan.resolve.filter((m) => !already.has(m));
    for (const m of plan.resolve) {
      const status = already.has(m) ? "já registrada" : "RESOLVER";
      console.log(`  [${status}] ${m} — ${plan.reasons[m]}`);
    }

    console.log("\n--- Plano: migrate deploy (pendentes esperadas) ---");
    for (const m of plan.deployCandidates) {
      if (already.has(m)) {
        console.log(`  [já registrada] ${m}`);
      } else {
        console.log(`  [DEPLOY] ${m}`);
      }
    }

    if (plan.deployCandidates.includes("20260717025403_create_usuario")) {
      throw new Error(
        "SEGURANÇA: create_usuario ficaria pending no deploy — abortando.",
      );
    }
    if (plan.deployCandidates.includes("20260717140000_properties_pt_br")) {
      // Only OK if properties table does not exist yet (fresh)
      if (state.properties) {
        throw new Error(
          "SEGURANÇA: properties_pt_br ficaria pending com properties existente — risco de DROP. Abortando.",
        );
      }
    }

    console.log("\n--- Aplicando resolve --applied ---");
    for (const m of toResolve) {
      assertOk(
        run("npx", ["prisma", "migrate", "resolve", "--applied", m], {
          mutating: true,
        }),
        `migrate resolve ${m}`,
      );
    }
    if (toResolve.length === 0) {
      console.log("Nenhuma migration nova para resolver.");
    }

    console.log("\n--- prisma migrate deploy ---");
    assertOk(
      run("npx", ["prisma", "migrate", "deploy"], { mutating: true }),
      "migrate deploy",
    );

    console.log("\n--- prisma generate ---");
    assertOk(run("npx", ["prisma", "generate"], { mutating: true }), "generate");

    // Re-validate
    const after = await introspect(prisma);
    const missing = REQUIRED_EMPRESA_COLUMNS.filter(
      (c) => !after.empresaCols.includes(c),
    );
    console.log("\n--- Validação Empresa ---");
    console.log("Colunas:", after.empresaCols.join(", "));
    if (missing.length) {
      console.error("FALTANDO:", missing.join(", "));
      process.exit(1);
    }
    console.log("OK: ativo, nomeFantasia e demais colunas presentes.");

    const afterApplied = await appliedSet(prisma);
    const stillPending = ALL_MIGRATIONS.filter((m) => !afterApplied.has(m));
    if (stillPending.length && !DRY_RUN) {
      console.error("Migrations ainda não registradas:", stillPending);
      process.exit(1);
    }
    console.log(`OK: ${afterApplied.size}/${ALL_MIGRATIONS.length} migrations registradas.`);

    if (!DRY_RUN) {
      console.log("\n--- Drift check ---");
      const drift = run("node", ["scripts/check-db-drift.mjs"]);
      if ((drift.status ?? 1) !== 0) {
        console.warn(
          "AVISO: drift detectado. Se só houver diferenças cosméticas, revise manualmente. " +
            "NÃO use db push.",
        );
      }

      console.log("\n--- Audit empresa ---");
      assertOk(run("node", ["scripts/audit-empresa-columns.mjs"]), "audit");

      if (!SKIP_SMOKE) {
        console.log("\n--- Smoke login ---");
        const smoke = run("node", ["scripts/smoke-login.mjs"]);
        if ((smoke.status ?? 1) !== 0) {
          console.warn(
            "Smoke login falhou (API pode estar offline). Schema OK; suba o Nest e reteste.",
          );
        }
      }

      if (!SKIP_PM2 && process.platform !== "win32") {
        const pm2 = spawnSync("pm2", ["--version"], { encoding: "utf8" });
        if ((pm2.status ?? 1) === 0) {
          console.log("\n--- PM2 reload ---");
          run("pm2", ["startOrReload", "ecosystem.config.cjs", "--env", "production"], {
            mutating: true,
            inherit: true,
          });
          run("pm2", ["status"], { inherit: true });
        } else {
          console.log("PM2 não encontrado — pule ou instale no servidor.");
        }
      }
    }

    console.log("\n=== REPAIR COMPLETE ===");
    console.log("Nenhum db push. Nenhum DROP de dados. Baseline alinhado ao Prisma Migrate.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("\nFATAL:", err.message || err);
  process.exit(1);
});
