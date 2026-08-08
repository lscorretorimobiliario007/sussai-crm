/**
 * Diagnose Empresa column gap vs _prisma_migrations.
 * Then apply pending migrations with migrate deploy only (never db push).
 */
import { spawnSync } from "child_process";
import { PrismaClient } from "@prisma/client";

const CRITICAL = ["nomeFantasia", "ativo"];
const RELATED = [
  "20260716210000_empresa_implantacao",
  "20260717031941_create_empresa",
  "20260807013943_crm_full_modules",
  "20260807020000_empresa_branding_fields",
  "20260808010000_ensure_empresa_schema_columns",
];

const prisma = new PrismaClient();

function run(cmd, args) {
  console.log(`\n$ ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });
  if ((r.status ?? 1) !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(" ")}`);
  }
}

function maskUrl(url) {
  try {
    const u = new URL(url);
    if (u.password) u.password = "***";
    return u.toString();
  } catch {
    return "(invalid)";
  }
}

async function main() {
  const url = process.env.DATABASE_URL || "";
  console.log("DATABASE_URL:", maskUrl(url));
  try {
    console.log("HOST:", new URL(url).hostname);
  } catch {
    console.log("HOST: ?");
  }

  const cols = await prisma.$queryRaw`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Empresa'
    ORDER BY ordinal_position
  `;
  const names = cols.map((c) => c.column_name);
  console.log("Empresa columns:", names.join(", ") || "(none)");

  const missing = CRITICAL.filter((c) => !names.includes(c));
  console.log(
    missing.length
      ? `MISSING CRITICAL: ${missing.join(", ")}`
      : "CRITICAL OK: nomeFantasia + ativo present",
  );

  const migrations = await prisma.$queryRaw`
    SELECT migration_name, finished_at, rolled_back_at
    FROM "_prisma_migrations"
    ORDER BY started_at
  `;
  const byName = new Map(migrations.map((m) => [m.migration_name, m]));

  console.log("\nRelated migration status:");
  for (const name of RELATED) {
    const row = byName.get(name);
    if (!row) console.log(`  - ${name}: NOT IN _prisma_migrations`);
    else if (!row.finished_at)
      console.log(`  - ${name}: STARTED BUT NOT FINISHED (broken)`);
    else if (row.rolled_back_at) console.log(`  - ${name}: ROLLED BACK`);
    else console.log(`  - ${name}: APPLIED ${row.finished_at.toISOString?.() || row.finished_at}`);
  }

  const unfinished = migrations.filter((m) => !m.finished_at);
  if (unfinished.length) {
    console.log(
      "\nCleaning unfinished migration rows:",
      unfinished.map((m) => m.migration_name).join(", "),
    );
    await prisma.$executeRaw`
      DELETE FROM "_prisma_migrations" WHERE finished_at IS NULL
    `;
  }

  await prisma.$disconnect();

  // Expected root cause explanation
  if (missing.length) {
    console.log(`
ROOT CAUSE:
  20260717031941_create_empresa recreated Empresa WITHOUT nomeFantasia/ativo.
  Those columns must come from 20260807013943_crm_full_modules
  and/or 20260808010000_ensure_empresa_schema_columns.
`);
  }

  run("npx", ["prisma", "migrate", "status"]);
  run("npx", ["prisma", "migrate", "deploy"]);
  run("npx", ["prisma", "generate"]);
  run(process.execPath, ["scripts/audit-empresa-columns.mjs"]);
  run(process.execPath, ["scripts/check-db-drift.mjs"]);

  console.log("\nSCHEMA SYNC COMPLETE (migrate deploy only)");
}

main().catch(async (e) => {
  console.error(e);
  try {
    await prisma.$disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
