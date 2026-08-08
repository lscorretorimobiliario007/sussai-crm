#!/usr/bin/env bash
# SUSSAI CRM — production deploy entrypoint
# Usage: ./deploy.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
exec node scripts/deploy-production.mjs
