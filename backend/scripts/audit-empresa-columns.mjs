/**
 * Audit Empresa columns vs schema requirements.
 * Usage on VPS:
 *   cd backend && node scripts/audit-empresa-columns.mjs
 * Uses DATABASE_URL from env / .env
 */
import { PrismaClient } from "@prisma/client";

const REQUIRED = [
  "nomeFantasia",
  "ativo",
  "plano",
  "razaoSocial",
  "logoUrl",
  "faviconUrl",
  "siteUrl",
  "creci",
  "slogan",
  "corPrimaria",
  "corSecundaria",
  "endereco",
  "numero",
  "complemento",
  "bairro",
  "cidade",
  "estado",
  "cep",
  "whatsapp",
  "instagram",
  "facebook",
  "linkedin",
  "youtube",
  "horarioAtendimento",
  "googleMapsUrl",
  "latitude",
  "longitude",
  "siteTitulo",
  "siteDescricao",
  "seoKeywords",
  "siteAtivo",
  "siteExibirCorretores",
  "siteExibirBlog",
];

const prisma = new PrismaClient();

function maskUrl(url) {
  try {
    const u = new URL(url);
    if (u.password) u.password = "***";
    return u.toString();
  } catch {
    return "(invalid DATABASE_URL)";
  }
}

async function main() {
  const raw = process.env.DATABASE_URL || "";
  console.log("DATABASE_URL:", maskUrl(raw));
  console.log("HOST:", (() => {
    try { return new URL(raw).hostname; } catch { return "?"; }
  })());

  const cols = await prisma.$queryRaw`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Empresa'
    ORDER BY ordinal_position
  `;

  const names = cols.map((c) => c.column_name);
  console.log("Empresa columns:", names.join(", "));

  const missing = REQUIRED.filter((c) => !names.includes(c));
  if (missing.length) {
    console.error("MISSING:", missing.join(", "));
    process.exitCode = 1;
  } else {
    console.log("OK: all required Empresa columns present");
  }

  const applied = await prisma.$queryRaw`
    SELECT migration_name, finished_at
    FROM "_prisma_migrations"
    WHERE migration_name LIKE '%empresa%' OR migration_name LIKE '%crm_full%' OR migration_name LIKE '%ensure_empresa%'
    ORDER BY finished_at NULLS LAST
  `;
  console.log("Related migrations:", applied);

  const isLocal = /localhost|127\.0\.0\.1/.test(raw);
  console.log(isLocal ? "NOTE: this is LOCAL database, not VPS" : "NOTE: this looks like a REMOTE database");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
