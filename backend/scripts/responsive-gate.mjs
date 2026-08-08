#!/usr/bin/env node
/**
 * Responsive overflow gate — uses puppeteer-core + system Chrome/Edge.
 * Widths: 320..1920 (Release 1.0 checklist).
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = (process.env.SITE_URL || "http://127.0.0.1:3001").replace(/\/+$/, "");
const WIDTHS = [320, 360, 375, 390, 412, 430, 480, 576, 768, 820, 1024, 1280, 1440, 1920];
const PAGES = ["/", "/comprar", "/contato", "/anuncie-seu-imovel", "/busca", "/avalie-seu-imovel"];

const chromeCandidates = [
  process.env.CHROME_PATH,
  "C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe",
  "C:\\\\Program Files (x86)\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe",
  "C:\\\\Program Files\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe",
  "C:\\\\Program Files (x86)\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
  "/snap/bin/chromium",
].filter(Boolean);

const chrome = chromeCandidates.find((p) => fs.existsSync(p));
if (!chrome) {
  console.error("RESPONSIVE FAIL: Chrome/Edge not found. Set CHROME_PATH.");
  process.exit(1);
}

const siteRoot = path.resolve(__dirname, "../../../top-conceicao-site-novo");
const runnerPath = path.join(siteRoot, "_responsive-puppeteer.cjs");
const runner = `
const puppeteer = require("puppeteer-core");
const executablePath = process.env.CHROME_PATH;
const SITE = process.env.SITE_URL || "http://127.0.0.1:3001";
const WIDTHS = ${JSON.stringify(WIDTHS)};
const PAGES = ${JSON.stringify(PAGES)};
(async () => {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"],
  });
  const failures = [];
  for (const w of WIDTHS) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: 900, deviceScaleFactor: 1 });
    for (const p of PAGES) {
      await page.goto(SITE + p, { waitUntil: "networkidle2", timeout: 60000 });
      const metrics = await page.evaluate(() => {
        const doc = document.documentElement;
        const body = document.body;
        const sw = Math.max(doc.scrollWidth, body.scrollWidth);
        const cw = doc.clientWidth;
        const overflowX = sw > cw + 1;
        const offenders = [];
        if (overflowX) {
          for (const el of Array.from(document.querySelectorAll("body *"))) {
            const r = el.getBoundingClientRect();
            if (r.width > cw + 2 || r.right > cw + 2) {
              const tag = el.tagName.toLowerCase();
              const cls = typeof el.className === "string" ? el.className.slice(0, 50) : "";
              offenders.push(tag + (cls ? "." + cls.split(/\\\\s+/).slice(0, 2).join(".") : "") + ":" + Math.round(r.width));
              if (offenders.length >= 6) break;
            }
          }
        }
        return { sw, cw, overflowX, offenders };
      });
      const label = w + " " + p;
      if (metrics.overflowX) {
        failures.push({ label, ...metrics });
        console.log("FAIL", label, "sw", metrics.sw, "cw", metrics.cw, metrics.offenders.join(" | "));
      } else {
        console.log("OK", label);
      }
    }
    await page.close();
  }
  await browser.close();
  if (failures.length) {
    console.error("RESPONSIVE FAILURES", failures.length);
    process.exit(1);
  }
  console.log("RESPONSIVE OK", WIDTHS.length, "widths x", PAGES.length, "pages");
})().catch((e) => { console.error(e); process.exit(1); });
`;

fs.writeFileSync(runnerPath, runner);
if (!fs.existsSync(path.join(siteRoot, "node_modules", "puppeteer-core"))) {
  const inst = spawnSync("npm", ["install", "-D", "puppeteer-core", "--no-fund"], {
    cwd: siteRoot,
    stdio: "inherit",
    shell: true,
  });
  if ((inst.status ?? 1) !== 0) process.exit(1);
}

const run = spawnSync(process.execPath, [runnerPath], {
  cwd: siteRoot,
  env: { ...process.env, CHROME_PATH: chrome, SITE_URL: SITE },
  encoding: "utf8",
  shell: false,
});
process.stdout.write(run.stdout || "");
process.stderr.write(run.stderr || "");
try {
  fs.unlinkSync(runnerPath);
} catch {
  /* ignore */
}
process.exit(run.status ?? 1);
