# SUSSAI CRM — MASTER PLAN

**Sistema Inteligente para Imobiliárias**

| Campo | Valor |
|-------|-------|
| **Documento** | MASTER_PLAN.md |
| **Versão** | 1.0 |
| **Data** | Julho/2026 |
| **Status** | Fonte oficial do projeto — aguardando aprovação |
| **Baseline** | Ver [AUDITORIA.md](AUDITORIA.md) para o estado real do código |

> **IMPORTANTE:** Este documento descreve o **estado-alvo** do SUSSAI CRM.  
> Para o que **realmente existe hoje** no repositório, consulte [AUDITORIA.md](AUDITORIA.md).

### Estado Atual Verificado (15/Jul/2026)

| Métrica | Existe hoje | Meta (este documento) |
|---------|-------------|----------------------|
| Linguagem | JavaScript | TypeScript |
| Tabelas Prisma | **8** | 18 |
| Enums | **10** | 24 |
| Endpoints API | **34** (sem `/api/v1`) | ~95 |
| Rotas frontend | **12** | 21 |
| Itens sidebar | **8** | 14 |
| Perfil gestor | **GERENTE** (no código) | GERENTE |
| Docker / Swagger / Testes | **Não existem** | Fase 1 |

---

## Índice

1. [Visão do Produto](#1-visão-do-produto)
2. [Objetivos](#2-objetivos)
3. [Público-alvo](#3-público-alvo)
4. [Diferenciais Competitivos](#4-diferenciais-competitivos)
5. [Tecnologias Utilizadas](#5-tecnologias-utilizadas)
6. [Arquitetura Completa](#6-arquitetura-completa)
7. [Estrutura de Pastas](#7-estrutura-de-pastas)
8. [Banco de Dados Completo](#8-banco-de-dados-completo)
9. [Todos os Módulos do Sistema](#9-todos-os-módulos-do-sistema)
10. [Fluxos de Navegação](#10-fluxos-de-navegação)
11. [Permissões](#11-permissões)
12. [Roadmap de Desenvolvimento](#12-roadmap-de-desenvolvimento)
13. [Padrão Visual](#13-padrão-visual)
14. [Identidade Visual](#14-identidade-visual)
15. [Design System](#15-design-system)
16. [Componentes Reutilizáveis](#16-componentes-reutilizáveis)
17. [APIs](#17-apis)
18. [Convenções de Código](#18-convenções-de-código)
19. [Estratégia de Deploy](#19-estratégia-de-deploy)
20. [Checklist de Qualidade](#20-checklist-de-qualidade)

---

## 1. Visão do Produto

### 1.1 Declaração de Visão

> **Ser o CRM imobiliário mais moderno, inteligente e amado do Brasil** — um software que imobiliárias escolhem não apenas pelas funcionalidades, mas pela experiência de uso.

### 1.2 O que é o SUSSAI CRM

SUSSAI (Sistema Inteligente para Imobiliárias) é um **SaaS comercial por assinatura** que centraliza toda a operação de uma imobiliária em uma única plataforma web:

- Gestão de imóveis com galeria, mapa e portfólio digital
- CRM com pipeline visual de vendas
- Gestão de clientes, proprietários e corretores
- Contratos, financeiro e comissões integrados
- Agenda de visitas e compromissos
- Inteligência artificial nativa
- Comunicação via WhatsApp
- Multiempresa com isolamento total de dados

### 1.3 Problema que Resolve

| Dor do mercado | Como o SUSSAI resolve |
|----------------|----------------------|
| CRMs imobiliários com interface datada | UI premium, moderna, responsiva |
| Sistemas lentos e pesados | Performance extrema em cada camada |
| Ferramentas genéricas (Salesforce, HubSpot) | 100% especializado no mercado imobiliário BR |
| Múltiplos sistemas desconectados | Tudo em uma plataforma unificada |
| Falta de inteligência nos processos | IA para descrições, scoring e automações |
| Dificuldade de adoção pela equipe | UX intuitiva, onboarding guiado |
| Custo elevado de ERPs tradicionais | Planos acessíveis a partir de R$ 97/mês |

### 1.4 Proposta de Valor

```
Para imobiliárias que precisam profissionalizar sua operação,
o SUSSAI CRM é a plataforma inteligente
que unifica imóveis, vendas, financeiro e equipe
com uma experiência superior a qualquer concorrente.
Diferente de CRMs genéricos ou sistemas legados,
o SUSSAI é feito exclusivamente para o mercado imobiliário brasileiro,
com IA nativa e design de referência.
```

### 1.5 Modelo de Negócio

| Aspecto | Definição |
|---------|-----------|
| Tipo | SaaS B2B por assinatura mensal |
| Monetização | Planos Starter, Professional, Enterprise |
| Trial | 14 dias no plano Professional |
| Canal | Venda direta (site) + inside sales |
| Mercado | Brasil — imobiliárias de 1 a 500 corretores |
| Meta ano 1 | 500 imobiliárias pagantes |
| Meta ano 3 | 5.000 imobiliárias · líder de mercado |

### 1.6 Métricas de Sucesso do Produto (North Star)

| Métrica | Meta 12 meses |
|---------|---------------|
| Imobiliárias ativas | 500 |
| MRR | R$ 150.000 |
| Churn mensal | < 3% |
| NPS | > 50 |
| DAU/MAU | > 60% |
| Tempo médio de onboarding | < 15 minutos |
| Tickets de suporte/imobiliária/mês | < 2 |

---

## 2. Objetivos

### 2.1 Objetivos Estratégicos

| # | Objetivo | Prazo |
|---|----------|-------|
| OE-01 | Lançar MVP comercial com 14 módulos funcionais | 6 meses |
| OE-02 | Atingir 100 imobiliárias pagantes | 9 meses |
| OE-03 | Integrar IA como diferencial de mercado | 8 meses |
| OE-04 | Performance top 10% do mercado (LCP < 2.5s) | 6 meses |
| OE-05 | Zero incidentes de vazamento cross-tenant | Contínuo |
| OE-06 | NPS > 50 entre corretores | 12 meses |

### 2.2 Objetivos de Produto

| # | Objetivo | Critério de sucesso |
|---|----------|---------------------|
| OP-01 | Dashboard que responde "como está meu negócio?" em 3s | 8 KPIs + 4 gráficos carregando < 2s |
| OP-02 | Pipeline CRM com drag-and-drop real | Mover lead entre 7 estágios sem reload |
| OP-03 | Imóvel com galeria profissional | Upload de 20 fotos + 1 vídeo por imóvel |
| OP-04 | Financeiro automatizado | Cobranças mensais geradas automaticamente |
| OP-05 | IA que economiza 15 min/imóvel | Descrição gerada em 1 clique |
| OP-06 | WhatsApp integrado ao CRM | Enviar mensagem sem sair do sistema |
| OP-07 | Onboarding em 15 minutos | Tour guiado + primeiro imóvel cadastrado |

### 2.3 Objetivos Técnicos

| # | Objetivo | Critério de sucesso |
|---|----------|---------------------|
| OT-01 | 100% TypeScript no stack | Zero arquivos .js no src |
| OT-02 | Clean Architecture no backend | Controllers sem acesso direto ao Prisma |
| OT-03 | Cobertura de testes > 70% nos services | Jest/Vitest no CI |
| OT-04 | API documentada 100% no Swagger | Todo endpoint em /api/docs |
| OT-05 | Ambiente reproduzível com Docker | `docker compose up` funcional |
| OT-06 | API p95 < 200ms | Monitoramento em produção |
| OT-06 | Uptime > 99.5% | Monitoramento em produção |

### 2.4 Objetivos de UX

| # | Objetivo | Critério de sucesso |
|---|----------|---------------------|
| OUX-01 | Interface premium e moderna | Aprovação em teste com 5 corretores |
| OUX-02 | Tema claro e escuro | Toggle funcional com persistência |
| OUX-03 | 100% responsivo | Funcional em mobile, tablet, desktop |
| OUX-04 | Animações suaves sem impacto na performance | 60fps nas transições |
| OUX-05 | Acessibilidade WCAG 2.1 AA | Auditoria sem erros críticos |
| OUX-06 | Consistência visual em 100% das telas | Design System aplicado |

### 2.5 O que NÃO é objetivo (anti-escopo)

- Não é projeto de estudos ou demonstração
- Não é CRM genérico adaptado
- Não é sistema de condomínio (diferente da Superlógica)
- Não é portal imobiliário público (Zap/Viva Real) na Fase 1-5
- Não é app mobile nativo na Fase 1-5
- Não é white-label na Fase 1-5

---

## 3. Público-alvo

### 3.1 Segmentos de Mercado

| Segmento | Tamanho estimado BR | Plano ideal | Prioridade |
|----------|---------------------|-------------|------------|
| Imobiliária individual (1-3 corretores) | ~80.000 | Starter | Alta |
| Imobiliária pequena (4-15 corretores) | ~25.000 | Professional | **Principal** |
| Imobiliária média (16-50 corretores) | ~5.000 | Professional/Enterprise | Alta |
| Rede/franquia (50+ corretores) | ~500 | Enterprise | Média (Fase 6) |

### 3.2 Personas

#### Persona 1 — Ricardo, o Administrador
| Atributo | Detalhe |
|----------|---------|
| Cargo | Dono/sócio da imobiliária |
| Idade | 40-55 anos |
| Dor | Não tem visão clara do negócio; sistemas caros e complexos |
| Objetivo | Controlar equipe, financeiro e resultados em um só lugar |
| Uso do SUSSAI | Dashboard, financeiro, relatórios, configurações, plano |
| Perfil | ADMIN |
| Frequência | Diária (30 min) |

#### Persona 2 — Fernanda, a Gestora
| Atributo | Detalhe |
|----------|---------|
| Cargo | Gerente comercial |
| Idade | 30-45 anos |
| Dor | Dificuldade em acompanhar pipeline e performance da equipe |
| Objetivo | Bater metas de vendas, gerenciar corretores |
| Uso do SUSSAI | CRM, corretores, comissões, relatórios, agenda da equipe |
| Perfil | GERENTE |
| Frequência | Diária (2-3 horas) |

#### Persona 3 — Lucas, o Corretor
| Atributo | Detalhe |
|----------|---------|
| Cargo | Corretor de imóveis |
| Idade | 25-40 anos |
| Dor | Perde tempo com burocracia; CRMs lentos e feios |
| Objetivo | Vender mais, organizar leads, impressionar clientes |
| Uso do SUSSAI | Imóveis, CRM, agenda, clientes, IA, WhatsApp |
| Perfil | CORRETOR |
| Frequência | Diária (4+ horas) — **usuário principal** |

#### Persona 4 — Patrícia, a Proprietária
| Atributo | Detalhe |
|----------|---------|
| Cargo | Proprietária de imóveis (cliente da imobiliária) |
| Idade | 45-65 anos |
| Dor | Falta de transparência sobre seu imóvel |
| Objetivo | Saber status do aluguel/venda do seu imóvel |
| Uso do SUSSAI | Portal do proprietário (Fase 6 — fora do escopo inicial) |
| Perfil | Externo |
| Frequência | Semanal |

### 3.3 Jobs to Be Done (JTBD)

| Quando... | Eu quero... | Para que... |
|-----------|-------------|-------------|
| Inicio meu dia de trabalho | Ver resumo do meu pipeline e tarefas | Priorizar o que é urgente |
| Recebo um lead novo | Cadastrar e qualificar rapidamente | Não perder oportunidade |
| Vou mostrar um imóvel | Ter fotos, mapa e descrição profissional | Impressionar o cliente |
| Fecho uma venda | Gerar contrato e comissão automaticamente | Não perder tempo com burocracia |
| Final do mês | Ver relatório financeiro e de vendas | Tomar decisões estratégicas |
| Preciso de uma descrição | Gerar com IA em 1 clique | Publicar imóvel mais rápido |

---

## 4. Diferenciais Competitivos

### 4.1 Mapa Competitivo

| Concorrente | Preço/mês | Pontos fortes | Pontos fracos | Nossa vantagem |
|-------------|-----------|---------------|---------------|----------------|
| **Kenlo** | R$ 200-800 | Marca consolidada, financeiro | UI datada, lento | UX moderna, IA, performance |
| **Jetimob** | R$ 150-500 | Portais integrados | Interface confusa | Design premium, simplicidade |
| **Vista CRM** | R$ 100-400 | Pipeline de vendas | Pouco financeiro | Plataforma unificada |
| **Superlógica** | R$ 300-1000 | Financeiro robusto | Foco condomínio, caro | CRM especializado, preço menor |
| **Salesforce** | R$ 500+ | Poderoso, customizável | Genérico, caro, complexo | Imobiliário nativo, simples |
| **HubSpot** | R$ 400+ | Marketing automation | Não é imobiliário | Especialização BR |

### 4.2 Os 7 Diferenciais do SUSSAI

| # | Diferencial | Descrição | Impacto |
|---|-------------|-----------|---------|
| D1 | **Design Premium** | Interface moderna, animações, tema escuro | Primeira impressão · retenção |
| D2 | **Performance Extrema** | LCP < 2.5s, API < 200ms, lazy loading | Produtividade diária do corretor |
| D3 | **IA Nativa** | Descrições, scoring, sugestões, assistente | Economia de tempo · conversão |
| D4 | **Especialização BR** | Regras, termos e fluxos do mercado brasileiro | Adequação ao mercado |
| D5 | **Plataforma Unificada** | Imóveis + CRM + Financeiro + Agenda em um só lugar | Menos ferramentas |
| D6 | **WhatsApp Integrado** | Comunicação sem sair do CRM | Onde o corretor já está |
| D7 | **Preço Acessível** | A partir de R$ 97/mês | Barreira de entrada baixa |

### 4.3 Posicionamento

```
                    ESPECIALIZAÇÃO IMOBILIÁRIA
                            ▲
                            │
              SUSSAI CRM ★  │
                            │
         Vista CRM ●        │        ● Jetimob
                            │
    ● Kenlo                 │
                            │
────────────────────────────┼──────────────────────► PREÇO
                            │
         ● Superlógica      │
                            │
    ● Salesforce            │        ● HubSpot
                            │
                            ▼
                       GENÉRICO
```

**Posição:** Alto em especialização, baixo-médio em preço — melhor custo-benefício do mercado.

---

## 5. Tecnologias Utilizadas

### 5.1 Stack Obrigatória

| Camada | Tecnologia | Versão | Justificativa |
|--------|------------|--------|---------------|
| **Frontend** | React | 18+ | Ecossistema maduro, componentização |
| | TypeScript | 5+ | Tipagem, menos bugs, DX |
| | Vite | 5+ | Build ultrarrápido, HMR |
| | Material UI | 6+ | Design system robusto, acessível |
| | React Router | 7+ | SPA routing |
| | Axios | 1+ | HTTP client |
| **Backend** | Node.js | 20 LTS | Performance, ecossistema |
| | Express | 5+ | Framework HTTP maduro |
| | TypeScript | 5+ | Consistência com frontend |
| | Prisma ORM | 6+ | Type-safe, migrations |
| | PostgreSQL | 16+ | Robusto, JSON, escalável |
| | JWT | — | Auth stateless |
| | Multer | 2+ | Upload de arquivos |
| **Infra** | Docker | 24+ | Containerização |
| | Swagger/OpenAPI | 3+ | Documentação API |
| | GitHub | — | Versionamento + CI/CD |

### 5.2 Stack Complementar (por fase)

| Tecnologia | Uso | Fase |
|------------|-----|------|
| Zod | Validação backend + frontend | 1 |
| TanStack Query | Cache e data fetching | 1 |
| React Hook Form | Formulários | 1 |
| Framer Motion | Animações | 1 |
| Recharts | Gráficos dashboard | 2 |
| FullCalendar | Agenda | 2 |
| @dnd-kit | Drag-and-drop kanban | 2 |
| Winston | Logging estruturado | 1 |
| Jest / Vitest | Testes | 1-2 |
| Cloudflare R2 / S3 | Storage de mídia | 3 |
| Google Maps API | Geolocalização | 3 |
| WhatsApp Business API | Mensagens | 3 |
| OpenAI API | Inteligência artificial | 4 |
| Asaas / Stripe | Billing | 5 |
| Sentry | Monitoramento de erros | 5 |
| GitHub Actions | CI/CD | 1 |

### 5.3 O que NÃO usaremos

| Tecnologia | Motivo da exclusão |
|------------|-------------------|
| GraphQL | Complexidade desnecessária para o escopo |
| MongoDB | Dados relacionais exigem PostgreSQL |
| Next.js | SPA com Vite é suficiente; sem SSR necessário |
| Redux | TanStack Query + Context cobrem o estado |
| Microservices | Monolito modular escala até 10k+ tenants |
| Java/Spring | Stack Node unificada com frontend |

---

## 6. Arquitetura Completa

### 6.1 Diagrama de Arquitetura

```
┌──────────────────────────────────────────────────────────────────┐
│                        USUÁRIOS FINAIS                            │
│           Desktop · Tablet · Mobile (PWA futuro)                  │
└────────────────────────────┬─────────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼─────────────────────────────────────┐
│                     CDN (Cloudflare)                              │
│              SSL · DDoS · Cache estático · DNS                    │
└────────────┬────────────────────────────────┬────────────────────┘
             │                                │
┌────────────▼──────────┐    ┌────────────────▼───────────────────┐
│   FRONTEND (Nginx)    │    │         API (Nginx reverse proxy)   │
│   React SPA build     │    │                                     │
│   Vite + TypeScript   │    │  ┌─────────────────────────────┐   │
│   MUI + TanStack Query│    │  │     Express 5 + TypeScript   │   │
└───────────────────────┘    │  │                              │   │
                             │  │  Middleware Chain:           │   │
                             │  │  RateLimit → CORS → Auth →   │   │
                             │  │  Tenant → Role → Validate    │   │
                             │  │                              │   │
                             │  │  Clean Architecture:         │   │
                             │  │  Controller → Service →      │   │
                             │  │  Repository → Prisma         │   │
                             │  └──────────┬──────────────────┘   │
                             └─────────────┼────────────────────────┘
                                           │
              ┌────────────────────────────┼────────────────────┐
              │                            │                    │
┌─────────────▼──────┐  ┌──────────────────▼───┐  ┌───────────▼────────┐
│   PostgreSQL 16    │  │  Cloudflare R2 / S3  │  │  Serviços Externos │
│   (Prisma ORM)     │  │  Fotos · Vídeos · PDF│  │  OpenAI · WhatsApp │
│   Multi-tenant     │  │                      │  │  Google Maps · Email│
└────────────────────┘  └──────────────────────┘  └────────────────────┘
```

### 6.2 Bounded Contexts

| Contexto | Responsabilidade | Entidades principais |
|----------|------------------|---------------------|
| **Plataforma** | Auth, empresa, usuários, billing, audit | Empresa, Usuario, Assinatura, AuditLog |
| **Imóveis** | Portfólio, galeria, mapa | Imovel, Arquivo |
| **Pessoas** | Contatos e equipe | Cliente, Usuario (corretor) |
| **CRM** | Pipeline, agenda, tarefas | Lead, EventoAgenda, Tarefa |
| **Contratos** | Contratos, comissões, documentos | Contrato, Comissao, Arquivo |
| **Financeiro** | Cobranças, pagamentos | Cobranca |
| **Comunicação** | WhatsApp, e-mail | MensagemWhatsApp |
| **Inteligência** | IA, automações | ConversaIA, MensagemIA |

### 6.3 Camadas do Backend

```
REQUEST
  │
  ▼
┌─────────────────────────────────────────┐
│ PRESENTATION                             │
│ Routes · Controllers · Middlewares      │
│ Validators (Zod) · Swagger decorators   │
│ ❌ Proibido: regra de negócio, Prisma    │
├─────────────────────────────────────────┤
│ APPLICATION                              │
│ Services · Use Cases · DTOs             │
│ ❌ Proibido: req/res, SQL direto        │
├─────────────────────────────────────────┤
│ DOMAIN                                   │
│ Entities · Enums · Value Objects        │
│ Domain Errors · Business Rules          │
│ ❌ Proibido: dependência de framework   │
├─────────────────────────────────────────┤
│ INFRASTRUCTURE                           │
│ Repositories (Prisma) · Storage · Email │
│ WhatsApp · Maps · AI Provider           │
└─────────────────────────────────────────┘
  │
  ▼
DATABASE / EXTERNAL SERVICES
```

### 6.4 Camadas do Frontend

```
┌─────────────────────────────────────────┐
│ APP SHELL                                │
│ Router · Providers · Guards · Theme     │
├─────────────────────────────────────────┤
│ FEATURES (14 módulos)                    │
│ pages · components · hooks · services   │
│ types · schemas                          │
├─────────────────────────────────────────┤
│ SHARED                                   │
│ Components · Hooks · Utils · Constants │
└─────────────────────────────────────────┘
```

### 6.5 Decisões Arquiteturais (ADRs)

| ID | Decisão | Alternativas consideradas | Justificativa |
|----|---------|--------------------------|---------------|
| ADR-001 | Monorepo | Multi-repo | Simplicidade, código compartilhado |
| ADR-002 | Tenant por coluna | Schema por tenant | Padrão SaaS B2B, menor complexidade |
| ADR-003 | REST API | GraphQL | Swagger nativo, equipe menor |
| ADR-004 | JWT stateless | Sessions | Performance, escalabilidade horizontal |
| ADR-005 | Feature-based frontend | Layer-based | Co-location, escalabilidade de equipe |
| ADR-006 | Zod | Joi, class-validator | Tipos inferidos, compartilhável |
| ADR-007 | TanStack Query | Redux, SWR | Cache, invalidação, menos boilerplate |
| ADR-008 | S3-compatible storage | Disco local | Escalável para mídia |
| ADR-009 | OpenAI para IA | Modelo próprio | Custo/benefício, time-to-market |
| ADR-010 | Asaas para billing BR | Stripe | PIX/boleto nativo, mercado BR |

### 6.6 Requisitos Não-Funcionais

| Requisito | Meta | Medição |
|-----------|------|---------|
| Disponibilidade | 99.5% uptime | Uptime Robot |
| Performance API | p95 < 200ms | APM |
| Performance UI | LCP < 2.5s | Lighthouse |
| Escalabilidade | 5.000 tenants simultâneos | Load test |
| Segurança | Zero cross-tenant leak | Audit + testes |
| Acessibilidade | WCAG 2.1 AA | axe-core |
| Backup | RPO < 24h, RTO < 4h | pg_dump diário |
| LGPD | Conformidade total | Fase 5 |

---

## 7. Estrutura de Pastas

### 7.1 Monorepo

```
sistema-imobiliaria/
├── .github/workflows/          # CI/CD
│   ├── ci.yml
│   └── deploy.yml
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── src/
│   │   ├── config/             # env, prisma, swagger
│   │   ├── domain/             # entities, enums, errors
│   │   ├── application/        # services, dtos
│   │   ├── infrastructure/     # repositories, storage, ai
│   │   ├── presentation/       # controllers, routes, middlewares
│   │   ├── shared/             # logger, helpers, types
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tests/
│   ├── Dockerfile
│   ├── tsconfig.json
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/                # router, providers, guards
│   │   ├── features/           # 14 módulos
│   │   ├── shared/             # components, hooks, utils
│   │   ├── theme/              # light, dark, overrides
│   │   ├── assets/
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── tsconfig.json
│   └── package.json
├── docs/
│   ├── MASTER_PLAN.md          # ← ESTE DOCUMENTO
│   ├── PLANEJAMENTO_COMPLETO.md
│   ├── PROJETO.md
│   ├── ARQUITETURA.md
│   └── ROADMAP.md
├── docker-compose.yml
├── docker-compose.prod.yml
└── README.md
```

### 7.2 Feature Module (padrão para os 14 módulos)

```
features/{modulo}/
├── pages/              # Telas (lazy loaded)
├── components/         # Componentes específicos do módulo
├── hooks/              # use{Modulo}, use{Modulo}Mutations
├── services/           # {modulo}Api.ts
├── types/              # {modulo}.types.ts
└── schemas/            # {modulo}Schema.ts (Zod)
```

### 7.3 Convenções de Nomenclatura de Arquivos

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Componente React | PascalCase.tsx | `ImovelForm.tsx` |
| Hook | camelCase.ts | `useImoveis.ts` |
| Service/API | camelCase.ts | `imoveisApi.ts` |
| Types | camelCase.types.ts | `imovel.types.ts` |
| Schema Zod | camelCase.schema.ts | `imovel.schema.ts` |
| Controller | camelCaseController.ts | `imovelController.ts` |
| Service (BE) | camelCaseService.ts | `imovelService.ts` |
| Repository | camelCaseRepository.ts | `imovelRepository.ts` |
| Teste | *.test.ts / *.spec.ts | `imovelService.test.ts` |

---

## 8. Banco de Dados Completo

### 8.1 Estratégia

| Aspecto | Decisão |
|---------|---------|
| SGBD | PostgreSQL 16 |
| ORM | Prisma 6 |
| Multi-tenant | Coluna `empresaId` (shared schema) |
| PK | `id` SERIAL (Int) |
| Valores monetários | `Decimal(12,2)` |
| Timestamps | `createdAt` + `updatedAt` em toda tabela |
| Soft delete | Campo `ativo Boolean` |
| Migrations | Versionadas via Prisma Migrate |

### 8.2 Diagrama ER Simplificado

```
                    ┌──────────┐
                    │ Empresa  │ ← TENANT ROOT
                    └────┬─────┘
         ┌───────────┬───┴───┬──────────┬──────────┐
         ▼           ▼       ▼          ▼          ▼
    ┌────────┐ ┌────────┐ ┌──────┐ ┌─────────┐ ┌──────────┐
    │Usuario │ │ Imovel │ │Cliente│ │  Lead   │ │Contrato  │
    └───┬────┘ └───┬────┘ └──┬───┘ └────┬────┘ └────┬─────┘
        │          │         │          │           │
        │          └────┬────┘          │      ┌────▼─────┐
        │               │               │      │ Cobranca │
        │          ┌────▼────┐          │      └──────────┘
        │          │ Arquivo │          │      ┌──────────┐
        │          └─────────┘          │      │ Comissao │
        │                               │      └──────────┘
    ┌───▼────┐  ┌───────────┐    ┌─────▼────┐
    │ Tarefa │  │EventoAgenda│    │MensagemWA│
    └────────┘  └───────────┘    └──────────┘

    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
    │AuditLog  │  │Assinatura│  │ConversaIA│  │Relatorio │
    └──────────┘  └──────────┘  └──────────┘  └──────────┘
```

### 8.3 Tabelas — Existentes (8)

#### Empresa
```prisma
model Empresa {
  id        Int          @id @default(autoincrement())
  nome      String
  cnpj      String?      @unique
  email     String
  telefone  String?
  plano     PlanoEmpresa @default(STARTER)
  ativo     Boolean      @default(true)
  logoUrl   String?
  // NOVOS (Fase 2+):
  endereco  String?
  cidade    String?
  estado    String?
  cep       String?
  site      String?
  configuracoes Json?
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt
}
```

#### Usuario
```prisma
model Usuario {
  id        Int         @id @default(autoincrement())
  empresaId Int
  nome      String
  email     String      @unique
  senha     String
  tipo      TipoUsuario @default(CORRETOR)
  telefone  String?
  ativo     Boolean     @default(true)
  // NOVOS:
  avatarUrl       String?
  creci           String?
  ultimoAcesso    DateTime?
  preferenciaTema TemaPreferencia @default(SISTEMA)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### Imovel — 30+ campos (codigo, titulo, status, endereco, valores, comodidades, lat/lng)
#### Cliente — tipo (PROPRIETARIO/INQUILINO/COMPRADOR/LEAD), contatos, notas
#### Lead — pipeline (7 status), vinculações, score IA
#### Contrato — ALUGUEL/VENDA/ADMINISTRACAO, comissão, datas
#### Cobranca — vinculada a contrato, status pagamento
#### Tarefa — prioridade, status, vinculações

### 8.4 Tabelas — Novas (10)

| Tabela | Fase | Descrição |
|--------|------|-----------|
| Comissao | 2 | Comissão por contrato/corretor |
| EventoAgenda | 2 | Visitas, reuniões, ligações |
| Arquivo | 3 | Fotos, vídeos, PDFs (polimórfico) |
| AuditLog | 1 | Log de ações sensíveis |
| Assinatura | 5 | Billing e plano |
| MensagemWhatsApp | 3 | Histórico WhatsApp |
| ConversaIA | 4 | Sessões de chat IA |
| MensagemIA | 4 | Mensagens do chat |
| Relatorio | 2 | Relatórios gerados |
| Permissao | 2 | RBAC granular |

### 8.5 Enums (24 total)

`PlanoEmpresa` · `TipoUsuario` · `StatusImovel` · `TipoCliente` · `StatusLead` · `TipoContrato` · `StatusContrato` · `StatusCobranca` · `PrioridadeTarefa` · `StatusTarefa` · `StatusComissao` · `TipoEvento` · `StatusEvento` · `TipoArquivo` · `StatusAssinatura` · `DirecaoMsg` · `StatusMsg` · `RoleIA` · `TipoRelatorio` · `StatusRelatorio` · `TemperaturaLead` · `FormaPagamento` · `TemaPreferencia` · `TipoUsuario`

### 8.6 Índices de Performance

| Índice | Tabela | Colunas | Motivo |
|--------|--------|---------|--------|
| PK | Todas | id | Acesso por ID |
| Tenant | Todas negócio | empresaId | Filtro multi-tenant |
| Unique composto | Imovel | empresaId + codigo | Código único por empresa |
| Unique composto | Contrato | empresaId + numero | Número único por empresa |
| Status | Imovel | empresaId + status | Filtro listagem |
| Cidade | Imovel | empresaId + cidade | Filtro geográfico |
| Vencimento | Cobranca | empresaId + vencimento | Job de inadimplência |
| Pipeline | Lead | empresaId + status | Kanban CRM |
| Agenda | EventoAgenda | empresaId + dataInicio | Calendário |

### 8.7 Regras de Integridade

| ID | Regra |
|----|-------|
| RN-001 | Imóvel com contrato ATIVO → status VENDIDO ou ALUGADO |
| RN-002 | Ativar contrato ALUGUEL → gera cobranças mensais |
| RN-003 | Ativar contrato → gera comissão automaticamente |
| RN-004 | Cobrança vencida não paga → status ATRASADO (cron) |
| RN-005 | Lead FECHADO requer cliente + imóvel vinculados |
| RN-006 | Empresa deve ter ≥ 1 usuário ADMIN ativo |
| RN-007 | Plano STARTER: max 50 imóveis, 3 usuários |
| RN-008 | CNPJ único globalmente |
| RN-009 | Corretor só acessa registros próprios ou sem dono |
| RN-010 | Exclusão de cliente com contrato ativo → bloqueada |

---

## 9. Todos os Módulos do Sistema

### 9.1 Mapa de Módulos

| # | Módulo | Rota | Fase | Status | Persona principal |
|---|--------|------|------|--------|-------------------|
| 1 | Dashboard | `/` | 2 | ⚠️ Básico | Todos |
| 2 | Imóveis | `/imoveis` | 2 | ⚠️ Básico | Corretor |
| 3 | Clientes | `/clientes` | 2 | ⚠️ Básico | Corretor |
| 4 | Proprietários | `/proprietarios` | 2 | 🔲 Novo | Gestor |
| 5 | Corretores | `/corretores` | 2 | 🔲 Novo | Gestor |
| 6 | CRM | `/crm` | 2 | ⚠️ Parcial | Corretor |
| 7 | Agenda | `/agenda` | 2 | 🔲 Novo | Corretor |
| 8 | Contratos | `/contratos` | 2 | ⚠️ Básico | Gestor |
| 9 | Financeiro | `/financeiro` | 2 | ⚠️ Básico | Admin |
| 10 | Comissões | `/comissoes` | 2 | 🔲 Novo | Gestor |
| 11 | Relatórios | `/relatorios` | 2 | 🔲 Novo | Admin |
| 12 | Tarefas | `/tarefas` | 2 | ⚠️ Básico | Todos |
| 13 | Assistente IA | `/ia` | 4 | 🔲 Novo | Corretor |
| 14 | Configurações | `/configuracoes` | 2 | ⚠️ Básico | Admin |

### 9.2 Detalhamento por Módulo

#### M1 — Dashboard
- **Objetivo:** Visão executiva do negócio em tempo real
- **KPIs:** 8 cards (imóveis, clientes, leads, contratos, receita, pendências, inadimplência, tarefas)
- **Gráficos:** Pipeline funil, imóveis por status, receita mensal, conversão
- **Tabelas:** Leads recentes, próximas cobranças, tarefas pendentes
- **Filtro:** Período (hoje, semana, mês, trimestre, ano)
- **Versão corretor:** KPIs pessoais apenas

#### M2 — Imóveis
- **Objetivo:** Gestão completa do portfólio
- **Telas:** Listagem (tabela/grid), Detalhe (galeria + mapa + info)
- **CRUD:** Criar, editar, soft delete
- **Filtros:** 8 filtros (busca, status, finalidade, tipo, cidade, preço, quartos, corretor)
- **Extras:** Galeria fotos/vídeo, Google Maps, descrição IA, destaque
- **Limite:** Por plano (50/500/ilimitado)

#### M3 — Clientes
- **Objetivo:** Gestão de compradores, inquilinos e leads qualificados
- **Telas:** Listagem, Detalhe (perfil + histórico)
- **Tipos:** COMPRADOR, INQUILINO, LEAD
- **Vinculações:** Leads, contratos, agenda, WhatsApp

#### M4 — Proprietários
- **Objetivo:** Gestão dedicada de donos de imóveis
- **Base:** Cliente com tipo=PROPRIETARIO
- **Extras:** Qtd imóveis, contratos de administração, repasse (futuro)

#### M5 — Corretores
- **Objetivo:** Gestão e performance da equipe comercial
- **Base:** Usuario com tipo=CORRETOR ou GERENTE
- **Visão:** Cards com stats (imóveis, leads, vendas, comissões)
- **Acesso:** Admin e Gestor

#### M6 — CRM (Pipeline)
- **Objetivo:** Funil visual de vendas com kanban
- **Estágios:** 7 colunas (Novo → Fechado/Perdido)
- **Interação:** Drag-and-drop real (@dnd-kit)
- **Card:** Título, cliente, imóvel, valor, corretor, score IA
- **Ações:** Criar, mover, editar, vincular, WhatsApp

#### M7 — Agenda
- **Objetivo:** Calendário de visitas, reuniões e ligações
- **Componente:** FullCalendar (mês, semana, dia)
- **Tipos:** Visita (azul), Reunião (verde), Ligação (amarelo)
- **Vinculações:** Imóvel, cliente, lead
- **Lembrete:** Notificação X minutos antes

#### M8 — Contratos
- **Objetivo:** Gestão de contratos de aluguel, venda e administração
- **Tipos:** ALUGUEL, VENDA, ADMINISTRACAO
- **Fluxo:** RASCUNHO → ATIVO → ENCERRADO
- **Ao ativar:** Atualiza imóvel, gera comissão, gera cobranças (aluguel)
- **Extras:** Upload PDF, histórico de cobranças

#### M9 — Financeiro
- **Objetivo:** Controle de cobranças e pagamentos
- **KPIs:** Recebido, pendente, inadimplente, previsto
- **Ações:** Registrar pagamento, gerar cobranças mensais
- **Cron:** Geração automática + marcação de atrasadas
- **Acesso:** Admin e Gestor

#### M10 — Comissões
- **Objetivo:** Cálculo e gestão de comissões de corretores
- **Fluxo:** PENDENTE → APROVADA → PAGA
- **Cálculo:** Automático ao ativar contrato (valor × percentual)
- **Corretor:** Vê apenas suas comissões

#### M11 — Relatórios
- **Objetivo:** Análises e exportações
- **Tipos:** Vendas, financeiro, imóveis, comissões, leads
- **Formatos:** PDF, Excel
- **Acesso:** Admin e Gestor

#### M12 — Tarefas
- **Objetivo:** Gestão de atividades da equipe
- **Prioridades:** Baixa, Média, Alta, Urgente
- **Vinculações:** Lead, cliente, usuário
- **Ações:** Criar, concluir, excluir

#### M13 — Assistente IA
- **Objetivo:** Inteligência artificial nativa
- **Funcionalidades:** Chat, descrição imóvel, scoring leads, sugestões
- **Provider:** OpenAI GPT-4o-mini
- **Limite:** Por plano (10/100/ilimitado por dia)

#### M14 — Configurações
- **Objetivo:** Administração da imobiliária
- **Abas:** Empresa, Perfil, Equipe, Plano, Integrações, Aparência
- **Acesso:** Admin (equipe e plano), Todos (perfil e aparência)

### 9.3 Módulos de Integração (transversais)

| Integração | Módulos que usam | Fase |
|------------|-----------------|------|
| Google Maps | Imóveis (detalhe, listagem mapa) | 3 |
| Upload (Multer) | Imóveis, Contratos, Empresa (logo) | 3 |
| WhatsApp | CRM, Clientes, Detalhe imóvel | 3 |
| IA (OpenAI) | Imóveis, CRM, Assistente | 4 |
| E-mail | Financeiro, Onboarding, Leads | 3 |
| Billing (Asaas) | Configurações, Plataforma | 5 |

---

## 10. Fluxos de Navegação

### 10.1 Mapa de Rotas Completo

```
PÚBLICAS (sem auth)
├── /login                    → LoginPage
├── /registrar                → RegisterPage
└── /404                      → NotFoundPage

AUTENTICADAS (com MainLayout)
├── /                         → DashboardPage
├── /imoveis                  → ImoveisListPage
├── /imoveis/:id              → ImovelDetailPage
├── /clientes                 → ClientesListPage
├── /clientes/:id             → ClienteDetailPage
├── /proprietarios            → ProprietariosListPage
├── /proprietarios/:id        → ProprietarioDetailPage
├── /corretores               → CorretoresListPage
├── /corretores/:id           → CorretorDetailPage
├── /crm                      → CrmPipelinePage
├── /agenda                   → AgendaPage
├── /contratos                → ContratosListPage
├── /contratos/:id            → ContratoDetailPage
├── /financeiro               → FinanceiroPage
├── /comissoes                → ComissoesListPage
├── /relatorios               → RelatoriosPage
├── /tarefas                  → TarefasListPage
├── /ia                       → AssistenteIaPage
└── /configuracoes            → ConfiguracoesPage
    ├── /configuracoes/empresa
    ├── /configuracoes/perfil
    ├── /configuracoes/equipe
    ├── /configuracoes/plano
    ├── /configuracoes/integracoes
    └── /configuracoes/aparencia
```

### 10.2 Fluxo de Primeiro Acesso

```
sussai.com.br/registrar
  → Preenche dados empresa + admin
  → POST /api/v1/auth/registrar
  → Redirect / (Dashboard)
  → Overlay tour guiado (5 passos):
      1. "Bem-vindo ao SUSSAI!" (Dashboard)
      2. "Cadastre seu primeiro imóvel" → /imoveis
      3. "Adicione um cliente" → /clientes
      4. "Crie um lead no CRM" → /crm
      5. "Convide sua equipe" → /configuracoes/equipe
  → Tour concluído → badge "Onboarding completo"
```

### 10.3 Fluxo de Venda (Happy Path)

```
Lead novo (WhatsApp/site/indicação)
  → /crm → "Novo Lead" → status NOVO
  → Contato → move para CONTATO
  → /agenda → Agendar visita → status VISITA_AGENDADA
  → Realiza visita → notas no lead
  → Interesse → PROPOSTA (informa valor)
  → Negociação → NEGOCIACAO
  → Fechamento:
      → Lead → FECHADO
      → /contratos → Criar contrato → RASCUNHO
      → Gestor ativa → ATIVO
      → Imóvel → VENDIDO/ALUGADO
      → Comissão gerada → /comissoes
      → Cobranças geradas → /financeiro
```

### 10.4 Fluxo de Navegação Mobile

```
Mobile (< 900px):
  → Sidebar vira Drawer (hamburger menu)
  → Tabelas viram cards empilhados
  → Dashboard KPIs em carrossel horizontal
  → Kanban CRM vira lista com filtro por status
  → Agenda vira lista por dia
  → Bottom navigation (opcional Fase 2):
      [Dashboard] [CRM] [Imóveis] [Agenda] [Mais]
```

### 10.5 Fluxo entre Módulos (cross-linking)

| De | Para | Trigger |
|----|------|---------|
| Dashboard → Lead recente | /crm | Clicar na linha |
| Dashboard → Cobrança | /financeiro | Clicar na linha |
| Imóvel detalhe → Leads | /crm (filtrado) | Seção "Leads interessados" |
| Cliente detalhe → Contratos | /contratos/:id | Seção "Contratos" |
| Lead card → Imóvel | /imoveis/:id | Clicar no imóvel vinculado |
| Lead card → Cliente | /clientes/:id | Clicar no cliente |
| Contrato → Imóvel | /imoveis/:id | Link no detalhe |
| Contrato → Comissão | /comissoes | Seção "Comissões" |
| Agenda evento → Lead | /crm | Clicar no lead vinculado |
| Corretor card → Imóveis | /imoveis?corretor=X | Stats do corretor |

---

## 11. Permissões

### 11.1 Modelo RBAC

```
Usuário ──tem──► 1 Role (ADMIN | GERENTE | CORRETOR)
Role ──tem──► N Permissões (módulo + ação)
Permissão ──opcional──► Override por usuário (Fase 2)
```

### 11.2 Perfis

| Perfil | Descrição | Persona |
|--------|-----------|---------|
| **ADMIN** | Dono/sócio. Acesso total. Gerencia empresa, equipe, plano. | Ricardo |
| **GERENTE** | Gerente comercial. Equipe, relatórios, financeiro, aprovações. | Fernanda |
| **CORRETOR** | Operador comercial. Seus imóveis, leads, agenda, comissões. | Lucas |

### 11.3 Matriz de Permissões Completa

| Módulo / Ação | Admin | Gestor | Corretor |
|---------------|:-----:|:------:|:--------:|
| **Dashboard — ver completo** | ✅ | ✅ | ✅* |
| **Dashboard — dados financeiros** | ✅ | ✅ | ❌ |
| **Imóveis — listar todos** | ✅ | ✅ | ✅** |
| **Imóveis — criar** | ✅ | ✅ | ✅ |
| **Imóveis — editar qualquer** | ✅ | ✅ | ✅** |
| **Imóveis — excluir** | ✅ | ✅ | ❌ |
| **Imóveis — upload mídia** | ✅ | ✅ | ✅** |
| **Clientes — listar todos** | ✅ | ✅ | ✅** |
| **Clientes — criar** | ✅ | ✅ | ✅ |
| **Clientes — editar qualquer** | ✅ | ✅ | ✅** |
| **Clientes — excluir** | ✅ | ✅ | ❌ |
| **Proprietários — CRUD** | ✅ | ✅ | 👁️ |
| **Corretores — listar** | ✅ | ✅ | ❌ |
| **Corretores — criar/editar** | ✅ | ❌ | ❌ |
| **CRM — ver todos leads** | ✅ | ✅ | ✅** |
| **CRM — criar lead** | ✅ | ✅ | ✅ |
| **CRM — mover pipeline** | ✅ | ✅ | ✅** |
| **CRM — excluir lead** | ✅ | ✅ | ❌ |
| **Agenda — ver equipe** | ✅ | ✅ | ❌ |
| **Agenda — ver própria** | ✅ | ✅ | ✅ |
| **Agenda — criar evento** | ✅ | ✅ | ✅ |
| **Contratos — listar** | ✅ | ✅ | ✅** |
| **Contratos — criar** | ✅ | ✅ | ✅ |
| **Contratos — ativar** | ✅ | ✅ | ❌ |
| **Contratos — encerrar** | ✅ | ✅ | ❌ |
| **Financeiro — acesso** | ✅ | ✅ | ❌ |
| **Comissões — ver todas** | ✅ | ✅ | ❌ |
| **Comissões — ver próprias** | ✅ | ✅ | ✅ |
| **Comissões — aprovar** | ✅ | ✅ | ❌ |
| **Relatórios — gerar** | ✅ | ✅ | ❌ |
| **Tarefas — ver todas** | ✅ | ✅ | ❌ |
| **Tarefas — ver próprias** | ✅ | ✅ | ✅ |
| **IA — usar assistente** | ✅ | ✅ | ✅ |
| **WhatsApp — enviar** | ✅ | ✅ | ✅ |
| **Config — empresa** | ✅ | ❌ | ❌ |
| **Config — equipe** | ✅ | ❌ | ❌ |
| **Config — plano** | ✅ | ❌ | ❌ |
| **Config — perfil** | ✅ | ✅ | ✅ |

*Corretor: dashboard simplificado (KPIs pessoais)  
**Corretor: apenas registros onde `corretorId = usuario.id` ou sem corretor  
👁️ Somente leitura

### 11.4 Implementação

**Backend:**
```
authMiddleware      → valida JWT, injeta req.usuario
tenantMiddleware    → injeta req.context.empresaId
roleMiddleware([])  → verifica perfil
ownershipMiddleware → corretor só acessa seus registros
planLimitMiddleware → verifica limites do plano
```

**Frontend:**
```
<RoleRoute roles={['ADMIN', 'GERENTE']}>  → protege rotas
usePermissions().can('financeiro', 'ler') → protege ações na UI
```

### 11.5 JWT Payload

```json
{
  "sub": 42,
  "empresaId": 7,
  "role": "CORRETOR",
  "email": "lucas@imobiliaria.com",
  "iat": 1720000000,
  "exp": 1720028800
}
```

---

## 12. Roadmap de Desenvolvimento

### 12.1 Visão Geral

```
Fase 0  ██████████  Definição             ✅ Concluída
Fase 1  ░░░░░░░░░░  Fundação              8 semanas
Fase 2  ░░░░░░░░░░  Módulos Core          10 semanas
Fase 3  ░░░░░░░░░░  Integrações           6 semanas
Fase 4  ░░░░░░░░░░  IA                    4 semanas
Fase 5  ░░░░░░░░░░  SaaS Comercial        6 semanas
Fase 6  ░░░░░░░░░░  Escala                Contínuo
                                       Total: ~34 semanas
```

### 12.2 Fase 1 — Fundação Arquitetural (8 semanas)

| Semana | Entrega |
|--------|---------|
| 1 | Docker Compose (postgres + backend + frontend) |
| 1-2 | Backend: migração TypeScript + estrutura Clean Architecture |
| 2 | Backend: error handler, logger, env validation |
| 3 | Backend: Repository base + migrar 8 controllers para Service+Repository |
| 3 | Backend: Zod validation em todos os endpoints |
| 4 | Backend: Swagger, prefixo /api/v1, paginação |
| 4 | Backend: corrigir 6 vulnerabilidades de tenant |
| 5 | Frontend: migração TypeScript + estrutura feature-based |
| 5 | Frontend: TanStack Query + API services tipados |
| 6 | Frontend: tema claro/escuro + Framer Motion |
| 6-7 | Frontend: componentes shared (DataTable, FormModal, StatusChip, etc.) |
| 7 | Frontend: lazy routes + layout route |
| 8 | Branding SUSSAI + CI GitHub Actions + testes services críticos |

**Critério de aceite:** `docker compose up` funcional · 100% TS · Swagger completo · CI passando

### 12.3 Fase 2 — Módulos Core (10 semanas)

| Semana | Entrega |
|--------|---------|
| 1-2 | Dashboard premium (KPIs animados, Recharts, filtros) |
| 3-4 | Imóveis avançado (detalhe, galeria placeholder, filtros, paginação) |
| 5 | Proprietários + Corretores (módulos dedicados) |
| 6-7 | CRM kanban com drag-and-drop + Agenda FullCalendar |
| 8 | Contratos (edição, ativar, encerrar) + Comissões |
| 9 | Relatórios (geração PDF/Excel) |
| 10 | RBAC granular + route guards + Configurações completo |

**Critério de aceite:** 14 módulos na sidebar funcionais · RBAC enforced

### 12.4 Fase 3 — Integrações (6 semanas)

| Semana | Entrega |
|--------|---------|
| 1-2 | Upload fotos/vídeos/PDF (Multer + S3/R2) |
| 3 | Google Maps (geolocalização, mapa) |
| 4-5 | WhatsApp Business API |
| 6 | E-mail transacional |

### 12.5 Fase 4 — IA (4 semanas)

| Semana | Entrega |
|--------|---------|
| 1 | Assistente chat contextual |
| 2 | Geração de descrição de imóveis |
| 3 | Scoring de leads |
| 4 | Sugestão de imóveis + resumo pipeline |

### 12.6 Fase 5 — SaaS Comercial (6 semanas)

| Semana | Entrega |
|--------|---------|
| 1-2 | Billing Asaas (planos, trial, upgrade) |
| 3 | Limites por plano enforced |
| 4 | Landing page + onboarding guiado |
| 5 | Super-admin panel |
| 6 | LGPD (termos, exportação, exclusão) |

### 12.7 Fase 6 — Escala (contínuo)

Portais imobiliários · API pública · App mobile · White-label · Multi-região · 2FA

---

## 13. Padrão Visual

### 13.1 Princípios de Design

| Princípio | Aplicação |
|-----------|-----------|
| **Clareza** | Hierarquia visual clara; ação primária sempre evidente |
| **Consistência** | Mesmos padrões em todas as 21 telas |
| **Eficiência** | Mínimo de cliques para tarefas frequentes |
| **Elegância** | Espaçamento generoso, tipografia refinada |
| **Feedback** | Toda ação tem resposta visual (toast, loading, animação) |
| **Acessibilidade** | Contraste WCAG AA, foco visível, labels em inputs |

### 13.2 Layout Padrão (telas autenticadas)

```
┌──────────────────────────────────────────────────────────────┐
│ ┌─────────┐ ┌──────────────────────────────────────────────┐ │
│ │         │ │ Header: Título da página    [🔔] [👤 Menu]  │ │
│ │ Sidebar │ ├──────────────────────────────────────────────┤ │
│ │  260px  │ │                                              │ │
│ │         │ │  PageHeader: Título + botão de ação          │ │
│ │ [Nav]   │ │                                              │ │
│ │         │ │  ┌─ Filtros (se listagem) ──────────────┐   │ │
│ │         │ │  │                                       │   │ │
│ │         │ │  │  Conteúdo principal                   │   │ │
│ │         │ │  │  (tabela / cards / formulário)        │   │ │
│ │         │ │  │                                       │   │ │
│ │         │ │  └───────────────────────────────────────┘   │ │
│ │         │ │                                              │ │
│ │ [User]  │ │  Paginação (se listagem)                     │ │
│ └─────────┘ └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### 13.3 Layout Mobile (< 900px)

```
┌────────────────────────┐
│ ☰  SUSSAI    [🔔] [👤]│
├────────────────────────┤
│ PageHeader + ação      │
├────────────────────────┤
│ Filtros (collapsible)  │
├────────────────────────┤
│ Conteúdo (cards)       │
├────────────────────────┤
│ Paginação              │
└────────────────────────┘
```

### 13.4 Espaçamento

| Token | Valor | Uso |
|-------|-------|-----|
| xs | 4px | Gap entre ícone e texto |
| sm | 8px | Padding interno de chips |
| md | 16px | Padding de cards, gap entre elementos |
| lg | 24px | Padding de seções, gap entre cards |
| xl | 32px | Margem entre seções principais |
| 2xl | 48px | Padding de página |

### 13.5 Animações

| Animação | Duração | Easing | Uso |
|----------|---------|--------|-----|
| Fade in | 200ms | ease-out | Páginas, modals |
| Slide up | 300ms | ease-out | Cards, toast |
| Scale in | 200ms | ease-out | Botões, chips |
| Skeleton pulse | 1.5s | ease-in-out | Loading states |
| Counter up | 800ms | ease-out | KPIs do dashboard |
| Page transition | 250ms | ease-in-out | Navegação entre rotas |

**Regra:** Nenhuma animação deve causar layout shift ou atrasar interação.

### 13.6 Estados Visuais

| Estado | Tratamento visual |
|--------|-------------------|
| Loading | Skeleton (tabelas) ou CircularProgress (páginas) |
| Vazio | EmptyState com ilustração + CTA |
| Erro | Alert vermelho + botão "Tentar novamente" |
| Sucesso | Toast verde (3s, auto-dismiss) |
| Hover | Elevação sutil (shadow) ou background change |
| Disabled | Opacity 0.5 + cursor not-allowed |
| Focus | Outline 2px primary + offset 2px |

---

## 14. Identidade Visual

### 14.1 Marca

| Elemento | Definição |
|----------|-----------|
| **Nome** | SUSSAI CRM |
| **Nome curto** | SUSSAI |
| **Significado** | Sistema Inteligente para Imobiliárias |
| **Tagline** | O CRM imobiliário mais moderno do Brasil |
| **Tom de voz** | Profissional, confiável, moderno, acessível |
| **Idioma** | Português brasileiro (pt-BR) em toda interface |

### 14.2 Logotipo

```
┌─────────────────────────────────┐
│  ┌────┐                         │
│  │ 🏢 │  SUSSAI                  │
│  │    │  CRM Imobiliário         │
│  └────┘                         │
│  Avatar azul + ícone Apartment  │
│  Tipografia: Inter Bold         │
└─────────────────────────────────┘
```

| Variante | Uso |
|----------|-----|
| Logo completo | Sidebar desktop, login, landing page |
| Logo compacto (ícone) | Favicon, mobile, loading |
| Logo branco | Sidebar (fundo escuro) |
| Logo colorido | Fundo claro |

### 14.3 Paleta de Cores

#### Cor Primária — Azul Confiança
| Token | Hex | Uso |
|-------|-----|-----|
| primary-50 | `#eff6ff` | Background hover |
| primary-100 | `#dbeafe` | Background seleção |
| primary-500 | `#3b82f6` | Ações, links |
| primary-600 | `#2563eb` | Hover botões |
| primary-700 | `#1d4ed8` | Active |
| primary-800 | `#1e40af` | **Principal (tema claro)** |
| primary-900 | `#1e3a8a` | Sidebar accent |

#### Cor Secundária — Teal Sucesso
| Token | Hex | Uso |
|-------|-----|-----|
| secondary-500 | `#14b8a6` | Ações secundárias |
| secondary-700 | `#0f766e` | **Principal** |
| secondary-900 | `#134e4a` | Texto sobre secondary |

#### Cores Semânticas
| Token | Hex | Uso |
|-------|-----|-----|
| success | `#16a34a` | Pago, ativo, fechado |
| warning | `#d97706` | Pendente, atenção |
| error | `#dc2626` | Atrasado, erro, perdido |
| info | `#3b82f6` | Informativo, novo |

#### Cores Neutras (Slate)
| Token | Hex (claro) | Hex (escuro) | Uso |
|-------|-------------|--------------|-----|
| bg-default | `#f1f5f9` | `#0f172a` | Fundo da página |
| bg-paper | `#ffffff` | `#1e293b` | Cards, modals |
| text-primary | `#0f172a` | `#f1f5f9` | Texto principal |
| text-secondary | `#64748b` | `#94a3b8` | Texto secundário |
| border | `#e2e8f0` | `#334155` | Bordas, divisores |

#### Sidebar (sempre escura)
```
Gradiente: #0f172a → #1e293b
Texto: #e2e8f0
Texto muted: #94a3b8
Item ativo: rgba(59, 130, 246, 0.2)
Hover: rgba(59, 130, 246, 0.15)
```

### 14.4 Tipografia

| Elemento | Fonte | Peso | Tamanho | Line-height |
|----------|-------|------|---------|-------------|
| H1 (página) | Inter | 700 | 28px / 1.75rem | 1.3 |
| H2 (seção) | Inter | 600 | 22px / 1.375rem | 1.4 |
| H3 (card) | Inter | 600 | 18px / 1.125rem | 1.4 |
| Body | Inter | 400 | 14px / 0.875rem | 1.5 |
| Body small | Inter | 400 | 12px / 0.75rem | 1.5 |
| Label | Inter | 500 | 12px / 0.75rem | 1.5 |
| Button | Inter | 600 | 14px / 0.875rem | 1 |
| Caption | Inter | 400 | 11px / 0.6875rem | 1.4 |
| KPI valor | Inter | 700 | 32px / 2rem | 1.2 |
| KPI label | Inter | 500 | 13px / 0.8125rem | 1.4 |

**Fonte:** Inter (Google Fonts) — fallback: Roboto, Helvetica, Arial, sans-serif

### 14.5 Iconografia

| Biblioteca | Material Icons (MUI) |
|------------|---------------------|
| Tamanho padrão | 20px (small), 24px (medium) |
| Cor | Herda do contexto (inherit) |
| Sidebar | fontSize="small" (20px) |

---

## 15. Design System

### 15.1 Tokens de Design

Todos os tokens são definidos no MUI Theme e acessíveis via `theme.palette`, `theme.typography`, `theme.spacing`.

#### Border Radius
| Token | Valor | Uso |
|-------|-------|-----|
| radius-sm | 6px | Chips, badges |
| radius-md | 8px | Inputs, buttons |
| radius-lg | 10px | Cards |
| radius-xl | 12px | Modals, dialogs |
| radius-full | 9999px | Avatars, pills |

#### Shadows
| Token | Valor | Uso |
|-------|-------|-----|
| shadow-sm | `0 1px 2px rgba(0,0,0,0.05)` | Cards em repouso |
| shadow-md | `0 4px 6px rgba(0,0,0,0.07)` | Cards hover, dropdowns |
| shadow-lg | `0 10px 15px rgba(0,0,0,0.10)` | Modals, popovers |
| shadow-none | `none` | Flat elements |

#### Z-Index
| Camada | Valor |
|--------|-------|
| Drawer (sidebar) | 1200 |
| AppBar (header) | 1100 |
| Modal | 1300 |
| Toast/Snackbar | 1400 |
| Tooltip | 1500 |

### 15.2 Componentes MUI — Overrides

```typescript
// Tema claro — overrides planejados
MuiButton:     { textTransform: 'none', fontWeight: 600, borderRadius: 8 }
MuiCard:       { boxShadow: shadow-sm, border: '1px solid border' }
MuiChip:       { fontWeight: 500 }
MuiTextField:  { borderRadius: 8 }
MuiDialog:     { borderRadius: 12 }
MuiTableCell:  { padding: '12px 16px' }
MuiAppBar:     { background: bg-paper, color: text-primary, elevation: 0 }
```

### 15.3 Status Colors (chips em todo o sistema)

| Domínio | Status | Cor fundo | Cor texto |
|---------|--------|-----------|-----------|
| Imóvel | DISPONIVEL | `#dcfce7` | `#166534` |
| Imóvel | RESERVADO | `#fef3c7` | `#92400e` |
| Imóvel | VENDIDO | `#dbeafe` | `#1e40af` |
| Imóvel | ALUGADO | `#e0e7ff` | `#3730a3` |
| Imóvel | INATIVO | `#f1f5f9` | `#64748b` |
| Lead | NOVO | `#dbeafe` | `#1e40af` |
| Lead | CONTATO | `#e0e7ff` | `#3730a3` |
| Lead | VISITA_AGENDADA | `#fef3c7` | `#92400e` |
| Lead | PROPOSTA | `#fed7aa` | `#9a3412` |
| Lead | NEGOCIACAO | `#fecaca` | `#991b1b` |
| Lead | FECHADO | `#dcfce7` | `#166534` |
| Lead | PERDIDO | `#f1f5f9` | `#64748b` |
| Cobrança | PENDENTE | `#fef3c7` | `#92400e` |
| Cobrança | PAGO | `#dcfce7` | `#166534` |
| Cobrança | ATRASADO | `#fecaca` | `#991b1b` |
| Contrato | RASCUNHO | `#f1f5f9` | `#64748b` |
| Contrato | ATIVO | `#dcfce7` | `#166534` |
| Contrato | ENCERRADO | `#dbeafe` | `#1e40af` |
| Tarefa | URGENTE | `#fecaca` | `#991b1b` |
| Tarefa | ALTA | `#fed7aa` | `#9a3412` |
| Comissão | PAGA | `#dcfce7` | `#166534` |

### 15.4 Padrões de Formulário

| Regra | Padrão |
|-------|--------|
| Labels | Sempre acima do input (não placeholder-as-label) |
| Campos obrigatórios | Asterisco vermelho + validação Zod |
| Erro | Texto vermelho abaixo do campo + borda vermelha |
| Largura | 100% em mobile; max 600px em modals |
| Grupos | Separados por Divider ou subtítulo H3 |
| Ações | Cancelar (text) à esquerda · Salvar (contained) à direita |
| Loading | Botão salvar com CircularProgress + disabled |

### 15.5 Padrões de Tabela

| Regra | Padrão |
|-------|--------|
| Header | Fundo `bg-default`, texto `text-secondary`, peso 600 |
| Linhas | Alternância sutil (opcional), hover `primary-50` |
| Ações | Ícones no final da linha (editar, excluir) |
| Paginação | Server-side, 20 itens por página |
| Empty | EmptyState centralizado |
| Loading | SkeletonTable (5 linhas) |
| Responsivo | vira cards em mobile |

---

## 16. Componentes Reutilizáveis

### 16.1 Inventário Completo

| # | Componente | Pasta | Usado em | Fase |
|---|-----------|-------|----------|------|
| 1 | `MainLayout` | shared/layout | Todas autenticadas | 1 |
| 2 | `Sidebar` | shared/layout | MainLayout | 1 |
| 3 | `Header` | shared/layout | MainLayout | 1 |
| 4 | `PageHeader` | shared/layout | Todas autenticadas | 1 |
| 5 | `DataTable` | shared/data-display | 8 listagens | 1 |
| 6 | `StatusChip` | shared/data-display | Todos os módulos | 1 |
| 7 | `StatCard` | shared/data-display | Dashboard, Financeiro | 1 |
| 8 | `EmptyState` | shared/data-display | Todas as listagens | 1 |
| 9 | `SkeletonTable` | shared/data-display | Loading de tabelas | 1 |
| 10 | `FormModal` | shared/forms | Todos os CRUDs | 1 |
| 11 | `SearchInput` | shared/forms | Todas as listagens | 1 |
| 12 | `CurrencyInput` | shared/forms | Imóveis, Contratos, Financeiro | 1 |
| 13 | `DatePicker` | shared/forms | Contratos, Agenda, Tarefas | 2 |
| 14 | `ConfirmDialog` | shared/feedback | Exclusões | 1 |
| 15 | `Toast` | shared/feedback | Feedback de ações | 1 |
| 16 | `LoadingOverlay` | shared/feedback | Operações longas | 1 |
| 17 | `ImageGallery` | shared/media | Detalhe imóvel | 3 |
| 18 | `FileUpload` | shared/media | Imóveis, Contratos | 3 |
| 19 | `VideoPlayer` | shared/media | Detalhe imóvel | 3 |
| 20 | `GoogleMap` | shared/maps | Detalhe imóvel, listagem | 3 |
| 21 | `PrivateRoute` | app/guards | Rotas autenticadas | 1 |
| 22 | `PublicRoute` | app/guards | Login, Registro | 1 |
| 23 | `RoleRoute` | app/guards | Rotas com RBAC | 2 |
| 24 | `KanbanBoard` | features/crm | CRM pipeline | 2 |
| 25 | `KanbanCard` | features/crm | CRM pipeline | 2 |
| 26 | `CalendarView` | features/agenda | Agenda | 2 |
| 27 | `ChatInterface` | features/ia | Assistente IA | 4 |
| 28 | `TourOverlay` | shared/feedback | Onboarding | 5 |

### 16.2 Especificação dos Componentes Críticos

#### DataTable
```typescript
interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  pagination?: { page: number; perPage: number; total: number };
  onPageChange?: (page: number) => void;
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
  onRowClick?: (row: T) => void;
  actions?: (row: T) => ReactNode;
  emptyMessage?: string;
}
```

#### FormModal
```typescript
interface FormModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  onSubmit: () => void;
  loading?: boolean;
  children: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg';
}
```

#### StatusChip
```typescript
interface StatusChipProps {
  status: string;
  domain: 'imovel' | 'lead' | 'contrato' | 'cobranca' | 'tarefa' | 'comissao';
  size?: 'small' | 'medium';
}
// Cores automáticas baseadas no domain + status (seção 15.3)
```

#### StatCard
```typescript
interface StatCardProps {
  title: string;
  value: string | number;
  variation?: number;       // % vs período anterior
  icon: ReactNode;
  color?: string;
  loading?: boolean;
  onClick?: () => void;
}
```

#### PageHeader
```typescript
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void; icon?: ReactNode };
  breadcrumbs?: { label: string; href?: string }[];
}
```

### 16.3 Hooks Compartilhados

| Hook | Retorno | Uso |
|------|---------|-----|
| `useAuth()` | `{ usuario, login, logout, loading }` | Autenticação |
| `usePermissions()` | `{ can, isAdmin, isGestor, isCorretor }` | RBAC |
| `useDebounce(value, ms)` | `debouncedValue` | Busca em listagens |
| `useDisclosure()` | `{ isOpen, open, close, toggle }` | Modals |
| `usePagination()` | `{ page, perPage, setPage, meta }` | Tabelas |
| `useThemeMode()` | `{ mode, toggle, setMode }` | Tema claro/escuro |
| `useToast()` | `{ success, error, info, warning }` | Feedback |

---

## 17. APIs

### 17.1 Convenções REST

| Regra | Padrão |
|-------|--------|
| Base URL | `/api/v1` |
| Formato | JSON |
| Auth | `Authorization: Bearer <jwt>` |
| Paginação | `?page=1&perPage=20` |
| Ordenação | `?sort=campo&order=asc` |
| Busca | `?busca=termo` |
| Filtros | `?status=ATIVO&tipo=ALUGUEL` |
| IDs | Numéricos (Int) |
| Datas | ISO 8601 (`2026-07-15T10:30:00Z`) |
| Valores | Decimal como string (`"2200.00"`) |

### 17.2 Response Padrão

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

### 17.3 Códigos de Erro

| Código HTTP | Code | Quando |
|-------------|------|--------|
| 400 | VALIDATION_ERROR | Input inválido (Zod) |
| 401 | UNAUTHORIZED | Token ausente/inválido |
| 403 | FORBIDDEN | Sem permissão (role/ownership) |
| 404 | NOT_FOUND | Recurso não existe no tenant |
| 409 | CONFLICT | Duplicata (email, CNPJ, código) |
| 422 | BUSINESS_RULE_ERROR | Regra de negócio violada |
| 429 | RATE_LIMIT | Muitas requisições |
| 500 | INTERNAL_ERROR | Erro inesperado |

### 17.4 Inventário Completo de Endpoints (~95)

#### Auth (8)
`POST /auth/registrar` · `POST /auth/login` · `GET /auth/perfil` · `PUT /auth/perfil` · `PUT /auth/senha` · `POST /auth/usuarios` · `GET /auth/usuarios` · `PUT /auth/usuarios/:id`

#### Empresa (3)
`GET /empresa` · `PUT /empresa` · `POST /empresa/logo`

#### Dashboard (4)
`GET /dashboard` · `GET /dashboard/kpis` · `GET /dashboard/graficos` · `GET /dashboard/atividades`

#### Imóveis (9)
`GET /imoveis` · `GET /imoveis/:id` · `POST /imoveis` · `PUT /imoveis/:id` · `DELETE /imoveis/:id` · `PATCH /imoveis/:id/status` · `GET /imoveis/mapa` · `POST /imoveis/:id/destaque` · `POST /imoveis/:id/ia/descricao`

#### Clientes (5) + Proprietários (2)
`GET /clientes` · `GET /clientes/:id` · `POST /clientes` · `PUT /clientes/:id` · `DELETE /clientes/:id` · `GET /proprietarios` · `GET /proprietarios/:id/imoveis`

#### CRM / Leads (8)
`GET /leads` · `GET /leads/:id` · `POST /leads` · `PUT /leads/:id` · `PATCH /leads/:id/status` · `DELETE /leads/:id` · `GET /leads/kanban` · `POST /leads/:id/ia/score`

#### Agenda (6)
`GET /agenda` · `GET /agenda/:id` · `POST /agenda` · `PUT /agenda/:id` · `DELETE /agenda/:id` · `PATCH /agenda/:id/realizado`

#### Contratos (7) + Comissões (4)
`GET /contratos` · `GET /contratos/:id` · `POST /contratos` · `PUT /contratos/:id` · `PATCH /contratos/:id/ativar` · `PATCH /contratos/:id/encerrar` · `DELETE /contratos/:id` · `GET /comissoes` · `GET /comissoes/:id` · `PATCH /comissoes/:id/aprovar` · `PATCH /comissoes/:id/pagar`

#### Financeiro (7)
`GET /financeiro` · `GET /financeiro/resumo` · `POST /financeiro` · `PATCH /financeiro/:id/pagar` · `POST /financeiro/gerar-mensais` · `GET /financeiro/inadimplentes` · `GET /financeiro/projecao`

#### Tarefas (5)
`GET /tarefas` · `POST /tarefas` · `PUT /tarefas/:id` · `DELETE /tarefas/:id` · `PATCH /tarefas/:id/concluir`

#### Arquivos (4)
`POST /arquivos/upload` · `GET /arquivos` · `DELETE /arquivos/:id` · `PUT /arquivos/:id/ordem`

#### Relatórios (3)
`POST /relatorios/gerar` · `GET /relatorios` · `GET /relatorios/:id/download`

#### WhatsApp (4)
`POST /whatsapp/enviar` · `GET /whatsapp/historico/:clienteId` · `POST /whatsapp/webhook` · `GET /whatsapp/templates`

#### IA (7)
`GET /ia/conversas` · `POST /ia/conversas` · `GET /ia/conversas/:id` · `POST /ia/conversas/:id/mensagens` · `POST /ia/imovel/:id/descricao` · `POST /ia/lead/:id/score` · `POST /ia/cliente/:id/sugerir-imoveis`

#### Billing (4) + Admin (3)
`GET /billing/plano` · `POST /billing/upgrade` · `POST /billing/webhook` · `GET /billing/faturas` · `GET /admin/empresas` · `PATCH /admin/empresas/:id/status` · `GET /admin/metricas`

### 17.5 Swagger

- URL: `/api/docs`
- Cada endpoint documentado com: descrição, parâmetros, body, responses, exemplos
- Tags por domínio (Auth, Imóveis, CRM, etc.)
- Autenticação Bearer configurada no Swagger UI

---

## 18. Convenções de Código

### 18.1 TypeScript

| Regra | Padrão |
|-------|--------|
| Strict mode | `strict: true` no tsconfig |
| any | Proibido exceto com `// eslint-disable` justificado |
| Interfaces vs Types | `interface` para objetos, `type` para unions/aliases |
| Enums | Const objects com `as const` (não TS enum) |
| Nullability | `T \| null` explícito, nunca `undefined` silencioso |
| Imports | Absolute paths com alias `@/` |
| Exports | Named exports (não default, exceto pages lazy) |

### 18.2 Backend

| Regra | Padrão |
|-------|--------|
| Controller | Max 30 linhas; só parse + call service + respond |
| Service | Regras de negócio; retorna DTOs, nunca Prisma models |
| Repository | Queries Prisma; sempre filtra `empresaId` |
| Validator | Zod schema por endpoint; infer types |
| Error | Throw `AppError` com code + message |
| Async | Sempre async/await (não .then chains) |
| Naming | camelCase funções, PascalCase classes/errors |
| Imports | Domain não importa de Infrastructure |

### 18.3 Frontend

| Regra | Padrão |
|-------|--------|
| Componentes | Functional components + hooks (não classes) |
| Props | Interface tipada `{Component}Props` |
| Estado servidor | TanStack Query (não useState para API data) |
| Estado UI | useState/useDisclosure local |
| Forms | React Hook Form + Zod resolver |
| Estilo | MUI `sx` prop (não CSS files, exceto global) |
| Imports | Feature não importa de outra feature (só shared) |
| Pages | Lazy loaded com `React.lazy` + `Suspense` |

### 18.4 Git

| Regra | Padrão |
|-------|--------|
| Branch main | Produção — protegida |
| Branch develop | Staging — integração |
| Feature branches | `feature/modulo-descricao` |
| Commits | Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:` |
| PRs | Obrigatório review + CI passando |
| Mensagens | Em português, imperativo: "Adiciona módulo de agenda" |

### 18.5 Banco de Dados

| Regra | Padrão |
|-------|--------|
| Migrations | Sempre via `prisma migrate dev` |
| Naming tabelas | PascalCase singular (Prisma convention) |
| Naming campos | camelCase |
| Relações | Sempre definir `onDelete` explicitamente |
| Seed | `prisma/seed.ts` com dados demo |
| Queries | Nunca raw SQL exceto migrations/índices |

### 18.6 Testes

| Camada | Ferramenta | O que testar |
|--------|------------|-------------|
| Services | Jest | Regras de negócio, validações |
| Repositories | Jest + DB test | Queries, tenant filter |
| Validators | Jest | Zod schemas |
| Hooks | Vitest + RTL | Lógica de hooks |
| Components | Vitest + RTL | Renderização, interações |
| E2E | Playwright (Fase 2+) | Fluxos críticos |

---

## 19. Estratégia de Deploy

### 19.1 Ambientes

| Ambiente | URL | Branch | Deploy |
|----------|-----|--------|--------|
| Development | localhost | local | `docker compose up` |
| Staging | staging.sussai.com.br | develop | Automático (CI) |
| Production | app.sussai.com.br | main | Manual approval |

### 19.2 Infraestrutura Recomendada (MVP)

| Componente | Serviço | Custo estimado |
|------------|---------|----------------|
| Frontend | Cloudflare Pages | Grátis |
| Backend | Railway | ~$20/mês |
| Banco | Railway PostgreSQL | ~$10/mês |
| Storage | Cloudflare R2 | ~$5/mês |
| DNS/CDN | Cloudflare | Grátis |
| Monitoramento | Sentry (free tier) | Grátis |
| **Total MVP** | | **~R$ 200/mês** |

### 19.3 Docker (Development)

```yaml
# docker-compose.yml
services:
  postgres:   # PostgreSQL 16, porta 5432, volume pgdata
  backend:    # Node 20, porta 3000, hot reload
  frontend:   # Node 20, porta 5173, Vite HMR
```

**Comando único:** `docker compose up` → sistema completo rodando.

### 19.4 CI/CD (GitHub Actions)

```
Push/PR → ci.yml:
  1. ESLint (backend + frontend)
  2. TypeScript check (tsc --noEmit)
  3. Tests (Jest + Vitest)
  4. Build (backend + frontend)

Merge develop → deploy.yml (staging):
  1. Build Docker images
  2. Deploy to Railway
  3. prisma migrate deploy
  4. Health check

Merge main → deploy.yml (production):
  1. Mesmos passos
  2. Requer approval manual
  3. Rollback automático se health check falhar
```

### 19.5 Variáveis de Ambiente

| Variável | Dev | Staging | Prod |
|----------|-----|---------|------|
| DATABASE_URL | docker postgres | Railway PG | Railway PG |
| JWT_SECRET | dev-secret | random 256-bit | random 256-bit |
| NODE_ENV | development | staging | production |
| CORS_ORIGIN | localhost:5173 | staging.sussai.com.br | app.sussai.com.br |
| STORAGE_PROVIDER | local | s3 | s3 |
| OPENAI_API_KEY | — | test key | prod key |

### 19.6 Backup e Recovery

| Item | Frequência | Retenção | Ferramenta |
|------|-----------|----------|------------|
| PostgreSQL | Diário 03:00 | 30 dias | pg_dump → R2 |
| Arquivos S3 | Versioning nativo | 90 dias | Cloudflare R2 |
| Código | Cada push | Permanente | GitHub |
| RTO | < 4 horas | | |
| RPO | < 24 horas | | |

---

## 20. Checklist de Qualidade

### 20.1 Checklist por Feature (Definition of Done)

Toda feature só é considerada **pronta** quando:

#### Backend
- [ ] Service com regras de negócio testadas
- [ ] Repository com tenant filter (`empresaId`)
- [ ] Validator Zod para input
- [ ] Controller < 30 linhas
- [ ] Endpoint documentado no Swagger
- [ ] Testes unitários do service (> 80% coverage)
- [ ] Error handling com `AppError`
- [ ] RBAC aplicado (role + ownership)

#### Frontend
- [ ] Feature module com pages, components, hooks, services, types
- [ ] Componentes shared reutilizados (não duplicados)
- [ ] TanStack Query para data fetching
- [ ] Loading state (skeleton)
- [ ] Empty state
- [ ] Error state com retry
- [ ] Responsivo (desktop + mobile)
- [ ] Tema claro e escuro funcionando
- [ ] Animações de transição

#### Geral
- [ ] TypeScript sem erros (`tsc --noEmit`)
- [ ] ESLint sem warnings
- [ ] Testado manualmente nos 3 perfis (admin, gestor, corretor)
- [ ] Sem regressão em features existentes

### 20.2 Checklist de Release (por fase)

#### Fase 1 — Fundação
- [ ] `docker compose up` funcional
- [ ] 100% TypeScript (zero .js em src/)
- [ ] Clean Architecture implementada
- [ ] Swagger com todos os endpoints existentes
- [ ] Tema escuro funcional
- [ ] 6 vulnerabilidades de tenant corrigidas
- [ ] CI passando (lint + build + test)
- [ ] Componentes shared criados (mínimo 10)

#### Fase 2 — Módulos Core
- [ ] 14 módulos na sidebar funcionais
- [ ] Dashboard com 8 KPIs + 4 gráficos
- [ ] CRM com drag-and-drop
- [ ] Agenda com FullCalendar
- [ ] RBAC enforced em backend e frontend
- [ ] Paginação server-side em todas as listagens
- [ ] 21 telas implementadas

#### Fase 3 — Integrações
- [ ] Upload de fotos, vídeos e PDF funcional
- [ ] Google Maps no detalhe do imóvel
- [ ] WhatsApp enviando mensagens
- [ ] E-mail transacional

#### Fase 4 — IA
- [ ] Assistente chat funcional
- [ ] Descrição de imóvel em 1 clique
- [ ] Scoring de leads
- [ ] Rate limit por plano

#### Fase 5 — SaaS Comercial
- [ ] Billing funcional (trial + planos)
- [ ] Limites por plano enforced
- [ ] Landing page no ar
- [ ] LGPD conformidade
- [ ] Uptime > 99.5% por 30 dias

### 20.3 Métricas de Qualidade Contínua

| Métrica | Meta | Ferramenta |
|---------|------|------------|
| TypeScript coverage | 100% | tsc |
| Test coverage (services) | > 80% | Jest |
| Lighthouse Performance | > 90 | Lighthouse CI |
| Lighthouse Accessibility | > 90 | Lighthouse CI |
| API p95 latency | < 200ms | APM |
| Error rate | < 0.1% | Sentry |
| Uptime | > 99.5% | Uptime Robot |
| Bundle size (frontend) | < 500KB gzipped | Vite analyze |
| Cross-tenant leaks | 0 | Testes + audit |

### 20.4 Code Review — O que verificar

| Categoria | Pergunta |
|-----------|----------|
| Arquitetura | Controller acessa Prisma direto? |
| Segurança | empresaId vem do JWT, não do body? |
| Segurança | Campos do body são whitelisted? |
| UX | Tem loading, empty e error states? |
| UX | Funciona em mobile? |
| UX | Tema escuro funciona? |
| Performance | Listagem tem paginação server-side? |
| Testes | Service tem testes unitários? |
| Docs | Endpoint está no Swagger? |
| Padrão | Usa componentes shared? |
| Padrão | Segue convenções de nomenclatura? |

---

## Governança do Documento

### Hierarquia de Documentos

```
MASTER_PLAN.md          ← FONTE OFICIAL (este documento)
├── PLANEJAMENTO_COMPLETO.md  ← Detalhamento técnico
├── PROJETO.md                ← Visão resumida
├── ARQUITETURA.md            ← Referência arquitetural
└── ROADMAP.md                ← Cronograma
```

**Regra:** Em caso de conflito entre documentos, `MASTER_PLAN.md` prevalece.

### Versionamento

| Versão | Data | Alteração |
|--------|------|-----------|
| 1.0 | Jul/2026 | Criação inicial — 20 seções completas |

### Processo de Atualização

1. Toda mudança de escopo deve ser refletida neste documento **antes** da implementação
2. Versão incrementada a cada alteração significativa
3. Changelog no final do documento

---

## Resumo Executivo

| Dimensão | Planejado |
|----------|-----------|
| **Produto** | SaaS CRM imobiliário · 14 módulos · 3 planos |
| **Público** | Imobiliárias BR · 1-50 corretores |
| **Stack** | React TS + Node TS + PostgreSQL + Docker |
| **Entidades** | 18 tabelas · 24 enums |
| **Telas** | 21 |
| **APIs** | ~95 endpoints |
| **Componentes** | 28 reutilizáveis |
| **Fases** | 6 (34 semanas até SaaS comercial) |
| **Diferencial** | Design premium + IA + performance + preço |

---

> **Status: Aguardando aprovação.**  
> Nenhum código será escrito até aprovação explícita deste MASTER PLAN.  
> Após aprovação, a implementação inicia pela **Fase 1 — Fundação Arquitetural**.

---

*SUSSAI CRM — MASTER PLAN v1.0*  
*Product Owner · Arquiteto de Software · UX Designer*
