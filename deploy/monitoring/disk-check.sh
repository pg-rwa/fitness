#!/usr/bin/env bash
# ─── Disk Space Check ───────────────────────────────────────────
# Alerts when disk usage exceeds threshold.
# Run via cron hourly:
#   0 * * * * bash /opt/fittracker/deploy/monitoring/disk-check.sh
set -euo pipefail

THRESHOLD="${DISK_THRESHOLD:-85}"

USAGE=$(df / | tail -1 | awk '{print $5}' | tr -d '%')

if [ "${USAGE}" -ge "${THRESHOLD}" ]; then
  MESSAGE="Disk usage at ${USAGE}% (threshold: ${THRESHOLD}%)"
  echo "[$(date)] WARNING: ${MESSAGE}"

  if [ -n "${ALERT_WEBHOOK_URL:-}" ]; then
    curl -sf -X POST "${ALERT_WEBHOOK_URL}" \
      -H "Content-Type: application/json" \
      -d "{\"text\": \"⚠️ Peqo: ${MESSAGE}\"}" \
      > /dev/null 2>&1 || true
  fi
fi
