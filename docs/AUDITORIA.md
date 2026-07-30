# SUSSAI CRM — Relatório de Auditoria do Repositório

> **Baseline histórico:** este relatório representa o estado encontrado antes da Sprint 1.  
> As alterações posteriores estão registradas em [SPRINT_1_REPORT.md](SPRINT_1_REPORT.md).

| Campo | Valor |
|-------|-------|
| **Data** | 15/Jul/2026 |
| **Método** | Análise direta de todos os arquivos do repositório (sem suposições) |
| **Escopo** | Código-fonte, configuração, banco, documentação |
| **Objetivo** | Baseline factual antes da Fase 1 |

---

## 1. Pastas Existentes

```
sistema-imobiliaria/
├── backend/
│   ├── generated/prisma/       # Cliente Prisma TS gerado — NÃO usado pelo runtime JS
│   ├── node_modules/
│   ├── prisma/
│   │   └── migrations/         # 5 migrations + migration_lock.toml
│   └── src/
│       ├── config/             # 1 arquivo
│       ├── controllers/        # 8 arquivos
│       ├── middleware/         # 1 arquivo
│       ├── routes/             # 9 arquivos
│       └── utils/              # 1 arquivo
├── docs/                       # 5 arquivos markdown
├── frontend/
│   ├── dist/                   # Build de produção (artefato compilado)
│   ├── node_modules/
│   ├── public/                 # vite.svg
│   └── src/
│       ├── api/                # 1 arquivo
│       ├── assets/             # react.svg (não referenciado)
│       ├── components/layout/  # 3 arquivos
│       ├── context/            # 1 arquivo
│       ├── pages/              # 10 arquivos
│       ├── theme/              # 1 arquivo
│       └── utils/              # 1 arquivo
├── package.json                # Raiz — dependências órfãs (ver seção 3)
└── package-lock.json
```

### Pastas que NÃO existem

| Pasta planejada | Status |
|-----------------|--------|
| `docker-compose.yml` / `Dockerfile` | ❌ Não existe |
| `.github/workflows/` | ❌ Não existe |
| `backend/tests/` | ❌ Não existe |
| `backend/src/domain/` | ❌ Não existe |
| `backend/src/application/` | ❌ Não existe |
| `backend/src/infrastructure/` | ❌ Não existe |
| `frontend/src/features/` | ❌ Não existe |
| `frontend/src/shared/` | ❌ Não existe |
| `frontend/src/app/` | ❌ Não existe |

---

## 2. Arquivos Existentes (código-fonte)

### 2.1 Raiz (4 arquivos relevantes)

| Arquivo | Função |
|---------|--------|
| `README.md` | Documentação de instalação |
| `package.json` | Dependências órfãs (não usadas pelo frontend/backend) |
| `package-lock.json` | Lock da raiz |
| `.gitignore` | Ignora apenas `node_modules` |

### 2.2 Backend — 22 arquivos em `src/` + config

| Arquivo | Função |
|---------|--------|
| `src/server.js` | Entry point — carrega dotenv, inicia servidor |
| `src/app.js` | Express: cors, json, routes |
| `src/config/prisma.js` | Singleton PrismaClient |
| `src/middleware/auth.js` | `authMiddleware` + `adminOnly` |
| `src/utils/helpers.js` | `empresaScope`, `gerarCodigoImovel`, `gerarNumeroContrato` |
| `src/routes/index.js` | Router principal + health check |
| `src/routes/authRoutes.js` | 5 rotas auth |
| `src/routes/dashboardRoutes.js` | 1 rota dashboard |
| `src/routes/imovelRoutes.js` | 5 rotas imóveis |
| `src/routes/clienteRoutes.js` | 5 rotas clientes |
| `src/routes/leadRoutes.js` | 4 rotas leads |
| `src/routes/contratoRoutes.js` | 4 rotas contratos |
| `src/routes/financeiroRoutes.js` | 5 rotas financeiro |
| `src/routes/tarefaRoutes.js` | 4 rotas tarefas |
| `src/controllers/authController.js` | registrar, login, perfil, criar/listar usuários |
| `src/controllers/dashboardController.js` | dashboard agregado |
| `src/controllers/imovelController.js` | CRUD imóveis |
| `src/controllers/clienteController.js` | CRUD clientes |
| `src/controllers/leadController.js` | CRUD leads (sem GET :id) |
| `src/controllers/contratoController.js` | CRUD parcial contratos (sem DELETE) |
| `src/controllers/financeiroController.js` | cobranças, resumo, gerar mensais |
| `src/controllers/tarefaController.js` | CRUD tarefas |
| `prisma/schema.prisma` | Schema com 8 models, 10 enums |
| `prisma.config.ts` | Config Prisma (único arquivo TypeScript do backend) |
| `.env.example` | DATABASE_URL, JWT_SECRET, PORT |
| `.env` | Arquivo de ambiente local (presente no repo) |
| `package.json` | Dependências e scripts |

