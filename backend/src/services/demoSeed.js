import bcrypt from "bcrypt";
import prisma from "../config/prisma.js";
import { ensureCatalogoPadrao } from "./financeiroDefaults.js";

export const DEMO_EMAIL = "demo@sussai.com.br";
export const DEMO_PASSWORD = "123456";
export const DEMO_EMPRESA_EMAIL = "empresa.demo@sussai.com.br";

const DEFAULT_ETAPAS = [
  { nome: "Leads", codigo: "LEAD", ordem: 1, cor: "#64748b", tipo: "ABERTA", probabilidadePadrao: 10 },
  { nome: "Oportunidades", codigo: "OPORTUNIDADE", ordem: 2, cor: "#2563eb", tipo: "ABERTA", probabilidadePadrao: 25 },
  { nome: "Propostas", codigo: "PROPOSTA", ordem: 3, cor: "#d97706", tipo: "ABERTA", probabilidadePadrao: 50 },
  { nome: "Negociações", codigo: "NEGOCIACAO", ordem: 4, cor: "#7c3aed", tipo: "ABERTA", probabilidadePadrao: 75 },
  { nome: "Ganho", codigo: "GANHO", ordem: 5, cor: "#16a34a", tipo: "GANHO", probabilidadePadrao: 100 },
  { nome: "Perdido", codigo: "PERDIDO", ordem: 6, cor: "#dc2626", tipo: "PERDIDO", probabilidadePadrao: 0 },
];

async function wipeEmpresaData(empresaId) {
  const tables = [
    "conciliacaoItem", "conciliacao", "movimentoCaixa", "caixaDiario", "comissao",
    "cobranca", "lancamentoFinanceiro", "categoriaFinanceira", "centroCusto",
    "leadAnexo", "leadComentario", "leadHistorico", "tarefa",
    "agendaNotificacao", "agendaHistorico", "eventoAgenda",
    "clienteProposta", "clienteVisita", "clienteFavorito", "clienteDocumento",
    "clienteHistorico", "clienteInteracao", "clienteAnotacao",
    "clienteEndereco", "clienteEmail", "clienteTelefone", "clienteDadosBancarios",
    "contrato", "lead", "pipelineEtapa",
    "imovelHistorico", "imovelFoto", "imovel",
    "corretorHistorico", "cliente", "corretorEquipe",
  ];

  for (const table of tables) {
    if (prisma[table]) {
      await prisma[table].deleteMany({ where: { empresaId } });
    }
  }

  await prisma.usuario.deleteMany({
    where: { empresaId, email: { not: DEMO_EMAIL } },
  });
}

