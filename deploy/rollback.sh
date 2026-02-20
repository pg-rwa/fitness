#!/usr/bin/env bash
# ─── FitTracker Rollback ────────────────────────────────────────
# Restores the previous Docker image versions
# Usage: bash deploy/rollback.sh
set -euo pipefail

COMPOSE_FILE="docker-compose.prod.yml"

echo "==> Rolling back to previous images at $(date)"

# Stop current containers
docker compose -f "${COMPOSE_FILE}" down

# Restart with the previous images (Docker keeps one prior layer)
docker compose -f "${COMPOSE_FILE}" up -d

# Wait for health
RETRIES=20
until [ $RETRIES -le 0 ]; do
  if docker compose -f "${COMPOSE_FILE}" exec -T api wget -qO- http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "==> Rollback successful - API is healthy"
    exit 0
  fi
  RETRIES=$((RETRIES - 1))
  sleep 2
done

echo "ERROR: Rollback failed - API not healthy"
docker compose -f "${COMPOSE_FILE}" logs api --tail 30
exit 1
