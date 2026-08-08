/**
 * E2E stabilization script — real API flows for SUSSAI CRM + Site leads.
 * Usage: node scripts/e2e-stabilization.mjs
 */
const API = process.env.API_URL || "http://127.0.0.1:3000/api";

async function req(method, path, { token, body, formData } = {}) {
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
  let data;
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
  const stamp = Date.now();
  console.log("API", API);

  const login = await req("POST", "/auth/login", {
    body: { email: "admin@topconceicao.com.br", senha: "Admin@123" },
  });
  assert(login.status === 200, `login failed ${login.status}`);
  const token = login.data.access_token;
  assert(token, "no access_token");
  console.log("OK login ADMIN");

  for (const [email, perfil] of [
    ["gerente@topconceicao.com.br", "GERENTE"],
    ["corretor@topconceicao.com.br", "CORRETOR"],
  ]) {
    const r = await req("POST", "/auth/login", {
      body: { email, senha: "Admin@123" },
    });
    if (r.status === 200) {
      console.log(`OK login ${perfil}`);
    } else {
      console.log(`WARN login ${perfil}: ${r.status} (seed may be needed)`);
    }
  }

  // Proprietário with empty optional fields (the previous 400 bug)
  const owner = await req("POST", "/proprietarios", {
    token,
    body: {
      nome: `Prop E2E ${stamp}`,
      email: "",
      estado: "",
      telefone: "11988887777",
      cidade: "São Paulo",
      bairro: "Moema",
    },
  });
  assert(owner.status === 201 || owner.status === 200, `owner create ${owner.status} ${JSON.stringify(owner.data)}`);
  const ownerId = owner.data.id;
  console.log("OK proprietario create", ownerId);

  const ownerPatch = await req("PUT", `/proprietarios/${ownerId}`, {
    token,
    body: { nome: `Prop E2E ${stamp} Edit`, email: null, estado: "SP" },
  });
  assert(ownerPatch.status === 200, `owner edit ${ownerPatch.status}`);
  console.log("OK proprietario edit");

  // Imóvel WITHOUT owner must fail
  const noOwner = await req("POST", "/properties", {
    token,
    body: {
      titulo: `Imovel sem dono ${stamp}`,
      finalidade: "VENDA",
      tipo: "APARTAMENTO",
      valorVenda: 500000,
      endereco: "Rua Teste",
      bairro: "Centro",
      cidade: "São Paulo",
      estado: "SP",
      publicado: true,
    },
  });
  assert(noOwner.status === 400, `expected 400 without owner, got ${noOwner.status}`);
  console.log("OK imovel rejects without proprietario");

  const prop = await req("POST", "/properties", {
    token,
    body: {
      proprietarioId: ownerId,
      titulo: `Imovel E2E ${stamp}`,
      finalidade: "VENDA",
      tipo: "APARTAMENTO",
      valorVenda: 750000,
      endereco: "Av Paulista",
      numero: "1000",
      bairro: "Bela Vista",
      cidade: "São Paulo",
      estado: "SP",
      cep: "01310100",
      quartos: 2,
      banheiros: 2,
      publicado: true,
      destaque: true,
    },
  });
  assert(prop.status === 201 || prop.status === 200, `property create ${prop.status} ${JSON.stringify(prop.data)}`);
  const propertyId = prop.data.id;
  assert(prop.data.proprietarioId === ownerId, "proprietarioId not linked");
  console.log("OK imovel create", propertyId);

  // Public photos
  const publicProps = await req("GET", "/public/imoveis?limit=10");
  assert(publicProps.status === 200, `public imoveis ${publicProps.status}`);
  const items = publicProps.data?.data || publicProps.data?.items || publicProps.data || [];
  const withCover = (Array.isArray(items) ? items : []).filter((i) => i.imagemCapa);
  console.log(`OK public imoveis ${items.length}, capas ${withCover.length}`);

  // Site leads
  const leads = [
    {
      name: "CONTATO",
      body: {
        nome: `Contato E2E ${stamp}`,
        telefone: "11970001111",
        mensagem: "Quero falar com corretor",
        tipoFormulario: "CONTATO",
        origem: "SITE",
        lgpdAceite: true,
      },
    },
    {
      name: "VISITA sem data",
      body: {
        nome: `Visita SemData ${stamp}`,
        telefone: "11970002222",
        mensagem: "Quero visitar sem marcar data",
        imovelId: propertyId,
        tipoFormulario: "VISITA",
        origem: "SITE",
        agendarVisita: false,
        lgpdAceite: true,
      },
      expectStatus: "NOVO",
      expectAgenda: false,
    },
    {
      name: "VISITA com data",
      body: {
        nome: `Visita ComData ${stamp}`,
        telefone: "11970003333",
        mensagem: "Visita marcada",
        imovelId: propertyId,
        tipoFormulario: "VISITA",
        origem: "SITE",
        agendarVisita: true,
        dataVisita: new Date(Date.now() + 86400000).toISOString(),
        lgpdAceite: true,
      },
      expectStatus: "VISITA_AGENDADA",
      expectAgenda: true,
    },
    {
      name: "AVALIACAO",
      body: {
        nome: `Avalie E2E ${stamp}`,
        telefone: "11970004444",
        mensagem: "Quero avaliar meu imóvel",
        tipoFormulario: "AVALIACAO",
        origem: "SITE",
        lgpdAceite: true,
      },
    },
    {
      name: "CAPTACAO",
      body: {
        nome: `Anuncie E2E ${stamp}`,
        telefone: "11970005555",
        mensagem: "Quero anunciar meu imóvel",
        tipoFormulario: "CAPTACAO",
        canal: "CAPTACAO",
        origem: "SITE",
        cidade: "São Paulo",
        bairro: "Pinheiros",
        tipoImovel: "APARTAMENTO",
        finalidade: "VENDA",
        lgpdAceite: true,
      },
    },
  ];

  const createdLeadIds = [];
  for (const lead of leads) {
    const r = await req("POST", "/public/leads", { body: lead.body });
    assert(r.status === 201 || r.status === 200, `${lead.name} lead ${r.status} ${JSON.stringify(r.data)}`);
    assert(r.data.protocolo || r.data.leadId, `${lead.name} missing protocolo`);
    createdLeadIds.push(r.data.leadId);
    console.log(`OK lead ${lead.name}`, r.data.protocolo, r.data.leadId, "agenda", r.data.agendaId ?? null);

    if (lead.expectStatus) {
      const detail = await req("GET", `/leads/${r.data.leadId}`, { token });
      assert(detail.status === 200, `lead detail ${detail.status}`);
      assert(
        detail.data.status === lead.expectStatus,
        `${lead.name} status ${detail.data.status} != ${lead.expectStatus}`,
      );
      if (lead.expectAgenda === false) {
        assert(!r.data.agendaId, `${lead.name} should not create agenda`);
      }
      if (lead.expectAgenda === true) {
        assert(r.data.agendaId, `${lead.name} should create agenda`);
      }
    }
  }

  const crmLeads = await req("GET", "/leads", { token });
  assert(crmLeads.status === 200, `crm leads ${crmLeads.status}`);
  const list = crmLeads.data?.data || crmLeads.data?.leads || crmLeads.data || [];
  const found = createdLeadIds.filter((id) =>
    (Array.isArray(list) ? list : []).some((l) => l.id === id),
  );
  console.log(`OK CRM leads list contains ${found.length}/${createdLeadIds.length} new leads`);

  const stages = await req("GET", "/pipeline/stages", { token });
  assert(stages.status === 200, `pipeline ${stages.status}`);
  const stageList = stages.data?.data || stages.data || [];
  const first = (Array.isArray(stageList) ? stageList : [])[0];
  if (first) console.log("OK pipeline first stage:", first.nome);

  console.log("\nE2E STABILIZATION PASSED");
}

main().catch((err) => {
  console.error("\nE2E FAILED:", err.message);
  process.exit(1);
});
