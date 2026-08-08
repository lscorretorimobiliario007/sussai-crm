# Deploy Pipeline — SUSSAI CRM (SaaS-grade)

## Objetivo

Nunca publicar código incompatível com o banco.  
Se qualquer gate falhar: **cancelar deploy** e **não reiniciar PM2**.  
Se healthcheck/login falhar após restart: **rollback automático** para o SHA anterior.

## Comando único

```bash
# Linux / VPS
./deploy.sh
# ou
npm run deploy:production

# Windows
pwsh -File .\deploy.ps1
npm run deploy:production
```

Requer: Node 20+, npm, git, PostgreSQL (`DATABASE_URL`), PM2 (`PM2_APP_NAME`, default `sussai-api`).

## Ordem obrigatória

1. Verificar branch (`DEPLOY_BRANCH`, default `main`)
2. `git pull --ff-only`
3. `npm ci` (backend + frontend)
4. `prisma generate`
5. `prisma migrate status`
6. `prisma migrate deploy` (**nunca** `db push`)
7. Auditorias de banco:
   - `audit-empresa-columns.mjs`
   - `rc-preflight.mjs`
   - `check-db-drift.mjs` (DB = `schema.prisma`)
   - tabelas core + migrations incompletas
8. `npm run build` backend
9. `npm run build` frontend
10. `npm test` backend
11. Smokes pré-restart (login / API / site — se API já estiver no ar)
12. **Somente se tudo passou:** `pm2 restart`
13. Healthcheck `GET /api/health`
14. Smoke login + API (+ site) novamente
15. Grava SHA em `.deploy/last-successful-sha.txt`

## Rollback automático

Se falhar **após** `pm2 restart`:

1. `git reset --hard <SHA_ANTERIOR>`
2. Reinstall + generate + build
3. `pm2 restart`
4. Healthcheck + smoke login

> Migrations Prisma são forward-only. O rollback de código não desfaz SQL já aplicado. Por isso o gate de drift/migrate existe **antes** do restart.

## Variáveis

| Env | Default | Uso |
|-----|---------|-----|
| `DATABASE_URL` | — | Obrigatória |
| `JWT_SECRET` | — | Obrigatória em prod |
| `API_URL` | `http://127.0.0.1:3000/api` | Smokes |
| `SITE_URL` | `http://127.0.0.1:3001` | Smoke site |
| `PM2_APP_NAME` | `sussai-api` | Restart |
| `DEPLOY_BRANCH` | `main` | Branch permitida |
| `SKIP_GIT_PULL` | `0` | `1` em dry-run |
| `SKIP_SITE_SMOKE` | `0` | `1` se site offline |
| `ALLOW_DIRTY_GIT` | `0` | `1` só emergências |
| `ALLOW_OFFLINE_PRERESTART` | `0` | `1` no **primeiro** deploy (API ainda não sobe) |
| `SMOKE_EMAIL` / `SMOKE_SENHA` | admin seed | Login smoke |

## Scripts

| Script | Função |
|--------|--------|
| `scripts/deploy-production.mjs` | Orquestrador |
| `backend/scripts/check-db-drift.mjs` | Drift DB↔schema |
| `backend/scripts/audit-database.mjs` | Pacote de auditorias |
| `backend/scripts/audit-empresa-columns.mjs` | Colunas Empresa |
| `backend/scripts/smoke-login.mjs` | Login + me + refresh |
| `backend/scripts/smoke-api.mjs` | APIs principais |
| `backend/scripts/smoke-site.mjs` | Páginas do site |
| `backend/scripts/smoke-health.mjs` | `/api/health` |

## CI (GitHub Actions)

Workflow: `.github/workflows/rc-ci.yml`

Antes de merge em `main`:

- backend: `migrate deploy` + `migrate status` + drift check + lint + build + test + smoke
- frontend: lint + build

Branch protection recomendada: exigir check `backend-gate` + `frontend` verdes.

## Endpoint health

`GET /api/health` → `{ ok: true, status: "healthy" }` (ping no PostgreSQL).

## Checklist pós-deploy

- [ ] `curl -sf "$API_URL/health"`
- [ ] Login ADMIN
- [ ] Lead site → CRM
- [ ] Upload foto imóvel
- [ ] `pm2 status`
