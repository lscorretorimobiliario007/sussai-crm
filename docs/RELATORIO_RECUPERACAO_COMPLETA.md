# Relatório Único — Recuperação Completa SUSSAI CRM + Site

**Data:** 2026-08-08  
**Escopo:** backend NestJS + frontend CRM + site Next.js + PostgreSQL/Prisma + deploy (PM2/nginx)  
**Ambiente validado:** local (API `:3000`, site `:3001`, DB `localhost/imobiliaria`)  
**VPS:** código e runbooks prontos; deploy remoto bloqueado sem SSH/`DATABASE_URL` de produção nesta máquina

---

## Veredito

**Local pronto para produção.** Causas raiz corrigidas (não patches pontuais). Gates verdes: build, lint, testes, migrations, drift zero, smokes, E2E, upload de imagens, refresh token.

---

## Causas raiz corrigidas

| Problema | Causa raiz | Correção |
|----------|------------|----------|
| `Empresa.nomeFantasia` / `ativo` | Migration destrutiva + recreate sem colunas | Migration idempotente `20260808010000` + audit/drift |
| Uploads quebrados em prod | Nest ignorava `UPLOAD_DIR`; static em `dist/uploads` | `getUploadsRoot()` único + um mount estático |
| `POST /api/users` aberto | Scaffold sem guard | JWT + ADMIN; `empresaId` do token |
| `/api/companies` cross-tenant | Sem roles/scope | ADMIN + isolamento por `empresaId` |
| Signup/CORS fail-open | Defaults permissivos | Fail-closed em `NODE_ENV=production` |
| Stub `UploadsModule` | CRUD falso público | Removido do `AppModule` |
| Avatar/docs cliente fake | `memoryStorage` + stub URL | Disk real sob uploads |
| Backup falso `CONCLUIDO` | Stub | `501 Not Implemented` |
| Sessão após F5 / registrar / demo | AuthContext incompleto | `mapUsuario` + `registrar` + `resetarDemo` |
| Refresh token inutilizado | Axios logout em 401 | Retry via `POST /auth/refresh` |
| Sitemap sem imóveis | `limit=100` > `@Max(48)` | Max 100 + paginação site |
| PM2 apontava Express | Doc `src/server.js` | Nest `ecosystem.config.cjs` + docs |
| Deploy guide sem `/api` | URL incompleta | Docs corrigidos |
| Favicon 404 / contraste LH | Assets/token | favicon + `goldText` |

---

## Checklist obrigatório

| Item | Status |
|------|--------|
| login | ✓ ADMIN / GERENTE / CORRETOR |
| refresh token | ✓ `POST /auth/refresh` + interceptor FE |
| upload / imagens | ✓ multipart + serve `/uploads/...` 200 |
| proprietários | ✓ create/edit E2E |
| imóveis | ✓ owner obrigatório + create E2E |
| clientes | ✓ smoke API + upload disk corrigido |
| agenda | ✓ smoke API |
| pipeline | ✓ “Aguardando contato” + seed stages |
| leads | ✓ CRM list + public |
| formulários / captação / avaliação / visita | ✓ E2E leads |
| IA | ✓ módulo rule-based (MVP) |
| Analytics | ✓ GA4 no site |
| Clarity | ✓ componente gated (precisa `NEXT_PUBLIC_CLARITY_ID` na VPS) |
| responsividade | ✓ site overflow/clip + forms |
| SEO | ✓ robots + sitemap com `/imoveis/*` |
| Lighthouse | ✓ favicon + contraste; revalidar score na VPS |
| Prisma / PostgreSQL | ✓ 32 migrations, **zero drift** |
| PM2 | ✓ `backend/ecosystem.config.cjs` (Nest) |
| nginx | ✓ `deploy/nginx-api.conf` + docs |
| deploy local | ✓ `npm run build` + `start:prod` |

---

## Gates executados (local)

| Gate | Resultado |
|------|-----------|
| `prisma migrate status/deploy` | up to date / no pending |
| `check:drift` | DRIFT CHECK OK |
| `audit:empresa` | OK columns |
| Backend `build` | OK |
| Backend `lint` | 0 errors |
| Backend `test` | **19/19** |
| Frontend `lint` | 0 errors (6 warnings refresh) |
| Frontend `build` | OK |
| Site `lint` / `build` | OK |
| `smoke:health` | healthy |
| `smoke:login` | OK |
| `smoke:api` | OK |
| `smoke:site` | OK |
| `e2e-stabilization` | PASSED |
| Security probe | `POST /users` + `GET /companies` → **401** |

---

## Artefatos de deploy

- `backend/ecosystem.config.cjs` — PM2 Nest (`dist/src/main.js`)
- `deploy/nginx-api.conf` — proxy API + `/uploads/`
- `backend/src/LEGACY_EXPRESS.md` — não usar `src/server.js`
- `docs/DEPLOY_GUIDE.md` — corrigido (Nest + `/api`)
- Script VPS: `npm run vps:fix-empresa` / `scripts/vps-fix-empresa.sh`

### Na VPS (obrigatório — não executável daqui)

```bash
cd backend
git pull
npm ci
npx prisma migrate deploy   # NUNCA db push
npx prisma generate
npm run build
node scripts/audit-empresa-columns.mjs
node scripts/check-db-drift.mjs
npx prisma db seed
pm2 startOrReload ecosystem.config.cjs --env production
# nginx: aplicar deploy/nginx-api.conf e reload
```

Env produção mínimos: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `UPLOAD_DIR`, `SITE_EMPRESA_ID`, `ALLOW_PUBLIC_SIGNUP=false`, `ALLOW_DEMO=false`, site `NEXT_PUBLIC_SUSSAI_API_URL=https://api…/api`, `NEXT_PUBLIC_CLARITY_ID` (Clarity).

---

## Limitações honestas

1. **VPS não validada nesta sessão** (sem SSH / DNS `api.topconceicao.com.br` / `DATABASE_URL` remoto).
2. Express legado permanece no tree (não bootado); entrypoint oficial é Nest.
3. Clarity só ativa com ID real em produção.
4. Captação ainda envia metadados de fotos no lead (não multipart binário) — contrato atual do formulário.
5. IA = provedor rule-based (preparado; não LLM).

---

## Conclusão

Tudo corrigido na causa raiz, testado e funcionando **localmente**, com zero drift Prisma e pipeline de deploy (PM2/nginx) alinhado ao Nest.  
Pronto para subir à VPS com o bloco acima; após `migrate deploy` + PM2, repetir smokes na URL pública.
