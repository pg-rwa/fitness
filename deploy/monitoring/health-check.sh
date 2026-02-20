#!/usr/bin/env bash
# ─── FitTracker Health Check ────────────────────────────────────
# Checks API health and sends alerts on failure.
# Run via cron every minute:
#   * * * * * cd /opt/fittracker && bash deploy/monitoring/health-check.sh
set -euo pipefail

DOMAIN="${DOMAIN:-localhost}"
ENDPOINT="https://${DOMAIN}/api/health"
ALERT_FILE="/tmp/fittracker_alert_sent"
MAX_FAILURES=3

# For local testing without SSL
if [ "${DOMAIN}" = "localhost" ]; then
  ENDPOINT="http://localhost:3000/api/health"
fi

check_health() {
  local response
  response=$(curl -sf -m 5 "${ENDPOINT}" 2>/dev/null) || return 1
  echo "${response}" | grep -q '"status":"ok"' || return 1
  return 0
}

send_alert() {
  local message="$1"
  echo "[$(date)] ALERT: ${message}"

  # Webhook alert (Slack, Discord, etc.)
  if [ -n "${ALERT_WEBHOOK_URL:-}" ]; then
    curl -sf -X POST "${ALERT_WEBHOOK_URL}" \
      -H "Content-Type: application/json" \
      -d "{\"text\": \"🚨 FitTracker Alert: ${message}\"}" \
      > /dev/null 2>&1 || true
  fi

  # Email alert
  if [ -n "${ALERT_EMAIL:-}" ] && command -v mail > /dev/null 2>&1; then
    echo "${message}" | mail -s "FitTracker Alert" "${ALERT_EMAIL}"
  fi
}

# Count consecutive failures
FAILURE_COUNT_FILE="/tmp/fittracker_health_failures"
FAILURES=$(cat "${FAILURE_COUNT_FILE}" 2>/dev/null || echo "0")

if check_health; then
  # Reset on success
  if [ "${FAILURES}" -ge "${MAX_FAILURES}" ]; then
    send_alert "Service recovered after ${FAILURES} failures"
    rm -f "${ALERT_FILE}"
  fi
  echo "0" > "${FAILURE_COUNT_FILE}"
else
  FAILURES=$((FAILURES + 1))
  echo "${FAILURES}" > "${FAILURE_COUNT_FILE}"

  if [ "${FAILURES}" -ge "${MAX_FAILURES}" ] && [ ! -f "${ALERT_FILE}" ]; then
    send_alert "Health check failed ${FAILURES} consecutive times at ${ENDPOINT}"
    touch "${ALERT_FILE}"
  fi
fi
