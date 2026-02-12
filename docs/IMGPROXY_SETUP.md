# Imgproxy Setup via Backend

Fitur image processing (resize, crop, convert) sekarang bekerja melalui Backend API, sehingga tidak perlu membuka port baru di firewall.

## 🔄 Flow

1. **Client/Dashboard**: Request ke `/api/image/banners/sample.jpg?w=300&resize=fit`
2. **Backend**: Proxy request ke local `imgproxy` service (port 8088/8080)
3. **Imgproxy**: Fetch image dari MinIO, process, return result
4. **Backend**: Return processed image ke Client

## 🛠 Configuration

### Backend `.env`

```env
# URL Imgproxy local (internal network)
IMGPROXY_URL=http://localhost:8088
```

### Dashboard Usage

Gunakan helper `getImageUrl` di `utils/api.js`:

```javascript
import { getImageUrl } from '../utils/api';

// Render image
<img src={getImageUrl('banners/hero.jpg', { w: 300, h: 200, resize: 'fill' })} />
```

## ✅ Supported Options

- `w` (width): Target width
- `h` (height): Target height
- `resize`: `fit`, `fill`, `force`
- `gravity`: `no`, `so`, `ea`, `we`, `no`, `ce`, `sm` (smart)
- `enlarge`: `1` (true) or `0` (false)
- `ext`: `webp`, `png`, `jpg`

## 🚀 Deployment

Pada production (Docker), pastikan `IMGPROXY_URL` mengarah ke container name:

```env
IMGPROXY_URL=http://imgproxy:8080
```

Dan pastikan container `backend` dan `imgproxy` berada dalam satu network.
