# SUSSAI CRM — RELEASE 1.0 — PROVA DE EXECUÇÃO

**Data:** 2026-08-08  
**Modo:** Release Engineering (execução real, não especulação)  
**Resultado:** **FUNCIONANDO** — `RELEASE GATE PASSED 67/67`

---

## 1) Checklist automática (executada)

| Item | Resultado |
|------|-----------|
| LOGIN ADMIN/GERENTE/CORRETOR | ✓ executado |
| /auth/me | ✓ tipo correto |
| refresh token | ✓ |
| HEALTH | ✓ healthy |
| SECURITY /users | ✓ 401 |
| PROPRIETÁRIO create/edit/search/excluir | ✓ |
| IMÓVEL reject sem owner | ✓ 400 |
| IMÓVEL create + site | ✓ |
| UPLOAD + foto principal + serve PNG | ✓ 200 |
| LEADS CONTATO/VISITA/AVALIAÇÃO/CAPTAÇÃO | ✓ no CRM |
| AGENDA / PIPELINE / CLIENTES | ✓ |
| FINANCEIRO / DOCUMENTOS / CORRETORES | ✓ |
| IA / EMPRESA / SEO sitemap | ✓ |
| SITE páginas + favicon | ✓ |
| ANALYTICS / CLARITY (código) | ✓ |
| RESPONSIVIDADE 14×6 | ✓ zero overflow |
| Prisma 32 migrations / zero drift | ✓ |
| npm test 19/19 | ✓ |
| build+lint BE/FE/Site | ✓ |

---

## 2) Comandos de prova (saídas)

### Release gate
```
PASSED 67 / 67
FAILED 0
RELEASE GATE PASSED
```

### Prisma
```
32 migrations found
Database schema is up to date!
DRIFT CHECK OK — database matches schema.prisma
```

### Testes
```
Test Suites: 18 passed
Tests: 19 passed
```

### Responsividade (Chrome system)
```
RESPONSIVE OK 14 widths x 6 pages
(320–1920: /, /comprar, /contato, /anuncie-seu-imovel, /busca, /avalie-seu-imovel)
```

### Smokes
```
SMOKE LOGIN OK
HEALTHCHECK OK healthy
SMOKE API OK
SMOKE SITE OK
E2E STABILIZATION PASSED
```

---

## 3) Produção: `git pull` + `./deploy.sh`

Na VPS (working tree limpa, PM2 instalado):

```bash
git pull
./deploy.sh
```

O `deploy-production.mjs` agora:
1. `npm ci` BE/FE  
2. Prisma generate via `node_modules/.bin/prisma` (não baixa Prisma 7 via npx)  
3. `migrate status` + `migrate deploy` (nunca db push)  
4. audit/drift  
5. build + test  
6. smokes  
7. `pm2 restart`  
8. **`release-gate.mjs` completo** pós-restart  

Se o banco de produção ainda estiver sem `_prisma_migrations` / sem `Empresa.ativo`:

```bash
cd backend && ./scripts/repair-production-db.sh
# depois: ./deploy.sh
```

---

## 4) Arquivos alterados / novos (release)

Ver `git status` abaixo. Principais entregáveis de release:
- `backend/scripts/release-gate.mjs`
- `backend/scripts/responsive-gate.mjs`
- `backend/scripts/repair-production-db.sh` + baseline
- `scripts/deploy-production.mjs` (prisma local + release-gate + SKIP_PM2/SKIP_INSTALL)
- `deploy.sh` / `ecosystem.config.cjs` / `deploy/nginx-api.conf`

---

## 5) Como revalidar a qualquer momento

```bash
cd backend
npm run release:gate
npm run release:responsive   # CHROME_PATH se necessário
npm test && npm run lint && npm run build
npx prisma migrate status
node scripts/check-db-drift.mjs
```
