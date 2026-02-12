# Deployment Guide: assets.pengaruh.my.id

Panduan lengkap untuk deploy MinIO assets ke domain `assets.pengaruh.my.id`.

## 📋 Prerequisites

1. **Domain Setup**
   - Domain `assets.pengaruh.my.id` sudah pointing ke server IP
   - DNS A record configured

2. **Server Requirements**
   - Ubuntu 20.04+ atau CentOS 8+
   - Docker & Docker Compose installed
   - Port 80, 443, 9000, 9001 terbuka
   - Minimal 2GB RAM, 20GB storage

3. **SSL Certificate**
   - Let's Encrypt (recommended)
   - Atau custom SSL certificate

## 🚀 Deployment Steps

### 1. Setup DNS

Tambahkan A record di DNS provider:

```
Type: A
Name: assets
Value: YOUR_SERVER_IP
TTL: 3600
```

Verify DNS:
```bash
nslookup assets.pengaruh.my.id
# Should return your server IP
```

### 2. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 3. Clone Repository

```bash
cd /opt
sudo git clone https://github.com/your-repo/umkm-radar-mrt.git
cd umkm-radar-mrt
```

### 4. Configure Environment

```bash
# Copy production environment template
cp backend/.env.production.example backend/.env.production

# Edit environment variables
nano backend/.env.production
```

Update these values:
```env
MINIO_ACCESS_KEY=your-secure-access-key
MINIO_SECRET_KEY=your-secure-secret-key-min-8-chars
PUBLIC_ASSET_URL=https://assets.pengaruh.my.id
```

### 5. Setup SSL Certificate (Let's Encrypt)

**Option A: Using Certbot Standalone**

```bash
# Install Certbot
sudo apt install certbot -y

# Stop any service on port 80
sudo systemctl stop nginx

# Obtain certificate
sudo certbot certonly --standalone -d assets.pengaruh.my.id

# Certificates will be at:
# /etc/letsencrypt/live/assets.pengaruh.my.id/fullchain.pem
# /etc/letsencrypt/live/assets.pengaruh.my.id/privkey.pem
```

**Option B: Using Docker Certbot (Automated)**

The `docker-compose.production.yml` already includes Certbot service for auto-renewal.

First-time certificate:
```bash
docker-compose -f docker-compose.production.yml run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  -d assets.pengaruh.my.id \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email
```

### 6. Update Nginx Configuration

Edit `nginx/assets.pengaruh.my.id.conf` if needed:

```bash
nano nginx/assets.pengaruh.my.id.conf
```

Key settings to verify:
- SSL certificate paths
- MinIO proxy_pass endpoint
- CORS headers

### 7. Start Services

```bash
# Start MinIO and Nginx
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

### 8. Initialize MinIO Bucket

```bash
# Access MinIO container
docker exec -it umkmradar_minio_prod sh

# Configure mc client
mc alias set local http://localhost:9000 umkmradar umkmradar123

# Create bucket
mc mb local/assets

# Set public policy
mc anonymous set download local/assets

# Exit container
exit
```

### 9. Test Deployment

**Test 1: Health Check**
```bash
curl https://assets.pengaruh.my.id/health
# Should return: OK
```

**Test 2: Upload Test File**
```bash
# Upload via backend API
curl -X POST https://api.pengaruh.my.id/api/assets/upload \
  -F "file=@test-image.jpg" \
  -F "category=test"

# Response will include URL like:
# https://assets.pengaruh.my.id/test/1234567890-abc123.jpg
```

**Test 3: Access Asset**
```bash
curl -I https://assets.pengaruh.my.id/test/1234567890-abc123.jpg
# Should return 200 OK with proper headers
```

**Test 4: CORS Check**
```bash
curl -I -H "Origin: https://umkmradar.pengaruh.my.id" \
  https://assets.pengaruh.my.id/test/1234567890-abc123.jpg

# Should include:
# Access-Control-Allow-Origin: *
```

## 🔒 Security Hardening

### 1. Change Default Credentials

```bash
# Update MinIO credentials in .env.production
MINIO_ACCESS_KEY=your-strong-access-key
MINIO_SECRET_KEY=your-very-strong-secret-key-minimum-8-characters
```

### 2. Restrict MinIO Console Access

Add to `docker-compose.production.yml`:
```yaml
minio:
  ports:
    - "127.0.0.1:9001:9001"  # Only accessible from localhost
