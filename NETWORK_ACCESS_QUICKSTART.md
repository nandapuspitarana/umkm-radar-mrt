# Quick Start - Network Access

## ✅ Setup Selesai!

Network access sudah dikonfigurasi dengan IP: **192.168.1.5**

## 🌐 Access URLs

### Dari PC Server (localhost):
- Backend: http://localhost:3000
- Client: http://localhost:8082
- Dashboard: http://localhost:8083
- MinIO: http://localhost:9000

### Dari PC Lain (di network yang sama):
- Backend: http://192.168.1.5:3000
- Client: http://192.168.1.5:8082
- Dashboard: http://192.168.1.5:8083
- MinIO: http://192.168.1.5:9000
- MinIO Console: http://192.168.1.5:9001

## 🚀 Next Steps

### 1. Restart Services

Services perlu di-restart agar menggunakan konfigurasi baru:

```bash
# Stop current services (Ctrl+C di terminal yang running npm run dev)
# Kemudian start lagi:
npm run dev
```

### 2. Test dari PC Server

```bash
# Test dengan IP network
curl http://192.168.1.5:3000/api/health
```

### 3. Test dari PC Lain

**Via Browser**:
1. Buka browser di PC lain (harus di network yang sama)
2. Akses: http://192.168.1.5:8083 (Dashboard)
3. Atau: http://192.168.1.5:8082 (Client)

**Via Command Line**:
```bash
curl http://192.168.1.5:3000/api/health
```

## 🔥 Firewall

Firewall rules sudah ditambahkan untuk ports:
- ✅ 3000 (Backend)
- ✅ 8082 (Client)
- ✅ 8083 (Dashboard)
- ✅ 9000 (MinIO)
- ✅ 9001 (MinIO Console)

## 📱 Mobile Access

Untuk akses dari smartphone:
1. Hubungkan smartphone ke WiFi yang sama
2. Buka browser
3. Akses: http://192.168.1.5:8082

## 🐛 Troubleshooting

### Tidak bisa akses dari PC lain?

**Check 1: Firewall**
```powershell
# List firewall rules
Get-NetFirewallRule -DisplayName "UMKM Radar*"
```

**Check 2: Services Running**
```powershell
# Check ports listening
netstat -an | findstr :3000
netstat -an | findstr :8082
netstat -an | findstr :8083
```

**Check 3: Network Connectivity**
```powershell
# From other PC
Test-NetConnection -ComputerName 192.168.1.5 -Port 3000
```

**Check 4: IP Address**
Jika IP berubah (misalnya setelah restart), jalankan lagi:
```powershell
.\setup-network-access.ps1
```

### Upload asset tidak bekerja?

Update MinIO URL di `backend/.env`:
```env
PUBLIC_ASSET_URL=http://192.168.1.5:9000/assets
```

Restart backend.

## 📁 Files Created

```
client/.env
dashboard/.env
```

## 📚 Documentation

- **Network Access Guide**: `docs/NETWORK_ACCESS.md`
- **Complete Setup**: `docs/MINIO_COMPLETE_SETUP.md`

## 🎯 Summary

✅ Backend listen di 0.0.0.0:3000  
✅ Client proxy ke http://192.168.1.5:3000  
✅ Dashboard proxy ke http://192.168.1.5:3000  
✅ Firewall rules added  
✅ Ready untuk network access  

**Restart services dan test dari PC lain!** 🚀
