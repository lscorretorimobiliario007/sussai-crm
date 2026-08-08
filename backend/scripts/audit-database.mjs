/**
 * Full database audits required before production deploy.
 */
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function runNode(script) {
  console.log(`\n---- ${script} ----`);
  const r = spawnSync(process.execPath, [script], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  if (r.status !== 0) {
    console.error(`DB AUDIT FAIL: ${script}`);
    process.exit(r.status || 1);
  }
}

async function assertCoreTables() {
  const prisma = new PrismaClient();
  try {
    const required = [
      "Empresa",
      "Usuario",
      "properties",
      "property_images",
      "property_owners",
      "leads",
      "pipeline_stages",
    ];
    const rows = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
    `;
    const names = new Set(rows.map((r) => r.table_name));
    const missing = required.filter((t) => !names.has(t));
    if (missing.length) {
      console.error("DB AUDIT FAIL — missing tables:", missing.join(", "));
      process.exit(1);
    }
    console.log("OK core tables present");

    const unfinished = await prisma.$queryRaw`
      SELECT migration_name
      FROM "_prisma_migrations"
      WHERE finished_at IS NULL
    `;
    if (unfinished.length) {
      console.error(
        "DB AUDIT FAIL — unfinished migrations:",
        unfinished.map((r) => r.migration_name).join(", "),
      );
      process.exit(1);
    }
    console.log("OK no unfinished migrations");
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  runNode("scripts/audit-empresa-columns.mjs");
  runNode("scripts/rc-preflight.mjs");
  runNode("scripts/check-db-drift.mjs");
  await assertCoreTables();
  console.log("\nDB AUDITS OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
