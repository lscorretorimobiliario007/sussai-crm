/**
 * Pre-deploy / post-deploy smoke: login MUST return 200 or exit 1 (cancel deploy).
 * Usage: node scripts/smoke-login.mjs
 * Env: API_URL, SMOKE_EMAIL, SMOKE_SENHA
 */
const API = (process.env.API_URL || "http://127.0.0.1:3000/api").replace(
  /\/+$/,
  "",
);
const EMAIL = process.env.SMOKE_EMAIL || "admin@topconceicao.com.br";
const SENHA = process.env.SMOKE_SENHA || "Admin@123";

async function main() {
  const loginRes = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, senha: SENHA }),
  });
  const loginBody = await loginRes.json().catch(() => ({}));

  if (loginRes.status !== 200 || !loginBody.access_token) {
    console.error("SMOKE LOGIN FAILED", loginRes.status, loginBody);
    process.exit(1);
  }

  const meRes = await fetch(`${API}/auth/me`, {
    headers: { Authorization: `Bearer ${loginBody.access_token}` },
  });
  if (meRes.status !== 200) {
    console.error("SMOKE /auth/me FAILED", meRes.status);
    process.exit(1);
  }

  const refreshRes = await fetch(`${API}/auth/refresh`, {
    method: "POST",
    headers: { Authorization: `Bearer ${loginBody.access_token}` },
  });
  if (refreshRes.status !== 200) {
    console.error("SMOKE /auth/refresh FAILED", refreshRes.status);
    process.exit(1);
  }

  console.log("SMOKE LOGIN OK", EMAIL, "perfil=", loginBody.usuario?.perfil);
  process.exit(0);
}

main().catch((error) => {
  console.error("SMOKE LOGIN ERROR", error.message);
  process.exit(1);
});