function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function startOfMonthOffset(months) {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

/**
 * Garante empresa + usuário demo e popula dados realistas para apresentações comerciais.
 * @param {{ reset?: boolean }} options
 */
export async function ensureDemoEnvironment({ reset = false } = {}) {
  const senhaHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  let empresa = await prisma.empresa.findFirst({
    where: { email: DEMO_EMPRESA_EMAIL },
  });

  if (!empresa) {
    empresa = await prisma.empresa.create({
      data: {
        nome: "Top Conceição Imóveis",
        nomeFantasia: "TOP CONCEIÇÃO",
        cnpj: "12.345.678/0001-90",
        creci: "CRECI-SP 180-360-f",
        email: DEMO_EMPRESA_EMAIL,
        telefone: "(11) 98071-7878",
        whatsapp: "5511980717878
        slogan: "Seu novo imóvel começa aqui.",
        siteUrl: "https://www.topconceicao.com.br",
        corPrimaria: "#0B1F3A",
        corSecundaria: "#C9A227",
        endereco: "Av. Conceição",
        numero: "1200",
        bairro: "Vila Guarani",
        cidade: "São Paulo",
        estado: "SP",
        cep: "01000-000",
        horarioAtendimento: "Seg a Sex 9h–18h · Sáb 9h–13h",
        siteTitulo: "Top Conceição Imóveis",
        siteDescricao: "Imóveis selecionados para comprar e alugar com atendimento premium.",
        seoKeywords: "imóveis São Paulo, comprar apartamento, alto padrão, Top Conceição",
        instagram: "https://instagram.com/topconceicao",
        facebook: "https://facebook.com/topconceicao",
        plano: "PROFESSIONAL",
        ativo: true,
        siteAtivo: true,
      },
    });
  } else {
    empresa = await prisma.empresa.update({
      where: { id: empresa.id },
      data: {
        nome: "Top Conceição Imóveis",
        nomeFantasia: "TOP CONCEIÇÃO",
        creci: empresa.creci || "CRECI-SP 180360-F",
        telefone: empresa.telefone || "(11) 98071-7878",
        whatsapp: empresa.whatsapp || "5511980717878",
        slogan: empresa.slogan || "Seu novo imóvel começa aqui.",
        corPrimaria: empresa.corPrimaria || "#0B1F3A",
        corSecundaria: empresa.corSecundaria || "#C9A227",
        cidade: empresa.cidade || "São Paulo",
        estado: empresa.estado || "SP",
        siteTitulo: empresa.siteTitulo || "Top Conceição Imóveis",
        siteDescricao: empresa.siteDescricao || "Imóveis selecionados para comprar e alugar com atendimento premium.",
        siteAtivo: true,
      },
    });
  }

  let admin = await prisma.usuario.findUnique({ where: { email: DEMO_EMAIL } });
  if (!admin) {
    admin = await prisma.usuario.create({
      data: {
        empresaId: empresa.id,
        nome: "Ana Demo SUSSAI",
        email: DEMO_EMAIL,
        senha: senhaHash,
        tipo: "ADMIN",
        telefone: "(11) 98888-1000",
        ativo: true,
        creci: "123456-F",
        comissaoPadrao: 5,
        metaMensal: 250000,
        statusCorretor: "ATIVO",
        permissoes: ["imoveis", "clientes", "proprietarios", "leads", "agenda", "contratos", "tarefas"],
      },
    });
  } else {
    admin = await prisma.usuario.update({
      where: { id: admin.id },
      data: {
        senha: senhaHash,
        ativo: true,
        empresaId: empresa.id,
        nome: "Ana Demo SUSSAI",
        tipo: "ADMIN",
      },
    });
  }

  const existingImoveis = await prisma.imovel.count({ where: { empresaId: empresa.id } });
  if (existingImoveis > 0 && !reset) {
    return { empresa, admin, seeded: false, reset: false };
  }

  if (reset || existingImoveis > 0) {
    await wipeEmpresaData(empresa.id);
  }

  const empresaId = empresa.id;

  const equipe = await prisma.corretorEquipe.create({
    data: { empresaId, nome: "Time Elite SP", ativo: true },
  });

  const [gerente, corretor1, corretor2] = await Promise.all([
    prisma.usuario.create({
      data: {
        empresaId, nome: "Carlos Mendes", email: "carlos.demo@sussai.com.br",
        senha: senhaHash, tipo: "GERENTE", telefone: "(11) 97777-2000", ativo: true,
        creci: "654321-F", comissaoPadrao: 4, metaMensal: 180000, statusCorretor: "ATIVO",
        equipeId: equipe.id,
        permissoes: ["imoveis", "clientes", "leads", "agenda", "tarefas"],
      },
    }),
    prisma.usuario.create({
      data: {
        empresaId, nome: "Juliana Costa", email: "juliana.demo@sussai.com.br",
        senha: senhaHash, tipo: "CORRETOR", telefone: "(11) 96666-3000", ativo: true,
        creci: "998877-F", comissaoPadrao: 6, metaMensal: 120000, statusCorretor: "ATIVO",
        equipeId: equipe.id,
        permissoes: ["imoveis", "clientes", "leads", "agenda", "tarefas"],
      },
    }),
    prisma.usuario.create({
      data: {
        empresaId, nome: "Pedro Almeida", email: "pedro.demo@sussai.com.br",
        senha: senhaHash, tipo: "CORRETOR", telefone: "(11) 95555-4000", ativo: true,
        creci: "112233-F", comissaoPadrao: 5, metaMensal: 100000, statusCorretor: "FERIAS",
        equipeId: equipe.id,
        permissoes: ["imoveis", "clientes", "leads", "agenda"],
      },
    }),
  ]);

  await prisma.pipelineEtapa.createMany({
    data: DEFAULT_ETAPAS.map((etapa) => ({ ...etapa, empresaId })),
  });
  const etapas = await prisma.pipelineEtapa.findMany({
    where: { empresaId },
    orderBy: { ordem: "asc" },
  });
  const etapaByCodigo = Object.fromEntries(etapas.map((e) => [e.codigo, e]));

  await ensureCatalogoPadrao(empresaId);
  const catAluguel = await prisma.categoriaFinanceira.findFirst({ where: { empresaId, codigo: "REC-ALUGUEL" } });
  const catVenda = await prisma.categoriaFinanceira.findFirst({ where: { empresaId, codigo: "REC-VENDA" } });
  const catComissao = await prisma.categoriaFinanceira.findFirst({ where: { empresaId, codigo: "DES-COMISSAO" } });
  const centroGeral = await prisma.centroCusto.findFirst({ where: { empresaId, codigo: "GERAL" } });

  const proprietarios = await Promise.all([
    prisma.cliente.create({
      data: {
        empresaId, corretorId: corretor1.id, tipo: "PROPRIETARIO", tipoPessoa: "PF", status: "CLIENTE",
        nome: "Roberto Sampaio", cpfCnpj: "12345678901", email: "roberto.sampaio@email.com",
        telefone: "(11) 91234-5678", whatsapp: "(11) 91234-5678",
        endereco: "Rua Augusta, 1500", cidade: "São Paulo", estado: "SP", origem: "Indicação", ativo: true,
      },
    }),
    prisma.cliente.create({
      data: {
        empresaId, corretorId: gerente.id, tipo: "PROPRIETARIO", tipoPessoa: "PJ", status: "CLIENTE",
        nome: "Horizon Investimentos", razaoSocial: "Horizon Investimentos Ltda", nomeFantasia: "Horizon",
        cpfCnpj: "11222333000144", email: "contato@horizon.demo", telefone: "(11) 4000-2000",
        endereco: "Av. Faria Lima, 3000", cidade: "São Paulo", estado: "SP", origem: "Parceiro", ativo: true,
      },
    }),
    prisma.cliente.create({
      data: {
        empresaId, corretorId: corretor2.id, tipo: "PROPRIETARIO", tipoPessoa: "PF", status: "CLIENTE",
        nome: "Marina Figueiredo", cpfCnpj: "98765432100", email: "marina.f@email.com",
        telefone: "(11) 99876-5432", cidade: "Campinas", estado: "SP", origem: "Portal", ativo: true,
      },
    }),
  ]);

  await prisma.clienteDadosBancarios.create({
    data: {
      empresaId, clienteId: proprietarios[0].id, banco: "Itaú", agencia: "1234", conta: "56789-0",
      tipoConta: "CORRENTE", pix: "roberto.sampaio@email.com", titular: "Roberto Sampaio", principal: true,
    },
  });

  const clientes = await Promise.all([
    prisma.cliente.create({
      data: {
        empresaId, corretorId: corretor1.id, tipo: "COMPRADOR", tipoPessoa: "PF", status: "NEGOCIACAO",
        nome: "Fernanda Ribeiro", cpfCnpj: "11122233344", email: "fernanda.r@email.com",
        telefone: "(11) 91111-2222", whatsapp: "(11) 91111-2222", cidade: "São Paulo", estado: "SP",
        interesses: ["COMPRA"], faixaPrecoMin: 600000, faixaPrecoMax: 1200000, origem: "Instagram", ativo: true,
      },
    }),
    prisma.cliente.create({
      data: {
        empresaId, corretorId: corretor2.id, tipo: "INQUILINO", tipoPessoa: "PF", status: "QUALIFICADO",
        nome: "Lucas Martins", cpfCnpj: "55566677788", email: "lucas.m@email.com",
        telefone: "(11) 93333-4444", cidade: "São Paulo", estado: "SP",
        interesses: ["LOCACAO"], faixaPrecoMin: 2500, faixaPrecoMax: 5500, origem: "Google", ativo: true,
      },
    }),
    prisma.cliente.create({
      data: {
        empresaId, corretorId: gerente.id, tipo: "COMPRADOR", tipoPessoa: "PJ", status: "CLIENTE",
        nome: "Nova Era Holding", razaoSocial: "Nova Era Holding S.A.", cpfCnpj: "99888777000155",
        email: "compras@novaera.demo", telefone: "(11) 3500-1000", cidade: "São Paulo", estado: "SP",
        interesses: ["COMPRA", "ADMINISTRACAO"], origem: "Networking", ativo: true,
      },
    }),
    prisma.cliente.create({
      data: {
        empresaId, corretorId: corretor1.id, tipo: "LEAD", tipoPessoa: "PF", status: "PROSPECTO",
        nome: "Camila Souza", email: "camila.s@email.com", telefone: "(11) 94444-5555",
        cidade: "Guarulhos", estado: "SP", interesses: ["COMPRA"], origem: "WhatsApp", ativo: true,
      },
    }),
  ]);

  const imoveisData = [
    {
      codigo: "IMV-DEMO-001", titulo: "Apartamento Garden Vila Mariana", tipo: "APARTAMENTO", finalidade: "VENDA",
      status: "DISPONIVEL", endereco: "Rua Domingos de Morais, 1200", bairro: "Vila Mariana", cidade: "São Paulo", estado: "SP",
      cep: "04010-100", areaUtil: 98, areaConstruida: 110, quartos: 3, suites: 1, banheiros: 2, vagas: 2, valorVenda: 980000,
      condominio: 980, iptu: 420, descricao: "Apartamento ensolarado com varanda gourmet e vista permanente.",
      caracteristicas: ["VARANDA", "PLANEJADOS", "PISCINA", "ACADEMIA"], piscina: true,
      proprietarioId: proprietarios[0].id, corretorId: corretor1.id,
    },
    {
      codigo: "IMV-DEMO-002", titulo: "Cobertura duplex Moema", tipo: "COBERTURA", finalidade: "VENDA",
      status: "RESERVADO", endereco: "Av. Ibirapuera, 3100", bairro: "Moema", cidade: "São Paulo", estado: "SP",
      cep: "04029-200", areaUtil: 220, areaConstruida: 260, quartos: 4, suites: 2, banheiros: 4, vagas: 3, valorVenda: 2450000,
      condominio: 2200, iptu: 1100, descricao: "Cobertura com terraço privativo e churrasqueira.",
      caracteristicas: ["AREA_GOURMET", "ELEVADOR", "CLOSET", "CHURRASQUEIRA"], churrasqueira: true,
      proprietarioId: proprietarios[1].id, corretorId: gerente.id,
    },
    {
      codigo: "IMV-DEMO-003", titulo: "Casa condomínio Alphaville", tipo: "CASA", finalidade: "VENDA_E_LOCACAO",
      status: "DISPONIVEL", endereco: "Alameda Rio Negro, 500", bairro: "Alphaville", cidade: "Barueri", estado: "SP",
      cep: "06454-000", areaUtil: 310, areaTerreno: 450, areaConstruida: 340, quartos: 4, suites: 3, banheiros: 5, vagas: 4,
      valorVenda: 3200000, valorAluguel: 15000, condominio: 1800, descricao: "Casa térrea com jardim e home office.",
      caracteristicas: ["JARDIM", "ESCRITORIO", "AREA_GOURMET", "CHURRASQUEIRA"], churrasqueira: true,
      proprietarioId: proprietarios[1].id, corretorId: corretor1.id,
    },
    {
      codigo: "IMV-DEMO-004", titulo: "Studio mobiliado Pinheiros", tipo: "KITNET", finalidade: "LOCACAO",
      status: "ALUGADO", endereco: "Rua dos Pinheiros, 800", bairro: "Pinheiros", cidade: "São Paulo", estado: "SP",
      cep: "05422-001", areaUtil: 32, areaConstruida: 35, quartos: 1, banheiros: 1, vagas: 1, valorAluguel: 3200, condominio: 450,
      descricao: "Studio reformado, ideal para profissionais.",
      caracteristicas: ["MOBILIADO", "AR_CONDICIONADO"],
      proprietarioId: proprietarios[2].id, corretorId: corretor2.id,
    },
    {
      codigo: "IMV-DEMO-005", titulo: "Sala comercial Faria Lima", tipo: "SALA_COMERCIAL", finalidade: "LOCACAO",
      status: "DISPONIVEL", endereco: "Av. Brigadeiro Faria Lima, 2000", bairro: "Itaim Bibi", cidade: "São Paulo", estado: "SP",
      cep: "01452-000", areaUtil: 75, areaConstruida: 80, banheiros: 2, vagas: 1, valorAluguel: 8900, condominio: 1200,
      descricao: "Sala corporativa com recepção compartilhada.",
      caracteristicas: ["ELEVADOR", "PORTARIA", "AR_CONDICIONADO"],
      proprietarioId: proprietarios[1].id, corretorId: gerente.id,
    },
    {
      codigo: "IMV-DEMO-006", titulo: "Apartamento vista parque Ibirapuera", tipo: "APARTAMENTO", finalidade: "VENDA",
      status: "VENDIDO", endereco: "Rua França Pinto, 400", bairro: "Vila Mariana", cidade: "São Paulo", estado: "SP",
      cep: "04116-031", areaUtil: 120, areaConstruida: 135, quartos: 3, suites: 1, banheiros: 3, vagas: 2, valorVenda: 1350000,
      descricao: "Unidade com vista privilegiada para o parque.",
      caracteristicas: ["LAVABO", "VARANDA", "ELEVADOR"],
      proprietarioId: proprietarios[0].id, corretorId: corretor1.id,
    },
  ];

  const imoveis = [];
  for (const data of imoveisData) {
    imoveis.push(await prisma.imovel.create({
      data: {
        ...data,
        empresaId,
        ativo: true,
        publicadoSite: true,
        destaqueSite: ["IMV-DEMO-001", "IMV-DEMO-002", "IMV-DEMO-004", "IMV-DEMO-005"].includes(data.codigo),
        lancamento: ["IMV-DEMO-003", "IMV-DEMO-006"].includes(data.codigo),
        altoPadrao: ["IMV-DEMO-002", "IMV-DEMO-003", "IMV-DEMO-006"].includes(data.codigo),
        exclusividade: ["IMV-DEMO-002", "IMV-DEMO-003"].includes(data.codigo),
        slug: data.codigo.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      },
    }));
  }

  const leads = await Promise.all([
    prisma.lead.create({
      data: {
        empresaId, titulo: "Fernanda — apto Vila Mariana", status: "NEGOCIACAO",
        etapaId: etapaByCodigo.NEGOCIACAO.id, probabilidade: 75, valor: 980000, valorPrevisto: 960000,
        previsaoFechamento: daysFromNow(18), origem: "Instagram",
        clienteId: clientes[0].id, imovelId: imoveis[0].id, corretorId: corretor1.id, ativo: true,
      },
    }),
    prisma.lead.create({
      data: {
        empresaId, titulo: "Lucas — locação Pinheiros/Itaim", status: "PROPOSTA",
        etapaId: etapaByCodigo.PROPOSTA.id, probabilidade: 50, valor: 3200, valorPrevisto: 3200,
        previsaoFechamento: daysFromNow(10), origem: "Google",
        clienteId: clientes[1].id, imovelId: imoveis[4].id, corretorId: corretor2.id, ativo: true,
      },
    }),
    prisma.lead.create({
      data: {
        empresaId, titulo: "Nova Era — cobertura Moema", status: "CONTATO",
        etapaId: etapaByCodigo.OPORTUNIDADE.id, probabilidade: 25, valor: 2450000, valorPrevisto: 2400000,
        previsaoFechamento: daysFromNow(45), origem: "Networking",
        clienteId: clientes[2].id, imovelId: imoveis[1].id, corretorId: gerente.id, ativo: true,
      },
    }),
    prisma.lead.create({
      data: {
        empresaId, titulo: "Camila — primeiro imóvel", status: "NOVO",
        etapaId: etapaByCodigo.LEAD.id, probabilidade: 10, valorPrevisto: 700000,
        previsaoFechamento: daysFromNow(60), origem: "WhatsApp",
        clienteId: clientes[3].id, corretorId: corretor1.id, ativo: true,
      },
    }),
    prisma.lead.create({
      data: {
        empresaId, titulo: "Venda fechada Ibirapuera", status: "FECHADO",
        etapaId: etapaByCodigo.GANHO.id, probabilidade: 100, valor: 1350000, valorPrevisto: 1350000,
        previsaoFechamento: daysFromNow(-12), origem: "Indicação",
        clienteId: clientes[2].id, imovelId: imoveis[5].id, corretorId: corretor1.id, ativo: true,
      },
    }),
  ]);

  await prisma.leadComentario.createMany({
    data: [
      { empresaId, leadId: leads[0].id, usuarioId: corretor1.id, conteudo: "Cliente visitou e pediu contraproposta de 960k." },
      { empresaId, leadId: leads[2].id, usuarioId: gerente.id, conteudo: "Holding aguarda análise jurídica da documentação." },
    ],
  });

  await prisma.eventoAgenda.createMany({
    data: [
      {
        empresaId, usuarioId: corretor1.id, criadoPorId: admin.id, clienteId: clientes[0].id, imovelId: imoveis[0].id, leadId: leads[0].id,
        titulo: "Visita — Vila Mariana", tipo: "VISITA", status: "AGENDADO",
        dataInicio: daysFromNow(1), dataFim: new Date(daysFromNow(1).getTime() + 60 * 60 * 1000),
        localizacao: imoveis[0].endereco, ativo: true,
      },
      {
        empresaId, usuarioId: gerente.id, criadoPorId: admin.id, clienteId: clientes[2].id, imovelId: imoveis[1].id, leadId: leads[2].id,
        titulo: "Reunião comercial — Moema", tipo: "REUNIAO", status: "AGENDADO",
        dataInicio: daysFromNow(3), dataFim: new Date(daysFromNow(3).getTime() + 90 * 60 * 1000),
        localizacao: "Escritório SUSSAI", ativo: true,
      },
      {
        empresaId, usuarioId: corretor2.id, criadoPorId: admin.id, clienteId: clientes[1].id,
        titulo: "Ligação de follow-up locação", tipo: "LIGACAO", status: "AGENDADO",
        dataInicio: daysFromNow(0), dataFim: new Date(daysFromNow(0).getTime() + 30 * 60 * 1000),
        ativo: true,
      },
    ],
  });

  await prisma.tarefa.createMany({
    data: [
      { empresaId, usuarioId: corretor1.id, leadId: leads[0].id, clienteId: clientes[0].id, titulo: "Enviar proposta revisada", prioridade: "ALTA", status: "PENDENTE", dataLimite: daysFromNow(2) },
      { empresaId, usuarioId: gerente.id, leadId: leads[2].id, titulo: "Validar matrícula da cobertura", prioridade: "URGENTE", status: "EM_ANDAMENTO", dataLimite: daysFromNow(1) },
      { empresaId, usuarioId: corretor2.id, titulo: "Atualizar fotos do studio", prioridade: "MEDIA", status: "PENDENTE", dataLimite: daysFromNow(5) },
    ],
  });

  const contratoAluguel = await prisma.contrato.create({
    data: {
      empresaId, imovelId: imoveis[3].id, clienteId: clientes[1].id, proprietarioId: proprietarios[2].id,
      corretorId: corretor2.id, numero: "CTR-2026-DEMO-01", tipo: "ALUGUEL", status: "ATIVO",
      valor: 3200, comissao: 5, dataInicio: startOfMonthOffset(-2), diaVencimento: 10,
      observacoes: "Contrato demonstração — locação studio Pinheiros",
    },
  });

  const contratoVenda = await prisma.contrato.create({
    data: {
      empresaId, imovelId: imoveis[5].id, clienteId: clientes[2].id, proprietarioId: proprietarios[0].id,
      corretorId: corretor1.id, numero: "CTR-2026-DEMO-02", tipo: "VENDA", status: "ATIVO",
      valor: 1350000, comissao: 5, dataInicio: daysFromNow(-20),
      observacoes: "Venda demonstração — apto Ibirapuera",
    },
  });

  const cobrancas = [];
  for (let i = -1; i <= 1; i += 1) {
    const venc = new Date(new Date().getFullYear(), new Date().getMonth() + i, 10);
    const paga = i < 0;
    const cobranca = await prisma.cobranca.create({
      data: {
        empresaId, contratoId: contratoAluguel.id,
        descricao: `Aluguel studio ${String(venc.getMonth() + 1).padStart(2, "0")}/${venc.getFullYear()}`,
        valor: 3200, vencimento: venc,
        status: paga ? "PAGO" : (venc < new Date() ? "ATRASADO" : "PENDENTE"),
        pagamento: paga ? new Date(venc.getTime() + 2 * 86400000) : null,
        categoriaId: catAluguel?.id, centroCustoId: centroGeral?.id,
      },
    });
    cobrancas.push(cobranca);
  }

  for (const cobranca of cobrancas) {
    const lancamento = await prisma.lancamentoFinanceiro.create({
      data: {
        empresaId, tipo: "A_RECEBER", descricao: cobranca.descricao, valor: cobranca.valor,
        valorPago: cobranca.status === "PAGO" ? cobranca.valor : 0,
        vencimento: cobranca.vencimento, dataPagamento: cobranca.pagamento,
        status: cobranca.status === "PAGO" ? "LIQUIDADO" : cobranca.status === "ATRASADO" ? "ATRASADO" : "ABERTO",
        categoriaId: catAluguel?.id, centroCustoId: centroGeral?.id,
        clienteId: clientes[1].id, contratoId: contratoAluguel.id, corretorId: corretor2.id,
        competencia: new Date(cobranca.vencimento.getFullYear(), cobranca.vencimento.getMonth(), 1),
      },
    });
    await prisma.cobranca.update({ where: { id: cobranca.id }, data: { lancamentoId: lancamento.id } });
  }

  await prisma.lancamentoFinanceiro.create({
    data: {
      empresaId, tipo: "A_RECEBER", descricao: "Sinal venda Ibirapuera",
      valor: 135000, valorPago: 135000, vencimento: daysFromNow(-15), dataPagamento: daysFromNow(-14),
      status: "LIQUIDADO", categoriaId: catVenda?.id, centroCustoId: centroGeral?.id,
      clienteId: clientes[2].id, contratoId: contratoVenda.id, corretorId: corretor1.id,
      formaPagamento: "PIX", competencia: startOfMonthOffset(0),
    },
  });

  await prisma.lancamentoFinanceiro.create({
    data: {
      empresaId, tipo: "A_PAGAR", descricao: "Campanha Meta Ads — captação",
      valor: 4500, valorPago: 4500, vencimento: daysFromNow(-5), dataPagamento: daysFromNow(-4),
      status: "LIQUIDADO", categoriaId: (await prisma.categoriaFinanceira.findFirst({ where: { empresaId, codigo: "DES-MKT" } }))?.id,
      centroCustoId: centroGeral?.id, formaPagamento: "CARTAO", competencia: startOfMonthOffset(0),
    },
  });

  await prisma.lancamentoFinanceiro.create({
    data: {
      empresaId, tipo: "A_RECEBER", descricao: "Proposta reserva Moema",
      valor: 50000, valorPago: 0, vencimento: daysFromNow(7),
      status: "ABERTO", categoriaId: catVenda?.id, clienteId: clientes[2].id, corretorId: gerente.id,
      competencia: startOfMonthOffset(0),
    },
  });

  const comissaoValor = (contratoVenda.valor * 5) / 100;
  await prisma.comissao.create({
    data: {
      empresaId, corretorId: corretor1.id, contratoId: contratoVenda.id,
      descricao: `Comissão venda ${contratoVenda.numero}`,
      valorBase: contratoVenda.valor, percentual: 5, valor: comissaoValor,
      status: "APROVADA", competencia: startOfMonthOffset(0), centroCustoId: centroGeral?.id,
    },
  });

  await prisma.comissao.create({
    data: {
      empresaId, corretorId: corretor2.id, contratoId: contratoAluguel.id,
      descricao: `Comissão locação ${contratoAluguel.numero}`,
      valorBase: contratoAluguel.valor, percentual: 100, valor: contratoAluguel.valor,
      status: "PREVISTA", competencia: startOfMonthOffset(0), centroCustoId: centroGeral?.id,
    },
  });

  const caixa = await prisma.caixaDiario.create({
    data: {
      empresaId, data: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()),
      saldoInicial: 12500, status: "ABERTO", observacoes: "Caixa demonstração do dia",
    },
  });

  await prisma.movimentoCaixa.createMany({
    data: [
      { empresaId, caixaDiarioId: caixa.id, tipo: "ENTRADA", descricao: "Recebimento aluguel", valor: 3200, formaPagamento: "PIX" },
      { empresaId, caixaDiarioId: caixa.id, tipo: "SAIDA", descricao: "Despesa operacional", valor: 280, formaPagamento: "DINHEIRO" },
    ],
  });

  await prisma.clienteAnotacao.create({
    data: {
      empresaId, clienteId: clientes[0].id, usuarioId: corretor1.id,
      conteudo: "Prefere imóveis com varanda e 2 vagas. Decisão até o fim do mês.",
    },
  });

  return {
    empresa,
    admin,
    seeded: true,
    reset: Boolean(reset),
    resumo: {
      imoveis: imoveis.length,
      clientes: clientes.length + proprietarios.length,
      leads: leads.length,
      contratos: 2,
    },
  };
}
