#!/usr/bin/env bash
# ─── FitTracker Remote Deploy ─────────────────────────────────
# Deploy FitTracker to a DigitalOcean droplet via SSH.
#
# Usage (from your local machine):
#   bash deploy/remote-deploy.sh root@64.227.187.54
#
# What this does:
#   1. Stops ALL running Docker containers on the droplet
#   2. Kills anything on port 3000/80 (old apps)
#   3. Copies this repo to /opt/fittracker
#   4. Builds and starts FitTracker on port 80
#
set -euo pipefail

REMOTE="${1:?Usage: bash deploy/remote-deploy.sh user@host}"
APP_DIR="/opt/fittracker"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║    FitTracker → Remote Deploy            ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""
echo "  Target:  ${REMOTE}"
echo "  Source:   ${PROJECT_DIR}"
echo ""

# ─── 1. Install Docker & stop old services ────────────────────
echo "==> Preparing remote server..."
ssh -o StrictHostKeyChecking=no "${REMOTE}" bash <<'REMOTESCRIPT'
set -euo pipefail

# Install Docker if missing
if ! command -v docker &> /dev/null; then
  echo "==> Installing Docker..."
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg 2>/dev/null
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
  echo "==> Docker installed"
else
  echo "==> Docker already installed"
fi

# Stop ALL running Docker containers
echo "==> Stopping all running Docker containers..."
RUNNING=$(docker ps -q 2>/dev/null || true)
if [ -n "${RUNNING}" ]; then
  docker stop ${RUNNING} 2>/dev/null || true
  echo "==> Stopped running containers"
fi

# Remove old compose projects
for DIR in /opt/fittracker /opt/fitness /root/fitness /root/fittracker; do
  if [ -f "${DIR}/docker-compose.yml" ] || [ -f "${DIR}/docker-compose.prod.yml" ]; then
    echo "==> Cleaning up old project in ${DIR}..."
    cd "${DIR}"
    docker compose down --remove-orphans 2>/dev/null || true
    docker compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true
  fi
done

# Kill anything on port 3000, 80, 8080
for PORT in 3000 80 8080; do
  PID=$(lsof -ti:${PORT} 2>/dev/null || true)
  if [ -n "${PID}" ]; then
    echo "==> Killing process on port ${PORT} (PID: ${PID})"
    kill -9 ${PID} 2>/dev/null || true
  fi
done

# Stop any pm2/node processes
pkill -f "node.*server" 2>/dev/null || true
pkill -f "npm.*start" 2>/dev/null || true

# Prune old Docker resources
docker system prune -f 2>/dev/null || true

echo "==> Server cleaned up"

# Firewall
if command -v ufw &> /dev/null; then
  ufw allow 22/tcp  > /dev/null 2>&1 || true
  ufw allow 80/tcp  > /dev/null 2>&1 || true
  ufw --force enable > /dev/null 2>&1 || true
  echo "==> Firewall: SSH (22) and HTTP (80) open"
fi

mkdir -p /opt/fittracker
REMOTESCRIPT

# ─── 2. Sync project files ────────────────────────────────────
echo "==> Syncing project files to ${REMOTE}:${APP_DIR}..."
rsync -az --delete \
  --exclude node_modules \
  --exclude .git \
  --exclude "data/*.db" \
  --exclude "data/*.db-wal" \
  --exclude "data/*.db-shm" \
  --exclude uploads/ \
  --exclude .env \
  --exclude .next \
  "${PROJECT_DIR}/" "${REMOTE}:${APP_DIR}/"

echo "==> Files synced"

# ─── 3. Build and start on the remote ─────────────────────────
echo "==> Building and starting FitTracker..."
ssh "${REMOTE}" bash <<'STARTSCRIPT'
set -euo pipefail
cd /opt/fittracker

# Generate .env if missing
DROPLET_IP=$(curl -sf http://169.254.169.254/metadata/v1/interfaces/public/0/ipv4/address 2>/dev/null || curl -sf ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

if [ ! -f .env ]; then
  JWT_SECRET=$(openssl rand -base64 48)
  cat > .env <<EOF
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
HTTP_PORT=80
STORAGE_TYPE=local
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
PUBLIC_API_URL=http://${DROPLET_IP}/api
EOF
  chmod 600 .env
  echo "==> Created .env (JWT_SECRET auto-generated)"
else
  # Ensure HTTP_PORT=80
  if grep -q "HTTP_PORT=" .env; then
    sed -i 's/HTTP_PORT=.*/HTTP_PORT=80/' .env
  else
    echo "HTTP_PORT=80" >> .env
  fi
  echo "==> Using existing .env (ensured HTTP_PORT=80)"
fi

# Use the full active.conf with frontend
cp deploy/nginx/active.conf deploy/nginx/active.conf.bak 2>/dev/null || true

# Build and start
echo "==> Building Docker images (this takes a few minutes)..."
docker compose -f docker-compose.prod.yml build --parallel 2>&1 | tail -5

echo "==> Starting services..."
docker compose -f docker-compose.prod.yml up -d --remove-orphans

# Wait for healthy
echo "==> Waiting for API to be healthy..."
RETRIES=40
until [ $RETRIES -le 0 ]; do
  if docker compose -f docker-compose.prod.yml exec -T api wget -qO- http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "==> API is healthy!"
    break
  fi
  RETRIES=$((RETRIES - 1))
  sleep 3
done

if [ $RETRIES -le 0 ]; then
  echo ""
  echo "WARNING: API health check timed out. Checking logs..."
  docker compose -f docker-compose.prod.yml logs api --tail 20
  echo ""
fi

# Show status
docker compose -f docker-compose.prod.yml ps

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║         FitTracker is LIVE!              ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""
echo "  Frontend:  http://${DROPLET_IP}/"
echo "  API:       http://${DROPLET_IP}/api/health"
echo "  Admin:     http://${DROPLET_IP}/admin/"
echo "  WebSocket: ws://${DROPLET_IP}/ws"
echo ""
echo "  Register:  http://${DROPLET_IP}/register"
echo ""
echo "  To create an admin user:"
echo "    docker compose -f docker-compose.prod.yml exec api node -e \\"
echo "      \"require('dotenv').config(); const {initDb,getDb}=require('./src/config/database'); initDb(); const db=getDb(); const bcrypt=require('bcryptjs'); const hash=bcrypt.hashSync('admin123',10); db.prepare('INSERT INTO users (email,password_hash,first_name,last_name,role,status) VALUES (?,?,?,?,?,?)').run('admin@fittracker.app',hash,'Admin','User','admin','active'); console.log('Done');\""
echo ""
STARTSCRIPT

echo ""
echo "==> Deploy complete!"
echo ""
