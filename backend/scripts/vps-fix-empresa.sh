#!/usr/bin/env bash
# Run ON THE VPS inside the backend deploy directory.
# Usage: bash scripts/vps-fix-empresa.sh
set -euo pipefail

cd "$(dirname "$0")/.."

echo "== DATABASE_URL host =="
node -e "const u=new URL(process.env.DATABASE_URL||require('fs').readFileSync('.env','utf8').match(/DATABASE_URL=(.*)/)?.[1]?.replace(/^\"|\"$/g,'')||''); console.log(u.hostname, u.pathname)"

echo "== migrate status =="
npx prisma migrate status

echo "== migrate deploy (NO db push) =="
npx prisma migrate deploy

echo "== generate =="
npx prisma generate

echo "== audit Empresa columns =="
node scripts/audit-empresa-columns.mjs

echo "== seed admin (safe upsert) =="
npx prisma db seed || true

echo "== smoke login =="
node scripts/smoke-login.mjs

echo "VPS Empresa fix complete. Restart the API process (pm2/systemd)."
