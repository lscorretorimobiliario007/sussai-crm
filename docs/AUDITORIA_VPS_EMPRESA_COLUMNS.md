# Auditoria VPS — Empresa.nomeFantasia / Empresa.ativo

## Diagnóstico (causa raiz)

1. Migration `20260717031941_create_empresa` **recria** a tabela `Empresa` apenas com:
   `id, nome, cnpj, email, telefone, createdAt, updatedAt`
2. Colunas `nomeFantasia` / `ativo` deveriam ser adicionadas por:
   - `20260716210000_empresa_implantacao` (nomeFantasia) — **antes** da recriação, então perde efeito
   - `20260807013943_crm_full_modules` — **ADD COLUMN ativo, nomeFantasia, …**
3. Se a VPS está com o schema “mínimo” de `create_empresa` e **não** aplicou `crm_full_modules` (ou falhou no meio), o Nest lança:
   `The column Empresa.nomeFantasia does not exist` / `Empresa.ativo does not exist`

## Status desta máquina (Cursor)

| Item | Resultado |
|------|-----------|
| `DATABASE_URL` local | `localhost` / `imobiliaria` — **não é o banco da VPS** |
| SSH config | Ausente neste ambiente |
| DNS `api.topconceicao.com.br` | Não resolve daqui |
| Migration repair | Criada e **aplicada no banco local** |
| Acesso para `migrate deploy` na VPS | **Bloqueado sem credenciais/SSH/URL remota** |

Para fechar a VPS, rode no servidor (com o `.env` de produção):

```bash
cd backend
git pull   # pegar migration 20260808010000_ensure_empresa_schema_columns
npm run vps:fix-empresa
# ou: bash scripts/vps-fix-empresa.sh
pm2 restart sussai-api   # ou o nome do processo
```

Depois valide login, `/auth/me`, site, leads e uploads na URL pública.


## Correção (sem `db push`)

Nova migration idempotente adicionada:

`prisma/migrations/20260808010000_ensure_empresa_schema_columns`

Ela usa `ADD COLUMN IF NOT EXISTS` para `nomeFantasia`, `ativo` e demais campos de branding do `schema.prisma`.

### Na VPS (obrigatório)

```bash
cd /caminho/do/backend   # pasta do deploy
# Confirme o banco:
node -e "const u=new URL(process.env.DATABASE_URL); console.log(u.hostname,u.pathname)"
# ou:
grep ^DATABASE_URL= .env | sed 's/:[^:@]*@/:***@/'

npx prisma migrate status
npx prisma migrate deploy
npx prisma generate
node scripts/audit-empresa-columns.mjs

# Deve imprimir: OK: all required Empresa columns present

npx prisma db seed   # se necessário
npm run smoke:login
# reiniciar PM2/systemd
```

### Validação pós-deploy

```bash
curl -s https://api.topconceicao.com.br/api/public/empresa
curl -s -X POST https://api.topconceicao.com.br/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@topconceicao.com.br","senha":"Admin@123"}'
# com token: GET /api/auth/me
# POST /api/public/leads
# upload de fotos no CRM
```

## Migrations responsáveis

| Coluna | Migration original | Observação |
|--------|--------------------|------------|
| `ativo` | `20260807013943_crm_full_modules` | Após recreate de Empresa |
| `nomeFantasia` | `20260807013943_crm_full_modules` (+ implantacao antiga perdida no recreate) | |
| reparo VPS | `20260808010000_ensure_empresa_schema_columns` | Idempotente |

## Script

`backend/scripts/audit-empresa-columns.mjs` — lista colunas, marca missing, mostra host (mascarado).
