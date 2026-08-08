# Run ON THE VPS (PowerShell) inside backend folder.
# Usage: pwsh -File scripts/vps-fix-empresa.ps1
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host "== migrate status =="
npx prisma migrate status
Write-Host "== migrate deploy =="
npx prisma migrate deploy
Write-Host "== generate =="
npx prisma generate
Write-Host "== audit Empresa =="
node scripts/audit-empresa-columns.mjs
Write-Host "== seed =="
npx prisma db seed
Write-Host "== smoke login =="
node scripts/smoke-login.mjs
Write-Host "Restart API (pm2 restart / systemctl restart)."
