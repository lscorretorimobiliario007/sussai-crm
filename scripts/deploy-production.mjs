#!/usr/bin/env node
/**
 * SUSSAI CRM — Production deploy gate (fail-fast, with automatic rollback).
 *
 * Usage (from repo root):
 *   npm run deploy:production
 *   node scripts/deploy-production.mjs
 *   ./deploy.sh
 *
 * Env:
 *   DEPLOY_BRANCH=main
 *   SKIP_GIT_PULL=1
 *   SKIP_SITE_SMOKE=1
 *   PM2_APP_NAME=sussai-api
 *   API_URL=http://127.0.0.1:3000/api
 *   SITE_URL=http://127.0.0.1:3001
 *   ALLOW_DIRTY_GIT=0
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BACKEND = path.join(ROOT, "backend");
const FRONTEND = path.join(ROOT, "frontend");

const BRANCH = process.env.DEPLOY_BRANCH || "main";
const PM2_APP = process.env.PM2_APP_NAME || "sussai-api";
const ALLOW_DIRTY = process.env.ALLOW_DIRTY_GIT === "1";
const SKIP_PULL = process.env.SKIP_GIT_PULL === "1";
const SKIP_SITE = process.env.SKIP_SITE_SMOKE === "1";
const STATE_DIR = path.join(ROOT, ".deploy");
const STATE_FILE = path.join(STATE_DIR, "last-successful-sha.txt");

let previousSha = null;
let pm2Restarted = false;
let failed = false;

function log(msg) {
  console.log(`\n==== ${msg} ====`);
}

function run(cmd, args, cwd = ROOT, opts = {}) {
  console.log(`$ ${cmd} ${args.join(" ")}`);
  const result = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
    ...opts,
  });
  if ((result.status ?? 1) !== 0) {
    throw new Error(`Command failed (${result.status}): ${cmd} ${args.join(" ")}`);
  }
}

function runCapture(cmd, args, cwd = ROOT) {
  const result = spawnSync(cmd, args, {
    cwd,
    encoding: "utf8",
    shell: process.platform === "win32",
    env: process.env,
  });
  if ((result.status ?? 1) !== 0) {
    throw new Error(
      `Command failed (${result.status}): ${cmd} ${args.join(" ")}\n${result.stderr || result.stdout}`,
    );
  }
  return (result.stdout || "").trim();
}

function prismaBin() {
  const cmd = process.platform === "win32" ? "prisma.cmd" : "prisma";
  return path.join(BACKEND, "node_modules", ".bin", cmd);
}

function runPrisma(args) {
  run(prismaBin(), args, BACKEND);
}

function savePreviousSha(sha) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, `${sha}\n`, "utf8");
}

function readLastSuccessfulSha() {
  try {
    return fs.readFileSync(STATE_FILE, "utf8").trim() || null;
  } catch {
    return null;
  }
}

async function rollback(reason) {
  console.error(`\n!!!!!!!! DEPLOY FAILED: ${reason}`);
  console.error("Starting automatic rollback...");

  if (!previousSha) {
    console.error("No previous SHA recorded — cannot rollback code.");
    process.exit(1);
  }

  try {
    run("git", ["reset", "--hard", previousSha], ROOT);
    run("npm", ["ci"], BACKEND);
    run("npm", ["ci"], FRONTEND);
    run("npx", ["prisma", "generate"], BACKEND);
    run("npm", ["run", "build"], BACKEND);
    run("npm", ["run", "build"], FRONTEND);

    if (hasPm2() && pm2Restarted) {
      run("pm2", ["restart", PM2_APP], ROOT);
      // brief wait
      spawnSync(process.platform === "win32" ? "timeout" : "sleep", [
        process.platform === "win32" ? "/t" : "3",
        process.platform === "win32" ? "3" : "",
      ].filter(Boolean), { shell: true, stdio: "ignore" });
      run(process.execPath, ["scripts/smoke-health.mjs"], BACKEND);
      run(process.execPath, ["scripts/smoke-login.mjs"], BACKEND);
    }

    console.error("ROLLBACK COMPLETE to", previousSha);
    console.error(
      "NOTE: Prisma migrations are forward-only. If migrate deploy already ran, DB stays on new schema; code rollback may still need a forward fix.",
    );
  } catch (error) {
    console.error("ROLLBACK FAILED:", error.message);
  }
  process.exit(1);
}

async function main() {
  process.chdir(ROOT);
  log("SUSSAI DEPLOY PRODUCTION");

  previousSha = runCapture("git", ["rev-parse", "HEAD"]);
  console.log("Current SHA:", previousSha);
  console.log("Last successful SHA:", readLastSuccessfulSha() || "(none)");

  // 1) Branch check
  log("Verify branch");
  const currentBranch = runCapture("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
  if (currentBranch !== BRANCH && currentBranch !== "HEAD") {
    throw new Error(`Deploy allowed only on '${BRANCH}' (current: ${currentBranch})`);
  }
  console.log("Branch OK:", currentBranch);

  if (!ALLOW_DIRTY) {
    const dirty = runCapture("git", ["status", "--porcelain"]);
    if (dirty) {
      throw new Error("Working tree dirty. Commit/stash or set ALLOW_DIRTY_GIT=1");
    }
  }

  // 2) git pull
  if (!SKIP_PULL) {
    log("git pull");
    run("git", ["pull", "--ff-only", "origin", BRANCH]);
  } else {
    console.log("SKIP_GIT_PULL=1 — skipping pull");
  }

  const targetSha = runCapture("git", ["rev-parse", "HEAD"]);
  console.log("Target SHA:", targetSha);

  // 3) npm install
  if (process.env.SKIP_INSTALL === "1") {
    console.log("SKIP_INSTALL=1 — skipping npm ci");
  } else {
    log("npm install (backend)");
    run("npm", ["ci"], BACKEND);
    log("npm install (frontend)");
    run("npm", ["ci"], FRONTEND);
  }

  // 4) prisma generate
  log("prisma generate");
  runPrisma(["generate"]);

  // 5) migrate status
  log("prisma migrate status");
  runPrisma(["migrate", "status"]);

  // 6) migrate deploy
  log("prisma migrate deploy");
  runPrisma(["migrate", "deploy"]);

  // 7) drift + DB audits
  log("Validate no drift + DB audits");
  run(process.execPath, ["scripts/audit-database.mjs"], BACKEND);

  // 8-9) builds
  log("build backend");
  run("npm", ["run", "build"], BACKEND);
  log("build frontend");
  run("npm", ["run", "build"], FRONTEND);

  // 10) tests
  log("npm test (backend)");
  run("npm", ["test"], BACKEND);

  // Pre-restart smokes (environment must be healthy before cutting over)
  log("Pre-restart smoke login / API / site");
  const allowOffline = process.env.ALLOW_OFFLINE_PRERESTART === "1";
  try {
    run(process.execPath, ["scripts/smoke-health.mjs"], BACKEND);
    run(process.execPath, ["scripts/smoke-login.mjs"], BACKEND);
    run(process.execPath, ["scripts/smoke-api.mjs"], BACKEND);
    if (!SKIP_SITE) {
      run(process.execPath, ["scripts/smoke-site.mjs"], BACKEND);
    }
  } catch (error) {
    if (allowOffline) {
      console.warn(
        "ALLOW_OFFLINE_PRERESTART=1 — continuing without pre-restart smoke:",
        error.message,
      );
    } else {
      throw new Error(
        `Pre-restart smoke failed (PM2 will NOT restart): ${error.message}. For first install set ALLOW_OFFLINE_PRERESTART=1`,
      );
    }
  }

  // 11) PM2 restart only after gates
  const skipPm2 = process.env.SKIP_PM2 === "1";
  if (!skipPm2) {
    if (!hasPm2()) {
      throw new Error("PM2 not found — cannot complete production restart");
    }

    log(`pm2 restart ${PM2_APP}`);
    run("pm2", ["restart", PM2_APP], ROOT);
    pm2Restarted = true;

    // wait for boot
    for (let i = 0; i < 30; i += 1) {
      const health = spawnSync(
        process.execPath,
        ["scripts/smoke-health.mjs"],
        { cwd: BACKEND, encoding: "utf8", env: process.env },
      );
      if ((health.status ?? 1) === 0) break;
      if (i === 29) {
        await rollback("healthcheck failed after pm2 restart");
      }
      spawnSync(
        process.platform === "win32" ? "timeout" : "sleep",
        process.platform === "win32" ? ["/t", "2"] : ["2"],
        { shell: true, stdio: "ignore" },
      );
    }
  } else {
    console.log("SKIP_PM2=1 — skipping PM2 restart (local/validation mode)");
  }

  log("Post-restart smoke login");
  try {
    run(process.execPath, ["scripts/smoke-health.mjs"], BACKEND);
    run(process.execPath, ["scripts/smoke-login.mjs"], BACKEND);
    run(process.execPath, ["scripts/smoke-api.mjs"], BACKEND);
    if (!SKIP_SITE) {
      run(process.execPath, ["scripts/smoke-site.mjs"], BACKEND);
    }
    log("Release gate (full checklist)");
    run(process.execPath, ["scripts/release-gate.mjs"], BACKEND);
  } catch (error) {
    if (pm2Restarted) {
      await rollback(error.message);
    } else {
      throw error;
    }
  }

  savePreviousSha(targetSha);
  log("DEPLOY SUCCESS");
  console.log("SHA:", targetSha);
  console.log("PM2 app:", skipPm2 ? "(skipped)" : PM2_APP);
}

main().catch(async (error) => {
  failed = true;
  if (pm2Restarted) {
    await rollback(error.message);
  } else {
    console.error("\nDEPLOY CANCELLED (PM2 was NOT restarted):", error.message);
    process.exit(1);
  }
});
