#!/usr/bin/env node
/**
 * Browser console + white-screen audit for CRM + Site.
 * Exit 1 if any page has console errors, page errors, failed XHR 5xx, or empty root.
 */
import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const SITE = (process.env.SITE_URL || "http://127.0.0.1:3001").replace(/\/+$/, "");
const CRM = (process.env.CRM_URL || "http://127.0.0.1:5173").replace(/\/+$/, "");
const API = (process.env.API_URL || "http://127.0.0.1:3000/api").replace(/\/+$/, "");
const EMAIL = process.env.SMOKE_EMAIL || "admin@topconceicao.com.br";
const SENHA = process.env.SMOKE_SENHA || "Admin@123";

const chromeCandidates = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);
const chrome = chromeCandidates.find((p) => fs.existsSync(p));
if (!chrome) {
  console.error("Chrome/Edge not found");
  process.exit(1);
}

const siteRoot = path.resolve("C:/projetos/top-conceicao-site-novo");
const puppeteer = require(path.join(siteRoot, "node_modules/puppeteer-core"));

const CRM_ROUTES = [
  "/",
  "/imoveis",
  "/imoveis/novo",
  "/proprietarios",
  "/clientes",
  "/leads",
  "/agenda",
  "/configuracoes",
  "/corretores",
  "/financeiro",
  "/contratos",
  "/tarefas",
];

const SITE_ROUTES = [
  "/",
  "/comprar",
  "/contato",
  "/anuncie-seu-imovel",
  "/avalie-seu-imovel",
  "/busca",
  "/sitemap.xml",
];

