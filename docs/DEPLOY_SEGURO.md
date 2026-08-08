# Deploy Seguro — SUSSAI CRM RC 1.0

## Objetivo

Nunca publicar versão com login quebrado. Se o smoke de autenticação falhar, o deploy é cancelado.

## Pré-requisitos de ambiente

| Variável | Obrigatória | Notas |
|----------|-------------|-------|
| `DATABASE_URL` | Sim | PostgreSQL |
| `JWT_SECRET` | Sim em produção | Sem fallback inseguro |
| `SITE_EMPRESA_ID` | Sim | Empresa do site público |
| `JWT_EXPIRES_IN` | Não | Default `1d` |
| `AI_ENABLED` | Não | Default off; IA rule-based disponível |
| `CORS_ORIGIN` | Recomendado | Origens do CRM + site |

## Fluxo obrigatório

```text
1. npm ci (backend + frontend)
2. npx prisma migrate deploy
3. npx prisma db seed          # garante ADMIN/GERENTE/CORRETOR + bcrypt Admin@123
4. npm run preflight           # valida DB + hash admin + JWT
5. npm run build && npm run lint && npm test
6. Subir API (start:prod)
7. npm run smoke:login         # FAIL => cancelar deploy
8. npm run e2e:rc              # FAIL => cancelar deploy
9. Publicar artefatos
```

Atalho local (API já no ar):

```bash
cd backend
npm run rc:gate
```

## Pós-atualização

Sempre executar `smoke:login` após qualquer migrate/seed/deploy.  
Endpoint `POST /api/auth/refresh` renova JWT de sessão válida (sliding), reduzindo logout indevido.

## Rollback

1. Manter release anterior (imagem/tag) disponível.
2. Se smoke pós-deploy falhar: restaurar tag anterior + `migrate` só se backward-compatible.
3. Reexecutar `smoke:login` na versão restaurada.

## CI

Workflow: `.github/workflows/rc-ci.yml`  
Gate: build + lint + test + migrate + seed + smoke login + e2e.
