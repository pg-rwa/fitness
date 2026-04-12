#!/usr/bin/env bash
# ─── Peqo Quickstart (IP-only, no SSL) ────────────────────
# SSH into your fresh Ubuntu droplet and run:
#   curl -sSL <raw-url> | bash
# Or clone the repo and run:
#   bash deploy/quickstart.sh
#
# This sets up Docker, generates secrets, builds, and starts everything.
set -euo pipefail

APP_DIR="/opt/fittracker"
HTTP_PORT="${HTTP_PORT:-8080}"

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║      Peqo - Quickstart Deploy      ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""

# ─── 1. Install Docker if missing ───────────────────────────────
if ! command -v docker &> /dev/null; then
  echo "==> Installing Docker..."
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl gnupg

  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg

  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list

  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
  echo "==> Docker installed"
else
  echo "==> Docker already installed"
fi

# ─── 2. Install git if missing ──────────────────────────────────
if ! command -v git &> /dev/null; then
  echo "==> Installing git..."
  apt-get install -y -qq git
fi

# ─── 3. Firewall ────────────────────────────────────────────────
if command -v ufw &> /dev/null; then
  echo "==> Configuring firewall..."
  ufw allow 22/tcp          > /dev/null 2>&1
  ufw allow ${HTTP_PORT}/tcp > /dev/null 2>&1
  ufw --force enable        > /dev/null 2>&1
  echo "==> Firewall: SSH (22) and HTTP (${HTTP_PORT}) open"
fi

# ─── 4. Clone or update repo ────────────────────────────────────
if [ -d "${APP_DIR}/.git" ]; then
  echo "==> Updating existing repo..."
  cd "${APP_DIR}"
  git pull
else
  echo ""
  echo "==> The app directory ${APP_DIR} doesn't have a git repo."
  echo "    You need to clone your repository there first."
  echo ""
  echo "    Option 1 - Clone via SSH:"
  echo "      git clone git@github.com:YOUR_USER/fitness.git ${APP_DIR}"
  echo ""
  echo "    Option 2 - Copy files via scp from your local machine:"
  echo "      scp -r ./fitness root@YOUR_DROPLET_IP:${APP_DIR}"
  echo ""
  echo "    Then re-run this script."
  echo ""

  if [ ! -d "${APP_DIR}" ]; then
    exit 1
  fi
fi

cd "${APP_DIR}"

# ─── 5. Generate .env if missing ────────────────────────────────
DROPLET_IP=$(curl -sf http://169.254.169.254/metadata/v1/interfaces/public/0/ipv4/address 2>/dev/null || hostname -I | awk '{print $1}')

if [ ! -f .env ]; then
  echo "==> Generating .env with random JWT secret..."
  JWT_SECRET=$(openssl rand -base64 48)

  cat > .env <<EOF
# ─── Peqo Production Config ────────────────
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=15m

# Port (default 8080 to avoid conflicts with other apps)
HTTP_PORT=${HTTP_PORT}

# Set this to your droplet's public IP
PUBLIC_API_URL=http://${DROPLET_IP}:${HTTP_PORT}/api

# Storage (local filesystem by default)
STORAGE_TYPE=local

# Optional: Email (leave blank to disable)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@fittracker.app

# Optional: AI Insights
ANTHROPIC_API_KEY=

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
EOF
  chmod 600 .env
  echo "==> .env created (JWT_SECRET auto-generated)"
  echo "    PUBLIC_API_URL=http://${DROPLET_IP}:${HTTP_PORT}/api"
else
  echo "==> .env already exists, keeping it"
fi

# ─── 6. Set nginx config (no-SSL mode) ──────────────────────────
echo "==> Configuring nginx (HTTP-only mode)..."
cp deploy/nginx/app-nossl.conf deploy/nginx/active.conf

# ─── 7. Build and start ─────────────────────────────────────────
echo "==> Building Docker images (this may take a few minutes)..."
docker compose -f docker-compose.prod.yml build --parallel

echo "==> Starting services..."
docker compose -f docker-compose.prod.yml up -d --remove-orphans

# ─── 8. Wait for healthy ────────────────────────────────────────
echo "==> Waiting for API to be healthy..."
RETRIES=30
until [ $RETRIES -le 0 ]; do
  if docker compose -f docker-compose.prod.yml exec -T api wget -qO- http://localhost:3000/api/health > /dev/null 2>&1; then
    break
  fi
  RETRIES=$((RETRIES - 1))
  echo "    Waiting... (${RETRIES} retries left)"
  sleep 2
done

if [ $RETRIES -le 0 ]; then
  echo ""
  echo "ERROR: API failed to become healthy. Check logs:"
  echo "  docker compose -f docker-compose.prod.yml logs api"
  exit 1
fi

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║         Deploy Complete!                 ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""
echo "  API Health:  http://${DROPLET_IP}:${HTTP_PORT}/api/health"
echo "  Admin Panel: http://${DROPLET_IP}:${HTTP_PORT}/admin/"
echo "  WebSocket:   ws://${DROPLET_IP}:${HTTP_PORT}/ws"
echo ""
echo "  Useful commands:"
echo "    docker compose -f docker-compose.prod.yml logs -f       # View logs"
echo "    docker compose -f docker-compose.prod.yml ps            # Service status"
echo "    docker compose -f docker-compose.prod.yml restart api   # Restart API"
echo "    bash deploy/backup.sh                                   # Backup DB"
echo ""
echo "  To add SSL later with a domain:"
echo "    bash deploy/setup.sh yourdomain.com you@email.com"
echo ""
