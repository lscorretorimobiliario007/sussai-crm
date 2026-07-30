# SUSSAI CRM

**Sistema Inteligente para Imobiliárias** — fase **Go Live** (pós-RC1)

SaaS multi-tenant para imobiliárias + portal público **Top Conceição Imóveis**.

## Documentação Principal

| Documento | Conteúdo |
|-----------|----------|
| **[docs/GO_LIVE_CHECKLIST.md](docs/GO_LIVE_CHECKLIST.md)** | **Checklist de implantação / go-live** |
| **[docs/DEPLOY_GUIDE.md](docs/DEPLOY_GUIDE.md)** | **Como publicar API, CRM, Site e Banco** |
| [docs/RC1_REPORT.md](docs/RC1_REPORT.md) | Relatório RC1 — estabilização |
| [docs/SITE_SPRINT_2_REPORT.md](docs/SITE_SPRINT_2_REPORT.md) | Site integrado ao CRM |
| [docs/SITE_MASTER_PLAN.md](docs/SITE_MASTER_PLAN.md) | Arquitetura do site |
| [docs/MVP_CHECKLIST.md](docs/MVP_CHECKLIST.md) | Checklist MVP / piloto |
| [CHANGELOG.md](CHANGELOG.md) | Histórico de mudanças |

## Estado atual (Go Live)

| Camada | Status |
|--------|--------|
| Backend | Node 20 · Express · Prisma · PostgreSQL · Swagger `/api/docs` |
| Frontend CRM | React · Vite · MUI · Design System SUSSAI |
| Site | Next.js 15 · imóveis reais via `/public/*` |
| Multiempresa | Escopo por `empresaId` + ownership do corretor |
| Implantação | Checklist + guia de deploy prontos para Top Conceição |

## Módulos operacionais

Login · Dashboard · Imóveis · Clientes · Proprietários · Corretores · Agenda · Pipeline · Contratos · Financeiro · Tarefas · Configurações · Site público

## Stack

| Camada | Tecnologias |
|--------|-------------|
| Frontend CRM | React 18, Vite, Material UI, React Router, Axios |
| Site | Next.js 15, React 19, MUI 6, TypeScript |
| Backend | Node.js, Express, Prisma, PostgreSQL, JWT |
| Docs API | OpenAPI 3 + Swagger UI |

## Requisitos

- Node.js 20+
- PostgreSQL 16+

## Instalação

### Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate deploy
npm run dev
```

- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/api/docs`
- OpenAPI JSON: `http://localhost:3000/api/docs/openapi.json`

Configure `SITE_EMPRESA_ID` e `CORS_ORIGIN` (inclua `http://localhost:3001` para o site).

### Frontend CRM

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App: `http://localhost:5173`

### Site Top Conceição

```bash
cd top-conceicao-site
cp .env.example .env.local
npm install
npm run dev
```

Site: `http://localhost:3001`

## Gates de qualidade (raiz)

```bash
npm run check   # backend boot + lint frontend + lint site
npm run build   # validate backend + build frontend + build site
```

## Demo

```bash
cd backend
npm run seed:demo
```

Login demo: `demo@sussai.com.br` / `123456` (quando seed ativo).

## Primeiro acesso

1. Acesse `http://localhost:5173/registrar` (se `ALLOW_PUBLIC_SIGNUP=true`)
2. Ou use o modo demonstração na tela de login
3. Publique imóveis no CRM (`Publicado no site`) para aparecerem no portal
