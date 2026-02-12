# Solusi Lengkap: Dashboard Upload & API Configuration

## 🎯 Masalah

Dashboard tidak bisa upload asset karena mencoba akses:
```
❌ http://localhost:8083/api/assets/upload (404 Not Found)
✅ Seharusnya: http://localhost:3000/api/assets/upload
```

## ✅ Solusi: Vite Proxy (Sudah Dikonfigurasi!)

**Good news**: Vite proxy sudah dikonfigurasi dengan benar di `dashboard/vite.config.js`!

```javascript
server: {
  port: 8083,
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
      secure: false,
    }
  }
}
```

Ini berarti:
- Request dari dashboard ke `/api/*` otomatis di-proxy ke `http://localhost:3000/api/*`
- **TIDAK PERLU** mengubah semua file yang menggunakan `fetch('/api/...')`
- Proxy bekerja secara transparan

## 🚀 Cara Memperbaiki

### Step 1: Restart Dashboard

Dashboard perlu di-restart agar proxy berfungsi:

```bash
# Jika dashboard sedang running, stop dulu (Ctrl+C)
# Kemudian start lagi
cd dashboard
npm run dev
```

### Step 2: Pastikan Backend Running

Backend harus running di port 3000:

```bash
# Di terminal terpisah
cd backend
npm run dev

# Atau dari root project
npm run dev
```

### Step 3: Verify Services

Check semua services running:

```bash
# Backend
curl http://localhost:3000/api/health
# Should return: {"status":"ok",...}

# Dashboard (proxy test)
# Buka browser: http://localhost:8083
# Cek DevTools → Network tab saat upload
```

## 📊 Port & Service Configuration

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **Backend** | 3000 | http://localhost:3000 | API server |
| **Dashboard** | 8083 | http://localhost:8083 | Admin dashboard |
| **Client** | 5174 | http://localhost:5174 | Public website |
| **MinIO** | 9000 | http://localhost:9000 | Object storage |
| **MinIO Console** | 9001 | http://localhost:9001 | MinIO admin |
| **PostgreSQL** | 5432 | localhost:5432 | Database |
| **Redis** | 6379 | localhost:6379 | Cache |

## 🔄 Request Flow dengan Proxy

### Development (dengan Vite Proxy):

```
Browser → http://localhost:8083/api/assets/upload
    ↓ (Vite proxy)
Backend → http://localhost:3000/api/assets/upload
    ↓
MinIO → Save file
    ↓
Return → http://localhost:9000/assets/banners/file.mp4
```

### Production (tanpa proxy):

```
Browser → https://dashboard.pengaruh.my.id
    ↓ (direct API call)
Backend → https://api.pengaruh.my.id/api/assets/upload
    ↓
MinIO → Save file
    ↓
Return → https://assets.pengaruh.my.id/banners/file.mp4
```

## 📁 Files & Configuration

### 1. Vite Config (Already Configured) ✅
**File**: `dashboard/vite.config.js`
```javascript
export default defineConfig({
  server: {
    port: 8083,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})
```

### 2. API Config (Created) ✅
**File**: `dashboard/src/config/api.js`
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const API_ENDPOINTS = { ... };
```

### 3. Environment (Created) ✅
**File**: `dashboard/.env`
```env
VITE_API_URL=http://localhost:3000
```

### 4. API Helper (Created) ✅
**File**: `dashboard/src/utils/api.js`
```javascript
export async function apiFetch(endpoint, options) {
  const url = `${API_URL}${endpoint}`;
  return fetch(url, options);
}
```

## 🧪 Testing

### Test 1: Backend Health

```bash
curl http://localhost:3000/api/health
```

Expected:
```json
{"status":"ok","timestamp":"2026-02-12T..."}
```

### Test 2: Proxy Working

1. Open dashboard: http://localhost:8083
2. Open DevTools (F12) → Network tab
3. Try to upload an asset
4. Check request URL in Network tab:
   - Request URL: `http://localhost:8083/api/assets/upload`
   - But actually goes to: `http://localhost:3000/api/assets/upload` (via proxy)

### Test 3: Upload Success

Expected response:
```json
{
  "success": true,
  "directUrl": "http://localhost:9000/assets/banners/1234567890-abc123.mp4",
  "filename": "1234567890-abc123.mp4",
  "size": 1234567
}
```

## 🐛 Troubleshooting

### Issue: Still getting 404

**Solution 1**: Restart dashboard
```bash
cd dashboard
# Ctrl+C to stop
npm run dev
```

**Solution 2**: Check backend is running
```bash
curl http://localhost:3000/api/health
```

**Solution 3**: Clear browser cache
- Hard refresh: Ctrl+Shift+R
- Or clear cache in DevTools

### Issue: ECONNREFUSED

Backend tidak running. Start backend:
```bash
cd backend
npm run dev
```

### Issue: Proxy not working

Check vite.config.js has correct proxy configuration:
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
  }
}
```

### Issue: Upload works but preview doesn't show

Check MinIO is accessible:
```bash
curl -I http://localhost:9000/assets/test.jpg
```

## 🎯 Production Configuration

### For Production Build

Update `dashboard/.env.production`:
```env
VITE_API_URL=https://api.pengaruh.my.id
```

Build dashboard:
```bash
cd dashboard
npm run build
```

The built files will use the production API URL directly (no proxy in production).

## 📝 Summary

### ✅ What's Already Configured

1. **Vite Proxy** - Routes `/api/*` to backend
2. **API Config** - Centralized API endpoints
3. **Environment** - API_URL configuration
4. **API Helper** - Utility functions for API calls

### 🔧 What You Need to Do

1. **Restart Dashboard** - So proxy takes effect
2. **Ensure Backend Running** - On port 3000
3. **Test Upload** - Should work now!

### 💡 Key Points

- **Development**: Use Vite proxy (no code changes needed)
- **Production**: Use direct API calls with `VITE_API_URL`
- **All existing code** with `fetch('/api/...')` will work via proxy
- **No need** to change every file manually

---

**Just restart dashboard and it should work! 🚀**