```

### 3. Setup Firewall

```bash
# Allow only necessary ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

### 4. Enable HTTPS Only

Nginx config already redirects HTTP to HTTPS. Verify:
```bash
curl -I http://assets.pengaruh.my.id
# Should return 301 redirect to https://
```

## 📊 Monitoring

### Check MinIO Status

```bash
# Via Docker
docker-compose -f docker-compose.production.yml ps minio

# Via MinIO Console
# Access: https://assets.pengaruh.my.id:9001
# (Only if port 9001 is exposed)
```

### Check Nginx Logs

```bash
# Access logs
docker-compose -f docker-compose.production.yml logs nginx | grep assets

# Error logs
docker-compose -f docker-compose.production.yml logs nginx | grep error
```

### Monitor Storage Usage

```bash
# Check MinIO storage
docker exec umkmradar_minio_prod du -sh /data

# Check bucket size
docker exec umkmradar_minio_prod mc du local/assets
```

## 🔄 Maintenance

### Backup MinIO Data

```bash
# Backup to local directory
docker exec umkmradar_minio_prod mc mirror local/assets /backup/assets

# Or backup volume
docker run --rm -v umkmradar_minio_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/minio-backup-$(date +%Y%m%d).tar.gz /data
```

### Update SSL Certificate

Certbot auto-renewal is configured. Manual renewal:
```bash
docker-compose -f docker-compose.production.yml run --rm certbot renew
docker-compose -f docker-compose.production.yml restart nginx
```

### Update MinIO

```bash
# Pull latest image
docker-compose -f docker-compose.production.yml pull minio

# Restart with new image
docker-compose -f docker-compose.production.yml up -d minio
```

## 🐛 Troubleshooting

### Issue: SSL Certificate Error

**Solution:**
```bash
# Check certificate validity
sudo certbot certificates

# Renew if needed
sudo certbot renew --force-renewal
```

### Issue: 502 Bad Gateway

**Solution:**
```bash
# Check MinIO is running
docker ps | grep minio

# Check MinIO logs
docker logs umkmradar_minio_prod

# Restart MinIO
docker-compose -f docker-compose.production.yml restart minio
```

### Issue: CORS Error

**Solution:**
```bash
# Verify Nginx CORS headers
curl -I -H "Origin: https://test.com" https://assets.pengaruh.my.id/test.jpg

# Should see Access-Control-Allow-Origin header
# If not, check nginx/assets.pengaruh.my.id.conf
```

### Issue: Upload Failed

**Solution:**
```bash
# Check MinIO bucket policy
docker exec umkmradar_minio_prod mc anonymous get local/assets

# Should return: download

# If not, set it:
docker exec umkmradar_minio_prod mc anonymous set download local/assets
```

## 📈 Performance Optimization

### Enable Nginx Caching

Add to nginx config:
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=minio_cache:10m max_size=1g inactive=60m;

location / {
    proxy_cache minio_cache;
    proxy_cache_valid 200 1y;
    # ... rest of config
}
```

### Enable Gzip Compression

Add to nginx config:
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript image/svg+xml;
gzip_min_length 1000;
```

## ✅ Deployment Checklist

- [ ] DNS A record configured
- [ ] Server prepared (Docker installed)
- [ ] SSL certificate obtained
- [ ] Environment variables configured
- [ ] Nginx config updated
- [ ] Services started successfully
- [ ] MinIO bucket created
- [ ] Public policy set
- [ ] Health check passes
- [ ] Upload test successful
- [ ] Asset access works
- [ ] CORS headers present
- [ ] HTTPS redirect working
- [ ] Firewall configured
- [ ] Monitoring setup
- [ ] Backup strategy defined

## 🎯 Production URLs

After deployment:

- **Assets CDN**: https://assets.pengaruh.my.id
- **MinIO Console**: https://assets.pengaruh.my.id:9001 (if exposed)
- **Health Check**: https://assets.pengaruh.my.id/health

## 📚 Additional Resources

- [MinIO Documentation](https://min.io/docs/minio/linux/index.html)
- [Let's Encrypt Guide](https://letsencrypt.org/getting-started/)
- [Nginx Reverse Proxy](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
- [Docker Compose Production](https://docs.docker.com/compose/production/)

---

**Need help?** Contact your DevOps team or check the logs for detailed error messages.
