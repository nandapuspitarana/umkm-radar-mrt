# Troubleshooting MinIO Asset Loading

## Problem: Assets tidak bisa di-load dari `http://localhost:9000/assets/...`

### Kemungkinan Penyebab

1. **CORS Issue** - Browser memblokir request cross-origin
2. **Network/Firewall** - Port 9000 diblokir
3. **MinIO Not Running** - Service MinIO belum jalan

## ✅ Solusi 1: Gunakan Proxy Endpoint (Recommended)

Backend sudah menyediakan proxy endpoint untuk serve asset dari MinIO:

### Update PUBLIC_ASSET_URL

Edit `backend/.env`:

```env
# Gunakan proxy endpoint instead of direct MinIO URL
PUBLIC_ASSET_URL=http://localhost:3000/api/proxy/minio
```

Dengan ini, semua asset akan di-serve melalui backend di port 3000, menghindari CORS issue.

**Format URL:**
- ❌ Lama: `http://localhost:9000/assets/banners/video.mp4`
- ✅ Baru: `http://localhost:3000/api/proxy/minio/banners/video.mp4`

### Restart Backend

```bash
# Stop backend (Ctrl+C)
# Start lagi
npm run dev
```

## ✅ Solusi 2: Fix MinIO CORS (Direct Access)

Jika ingin akses MinIO langsung tanpa proxy:

### 1. Akses MinIO Console

Buka: http://localhost:9001

Login:
- Username: `umkmradar`
- Password: `umkmradar123`

### 2. Set Bucket Policy

1. Pergi ke **Buckets** → **assets**
2. Klik **Access Rules**
3. Pastikan **Public** access enabled
4. Atau set custom policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"AWS": ["*"]},
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::assets/*"]
    }
  ]
}
```

### 3. Set CORS (via MinIO Console)

Di MinIO Console:
1. Pergi ke **Configuration** → **CORS**
2. Add CORS rule:

```xml
<CORSConfiguration>
  <CORSRule>
    <AllowedOrigin>http://localhost:*</AllowedOrigin>
    <AllowedOrigin>http://127.0.0.1:*</AllowedOrigin>
    <AllowedOrigin>https://*.pengaruh.my.id</AllowedOrigin>
    <AllowedOrigin>http://*.pengaruh.my.id</AllowedOrigin>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedMethod>POST</AllowedMethod>
    <AllowedMethod>DELETE</AllowedMethod>
    <AllowedMethod>HEAD</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
    <ExposeHeader>ETag</ExposeHeader>
    <MaxAgeSeconds>3600</MaxAgeSeconds>
  </CORSRule>
</CORSConfiguration>
```

## ✅ Solusi 3: Reverse Proxy dengan Nginx (Production)

Untuk production, gunakan Nginx sebagai reverse proxy:

```nginx
# Serve MinIO assets via Nginx
location /assets/ {
    proxy_pass http://minio:9000/assets/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    
    # CORS headers
    add_header Access-Control-Allow-Origin "*";
    add_header Access-Control-Allow-Methods "GET, PUT, POST, DELETE, HEAD";
    add_header Access-Control-Allow-Headers "*";
    
    # Cache
    add_header Cache-Control "public, max-age=31536000";
}
```

## 🧪 Testing

### Test 1: Check MinIO Running

```bash
docker ps | grep minio
```

Expected output:
```
umkmradar_minio   Up   0.0.0.0:9000->9000/tcp, 0.0.0.0:9001->9001/tcp
```

### Test 2: List Files in MinIO

```bash
curl http://localhost:3000/api/minio/list/banners
```

Expected output:
```json
{
  "bucket": "assets",
  "folder": "banners",
  "files": [
    {
      "name": "banners/1770827059610-47eb583f2b432965.mp4",
      "size": 1234567,
      "lastModified": "2026-02-11T16:27:11.745Z"
    }
  ]
}
```

### Test 3: Access via Proxy

```bash
curl -I http://localhost:3000/api/proxy/minio/banners/1770827059610-47eb583f2b432965.mp4
```

Expected output:
```
HTTP/1.1 200 OK
Content-Type: video/mp4
Cache-Control: public, max-age=31536000
Access-Control-Allow-Origin: *
```

### Test 4: Access MinIO Directly

```bash
curl -I http://localhost:9000/assets/banners/1770827059610-47eb583f2b432965.mp4
```

Expected output:
```
HTTP/1.1 200 OK
Content-Type: video/mp4
```

## 📊 Comparison

| Method | URL | Pros | Cons |
|--------|-----|------|------|
| **Proxy** | `http://localhost:3000/api/proxy/minio/...` | ✅ No CORS issues<br>✅ Single port<br>✅ Easy to secure | ⚠️ Extra hop<br>⚠️ Backend dependency |
| **Direct** | `http://localhost:9000/assets/...` | ✅ Faster<br>✅ Direct access<br>✅ Less backend load | ⚠️ CORS config needed<br>⚠️ Extra port exposed |

## 🎯 Recommended Setup

### Development (Localhost)
Use **Proxy Endpoint** untuk kemudahan:
```env
PUBLIC_ASSET_URL=http://localhost:3000/api/proxy/minio
```

### Production (*.pengaruh.my.id)
Use **Direct MinIO** dengan Nginx reverse proxy:
```env
PUBLIC_ASSET_URL=https://cdn.pengaruh.my.id/assets
```

## 🔍 Debug Checklist

- [ ] MinIO container running (`docker ps`)
- [ ] Backend running (`npm run dev`)
- [ ] Bucket `assets` exists (check MinIO Console)
- [ ] Files uploaded successfully (check `/api/minio/list`)
- [ ] Proxy endpoint works (`/api/proxy/minio/...`)
- [ ] PUBLIC_ASSET_URL correct in `.env`
- [ ] Browser console shows no CORS errors

## 💡 Quick Fix

Jika masih tidak bisa load, gunakan proxy endpoint:

```bash
# Edit backend/.env
PUBLIC_ASSET_URL=http://localhost:3000/api/proxy/minio

# Restart backend
npm run dev
```

Kemudian upload ulang asset atau update URL di database.

---

**Need help?** Check MinIO Console at http://localhost:9001
