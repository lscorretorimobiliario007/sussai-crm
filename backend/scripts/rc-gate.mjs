/**
 * Release Candidate gate — build + lint + unit tests + preflight + e2e + smoke login.
 * Cancels (exit 1) if any step fails — never publish broken auth.
 *
 * Usage (from backend/): node scripts/rc-gate.mjs
 * Requires API already running OR starts nothing — caller must have server up for smoke/e2e.
 */
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function run(cmd, args, label) {
  console.log(`\n==== ${label} ====`);
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });
  if (result.status !== 0) {
    console.error(`RC GATE FAIL at: ${label}`);
    process.exit(result.status || 1);
  }
}

run("npm", ["run", "build"], "build");
run("npm", ["run", "lint"], "lint");
run("npm", ["test"], "unit tests");
run("node", ["scripts/rc-preflight.mjs"], "preflight DB/admin/JWT");
run("node", ["scripts/smoke-login.mjs"], "smoke login (cancel deploy if fail)");
run("node", ["scripts/e2e-stabilization.mjs"], "e2e stabilization");

console.log("\nRC GATE PASSED — safe to deploy");
