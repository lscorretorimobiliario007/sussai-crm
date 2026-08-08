#!/usr/bin/env bash
# Wrapper na raiz do monorepo → backend/scripts/repair-production-db.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$ROOT/backend/scripts/repair-production-db.sh" "$@"
