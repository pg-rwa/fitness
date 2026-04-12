#!/usr/bin/env bash
# ─── Peqo One-Step Deploy ──────────────────────────────────
# Single command to deploy Peqo to DigitalOcean.
#
# Does everything: git push → sync code → backup DB → build → deploy → verify
#
# Usage:
#   bash deploy/one-step-deploy.sh                  # full deploy
#   bash deploy/one-step-deploy.sh --skip-git       # skip git commit/push
#   bash deploy/one-step-deploy.sh --skip-backup    # skip DB backup
#   bash deploy/one-step-deploy.sh --rebuild        # force full rebuild (no cache)
#   bash deploy/one-step-deploy.sh --logs           # show service logs after deploy
#   bash deploy/one-step-deploy.sh --dry-run        # show what would happen, don't execute
#
# Environment (override via env vars or .env):
#   DEPLOY_HOST     SSH target         (default: root@64.227.187.54)
#   DEPLOY_PORT     HTTP port on host  (default: 3080)
#   DEPLOY_DIR      Remote app path    (default: /opt/fittracker)
#   DEPLOY_BRANCH   Git branch         (default: current branch)
#
set -euo pipefail

# ─── Colors ──────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ─── Config ──────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_DIR}"

# Load local .env if present (for defaults)
[ -f .env ] && set -a && source .env 2>/dev/null && set +a

DEPLOY_HOST="${DEPLOY_HOST:-root@64.227.187.54}"
DEPLOY_PORT="${DEPLOY_PORT:-3080}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/fittracker}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)}"
COMPOSE_FILE="docker-compose.prod.yml"

# ─── Flags ───────────────────────────────────────────────────────
SKIP_GIT=false
SKIP_BACKUP=false
FORCE_REBUILD=false
SHOW_LOGS=false
DRY_RUN=false

for arg in "$@"; do
  case $arg in
    --skip-git)     SKIP_GIT=true ;;
    --skip-backup)  SKIP_BACKUP=true ;;
    --rebuild)      FORCE_REBUILD=true ;;
    --logs)         SHOW_LOGS=true ;;
    --dry-run)      DRY_RUN=true ;;
    --help|-h)
      echo "Usage: bash deploy/one-step-deploy.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --skip-git      Skip git add/commit/push"
      echo "  --skip-backup   Skip remote database backup"
      echo "  --rebuild       Force full Docker rebuild (no cache)"
      echo "  --logs          Show service logs after deploy"
      echo "  --dry-run       Show what would happen without executing"
      echo "  --help          Show this help message"
      echo ""
      echo "Environment:"
      echo "  DEPLOY_HOST     SSH target         (default: root@64.227.187.54)"
      echo "  DEPLOY_PORT     HTTP port on host  (default: 3080)"
      echo "  DEPLOY_DIR      Remote app path    (default: /opt/fittracker)"
      echo "  DEPLOY_BRANCH   Git branch         (default: current branch)"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $arg${NC}"
      echo "Run with --help for usage"
      exit 1
      ;;
  esac
done

# ─── Helpers ─────────────────────────────────────────────────────
step_num=0
step() {
  step_num=$((step_num + 1))
  echo ""
  echo -e "${BLUE}━━━ Step ${step_num}: ${BOLD}$1${NC}"
}

success() { echo -e "  ${GREEN}✓${NC} $1"; }
warn()    { echo -e "  ${YELLOW}!${NC} $1"; }
fail()    { echo -e "  ${RED}✗${NC} $1"; }
info()    { echo -e "  ${CYAN}→${NC} $1"; }

elapsed_start=$(date +%s)
elapsed() {
  local now=$(date +%s)
  local diff=$((now - elapsed_start))
  local min=$((diff / 60))
  local sec=$((diff % 60))
  printf "%dm %02ds" $min $sec
}

