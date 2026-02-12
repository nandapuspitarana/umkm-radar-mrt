# Troubleshooting: MinIO Access Denied Error

## Error Message
```xml
<Error>
<Code>AccessDenied</Code>
<Message>Access Denied.</Message>
<Key>1770859255354-680a4025085dda45.mp4</Key>
<BucketName>banners</BucketName>
<Resource>/banners/1770859255354-680a4025085dda45.mp4</Resource>
</Error>
```

## Root Cause

Error ini terjadi karena:
1. **Bucket name salah**: File di-upload ke bucket `banners` instead of `assets`
2. **Path salah**: Seharusnya `/assets/banners/...` bukan `/banners/...`

## Solutions

### Solution 1: Fix Bucket Configuration (Recommended)

Pastikan environment variable benar:

```env
# backend/.env
MINIO_BUCKET=assets
PUBLIC_ASSET_URL=http://localhost:9000/assets
```

**Restart backend:**
```bash
# Stop backend (Ctrl+C)
npm run dev
```

### Solution 2: Re-initialize MinIO Bucket

Jika bucket `assets` belum ada atau policy salah:

```bash
# Access MinIO container
docker exec -it umkmradar_minio sh

# Configure mc client
mc alias set local http://localhost:9000 umkmradar umkmradar123

# List buckets
mc ls local/

# Create assets bucket if not exists
mc mb local/assets --ignore-existing

# Set public download policy
mc anonymous set download local/assets

# Verify policy
mc anonymous get local/assets
# Should return: download

# Exit
exit
```

### Solution 3: Delete Wrong Bucket

Jika ada bucket `banners` yang salah:

```bash
docker exec -it umkmradar_minio sh

mc alias set local http://localhost:9000 umkmradar umkmradar123

# List all buckets
mc ls local/

# If 'banners' bucket exists, delete it
mc rb local/banners --force

# Ensure 'assets' bucket exists
mc mb local/assets --ignore-existing
mc anonymous set download local/assets

exit
```

### Solution 4: Check Upload Code

Pastikan upload code menggunakan bucket yang benar:

```typescript
// backend/src/storage.ts
export const BUCKET_NAME = process.env.MINIO_BUCKET || 'assets';

// Upload function should use BUCKET_NAME
await minioClient.putObject(
    BUCKET_NAME,  // Should be 'assets'
    objectName,   // Should be 'banners/filename.mp4'
    fileBuffer,
    fileBuffer.length,
    metadata
);
```

### Solution 5: Fix Existing URLs in Database

Jika ada URLs lama di database yang salah:

```sql
-- Check existing asset URLs
SELECT id, storagePath, bucket FROM assets LIMIT 10;

-- Update bucket name if wrong
UPDATE assets 
SET bucket = 'assets' 
WHERE bucket = 'banners' OR bucket IS NULL;

-- Update storage paths if needed
UPDATE assets 
SET storagePath = CONCAT('banners/', filename)
WHERE category = 'banner' AND storagePath NOT LIKE 'banners/%';
```

## Verification Steps

### 1. Check Bucket Exists

```bash
docker exec umkmradar_minio mc ls local/
# Should show: [date] assets/
```

### 2. Check Bucket Policy

```bash
docker exec umkmradar_minio mc anonymous get local/assets
# Should return: download
```

### 3. Test Upload

```bash
# Create test file
echo "test" > test.txt

# Upload via API
curl -X POST http://localhost:3000/api/assets/upload \
  -F "file=@test.txt" \
  -F "category=test"

# Response should include:
# "directUrl": "http://localhost:9000/assets/test/..."
```

### 4. Test Access

```bash
# Use the URL from upload response
curl -I http://localhost:9000/assets/test/1234567890-abc123.txt
# Should return: 200 OK
```

## Common Mistakes

### ❌ Wrong: Bucket name in path
```
http://localhost:9000/banners/file.mp4
```

### ✅ Correct: Bucket in URL, folder in path
```
http://localhost:9000/assets/banners/file.mp4
```

### ❌ Wrong: Upload to bucket 'banners'
```typescript
await minioClient.putObject('banners', 'file.mp4', ...)
```

### ✅ Correct: Upload to bucket 'assets', folder 'banners'
```typescript
await minioClient.putObject('assets', 'banners/file.mp4', ...)
```

## Prevention

### 1. Use Environment Variables

Always use `MINIO_BUCKET` from environment:

```typescript
import { BUCKET_NAME } from './storage';

// Use BUCKET_NAME everywhere
await minioClient.putObject(BUCKET_NAME, objectName, ...);
```

### 2. Validate Configuration on Startup

Add validation in `initializeStorage()`:

```typescript
export async function initializeStorage() {
    console.log(`Initializing MinIO with bucket: ${BUCKET_NAME}`);
    
    // Validate bucket name
    if (BUCKET_NAME !== 'assets') {
        console.warn(`⚠️  Unexpected bucket name: ${BUCKET_NAME}`);
    }
    
    // ... rest of initialization
}
```

### 3. Add Logging

Log upload details:

```typescript
export async function uploadToMinIO(...) {
    console.log(`Uploading to bucket: ${BUCKET_NAME}, path: ${objectName}`);
    // ... upload code
}
```

## Quick Fix Command

Run this to fix everything:

```bash
# Fix MinIO bucket
docker exec umkmradar_minio sh -c "
  mc alias set local http://localhost:9000 umkmradar umkmradar123 && \
  mc mb local/assets --ignore-existing && \
  mc anonymous set download local/assets && \
  mc rb local/banners --force 2>/dev/null || true && \
  echo '✅ MinIO bucket fixed'
"

# Restart backend
# (Ctrl+C in terminal running npm run dev)
npm run dev
```

## Still Having Issues?

1. **Check MinIO Console**: http://localhost:9001
   - Login: umkmradar / umkmradar123
   - Check buckets list
   - Verify bucket policy

2. **Check Backend Logs**:
   ```bash
   # Look for MinIO initialization logs
   # Should see: ✅ MinIO storage initialized successfully
   #             Bucket: assets
   ```

3. **Check Environment**:
   ```bash
   cat backend/.env | grep MINIO
   # Verify MINIO_BUCKET=assets
   ```

4. **Restart Everything**:
   ```bash
   docker-compose restart minio
   # Wait 10 seconds
   npm run dev
   ```

---

**After fixing, test upload again and verify the URL format is correct!**
