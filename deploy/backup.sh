#!/usr/bin/env bash
# ─── Peqo Database Backup ─────────────────────────────────
# Creates a timestamped backup of the SQLite database
# Usage: bash deploy/backup.sh [backup-dir]
#   Recommended: run via cron daily
#   0 3 * * * cd /opt/fittracker && bash deploy/backup.sh
set -euo pipefail

BACKUP_DIR="${1:-./backups}"
COMPOSE_FILE="docker-compose.prod.yml"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/fitness_${TIMESTAMP}.db"
KEEP_DAYS=30

mkdir -p "${BACKUP_DIR}"

echo "==> Backing up database at $(date)"

# Use SQLite's .backup command for a consistent snapshot
docker compose -f "${COMPOSE_FILE}" exec -T api sh -c \
  "sqlite3 /app/data/fitness.db '.backup /tmp/backup.db'" 2>/dev/null || \
  echo "Warning: sqlite3 not available, using file copy"

# Copy the backup out of the container
docker compose -f "${COMPOSE_FILE}" cp api:/tmp/backup.db "${BACKUP_FILE}" 2>/dev/null || \
  docker compose -f "${COMPOSE_FILE}" cp api:/app/data/fitness.db "${BACKUP_FILE}"

# Compress
gzip "${BACKUP_FILE}"
FINAL="${BACKUP_FILE}.gz"

SIZE=$(du -sh "${FINAL}" | cut -f1)
echo "==> Backup saved: ${FINAL} (${SIZE})"

# Prune old backups
echo "==> Pruning backups older than ${KEEP_DAYS} days..."
find "${BACKUP_DIR}" -name "fitness_*.db.gz" -mtime +${KEEP_DAYS} -delete

TOTAL=$(ls -1 "${BACKUP_DIR}"/fitness_*.db.gz 2>/dev/null | wc -l)
echo "==> ${TOTAL} backup(s) retained"
echo "==> Backup complete"
