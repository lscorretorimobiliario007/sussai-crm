/**
 * Validate no schema drift between live DB and prisma/schema.prisma.
 * Exit 0 = no drift. Exit 2 from prisma = drift (we map to 1).
 * NEVER uses db push.
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnvFile() {
  const envPath = path.join(root, ".env");
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

function main() {
  loadEnvFile();
  if (!process.env.DATABASE_URL) {
    console.error("DRIFT CHECK FAIL: DATABASE_URL missing");
    process.exit(1);
  }

  const result = spawnSync(
    "npx",
    [
      "prisma",
      "migrate",
      "diff",
      "--from-url",
      process.env.DATABASE_URL,
      "--to-schema-datamodel",
      "prisma/schema.prisma",
      "--exit-code",
    ],
    {
      cwd: root,
      encoding: "utf8",
      shell: process.platform === "win32",
      env: process.env,
    },
  );

  const code = result.status ?? 1;
  const out = `${result.stdout || ""}${result.stderr || ""}`.trim();

  if (code === 0) {
    console.log("DRIFT CHECK OK — database matches schema.prisma");
    process.exit(0);
  }

  if (code === 2) {
    console.error("DRIFT CHECK FAIL — database differs from schema.prisma");
    if (out) console.error(out);
    console.error("Run: npx prisma migrate status && npx prisma migrate deploy");
    process.exit(1);
  }

  console.error("DRIFT CHECK ERROR", code, out);
  process.exit(1);
}

main();