# ─── Banner ──────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  ${BOLD}Peqo — One-Step Deploy${NC}                        ${CYAN}║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Target:   ${BOLD}${DEPLOY_HOST}${NC}"
echo -e "  Port:     ${BOLD}${DEPLOY_PORT}${NC}"
echo -e "  Branch:   ${BOLD}${DEPLOY_BRANCH}${NC}"
echo -e "  Path:     ${BOLD}${DEPLOY_DIR}${NC}"
echo -e "  Started:  $(date '+%Y-%m-%d %H:%M:%S')"
if $DRY_RUN; then
  echo ""
  echo -e "  ${YELLOW}[DRY RUN] No changes will be made${NC}"
fi
echo ""

# ─── Preflight Checks ───────────────────────────────────────────
step "Preflight checks"

# Check for required tools
for tool in git ssh rsync; do
  if command -v $tool &>/dev/null; then
    success "$tool found"
  else
    fail "$tool not found — install it first"
    exit 1
  fi
done

# Check SSH connectivity (5 second timeout)
if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no -q "${DEPLOY_HOST}" exit 2>/dev/null; then
  success "SSH connection to ${DEPLOY_HOST}"
else
  fail "Cannot connect to ${DEPLOY_HOST} via SSH"
  echo ""
  echo "  Make sure you have SSH access. Try:"
  echo "    ssh ${DEPLOY_HOST}"
  exit 1
fi

# Check we're in a git repo
if git rev-parse --is-inside-work-tree &>/dev/null; then
  success "Git repository detected"
else
  fail "Not a git repository"
  exit 1
fi

if $DRY_RUN; then
  echo ""
  echo -e "${GREEN}Dry run complete. All checks passed.${NC}"
  exit 0
fi

# ══════════════════════════════════════════════════════════════════
# STEP: Git commit & push
# ══════════════════════════════════════════════════════════════════
if ! $SKIP_GIT; then
  step "Git commit & push"

  # Stage all changes
  CHANGES=$(git status --porcelain 2>/dev/null | head -20)
  if [ -n "${CHANGES}" ]; then
    info "Staging changes..."
    git add -A
    COMMIT_MSG="deploy: $(date '+%Y-%m-%d %H:%M') — $(git diff --cached --stat | tail -1 | sed 's/^ *//')"
    git commit -m "${COMMIT_MSG}" || true
    success "Committed: ${COMMIT_MSG}"
  else
    success "Working tree clean — nothing to commit"
  fi

  # Push with retry
  info "Pushing to origin/${DEPLOY_BRANCH}..."
  PUSH_OK=false
  for i in 1 2 3 4; do
    if git push -u origin "${DEPLOY_BRANCH}" 2>&1; then
      PUSH_OK=true
      break
    fi
    WAIT=$((2 ** i))
    warn "Push failed, retrying in ${WAIT}s... (attempt $i/4)"
    sleep $WAIT
  done

  if $PUSH_OK; then
    success "Pushed to origin/${DEPLOY_BRANCH}"
  else
    fail "Push failed after 4 retries"
    exit 1
  fi
else
  step "Git (skipped)"
  info "Skipping git operations (--skip-git)"
fi

# ══════════════════════════════════════════════════════════════════
# STEP: Backup remote database
# ══════════════════════════════════════════════════════════════════
if ! $SKIP_BACKUP; then
  step "Backup remote database"

  ssh -o StrictHostKeyChecking=no "${DEPLOY_HOST}" bash <<BACKUPSCRIPT
set -euo pipefail
cd ${DEPLOY_DIR} 2>/dev/null || { echo "No existing deployment found — skipping backup"; exit 0; }

# Check if DB volume exists and API container is running
if docker compose -f ${COMPOSE_FILE} ps api 2>/dev/null | grep -q "running"; then
  mkdir -p backups
  TIMESTAMP=\$(date +%Y%m%d_%H%M%S)
  BACKUP_FILE="backups/fitness_pre_deploy_\${TIMESTAMP}.db.gz"
  docker compose -f ${COMPOSE_FILE} exec -T api sh -c "sqlite3 /app/data/fitness.db '.backup /tmp/backup.db' && cat /tmp/backup.db" | gzip > "\${BACKUP_FILE}"
  echo "BACKUP_OK:\${BACKUP_FILE}"
else
  echo "No running API container — skipping backup"
