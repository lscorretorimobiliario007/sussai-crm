/**
 * Full CRM API smoke: auth statuses + CRUD flows for core modules.
 * Usage: node scripts/full-api-audit.mjs
 */
const API = process.env.API_URL || 'http://localhost:3000/api';

async function req(method, path, { token, body, expect } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  const ok =
    expect == null
      ? res.status >= 200 && res.status < 300
      : Array.isArray(expect)
        ? expect.includes(res.status)
        : res.status === expect;
  return { ok, status: res.status, data, path, method };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function login(email, senha) {
  const r = await req('POST', '/auth/login', {
    body: { email, senha },
    expect: 200,
  });
  assert(r.ok, `login failed ${email}: ${r.status} ${JSON.stringify(r.data)}`);
  return r.data;
}

async function main() {
  const results = [];
  const push = (name, r) => {
    results.push({ name, ...r });
    const mark = r.ok ? 'OK' : 'FAIL';
    console.log(`${mark} ${r.method} ${r.path} -> ${r.status} [${name}]`);
  };

  // --- Auth status codes ---
  push('login-400', await req('POST', '/auth/login', { body: {}, expect: [400, 401] }));
  push('login-401', await req('POST', '/auth/login', {
    body: { email: 'x@y.com', senha: 'wrongpass1' },
    expect: [401, 400],
  }));
  push('me-401', await req('GET', '/auth/me', { expect: 401 }));

  const adminLogin = await login('admin@topconceicao.com.br', 'Admin@123');
  const adminToken = adminLogin.access_token;
  assert(adminLogin.usuario?.perfil === 'ADMIN' || adminLogin.usuario?.tipo === 'ADMIN', 'admin perfil');

  push('me-200', await req('GET', '/auth/me', { token: adminToken, expect: 200 }));

  // --- List modules ---
  const listPaths = [
    '/dashboard',
    '/properties?limit=5',
    '/proprietarios?limit=5',
    '/clientes?limit=5',
    '/leads?limit=5',
    '/pipeline/stages',
    '/agenda',
    '/tarefas',
    '/contratos',
    '/financeiro/dashboard',
    '/financeiro/opcoes',
    '/corretores',
    '/empresa',
    '/search?q=a',
    '/notificacoes',
    '/auditoria',
    '/admin/dashboard',
    '/logs',
    '/integracoes',
    '/backup',
    '/documentos',
    '/auth/usuarios',
  ];
  for (const p of listPaths) {
    push(`list ${p}`, await req('GET', p, { token: adminToken, expect: 200 }));
  }

  // --- CRUD Cliente ---
  const clienteCreate = await req('POST', '/clientes', {
    token: adminToken,
    body: {
      tipo: 'COMPRADOR',
      tipoPessoa: 'PF',
      status: 'PROSPECTO',
      nome: `Cliente Audit ${Date.now()}`,
      email: `audit${Date.now()}@test.com`,
      telefone: '11999990000',
    },
    expect: [200, 201],
  });
  push('cliente-create', clienteCreate);
  const clienteId = clienteCreate.data?.id || clienteCreate.data?.data?.id;
  assert(clienteId, 'cliente id missing');

  push(
    'cliente-get',
    await req('GET', `/clientes/${clienteId}`, { token: adminToken, expect: 200 }),
  );
  push(
    'cliente-update',
    await req('PUT', `/clientes/${clienteId}`, {
      token: adminToken,
      body: { nome: `Cliente Edit ${Date.now()}`, status: 'QUALIFICADO' },
      expect: 200,
    }),
  );
  push(
    'cliente-search',
    await req('GET', `/clientes?busca=Cliente&page=1&limit=10`, {
      token: adminToken,
      expect: 200,
    }),
  );
  push(
    'cliente-delete',
    await req('DELETE', `/clientes/${clienteId}`, { token: adminToken, expect: [200, 204] }),
  );
  push(
    'cliente-reativar',
    await req('POST', `/clientes/${clienteId}/reativar`, {
      token: adminToken,
      expect: [200, 201],
    }),
  );

  // --- CRUD Tarefa ---
  const tarefa = await req('POST', '/tarefas', {
    token: adminToken,
    body: {
      titulo: `Tarefa Audit ${Date.now()}`,
      descricao: 'smoke',
      prioridade: 'MEDIA',
      status: 'PENDENTE',
    },
    expect: [200, 201],
  });
  push('tarefa-create', tarefa);
  const tarefaId = tarefa.data?.id || tarefa.data?.data?.id;
  push(
    'tarefa-concluir',
    await req('PUT', `/tarefas/${tarefaId}`, {
      token: adminToken,
      body: { status: 'CONCLUIDA' },
      expect: 200,
    }),
  );
  push(
    'tarefa-delete',
    await req('DELETE', `/tarefas/${tarefaId}`, { token: adminToken, expect: [200, 204] }),
  );

  // --- CRUD Agenda ---
  const start = new Date(Date.now() + 3600_000).toISOString();
  const end = new Date(Date.now() + 7200_000).toISOString();
  const agenda = await req('POST', '/agenda', {
    token: adminToken,
    body: {
      titulo: `Evento Audit ${Date.now()}`,
      tipo: 'VISITA',
      status: 'AGENDADO',
      dataInicio: start,
      dataFim: end,
    },
    expect: [200, 201],
  });
  push('agenda-create', agenda);
  const agendaId = agenda.data?.id || agenda.data?.data?.id;
  if (agendaId) {
    push(
      'agenda-update',
      await req('PUT', `/agenda/${agendaId}`, {
        token: adminToken,
        body: { titulo: `Evento Edit ${Date.now()}`, dataInicio: start, dataFim: end, tipo: 'VISITA' },
        expect: 200,
      }),
    );
    push(
      'agenda-concluir',
      await req('PATCH', `/agenda/${agendaId}/concluir`, { token: adminToken, expect: 200 }),
    );
    push(
      'agenda-delete',
      await req('DELETE', `/agenda/${agendaId}`, { token: adminToken, expect: [200, 204] }),
    );
  }

  // --- Property CRUD ---
  const prop = await req('POST', '/properties', {
    token: adminToken,
    body: {
      titulo: `Imovel Audit ${Date.now()}`,
      finalidade: 'VENDA',
      tipo: 'APARTAMENTO',
      valorVenda: 500000,
      endereco: 'Rua Teste',
      bairro: 'Centro',
      cidade: 'São Paulo',
      estado: 'SP',
      quartos: 2,
      banheiros: 1,
    },
    expect: [200, 201],
  });
  push('property-create', prop);
  const propId = prop.data?.id || prop.data?.data?.id;
  if (propId) {
    push(
      'property-update',
      await req('PATCH', `/properties/${propId}`, {
        token: adminToken,
        body: { titulo: `Imovel Edit ${Date.now()}` },
        expect: 200,
      }),
    );
    push(
      'property-delete',
      await req('DELETE', `/properties/${propId}`, { token: adminToken, expect: [200, 204] }),
    );
  }

  // --- Proprietario ---
  const owner = await req('POST', '/proprietarios', {
    token: adminToken,
    body: {
      nome: `Owner Audit ${Date.now()}`,
      email: `owner${Date.now()}@test.com`,
      telefone: '11988887777',
      cidade: 'São Paulo',
      estado: 'SP',
    },
    expect: [200, 201],
  });
  push('owner-create', owner);
  const ownerId = owner.data?.id || owner.data?.data?.id;
  if (ownerId) {
    push(
      'owner-update',
      await req('PUT', `/proprietarios/${ownerId}`, {
        token: adminToken,
        body: { nome: `Owner Edit ${Date.now()}` },
        expect: 200,
      }),
    );
    push(
      'owner-delete',
      await req('DELETE', `/proprietarios/${ownerId}`, { token: adminToken, expect: [200, 204] }),
    );
  }

  // --- Lead ---
  const stages = await req('GET', '/pipeline/stages', { token: adminToken, expect: 200 });
  push('stages', stages);
  const stageId =
    stages.data?.[0]?.id ||
    stages.data?.data?.[0]?.id ||
    (Array.isArray(stages.data) ? stages.data[0]?.id : null);
  const lead = await req('POST', '/leads', {
    token: adminToken,
    body: {
      nome: `Lead Audit ${Date.now()}`,
      email: `lead${Date.now()}@test.com`,
      telefone: '11977776666',
      origem: 'MANUAL',
      ...(stageId ? { stageId } : {}),
    },
    expect: [200, 201],
  });
  push('lead-create', lead);
  const leadId = lead.data?.id || lead.data?.data?.id;
  const stageList = Array.isArray(stages.data)
    ? stages.data
    : stages.data?.data || [];
  const otherStage = stageList.find((s) => s.id !== stageId) || stageList[1];
  if (leadId && otherStage?.id) {
    push(
      'lead-move',
      await req('PATCH', `/leads/${leadId}/move`, {
        token: adminToken,
        body: { stageId: otherStage.id },
        expect: 200,
      }),
    );
  }
  if (leadId) {
    push(
      'lead-delete',
      await req('DELETE', `/leads/${leadId}`, { token: adminToken, expect: [200, 204] }),
    );
  }

  // --- Contrato (needs cliente + property) ---
  const c2 = await req('POST', '/clientes', {
    token: adminToken,
    body: {
      tipo: 'COMPRADOR',
      tipoPessoa: 'PF',
      nome: `Contrato Cliente ${Date.now()}`,
      email: `cc${Date.now()}@test.com`,
    },
    expect: [200, 201],
  });
  const c2id = c2.data?.id || c2.data?.data?.id;
  const p2 = await req('POST', '/properties', {
    token: adminToken,
    body: {
      titulo: `Imovel Contrato ${Date.now()}`,
      finalidade: 'LOCACAO',
      tipo: 'APARTAMENTO',
      valorLocacao: 2500,
      endereco: 'Rua Contrato',
      bairro: 'Centro',
      cidade: 'São Paulo',
      estado: 'SP',
    },
    expect: [200, 201],
  });
  const p2id = p2.data?.id || p2.data?.data?.id;
  if (c2id && p2id) {
    const contrato = await req('POST', '/contratos', {
      token: adminToken,
      body: {
        tipo: 'ALUGUEL',
        status: 'ATIVO',
        valor: 2500,
        dataInicio: new Date().toISOString().slice(0, 10),
        clienteId: c2id,
        imovelId: p2id,
      },
      expect: [200, 201],
    });
    push('contrato-create', contrato);
  }

  // --- Financeiro opcoes/categorias ---
  push(
    'fin-categorias',
    await req('GET', '/financeiro/categorias', { token: adminToken, expect: 200 }),
  );
  push(
    'fin-lancamentos',
    await req('GET', '/financeiro/lancamentos', { token: adminToken, expect: 200 }),
  );

  // --- RBAC: CORRETOR cannot access financeiro ---
  // Create corretor user if possible
  const corrEmail = `corretor.audit.${Date.now()}@test.com`;
  const corrCreate = await req('POST', '/auth/usuarios', {
    token: adminToken,
    body: {
      nome: 'Corretor Audit',
      email: corrEmail,
      senha: 'Corretor@123',
      perfil: 'CORRETOR',
      tipo: 'CORRETOR',
    },
    expect: [200, 201],
  });
  push('corretor-user-create', corrCreate);

  if (corrCreate.ok) {
    const corrLogin = await login(corrEmail, 'Corretor@123');
    const corrToken = corrLogin.access_token;
    push(
      'rbac-financeiro-403',
      await req('GET', '/financeiro/dashboard', { token: corrToken, expect: 403 }),
    );
    push(
      'rbac-admin-403',
      await req('GET', '/admin/dashboard', { token: corrToken, expect: 403 }),
    );
    push(
      'rbac-auditoria-403',
      await req('GET', '/auditoria', { token: corrToken, expect: 403 }),
    );
    push(
      'rbac-dashboard-200',
      await req('GET', '/dashboard', { token: corrToken, expect: 200 }),
    );
    push(
      'rbac-clientes-200',
      await req('GET', '/clientes?limit=5', { token: corrToken, expect: 200 }),
    );
  }

  // --- 404 ---
  push(
    '404-cliente',
    await req('GET', '/clientes/99999999', { token: adminToken, expect: 404 }),
  );

  // --- uploads auth ---
  push('uploads-401', await req('GET', '/uploads', { expect: 401 }));
  push('uploads-200', await req('GET', '/uploads', { token: adminToken, expect: 200 }));

  const failed = results.filter((r) => !r.ok);
  console.log('\n==== SUMMARY ====');
  console.log(`total=${results.length} failed=${failed.length}`);
  if (failed.length) {
    for (const f of failed) {
      console.log(`FAIL ${f.name}: ${f.method} ${f.path} -> ${f.status} ${JSON.stringify(f.data)?.slice(0, 200)}`);
    }
    process.exit(1);
  }
  console.log('ALL PASSED');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
