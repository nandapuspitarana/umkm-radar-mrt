# Migrasi ke MinIO Storage

## 📝 Ringkasan Perubahan

Aplikasi UMKM Radar MRT sekarang menggunakan **MinIO** sebagai object storage untuk semua asset (gambar, video, banner).

### ✅ Yang Sudah Dikonfigurasi

1. **Backend Storage Module** (`backend/src/storage.ts`)
   - MinIO client configuration
   - Upload function dengan CORS support
   - Auto bucket initialization
   - Public read access policy

2. **Upload Endpoint** (`backend/src/index.ts`)
   - `/api/assets/upload` sekarang upload ke MinIO
   - Return URL format: `http://localhost:9000/assets/{folder}/{filename}`

3. **Environment Variables** (`backend/.env`)
   - MINIO_ENDPOINT, MINIO_PORT, MINIO_ACCESS_KEY, dll
   - PUBLIC_ASSET_URL untuk base URL assets

4. **Docker Compose** (`docker-compose.yml`)
   - MinIO service sudah ada
   - Port 9000 (API) dan 9001 (Console)

5. **Setup Scripts**
   - `setup-minio-cors.ps1` (Windows)
   - `setup-minio-cors.sh` (Linux/Mac)

6. **Dokumentasi**
   - `docs/MINIO_SETUP.md` - Panduan lengkap

## 🚀 Cara Menggunakan

### 1. Start MinIO

```bash
# Start semua services
docker-compose up -d

# Atau hanya MinIO
docker-compose up -d minio
```

### 2. Install Dependencies

```bash
cd backend
npm install minio
```

### 3. Start Backend

```bash
npm run dev
```

Backend akan otomatis:
- ✅ Membuat bucket `assets`
- ✅ Set public read policy
- ✅ Siap menerima upload

### 4. Test Upload

Buka dashboard dan upload banner/logo. Asset akan tersimpan di MinIO dan URL akan berformat:
```
http://localhost:9000/assets/banners/1234567890-abc123.jpg
```

## 🌐 CORS Support

MinIO dikonfigurasi untuk menerima request dari:
- ✅ `http://localhost:*` (semua port)
- ✅ `http://127.0.0.1:*`
- ✅ `https://*.pengaruh.my.id`
- ✅ `http://*.pengaruh.my.id`

## 📊 MinIO Console

Akses: **http://localhost:9001**

Login:
- Username: `umkmradar`
- Password: `umkmradar123`

Di console Anda bisa:
- Browse uploaded files
- Monitor storage usage
- Manage bucket policies
- View access logs

## 🔄 Migrasi Asset Lama (Opsional)

Jika ada asset di folder `backend/uploads/`, Anda bisa migrasi ke MinIO:

```javascript
// Script migrasi (buat file migrate-to-minio.js)
import { uploadToMinIO } from './src/storage.js';
import fs from 'fs/promises';
import path from 'path';

async function migrateAssets() {
  const uploadsDir = './uploads/assets';
  const folders = ['banners', 'logo', 'transport', 'general'];
  
  for (const folder of folders) {
    const folderPath = path.join(uploadsDir, folder);
    try {
      const files = await fs.readdir(folderPath);
      
      for (const file of files) {
        const filePath = path.join(folderPath, file);
        const buffer = await fs.readFile(filePath);
        const ext = path.extname(file).slice(1);
        
        const mimeTypes = {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'mp4': 'video/mp4',
          'webm': 'video/webm'
        };
        
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        
        const url = await uploadToMinIO(buffer, file, folder, contentType);
        console.log(`✅ Migrated: ${file} -> ${url}`);
      }
    } catch (err) {
      console.log(`⚠️ Skipping ${folder}: ${err.message}`);
    }
  }
}

migrateAssets();
```

## 🔧 Troubleshooting

### Upload berhasil tapi preview tidak muncul

1. Cek MinIO running:
   ```bash
   docker ps | grep minio
   ```

2. Cek bucket policy di console (http://localhost:9001)

3. Pastikan PUBLIC_ASSET_URL benar di `.env`

### CORS Error

1. Restart MinIO:
   ```bash
   docker-compose restart minio
   ```

2. Cek browser console untuk error detail

3. Pastikan request dari origin yang diizinkan

## 📚 Dokumentasi Lengkap

Lihat: `docs/MINIO_SETUP.md`

## ✅ Checklist

- [ ] MinIO running (`docker ps`)
- [ ] npm install minio berhasil
- [ ] Backend running tanpa error
- [ ] Upload test berhasil
- [ ] Preview asset muncul di dashboard
- [ ] MinIO console accessible

## 🎯 Next Steps

1. Test upload dari dashboard
2. Verify preview working
3. (Optional) Migrate existing assets
4. Update production config untuk `*.pengaruh.my.id`

---

**Happy coding! 🚀**
