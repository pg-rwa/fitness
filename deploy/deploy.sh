#!/usr/bin/env bash
# ─── Peqo Deployment ──────────────────────────────────────
# Zero-downtime deployment with rolling restart
# Usage: bash deploy/deploy.sh
set -euo pipefail

COMPOSE_FILE="docker-compose.prod.yml"

echo "==> Starting deployment at $(date)"

# ─── 1. Pre-flight checks ───────────────────────────────────────
if [ ! -f .env ]; then
  echo "ERROR: .env file not found. Run setup.sh first."
  exit 1
fi

source .env

if [ -z "${JWT_SECRET:-}" ]; then
  echo "ERROR: JWT_SECRET not set in .env"
  exit 1
fi

if [ -z "${DOMAIN:-}" ]; then
  echo "ERROR: DOMAIN not set in .env"
  exit 1
fi

# ─── 2. Generate nginx config from template ─────────────────────
echo "==> Generating nginx config for ${DOMAIN}..."
export DOMAIN
envsubst '${DOMAIN}' < deploy/nginx/app.conf.template > deploy/nginx/app.conf

# ─── 3. Build images ────────────────────────────────────────────
echo "==> Building Docker images..."
docker compose -f "${COMPOSE_FILE}" build --parallel

# ─── 4. Run database migrations (via a temporary container) ─────
echo "==> Running migrations..."
docker compose -f "${COMPOSE_FILE}" run --rm --no-deps api node -e "
  require('dotenv').config();
  const { initDb } = require('./src/config/database');
  initDb();
  console.log('Migrations complete');
"

# ─── 5. Rolling restart ─────────────────────────────────────────
echo "==> Starting services..."
docker compose -f "${COMPOSE_FILE}" up -d --remove-orphans

# ─── 6. Wait for healthy ────────────────────────────────────────
echo "==> Waiting for API to be healthy..."
RETRIES=30
until [ $RETRIES -le 0 ]; do
  if docker compose -f "${COMPOSE_FILE}" exec -T api wget -qO- http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "==> API is healthy!"
    break
  fi
  RETRIES=$((RETRIES - 1))
  echo "    Waiting... (${RETRIES} retries left)"
  sleep 2
done

if [ $RETRIES -le 0 ]; then
  echo "ERROR: API failed to become healthy"
  docker compose -f "${COMPOSE_FILE}" logs api --tail 50
  exit 1
fi

# ─── 7. Cleanup ─────────────────────────────────────────────────
echo "==> Cleaning up old images..."
docker image prune -f

echo ""
echo "=== Deployment Complete ==="
echo "  App:      https://${DOMAIN}/"
echo "  API:      https://${DOMAIN}/api/health"
echo "  Admin:    https://${DOMAIN}/admin/"
echo "  WS:       wss://${DOMAIN}/ws"
echo ""
