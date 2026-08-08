/**
 * Smoke test for public site pages.
 * Env: SITE_URL (default http://127.0.0.1:3001)
 */
const SITE = (process.env.SITE_URL || "http://127.0.0.1:3001").replace(
  /\/+$/,
  "",
);

const PAGES = [
  "/",
  "/comprar",
  "/alugar",
  "/contato",
  "/anuncie-seu-imovel",
  "/avalie-seu-imovel",
  "/busca",
  "/robots.txt",
  "/sitemap.xml",
];

async function main() {
  console.log("SMOKE SITE against", SITE);
  let failures = 0;

  for (const page of PAGES) {
    try {
      const res = await fetch(`${SITE}${page}`, {
        redirect: "follow",
        signal: AbortSignal.timeout(20000),
      });
      if (res.status < 200 || res.status >= 400) {
        console.error("FAIL", page, res.status);
        failures += 1;
      } else {
        console.log("OK", page, res.status);
      }
    } catch (error) {
      console.error("FAIL", page, error.message);
      failures += 1;
    }
  }

  if (failures) {
    console.error(`SMOKE SITE FAILED (${failures} pages)`);
    process.exit(1);
  }
  console.log("SMOKE SITE OK");
}

main().catch((e) => {
  console.error("SMOKE SITE ERROR", e.message);
  process.exit(1);
});
