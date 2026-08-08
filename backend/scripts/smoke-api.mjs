/**
 * Smoke test of main authenticated + public APIs.
 * Env: API_URL, SMOKE_EMAIL, SMOKE_SENHA
 */
const API = (process.env.API_URL || "http://127.0.0.1:3000/api").replace(
  /\/+$/,
  "",
);
const EMAIL = process.env.SMOKE_EMAIL || "admin@topconceicao.com.br";
const SENHA = process.env.SMOKE_SENHA || "Admin@123";

async function req(method, path, { token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  console.log("SMOKE API against", API);

  const health = await req("GET", "/health");
  assert(health.status === 200 && health.data?.ok, `health ${health.status}`);

  const login = await req("POST", "/auth/login", {
    body: { email: EMAIL, senha: SENHA },
  });
  assert(login.status === 200 && login.data?.access_token, `login ${login.status}`);
  const token = login.data.access_token;

  const routes = [
    "/auth/me",
    "/dashboard",
    "/properties",
    "/proprietarios",
    "/leads",
    "/pipeline/stages",
    "/clientes",
    "/agenda",
    "/empresa",
    "/public/empresa",
    "/public/imoveis?limit=3",
  ];

  for (const path of routes) {
    const auth = path.startsWith("/public") ? undefined : token;
    const r = await req("GET", path, { token: auth });
    assert(r.status === 200, `GET ${path} => ${r.status}`);
    console.log("OK", path);
  }

  const lead = await req("POST", "/public/leads", {
    body: {
      nome: `Smoke API ${Date.now()}`,
      telefone: "11970009999",
      mensagem: "smoke-api",
      tipoFormulario: "CONTATO",
      origem: "SITE",
      lgpdAceite: true,
    },
  });
  assert(
    lead.status === 200 || lead.status === 201,
    `public leads => ${lead.status}`,
  );
  console.log("OK POST /public/leads", lead.data?.protocolo || lead.data?.leadId);

  console.log("SMOKE API OK");
}

main().catch((e) => {
  console.error("SMOKE API FAILED:", e.message);
  process.exit(1);
});
