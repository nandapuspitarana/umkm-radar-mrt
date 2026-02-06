# Category Management System

## Overview
Sistem manajemen kategori untuk UMKM Radar MRT yang memungkinkan admin mengelola kategori vendor dan produk.

## Features Implemented

### Backend (API)
- ✅ Database schema untuk tabel `categories`
- ✅ CRUD API endpoints:
  - `GET /api/categories` - Get all categories
  - `GET /api/categories/:id` - Get single category
  - `POST /api/categories` - Create new category
  - `PUT /api/categories/:id` - Update category
  - `DELETE /api/categories/:id` - Delete category

### Frontend (Dashboard)
- ✅ Categories management page (`/categories`)
- ✅ Add/Edit form dengan fields:
  - Name (required)
  - Slug (auto-generated, editable)
  - Icon (emoji atau URL)
  - Color picker
  - Description
  - Active/Inactive toggle
  - Sort order
- ✅ Table view dengan:
  - Visual color preview
  - Icon display
  - Active/Inactive status toggle
  - Edit & Delete actions
- ✅ Sidebar navigation link (admin only)

## Database Schema

```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT,
    color TEXT DEFAULT '#0969da',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Default Categories

1. **Rekomen** (⭐) - Rekomendasi pilihan terbaik
2. **Publik** (🏛️) - Fasilitas publik
3. **Kuliner** (🍽️) - Makanan dan minuman
4. **Ngopi** (☕) - Kopi dan cafe
5. **Wisata** (🎭) - Tempat wisata
6. **ATM & Belanja** (🏪) - ATM, minimarket, dan belanja

## Usage

### Access the Categories Page
1. Login as admin
2. Navigate to "Kategori" in sidebar
3. Click "Tambah Kategori" to create new category
4. Edit or delete existing categories

### API Examples

**Get all categories:**
```bash
GET http://localhost:3000/api/categories
```

**Create category:**
```bash
POST http://localhost:3000/api/categories
Content-Type: application/json

{
  "name": "Ngopi",
  "slug": "ngopi",
  "icon": "☕",
  "color": "#8b5cf6",
  "description": "Kopi dan cafe",
  "isActive": true,
  "sortOrder": 3
}
```

## Next Steps (Optimization)

### Performance Optimization
1. **Response Time Optimization:**
   - Add database indexes on frequently queried fields
   - Implement connection pooling
   - Add query result caching with Redis

2. **Client-Side Caching:**
   - Implement React Query / SWR for data fetching
   - Add stale-while-revalidate strategy
   - Cache categories data locally
   - Reduce unnecessary re-fetches

3. **API Improvements:**
   - Add pagination for large datasets
   - Implement field selection (sparse fieldsets)
   - Add ETag support for conditional requests
   - Compress responses with gzip

## Files Modified/Created

### Backend
- `backend/src/db/schema.ts` - Added categories table
- `backend/src/index.ts` - Added categories API endpoints
- `backend/migrations/001_add_categories.sql` - Migration file

### Frontend (Dashboard)
- `dashboard/src/pages/Categories.jsx` - New page
- `dashboard/src/App.jsx` - Added route
- `dashboard/src/components/Sidebar.jsx` - Added menu link

## Testing

Access the categories page at:
```
http://localhost:5174/categories
```

(Login as admin required)
