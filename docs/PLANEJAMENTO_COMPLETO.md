# SUSSAI CRM — Planejamento Completo

**Sistema Inteligente para Imobiliárias**

> Documento oficial de arquitetura e planejamento.  
> Versão: 1.0 · Data: Julho/2026  
> Status: **Aguardando aprovação antes de qualquer implementação**

---

## Sumário

1. [Arquitetura Completa](#1-arquitetura-completa)
2. [Estrutura das Pastas](#2-estrutura-das-pastas)
3. [Estrutura do Backend](#3-estrutura-do-backend)
4. [Estrutura do Frontend](#4-estrutura-do-frontend)
5. [Estrutura do Banco](#5-estrutura-do-banco)
6. [Todas as Entidades](#6-todas-as-entidades)
7. [Relacionamentos](#7-relacionamentos)
8. [Permissões](#8-permissões)
9. [Fluxo do Sistema](#9-fluxo-do-sistema)
10. [Roadmap Completo](#10-roadmap-completo)
11. [Planejamento de Todas as Telas](#11-planejamento-de-todas-as-telas)
12. [Planejamento de Todas as APIs](#12-planejamento-de-todas-as-apis)
13. [Planejamento do Dashboard](#13-planejamento-do-dashboard)
14. [Planejamento do Módulo Imóveis](#14-planejamento-do-módulo-imóveis)
15. [Planejamento do Módulo Clientes](#15-planejamento-do-módulo-clientes)
16. [Planejamento do Módulo Financeiro](#16-planejamento-do-módulo-financeiro)
17. [Planejamento da IA](#17-planejamento-da-ia)
18. [Planejamento do Multiempresa](#18-planejamento-do-multiempresa)
19. [Planejamento do Deploy](#19-planejamento-do-deploy)
20. [Planejamento do Docker](#20-planejamento-do-docker)

---

## Diagnóstico do Estado Atual

Antes do planejamento alvo, o inventário do que **realmente existe** no repositório (auditoria 15/Jul/2026 — ver [AUDITORIA.md](AUDITORIA.md)):

| Área | Situação atual |
|------|----------------|
| Linguagem | JavaScript (meta: TypeScript) |
| Backend | Express 5, 8 controllers, 34 rotas, Prisma direto nos controllers |
| Frontend | React 18, 10 páginas monolíticas, sem componentes compartilhados |
| Banco | 8 tabelas, multi-tenant via `empresaId` |
| Auth | JWT 8h, 3 perfis (ADMIN, GERENTE, CORRETOR) |
| Docker | Não existe |
| Swagger | Não existe |
| Testes | Não existem |
| Upload | Multer instalado, não utilizado |
| IA / WhatsApp / Maps | Não existem |

**Riscos identificados no código atual (corrigir na Fase 1):**
- Isolamento de tenant inconsistente em 6 operações (update/delete sem `empresaId`)
- `req.body` propagado direto ao Prisma (mass assignment)
- CORS aberto sem restrição por ambiente
- Sem validação estruturada de entrada
- Sem error handler global

---

## 1. Arquitetura Completa

### 1.1 Visão Macro

SUSSAI CRM é um **SaaS multi-tenant** com arquitetura **monorepo desacoplada**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENTES (Browsers)                          │
│              Desktop · Tablet · Mobile (responsivo)                  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ HTTPS
┌───────────────────────────────▼─────────────────────────────────────┐
│                      CDN / Nginx (Frontend SPA)                      │
│                   React + TypeScript + Vite build                    │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ REST JSON /api/v1
┌───────────────────────────────▼─────────────────────────────────────┐
│                         API Gateway Layer                            │
│          Rate Limit · CORS · Auth JWT · Tenant Context · Logs        │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                    BACKEND — Clean Architecture                      │
│                                                                      │
│  Presentation ──► Application ──► Domain ◄── Infrastructure         │
│  (Controllers)    (Services)      (Entities)  (Repositories)        │
└───────┬─────────────────┬──────────────────┬──────────────────────┘
        │                 │                  │
        ▼                 ▼                  ▼
   PostgreSQL        S3/R2 Storage      Serviços Externos
   (Prisma ORM)      (mídia/PDF)        (Maps, WhatsApp, IA, Email)
```

### 1.2 Princípios Arquiteturais

| Princípio | Aplicação no SUSSAI |
|-----------|---------------------|
| **Clean Architecture** | Dependências apontam para dentro; domínio não conhece Express/Prisma |
| **SOLID** | Services com responsabilidade única; repositories substituíveis |
| **DDD (quando faz sentido)** | Bounded contexts: Imóveis, CRM, Financeiro, Plataforma |
| **Multi-tenant by design** | `empresaId` em toda entidade de negócio + enforcement em repository base |
| **API-first** | Contratos REST documentados em Swagger antes da UI |
| **Security by default** | RBAC, validação, audit log, rate limit |
| **Performance by design** | Paginação server-side, índices compostos, lazy loading, cache |

### 1.3 Bounded Contexts (Domínios)

```
SUSSAI CRM
├── Plataforma          → Auth, Empresa, Usuários, Permissões, Billing, Audit
├── Imóveis             → Cadastro, Galeria, Mapa, Portais (futuro)
├── Pessoas             → Clientes, Proprietários, Corretores
├── CRM                 → Leads, Pipeline, Agenda, Tarefas, WhatsApp
├── Contratos           → Contratos, Comissões, Documentos PDF
├── Financeiro          → Cobranças, Pagamentos, Relatórios financeiros
└── Inteligência        → Assistente IA, Scoring, Automações
```

### 1.4 Camadas do Backend

```
┌─────────────────────────────────────────────────────────┐
│ PRESENTATION                                             │
│ Routes · Controllers · Middlewares · Validators (Zod)   │
│ Responsabilidade: HTTP ↔ DTO. Nada de regra de negócio. │
├─────────────────────────────────────────────────────────┤
│ APPLICATION                                              │
│ Services · Use Cases · DTOs de entrada/saída            │
│ Responsabilidade: orquestrar fluxos e regras.           │
├─────────────────────────────────────────────────────────┤
│ DOMAIN                                                   │
│ Entities · Enums · Value Objects · Domain Events      │
│ Responsabilidade: regras puras de negócio.              │
├─────────────────────────────────────────────────────────┤
│ INFRASTRUCTURE                                           │
│ Repositories (Prisma) · Storage · Email · WhatsApp · IA │
│ Responsabilidade: detalhes técnicos e integrações.      │
└─────────────────────────────────────────────────────────┘
```

### 1.5 Camadas do Frontend

```
┌─────────────────────────────────────────────────────────┐
│ APP SHELL                                                │
│ Router · Providers (Auth, Theme, Query) · Layout        │
├─────────────────────────────────────────────────────────┤
│ FEATURES (por domínio)                                   │
│ pages · components · hooks · services · types · schemas   │
├─────────────────────────────────────────────────────────┤
│ SHARED                                                   │
│ DataTable · FormModal · StatusChip · hooks · utils      │
└─────────────────────────────────────────────────────────┘
```

### 1.6 Fluxo de Dados Padrão

```
Usuário → UI Component → Custom Hook → API Service → Axios
  → Backend Route → Controller → Validator (Zod)
  → Service → Repository (com empresaId) → Prisma → PostgreSQL
  → Response DTO → Hook atualiza estado → UI renderiza
```

### 1.7 Decisões Arquiteturais Registradas (ADRs)

| # | Decisão | Justificativa |
|---|---------|---------------|
| ADR-001 | Monorepo (não microservices inicialmente) | Reduz complexidade operacional; escala vertical primeiro |
| ADR-002 | PostgreSQL único com tenant por coluna | Padrão SaaS B2B; migração futura para schema-per-tenant se necessário |
| ADR-003 | REST (não GraphQL) | Simplicidade, Swagger nativo, equipe menor |
| ADR-004 | JWT stateless | Performance; refresh token na Fase 5 |
| ADR-005 | TanStack Query no frontend | Cache, loading states, invalidação automática |
| ADR-006 | Zod em backend e frontend | Validação compartilhável, tipos inferidos |
| ADR-007 | Storage S3-compatible | Escalável para fotos/vídeos/PDFs |
| ADR-008 | OpenAI API para IA (Fase 4) | Melhor custo/benefício para MVP de IA |

---

## 2. Estrutura das Pastas

### 2.1 Monorepo Alvo

```
sistema-imobiliaria/
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Lint + build + test
│       └── deploy.yml              # Deploy staging/prod
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── src/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   ├── presentation/
│   │   ├── shared/
│   │   ├── config/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tests/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── features/
│   │   ├── shared/
│   │   ├── assets/
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── .env.example
├── docs/
│   ├── PLANEJAMENTO_COMPLETO.md    # Este documento
│   ├── PROJETO.md
│   ├── ARQUITETURA.md
│   └── ROADMAP.md
├── docker-compose.yml
├── docker-compose.prod.yml
├── .gitignore
└── README.md
```

### 2.2 Convenções de Nomenclatura

| Contexto | Convenção | Exemplo |
|----------|-----------|---------|
| Arquivos TS backend | camelCase | `imovelService.ts` |
| Arquivos TS frontend | PascalCase para componentes | `ImovelForm.tsx` |
| Rotas API | kebab-case plural | `/api/v1/imoveis` |
| Tabelas Prisma | PascalCase singular | `Imovel` |
| Enums | SCREAMING_SNAKE | `StatusImovel.DISPONIVEL` |
| Hooks | prefixo `use` | `useImoveis` |
| DTOs | sufixo `Dto` | `CreateImovelDto` |

---

## 3. Estrutura do Backend

### 3.1 Árvore Detalhada

```
backend/src/
├── config/
│   ├── env.ts                      # Validação Zod das env vars
│   ├── prisma.ts                   # PrismaClient singleton
│   └── swagger.ts                  # Configuração OpenAPI
│
├── domain/
│   ├── entities/
│   │   ├── Empresa.ts
│   │   ├── Usuario.ts
│   │   ├── Imovel.ts
│   │   ├── Cliente.ts
│   │   ├── Lead.ts
│   │   ├── Contrato.ts
│   │   ├── Cobranca.ts
│   │   ├── Comissao.ts
│   │   ├── Tarefa.ts
│   │   ├── EventoAgenda.ts
│   │   └── Arquivo.ts
│   ├── enums/                      # Espelho dos enums Prisma
│   ├── value-objects/
│   │   ├── CpfCnpj.ts
│   │   ├── Endereco.ts
│   │   └── Dinheiro.ts
│   └── errors/
│       ├── DomainError.ts
│       └── BusinessRuleError.ts
│
├── application/
│   ├── services/
│   │   ├── authService.ts
│   │   ├── empresaService.ts
│   │   ├── imovelService.ts
│   │   ├── clienteService.ts
│   │   ├── leadService.ts
│   │   ├── contratoService.ts
│   │   ├── financeiroService.ts
│   │   ├── comissaoService.ts
│   │   ├── tarefaService.ts
│   │   ├── agendaService.ts
│   │   ├── arquivoService.ts
│   │   ├── relatorioService.ts
│   │   ├── whatsappService.ts
│   │   ├── iaService.ts
│   │   └── dashboardService.ts
│   └── dtos/
│       ├── auth/
│       ├── imoveis/
│       ├── clientes/
│       └── ...                     # Um subfolder por domínio
│
├── infrastructure/
│   ├── repositories/
│   │   ├── baseRepository.ts       # Filtro automático empresaId
│   │   ├── imovelRepository.ts
│   │   ├── clienteRepository.ts
│   │   └── ...
│   ├── storage/
│   │   ├── storageInterface.ts
│   │   ├── localStorage.ts         # Dev
│   │   └── s3Storage.ts            # Prod
│   ├── messaging/
│   │   ├── emailService.ts
│   │   └── whatsappService.ts
│   ├── maps/
│   │   └── googleMapsService.ts
│   └── ai/
│       └── openAiProvider.ts
│
├── presentation/
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── imovelController.ts
│   │   └── ...
│   ├── routes/
│   │   ├── index.ts
│   │   ├── authRoutes.ts
│   │   └── ...
│   ├── middlewares/
│   │   ├── authMiddleware.ts
│   │   ├── tenantMiddleware.ts
│   │   ├── roleMiddleware.ts
│   │   ├── validateMiddleware.ts
│   │   ├── rateLimitMiddleware.ts
│   │   ├── errorHandler.ts
│   │   └── notFoundHandler.ts
│   └── validators/
│       ├── imovelValidator.ts
│       └── ...
│
├── shared/
│   ├── errors/
│   │   └── AppError.ts
│   ├── logger/
│   │   └── logger.ts
│   ├── helpers/
│   │   ├── codigoGenerator.ts
│   │   └── paginacao.ts
│   └── types/
│       ├── RequestContext.ts
│       └── ApiResponse.ts
│
├── app.ts                          # Express setup
└── server.ts                       # Bootstrap
```

### 3.2 Responsabilidades por Camada

| Camada | Pode fazer | Não pode fazer |
|--------|-----------|----------------|
| Controller | Parse request, chamar service, formatar response | Query Prisma, regra de negócio |
| Service | Regras de negócio, orquestração | Conhecer `req`/`res` |
| Repository | Queries Prisma com tenant filter | Regra de negócio |
| Validator | Validar shape do input | Lógica de aplicação |
| Middleware | Auth, tenant, rate limit | Lógica de domínio |

### 3.3 Padrão de Response

```json
// Sucesso
{
  "success": true,
  "data": { },
  "meta": { "page": 1, "perPage": 20, "total": 150, "totalPages": 8 }
}

// Erro
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos",
    "details": [{ "field": "email", "message": "E-mail inválido" }]
  }
}
```

### 3.4 Middleware Chain (ordem de execução)

```
Request
  → rateLimitMiddleware
  → corsMiddleware
  → jsonParser
  → requestLogger
  → authMiddleware          (rotas protegidas)
  → tenantMiddleware        (injeta empresaId no context)
  → roleMiddleware          (rotas com RBAC)
  → validateMiddleware      (Zod schema)
  → controller
  → errorHandler            (catch global)
```

---

## 4. Estrutura do Frontend

### 4.1 Árvore Detalhada

```
frontend/src/
├── app/
│   ├── App.tsx
│   ├── routes.tsx                  # Todas as rotas + lazy loading
│   ├── providers/
│   │   ├── AppProviders.tsx        # Composição de providers
│   │   ├── AuthProvider.tsx
│   │   ├── ThemeProvider.tsx       # Claro/escuro
│   │   └── QueryProvider.tsx       # TanStack Query
│   └── guards/
│       ├── PrivateRoute.tsx
│       ├── PublicRoute.tsx
│       └── RoleRoute.tsx
│
├── features/
│   ├── auth/
│   │   ├── pages/ LoginPage.tsx, RegisterPage.tsx
│   │   ├── components/ LoginForm.tsx, RegisterForm.tsx
│   │   ├── hooks/ useAuth.ts
│   │   ├── services/ authApi.ts
│   │   └── types/ auth.types.ts
│   ├── dashboard/
│   ├── imoveis/
│   ├── clientes/
│   ├── proprietarios/
│   ├── corretores/
│   ├── crm/
│   ├── agenda/
│   ├── contratos/
│   ├── financeiro/
│   ├── comissoes/
│   ├── relatorios/
│   ├── tarefas/
│   ├── configuracoes/
│   └── ia/
│
├── shared/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── MainLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── PageHeader.tsx
│   │   ├── data-display/
│   │   │   ├── DataTable.tsx
│   │   │   ├── StatusChip.tsx
│   │   │   ├── StatCard.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── SkeletonTable.tsx
│   │   ├── feedback/
│   │   │   ├── Toast.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   └── LoadingOverlay.tsx
│   │   ├── forms/
│   │   │   ├── FormModal.tsx
│   │   │   ├── SearchInput.tsx
│   │   │   ├── CurrencyInput.tsx
│   │   │   └── DatePicker.tsx
│   │   ├── media/
│   │   │   ├── ImageGallery.tsx
│   │   │   ├── FileUpload.tsx
│   │   │   └── VideoPlayer.tsx
│   │   └── maps/
│   │       └── GoogleMap.tsx
│   ├── hooks/
│   │   ├── useDebounce.ts
│   │   ├── useDisclosure.ts
│   │   ├── usePagination.ts
│   │   └── usePermissions.ts
│   ├── services/
│   │   └── apiClient.ts            # Axios configurado
│   ├── types/
│   │   ├── api.types.ts
│   │   └── common.types.ts
│   ├── utils/
│   │   ├── formatters.ts
│   │   └── validators.ts
│   └── constants/
│       ├── routes.ts
│       ├── permissions.ts
│       └── enums.ts
│
├── assets/
│   ├── logo.svg
│   └── illustrations/
│
├── theme/
│   ├── index.ts
│   ├── lightTheme.ts
│   ├── darkTheme.ts
│   └── components.ts               # Overrides MUI
│
└── main.tsx
```

### 4.2 Padrão de Feature Module

Cada feature segue a mesma estrutura interna:

```
features/imoveis/
├── pages/
│   ├── ImoveisListPage.tsx         # Listagem
│   └── ImovelDetailPage.tsx        # Detalhe com galeria e mapa
├── components/
│   ├── ImovelForm.tsx
│   ├── ImovelFilters.tsx
│   ├── ImovelCard.tsx
│   └── ImovelStatusBadge.tsx
├── hooks/
│   ├── useImoveis.ts               # Listagem paginada
│   ├── useImovel.ts                # Detalhe
│   └── useImovelMutations.ts       # Create/Update/Delete
├── services/
│   └── imoveisApi.ts
├── types/
│   └── imovel.types.ts
└── schemas/
    └── imovelSchema.ts             # Zod
```

### 4.3 Design System

| Token | Claro | Escuro |
|-------|-------|--------|
| Primary | `#1e40af` | `#3b82f6` |
| Secondary | `#0f766e` | `#14b8a6` |
| Background | `#f1f5f9` | `#0f172a` |
| Paper | `#ffffff` | `#1e293b` |
| Text primary | `#0f172a` | `#f1f5f9` |
| Sidebar | Gradiente `#0f172a→#1e293b` | Gradiente `#020617→#0f172a` |

**Tipografia:** Inter (400, 500, 600, 700)  
**Border radius:** 8px (inputs), 10px (cards), 12px (modals)  
**Animações:** Framer Motion — fade-in 200ms, slide-up 300ms, skeleton pulse  
**Breakpoints:** xs(0) · sm(600) · md(900) · lg(1200) · xl(1536)

### 4.4 Navegação Principal (Sidebar)

| Ordem | Rota | Label | Ícone | Perfis |
|-------|------|-------|-------|--------|
| 1 | `/` | Dashboard | Dashboard | Todos |
| 2 | `/imoveis` | Imóveis | HomeWork | Todos |
| 3 | `/clientes` | Clientes | People | Todos |
| 4 | `/proprietarios` | Proprietários | PersonPin | Todos |
| 5 | `/corretores` | Corretores | Badge | Admin, Gestor |
| 6 | `/crm` | CRM | TrendingUp | Todos |
| 7 | `/agenda` | Agenda | CalendarMonth | Todos |
| 8 | `/contratos` | Contratos | Description | Todos |
| 9 | `/financeiro` | Financeiro | AttachMoney | Admin, Gestor |
| 10 | `/comissoes` | Comissões | Payments | Todos* |
| 11 | `/relatorios` | Relatórios | Assessment | Admin, Gestor |
| 12 | `/tarefas` | Tarefas | TaskAlt | Todos |
| 13 | `/ia` | Assistente IA | AutoAwesome | Todos |
| 14 | `/configuracoes` | Configurações | Settings | Admin |

*Corretor vê apenas suas comissões.

---

## 5. Estrutura do Banco

### 5.1 Estratégia Multi-tenant

**Modelo escolhido:** Shared Database, Shared Schema, Tenant Discriminator (`empresaId`)

| Aspecto | Decisão |
|---------|---------|
| Isolamento | Coluna `empresaId` em toda tabela de negócio |
| Enforcement | Repository base filtra automaticamente |
| Índices | Compostos `(empresaId, campo_buscado)` em todas as tabelas |
| Unicidade | Constraints compostas: `@@unique([empresaId, codigo])` |
| Super-admin | Tabela separada `SuperAdmin` fora do tenant scope |

### 5.2 Tecnologias

| Componente | Tecnologia | Versão |
|------------|------------|--------|
| SGBD | PostgreSQL | 16+ |
| ORM | Prisma | 6.x |
| Migrations | Prisma Migrate | Versionadas em Git |
| Seed | prisma/seed.ts | Dados de demonstração |
| Backup | pg_dump automatizado | Diário em produção |

### 5.3 Convenções de Banco

| Regra | Padrão |
|-------|--------|
| PK | `id` SERIAL (migrar para UUID na Fase 5 se necessário) |
| Timestamps | `createdAt`, `updatedAt` em toda tabela |
| Soft delete | Campo `ativo BOOLEAN` (não deletar fisicamente) |
| Valores monetários | `Decimal(12,2)` (migrar de Float) |
| Textos longos | `Text` |
| Enums | PostgreSQL ENUM via Prisma |
| Auditoria | Tabela `AuditLog` para ações sensíveis |

### 5.4 Índices Planejados

```sql
-- Performance crítica (compostos por tenant)
CREATE INDEX idx_imovel_empresa_status ON "Imovel"(empresaId, status);
CREATE INDEX idx_imovel_empresa_cidade ON "Imovel"(empresaId, cidade);
CREATE INDEX idx_cliente_empresa_tipo ON "Cliente"(empresaId, tipo);
CREATE INDEX idx_lead_empresa_status ON "Lead"(empresaId, status);
CREATE INDEX idx_cobranca_empresa_vencimento ON "Cobranca"(empresaId, vencimento);
CREATE INDEX idx_cobranca_empresa_status ON "Cobranca"(empresaId, status);
CREATE INDEX idx_contrato_empresa_status ON "Contrato"(empresaId, status);
CREATE INDEX idx_evento_empresa_data ON "EventoAgenda"(empresaId, dataInicio);
CREATE INDEX idx_arquivo_empresa_entidade ON "Arquivo"(empresaId, entidadeTipo, entidadeId);
```

### 5.5 Migração do Schema Atual → Alvo

| Tabela atual | Ação |
|-------------|------|
| Empresa | Expandir (endereco, configurações, limites plano) |
| Usuario | Expandir (avatar, CRECI, último acesso) |
| Imovel | Expandir (lat/lng, destaque, slug) |
| Cliente | Manter; módulo Proprietários filtra `tipo=PROPRIETARIO` |
| Lead | Expandir (score IA, temperatura, motivo perda) |
| Contrato | Expandir (arquivo PDF, renovação automática) |
| Cobranca | Migrar `valor` para Decimal; expandir (forma pagamento) |
| Tarefa | Manter |
| — | **Criar:** Comissao, EventoAgenda, Arquivo, AuditLog, Assinatura, MensagemWhatsApp, ConversaIA |

---

## 6. Todas as Entidades

### 6.1 Entidades Existentes (8)

#### Empresa (Tenant Root)
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | Int | PK | Identificador |
| nome | String | Sim | Razão social |
| cnpj | String | Não | Único global |
| email | String | Sim | E-mail principal |
| telefone | String | Não | Telefone |
| plano | PlanoEmpresa | Sim | STARTER/PROFESSIONAL/ENTERPRISE |
| ativo | Boolean | Sim | Empresa ativa |
| logoUrl | String | Não | URL do logo |
| createdAt | DateTime | Auto | |
| updatedAt | DateTime | Auto | |

**Campos novos planejados:** `endereco`, `cidade`, `estado`, `cep`, `site`, `configuracoes` (JSON), `limiteImoveis`, `limiteUsuarios`, `trialExpiraEm`

#### Usuario
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | Int | PK | |
| empresaId | Int | FK | Tenant |
| nome | String | Sim | |
| email | String | Sim | Único global |
| senha | String | Sim | Bcrypt hash |
| tipo | TipoUsuario | Sim | ADMIN/GERENTE/CORRETOR |
| telefone | String | Não | |
| ativo | Boolean | Sim | |
| createdAt | DateTime | Auto | |
| updatedAt | DateTime | Auto | |

**Campos novos:** `avatarUrl`, `creci`, `ultimoAcesso`, `preferenciaTema` (CLARO/ESCURO)

#### Imovel
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int | PK |
| empresaId | Int | FK Tenant |
| corretorId | Int? | FK Usuario |
| codigo | String | Único por empresa (IMV-XXXX) |
| titulo | String | |
| descricao | Text? | |
| finalidade | String | Venda, Aluguel, Ambos |
| tipo | String | Casa, Apartamento, Terreno... |
| status | StatusImovel | DISPONIVEL/RESERVADO/VENDIDO/ALUGADO/INATIVO |
| valorVenda | Decimal? | |
| valorAluguel | Decimal? | |
| endereco | String | |
| numero | String? | |
| bairro | String | |
| cidade | String | |
| estado | String | |
| cep | String? | |
| latitude | Float? | **Novo** — Google Maps |
| longitude | Float? | **Novo** — Google Maps |
| quartos | Int | Default 0 |
| suites | Int | Default 0 |
| banheiros | Int | Default 0 |
| vagas | Int | Default 0 |
| areaTerreno | Float? | |
| areaConstruida | Float? | |
| piscina | Boolean | |
| churrasqueira | Boolean | |
| iptu | Decimal? | |
| condominio | Decimal? | |
| imagens | String[] | URLs (migrar para tabela Arquivo) |
| destaque | Boolean | **Novo** — imóvel em destaque |
| slug | String? | **Novo** — URL amigável |
| ativo | Boolean | Soft delete |
| createdAt | DateTime | |
| updatedAt | DateTime | |

#### Cliente
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int | PK |
| empresaId | Int | FK |
| tipo | TipoCliente | PROPRIETARIO/INQUILINO/COMPRADOR/LEAD |
| nome | String | |
| cpfCnpj | String? | |
| email | String? | |
| telefone | String? | |
| whatsapp | String? | |
| endereco | String? | |
| cidade | String? | |
| estado | String? | |
| notas | Text? | |
| ativo | Boolean | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Campos novos:** `dataNascimento`, `profissao`, `renda`, `origem`, `tags` (String[])

#### Lead
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int | PK |
| empresaId | Int | FK |
| clienteId | Int? | FK Cliente |
| imovelId | Int? | FK Imovel |
| corretorId | Int? | FK Usuario |
| titulo | String | |
| status | StatusLead | NOVO→PERDIDO (7 estágios) |
| valor | Decimal? | |
| origem | String? | Site, WhatsApp, Indicação... |
| notas | Text? | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Campos novos:** `score` (Int 0-100, IA), `temperatura` (FRIO/MORNO/QUENTE), `motivoPerda`, `previsaoFechamento`

#### Contrato
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int | PK |
| empresaId | Int | FK |
| imovelId | Int | FK |
| clienteId | Int | FK (inquilino/comprador) |
| proprietarioId | Int? | FK Cliente |
| corretorId | Int? | FK Usuario |
| numero | String | CTR-YYYY-XXXX por empresa |
| tipo | TipoContrato | ALUGUEL/VENDA/ADMINISTRACAO |
| status | StatusContrato | RASCUNHO/ATIVO/ENCERRADO/CANCELADO |
| valor | Decimal | |
| comissao | Decimal? | Percentual ou valor fixo |
| dataInicio | DateTime | |
| dataFim | DateTime? | |
| diaVencimento | Int? | Dia do mês (aluguel) |
| observacoes | Text? | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Campos novos:** `arquivoPdfId` (FK Arquivo), `renovacaoAutomatica`, `indiceReajuste`

#### Cobranca
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int | PK |
| empresaId | Int | FK |
| contratoId | Int | FK |
| descricao | String | |
| valor | Decimal | |
| vencimento | DateTime | |
| pagamento | DateTime? | |
| status | StatusCobranca | PENDENTE/PAGO/ATRASADO/CANCELADO |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Campos novos:** `formaPagamento` (PIX/BOLETO/TRANSFERENCIA/DINHEIRO), `comprovanteId` (FK Arquivo), `juros`, `multa`

#### Tarefa
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int | PK |
| empresaId | Int | FK |
| usuarioId | Int | FK responsável |
| leadId | Int? | FK |
| clienteId | Int? | FK |
| titulo | String | |
| descricao | Text? | |
| dataLimite | DateTime? | |
| prioridade | PrioridadeTarefa | BAIXA/MEDIA/ALTA/URGENTE |
| status | StatusTarefa | PENDENTE/EM_ANDAMENTO/CONCLUIDA/CANCELADA |
| createdAt | DateTime | |
| updatedAt | DateTime | |

---

### 6.2 Entidades Novas Planejadas (10)

#### Comissao
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int | PK |
| empresaId | Int | FK |
| contratoId | Int | FK |
| corretorId | Int | FK Usuario |
| valor | Decimal | Valor da comissão |
| percentual | Decimal? | % sobre valor do contrato |
| status | StatusComissao | PENDENTE/APROVADA/PAGA/CANCELADA |
| dataPagamento | DateTime? | |
| observacoes | Text? | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

#### EventoAgenda
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int | PK |
| empresaId | Int | FK |
| usuarioId | Int | FK responsável |
| titulo | String | |
| descricao | Text? | |
| tipo | TipoEvento | VISITA/REUNIAO/LIGACAO/OUTRO |
| dataInicio | DateTime | |
| dataFim | DateTime | |
| imovelId | Int? | FK |
| clienteId | Int? | FK |
| leadId | Int? | FK |
| localizacao | String? | Endereço ou link |
| lembrete | Int? | Minutos antes |
| status | StatusEvento | AGENDADO/REALIZADO/CANCELADO |
| createdAt | DateTime | |
| updatedAt | DateTime | |

#### Arquivo
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int | PK |
| empresaId | Int | FK |
| entidadeTipo | String | Imovel, Contrato, Cliente... |
| entidadeId | Int | ID da entidade vinculada |
| nome | String | Nome original |
| url | String | URL no storage |
| tipo | TipoArquivo | FOTO/VIDEO/PDF/DOCUMENTO |
| tamanho | Int | Bytes |
| mimeType | String | image/jpeg, video/mp4... |
| ordem | Int? | Ordem na galeria |
| uploadedBy | Int | FK Usuario |
| createdAt | DateTime | |

#### AuditLog
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int | PK |
| empresaId | Int | FK |
| usuarioId | Int | FK |
| acao | String | CREATE, UPDATE, DELETE, LOGIN... |
| entidade | String | Nome da tabela |
| entidadeId | Int? | |
| dadosAntes | Json? | Snapshot anterior |
| dadosDepois | Json? | Snapshot posterior |
| ip | String? | |
| userAgent | String? | |
| createdAt | DateTime | |

#### Assinatura (Billing)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int | PK |
| empresaId | Int | FK único |
| plano | PlanoEmpresa | |
| status | StatusAssinatura | TRIAL/ATIVA/SUSPENSA/CANCELADA |
| gatewayId | String? | ID no Asaas/Stripe |
| valorMensal | Decimal | |
| proximoVencimento | DateTime? | |
| trialExpiraEm | DateTime? | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

#### MensagemWhatsApp
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int | PK |
| empresaId | Int | FK |
| clienteId | Int? | FK |
| leadId | Int? | FK |
| direcao | DirecaoMsg | ENVIADA/RECEBIDA |
| conteudo | Text | |
| telefone | String | |
| status | StatusMsg | ENVIADA/ENTREGUE/LIDA/ERRO |
| templateId | String? | |
| createdAt | DateTime | |

#### ConversaIA
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int | PK |
| empresaId | Int | FK |
| usuarioId | Int | FK |
| titulo | String | |
| contexto | String? | imovel, lead, geral |
| contextoId | Int? | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

#### MensagemIA
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int | PK |
| conversaId | Int | FK |
| role | RoleIA | USER/ASSISTANT/SYSTEM |
| conteudo | Text | |
| tokens | Int? | |
| createdAt | DateTime | |

#### Relatorio
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int | PK |
| empresaId | Int | FK |
| usuarioId | Int | FK quem gerou |
| tipo | TipoRelatorio | VENDAS/FINANCEIRO/IMOVEIS/COMISSOES |
| parametros | Json | Filtros usados |
| arquivoUrl | String? | PDF/Excel gerado |
| status | StatusRelatorio | PROCESSANDO/PRONTO/ERRO |
| createdAt | DateTime | |

#### Permissao (RBAC granular — Fase 2)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int | PK |
| empresaId | Int | FK |
| usuarioId | Int | FK |
| modulo | String | imoveis, financeiro... |
| acao | String | criar, ler, editar, excluir |
| permitido | Boolean | |

---

### 6.3 Enums Completos

| Enum | Valores |
|------|---------|
| PlanoEmpresa | STARTER, PROFESSIONAL, ENTERPRISE |
| TipoUsuario | ADMIN, GERENTE, CORRETOR |
| StatusImovel | DISPONIVEL, RESERVADO, VENDIDO, ALUGADO, INATIVO |
| TipoCliente | PROPRIETARIO, INQUILINO, COMPRADOR, LEAD |
| StatusLead | NOVO, CONTATO, VISITA_AGENDADA, PROPOSTA, NEGOCIACAO, FECHADO, PERDIDO |
| TipoContrato | ALUGUEL, VENDA, ADMINISTRACAO |
| StatusContrato | RASCUNHO, ATIVO, ENCERRADO, CANCELADO |
| StatusCobranca | PENDENTE, PAGO, ATRASADO, CANCELADO |
| PrioridadeTarefa | BAIXA, MEDIA, ALTA, URGENTE |
| StatusTarefa | PENDENTE, EM_ANDAMENTO, CONCLUIDA, CANCELADA |
| StatusComissao | PENDENTE, APROVADA, PAGA, CANCELADA |
| TipoEvento | VISITA, REUNIAO, LIGACAO, OUTRO |
| StatusEvento | AGENDADO, REALIZADO, CANCELADO |
| TipoArquivo | FOTO, VIDEO, PDF, DOCUMENTO |
| StatusAssinatura | TRIAL, ATIVA, SUSPENSA, CANCELADA |
| DirecaoMsg | ENVIADA, RECEBIDA |
| StatusMsg | ENVIADA, ENTREGUE, LIDA, ERRO |
| RoleIA | USER, ASSISTANT, SYSTEM |
| TipoRelatorio | VENDAS, FINANCEIRO, IMOVEIS, COMISSOES, LEADS |
| StatusRelatorio | PROCESSANDO, PRONTO, ERRO |
| TemperaturaLead | FRIO, MORNO, QUENTE |
| FormaPagamento | PIX, BOLETO, TRANSFERENCIA, DINHEIRO, CARTAO |
| TemaPreferencia | CLARO, ESCURO, SISTEMA |

**Total: 8 entidades existentes + 10 novas = 18 entidades · 24 enums**

---

## 7. Relacionamentos

### 7.1 Diagrama Entidade-Relacionamento (ER)

```
Empresa (1) ──────< (N) Usuario
Empresa (1) ──────< (N) Imovel
Empresa (1) ──────< (N) Cliente
Empresa (1) ──────< (N) Lead
Empresa (1) ──────< (N) Contrato
Empresa (1) ──────< (N) Cobranca
Empresa (1) ──────< (N) Tarefa
Empresa (1) ──────< (N) Comissao
Empresa (1) ──────< (N) EventoAgenda
Empresa (1) ──────< (N) Arquivo
Empresa (1) ──────< (N) AuditLog
Empresa (1) ──────── (1) Assinatura
Empresa (1) ──────< (N) MensagemWhatsApp
Empresa (1) ──────< (N) ConversaIA
Empresa (1) ──────< (N) Relatorio
Empresa (1) ──────< (N) Permissao

Usuario (1) ──────< (N) Imovel          [corretor]
Usuario (1) ──────< (N) Lead            [corretor]
Usuario (1) ──────< (N) Contrato        [corretor]
Usuario (1) ──────< (N) Tarefa          [responsável]
Usuario (1) ──────< (N) Comissao        [corretor]
Usuario (1) ──────< (N) EventoAgenda    [responsável]
Usuario (1) ──────< (N) ConversaIA
Usuario (1) ──────< (N) Arquivo         [uploadedBy]
Usuario (1) ──────< (N) AuditLog
Usuario (1) ──────< (N) Permissao

Imovel (1) ──────< (N) Lead
Imovel (1) ──────< (N) Contrato
Imovel (1) ──────< (N) EventoAgenda
Imovel (1) ──────< (N) Arquivo          [polimórfico]

Cliente (1) ──────< (N) Lead
Cliente (1) ──────< (N) Contrato        [cliente/inquilino]
Cliente (1) ──────< (N) Contrato        [proprietário]
Cliente (1) ──────< (N) Tarefa
Cliente (1) ──────< (N) EventoAgenda
Cliente (1) ──────< (N) MensagemWhatsApp
Cliente (1) ──────< (N) Arquivo         [polimórfico]

Lead (1) ────────< (N) Tarefa
Lead (1) ────────< (N) EventoAgenda
Lead (1) ────────< (N) MensagemWhatsApp

Contrato (1) ─────< (N) Cobranca
Contrato (1) ─────< (N) Comissao
Contrato (1) ─────── (1) Arquivo        [PDF]

ConversaIA (1) ───< (N) MensagemIA
```

### 7.2 Cardinalidades Detalhadas

| Relação | Tipo | On Delete | Regra de negócio |
|---------|------|-----------|------------------|
| Empresa → Usuario | 1:N | RESTRICT | Empresa deve ter ≥1 admin |
| Empresa → Imovel | 1:N | RESTRICT | Limite por plano |
| Usuario → Imovel (corretor) | 1:N | SET NULL | Corretor pode ser desvinculado |
| Cliente → Contrato (cliente) | 1:N | RESTRICT | Cliente não pode ser removido com contrato ativo |
| Cliente → Contrato (proprietário) | 1:N | SET NULL | Opcional |
| Imovel → Contrato | 1:N | RESTRICT | Imóvel com contrato ativo não pode ser excluído |
| Contrato → Cobranca | 1:N | RESTRICT | Cobranças vinculadas ao contrato |
| Contrato → Comissao | 1:N | RESTRICT | Comissão gerada ao ativar contrato |
| Lead → Cliente | N:1 | SET NULL | Lead pode existir sem cliente |
| Arquivo → * (polimórfico) | N:1 | CASCADE | Remove arquivos ao excluir entidade |

### 7.3 Regras de Integridade de Negócio

| Regra | Descrição |
|-------|-----------|
| RN-001 | Imóvel com contrato ATIVO não pode mudar para DISPONIVEL |
| RN-002 | Ao ativar contrato ALUGUEL → imóvel status = ALUGADO |
| RN-003 | Ao ativar contrato VENDA → imóvel status = VENDIDO |
| RN-004 | Cobrança vencida + não paga → status = ATRASADO (job diário) |
| RN-005 | Lead FECHADO deve ter cliente e imóvel vinculados |
| RN-006 | Comissão calculada automaticamente ao ativar contrato |
| RN-007 | Usuário CORRETOR só acessa leads/imóveis próprios ou compartilhados |
| RN-008 | Empresa inativa bloqueia login de todos os usuários |
| RN-009 | Plano STARTER: máximo 50 imóveis e 3 usuários |
| RN-010 | CNPJ único globalmente (não por tenant) |

---

## 8. Permissões

### 8.1 Modelo RBAC (Role-Based Access Control)

```
Usuário → Tem 1 Role (ADMIN | GERENTE | CORRETOR)
Role → Tem N Permissões por módulo
Permissão → ação (criar | ler | editar | excluir | exportar)
```

### 8.2 Matriz de Permissões por Perfil

| Módulo / Ação | Admin | Gestor | Corretor |
|---------------|:-----:|:------:|:--------:|
| **Dashboard** | | | |
| Ver dashboard completo | ✅ | ✅ | ✅ |
| Ver dados financeiros | ✅ | ✅ | ❌ |
| **Imóveis** | | | |
| Listar todos | ✅ | ✅ | ✅* |
| Criar | ✅ | ✅ | ✅ |
| Editar qualquer | ✅ | ✅ | ✅* |
| Excluir | ✅ | ✅ | ❌ |
| Upload mídia | ✅ | ✅ | ✅* |
| **Clientes** | | | |
| Listar todos | ✅ | ✅ | ✅* |
| Criar | ✅ | ✅ | ✅ |
| Editar qualquer | ✅ | ✅ | ✅* |
| Excluir | ✅ | ✅ | ❌ |
| **Proprietários** | | | |
| Listar | ✅ | ✅ | ✅ |
| Criar/Editar | ✅ | ✅ | ✅ |
| Excluir | ✅ | ✅ | ❌ |
| **Corretores** | | | |
| Listar equipe | ✅ | ✅ | ❌ |
| Criar usuário | ✅ | ❌ | ❌ |
| Editar usuário | ✅ | ❌ | ❌ |
| Desativar usuário | ✅ | ❌ | ❌ |
| **CRM / Leads** | | | |
| Ver todos os leads | ✅ | ✅ | ✅* |
| Criar lead | ✅ | ✅ | ✅ |
| Mover no pipeline | ✅ | ✅ | ✅* |
| Excluir lead | ✅ | ✅ | ❌ |
| **Agenda** | | | |
| Ver agenda completa | ✅ | ✅ | ❌ |
| Ver agenda própria | ✅ | ✅ | ✅ |
| Criar evento | ✅ | ✅ | ✅ |
| **Contratos** | | | |
| Listar todos | ✅ | ✅ | ✅* |
| Criar | ✅ | ✅ | ✅ |
| Ativar contrato | ✅ | ✅ | ❌ |
| Encerrar contrato | ✅ | ✅ | ❌ |
| **Financeiro** | | | |
| Ver resumo | ✅ | ✅ | ❌ |
| Listar cobranças | ✅ | ✅ | ❌ |
| Registrar pagamento | ✅ | ✅ | ❌ |
| Gerar cobranças mensais | ✅ | ✅ | ❌ |
| **Comissões** | | | |
| Ver todas | ✅ | ✅ | ❌ |
| Ver próprias | ✅ | ✅ | ✅ |
| Aprovar comissão | ✅ | ✅ | ❌ |
| **Relatórios** | | | |
| Gerar relatórios | ✅ | ✅ | ❌ |
| Exportar PDF/Excel | ✅ | ✅ | ❌ |
| **Tarefas** | | | |
| Ver todas | ✅ | ✅ | ❌ |
| Ver próprias | ✅ | ✅ | ✅ |
| Criar/Editar | ✅ | ✅ | ✅ |
| **Configurações** | | | |
| Dados da empresa | ✅ | ❌ | ❌ |
| Plano e billing | ✅ | ❌ | ❌ |
| Permissões customizadas | ✅ | ❌ | ❌ |
| **IA** | | | |
| Usar assistente | ✅ | ✅ | ✅ |
| Gerar descrições | ✅ | ✅ | ✅ |
| **WhatsApp** | | | |
| Enviar mensagens | ✅ | ✅ | ✅ |
| Ver histórico completo | ✅ | ✅ | ✅* |

*Corretor: apenas registros onde `corretorId = usuario.id` ou sem corretor atribuído.

### 8.3 Implementação Técnica de Permissões

**Fase 1 (MVP):** Role-based simples via middleware `roleMiddleware(['ADMIN', 'GERENTE'])`

**Fase 2 (Completo):** Tabela `Permissao` com override por usuário + hook `usePermissions()` no frontend

```
Backend:
  roleMiddleware(roles[])        → verifica perfil
  ownershipMiddleware(campo)     → corretor só acessa seus registros
  planLimitMiddleware(recurso)   → verifica limites do plano

Frontend:
  <RoleRoute roles={['ADMIN']}>  → protege rotas
  usePermissions().can('financeiro', 'ler')  → protege ações na UI
```

### 8.4 JWT Payload

```json
{
  "sub": 42,
  "empresaId": 7,
  "role": "CORRETOR",
  "email": "corretor@imobiliaria.com",
  "iat": 1720000000,
  "exp": 1720028800
}
```

**Fase 5:** Adicionar refresh token (httpOnly cookie, 7 dias) + access token (15 min).

---

## 9. Fluxo do Sistema

### 9.1 Fluxo de Onboarding (Novo Cliente SaaS)

```
1. Acessa sussai.com.br
2. Clica "Começar grátis" (trial 14 dias Professional)
3. Preenche: nome empresa, CNPJ, e-mail, senha admin
4. Backend: cria Empresa + Usuario ADMIN + Assinatura TRIAL
5. Redireciona para Dashboard com tour guiado
6. Convida corretores por e-mail
7. Cadastra primeiros imóveis
8. Dia 14: prompt para escolher plano e inserir pagamento
```

### 9.2 Fluxo de Autenticação

```
Login → POST /api/v1/auth/login
  → Valida email/senha (bcrypt)
  → Verifica usuario.ativo && empresa.ativo
  → Gera JWT (access token)
  → Retorna token + dados do usuário
  → Frontend salva token (localStorage Fase 1 → httpOnly Fase 5)
  → Axios interceptor injeta Bearer em toda request
  → GET /api/v1/auth/perfil valida token ao carregar app
  → 401 → logout automático → redirect /login
```

### 9.3 Fluxo de Venda Imobiliária (Happy Path)

```
1. Corretor recebe lead (WhatsApp, site, indicação)
2. Cadastra Lead no CRM → status NOVO
3. Contato inicial → move para CONTATO
4. Agenda visita na Agenda → status VISITA_AGENDADA
5. Realiza visita → registra feedback nas notas
6. Cliente interessado → PROPOSTA (informa valor)
7. Negociação → NEGOCIACAO
8. Fechamento:
   a. Lead → status FECHADO
   b. Cliente formalizado (tipo COMPRADOR ou INQUILINO)
   c. Contrato criado → status RASCUNHO
   d. Admin/Gestor ativa contrato → status ATIVO
   e. Imóvel atualizado (VENDIDO ou ALUGADO)
   f. Comissão gerada automaticamente
   g. Se aluguel: cobranças mensais geradas
9. Financeiro acompanha pagamentos
10. Comissão aprovada e paga ao corretor
```

### 9.4 Fluxo de Cobrança Mensal (Aluguel)

```
Job diário (cron 06:00):
  1. Busca contratos ATIVO tipo ALUGUEL/ADMINISTRACAO
  2. Para cada contrato sem cobrança no mês corrente:
     → Cria Cobranca (valor, vencimento = diaVencimento)
  3. Cobranças com vencimento < hoje e status PENDENTE:
     → Atualiza status para ATRASADO
  4. Envia notificação WhatsApp/e-mail de cobrança (Fase 3)

Usuário no Financeiro:
  1. Visualiza cobranças do mês
  2. Clica "Registrar pagamento"
  3. PATCH /api/v1/financeiro/:id/pagar
  4. Status → PAGO, pagamento → data atual
```

### 9.5 Fluxo de Upload de Mídia

```
1. Usuário seleciona arquivo(s) no formulário de imóvel
2. Frontend valida: tipo, tamanho máximo
3. POST /api/v1/arquivos/upload (multipart/form-data)
   Body: file, entidadeTipo=Imovel, entidadeId=123
4. Backend:
   a. Multer recebe arquivo em memória/disco
   b. Valida mime type real (não só extensão)
   c. Gera nome único (uuid + extensão)
   d. Upload para storage (local dev / S3 prod)
   e. Cria registro em Arquivo
   f. Retorna URL pública/assinada
5. Frontend atualiza galeria com nova imagem
6. Para fotos: gera thumbnail (Fase 3)
```

### 9.6 Fluxo de IA — Assistente

```
1. Corretor abre módulo IA ou clica "Gerar descrição" no imóvel
2. POST /api/v1/ia/conversas { contexto: "imovel", contextoId: 123 }
3. POST /api/v1/ia/conversas/:id/mensagens { conteudo: "Gere descrição atrativa" }
4. Backend:
   a. Monta prompt com dados do imóvel (título, quartos, bairro...)
   b. Envia para OpenAI API (GPT-4o-mini)
   c. Salva MensagemIA (user + assistant)
   d. Retorna resposta
5. Frontend exibe resposta com opção "Usar esta descrição"
6. Corretor aceita → preenche campo descrição do imóvel
```

### 9.7 Fluxo Multi-tenant (Isolamento)

```
Toda request autenticada:
  1. authMiddleware → decodifica JWT → req.usuario
  2. tenantMiddleware → req.context = { empresaId, usuarioId, role }
  3. Controller → Service(context, dto)
  4. Service → Repository.findAll(context.empresaId, filters)
  5. Repository → prisma.imovel.findMany({ where: { empresaId } })
  
NUNCA aceitar empresaId do body/query do cliente.
SEMPRE usar empresaId do JWT.
```

---

## 10. Roadmap Completo

### Visão Geral das Fases

```
Fase 0  ██████████  Definição e Planejamento         ✅ Atual
Fase 1  ░░░░░░░░░░  Fundação Arquitetural            8 semanas
Fase 2  ░░░░░░░░░░  Módulos Core Completos           10 semanas
Fase 3  ░░░░░░░░░░  Integrações e Mídia              6 semanas
Fase 4  ░░░░░░░░░░  Inteligência Artificial          4 semanas
Fase 5  ░░░░░░░░░░  SaaS Comercial                   6 semanas
Fase 6  ░░░░░░░░░░  Escala e Ecossistema             Contínuo
```

### Fase 0 — Definição ✅ (1 semana)
- Documento de planejamento completo
- Arquitetura, entidades, telas, APIs definidas
- Aguardando aprovação

### Fase 1 — Fundação (8 semanas)
- Docker Compose · TypeScript full stack · Clean Architecture
- Service + Repository · Zod · Swagger · Error handler
- Tema claro/escuro · Componentes shared · CI GitHub Actions
- Corrigir 6 vulnerabilidades de tenant isolation

### Fase 2 — Módulos Core (10 semanas)
- Dashboard premium · Imóveis com detalhe e galeria
- Proprietários · Corretores · CRM kanban DnD · Agenda
- Comissões · Relatórios PDF/Excel · RBAC granular

### Fase 3 — Integrações (6 semanas)
- Upload fotos/vídeos/PDF · Google Maps · WhatsApp · E-mail

### Fase 4 — IA (4 semanas)
- Assistente chat · Descrição automática · Scoring leads · Sugestões

### Fase 5 — SaaS Comercial (6 semanas)
- Billing Asaas/Stripe · Limites plano · Landing page · LGPD · Super-admin

### Fase 6 — Escala (contínuo)
- Portais imobiliários · API pública · App mobile · White-label

---

## 11. Planejamento de Todas as Telas

Ver tabela resumo com 21 telas planejadas:

| # | Tela | Rota | Fase | Status |
|---|------|------|------|--------|
| 1 | Login | /login | 1 | ✅ Existe |
| 2 | Registro | /registrar | 1 | ✅ Existe |
| 3 | Dashboard | / | 2 | ⚠️ Básico |
| 4 | Imóveis (lista) | /imoveis | 2 | ⚠️ Básico |
| 5 | Imóvel (detalhe) | /imoveis/:id | 2 | 🔲 Novo |
| 6 | Clientes | /clientes | 2 | ⚠️ Básico |
| 7 | Cliente (detalhe) | /clientes/:id | 2 | 🔲 Novo |
| 8 | Proprietários | /proprietarios | 2 | 🔲 Novo |
| 9 | Corretores | /corretores | 2 | 🔲 Novo |
| 10 | CRM Pipeline | /crm | 2 | ⚠️ Básico |
| 11 | Agenda | /agenda | 2 | 🔲 Novo |
| 12 | Contratos | /contratos | 2 | ⚠️ Básico |
| 13 | Contrato (detalhe) | /contratos/:id | 2 | 🔲 Novo |
| 14 | Financeiro | /financeiro | 2 | ⚠️ Básico |
| 15 | Comissões | /comissoes | 2 | 🔲 Novo |
| 16 | Relatórios | /relatorios | 2 | 🔲 Novo |
| 17 | Tarefas | /tarefas | 2 | ⚠️ Básico |
| 18 | Assistente IA | /ia | 4 | 🔲 Novo |
| 19 | Configurações | /configuracoes | 2 | ⚠️ Básico |
| 20 | Landing Page | externo | 5 | 🔲 Novo |
| 21 | 404 | /* | 1 | 🔲 Novo |

**Padrão visual de toda tela autenticada:**
`Sidebar` + `Header` (título + ações) + `PageHeader` + conteúdo + `EmptyState`/`SkeletonTable` nos estados de loading/vazio.

---

## 12. Planejamento de Todas as APIs

**Base URL:** `https://api.sussai.com.br/api/v1` (prod) · `http://localhost:3000/api/v1` (dev)  
**Auth:** Bearer JWT em header `Authorization`  
**Documentação:** Swagger UI em `/api/docs`

### 12.1 APIs Existentes (a migrar para /api/v1)

| Método | Endpoint atual | Status |
|--------|---------------|--------|
| POST | /auth/registrar | ✅ Existe |
| POST | /auth/login | ✅ Existe |
| GET | /auth/perfil | ✅ Existe |
| POST | /auth/usuarios | ✅ Existe |
| GET | /auth/usuarios | ✅ Existe |
| GET | /dashboard | ✅ Existe |
| CRUD | /imoveis | ✅ Existe |
| CRUD | /clientes | ✅ Existe |
| CRUD | /leads | ✅ Existe (sem GET :id) |
| CRUD | /contratos | ⚠️ Sem DELETE |
| CRUD | /financeiro | ✅ Existe |
| CRUD | /tarefas | ✅ Existe |

### 12.2 APIs Planejadas — Auth e Plataforma

| Método | Endpoint | Descrição | Perfil | Fase |
|--------|----------|-----------|--------|------|
| POST | /auth/registrar | Criar empresa + admin | Público | 1 |
| POST | /auth/login | Login | Público | 1 |
| GET | /auth/perfil | Perfil autenticado | Todos | 1 |
| PUT | /auth/perfil | Atualizar perfil | Todos | 2 |
| PUT | /auth/senha | Alterar senha | Todos | 2 |
| POST | /auth/usuarios | Criar usuário | Admin | 1 |
| GET | /auth/usuarios | Listar equipe | Todos | 1 |
| GET | /auth/usuarios/:id | Detalhe corretor | Admin, Gestor | 2 |
| PUT | /auth/usuarios/:id | Atualizar usuário | Admin | 2 |
| DELETE | /auth/usuarios/:id | Desativar usuário | Admin | 2 |
| GET | /empresa | Dados da empresa | Admin | 2 |
| PUT | /empresa | Atualizar empresa | Admin | 2 |
| POST | /empresa/logo | Upload logo | Admin | 3 |

### 12.3 APIs — Dashboard

| Método | Endpoint | Descrição | Fase |
|--------|----------|-----------|------|
| GET | /dashboard | KPIs e gráficos | 1→2 |
| GET | /dashboard/kpis | Somente KPIs | 2 |
| GET | /dashboard/graficos | Dados para charts | 2 |
| GET | /dashboard/atividades | Feed de atividades recentes | 2 |

### 12.4 APIs — Imóveis

| Método | Endpoint | Descrição | Fase |
|--------|----------|-----------|------|
| GET | /imoveis | Listar paginado + filtros | 1→2 |
| GET | /imoveis/:id | Detalhe completo | 2 |
| POST | /imoveis | Criar | 1 |
| PUT | /imoveis/:id | Atualizar | 1 |
| DELETE | /imoveis/:id | Soft delete | 1 |
| PATCH | /imoveis/:id/status | Alterar status | 2 |
| GET | /imoveis/mapa | Imóveis com lat/lng para mapa | 3 |
| POST | /imoveis/:id/destaque | Marcar destaque | 2 |
| POST | /imoveis/:id/ia/descricao | Gerar descrição IA | 4 |

### 12.5 APIs — Clientes e Proprietários

| Método | Endpoint | Descrição | Fase |
|--------|----------|-----------|------|
| GET | /clientes | Listar paginado | 1→2 |
| GET | /clientes/:id | Detalhe com histórico | 2 |
| POST | /clientes | Criar | 1 |
| PUT | /clientes/:id | Atualizar | 1 |
| DELETE | /clientes/:id | Soft delete | 1 |
| GET | /proprietarios | Listar (tipo=PROPRIETARIO) | 2 |
| GET | /proprietarios/:id/imoveis | Imóveis do proprietário | 2 |

### 12.6 APIs — CRM (Leads)

| Método | Endpoint | Descrição | Fase |
|--------|----------|-----------|------|
| GET | /leads | Listar (filtro status) | 1→2 |
| GET | /leads/:id | Detalhe | 2 |
| POST | /leads | Criar | 1 |
| PUT | /leads/:id | Atualizar | 1 |
| PATCH | /leads/:id/status | Mover no pipeline | 2 |
| DELETE | /leads/:id | Excluir | 1 |
| GET | /leads/kanban | Leads agrupados por status | 2 |
| POST | /leads/:id/ia/score | Calcular score IA | 4 |

### 12.7 APIs — Agenda

| Método | Endpoint | Descrição | Fase |
|--------|----------|-----------|------|
| GET | /agenda | Eventos por período | 2 |
| GET | /agenda/:id | Detalhe evento | 2 |
| POST | /agenda | Criar evento | 2 |
| PUT | /agenda/:id | Atualizar | 2 |
| DELETE | /agenda/:id | Cancelar | 2 |
| PATCH | /agenda/:id/realizado | Marcar realizado | 2 |

### 12.8 APIs — Contratos e Comissões

| Método | Endpoint | Descrição | Fase |
|--------|----------|-----------|------|
| GET | /contratos | Listar | 1 |
| GET | /contratos/:id | Detalhe | 2 |
| POST | /contratos | Criar | 1 |
| PUT | /contratos/:id | Atualizar | 2 |
| PATCH | /contratos/:id/ativar | Ativar contrato | 2 |
| PATCH | /contratos/:id/encerrar | Encerrar | 2 |
| DELETE | /contratos/:id | Cancelar | 2 |
| GET | /comissoes | Listar comissões | 2 |
| GET | /comissoes/:id | Detalhe | 2 |
| PATCH | /comissoes/:id/aprovar | Aprovar | 2 |
| PATCH | /comissoes/:id/pagar | Marcar paga | 2 |

### 12.9 APIs — Financeiro

| Método | Endpoint | Descrição | Fase |
|--------|----------|-----------|------|
| GET | /financeiro | Listar cobranças | 1 |
| GET | /financeiro/resumo | KPIs financeiros | 1 |
| POST | /financeiro | Criar cobrança | 1 |
| PATCH | /financeiro/:id/pagar | Registrar pagamento | 1 |
| POST | /financeiro/gerar-mensais | Gerar cobranças do mês | 1 |
| GET | /financeiro/inadimplentes | Lista inadimplentes | 2 |
| GET | /financeiro/projecao | Projeção receita | 2 |

### 12.10 APIs — Tarefas

| Método | Endpoint | Descrição | Fase |
|--------|----------|-----------|------|
| GET | /tarefas | Listar | 1 |
| POST | /tarefas | Criar | 1 |
| PUT | /tarefas/:id | Atualizar | 1 |
| DELETE | /tarefas/:id | Excluir | 1 |
| PATCH | /tarefas/:id/concluir | Marcar concluída | 2 |

### 12.11 APIs — Arquivos (Upload)

| Método | Endpoint | Descrição | Fase |
|--------|----------|-----------|------|
| POST | /arquivos/upload | Upload (multipart) | 3 |
| GET | /arquivos | Listar por entidade | 3 |
| DELETE | /arquivos/:id | Remover | 3 |
| PUT | /arquivos/:id/ordem | Reordenar galeria | 3 |

**Limites upload:**

| Tipo | MIME | Tamanho máx |
|------|------|-------------|
| Foto | image/jpeg, png, webp | 10 MB |
| Vídeo | video/mp4, webm | 100 MB |
| PDF | application/pdf | 25 MB |

### 12.12 APIs — Relatórios

| Método | Endpoint | Descrição | Fase |
|--------|----------|-----------|------|
| POST | /relatorios/gerar | Gerar relatório | 2 |
| GET | /relatorios | Listar gerados | 2 |
| GET | /relatorios/:id/download | Download PDF/Excel | 2 |

### 12.13 APIs — WhatsApp

| Método | Endpoint | Descrição | Fase |
|--------|----------|-----------|------|
| POST | /whatsapp/enviar | Enviar mensagem | 3 |
| GET | /whatsapp/historico/:clienteId | Histórico | 3 |
| POST | /whatsapp/webhook | Webhook recebimento | 3 |
| GET | /whatsapp/templates | Templates aprovados | 3 |

### 12.14 APIs — Inteligência Artificial

| Método | Endpoint | Descrição | Fase |
|--------|----------|-----------|------|
| GET | /ia/conversas | Listar conversas | 4 |
| POST | /ia/conversas | Nova conversa | 4 |
| GET | /ia/conversas/:id | Mensagens da conversa | 4 |
| POST | /ia/conversas/:id/mensagens | Enviar mensagem | 4 |
| POST | /ia/imovel/:id/descricao | Gerar descrição | 4 |
| POST | /ia/lead/:id/score | Calcular score | 4 |
| POST | /ia/cliente/:id/sugerir-imoveis | Sugerir imóveis | 4 |

### 12.15 APIs — Billing (Fase 5)

| Método | Endpoint | Descrição | Fase |
|--------|----------|-----------|------|
| GET | /billing/plano | Plano atual e uso | 5 |
| POST | /billing/upgrade | Upgrade de plano | 5 |
| POST | /billing/webhook | Webhook gateway pagamento | 5 |
| GET | /billing/faturas | Histórico faturas | 5 |

### 12.16 APIs — Super Admin (Fase 5)

| Método | Endpoint | Descrição | Fase |
|--------|----------|-----------|------|
| GET | /admin/empresas | Listar tenants | 5 |
| PATCH | /admin/empresas/:id/status | Ativar/suspender | 5 |
| GET | /admin/metricas | Métricas globais SaaS | 5 |

**Total APIs planejadas: ~95 endpoints** (34 existentes + 61 novos)

---

## 13. Planejamento do Dashboard

### 13.1 Objetivo
Tela principal que responde em 3 segundos: **"Como está meu negócio hoje?"**

### 13.2 Layout (Desktop)

```
┌─────────────────────────────────────────────────────────────┐
│  Dashboard                                    [Filtro: Mês ▼]│
├──────────┬──────────┬──────────┬──────────┬─────────────────┤
│ Imóveis  │ Clientes │  Leads   │Contratos │ Receita do Mês  │
│   142    │   89     │   23     │   12     │  R$ 48.500      │
│  +5 ↑    │  +12 ↑   │  +3 ↑    │  +1 ↑    │  +18% ↑         │
├──────────┴──────────┴──────────┴──────────┴─────────────────┤
│ ┌─────────────────────┐  ┌─────────────────────────────┐   │
│ │ Pipeline de Vendas  │  │ Imóveis por Status          │   │
│ │ [Gráfico Funil]     │  │ [Gráfico Barras]            │   │
│ └─────────────────────┘  └─────────────────────────────┘   │
│ ┌─────────────────────┐  ┌─────────────────────────────┐   │
│ │ Receita Mensal      │  │ Próximas Cobranças          │   │
│ │ [Gráfico Linha]     │  │ [Tabela 5 itens]            │   │
│ └─────────────────────┘  └─────────────────────────────┘   │
│ ┌─────────────────────┐  ┌─────────────────────────────┐   │
│ │ Leads Recentes      │  │ Tarefas Pendentes           │   │
│ │ [Tabela 5 itens]    │  │ [Lista com prioridade]      │   │
│ └─────────────────────┘  └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 13.3 KPIs (StatCards)

| KPI | Fonte | Cor | Perfil |
|-----|-------|-----|--------|
| Total Imóveis | count imoveis ativos | Azul | Todos |
| Total Clientes | count clientes ativos | Verde | Todos |
| Leads Ativos | count leads não FECHADO/PERDIDO | Laranja | Todos |
| Contratos Ativos | count contratos ATIVO | Roxo | Todos |
| Receita do Mês | sum cobranças PAGO no mês | Verde | Admin, Gestor |
| Cobranças Pendentes | count PENDENTE | Amarelo | Admin, Gestor |
| Inadimplentes | count ATRASADO | Vermelho | Admin, Gestor |
| Tarefas Pendentes | count PENDENTE do usuário | Cinza | Todos |

Cada card exibe: valor atual, variação vs. mês anterior (%), ícone, animação counter-up.

### 13.4 Gráficos (Recharts)

| Gráfico | Tipo | Dados |
|---------|------|-------|
| Pipeline de Vendas | Funil / Barras horizontais | Leads por status |
| Imóveis por Status | Barras verticais | DISPONIVEL, RESERVADO, VENDIDO... |
| Receita Mensal | Linha (12 meses) | Soma cobranças PAGO por mês |
| Conversão de Leads | Pizza | FECHADO vs PERDIDO vs Em andamento |

### 13.5 Tabelas Resumo

| Tabela | Colunas | Link |
|--------|---------|------|
| Leads Recentes | Título, cliente, status, data | → /crm |
| Próximas Cobranças | Descrição, valor, vencimento, status | → /financeiro |
| Tarefas Pendentes | Título, prioridade, prazo | → /tarefas |

### 13.6 Versão Corretor (simplificada)
- KPIs: Meus imóveis, Meus leads, Minhas tarefas, Minhas comissões
- Gráfico: Meu pipeline pessoal
- Sem dados financeiros globais

### 13.7 Versão Mobile
- KPIs em carrossel horizontal (swipe)
- Gráficos empilhados verticalmente
- Tabelas viram cards compactos

### 13.8 Dados da API

```
GET /api/v1/dashboard?periodo=mes

Response:
{
  "kpis": { "imoveis": 142, "imoveisVariacao": 5, ... },
  "graficos": {
    "pipeline": [{ "status": "NOVO", "count": 8 }, ...],
    "imoveisStatus": [...],
    "receitaMensal": [{ "mes": "2026-01", "valor": 42000 }, ...]
  },
  "leadsRecentes": [...],
  "proximasCobrancas": [...],
  "tarefasPendentes": [...]
}
```

---

## 14. Planejamento do Módulo Imóveis

### 14.1 Objetivo
Gestão completa do portfólio de imóveis — o coração do CRM imobiliário.

### 14.2 Funcionalidades

| Funcionalidade | Fase | Prioridade |
|----------------|------|------------|
| CRUD completo | 1 | P0 |
| Listagem paginada | 2 | P0 |
| Filtros avançados | 2 | P0 |
| Página de detalhe | 2 | P0 |
| Galeria de fotos | 3 | P0 |
| Upload de vídeo | 3 | P1 |
| Google Maps (pin) | 3 | P1 |
| Toggle tabela/grid | 2 | P1 |
| Imóvel em destaque | 2 | P2 |
| Gerar descrição IA | 4 | P1 |
| Exportar catálogo PDF | 2 | P2 |
| Integração portais | 6 | P2 |

### 14.3 Tela Listagem — Filtros

| Filtro | Tipo | Valores |
|--------|------|---------|
| Busca | Texto | Título, código, endereço |
| Status | Select | Todos, Disponível, Reservado, Vendido, Alugado |
| Finalidade | Select | Venda, Aluguel, Ambos |
| Tipo | Select | Casa, Apto, Terreno, Comercial, Rural |
| Cidade | Select | Dinâmico por empresa |
| Faixa preço | Range | Min — Max |
| Quartos | Select | 1+, 2+, 3+, 4+ |
| Corretor | Select | Lista de corretores |

### 14.4 Tela Detalhe — Seções

1. **Galeria** — carrossel de fotos + player de vídeo
2. **Informações** — todos os campos do imóvel em cards organizados
3. **Localização** — Google Maps com pin + endereço completo
4. **Corretor** — card com foto, nome, contato
5. **Leads vinculados** — tabela de leads interessados
6. **Contratos** — histórico de contratos do imóvel
7. **Ações** — Editar, Alterar status, Compartilhar, Gerar descrição IA

### 14.5 Regras de Negócio

| Regra | Descrição |
|-------|-----------|
| Código auto | IMV-0001, IMV-0002... por empresa |
| Limite plano | Starter: 50, Professional: 500, Enterprise: ilimitado |
| Corretor | Vê seus imóveis + imóveis sem corretor |
| Status automático | Contrato ativo altera status do imóvel |
| Soft delete | Exclusão marca ativo=false, status=INATIVO |

### 14.6 Formulário de Cadastro — Campos

**Obrigatórios:** título, finalidade, tipo, endereço, bairro, cidade, estado  
**Opcionais:** código (auto), descrição, valores, CEP, quartos, suites, banheiros, vagas, áreas, IPTU, condomínio, comodidades, corretor

---

## 15. Planejamento do Módulo Clientes

### 15.1 Objetivo
Gestão unificada de todos os contatos: compradores, inquilinos, leads e proprietários.

### 15.2 Estratégia de Módulos

```
Cliente (entidade única no banco)
├── /clientes      → todos exceto PROPRIETARIO
├── /proprietarios → filtro tipo=PROPRIETARIO
└── /corretores    → entidade Usuario tipo=CORRETOR
```

### 15.3 Funcionalidades — Clientes

| Funcionalidade | Fase | Prioridade |
|----------------|------|------------|
| CRUD | 1 | P0 |
| Busca e filtros | 2 | P0 |
| Página de detalhe | 2 | P0 |
| Histórico de interações | 2 | P1 |
| Vinculação com leads | 1 | P0 |
| Vinculação com contratos | 1 | P0 |
| Enviar WhatsApp | 3 | P1 |
| Tags/etiquetas | 2 | P2 |
| Importar CSV | 2 | P2 |

### 15.4 Tela Detalhe do Cliente — Seções

1. **Perfil** — nome, contatos, CPF/CNPJ, tipo, tags
2. **Leads** — leads vinculados com status
3. **Contratos** — contratos como cliente ou proprietário
4. **Imóveis** — imóveis de sua propriedade (se proprietário)
5. **Agenda** — eventos vinculados
6. **WhatsApp** — histórico de mensagens
7. **Notas** — campo livre + timeline de interações

### 15.5 Funcionalidades — Proprietários

| Funcionalidade | Fase |
|----------------|------|
| Listagem filtrada (tipo=PROPRIETARIO) | 2 |
| Qtd imóveis por proprietário | 2 |
| Contratos de administração | 2 |
| Repasse de aluguel (futuro) | 5 |

### 15.6 Funcionalidades — Corretores

| Funcionalidade | Fase |
|----------------|------|
| Cards com stats (imóveis, leads, vendas) | 2 |
| Ranking de vendas | 2 |
| Comissões acumuladas | 2 |
| Agenda do corretor | 2 |
| CRECI e documentação | 2 |

### 15.7 Tipos de Cliente

| Tipo | Descrição | Módulo |
|------|-----------|--------|
| COMPRADOR | Interessado em comprar | Clientes |
| INQUILINO | Interessado em alugar | Clientes |
| LEAD | Contato inicial sem qualificação | Clientes |
| PROPRIETARIO | Dono de imóvel | Proprietários |

---

## 16. Planejamento do Módulo Financeiro

### 16.1 Objetivo
Controle completo de cobranças, pagamentos, inadimplência e projeção de receita.

### 16.2 Funcionalidades

| Funcionalidade | Fase | Prioridade |
|----------------|------|------------|
| Listagem de cobranças | 1 | P0 |
| Resumo financeiro (KPIs) | 1 | P0 |
| Registrar pagamento | 1 | P0 |
| Gerar cobranças mensais | 1 | P0 |
| Filtro por mês/ano/status | 2 | P0 |
| Lista de inadimplentes | 2 | P0 |
| Projeção de receita | 2 | P1 |
| Gráfico receita mensal | 2 | P1 |
| Notificação cobrança WhatsApp | 3 | P1 |
| Boleto/PIX integrado | 5 | P2 |
| Repasse proprietário | 5 | P2 |

### 16.3 Layout da Tela

```
┌─────────────────────────────────────────────────────────────┐
│  Financeiro                    [Gerar Cobranças do Mês]      │
├──────────┬──────────┬──────────┬────────────────────────────┤
│ Recebido │ Pendente │Inadimpl. │ Previsto Mês               │
│ R$32.400 │ R$8.200  │ R$2.100  │ R$42.700                   │
├──────────┴──────────┴──────────┴────────────────────────────┤
│ Filtros: [Status ▼] [Mês ▼] [Ano ▼] [Contrato ▼]          │
├─────────────────────────────────────────────────────────────┤
│ Tabela de Cobranças                                          │
│ Descrição | Contrato | Valor | Vencimento | Status | Ações │
│ Aluguel Jan | CTR-2026-0003 | R$2.200 | 10/01 | PAGO | —   │
│ Aluguel Fev | CTR-2026-0003 | R$2.200 | 10/02 | PENDENTE | Pagar │
│ Aluguel Dez | CTR-2026-0007 | R$1.800 | 05/12 | ATRASADO | Pagar │
└─────────────────────────────────────────────────────────────┘
```

### 16.4 Status de Cobrança — Fluxo

```
PENDENTE ──(pagamento registrado)──► PAGO
PENDENTE ──(vencimento passou)──► ATRASADO
PENDENTE ──(cancelamento)──► CANCELADO
ATRASADO ──(pagamento registrado)──► PAGO
```

### 16.5 Job Automático (Cron)

| Job | Frequência | Ação |
|-----|-----------|------|
| Gerar cobranças | Diário 06:00 | Cria cobranças do mês para contratos ativos |
| Marcar atrasadas | Diário 06:30 | PENDENTE + vencimento < hoje → ATRASADO |
| Notificar cobrança | Diário 08:00 | WhatsApp/e-mail 3 dias antes do vencimento |
| Notificar inadimplência | Semanal | Relatório de inadimplentes para gestor |

### 16.6 Comissões (submódulo)

| Funcionalidade | Descrição |
|----------------|-----------|
| Cálculo automático | Ao ativar contrato: comissão = valor × percentual |
| Fluxo | PENDENTE → APROVADA (gestor) → PAGA |
| Visibilidade | Corretor vê suas; gestor vê todas |

### 16.7 Relatórios Financeiros

| Relatório | Conteúdo | Formato |
|-----------|----------|---------|
| Receita mensal | Cobranças pagas por mês | PDF, Excel |
| Inadimplência | Cobranças atrasadas com dias | PDF, Excel |
| Contratos ativos | Valor total de contratos | PDF |
| Comissões | Comissões por corretor/período | PDF, Excel |
| DRE simplificado | Receita - inadimplência | PDF |

---

## 17. Planejamento da IA

### 17.1 Objetivo
Diferencial competitivo — tornar o SUSSAI o CRM imobiliário mais inteligente do Brasil.

### 17.2 Provider e Infraestrutura

| Aspecto | Decisão |
|---------|---------|
| Provider primário | OpenAI API (GPT-4o-mini para custo, GPT-4o para tarefas complexas) |
| Fallback | Anthropic Claude (futuro) |
| Embeddings | text-embedding-3-small (busca semântica de imóveis) |
| Rate limit | 50 requisições/dia por empresa (Starter), 500 (Professional), ilimitado (Enterprise) |
| Custo estimado | ~R$ 0,02 por descrição, ~R$ 0,05 por conversa |

### 17.3 Funcionalidades de IA

#### F1 — Assistente Chat (P0, Fase 4)
| Aspecto | Detalhe |
|---------|---------|
| Interface | Chat lateral ou tela dedicada /ia |
| Contexto | Pode ser livre ou vinculado a imóvel/lead/cliente |
| Exemplos | "Quais leads estão parados há mais de 7 dias?", "Resuma o contrato CTR-2026-0003" |
| Implementação | RAG com dados da empresa (leads, imóveis, contratos) |

#### F2 — Gerar Descrição de Imóvel (P0, Fase 4)
| Aspecto | Detalhe |
|---------|---------|
| Trigger | Botão "Gerar com IA" no formulário/detalhe do imóvel |
| Input | Dados estruturados do imóvel (tipo, quartos, bairro, comodidades) |
| Output | Texto marketing 150-300 palavras, tom profissional |
| Ação | Botão "Usar esta descrição" preenche o campo |

**Prompt template:**
```
Você é um corretor de imóveis experiente no Brasil.
Gere uma descrição atrativa para o seguinte imóvel:
- Tipo: {tipo}
- Finalidade: {finalidade}
- Localização: {bairro}, {cidade}/{estado}
- Quartos: {quartos}, Suítes: {suites}
- Área: {areaConstruida}m²
- Diferenciais: {comodidades}
Tom: profissional, persuasivo, sem exageros.
Máximo: 250 palavras.
```

#### F3 — Scoring de Leads (P1, Fase 4)
| Aspecto | Detalhe |
|---------|---------|
| Trigger | Automático ao criar/atualizar lead + botão manual |
| Score | 0-100 (probabilidade de conversão) |
| Fatores | Tempo no pipeline, valor, interações, visitas realizadas, origem |
| Visual | Badge colorido no card do kanban (verde >70, amarelo 40-70, vermelho <40) |
| Temperatura | FRIO (<40), MORNO (40-70), QUENTE (>70) |

#### F4 — Sugestão de Imóveis (P1, Fase 4)
| Aspecto | Detalhe |
|---------|---------|
| Trigger | Botão no perfil do cliente/lead |
| Input | Perfil do cliente + preferências + histórico |
| Output | Lista top 5 imóveis compatíveis com % de match |
| Técnica | Embeddings + similaridade coseno |

#### F5 — Resumo de Pipeline (P2, Fase 4)
| Aspecto | Detalhe |
|---------|---------|
| Trigger | Botão no dashboard ou CRM |
| Output | Resumo executivo: leads quentes, ações pendentes, previsão de fechamento |

#### F6 — Resposta WhatsApp Sugerida (P2, Fase 4)
| Aspecto | Detalhe |
|---------|---------|
| Trigger | Ao abrir chat WhatsApp com cliente |
| Input | Histórico + dados do lead/imovel |
| Output | 3 sugestões de resposta |

### 17.4 Arquitetura IA

```
Frontend → POST /api/v1/ia/...
  → iaService
    → Monta prompt com contexto (dados da empresa)
    → openAiProvider.chat(messages)
    → Salva ConversaIA + MensagemIA
    → Retorna resposta
```

### 17.5 Segurança e Privacidade IA

| Regra | Descrição |
|-------|-----------|
| Isolamento | IA só acessa dados da empresa do JWT |
| Sem treinamento | Dados não usados para treinar modelos (API OpenAI) |
| Log | Toda interação salva em ConversaIA/MensagemIA |
| Opt-out | Empresa pode desativar IA nas configurações |
| Limite | Rate limit por plano |

### 17.6 Métricas de Sucesso IA

| Métrica | Meta |
|---------|------|
| Adoção | 60% dos corretores usam IA no primeiro mês |
| Descrições geradas | 500+ por mês (empresa média) |
| Tempo economizado | 15 min/imóvel na descrição |
| NPS assistente | > 8.0 |

---

## 18. Planejamento do Multiempresa

### 18.1 Modelo Multi-tenant

**Estratégia:** Shared Database + Shared Schema + Discriminator Column (`empresaId`)

| Aspecto | Decisão |
|---------|---------|
| Isolamento | Coluna `empresaId` em toda tabela de negócio |
| Enforcement | Repository base + middleware (nunca do body) |
| Unicidade | Constraints compostas por empresa |
| Escalabilidade | Suporta 10.000+ empresas sem mudança de arquitetura |

### 18.2 Hierarquia Organizacional

```
SUSSAI (plataforma)
└── Empresa (tenant) — Imobiliária A
    ├── Usuários (ADMIN, GERENTE, CORRETOR)
    ├── Imóveis
    ├── Clientes
    ├── Leads
    ├── Contratos
    ├── Financeiro
    └── Configurações
└── Empresa (tenant) — Imobiliária B
    └── ... (dados totalmente isolados)
```

### 18.3 Ciclo de Vida da Empresa

```
REGISTRO → TRIAL (14 dias) → ATIVA → SUSPENSA → CANCELADA
                │                │         │
                │                │         └── Dados mantidos 90 dias
                │                └── Pagamento em dia
                └── Professional trial automático
```

### 18.4 Limites por Plano

| Recurso | Starter | Professional | Enterprise |
|---------|---------|-------------|------------|
| Imóveis | 50 | 500 | Ilimitado |
| Usuários | 3 | 15 | Ilimitado |
| Armazenamento | 1 GB | 10 GB | 100 GB |
| Requisições IA/dia | 10 | 100 | Ilimitado |
| WhatsApp/mês | — | 500 | Ilimitado |
| Relatórios/mês | 5 | 50 | Ilimitado |
| Suporte | E-mail | Chat | Dedicado |

**Enforcement:**
```
planLimitMiddleware('imoveis'):
  count = await imovelRepo.count(empresaId)
  if count >= empresa.limiteImoveis → throw PlanLimitError
```

### 18.5 Onboarding de Nova Empresa

| Passo | Ação | Tela |
|-------|------|------|
| 1 | Registro | /registrar |
| 2 | Tour guiado (5 passos) | Dashboard overlay |
| 3 | Cadastrar primeiro imóvel | /imoveis (wizard) |
| 4 | Convidar corretores | /configuracoes/equipe |
| 5 | Configurar integrações | /configuracoes/integracoes |

### 18.6 Super Admin (Fase 5)

Painel separado para equipe SUSSAI gerenciar a plataforma:

| Funcionalidade | Descrição |
|----------------|-----------|
| Listar empresas | Todas as tenants com status e plano |
| Suspender empresa | Bloqueia acesso de todos os usuários |
| Métricas globais | Total empresas, MRR, churn, uso |
| Impersonar | Login como admin de uma empresa (suporte) |
| Comunicados | Enviar aviso para todas as empresas |

### 18.7 Segurança Multi-tenant

| Ameaça | Mitigação |
|--------|-----------|
| Acesso cross-tenant | empresaId exclusivamente do JWT |
| IDOR (Insecure Direct Object Reference) | Repository filtra empresaId em toda query |
| Mass assignment | DTOs com whitelist de campos |
| Enumeração de IDs | Verificar ownership antes de retornar 404 |
| Vazamento em logs | Nunca logar dados de outra empresa |
| Cache cross-tenant | Cache key inclui empresaId |

---

## 19. Planejamento do Deploy

### 19.1 Ambientes

| Ambiente | URL | Branch | Banco |
|----------|-----|--------|-------|
| Development | localhost:5173 / :3000 | local | PostgreSQL Docker |
| Staging | staging.sussai.com.br | develop | PostgreSQL dedicado |
| Production | app.sussai.com.br | main | PostgreSQL RDS/Supabase |

### 19.2 Infraestrutura de Produção (Fase 5)

```
┌─────────────────────────────────────────────────┐
│                   Cloudflare CDN                   │
│              (DNS, SSL, DDoS, Cache)               │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│              VPS / Cloud (recomendado)            │
│                                                   │
│  ┌─────────────┐  ┌─────────────┐               │
│  │   Nginx     │  │   Nginx     │               │
│  │  (Frontend) │  │   (API)     │               │
│  │  SPA build  │  │  proxy_pass │               │
│  └─────────────┘  └──────┬──────┘               │
│                           │                       │
│                    ┌──────▼──────┐               │
│                    │  Backend    │               │
│                    │  Node.js    │               │
│                    │  (PM2/Docker)│               │
│                    └──────┬──────┘               │
│                           │                       │
│  ┌─────────────┐  ┌──────▼──────┐               │
│  │  S3 / R2    │  │ PostgreSQL  │               │
│  │  (mídia)    │  │  (banco)    │               │
│  └─────────────┘  └─────────────┘               │
└─────────────────────────────────────────────────┘
```

### 19.3 Opções de Hospedagem (recomendação)

| Componente | Opção 1 (econômica) | Opção 2 (escalável) |
|------------|---------------------|---------------------|
| Frontend | Vercel / Netlify | Cloudflare Pages |
| Backend | Railway / Render | AWS ECS / DigitalOcean |
| Banco | Supabase / Railway PG | AWS RDS PostgreSQL |
| Storage | Cloudflare R2 | AWS S3 |
| DNS/CDN | Cloudflare | Cloudflare |

**Recomendação inicial:** Railway (backend + PG) + Cloudflare Pages (frontend) + R2 (storage)  
**Custo estimado MVP:** R$ 200-500/mês para até 100 empresas

### 19.4 CI/CD Pipeline (GitHub Actions)

```yaml
# Fluxo:
Push → GitHub Actions
  ├── Lint (ESLint + TypeScript check)
  ├── Test (Jest/Vitest)
  ├── Build (backend + frontend)
  ├── Deploy Staging (branch develop, automático)
  └── Deploy Production (branch main, manual approval)
```

| Stage | Trigger | Ação |
|-------|---------|------|
| CI | Todo push/PR | Lint + typecheck + test + build |
| CD Staging | Merge em develop | Deploy automático |
| CD Production | Merge em main | Deploy com aprovação manual |
| Migrations | Deploy backend | `prisma migrate deploy` |

### 19.5 Variáveis de Ambiente (Produção)

| Variável | Descrição |
|----------|-----------|
| DATABASE_URL | Connection string PostgreSQL |
| JWT_SECRET | Chave 256-bit aleatória |
| PORT | 3000 |
| NODE_ENV | production |
| CORS_ORIGIN | https://app.sussai.com.br |
| STORAGE_PROVIDER | s3 |
| S3_BUCKET | sussai-media |
| S3_REGION | sa-east-1 |
| S3_ACCESS_KEY | — |
| S3_SECRET_KEY | — |
| OPENAI_API_KEY | — |
| WHATSAPP_API_TOKEN | — |
| GOOGLE_MAPS_API_KEY | — |
| ASAAS_API_KEY | — |
| SENTRY_DSN | — |

### 19.6 Monitoramento (Fase 5+)

| Ferramenta | Uso |
|------------|-----|
| Sentry | Erros frontend e backend |
| Uptime Robot | Monitoramento disponibilidade |
| Grafana + Prometheus | Métricas de performance |
| Winston → CloudWatch | Logs estruturados |

### 19.7 Backup e Disaster Recovery

| Item | Frequência | Retenção |
|------|-----------|----------|
| Banco PostgreSQL | Diário (pg_dump) | 30 dias |
| Arquivos S3 | Versioning nativo | 90 dias |
| Código | Git (GitHub) | Permanente |
| RTO (Recovery Time) | < 4 horas | — |
| RPO (Recovery Point) | < 24 horas | — |

---

## 20. Planejamento do Docker

### 20.1 Objetivo
Ambiente de desenvolvimento reproduzível com um comando: `docker compose up`

### 20.2 Serviços

| Serviço | Imagem | Porta | Descrição |
|---------|--------|-------|-----------|
| postgres | postgres:16-alpine | 5432 | Banco de dados |
| backend | Build local (Dockerfile) | 3000 | API Node.js |
| frontend | Build local (Dockerfile) | 5173 (dev) / 80 (prod) | SPA React |

### 20.3 docker-compose.yml (Development)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: sussai
      POSTGRES_PASSWORD: sussai_dev
      POSTGRES_DB: sussai_crm
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U sussai"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: development
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://sussai:sussai_dev@postgres:5432/sussai_crm
      JWT_SECRET: dev-secret-change-in-production
      PORT: 3000
      NODE_ENV: development
    volumes:
      - ./backend/src:/app/src        # Hot reload
      - ./backend/prisma:/app/prisma
    depends_on:
      postgres:
        condition: service_healthy
    command: npm run dev

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: development
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:3000
    volumes:
      - ./frontend/src:/app/src        # Hot reload
    depends_on:
      - backend
    command: npm run dev

volumes:
  pgdata:
```

### 20.4 Dockerfile Backend

```
Estágios:
1. base        → node:20-alpine, instala dependências
2. development → expõe 3000, CMD npm run dev (nodemon)
3. build       → compila TypeScript
4. production  → node:20-alpine, só dist + node_modules prod, CMD node dist/server.js
```

### 20.5 Dockerfile Frontend

```
Estágios:
1. base        → node:20-alpine, instala dependências
2. development → expõe 5173, CMD npm run dev (Vite)
3. build       → npm run build → dist/
4. production  → nginx:alpine, copia dist/, nginx.conf
```

### 20.6 nginx.conf (Frontend Production)

```
- Serve SPA de /usr/share/nginx/html
- Fallback index.html para React Router (try_files)
- Proxy /api → backend:3000
- Gzip habilitado
- Cache de assets estáticos (1 ano)
- Headers de segurança (X-Frame-Options, CSP)
```

### 20.7 Comandos Docker

| Comando | Ação |
|---------|------|
| `docker compose up` | Inicia todos os serviços (dev) |
| `docker compose up -d` | Inicia em background |
| `docker compose down` | Para todos os serviços |
| `docker compose down -v` | Para e remove volumes (reset banco) |
| `docker compose exec backend npx prisma migrate dev` | Rodar migrations |
| `docker compose exec backend npx prisma db seed` | Popular dados demo |
| `docker compose logs -f backend` | Ver logs do backend |
| `docker compose -f docker-compose.prod.yml up` | Produção |

### 20.8 Fluxo de Desenvolvimento com Docker

```
1. git clone → cd sistema-imobiliaria
2. cp backend/.env.example backend/.env
3. cp frontend/.env.example frontend/.env
4. docker compose up
5. Backend: http://localhost:3000/api/docs (Swagger)
6. Frontend: http://localhost:5173
7. Registro: http://localhost:5173/registrar
8. Código alterado → hot reload automático
```

### 20.9 docker-compose.prod.yml (Produção)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: sussai_crm
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: always

  backend:
    build:
      context: ./backend
      target: production
    environment:
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    restart: always
    depends_on:
      - postgres

  frontend:
    build:
      context: ./frontend
      target: production
    ports:
      - "80:80"
      - "443:443"
    restart: always
    depends_on:
      - backend

volumes:
  pgdata:
```

---

## Aprovação

Este documento consolida o planejamento completo do **SUSSAI CRM** em 20 seções.

| Item | Quantidade |
|------|-----------|
| Entidades | 18 (8 existentes + 10 novas) |
| Enums | 24 |
| Telas | 21 |
| APIs | ~95 endpoints |
| Fases de desenvolvimento | 6 |
| Duração estimada até SaaS comercial | ~34 semanas |

### Próximo passo

**Aguardando sua aprovação** para iniciar a Fase 1 — Fundação Arquitetural.

Após aprovação, a implementação seguirá a ordem:
1. Docker Compose
2. Migração TypeScript (backend)
3. Clean Architecture (backend)
4. Migração TypeScript (frontend)
5. Componentes shared + tema escuro
6. Swagger + CI

---

*Documento gerado pelo time de arquitetura SUSSAI CRM.*  
*Nenhum código será escrito até aprovação explícita.*