**Migrations (5):**
- `20260713021938_init`
- `20260713022303_init`
- `20260714000412_usuario_admin`
- `20260714011954_create_imovel`
- `20260716011200_crm_completo`

**Gerado mas não utilizado:** `generated/prisma/` (9 arquivos `.ts`)

### 2.3 Frontend — 22 arquivos em `src/`

| Arquivo | Função | Observação |
|---------|--------|------------|
| `main.jsx` | Entry point | Importa `index.css` e `App.jsx` |
| `App.jsx` | Router + auth guards | 10 rotas |
| `App.css` | Estilos Vite template | **Morto** — não importado em lugar nenhum |
| `index.css` | Reset global + fonte Inter | Ativo |
| `api/axios.js` | Cliente HTTP + interceptors | Ativo |
| `context/AuthContext.jsx` | Auth provider | Ativo |
| `theme/theme.js` | Tema MUI (somente claro) | Ativo |
| `utils/formatters.js` | Formatadores + constantes de status | Ativo |
| `assets/react.svg` | Asset Vite | **Não utilizado** |
| `components/layout/MainLayout.jsx` | Shell sidebar + header | Ativo |
| `components/layout/Sidebar.jsx` | Navegação (8 itens) | Ativo |
| `components/layout/Header.jsx` | AppBar + menu usuário | Ativo |
| `pages/Login.jsx` | Tela de login | Ativo |
| `pages/Registrar.jsx` | Registro de empresa | Ativo |
| `pages/Dashboard.jsx` | Dashboard com KPIs | Ativo |
| `pages/Imoveis.jsx` | CRUD imóveis | Ativo |
| `pages/Clientes.jsx` | CRUD clientes | Ativo |
| `pages/Leads.jsx` | Pipeline kanban visual | Ativo |
| `pages/Contratos.jsx` | Listagem + criar contrato | Ativo |
| `pages/Financeiro.jsx` | Cobranças + resumo | Ativo |
| `pages/Tarefas.jsx` | CRUD tarefas | Ativo |
| `pages/Configuracoes.jsx` | Perfil + equipe (admin) | Ativo |
| `index.html` | HTML shell | Título ainda: "Vite + React" |
| `vite.config.js` | Config Vite padrão | Sem path aliases |
| `eslint.config.js` | ESLint | Ativo |
| `.env.example` | VITE_API_URL | Ativo |
| `package.json` | Dependências frontend | Ativo |
| `README.md` | Template Vite padrão | Não atualizado |
| `dist/` | Build compilado | Artefato gerado |

### 2.4 Documentação (5 arquivos)

| Arquivo | Conteúdo |
|---------|----------|
| `docs/MASTER_PLAN.md` | Plano mestre (estado-alvo) |
| `docs/PLANEJAMENTO_COMPLETO.md` | Planejamento técnico detalhado |
| `docs/PROJETO.md` | Visão do produto |
| `docs/ARQUITETURA.md` | Arquitetura alvo |
| `docs/ROADMAP.md` | Roadmap por fases |

---

## 3. Tecnologias Realmente Utilizadas

### 3.1 Backend (runtime)

| Tecnologia | Versão (package.json) | Realmente usada? |
|------------|----------------------|------------------|
| Node.js | ES Modules (`"type": "module"`) | ✅ |
| Express | ^5.2.1 | ✅ |
| Prisma | ^6.19.3 | ✅ |
| PostgreSQL | via DATABASE_URL | ✅ (schema definido) |
| bcrypt | ^6.0.0 | ✅ (authController) |
| jsonwebtoken | ^9.0.3 | ✅ (auth middleware) |
| cors | ^2.8.6 | ✅ (app.js) |
| dotenv | ^17.4.2 | ✅ (server.js) |
| multer | ^2.2.0 | ❌ **Instalado, nunca importado** |
| nodemon | ^3.1.14 (dev) | ✅ (script dev) |
| TypeScript | — | ❌ Apenas `prisma.config.ts` |

