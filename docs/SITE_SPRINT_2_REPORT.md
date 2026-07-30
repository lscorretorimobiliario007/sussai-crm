# Site Sprint 2 — Relatório

**Status:** concluída — aguardando aprovação  
**Data:** 2026-07-16  
**Escopo:** Portal Top Conceição integrado ao backend SUSSAI (sem novos módulos no CRM)

---

## Objetivo

Transformar o site da Top Conceição em portal imobiliário profissional, consumindo imóveis reais do CRM e preparando o fluxo de leads Site → Lead → Pipeline → Agenda.

---

## Prioridade 1 — Dados reais (sem mocks)

### Removido
- `top-conceicao-site/src/data/mockProperties.ts`
- `top-conceicao-site/src/data/mockBrokers.ts`
- `top-conceicao-site/src/data/mockBlog.ts`

### API pública SUSSAI (não é módulo novo)
Rotas em `/public/*`, montadas no router existente:

| Método | Rota | Função |
|--------|------|--------|
| GET | `/public/empresa` | Dados públicos da imobiliária |
| GET | `/public/imoveis` | Listagem com filtros/seções |
| GET | `/public/imoveis/:slugOrCodigo` | Detalhe + semelhantes |
| GET | `/public/imoveis/:id/fotos/:fotoId` | Foto pública |
| GET | `/public/corretores` | Corretores ativos |
| POST | `/public/leads` | Lead + cliente + opcional agenda |

**Configuração:** `SITE_EMPRESA_ID` no backend (ver `backend/.env.example`).  
**CORS:** incluir origem do site (ex.: `http://localhost:3001`) em `CORS_ORIGIN`.

### Campos de publicação no imóvel
Migration `20260716190000_site_publicacao_imovel`:

- `publicadoSite`, `destaqueSite`, `lancamento`, `altoPadrao`
- `slug` (único por empresa), `tourVirtualUrl`, `videoUrl`, `latitude`, `longitude`

CRM: seção **Publicação no site** em `ImovelForm.jsx`. Alterações no CRM refletem no site (fetch `no-store` / revalidate curto).

### Site client
- `top-conceicao-site/src/lib/api.ts` — `fetchProperties`, `fetchProperty`, `fetchBrokers`, `submitLead`, `mediaUrl`
- Env: `SUSSAI_API_URL` / `NEXT_PUBLIC_SUSSAI_API_URL` (ver `.env.example`)

---

## Prioridade 2 — Home

Implementado:

- Header fixo com animação ao rolar (`Header.tsx`)
- Hero premium + busca avançada (`HeroBanner` + `SmartSearch`)
- Seções: Destaque, Lançamentos, Alto Padrão, Comerciais
- Avalie seu imóvel (`CtaBand` + página `/avalie-seu-imovel`)
- Corretores (API)
- Depoimentos (`content/testimonials.ts`)
- Blog editorial (`content/blog.ts`)
- Rodapé completo (`Footer.tsx`)

---

## Prioridade 3 — Página do imóvel (`/imoveis/[slug]`)

- Galeria premium + lightbox
- Tour virtual / vídeo (estrutura: botões quando URLs existem no CRM)
- Mapa Google (embed por lat/lng ou endereço)
- Simulador de financiamento
- Formulário de interesse (`LeadForm` → `POST /public/leads`)
- WhatsApp + agendar visita
- Imóveis semelhantes

---

## Prioridade 4 — SEO

- Open Graph / Twitter via `buildMetadata`
- Meta tags no layout e páginas
- `sitemap.ts` (estáticas + imóveis + blog)
- `robots.ts`
- JSON-LD `RealEstateListing` no detalhe
- URLs amigáveis por `slug`

---

## Prioridade 5 — Lead → Pipeline → Agenda

`POST /public/leads`:

1. Cria/atualiza **Cliente**
2. Cria **Lead** na primeira etapa aberta do pipeline (`origem: SITE`)
3. Histórico + comentário
4. Se `agendarVisita` + `dataVisita` → cria **EventoAgenda** (`tipo: VISITA`) vinculado ao lead

Formulários no site: interesse (imóvel), contato, avaliação, visita.

---

## Qualidade

| Check | Resultado |
|-------|-----------|
| `npm run build` (site) | OK (Next.js 15.5.20) |
| Mocks de imóveis/corretores | Removidos |
| Novos módulos CRM | Nenhum |

**Observação de build:** em ambientes com certificado corporativo, pode ser necessário `NODE_OPTIONS=--use-system-ca` para baixar Google Fonts.

---

## Como validar localmente

1. Backend com `SITE_EMPRESA_ID=<id da Top Conceição>` e CORS com `http://localhost:3001`
2. `npm run seed:demo` (ou imóveis reais com `publicadoSite`)
3. Site: `cd top-conceicao-site && npm run dev` (porta 3001 recomendada)
4. Confirmar listagens na home e detalhe com fotos do CRM
5. Enviar formulário e verificar Lead + Agenda no SUSSAI

---

## Fora de escopo / próximos passos

- CMS de blog no CRM (hoje editorial estático no site)
- Tour/vídeo embutidos (hoje links externos preparados)
- Cache CDN / ISR por imóvel em produção
- Chave Google Maps (hoje embed público)

---

## Arquivos principais

**Backend:** `publicSiteController.js`, `publicSiteRoutes.js`, migration site, `ImovelForm.jsx`  
**Site:** `src/lib/api.ts`, `src/app/page.tsx`, `src/app/imoveis/[slug]/page.tsx`, `LeadForm`, `PropertyGallery`, SEO (`sitemap.ts`, `robots.ts`, `seo.ts`)

---

**Aguardando aprovação da Site Sprint 2.**
