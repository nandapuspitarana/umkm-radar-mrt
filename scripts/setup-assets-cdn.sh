#!/bin/bash

# Automated Setup Script for assets.pengaruh.my.id
# This script automates the deployment of MinIO with Nginx reverse proxy

set -e  # Exit on error

echo "🚀 UMKM Radar MRT - Assets CDN Setup"
echo "===================================="
echo ""

# Configuration
DOMAIN="assets.pengaruh.my.id"
EMAIL="admin@pengaruh.my.id"  # Change this
MINIO_USER="umkmradar"
MINIO_PASS=$(openssl rand -base64 32)  # Generate random password

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    log_error "Please run as root (use sudo)"
    exit 1
fi

# Step 1: Check prerequisites
log_info "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

log_info "✓ Docker and Docker Compose are installed"

# Step 2: Check DNS
log_info "Checking DNS configuration..."
SERVER_IP=$(curl -s ifconfig.me)
DNS_IP=$(dig +short $DOMAIN | tail -n1)

if [ "$SERVER_IP" != "$DNS_IP" ]; then
    log_warn "DNS might not be configured correctly"
    log_warn "Server IP: $SERVER_IP"
    log_warn "DNS resolves to: $DNS_IP"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    log_info "✓ DNS is configured correctly"
fi

# Step 3: Setup directories
log_info "Setting up directories..."
mkdir -p /opt/umkm-radar-mrt/{nginx,data/minio,data/certbot}
cd /opt/umkm-radar-mrt

# Step 4: Create environment file
log_info "Creating environment file..."
cat > .env.production <<EOF
MINIO_ACCESS_KEY=$MINIO_USER
MINIO_SECRET_KEY=$MINIO_PASS
MINIO_BUCKET=assets
PUBLIC_ASSET_URL=https://$DOMAIN
EOF

log_info "✓ Environment file created"
log_info "MinIO Credentials:"
log_info "  Access Key: $MINIO_USER"
log_info "  Secret Key: $MINIO_PASS"
log_warn "SAVE THESE CREDENTIALS SECURELY!"

# Step 5: Obtain SSL certificate
log_info "Obtaining SSL certificate..."

if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    log_info "Requesting new certificate from Let's Encrypt..."
    
    # Stop any service on port 80
    systemctl stop nginx 2>/dev/null || true
    
    certbot certonly --standalone \
        -d $DOMAIN \
        --email $EMAIL \
        --agree-tos \
        --non-interactive \
        --preferred-challenges http
    
    if [ $? -eq 0 ]; then
        log_info "✓ SSL certificate obtained successfully"
    else
        log_error "Failed to obtain SSL certificate"
        exit 1
    fi
else
    log_info "✓ SSL certificate already exists"
fi

# Step 6: Create Nginx configuration
log_info "Creating Nginx configuration..."
cat > nginx/assets.conf <<'EOF'
server {
    listen 80;
    server_name assets.pengaruh.my.id;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name assets.pengaruh.my.id;

    ssl_certificate /etc/letsencrypt/live/assets.pengaruh.my.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/assets.pengaruh.my.id/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, HEAD, OPTIONS" always;
    add_header Access-Control-Allow-Headers "*" always;

    client_max_body_size 100M;

    location / {
        proxy_pass http://minio:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_buffering off;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /health {
        access_log off;
        return 200 "OK\n";
    }
}
EOF

log_info "✓ Nginx configuration created"

# Step 7: Create Docker Compose file
log_info "Creating Docker Compose configuration..."
cat > docker-compose.yml <<'EOF'
version: '3.8'

services:
  minio:
    image: minio/minio:latest
    container_name: umkmradar_minio
    restart: unless-stopped
    ports:
      - "9000:9000"
      - "127.0.0.1:9001:9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
      MINIO_DOMAIN: assets.pengaruh.my.id
    volumes:
      - ./data/minio:/data
    command: server /data --console-address ":9001"
    networks:
      - cdn_network

  nginx:
    image: nginx:alpine
    container_name: umkmradar_nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/assets.conf:/etc/nginx/conf.d/default.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - minio
    networks:
      - cdn_network

networks:
  cdn_network:
    driver: bridge
EOF

log_info "✓ Docker Compose configuration created"

# Step 8: Start services
log_info "Starting services..."
docker-compose --env-file .env.production up -d

# Wait for services to be ready
log_info "Waiting for services to start..."
sleep 10

# Step 9: Initialize MinIO bucket
log_info "Initializing MinIO bucket..."
docker exec umkmradar_minio sh -c "
    mc alias set local http://localhost:9000 $MINIO_USER $MINIO_PASS && \
    mc mb local/assets --ignore-existing && \
    mc anonymous set download local/assets
"

if [ $? -eq 0 ]; then
    log_info "✓ MinIO bucket initialized"
else
    log_error "Failed to initialize MinIO bucket"
    exit 1
fi

# Step 10: Setup firewall
log_info "Configuring firewall..."
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

log_info "✓ Firewall configured"

# Step 11: Setup auto-renewal for SSL
log_info "Setting up SSL auto-renewal..."
(crontab -l 2>/dev/null; echo "0 0 * * * certbot renew --quiet && docker-compose -f /opt/umkm-radar-mrt/docker-compose.yml restart nginx") | crontab -

log_info "✓ SSL auto-renewal configured"

# Step 12: Test deployment
log_info "Testing deployment..."
sleep 5

HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/health)
if [ "$HEALTH_CHECK" = "200" ]; then
    log_info "✓ Health check passed"
else
    log_warn "Health check returned: $HEALTH_CHECK"
fi

# Final summary
echo ""
echo "=========================================="
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "📊 Service Information:"
echo "  CDN URL: https://$DOMAIN"
echo "  MinIO Console: http://$SERVER_IP:9001"
echo ""
echo "🔑 MinIO Credentials:"
echo "  Access Key: $MINIO_USER"
echo "  Secret Key: $MINIO_PASS"
echo ""
echo "📝 Next Steps:"
echo "  1. Update backend .env with: PUBLIC_ASSET_URL=https://$DOMAIN"
echo "  2. Test upload: curl -X POST https://api.pengaruh.my.id/api/assets/upload -F file=@test.jpg"
echo "  3. Monitor logs: docker-compose logs -f"
echo ""
echo "🔒 Security Reminders:"
echo "  - Save MinIO credentials securely"
echo "  - Restrict MinIO console access (port 9001)"
echo "  - Setup monitoring and backups"
echo ""
echo "📚 Documentation: /opt/umkm-radar-mrt/docs/DEPLOYMENT_ASSETS.md"
echo ""
