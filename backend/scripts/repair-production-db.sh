#!/usr/bin/env bash
# =============================================================================
# repair-production-db.sh
# Recuperação idempotente do baseline Prisma em produção (SEM db push, SEM DROP).
#
# Diagnóstico alvo:
#   - tabela "_prisma_migrations" ausente
#   - "Empresa" existe sem colunas ativo / nomeFantasia
#   - histórico criado fora do Prisma Migrate
#
# O que faz:
#   1. Introspecta o PostgreSQL
#   2. Cria "_prisma_migrations" via `prisma migrate resolve` (quando necessário)
#   3. Marca com --applied somente migrations já refletidas / históricas destrutivas
#   4. Aplica pendentes com `prisma migrate deploy` (nunca db push)
#   5. Valida colunas Empresa + drift + smoke login + PM2
#
# Uso (na VPS, pasta backend/):
#   chmod +x scripts/repair-production-db.sh
#   ./scripts/repair-production-db.sh
#
# Dry-run:
#   REPAIR_DRY_RUN=1 ./scripts/repair-production-db.sh
#
# Local (não produção):
#   FORCE_LOCAL=1 ./scripts/repair-production-db.sh
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> SUSSAI repair-production-db"
echo "    cwd: $ROOT"

if [[ ! -f .env ]]; then
  echo "FATAL: .env não encontrado em $ROOT"
  exit 1
fi

# shellcheck disable=SC1091
set -a
# Load .env without executing arbitrary shell (basic KEY=VALUE)
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%"${line##*[![:space:]]}"}"
  [[ -z "$line" || "$line" == \#* ]] && continue
  if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
    key="${BASH_REMATCH[1]}"
    val="${BASH_REMATCH[2]}"
    val="${val%\"}"
    val="${val#\"}"
    val="${val%\'}"
    val="${val#\'}"
    export "$key=$val"
  fi
done < .env
set +a

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "FATAL: DATABASE_URL ausente"
  exit 1
fi

echo "==> Host DB (mascarado):"
node -e "const u=new URL(process.env.DATABASE_URL);u.password='***';console.log(u.hostname+u.pathname)"

echo "==> Garantindo dependências Prisma Client"
if [[ ! -d node_modules/@prisma/client ]]; then
  npm ci
fi
npx prisma generate

echo "==> Executando baseline repair (resolve + deploy)"
node scripts/repair-production-baseline.mjs "$@"

echo "==> Status final migrate"
npx prisma migrate status || true

echo "==> REPAIR-PRODUCTION-DB DONE"
echo "    Se a API estava caída por colunas ausentes: pm2 já foi recarregado (se disponível)."
echo "    Valide: curl -s localhost:3000/api/health && npm run smoke:login"
