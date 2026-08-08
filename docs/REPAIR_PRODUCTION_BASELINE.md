# Baseline incompleto em produção — reparo seguro (Prisma Migrate)

## Diagnóstico confirmado

| Sintoma | Interpretação |
|---------|----------------|
| `_prisma_migrations` **não existe** | Banco criado fora do Migrate / baseline nunca registrado |
| `Empresa` existe **sem** `ativo` / `nomeFantasia` | Estado físico = pós `20260717031941_create_empresa`, pré `20260807013943_crm_full_modules` |
| Dados de produção existentes | **Preservar** — nunca `db push`, nunca reexecutar DROPs |

## Causa raiz

1. Projeto começou sem Prisma Migrate.
2. Migration `20260717025403_create_usuario` é **destrutiva** (DROP de Empresa/CRM).
3. `20260717031941_create_empresa` recria `Empresa` **mínima** (sem `ativo`/`nomeFantasia`).
4. Colunas voltaram só em `crm_full_modules` + `empresa_branding_fields` + `ensure_empresa_schema_columns`.
5. Sem `_prisma_migrations`, o Prisma não sabe o que já rodou e o Nest quebra ao selecionar `nomeFantasia`/`ativo`.

## Procedimento (automático)

Script único idempotente:

```bash
cd backend
chmod +x scripts/repair-production-db.sh
./scripts/repair-production-db.sh
# ou na raiz: ./repair-production-db.sh
```

Dry-run (só plano, sem mutate se `REPAIR_DRY_RUN=1`):

```bash
REPAIR_DRY_RUN=1 ./scripts/repair-production-db.sh
```

### O que o script faz

1. Lê `DATABASE_URL` do `.env` (recusa `localhost` sem `FORCE_LOCAL=1`).
2. Introspecta tabelas/colunas reais.
3. Marca com `prisma migrate resolve --applied` **somente**:
   - histórico até `create_empresa` (inclui o DROP `create_usuario` — **nunca** fica pending);
   - migrations Nest já refletidas (`properties`, `leads`, `pipeline_stages`, …);
   - `crm_full_modules` **só se** `Cliente`+`AuditLog` já existirem (aplicação parcial).
4. Cria `_prisma_migrations` automaticamente no primeiro `resolve`.
5. Roda `prisma migrate deploy` nas pendentes (tipicamente):
   - `20260807013943_crm_full_modules`
   - `20260807020000_empresa_branding_fields`
   - `20260808010000_ensure_empresa_schema_columns`
6. Valida colunas Empresa, drift, audit, smoke login, PM2 reload.

### Hard rules

- **Nunca** `prisma db push`
- **Nunca** reexecutar `20260717025403_create_usuario` (DROP total)
- **Nunca** marcar `crm_full_modules` como applied se `ativo`/`nomeFantasia` faltam **e** tabelas CRM não existem
- **Nunca** deixar `properties_pt_br` pending se `properties` já existe (DROP)

## Comandos manuais equivalentes (referência)

```bash
# Após introspecção típica (properties/leads já no ar):
for m in \
  20260713021938_init \
  20260713022303_init \
  20260714000412_usuario_admin \
  20260714011954_create_imovel \
  20260716011200_crm_completo \
  20260716024100_imoveis_completo \
  20260716030500_imovel_historico_extra \
  20260716040000_clientes_completo \
  20260716050000_agenda_completa \
  20260716060000_pipeline_crm \
  20260716070000_proprietarios_corretores \
  20260716120000_mvp_indexes \
  20260716140000_financeiro_completo \
  20260716180000_imoveis_refinamento_r1 \
  20260716190000_site_publicacao_imovel \
  20260716200000_rc1_indexes \
  20260716210000_empresa_implantacao \
  20260716220000_v1_imoveis_operacao \
  20260716230000_v1_imoveis_refinamento_final \
  20260717025403_create_usuario \
  20260717031941_create_empresa \
  20260717120000_create_property \
  20260717130000_usuario_perfil \
  20260717140000_properties_pt_br \
  20260717150000_property_images \
  20260717160000_property_slug \
  20260717170000_create_leads \
  20260717180000_pipeline_stages \
  20260801032000_create_property_owners
do
  npx prisma migrate resolve --applied "$m"
done

npx prisma migrate deploy
npx prisma generate
node scripts/audit-empresa-columns.mjs
node scripts/check-db-drift.mjs
pm2 startOrReload ecosystem.config.cjs --env production
npm run smoke:login
```

## Validação esperada

```
OK: all required Empresa columns present
DRIFT CHECK OK
SMOKE LOGIN OK
pm2 status → sussai-api online
```
