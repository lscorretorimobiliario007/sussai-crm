/** OpenAPI 3 — documentação das APIs existentes do SUSSAI (RC1). */
export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "SUSSAI CRM API",
    version: "1.0.0-rc1",
    description:
      "API multi-tenant do SUSSAI CRM e portal público Top Conceição. Autenticação JWT Bearer nas rotas privadas. Erros padronizados: `{ \"erro\": \"mensagem\" }`.",
  },
  servers: [{ url: "/", description: "API atual" }],
  tags: [
    { name: "Auth" },
    { name: "Dashboard" },
    { name: "Imóveis" },
    { name: "Clientes" },
    { name: "Proprietários" },
    { name: "Corretores" },
    { name: "Leads" },
    { name: "Contratos" },
    { name: "Financeiro" },
    { name: "Tarefas" },
    { name: "Agenda" },
    { name: "Público" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Erro: {
        type: "object",
        properties: { erro: { type: "string" } },
        required: ["erro"],
      },
      MetaPagina: {
        type: "object",
        properties: {
          page: { type: "integer" },
          limit: { type: "integer" },
          total: { type: "integer" },
          totalPages: { type: "integer" },
        },
      },
    },
    parameters: {
      page: { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
      limit: { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
      busca: { name: "busca", in: "query", schema: { type: "string" } },
      ordenacao: { name: "ordenacao", in: "query", schema: { type: "string" } },
    },
    responses: {
      Erro400: { description: "Validação", content: { "application/json": { schema: { $ref: "#/components/schemas/Erro" } } } },
      Erro401: { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/Erro" } } } },
      Erro403: { description: "Sem permissão", content: { "application/json": { schema: { $ref: "#/components/schemas/Erro" } } } },
      Erro404: { description: "Não encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Erro" } } } },
    },
  },
  paths: {
    "/": {
      get: {
        summary: "Health / meta",
        responses: { 200: { description: "Sistema online" } },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "senha"],
                properties: { email: { type: "string" }, senha: { type: "string", minLength: 8 } },
              },
            },
          },
        },
        responses: { 200: { description: "Token + usuário" }, 401: { $ref: "#/components/responses/Erro401" } },
      },
    },
    "/auth/registrar": {
      post: {
        tags: ["Auth"],
        summary: "Registrar imobiliária (se ALLOW_PUBLIC_SIGNUP)",
        responses: { 201: { description: "Conta criada" }, 400: { $ref: "#/components/responses/Erro400" } },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        security: [{ bearerAuth: [] }],
        summary: "Usuário autenticado",
        responses: { 200: { description: "Perfil" }, 401: { $ref: "#/components/responses/Erro401" } },
      },
    },
    "/dashboard": {
      get: {
        tags: ["Dashboard"],
        security: [{ bearerAuth: [] }],
        summary: "Indicadores do dashboard",
        responses: { 200: { description: "KPIs" } },
      },
    },
    "/empresa": {
      get: {
        tags: ["Auth"],
        security: [{ bearerAuth: [] }],
        summary: "Perfil completo da empresa (Configurações)",
        responses: { 200: { description: "Dados da empresa" } },
      },
      put: {
        tags: ["Auth"],
        security: [{ bearerAuth: [] }],
        summary: "Atualizar empresa (ADMIN)",
        responses: { 200: { description: "Empresa atualizada" }, 403: { $ref: "#/components/responses/Erro403" } },
      },
    },
    "/public/empresa": {
      get: {
        tags: ["Público"],
        summary: "Dados públicos da empresa para o site",
        responses: { 200: { description: "Marca, contato, SEO" }, 503: { description: "Site inativo ou SITE_EMPRESA_ID ausente" } },
      },
    },
    "/imoveis": {
      get: {
        tags: ["Imóveis"],
        security: [{ bearerAuth: [] }],
        summary: "Listar imóveis",
        parameters: [
          { $ref: "#/components/parameters/page" },
          { $ref: "#/components/parameters/limit" },
          { $ref: "#/components/parameters/busca" },
          { $ref: "#/components/parameters/ordenacao" },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "finalidade", in: "query", schema: { type: "string" } },
          { name: "tipo", in: "query", schema: { type: "string" } },
        ],
        responses: { 200: { description: "Lista paginada `{ data, meta }`" } },
      },
      post: {
        tags: ["Imóveis"],
        security: [{ bearerAuth: [] }],
        summary: "Criar imóvel",
        responses: { 201: { description: "Criado" }, 400: { $ref: "#/components/responses/Erro400" } },
      },
    },
    "/imoveis/{id}": {
      get: {
        tags: ["Imóveis"],
        security: [{ bearerAuth: [] }],
        summary: "Detalhe do imóvel",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Imóvel" }, 404: { $ref: "#/components/responses/Erro404" } },
      },
      put: {
        tags: ["Imóveis"],
        security: [{ bearerAuth: [] }],
        summary: "Atualizar imóvel",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Atualizado" } },
      },
      delete: {
        tags: ["Imóveis"],
        security: [{ bearerAuth: [] }],
        summary: "Excluir (soft) imóvel",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Removido" } },
      },
    },
    "/clientes": {
      get: {
        tags: ["Clientes"],
        security: [{ bearerAuth: [] }],
        summary: "Listar clientes",
        parameters: [
          { $ref: "#/components/parameters/page" },
          { $ref: "#/components/parameters/limit" },
          { $ref: "#/components/parameters/busca" },
        ],
        responses: { 200: { description: "Lista paginada" } },
      },
      post: {
        tags: ["Clientes"],
        security: [{ bearerAuth: [] }],
        summary: "Criar cliente",
        responses: { 201: { description: "Criado" } },
      },
    },
    "/proprietarios": {
      get: {
        tags: ["Proprietários"],
        security: [{ bearerAuth: [] }],
        summary: "Listar proprietários",
        responses: { 200: { description: "Lista paginada" } },
      },
    },
    "/corretores": {
      get: {
        tags: ["Corretores"],
        security: [{ bearerAuth: [] }],
        summary: "Listar corretores",
        responses: { 200: { description: "Lista paginada" } },
      },
    },
    "/leads": {
      get: {
        tags: ["Leads"],
        security: [{ bearerAuth: [] }],
        summary: "Pipeline / listagem de leads",
        responses: { 200: { description: "Kanban ou lista" } },
      },
      post: {
        tags: ["Leads"],
        security: [{ bearerAuth: [] }],
        summary: "Criar lead",
        responses: { 201: { description: "Criado" } },
      },
    },
    "/contratos": {
      get: {
        tags: ["Contratos"],
        security: [{ bearerAuth: [] }],
        summary: "Listar contratos",
        responses: { 200: { description: "Lista" } },
      },
      post: {
        tags: ["Contratos"],
        security: [{ bearerAuth: [] }],
        summary: "Criar contrato",
        responses: { 201: { description: "Criado" } },
      },
    },
    "/financeiro/dashboard": {
      get: {
        tags: ["Financeiro"],
        security: [{ bearerAuth: [] }],
        summary: "Dashboard financeiro",
        responses: { 200: { description: "Indicadores" } },
      },
    },
    "/financeiro/lancamentos": {
      get: {
        tags: ["Financeiro"],
        security: [{ bearerAuth: [] }],
        summary: "Listar lançamentos",
        parameters: [
          { $ref: "#/components/parameters/page" },
          { $ref: "#/components/parameters/limit" },
          { name: "tipo", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string" } },
        ],
        responses: { 200: { description: "Lista paginada" } },
      },
    },
    "/tarefas": {
      get: {
        tags: ["Tarefas"],
        security: [{ bearerAuth: [] }],
        summary: "Listar tarefas",
        responses: { 200: { description: "Lista" } },
      },
      post: {
        tags: ["Tarefas"],
        security: [{ bearerAuth: [] }],
        summary: "Criar tarefa",
        responses: { 201: { description: "Criada" } },
      },
    },
    "/agenda": {
      get: {
        tags: ["Agenda"],
        security: [{ bearerAuth: [] }],
        summary: "Listar eventos da agenda",
        parameters: [
          { name: "inicio", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "fim", in: "query", schema: { type: "string", format: "date-time" } },
        ],
        responses: { 200: { description: "Eventos" } },
      },
    },
    "/agenda/dashboard": {
      get: {
        tags: ["Agenda"],
        security: [{ bearerAuth: [] }],
        summary: "Dashboard da agenda",
        responses: { 200: { description: "Indicadores" } },
      },
    },
    "/public/imoveis": {
      get: {
        tags: ["Público"],
        summary: "Imóveis publicados (site)",
        parameters: [
          { $ref: "#/components/parameters/page" },
          { $ref: "#/components/parameters/limit" },
          { name: "finalidade", in: "query", schema: { type: "string" } },
          { name: "secao", in: "query", schema: { type: "string", enum: ["destaque", "lancamentos", "alto-padrao", "comercial"] } },
        ],
        responses: { 200: { description: "Lista pública" }, 503: { description: "SITE_EMPRESA_ID não configurado" } },
      },
    },
    "/public/imoveis/{slugOrCodigo}": {
      get: {
        tags: ["Público"],
        summary: "Detalhe público do imóvel",
        parameters: [{ name: "slugOrCodigo", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Imóvel + semelhantes" }, 404: { $ref: "#/components/responses/Erro404" } },
      },
    },
    "/public/corretores": {
      get: {
        tags: ["Público"],
        summary: "Corretores ativos (site)",
        responses: { 200: { description: "Lista" } },
      },
    },
    "/public/leads": {
      post: {
        tags: ["Público"],
        summary: "Captura de lead do site → Cliente + Pipeline + Agenda opcional",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["nome", "telefone"],
                properties: {
                  nome: { type: "string" },
                  telefone: { type: "string" },
                  email: { type: "string" },
                  mensagem: { type: "string" },
                  imovelId: { type: "integer" },
                  tipoFormulario: { type: "string", enum: ["INTERESSE", "CONTATO", "AVALIACAO", "VISITA"] },
                  agendarVisita: { type: "boolean" },
                  dataVisita: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Lead criado" }, 400: { $ref: "#/components/responses/Erro400" } },
      },
    },
  },
};