### 3.2 Frontend (runtime)

| Tecnologia | Versão | Realmente usada? |
|------------|--------|------------------|
| React | ^18.3.1 | ✅ |
| Vite | ^5.4.10 (dev) | ✅ |
| Material UI | ^9.2.0 | ✅ |
| Emotion | ^11.14.0 | ✅ (dependência MUI) |
| React Router | ^7.18.1 | ✅ |
| Axios | ^1.18.1 | ✅ |
| TypeScript | — | ❌ **Zero arquivos .ts/.tsx** |
| @types/react | devDep | ❌ **Instalado, não configurado** |
| ESLint | ^9.13.0 | ✅ (config existe) |

### 3.3 Tecnologias instaladas mas NÃO utilizadas

| Tecnologia | Onde está | Situação |
|------------|-----------|----------|
| multer | backend/package.json | Nunca importado |
| react-hook-form | **raiz**/package.json | Não está no frontend/package.json |
| zod | **raiz**/package.json | Não está no frontend/package.json |
| @hookform/resolvers | **raiz**/package.json | Não está no frontend/package.json |
| @types/react | frontend devDeps | Sem tsconfig.json |
| generated/prisma/*.ts | backend/generated | Runtime usa @prisma/client |

### 3.4 Tecnologias planejadas que NÃO existem

| Tecnologia | Status |
|------------|--------|
| TypeScript (src) | ❌ |
| Docker / docker-compose | ❌ |
| Swagger / OpenAPI | ❌ |
| TanStack Query | ❌ |
| React Hook Form | ❌ |
| Zod (em uso) | ❌ |
| Framer Motion | ❌ |
| Recharts | ❌ (dashboard usa LinearProgress custom) |
| FullCalendar | ❌ |
| @dnd-kit | ❌ |
| Winston (logger) | ❌ |
| Jest / Vitest (testes) | ❌ |
| GitHub Actions | ❌ |
| S3 / R2 storage | ❌ |

---

## 4. O que Realmente Está Implementado

### 4.1 Banco de Dados — 8 tabelas, 10 enums

**Tabelas existentes no `schema.prisma`:**

| Tabela | Campos | Multi-tenant |
|--------|--------|--------------|
| Empresa | 10 campos | Raiz do tenant |
| Usuario | 10 campos | empresaId |
| Imovel | 28 campos | empresaId |
| Cliente | 14 campos | empresaId |
| Lead | 11 campos | empresaId |
| Contrato | 15 campos | empresaId |
| Cobranca | 9 campos | empresaId |
| Tarefa | 11 campos | empresaId |

**Enums existentes (10):**
`PlanoEmpresa` · `TipoUsuario` (ADMIN, **GERENTE**, CORRETOR) · `StatusImovel` · `TipoCliente` · `StatusLead` · `TipoContrato` · `StatusContrato` · `StatusCobranca` · `PrioridadeTarefa` · `StatusTarefa`

> **Correção documental:** O código usa `GERENTE`, não `GESTOR`.

### 4.2 API — 34 endpoints (sem prefixo /api/v1)

| Grupo | Método | Rota | Implementado |
|-------|--------|------|--------------|
| Health | GET | `/` | ✅ |
| Auth | POST | `/auth/registrar` | ✅ |
| Auth | POST | `/auth/login` | ✅ |
| Auth | GET | `/auth/perfil` | ✅ |
| Auth | POST | `/auth/usuarios` | ✅ (adminOnly) |
| Auth | GET | `/auth/usuarios` | ✅ |
| Dashboard | GET | `/dashboard` | ✅ |
| Imóveis | POST | `/imoveis` | ✅ |
| Imóveis | GET | `/imoveis` | ✅ |
| Imóveis | GET | `/imoveis/:id` | ✅ |
| Imóveis | PUT | `/imoveis/:id` | ✅ |
| Imóveis | DELETE | `/imoveis/:id` | ✅ (soft delete) |
| Clientes | POST | `/clientes` | ✅ |
| Clientes | GET | `/clientes` | ✅ |
| Clientes | GET | `/clientes/:id` | ✅ |
| Clientes | PUT | `/clientes/:id` | ✅ |
| Clientes | DELETE | `/clientes/:id` | ✅ (soft delete) |
| Leads | POST | `/leads` | ✅ |
| Leads | GET | `/leads` | ✅ |
| Leads | PUT | `/leads/:id` | ✅ |
| Leads | DELETE | `/leads/:id` | ✅ (hard delete) |
| Contratos | POST | `/contratos` | ✅ |
| Contratos | GET | `/contratos` | ✅ |
| Contratos | GET | `/contratos/:id` | ✅ |
| Contratos | PUT | `/contratos/:id` | ✅ |
| Financeiro | GET | `/financeiro/resumo` | ✅ |
| Financeiro | POST | `/financeiro/gerar-mensais` | ✅ |
| Financeiro | POST | `/financeiro` | ✅ |
| Financeiro | GET | `/financeiro` | ✅ |
| Financeiro | PATCH | `/financeiro/:id/pagar` | ✅ |
| Tarefas | POST | `/tarefas` | ✅ |
| Tarefas | GET | `/tarefas` | ✅ |
| Tarefas | PUT | `/tarefas/:id` | ✅ |
| Tarefas | DELETE | `/tarefas/:id` | ✅ |

**Não implementado na API:**
- `GET /leads/:id`
- `DELETE /contratos/:id`
- Prefixo `/api/v1`
- Swagger
- Paginação padronizada
- Validação Zod
- Error handler global
- Rate limiting

### 4.3 Frontend — 10 rotas autenticadas + 2 públicas

| Rota | Página | Funcionalidades reais |
|------|--------|----------------------|
| `/login` | Login.jsx | Email/senha, toggle senha, redirect |
| `/registrar` | Registrar.jsx | Criar empresa + admin |
| `/` | Dashboard.jsx | 8 StatCards, 2 gráficos LinearProgress, 2 tabelas |
| `/imoveis` | Imoveis.jsx | Busca, tabela, dialog CRUD, soft delete |
| `/clientes` | Clientes.jsx | Busca, tabela, dialog CRUD, soft delete |
| `/leads` | Leads.jsx | Kanban visual 7 colunas, mover via **dropdown** (não drag) |
| `/contratos` | Contratos.jsx | Tabela + criar (sem editar/excluir na UI) |
| `/financeiro` | Financeiro.jsx | 4 cards resumo, tabela, pagar, gerar mensais |
| `/tarefas` | Tarefas.jsx | Tabela, criar, concluir, excluir |
| `/configuracoes` | Configuracoes.jsx | Dados empresa/perfil, equipe (ADMIN only) |

**Sidebar:** 8 itens de menu (não 14).

### 4.4 Funcionalidades transversais implementadas

| Funcionalidade | Status | Detalhe |
|----------------|--------|---------|
| Multi-tenant (empresaId) | ⚠️ Parcial | Presente na maioria; 6 operações sem verificação |
| JWT Auth | ✅ | Token 8h, Bearer header |
| RBAC | ⚠️ Mínimo | `adminOnly` só em POST /auth/usuarios; UI checa ADMIN em Configurações |
| Tema claro | ✅ | Único tema em theme.js |
| Tema escuro | ❌ | Não existe |
| Responsivo | ⚠️ Parcial | MUI responsivo básico, sem layout mobile dedicado |
| Soft delete | ⚠️ Parcial | Imóveis e clientes; leads e tarefas são hard delete |
| CORS | ✅ | Aberto (`cors()` sem restrição) |
| Branding SUSSAI | ⚠️ Parcial | Login e Sidebar; index.html ainda "Vite + React" |

### 4.5 Vulnerabilidades confirmadas no código

Operações que **não verificam `empresaId`** antes de alterar dados:

| Controller | Função | Risco |
|------------|--------|-------|
| clienteController | `excluirCliente` | IDOR cross-tenant |
| leadController | `excluirLead` | IDOR cross-tenant |
| contratoController | `atualizarContrato` | IDOR cross-tenant |
| financeiroController | `registrarPagamento` | IDOR cross-tenant |
| tarefaController | `atualizarTarefa` | IDOR cross-tenant |
| tarefaController | `excluirTarefa` | IDOR cross-tenant |

**Mass assignment:** Vários controllers propagam `req.body` direto ao Prisma (`data: req.body`).

---

## 5. O que NÃO Existe

### 5.1 Módulos planejados ausentes

| Módulo | Rota planejada | Existe? |
|--------|----------------|---------|
| Proprietários | `/proprietarios` | ❌ |
| Corretores | `/corretores` | ❌ |
| Agenda | `/agenda` | ❌ |
| CRM (dedicado) | `/crm` | ❌ (existe `/leads` como "Pipeline de Vendas") |
| Comissões | `/comissoes` | ❌ (campo `comissao` existe só em Contrato) |
| Relatórios | `/relatorios` | ❌ |
| Assistente IA | `/ia` | ❌ |
| Google Maps | — | ❌ |
| Upload fotos/vídeos/PDF | — | ❌ |
| WhatsApp | — | ❌ |

### 5.2 Telas ausentes

| Tela | Existe? |
|------|---------|
| Detalhe imóvel (`/imoveis/:id`) | ❌ |
| Detalhe cliente (`/clientes/:id`) | ❌ |
| 404 | ❌ |
| Landing page | ❌ |

**Total real:** 12 rotas (10 páginas + login + registrar) — não 21.

### 5.3 Entidades de banco ausentes

Comissao · EventoAgenda · Arquivo · AuditLog · Assinatura · MensagemWhatsApp · ConversaIA · MensagemIA · Relatorio · Permissao

**Total real:** 8 tabelas — não 18.

### 5.4 Infraestrutura ausente

Docker · Swagger · Testes · CI/CD · Logger estruturado · Error handler global · Seed · Storage S3

### 5.5 Arquitetura ausente

Clean Architecture · Service Layer · Repository Pattern · DTOs · Validators · Feature-based frontend · Componentes shared

---

## 6. Discrepâncias Documentação vs Código

| Afirmação na documentação | Realidade no código | Correção |
|---------------------------|---------------------|----------|
| Perfil "GESTOR" | Enum é `GERENTE` | Corrigir docs para GERENTE |
| "14 módulos na sidebar" | 8 itens no Sidebar.jsx | Documentar: 8 existentes, 6 planejados |
| "21 telas" | 12 rotas | Documentar: 12 existentes, 9 planejadas |
| "~95 APIs" | 34 endpoints | Documentar: 34 existentes, ~61 planejados |
| "18 entidades" | 8 models no Prisma | Documentar: 8 existentes, 10 planejadas |
| "24 enums" | 10 enums | Documentar: 10 existentes, 14 planejados |
| "100% TypeScript" | 100% JavaScript (+ prisma.config.ts) | Não implementado |
| "Docker funcional" | Nenhum arquivo Docker | Não implementado |
| "Swagger em /api/docs" | Não existe | Não implementado |
| "Kanban com drag-and-drop" | Dropdown para mudar status | Parcial — visual only |
| "Recharts no dashboard" | LinearProgress custom (SimpleBarChart) | Não implementado |
| "Tema claro e escuro" | Apenas tema claro | Parcial |
| DB name `sussai_crm` | `.env.example` diz `prophub_crm` | Corrigir .env.example |
| "Rebranding completo SUSSAI" | index.html = "Vite + React" | Parcial |

---

## 7. Resumo Quantitativo

| Métrica | Documentação dizia | Realidade auditada |
|---------|-------------------|-------------------|
| Arquivos backend src | — | **22** |
| Arquivos frontend src | — | **22** (2 mortos) |
| Tabelas no banco | 18 | **8** |
| Enums | 24 | **10** |
| Endpoints API | ~95 | **34** |
| Rotas frontend | 21 | **12** |
| Itens sidebar | 14 | **8** |
| Módulos funcionais | 14 | **8** (+ leads como pipeline) |
| Controllers | 8 | **8** ✅ |
| TypeScript | 100% | **0%** (exceto prisma.config.ts) |
| Testes | Planejados | **0** |
| Docker | Planejado | **0** |
| Swagger | Planejado | **0** |

---

## 8. Conclusão

O repositório contém um **MVP funcional em JavaScript** com:

- Backend Express monolítico (controllers → Prisma direto)
- Frontend React com 10 páginas monolíticas
- 8 módulos de negócio básicos operacionais
- Multi-tenant parcialmente implementado
- Zero infraestrutura de produção (Docker, CI, testes, Swagger)

A documentação (`MASTER_PLAN.md`, `PLANEJAMENTO_COMPLETO.md`) descreve o **estado-alvo**, não o estado atual. Esta auditoria estabelece o baseline factual para iniciar a Fase 1.

**Próximo passo:** Fase 1 deve partir deste baseline real, não das projeções documentais.

---

*Auditoria realizada por análise direta de cada arquivo listado. Nenhuma suposição foi feita.*
