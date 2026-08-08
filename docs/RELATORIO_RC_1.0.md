# SUSSAI CRM — Release Candidate 1.0

**Data:** 2026-08-07  
**Versão:** `1.0.0-rc1`

---

## Resultado

| Critério | Status |
|----------|--------|
| CRM 100% funcional (22 módulos smoke 200) | ✅ |
| Site 100% funcional (build/lint + páginas) | ✅ |
| Proprietários (criar/editar com campos vazios) | ✅ |
| Imóvel exigindo proprietário | ✅ |
| Leads Site→CRM (CONTATO / VISITA / CAPTACAO / AVALIACAO) | ✅ |
| Fotos públicas | ✅ |
| Analytics GA4 + eventos WhatsApp/telefone/formulário | ✅ |
| Clarity (componente + env) | ✅ |
| IA preparada (módulo `/api/ai/*` rule-based) | ✅ |
| Deploy seguro (preflight + smoke login + CI) | ✅ |
| Login estável pós-atualização (seed + smoke gate + refresh) | ✅ |
| Build / Lint / Testes | ✅ |

---

## Fases executadas

### 1 — Auditoria geral
22 endpoints autenticados HTTP 200 (dashboard → auditoria + auth/me).

### 2 — Proprietários
Normalização `"" → null` no formulário + DTO com `EmptyToNull`/`ValidateIf`.

### 3 — Imóveis
`proprietarioId` obrigatório no DTO/service; modal **Cadastrar Proprietário**.

### 4 — Leads
Formulários site → `POST /api/public/leads`; visita sem data = NOVO sem agenda; UI “Aguardando contato”.

### 5 — Site
Responsividade (overflow clip, hero clamp, cards), SEO, Analytics, Clarity, fotos `/uploads`.

### 6 — IA
Módulo Nest `AiModule` com provider trocável:
- `GET /api/ai/status`
- `POST /api/ai/leads/classify|score`
- `POST /api/ai/properties/suggest`
- `POST /api/ai/clientes/summarize`
- `POST /api/ai/proprietarios/summarize`
- `POST /api/ai/assistant`

### 7 — Google Analytics
GA4 `G-485LNQRQ1B`, pageviews App Router, `generate_lead` / `form_submit` / `whatsapp_click` / `phone_click`.

### 8 — Segurança de login
- Seed upsert ADMIN/GERENTE/CORRETOR + bcrypt
- `scripts/rc-preflight.mjs` valida DB/JWT/hash
- `scripts/smoke-login.mjs` cancela deploy se login ≠ 200
- `POST /api/auth/refresh` (sliding JWT)
- JWT_SECRET obrigatório em produção

### 9 — Deploy
- `scripts/rc-gate.mjs`
- `.github/workflows/rc-ci.yml`
- `docs/DEPLOY_SEGURO.md`

### 10 — Testes
`e2e-stabilization.mjs` + unitários backend 18/18.

---

## Arquivos novos / alterados (RC 1.0)

### Novos
- `backend/src/ai/**`
- `backend/scripts/smoke-login.mjs`
- `backend/scripts/rc-preflight.mjs`
- `backend/scripts/rc-gate.mjs`
- `.github/workflows/rc-ci.yml`
- `docs/DEPLOY_SEGURO.md`
- `docs/RELATORIO_RC_1.0.md`
- `top-conceicao-site-novo/src/components/property/PropertyWhatsAppButton.tsx`

### Alterados (estabilização)
- Auth refresh + AppModule AiModule
- Proprietários / Imóveis / Pipeline / Site leads
- Frontend formatters + PropertyOwnerSelector + ProprietarioForm
- Site LeadForm / Anuncie / globals / Hero / PageHero / PropertyCard

---

## Credenciais seed (local)

```
admin@topconceicao.com.br / Admin@123
gerente@topconceicao.com.br / Admin@123
corretor@topconceicao.com.br / Admin@123
```

## Pronto para produção comercial

Sim — desde que o pipeline `rc:gate` / CI passe no ambiente alvo com `JWT_SECRET` e `DATABASE_URL` reais.
