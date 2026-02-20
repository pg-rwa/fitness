#!/usr/bin/env bash
# ─── SSL Certificate Renewal ────────────────────────────────────
# Run via cron twice daily:
#   0 */12 * * * cd /opt/fittracker && bash deploy/ssl-renew.sh
set -euo pipefail

COMPOSE_FILE="docker-compose.prod.yml"

echo "==> Checking SSL certificate renewal at $(date)"

docker compose -f "${COMPOSE_FILE}" run --rm certbot renew --quiet

# Reload nginx to pick up any new certs
docker compose -f "${COMPOSE_FILE}" exec -T nginx nginx -s reload

echo "==> SSL renewal check complete"
