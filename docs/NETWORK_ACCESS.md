# Network Access Guide - Akses dari PC Lain

## 🎯 Masalah

Aplikasi tidak bisa diakses dari PC lain di network yang sama.

## 🔍 Penyebab

1. **Services listen di localhost only** - Hanya bisa diakses dari PC yang sama
2. **Proxy configuration** - Vite proxy mengarah ke `localhost:3000`
3. **Firewall blocking** - Windows Firewall memblokir port
4. **Wrong IP/URL** - PC lain tidak tahu IP server

## ✅ Solusi

### Otomatis (Recommended)

Jalankan script setup:

```powershell
.\setup-network-access.ps1
```

Script akan:
1. ✅ Detect IP address otomatis
2. ✅ Buat .env files untuk client & dashboard
3. ✅ (Optional) Tambah firewall rules
4. ✅ Tampilkan URL untuk akses dari PC lain

### Manual

#### 1. Cari IP Address Server

```powershell
# Windows
ipconfig

# Cari IPv4 Address, contoh: 192.168.1.100
```

#### 2. Update Environment Variables

**Client** (`client/.env`):
```env
VITE_BACKEND_URL=http://192.168.1.100:3000
```

**Dashboard** (`dashboard/.env`):
```env
VITE_BACKEND_URL=http://192.168.1.100:3000
```

*Ganti `192.168.1.100` dengan IP address server Anda*

#### 3. Tambah Firewall Rules

**Windows Firewall** (Run as Administrator):

```powershell
# Backend
New-NetFirewallRule -DisplayName "UMKM Radar - Backend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow

# Client
New-NetFirewallRule -DisplayName "UMKM Radar - Client" -Direction Inbound -LocalPort 8082 -Protocol TCP -Action Allow

# Dashboard
New-NetFirewallRule -DisplayName "UMKM Radar - Dashboard" -Direction Inbound -LocalPort 8083 -Protocol TCP -Action Allow

# MinIO
New-NetFirewallRule -DisplayName "UMKM Radar - MinIO" -Direction Inbound -LocalPort 9000 -Protocol TCP -Action Allow

# MinIO Console
New-NetFirewallRule -DisplayName "UMKM Radar - MinIO Console" -Direction Inbound -LocalPort 9001 -Protocol TCP -Action Allow
```

**Atau via GUI**:
1. Open Windows Defender Firewall
2. Advanced Settings
3. Inbound Rules → New Rule
4. Port → TCP → Specific ports: 3000, 8082, 8083, 9000, 9001
5. Allow the connection
6. Apply to all profiles
7. Name: "UMKM Radar MRT"

#### 4. Restart Services

```bash
# Stop all services (Ctrl+C)
# Then restart
npm run dev
```

## 📊 Konfigurasi yang Sudah Diterapkan

### 1. Backend (`backend/src/index.ts`)

```typescript
const hostname = '0.0.0.0'; // Listen on all network interfaces

serve({
    fetch: app.fetch,
    port: 3000,
    hostname // Allows network access
});
```

### 2. Client (`client/vite.config.js`)

```javascript
export default defineConfig({
  server: {
    host: '0.0.0.0', // Allow external access
    port: 8082,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})
```

### 3. Dashboard (`dashboard/vite.config.js`)

```javascript
export default defineConfig({
  server: {
    host: '0.0.0.0', // Allow external access
    port: 8083,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})
```

## 🌐 Access URLs

Dari **PC Server** (localhost):
- Backend: http://localhost:3000
- Client: http://localhost:8082
- Dashboard: http://localhost:8083
- MinIO: http://localhost:9000

Dari **PC Lain** (ganti `192.168.1.100` dengan IP server):
- Backend: http://192.168.1.100:3000
- Client: http://192.168.1.100:8082
- Dashboard: http://192.168.1.100:8083
- MinIO: http://192.168.1.100:9000
- MinIO Console: http://192.168.1.100:9001

## 🧪 Testing

### Dari PC Server

```bash
# Test backend
curl http://localhost:3000/api/health

# Test dari network IP
curl http://192.168.1.100:3000/api/health
```

### Dari PC Lain

```bash
# Test backend
curl http://192.168.1.100:3000/api/health

# Expected response:
# {"status":"ok","timestamp":"..."}
```

**Via Browser**:
1. Buka browser di PC lain
2. Akses: `http://192.168.1.100:8083` (Dashboard)
3. Atau: `http://192.168.1.100:8082` (Client)

## 🐛 Troubleshooting

### Issue 1: Connection Refused

**Penyebab**: Firewall blocking atau service tidak running

**Solusi**:
1. Check firewall rules
2. Check service running: `netstat -an | findstr :3000`
3. Try disable firewall temporarily untuk test

### Issue 2: Proxy Error (502 Bad Gateway)

**Penyebab**: Vite proxy tidak bisa connect ke backend

**Solusi**:
1. Check `VITE_BACKEND_URL` di `.env` files
2. Pastikan IP address benar
3. Restart client/dashboard

### Issue 3: Assets Not Loading

**Penyebab**: MinIO URL masih menggunakan localhost

**Solusi**:

Update `backend/.env`:
```env
# Ganti localhost dengan IP server
PUBLIC_ASSET_URL=http://192.168.1.100:9000/assets
```

Restart backend.

### Issue 4: CORS Error

**Penyebab**: Backend CORS tidak allow origin dari PC lain

**Solusi**: Backend sudah dikonfigurasi dengan `cors()` yang allow all origins, seharusnya tidak ada masalah.

## 📱 Mobile Access

Untuk akses dari smartphone di network yang sama:

1. Pastikan smartphone terhubung ke WiFi yang sama
2. Buka browser
3. Akses: `http://192.168.1.100:8082` (Client)

## 🔒 Security Notes

### Development (Current Setup)

- ✅ Firewall rules untuk specific ports
- ⚠️ No authentication untuk network access
- ⚠️ HTTP only (no HTTPS)

### Production Recommendations

1. **Use HTTPS** - Setup SSL certificates
2. **Authentication** - Require login untuk dashboard
3. **Firewall** - Restrict to specific IP ranges
4. **VPN** - Use VPN untuk remote access
5. **Reverse Proxy** - Use Nginx/Caddy

## 📋 Checklist

Untuk akses dari PC lain:

- [ ] Run `setup-network-access.ps1` atau manual setup
- [ ] Firewall rules added
- [ ] Services restarted
- [ ] Test from server PC (localhost)
- [ ] Test from server PC (network IP)
- [ ] Test from other PC (network IP)
- [ ] Test upload asset
- [ ] Test MinIO access

## 🎯 Quick Reference

### Get Server IP

```powershell
# Windows
(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -ne '127.0.0.1'}).IPAddress
```

### Check Port Listening

```powershell
# Check if port is listening
netstat -an | findstr :3000
netstat -an | findstr :8082
netstat -an | findstr :8083
```

### Test Network Connectivity

```powershell
# From other PC
Test-NetConnection -ComputerName 192.168.1.100 -Port 3000
```

## 📚 Related Documentation

- **Setup Script**: `setup-network-access.ps1`
- **MinIO Setup**: `docs/MINIO_SETUP.md`
- **Complete Setup**: `docs/MINIO_COMPLETE_SETUP.md`

---

**Need help?** Make sure:
1. Server PC and client PC on same network
2. Firewall allows the ports
3. Services are running
4. IP address is correct
