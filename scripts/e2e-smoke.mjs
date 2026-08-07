const routes = [
  "/",
  "/imoveis",
  "/proprietarios",
  "/clientes",
  "/leads",
  "/agenda",
  "/tarefas",
  "/contratos",
  "/documentos",
  "/relatorios",
  "/financeiro",
  "/corretores",
  "/configuracoes",
  "/notificacoes",
  "/perfil",
  "/pesquisa?q=top",
  "/admin",
  "/auditoria",
  "/integracoes",
  "/backup",
  "/logs",
];

async function login() {
  const res = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@topconceicao.com.br",
      senha: "Admin@123",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data.access_token;
}

async function check(route, token) {
  const pageErrors = [];
  const page = await fetch(`http://localhost:5173${route}`, {
    headers: { Accept: "text/html" },
  });
  const htmlOk = page.status === 200;

  const apiGuess = {
    "/": "/api/dashboard",
    "/imoveis": "/api/properties?limit=5",
    "/proprietarios": "/api/proprietarios?limit=5",
    "/clientes": "/api/clientes?limit=5",
    "/leads": "/api/leads?limit=5",
    "/agenda": "/api/agenda",
    "/tarefas": "/api/tarefas",
    "/contratos": "/api/contratos",
    "/documentos": "/api/documentos",
    "/relatorios": "/api/dashboard",
    "/financeiro": "/api/financeiro/dashboard",
    "/corretores": "/api/corretores",
    "/configuracoes": "/api/empresa",
    "/notificacoes": "/api/notificacoes",
    "/perfil": "/api/auth/me",
    "/pesquisa?q=top": "/api/search?q=top",
    "/admin": "/api/admin/dashboard",
    "/auditoria": "/api/auditoria",
    "/integracoes": "/api/integracoes",
    "/backup": "/api/backup",
    "/logs": "/api/logs",
  };

  const apiPath = apiGuess[route];
  let apiStatus = null;
  let apiError = null;
  if (apiPath) {
    try {
      const apiRes = await fetch(`http://localhost:3000${apiPath}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      apiStatus = apiRes.status;
      if (!apiRes.ok) {
        apiError = (await apiRes.text()).slice(0, 180);
      }
    } catch (error) {
      apiStatus = "ERR";
      apiError = error.message;
    }
  }

  return {
    route,
    htmlOk,
    apiStatus,
    apiError,
    pageErrors,
  };
}

const token = await login();
const results = [];
for (const route of routes) {
  results.push(await check(route, token));
}

const failed = results.filter((item) => !item.htmlOk || (item.apiStatus && item.apiStatus !== 200));
console.log(JSON.stringify({ total: results.length, failed: failed.length, results }, null, 2));
process.exit(failed.length ? 1 : 0);
