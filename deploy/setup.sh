#!/usr/bin/env bash
# ─── Peqo Server Setup ────────────────────────────────────
# Run this once on a fresh Ubuntu/Debian server (e.g. DigitalOcean Droplet)
# Usage: bash deploy/setup.sh yourdomain.com your@email.com
set -euo pipefail

DOMAIN="${1:?Usage: setup.sh <domain> <email>}"
EMAIL="${2:?Usage: setup.sh <domain> <email>}"
APP_DIR="/opt/fittracker"

echo "==> Setting up Peqo on ${DOMAIN}"

# ─── 1. System packages ─────────────────────────────────────────
echo "==> Installing Docker..."
apt-get update -qq
apt-get install -y -qq ca-certificates curl gnupg

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list

apt-get update -qq
apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin

# ─── 2. Firewall ────────────────────────────────────────────────
echo "==> Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ─── 3. App directory ───────────────────────────────────────────
echo "==> Creating app directory..."
mkdir -p "${APP_DIR}"
cd "${APP_DIR}"

# ─── 4. Environment file ────────────────────────────────────────
if [ ! -f .env ]; then
  JWT_SECRET=$(openssl rand -base64 48)
  cat > .env <<ENVEOF
# Auto-generated - edit as needed
DOMAIN=${DOMAIN}
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=15m
STORAGE_TYPE=local
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=Peqo <noreply@${DOMAIN}>
ANTHROPIC_API_KEY=
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
PUBLIC_API_URL=https://${DOMAIN}/api
ENVEOF
  chmod 600 .env
  echo "==> Created .env with generated JWT_SECRET"
else
  echo "==> .env already exists, skipping"
fi

# ─── 5. SSL certificate (initial) ──────────────────────────────
echo "==> Obtaining SSL certificate..."
mkdir -p certbot-webroot

# Start a temporary nginx for the ACME challenge
docker run -d --name certbot-init \
  -p 80:80 \
  -v "$(pwd)/certbot-webroot:/var/www/certbot" \
  nginx:1.27-alpine \
  sh -c "echo 'server { listen 80; location /.well-known/acme-challenge/ { root /var/www/certbot; } }' > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"

sleep 2

docker run --rm \
  -v "$(pwd)/certbot-certs:/etc/letsencrypt" \
  -v "$(pwd)/certbot-webroot:/var/www/certbot" \
  certbot/certbot certonly \
  --webroot -w /var/www/certbot \
  -d "${DOMAIN}" \
  --email "${EMAIL}" \
  --agree-tos --non-interactive

docker stop certbot-init && docker rm certbot-init

# ─── 6. Generate nginx config from template ─────────────────────
echo "==> Generating nginx config..."
export DOMAIN
envsubst '${DOMAIN}' < deploy/nginx/app.conf.template > deploy/nginx/app.conf

echo ""
echo "=== Setup Complete ==="
echo "Next steps:"
echo "  1. Copy your code to ${APP_DIR}"
echo "  2. Edit .env with your secrets"
echo "  3. Run: bash deploy/deploy.sh"
echo ""
