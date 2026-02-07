# Asset Seeder Documentation

## Overview
Asset seeder untuk UMKM Radar MRT yang menambahkan data asset (logo, banner, icon) ke database berdasarkan desain Figma.

## File Locations
- **Migration SQL**: `backend/migrations/998_seed_assets.sql`
- **Seed Script**: `backend/seed.js`
- **API Endpoints**: `backend/src/index.ts`

## Asset Categories

### 1. Transport Logos (`transport-logo`)
Logo untuk transport links yang ditampilkan di homepage:
- MRT Jakarta
- TiJe (Transjakarta Integrated)
- LRT Jakarta
- KAI Commuter
- Whoosh High Speed Rail
- Jaklingko

**API Path**: `/api/assets/transport/{filename}.svg`

### 2. Homepage Banners (`banner`)
Banner untuk story section di homepage (175x300px portrait):
- Kuliner banners (3 items)
- Ngopi banners (3 items)
- Promo banners (3 items)
- Event banners (3 items)

**API Path**: `/api/assets/banners/{filename}.jpg`

### 3. Navigation Icons (`icon`)
Icon untuk navigation UI:
- Back, Close, Search, Power/Logout
- Chevron Down, Chevron Right
- Check On, Check Off

**API Path**: `/api/assets/icons/{filename}.svg`

### 4. Category Icons (`category-icon`)
Icon untuk kategori sidebar (on/off states):
- Rekomen (on/off)
- Publik (on/off)
- Kuliner (on/off)
- Ngopi (on/off)
- Wisata (on/off)
- ATM & Belanja (on/off)

**API Path**: `/api/assets/icons/{filename}.svg`

### 5. App Branding (`logo`)
Logo aplikasi:
- App Logo (standard)
- App Logo Inline

**API Path**: `/api/assets/branding/{filename}.svg`

## API Endpoints

### Settings API

#### GET /api/settings
Mendapatkan semua settings dalam format JSON.

**Response**:
```json
{
  "transport_links": {
    "links": [
      {
        "id": 1,
        "name": "TiJe",
        "logo": "/api/assets/transport/tije-logo.svg",
        "url": "https://transjakarta.co.id"
      },
      ...
    ]
  },
  "homepage_banners": {
    "banners": [
      {
        "id": 1,
        "title": "Kuliner Nusantara",
        "subtitle": "Cita Rasa Tradisional",
        "image": "/api/assets/banners/kuliner-1.jpg",
        "link": "/kuliner"
      },
      ...
    ]
  },
  "app_logo": {
    "logo": "/api/assets/branding/app-logo.svg",
    "logo_inline": "/api/assets/branding/app-logo-inline.svg"
  }
}
```

#### GET /api/settings/:key
Mendapatkan setting berdasarkan key.

**Example**: `GET /api/settings/transport_links`

#### PUT /api/settings/:key
Update atau create setting.

**Body**:
```json
{
  "value": { ... }
}
```

### Assets API

#### GET /api/assets
Mendapatkan semua assets atau filter by category.

**Query Parameters**:
- `category` (optional): Filter by category (transport-logo, banner, icon, category-icon, logo)

**Example**: `GET /api/assets?category=transport-logo`

#### GET /api/assets/*
Serve asset file berdasarkan storage path.

**Example**: `GET /api/assets/transport/mrt-logo.svg`

**Response**: SVG/Image file dengan proper Content-Type header

**Note**: Saat ini mengembalikan placeholder SVG. Dalam production, akan fetch dari MinIO/S3.

## Database Schema

### `assets` Table
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

### `settings` Table
```sql
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL
);
```

## Running the Seeder

### Manual Run
```bash
cd backend
DB_NAME=umkmradar node seed.js
```

### What Gets Seeded
1. **Assets Table**: 40+ asset records
   - 6 transport logos
   - 12 homepage banners
   - 8 navigation icons
   - 12 category icons (6 × 2 states)
   - 2 app logos

2. **Settings Table**: 3 settings
   - `transport_links`: Transport mode links with logos
   - `homepage_banners`: Story banners for homepage
   - `app_logo`: Application branding

## Frontend Integration

### Using Transport Links
```jsx
const [transportLinks, setTransportLinks] = useState([]);

useEffect(() => {
    fetch('/api/settings/transport_links')
        .then(res => res.json())
        .then(data => setTransportLinks(data.value.links));
}, []);

// Render
{transportLinks.map(link => (
    <a key={link.id} href={link.url}>
        <img src={link.logo} alt={link.name} />
        <span>{link.name}</span>
    </a>
))}
```

### Using Homepage Banners
```jsx
const [banners, setBanners] = useState([]);

useEffect(() => {
    fetch('/api/settings/homepage_banners')
        .then(res => res.json())
        .then(data => setBanners(data.value.banners));
}, []);

// Render
{banners.map(banner => (
    <div key={banner.id} onClick={() => navigate(banner.link)}>
        <img src={banner.image} alt={banner.title} />
        <h3>{banner.title}</h3>
        <p>{banner.subtitle}</p>
    </div>
))}
```

### Using App Logo
```jsx
const [appLogo, setAppLogo] = useState('');

useEffect(() => {
    fetch('/api/settings/app_logo')
        .then(res => res.json())
        .then(data => setAppLogo(data.value.logo));
}, []);

// Render
<img src={appLogo} alt="UMKM Radar MRT" />
```

## Figma Reference
Design source: https://www.figma.com/design/6tydRCrkZxDgXmPHjHWMkv/RADAR?node-id=65-1192

Components mapped:
- **master-icon**: Category icons (on/off states)
- **logo moda**: Transport logos
- **icon navigantion**: Navigation icons
- **headbar**: Header/navbar component
- **card thumbnail**: Banner/story cards

## Future Enhancements
1. **MinIO Integration**: Implement actual file storage and retrieval from MinIO/S3
2. **Image Upload**: Add endpoint for uploading new assets
3. **Image Optimization**: Add image resizing and optimization
4. **CDN Integration**: Serve assets through CDN for better performance
5. **Asset Management UI**: Dashboard untuk manage assets

## Troubleshooting

### Assets tidak muncul
1. Check database: `SELECT * FROM assets LIMIT 10;`
2. Check settings: `SELECT * FROM settings WHERE key = 'transport_links';`
3. Test API: `curl http://localhost:3000/api/assets/transport/mrt-logo.svg`

### Seeder gagal
1. Pastikan database `umkmradar` sudah dibuat
2. Pastikan schema sudah di-push: `npm run db:push`
3. Check error log di console

### TypeScript errors
1. Rebuild: `npm run build`
2. Check types: `tsc --noEmit`