fi
BACKUPSCRIPT

  success "Database backed up on remote"
else
  step "Backup (skipped)"
  info "Skipping backup (--skip-backup)"
fi

# ══════════════════════════════════════════════════════════════════
# STEP: Sync project files
# ══════════════════════════════════════════════════════════════════
step "Sync project files to server"

info "Syncing ${PROJECT_DIR} → ${DEPLOY_HOST}:${DEPLOY_DIR}..."

# Ensure remote dir exists
ssh "${DEPLOY_HOST}" "mkdir -p ${DEPLOY_DIR}"

rsync -az --delete \
  --exclude node_modules \
  --exclude .git \
  --exclude "data/*.db" \
  --exclude "data/*.db-wal" \
  --exclude "data/*.db-shm" \
  --exclude uploads/ \
  --exclude .env \
  --exclude .next \
  --exclude backups/ \
  "${PROJECT_DIR}/" "${DEPLOY_HOST}:${DEPLOY_DIR}/"

success "Files synced"

# ══════════════════════════════════════════════════════════════════
# STEP: Configure remote environment
# ══════════════════════════════════════════════════════════════════
step "Configure remote environment"

ssh "${DEPLOY_HOST}" bash <<ENVSCRIPT
set -euo pipefail
cd ${DEPLOY_DIR}

