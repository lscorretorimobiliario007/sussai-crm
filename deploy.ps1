# SUSSAI CRM — production deploy entrypoint (Windows)
# Usage: pwsh -File .\deploy.ps1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
node scripts/deploy-production.mjs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
