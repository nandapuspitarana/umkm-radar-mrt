# MinIO Storage Setup Guide

Panduan ini menjelaskan cara setup MinIO untuk UMKM Radar MRT dengan CORS yang mendukung localhost dan `*.pengaruh.my.id`.

## 🎯 Tujuan

- Menggunakan MinIO sebagai S3-compatible object storage
- Semua asset (gambar, video, banner) dapat di-preview di:
  - `http://localhost:*` (semua port)
  - `https://*.pengaruh.my.id`
  - `http://*.pengaruh.my.id`

## 📋 Prerequisites

1. Docker & Docker Compose terinstall
2. MinIO Client (mc) - opsional untuk konfigurasi manual

### Install MinIO Client (Optional)

**Windows (Chocolatey):**
```powershell
choco install minio-client
```

**Windows (Manual):**
Download dari: https://dl.min.io/client/mc/release/windows-amd64/mc.exe

**Linux/Mac:**
```bash
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/
```

## 🚀 Quick Start

### 1. Start MinIO dengan Docker Compose

```bash
# Start semua services termasuk MinIO
docker-compose up -d

# Atau hanya MinIO
docker-compose up -d minio
```

MinIO akan berjalan di:
- **API**: http://localhost:9000
- **Console**: http://localhost:9001

**Login Credentials:**
- Username: `umkmradar`
- Password: `umkmradar123`

### 2. Setup Bucket & CORS (Otomatis)

Backend akan otomatis membuat bucket `assets` dan mengatur policy saat pertama kali dijalankan.

```bash
cd backend
npm run dev
```

Backend akan:
✅ Membuat bucket `assets` jika belum ada
✅ Set bucket policy untuk public read access
✅ Siap menerima upload

### 3. Setup CORS Manual (Opsional)

Jika ingin setup CORS secara manual:

**Windows:**
```powershell
cd backend
.\setup-minio-cors.ps1
```

**Linux/Mac:**
```bash
cd backend
chmod +x setup-minio-cors.sh
./setup-minio-cors.sh
```

## 🔧 Konfigurasi

### Environment Variables

File: `backend/.env`

```env
# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=umkmradar
MINIO_SECRET_KEY=umkmradar123
MINIO_BUCKET=assets

# Public URL for assets
PUBLIC_ASSET_URL=http://localhost:9000/assets
```

### Production Configuration

Untuk production di `*.pengaruh.my.id`:

```env
MINIO_ENDPOINT=minio.pengaruh.my.id
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=your-production-key
MINIO_SECRET_KEY=your-production-secret
MINIO_BUCKET=assets

PUBLIC_ASSET_URL=https://minio.pengaruh.my.id/assets
```

## 📁 Struktur Bucket

```
assets/
├── banners/          # Banner images & videos
├── logo/             # Logo images
├── transport/        # Transport mode icons
├── products/         # Product images
└── general/          # Other assets
```

## 🌐 CORS Configuration

MinIO dikonfigurasi untuk menerima request dari:

```json
{
  "AllowedOrigins": [
    "http://localhost:*",
    "http://127.0.0.1:*",
    "https://*.pengaruh.my.id",
    "http://*.pengaruh.my.id"
  ],
  "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
  "AllowedHeaders": ["*"],
  "ExposeHeaders": ["ETag"],
  "MaxAgeSeconds": 3600
}
```

## 🧪 Testing

### 1. Test Upload via Dashboard

1. Buka dashboard: http://localhost:8083
2. Login sebagai admin
3. Buka halaman Banner Management
4. Upload gambar atau video
5. Preview harus langsung muncul

### 2. Test Direct Access

```bash
# Upload file
curl -X POST http://localhost:3000/api/assets/upload \
  -F "file=@test-image.jpg" \
  -F "category=banner"

# Response akan berisi URL seperti:
# http://localhost:9000/assets/banners/1234567890-abc123.jpg

# Test akses langsung
curl http://localhost:9000/assets/banners/1234567890-abc123.jpg
```

### 3. Test CORS

```javascript
// Test dari browser console
fetch('http://localhost:9000/assets/banners/test.jpg')
  .then(res => res.blob())
  .then(blob => console.log('Success!', blob))
  .catch(err => console.error('CORS Error:', err));
```

## 🔍 Troubleshooting

### Problem: Upload berhasil tapi preview tidak muncul

**Solution:**
1. Cek MinIO running: `docker ps | grep minio`
2. Cek bucket policy:
   ```bash
   mc anonymous get umkmradar/assets
   ```
3. Pastikan PUBLIC_ASSET_URL benar di `.env`

### Problem: CORS Error di browser

**Solution:**
1. Buka MinIO Console: http://localhost:9001
2. Login dengan credentials
3. Pergi ke Buckets → assets → Access Rules
4. Pastikan "Public" access enabled

### Problem: Connection refused ke MinIO

**Solution:**
```bash
# Restart MinIO
docker-compose restart minio

# Check logs
docker-compose logs minio
```

## 📊 Monitoring

### MinIO Console

Akses: http://localhost:9001

Features:
- Browse files
- Monitor storage usage
- Manage access policies
- View metrics

### Health Check

```bash
# Check MinIO health
curl http://localhost:9000/minio/health/live

# Check bucket exists
mc ls umkmradar/assets
```

## 🔐 Security Notes

### Development
- Default credentials OK untuk development
- CORS terbuka untuk localhost

### Production
- ⚠️ **GANTI** MINIO_ACCESS_KEY dan MINIO_SECRET_KEY
- Gunakan HTTPS (MINIO_USE_SSL=true)
- Batasi CORS hanya ke domain yang diperlukan
- Enable MinIO encryption at rest
- Setup backup policy

## 🚢 Deployment

### Docker Production

```yaml
minio:
  image: minio/minio:latest
  environment:
    MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
    MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
  volumes:
    - minio_data:/data
  command: server /data --console-address ":9001"
  networks:
    - app-network
```

### Reverse Proxy (Nginx)

```nginx
# MinIO API
location /minio/ {
    proxy_pass http://minio:9000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    
    # CORS headers
    add_header Access-Control-Allow-Origin "*";
    add_header Access-Control-Allow-Methods "GET, PUT, POST, DELETE, HEAD";
    add_header Access-Control-Allow-Headers "*";
}
```

## 📚 Resources

- [MinIO Documentation](https://min.io/docs/minio/linux/index.html)
- [MinIO Client Guide](https://min.io/docs/minio/linux/reference/minio-mc.html)
- [S3 API Compatibility](https://docs.min.io/docs/minio-server-configuration-guide.html)

## ✅ Checklist

- [ ] Docker Compose running
- [ ] MinIO accessible at http://localhost:9000
- [ ] MinIO Console accessible at http://localhost:9001
- [ ] Bucket `assets` created
- [ ] Public read policy set
- [ ] Backend can upload to MinIO
- [ ] Assets preview working in dashboard
- [ ] CORS working from localhost
- [ ] Environment variables configured

## 🎉 Success!

Jika semua checklist di atas ✅, maka MinIO sudah siap digunakan!

Upload asset dari dashboard dan pastikan preview langsung muncul.
