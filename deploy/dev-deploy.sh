#!/usr/bin/env bash
# ─── FitTracker Dev Deployment ─────────────────────────────────
# Deploy to a DigitalOcean droplet for dev/testing (no SSL)
#
# Quick start (run on the droplet):
#   1. git clone <repo-url> /opt/fittracker && cd /opt/fittracker
#   2. bash deploy/dev-deploy.sh
#
# Or from your local machine:
#   ssh root@YOUR_DROPLET_IP 'bash -s' < deploy/dev-deploy.sh
#
set -euo pipefail

COMPOSE_FILE="docker-compose.prod.yml"

echo "============================================"
echo "  FitTracker Dev Deployment"
echo "============================================"
echo ""

# ─── 1. Install Docker if needed ──────────────────────────────
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

# ─── 2. Generate .env if missing ──────────────────────────────
if [ ! -f .env ]; then
  JWT_SECRET=$(openssl rand -base64 48)
  cat > .env <<ENVEOF
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
HTTP_PORT=80
STORAGE_TYPE=local
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
ENVEOF
  chmod 600 .env
  echo "==> Created .env with generated JWT_SECRET"
else
  echo "==> .env exists, skipping"
fi

# ─── 3. Build images ──────────────────────────────────────────
echo "==> Building Docker images (this may take a few minutes)..."
docker compose -f "${COMPOSE_FILE}" build --parallel

# ─── 4. Start services ────────────────────────────────────────
echo "==> Starting services..."
docker compose -f "${COMPOSE_FILE}" up -d --remove-orphans

# ─── 5. Wait for healthy ──────────────────────────────────────
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
  echo "ERROR: API failed to become healthy. Logs:"
  docker compose -f "${COMPOSE_FILE}" logs api --tail 50
  exit 1
fi

# ─── 6. Cleanup ───────────────────────────────────────────────
docker image prune -f > /dev/null 2>&1

# ─── 7. Get droplet IP ────────────────────────────────────────
DROPLET_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
HTTP_PORT=$(grep HTTP_PORT .env 2>/dev/null | cut -d= -f2 || echo "80")
PORT_SUFFIX=""
if [ "${HTTP_PORT}" != "80" ]; then
  PORT_SUFFIX=":${HTTP_PORT}"
fi

echo ""
echo "============================================"
echo "  Dev Deployment Complete!"
echo "============================================"
echo ""
echo "  Frontend:  http://${DROPLET_IP}${PORT_SUFFIX}/"
echo "  API:       http://${DROPLET_IP}${PORT_SUFFIX}/api/health"
echo "  Admin:     http://${DROPLET_IP}${PORT_SUFFIX}/admin/"
echo ""
echo "  Default credentials: register a new account at"
echo "  http://${DROPLET_IP}${PORT_SUFFIX}/register"
echo ""
echo "  To create an admin user, run:"
echo "    docker compose -f ${COMPOSE_FILE} exec api node -e \\"
echo "      \"require('dotenv').config(); const {initDb,getDb}=require('./src/config/database'); initDb(); const db=getDb(); const bcrypt=require('bcryptjs'); const hash=bcrypt.hashSync('admin123',10); db.prepare('INSERT INTO users (email,password_hash,first_name,last_name,role,status) VALUES (?,?,?,?,?,?)').run('admin@fittracker.app',hash,'Admin','User','admin','active'); console.log('Admin created: admin@fittracker.app / admin123');\""
echo ""
echo "  Useful commands:"
echo "    docker compose -f ${COMPOSE_FILE} logs -f        # Stream logs"
echo "    docker compose -f ${COMPOSE_FILE} ps             # Service status"
echo "    docker compose -f ${COMPOSE_FILE} down           # Stop all"
echo "    docker compose -f ${COMPOSE_FILE} up -d --build  # Rebuild & restart"
echo ""
