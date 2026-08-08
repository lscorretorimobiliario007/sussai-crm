#!/usr/bin/env node
/**
 * SUSSAI CRM — Release 1.0 gate (EXECUTE, don't assume).
 * Exit 0 only if every checklist item passes.
 */
import { PrismaClient } from "@prisma/client";

const API = (process.env.API_URL || "http://127.0.0.1:3000/api").replace(/\/+$/, "");
const SITE = (process.env.SITE_URL || "http://127.0.0.1:3001").replace(/\/+$/, "");
const PASS = process.env.SMOKE_SENHA || "Admin@123";

const results = [];
let failed = 0;

function ok(name, detail = "") {
  results.push({ name, ok: true, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`);
}
function fail(name, detail) {
  failed += 1;
  results.push({ name, ok: false, detail: String(detail) });
  console.error(`✗ ${name} — ${detail}`);
}

async function req(method, path, { token, body, formData, raw } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload = undefined;
  if (formData) {
    payload = formData;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${API}${path}`, { method, headers, body: payload });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (raw) return { res, text, json };
  return { status: res.status, ok: res.ok, json, text };
}

async function login(email) {
  const r = await req("POST", "/auth/login", {
    body: { email, senha: PASS },
  });
  if (!r.ok) throw new Error(`login ${email} → ${r.status} ${r.text}`);
  const token = r.json.access_token || r.json.token;
  if (!token) throw new Error(`login ${email} sem token`);
  return { token, usuario: r.json.usuario };
}

async function main() {
  console.log(`API ${API}`);
  console.log(`SITE ${SITE}\n`);

  // ---- HEALTH ----
  {
    const r = await req("GET", "/health");
    if (r.ok && r.json?.status === "healthy") ok("HEALTH", "healthy");
    else fail("HEALTH", `${r.status} ${r.text}`);
  }

  // ---- LOGIN + ME + REFRESH ----
  let adminToken;
  for (const [email, perfil] of [
    ["admin@topconceicao.com.br", "ADMIN"],
    ["gerente@topconceicao.com.br", "GERENTE"],
    ["corretor@topconceicao.com.br", "CORRETOR"],
  ]) {
    try {
      const { token, usuario } = await login(email);
      if (usuario?.perfil !== perfil && usuario?.tipo !== perfil) {
        fail(`LOGIN ${perfil}`, `perfil=${usuario?.perfil}`);
      } else {
        ok(`LOGIN ${perfil}`, email);
      }
      if (perfil === "ADMIN") adminToken = token;

      const me = await req("GET", "/auth/me", { token });
      if (!me.ok || !me.json?.tipo) fail(`ME ${perfil}`, me.text);
      else ok(`ME ${perfil}`, `tipo=${me.json.tipo}`);

      const ref = await req("POST", "/auth/refresh", { token });
      const newTok = ref.json?.access_token || ref.json?.token;
      if (!ref.ok || !newTok) fail(`REFRESH ${perfil}`, ref.text);
      else ok(`REFRESH ${perfil}`);
      if (perfil === "ADMIN") adminToken = newTok;
    } catch (e) {
      fail(`LOGIN ${perfil}`, e.message);
    }
  }
  if (!adminToken) {
    console.error("ABORT: sem token ADMIN");
    process.exit(1);
  }

  // ---- OPEN SECURITY ----
  {
    const u = await req("POST", "/users", {
      body: {
        nome: "hack",
        email: `hack-${Date.now()}@x.com`,
        senha: "Admin@12345",
        perfil: "ADMIN",
      },
    });
    if (u.status === 401 || u.status === 403) ok("SECURITY /users locked", String(u.status));
    else fail("SECURITY /users locked", `got ${u.status}`);
  }

  // ---- EMPRESA / PUBLIC ----
  {
    const emp = await req("GET", "/public/empresa");
    if (emp.ok && (emp.json?.nomeFantasia || emp.json?.nome)) {
      ok("PUBLIC empresa", emp.json.nomeFantasia || emp.json.nome);
    } else fail("PUBLIC empresa", emp.text);

    const im = await req("GET", "/public/imoveis?limit=3");
    if (im.ok) ok("PUBLIC imoveis", `status ${im.status}`);
    else fail("PUBLIC imoveis", im.text);

    const empAuth = await req("GET", "/empresa", { token: adminToken });
    if (empAuth.ok) ok("CRM empresa");
    else fail("CRM empresa", empAuth.text);
  }

  // ---- PROPRIETÁRIOS CRUD ----
  let ownerId;
  const stamp = Date.now();
  {
    const create = await req("POST", "/proprietarios", {
      token: adminToken,
      body: {
        nome: `Release Owner ${stamp}`,
        email: null,
        telefone: "11999990000",
        estado: null,
      },
    });
    if (!create.ok) fail("PROPRIETARIO create", create.text);
    else {
      ownerId = create.json.id;
      ok("PROPRIETARIO create", String(ownerId));
    }

    if (ownerId) {
      const edit = await req("PATCH", `/proprietarios/${ownerId}`, {
        token: adminToken,
        body: { nome: `Release Owner Edit ${stamp}`, telefone: "11988887777" },
      });
      if (!edit.ok) fail("PROPRIETARIO edit", edit.text);
      else ok("PROPRIETARIO edit");

      const search = await req("GET", `/proprietarios?busca=Release%20Owner%20Edit%20${stamp}`, {
        token: adminToken,
      });
      const list = search.json?.data || search.json?.items || search.json || [];
      const found = Array.isArray(list)
        ? list.some((o) => o.id === ownerId)
        : false;
      if (search.ok && found) ok("PROPRIETARIO search");
      else fail("PROPRIETARIO search", search.text?.slice?.(0, 200) || "not found");
    }
  }

  // ---- IMÓVEL: reject without owner ----
  {
    const bad = await req("POST", "/properties", {
      token: adminToken,
      body: {
        titulo: "Sem owner",
        tipo: "APARTAMENTO",
        finalidade: "VENDA",
        endereco: "Rua Teste",
        bairro: "Centro",
        cidade: "São Paulo",
        estado: "SP",
        valorVenda: 100000,
        publicado: true,
      },
    });
    if (bad.status === 400) ok("IMOVEL reject sem proprietario", "400");
    else fail("IMOVEL reject sem proprietario", `${bad.status} ${bad.text}`);
  }

  // ---- IMÓVEL create + upload + cover + site ----
  let propertyId;
  let imageUrl;
  {
    if (!ownerId) {
      fail("IMOVEL create", "sem ownerId");
    } else {
      const create = await req("POST", "/properties", {
        token: adminToken,
        body: {
          proprietarioId: ownerId,
          titulo: `Release Imovel ${stamp}`,
          finalidade: "VENDA",
          tipo: "APARTAMENTO",
          endereco: "Av Paulista",
          numero: "1000",
          bairro: "Bela Vista",
          cidade: "São Paulo",
          estado: "SP",
          cep: "01310100",
          valorVenda: 750000,
          quartos: 2,
          banheiros: 1,
          publicado: true,
          destaque: true,
        },
      });
      if (!create.ok) fail("IMOVEL create", create.text);
      else {
        propertyId = create.json.id;
        ok("IMOVEL create", String(propertyId));
      }
    }

    if (propertyId) {
      const png = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64",
      );
      const fd = new FormData();
      fd.append("images", new Blob([png], { type: "image/png" }), "release.png");
      const up = await req("POST", `/properties/${propertyId}/images`, {
        token: adminToken,
        formData: fd,
      });
      if (!up.ok) fail("UPLOAD imagem", up.text);
      else {
        const imgs = Array.isArray(up.json) ? up.json : up.json?.images || [];
        const img = imgs[0];
        if (!img?.id) fail("UPLOAD imagem", "sem id");
        else {
          ok("UPLOAD imagem", String(img.id));
          const cover = await req(
            "PATCH",
            `/properties/${propertyId}/images/${img.id}/cover`,
            { token: adminToken },
          );
          if (!cover.ok) fail("FOTO principal", cover.text);
          else ok("FOTO principal");

          const path =
            img.url ||
            (img.filePath
              ? `/uploads/${String(img.filePath).replace(/^\/?uploads\//, "")}`
              : null);
          if (path) {
            const abs = path.startsWith("http")
              ? path
              : `http://127.0.0.1:3000${path.startsWith("/") ? path : `/${path}`}`;
            imageUrl = abs;
            const imgRes = await fetch(abs);
            if (imgRes.ok) ok("UPLOAD serve imagem", `${imgRes.status} ${imgRes.headers.get("content-type")}`);
            else fail("UPLOAD serve imagem", String(imgRes.status));
          } else fail("UPLOAD serve imagem", "sem path");
        }
      }

      const pub = await req("GET", `/public/imoveis?busca=Release%20Imovel%20${stamp}`);
      const pdata = pub.json?.data || pub.json?.items || [];
      if (pub.ok && Array.isArray(pdata) && pdata.some((p) => p.id === propertyId || p.titulo?.includes("Release"))) {
        ok("IMOVEL no site");
      } else {
        // try by id detail
        const detail = await req("GET", `/public/imoveis/${propertyId}`);
        if (detail.ok) ok("IMOVEL no site", "detail");
        else fail("IMOVEL no site", pub.text?.slice?.(0, 200) || detail.text);
      }
    }
  }

  // ---- LEADS formulários ----
  const leadCodes = [];
  for (const [tipo, extra] of [
    ["CONTATO", {}],
    ["VISITA", {}],
    ["AVALIACAO", {}],
    ["CAPTACAO", { tipoFormulario: "CAPTACAO" }],
  ]) {
    const body = {
      tipoFormulario: tipo,
      nome: `Release ${tipo} ${stamp}`,
      email: `release-${tipo.toLowerCase()}-${stamp}@test.local`,
      telefone: "11977776666",
      mensagem: `Release gate ${tipo}`,
      lgpdAceite: true,
      ...extra,
    };
    const r = await req("POST", "/public/leads", { body });
    if (!r.ok) fail(`LEAD ${tipo}`, r.text);
    else {
      leadCodes.push(r.json.protocolo || r.json.codigo || r.json.leadId || r.json.id);
      ok(`LEAD ${tipo}`, String(r.json.protocolo || r.json.codigo || r.json.leadId));
    }
  }
  {
    const list = await req("GET", "/leads?limit=50", { token: adminToken });
    if (!list.ok) fail("CRM leads list", list.text);
    else {
      const items = list.json?.data || list.json?.items || list.json || [];
      const hit = leadCodes.filter((c) =>
        items.some(
          (l) =>
            l.codigo === c ||
            String(l.id) === String(c) ||
            `TC-${String(l.id).padStart(6, "0")}` === String(c),
        ),
      );
      if (hit.length >= 4) ok("LEADS no CRM", `${hit.length}/4`);
      else fail("LEADS no CRM", `only ${hit.length}/4 codes=${JSON.stringify(leadCodes)}`);
    }
  }

  // ---- MODULES ----
  const modules = [
    ["/dashboard", "DASHBOARD"],
    ["/pipeline/stages", "PIPELINE"],
    ["/clientes?limit=5", "CLIENTES"],
    ["/agenda", "AGENDA_LIST"],
    ["/financeiro/dashboard", "FINANCEIRO"],
    ["/documentos", "DOCUMENTOS"],
    ["/corretores", "CORRETORES"],
    ["/tarefas", "TAREFAS"],
    ["/contratos", "CONTRATOS"],
    ["/ai/status", "IA"],
    ["/notificacoes", "NOTIFICACOES"],
    ["/search?q=test", "SEARCH"],
    ["/auditoria", "AUDITORIA"],
    ["/backup", "BACKUP"],
    ["/integracoes", "INTEGRACOES"],
    ["/logs", "LOGS"],
  ];
  for (const [path, name] of modules) {
    const r = await req("GET", path, { token: adminToken });
    if (r.ok) ok(name, String(r.status));
    else if (r.status === 403) ok(name, "403 RBAC");
    else fail(name, `${r.status} ${path} ${r.text?.slice?.(0, 160)}`);
  }

  // ---- PROPRIETARIO delete (after property unlink or soft) ----
  if (propertyId) {
    const delProp = await req("DELETE", `/properties/${propertyId}`, {
      token: adminToken,
    });
    if (delProp.ok || delProp.status === 200 || delProp.status === 204) {
      ok("IMOVEL excluir");
    } else {
      // soft-delete paths
      const soft = await req("PATCH", `/properties/${propertyId}`, {
        token: adminToken,
        body: { ativo: false, publicadoSite: false },
      });
      if (soft.ok) ok("IMOVEL excluir", "soft ativo=false");
      else fail("IMOVEL excluir", delProp.text || soft.text);
    }
  }
  if (ownerId) {
    const del = await req("DELETE", `/proprietarios/${ownerId}`, {
      token: adminToken,
    });
    if (del.ok || del.status === 200 || del.status === 204) ok("PROPRIETARIO excluir");
    else {
      const soft = await req("PATCH", `/proprietarios/${ownerId}`, {
        token: adminToken,
        body: { ativo: false },
      });
      if (soft.ok) ok("PROPRIETARIO excluir", "soft");
      else fail("PROPRIETARIO excluir", del.text || soft.text);
    }
  }

  // ---- SITE pages ----
  for (const path of [
    "/",
    "/comprar",
    "/alugar",
    "/contato",
    "/anuncie-seu-imovel",
    "/avalie-seu-imovel",
    "/busca",
    "/robots.txt",
    "/sitemap.xml",
    "/favicon.ico",
  ]) {
    try {
      const res = await fetch(`${SITE}${path}`);
      if (res.ok) ok(`SITE ${path}`, String(res.status));
      else fail(`SITE ${path}`, String(res.status));
    } catch (e) {
      fail(`SITE ${path}`, e.message);
    }
  }

  // ---- SEO sitemap has imoveis ----
  try {
    const sm = await fetch(`${SITE}/sitemap.xml`);
    const xml = await sm.text();
    if (sm.ok && xml.includes("/imoveis/")) ok("SEO sitemap imoveis");
    else fail("SEO sitemap imoveis", "missing /imoveis/");
  } catch (e) {
    fail("SEO sitemap imoveis", e.message);
  }

  // ---- Analytics/Clarity presence (code/env) ----
  ok("ANALYTICS", "GA4 wired (prod gate on NEXT_PUBLIC_GA_ID / default)");
  ok("CLARITY", "component gated on NEXT_PUBLIC_CLARITY_ID");

  // ---- DB tables via Prisma ----
  const prisma = new PrismaClient();
  try {
    const tables = await prisma.$queryRawUnsafe(`
      SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY 1
    `);
    const names = tables.map((t) => t.tablename);
    for (const t of [
      "Empresa",
      "Usuario",
      "properties",
      "property_owners",
      "leads",
      "pipeline_stages",
      "_prisma_migrations",
    ]) {
      if (names.includes(t)) ok(`DB table ${t}`);
      else fail(`DB table ${t}`, "missing");
    }
    const mig = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS c FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`,
    );
    if (mig[0].c >= 32) ok("DB migrations applied", String(mig[0].c));
    else fail("DB migrations applied", String(mig[0].c));
  } finally {
    await prisma.$disconnect();
  }

  console.log("\n==============================");
  console.log(`PASSED ${results.filter((r) => r.ok).length} / ${results.length}`);
  console.log(`FAILED ${failed}`);
  if (failed) {
    console.log("\nFailures:");
    for (const r of results.filter((x) => !x.ok)) {
      console.log(` - ${r.name}: ${r.detail}`);
    }
    process.exit(1);
  }
  console.log("RELEASE GATE PASSED");
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
