#!/usr/bin/env bash
# ─── FitTracker Log Viewer ──────────────────────────────────────
# Usage: bash deploy/logs.sh [service] [lines]
#   bash deploy/logs.sh          # all services, last 100 lines
#   bash deploy/logs.sh api      # API logs
#   bash deploy/logs.sh nginx    # nginx logs
#   bash deploy/logs.sh api 500  # last 500 lines
set -euo pipefail

COMPOSE_FILE="docker-compose.prod.yml"
SERVICE="${1:-}"
LINES="${2:-100}"

if [ -n "${SERVICE}" ]; then
  docker compose -f "${COMPOSE_FILE}" logs "${SERVICE}" --tail "${LINES}" -f
else
  docker compose -f "${COMPOSE_FILE}" logs --tail "${LINES}" -f
fi
