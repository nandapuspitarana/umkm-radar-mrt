# Summary: MinIO Asset Management - Complete Setup

## ✅ What Has Been Configured

### 1. Backend API Endpoints ✅

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/api/assets/upload` | Upload file to MinIO | ✅ Ready |
| GET | `/api/assets` | List all assets | ✅ Added |
| GET | `/api/assets?category=banners` | Filter by category | ✅ Added |
| GET | `/api/assets/:id` | Get single asset | ✅ Added |
| DELETE | `/api/assets/:id` | Delete asset | ✅ Added |
| GET | `/api/proxy/minio/*` | Proxy to MinIO | ✅ Ready |
| GET | `/api/minio/list/:folder` | Debug: List MinIO files | ✅ Ready |

### 2. MinIO Configuration ✅

**Environment** (`backend/.env`):
```env
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=umkmradar
MINIO_SECRET_KEY=umkmradar123
MINIO_BUCKET=assets
PUBLIC_ASSET_URL=http://localhost:9000/assets
```

**Bucket**: `assets`  
**Policy**: Public read access  
**CORS**: Configured for localhost and *.pengaruh.my.id

### 3. Dashboard Configuration ✅

**Vite Proxy** (`dashboard/vite.config.js`):
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
  }
}
```

**API Config** (`dashboard/src/config/api.js`):
- Centralized API endpoints
- Environment variable support

**Components**:
- `ImageUploader.jsx` - Updated to use API_ENDPOINTS
- `Assets.jsx` - Asset management page

### 4. Database Schema ✅

**Table**: `assets`
```sql
CREATE TABLE assets (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  bucket TEXT DEFAULT 'assets',
  category TEXT DEFAULT 'general',
  alt TEXT,
  uploaded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔄 Request Flow

### Upload Flow:
```
Dashboard (localhost:8083)
  ↓ POST /api/assets/upload
Vite Proxy
  ↓ Forward to localhost:3000
Backend
  ↓ Upload to MinIO
  ↓ Save metadata to DB
MinIO (localhost:9000)
  ↓ Return URL
http://localhost:9000/assets/banners/file.mp4
```

### List Assets Flow:
```
Dashboard (localhost:8083)
  ↓ GET /api/assets
Vite Proxy
  ↓ Forward to localhost:3000
Backend
  ↓ Query database
  ↓ Add MinIO URLs
Return JSON with assets
```

## 🐛 Troubleshooting: Slow Loading

### Issue: `/api/assets` takes too long to load

**Possible Causes**:
1. Backend not fully reloaded
2. Database connection slow
3. No assets in database yet
4. Network timeout

**Solutions**:

#### 1. Check Backend Status
```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Should return immediately:
# {"status":"ok","timestamp":"..."}
```

#### 2. Test Assets Endpoint Directly
```bash
# Test backend directly
curl http://localhost:3000/api/assets

# Should return array (empty or with assets):
# []
# or
# [{"id":1,"filename":"...","directUrl":"..."}]
```

#### 3. Test via Proxy
```bash
# Test through dashboard proxy
curl http://localhost:8083/api/assets

# Should return same as above
```

#### 4. Check Database
```bash
# Connect to database
docker exec -it umkmradar_db psql -U postgres -d umkmradar

# Check assets table
SELECT COUNT(*) FROM assets;
SELECT * FROM assets LIMIT 5;

# Exit
\q
```

#### 5. Restart Services

If backend is stuck:
```bash
# Stop all (Ctrl+C in terminal running npm run dev)
# Then restart
npm run dev
```

Or restart individually:
```bash
# Backend only
cd backend
npm run dev

# Dashboard only (in separate terminal)
cd dashboard
npm run dev
```

## 🧪 Testing Checklist

### Backend Tests:
- [ ] `curl http://localhost:3000/api/health` → 200 OK
- [ ] `curl http://localhost:3000/api/assets` → 200 OK (returns array)
- [ ] `curl http://localhost:9000/assets/` → MinIO accessible

### Dashboard Tests:
- [ ] Open http://localhost:8083
- [ ] Navigate to Assets page
- [ ] Page loads (not stuck on loading spinner)
- [ ] Can upload file
- [ ] File appears in list
- [ ] Can view asset details
- [ ] Can copy URL
- [ ] Can delete asset

### Proxy Tests:
- [ ] `curl http://localhost:8083/api/health` → 200 OK (proxied)
- [ ] `curl http://localhost:8083/api/assets` → 200 OK (proxied)

## 📊 Service Status

Check all services are running:

```powershell
# Backend
curl http://localhost:3000/api/health

# Dashboard
curl http://localhost:8083

# MinIO
curl http://localhost:9000/minio/health/live

# Database
docker ps | grep postgres
```

## 🔧 Quick Fixes

### Fix 1: Restart Everything
```bash
# Stop all services (Ctrl+C)
# Kill any stuck processes
Get-Process node | Stop-Process -Force

# Restart
npm run dev
```

### Fix 2: Clear Browser Cache
- Hard refresh: `Ctrl + Shift + R`
- Or clear cache in DevTools

### Fix 3: Check Browser Console
- Open DevTools (F12)
- Check Console tab for errors
- Check Network tab for failed requests

### Fix 4: Verify Database Table Exists
```sql
-- Check if assets table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'assets';

-- If not exists, run migration
-- (Check backend/drizzle folder for migrations)
```

## 📝 Expected Behavior

### First Load (No Assets):
1. Dashboard loads
2. Navigate to Assets page
3. Shows "Belum ada aset" message
4. Upload area is ready

### After Upload:
1. Select file
2. Choose category
3. Click upload
4. File uploads to MinIO
5. Metadata saved to database
6. Asset appears in grid/list
7. Can click to view details
8. Can copy URL
9. URL works: `http://localhost:9000/assets/...`

## 🎯 Performance Expectations

- **Health check**: < 50ms
- **List assets (empty)**: < 100ms
- **List assets (10 items)**: < 200ms
- **Upload (1MB file)**: < 2s
- **Delete asset**: < 500ms

If any endpoint takes > 5 seconds, there's likely an issue.

## 📚 Documentation Files

- **This Summary**: `docs/MINIO_COMPLETE_SETUP.md`
- **Upload Fix**: `docs/FIX_DASHBOARD_UPLOAD_404.md`
- **Access Denied**: `docs/MINIO_ACCESS_DENIED_FIX.md`
- **Troubleshooting**: `docs/MINIO_TROUBLESHOOTING.md`
- **Setup Guide**: `docs/MINIO_SETUP.md`
- **Deployment**: `docs/DEPLOYMENT_ASSETS.md`

## 🚀 Next Steps

1. **Verify backend is running**: Check health endpoint
2. **Test assets endpoint**: Should return quickly
3. **Open dashboard**: Navigate to Assets page
4. **Upload test file**: Verify upload works
5. **Check asset appears**: In grid/list view
6. **Test preview**: Click asset to view details

---

**If still having issues, check browser console and backend logs for specific error messages.**
