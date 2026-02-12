# Assets CDN - Production Setup

## 🌐 Domain: assets.pengaruh.my.id

MinIO object storage untuk UMKM Radar MRT, di-serve melalui Nginx reverse proxy dengan HTTPS.

## 📋 Quick Start

### Development (Localhost)

```bash
# Start MinIO
docker-compose up -d minio

# Backend akan menggunakan proxy endpoint
PUBLIC_ASSET_URL=http://localhost:3000/api/proxy/minio
```

### Production (assets.pengaruh.my.id)

```bash
# Automated setup (recommended)
sudo bash scripts/setup-assets-cdn.sh

# Manual setup
# See: docs/DEPLOYMENT_ASSETS.md
```

## 🔗 URLs

| Environment | Asset URL | MinIO Console |
|-------------|-----------|---------------|
| **Development** | `http://localhost:3000/api/proxy/minio` | http://localhost:9001 |
| **Production** | `https://assets.pengaruh.my.id` | http://SERVER_IP:9001 |

## 📁 Asset Structure

```
https://assets.pengaruh.my.id/
├── banners/          # Banner images & videos
│   └── 1234567890-abc123.mp4
├── logo/             # Logo images
│   └── 1234567890-abc123.png
├── transport/        # Transport mode icons
│   └── mrt-logo.svg
└── general/          # Other assets
    └── misc-file.jpg
```

## 🚀 Upload Asset

### Via Backend API

```bash
curl -X POST https://api.pengaruh.my.id/api/assets/upload \
  -F "file=@image.jpg" \
  -F "category=banners"

# Response:
{
  "success": true,
  "directUrl": "https://assets.pengaruh.my.id/banners/1234567890-abc123.jpg",
  "filename": "1234567890-abc123.jpg",
  "size": 123456
}
```

### Via Dashboard

1. Login ke dashboard
2. Pergi ke Assets Management
3. Upload file
4. URL otomatis tersimpan

## 🔧 Configuration

### Backend Environment

```env
# Production
PUBLIC_ASSET_URL=https://assets.pengaruh.my.id

# Development
PUBLIC_ASSET_URL=http://localhost:3000/api/proxy/minio
```

### MinIO Credentials

```env
MINIO_ACCESS_KEY=umkmradar
MINIO_SECRET_KEY=your-secure-password
MINIO_BUCKET=assets
```

## 🔒 Security

### CORS Configuration

Assets dapat diakses dari:
- ✅ `https://*.pengaruh.my.id`
- ✅ `http://localhost:*` (development)

### SSL/TLS

- ✅ HTTPS enforced (HTTP redirects to HTTPS)
- ✅ TLS 1.2 & 1.3
- ✅ Let's Encrypt certificate (auto-renewal)

### Access Control

- ✅ Public read access untuk semua assets
- ✅ Upload hanya via authenticated API
- ✅ MinIO console restricted (localhost only)

## 📊 Monitoring

### Health Check

```bash
curl https://assets.pengaruh.my.id/health
# Response: OK
```

### Storage Usage

```bash
# Via MinIO Console
http://SERVER_IP:9001

# Via CLI
docker exec umkmradar_minio mc du local/assets
```

### Logs

```bash
# Nginx logs
docker-compose logs nginx

# MinIO logs
docker-compose logs minio
```

## 🔄 Maintenance

### Backup Assets

```bash
# Backup to local
docker exec umkmradar_minio mc mirror local/assets /backup/assets

# Backup volume
docker run --rm -v umkmradar_minio_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/minio-backup-$(date +%Y%m%d).tar.gz /data
```

### Update SSL Certificate

```bash
# Auto-renewal (configured via cron)
certbot renew

# Manual renewal
sudo certbot renew --force-renewal
docker-compose restart nginx
```

### Update MinIO

```bash
docker-compose pull minio
docker-compose up -d minio
```

## 🐛 Troubleshooting

### Asset tidak bisa di-load

1. **Check DNS**
   ```bash
   nslookup assets.pengaruh.my.id
   ```

2. **Check SSL**
   ```bash
   curl -I https://assets.pengaruh.my.id/health
   ```

3. **Check MinIO**
   ```bash
   docker ps | grep minio
   docker logs umkmradar_minio
   ```

4. **Check Nginx**
   ```bash
   docker logs umkmradar_nginx
   ```

### CORS Error

Check Nginx CORS headers:
```bash
curl -I -H "Origin: https://test.com" https://assets.pengaruh.my.id/test.jpg
# Should include: Access-Control-Allow-Origin: *
```

### Upload Failed

Check MinIO bucket policy:
```bash
docker exec umkmradar_minio mc anonymous get local/assets
# Should return: download
```

## 📚 Documentation

- **Setup Guide**: [docs/DEPLOYMENT_ASSETS.md](docs/DEPLOYMENT_ASSETS.md)
- **Troubleshooting**: [docs/MINIO_TROUBLESHOOTING.md](docs/MINIO_TROUBLESHOOTING.md)
- **MinIO Setup**: [docs/MINIO_SETUP.md](docs/MINIO_SETUP.md)

## 🎯 Performance

### Caching

- Browser cache: 1 year (`Cache-Control: public, max-age=31536000`)
- Immutable assets: `Cache-Control: public, immutable`

### CDN (Optional)

Untuk performance lebih baik, gunakan CDN seperti Cloudflare:

1. Add domain ke Cloudflare
2. Enable proxy (orange cloud)
3. Configure cache rules
4. Enable Brotli compression

## 📈 Metrics

### Expected Performance

- **Latency**: < 100ms (within region)
- **Throughput**: 100+ MB/s
- **Availability**: 99.9%+

### Monitoring Tools

- Nginx access logs
- MinIO metrics (via Console)
- Uptime monitoring (e.g., UptimeRobot)

## ✅ Production Checklist

- [ ] DNS configured
- [ ] SSL certificate obtained
- [ ] Services running
- [ ] Bucket created
- [ ] Public policy set
- [ ] Health check passing
- [ ] Upload test successful
- [ ] CORS working
- [ ] Firewall configured
- [ ] Backup strategy defined
- [ ] Monitoring setup
- [ ] Documentation updated

---

**Need help?** Check the documentation or contact DevOps team.
