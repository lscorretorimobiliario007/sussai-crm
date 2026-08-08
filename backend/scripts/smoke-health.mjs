/**
 * Smoke healthcheck — GET /api/health must be 200.
 * Env: API_URL
 */
const API = (process.env.API_URL || "http://127.0.0.1:3000/api").replace(
  /\/+$/,
  "",
);

async function main() {
  const res = await fetch(`${API}/health`, {
    signal: AbortSignal.timeout(15000),
  });
  const body = await res.json().catch(() => ({}));
  if (res.status !== 200 || !body.ok) {
    console.error("HEALTHCHECK FAIL", res.status, body);
    process.exit(1);
  }
  console.log("HEALTHCHECK OK", body.status || "healthy");
}

main().catch((e) => {
  console.error("HEALTHCHECK ERROR", e.message);
  process.exit(1);
});