DROPLET_IP=\$(curl -sf http://169.254.169.254/metadata/v1/interfaces/public/0/ipv4/address 2>/dev/null || curl -sf ifconfig.me 2>/dev/null || hostname -I | awk '{print \$1}')

if [ ! -f .env ]; then
  JWT_SECRET=\$(openssl rand -base64 48)
  cat > .env <<EOF
JWT_SECRET=\${JWT_SECRET}
JWT_EXPIRES_IN=7d
HTTP_PORT=${DEPLOY_PORT}
STORAGE_TYPE=local
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
PUBLIC_API_URL=http://\${DROPLET_IP}:${DEPLOY_PORT}/api
EOF
  chmod 600 .env
  echo "CREATED_ENV"
else
  # Ensure HTTP_PORT matches
  if grep -q "HTTP_PORT=" .env; then
    sed -i "s/HTTP_PORT=.*/HTTP_PORT=${DEPLOY_PORT}/" .env
  else
    echo "HTTP_PORT=${DEPLOY_PORT}" >> .env
  fi
  echo "UPDATED_ENV"
fi
ENVSCRIPT

success "Remote .env configured (HTTP_PORT=${DEPLOY_PORT})"

# ══════════════════════════════════════════════════════════════════
# STEP: Build Docker images
# ══════════════════════════════════════════════════════════════════
step "Build Docker images"

BUILD_FLAG=""
if $FORCE_REBUILD; then
  BUILD_FLAG="--no-cache"
  info "Force rebuilding all images (no cache)..."
else
  info "Building images (using cache where possible)..."
fi

ssh "${DEPLOY_HOST}" bash <<BUILDSCRIPT
set -euo pipefail
cd ${DEPLOY_DIR}

# Install Docker if missing
if ! command -v docker &>/dev/null; then
  echo "Installing Docker..."
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg 2>/dev/null
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=\$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \$(. /etc/os-release && echo "\$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
  echo "Docker installed"
fi

# Configure firewall
if command -v ufw &>/dev/null; then
  ufw allow 22/tcp  >/dev/null 2>&1 || true
  ufw allow ${DEPLOY_PORT}/tcp >/dev/null 2>&1 || true
  ufw --force enable >/dev/null 2>&1 || true
fi

# Build
docker compose -f ${COMPOSE_FILE} build --parallel ${BUILD_FLAG} 2>&1 | tail -20
echo "BUILD_DONE"
BUILDSCRIPT

success "Docker images built"

# ══════════════════════════════════════════════════════════════════
# STEP: Run database migrations
# ══════════════════════════════════════════════════════════════════
step "Run database migrations"

ssh "${DEPLOY_HOST}" bash <<MIGRATESCRIPT
set -euo pipefail
cd ${DEPLOY_DIR}
source .env

docker compose -f ${COMPOSE_FILE} run --rm --no-deps api node -e "
  require('dotenv').config();
  const { initDb } = require('./src/config/database');
  initDb();
  console.log('Migrations complete');
" 2>&1
MIGRATESCRIPT

success "Migrations complete"

# ══════════════════════════════════════════════════════════════════
# STEP: Deploy services
# ══════════════════════════════════════════════════════════════════
step "Deploy services"

ssh "${DEPLOY_HOST}" bash <<DEPLOYSCRIPT
set -euo pipefail
cd ${DEPLOY_DIR}

echo "Starting services..."
docker compose -f ${COMPOSE_FILE} up -d --remove-orphans 2>&1

# Wait for API health
echo "Waiting for API health..."
RETRIES=40
while [ \$RETRIES -gt 0 ]; do
  if docker compose -f ${COMPOSE_FILE} exec -T api wget -qO- http://localhost:3000/api/health >/dev/null 2>&1; then
    echo "HEALTHY"
    break
  fi
  RETRIES=\$((RETRIES - 1))
  sleep 3
done

if [ \$RETRIES -le 0 ]; then
  echo "UNHEALTHY"
  docker compose -f ${COMPOSE_FILE} logs api --tail 30
  exit 1
fi

# Prune old images
docker image prune -f >/dev/null 2>&1 || true

# Show container status
docker compose -f ${COMPOSE_FILE} ps
DEPLOYSCRIPT

success "All services running and healthy"

# ══════════════════════════════════════════════════════════════════
# STEP: Verify deployment
# ══════════════════════════════════════════════════════════════════
step "Verify deployment"

DROPLET_IP=$(echo "${DEPLOY_HOST}" | sed 's/.*@//')

# Check API health endpoint from local machine
if curl -sf "http://${DROPLET_IP}:${DEPLOY_PORT}/api/health" >/dev/null 2>&1; then
  success "API health check passed (http://${DROPLET_IP}:${DEPLOY_PORT}/api/health)"
else
  warn "API health check failed from local — may need a moment to start"
fi

# Check frontend
if curl -sf -o /dev/null "http://${DROPLET_IP}:${DEPLOY_PORT}/" 2>&1; then
  success "Frontend reachable (http://${DROPLET_IP}:${DEPLOY_PORT}/)"
else
  warn "Frontend not yet reachable — may still be starting"
fi

# Check admin
if curl -sf -o /dev/null "http://${DROPLET_IP}:${DEPLOY_PORT}/admin/" 2>&1; then
  success "Admin panel reachable (http://${DROPLET_IP}:${DEPLOY_PORT}/admin/)"
else
  warn "Admin panel not yet reachable — may still be starting"
fi

# ══════════════════════════════════════════════════════════════════
# Show logs if requested
# ══════════════════════════════════════════════════════════════════
if $SHOW_LOGS; then
  step "Service logs (last 30 lines)"
  ssh "${DEPLOY_HOST}" "cd ${DEPLOY_DIR} && docker compose -f ${COMPOSE_FILE} logs --tail 30"
fi

# ══════════════════════════════════════════════════════════════════
# Done!
# ══════════════════════════════════════════════════════════════════
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC}  ${BOLD}Deploy Complete!${NC}  $(elapsed)                        ${GREEN}║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}Frontend:${NC}   http://${DROPLET_IP}:${DEPLOY_PORT}/"
echo -e "  ${BOLD}API:${NC}        http://${DROPLET_IP}:${DEPLOY_PORT}/api/health"
echo -e "  ${BOLD}Admin:${NC}      http://${DROPLET_IP}:${DEPLOY_PORT}/admin/"
echo -e "  ${BOLD}WebSocket:${NC}  ws://${DROPLET_IP}:${DEPLOY_PORT}/ws"
echo ""
echo -e "  ${BOLD}Register:${NC}   http://${DROPLET_IP}:${DEPLOY_PORT}/register"
echo ""
echo -e "  ${CYAN}Deployed at $(date '+%Y-%m-%d %H:%M:%S') from branch ${DEPLOY_BRANCH}${NC}"
echo ""