function isIgnorableConsole(text) {
  const t = String(text || "");
  // Non-critical noise that does not break UX
  if (/Download the React DevTools/i.test(t)) return true;
  if (/\[vite\]/i.test(t) && /hmr/i.test(t)) return true;
  if (/favicon\.ico.*404/i.test(t)) return true;
  if (/Clarity.*not configured|CLARITY/i.test(t) && /skip|disabled|missing/i.test(t))
    return true;
  return false;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function auditPage(page, label, url, { expectXml = false } = {}) {
  const consoleErrors = [];
  const pageErrors = [];
  const failed5xx = [];

  const onConsole = (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (!isIgnorableConsole(text)) consoleErrors.push(text);
    }
  };
  const onPageError = (err) => pageErrors.push(String(err?.message || err));
  const onResponse = (res) => {
    const status = res.status();
    const reqUrl = res.url();
    if (status >= 500) failed5xx.push(`${status} ${reqUrl}`);
  };

  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("response", onResponse);

  try {
    const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await sleep(1500);

    let white = false;
    let bodyText = "";
    if (!expectXml) {
      const probe = await page.evaluate(() => {
        const root =
          document.querySelector("#root") ||
          document.querySelector("main") ||
          document.body;
        const text = (root?.innerText || "").replace(/\s+/g, " ").trim();
        const html = (root?.innerHTML || "").trim();
        const kids = root ? root.children.length : 0;
        return {
          text: text.slice(0, 200),
          htmlLen: html.length,
          kids,
          title: document.title,
        };
      });
      bodyText = probe.text;
      white =
        (!probe.text || probe.text.length < 3) &&
        probe.htmlLen < 40 &&
        probe.kids === 0;
    }

    const httpStatus = res?.status() || 0;
    const ok =
      httpStatus < 400 &&
      !white &&
      consoleErrors.length === 0 &&
      pageErrors.length === 0 &&
      failed5xx.length === 0;

    return {
      label,
      url,
      ok,
      httpStatus,
      white,
      bodyText,
      consoleErrors,
      pageErrors,
      failed5xx,
    };
  } finally {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
    page.off("response", onResponse);
  }
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const results = [];

  // --- CRM login via UI ---
  {
    const loginAudit = await auditPage(page, "CRM /login", `${CRM}/login`);
    results.push(loginAudit);

    // Perform login
    await page.goto(`${CRM}/login`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForSelector('input[type="email"], input[name="email"]', {
      timeout: 20000,
    });
    await sleep(500);
    const emailSel = (await page.$('input[name="email"]'))
      ? 'input[name="email"]'
      : 'input[type="email"]';
    const passSel = (await page.$('input[name="senha"]'))
      ? 'input[name="senha"]'
      : 'input[type="password"]';
    await page.click(emailSel, { clickCount: 3 });
    await page.type(emailSel, EMAIL, { delay: 10 });
    await page.click(passSel, { clickCount: 3 });
    await page.type(passSel, SENHA, { delay: 10 });

    const consoleErrors = [];
    const pageErrors = [];
    const failed5xx = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && !isIgnorableConsole(msg.text()))
        consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => pageErrors.push(String(err?.message || err)));
    page.on("response", (res) => {
      if (res.status() >= 500) failed5xx.push(`${res.status()} ${res.url()}`);
    });

    await Promise.all([
      page.click('button[type="submit"]'),
      page
        .waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 })
        .catch(() => null),
    ]);
    await sleep(2000);

    const url = page.url();
    const loggedIn = !url.includes("/login");
    const probe = await page.evaluate(() => {
      const root = document.querySelector("#root") || document.body;
      const text = (root?.innerText || "").replace(/\s+/g, " ").trim();
      return { text: text.slice(0, 240), kids: root?.children?.length || 0 };
    });
    const white = (!probe.text || probe.text.length < 3) && probe.kids === 0;
    results.push({
      label: "CRM login submit",
      url,
      ok:
        loggedIn &&
        !white &&
        consoleErrors.length === 0 &&
        pageErrors.length === 0 &&
        failed5xx.length === 0,
      httpStatus: 200,
      white,
      bodyText: probe.text,
      consoleErrors,
      pageErrors,
      failed5xx,
      loggedIn,
    });
  }

  // Seed token also via API into localStorage if UI login failed path still on login
  if (String(results.at(-1)?.url || "").includes("/login")) {
    const loginRes = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: EMAIL, senha: SENHA }),
    });
    const data = await loginRes.json();
    const token = data.access_token || data.token;
    if (!token) throw new Error("API login failed for browser audit");
    await page.goto(CRM, { waitUntil: "domcontentloaded" });
    await page.evaluate(
      (payload) => {
        localStorage.setItem("token", payload.token);
        localStorage.setItem("usuario", JSON.stringify(payload.usuario));
      },
      { token, usuario: data.usuario },
    );
  }

  for (const route of CRM_ROUTES) {
    results.push(await auditPage(page, `CRM ${route}`, `${CRM}${route}`));
  }

  for (const route of SITE_ROUTES) {
    results.push(
      await auditPage(page, `SITE ${route}`, `${SITE}${route}`, {
        expectXml: route.endsWith(".xml"),
      }),
    );
  }

  // Mobile spot check CRM dashboard
  await page.setViewport({ width: 375, height: 812 });
  results.push(await auditPage(page, "CRM /@375", `${CRM}/`));
  await page.setViewport({ width: 375, height: 812 });
  results.push(await auditPage(page, "SITE /@375", `${SITE}/`));

  await browser.close();

  let failed = 0;
  for (const r of results) {
    if (r.ok) {
      console.log(`✓ ${r.label} (${r.httpStatus})`);
    } else {
      failed += 1;
      console.error(`✗ ${r.label}`);
      console.error(`  url=${r.url} status=${r.httpStatus} white=${r.white}`);
      if (r.consoleErrors?.length)
        console.error(`  console: ${r.consoleErrors.join(" | ").slice(0, 500)}`);
      if (r.pageErrors?.length)
        console.error(`  pageerror: ${r.pageErrors.join(" | ").slice(0, 500)}`);
      if (r.failed5xx?.length)
        console.error(`  5xx: ${r.failed5xx.join(" | ").slice(0, 500)}`);
      if (r.bodyText) console.error(`  body: ${r.bodyText.slice(0, 160)}`);
    }
  }

  console.log(`\nBROWSER AUDIT ${results.length - failed}/${results.length}`);
  if (failed) process.exit(1);
  console.log("BROWSER AUDIT PASSED");
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
