# Category Standardization Guide

## Overview
Menyeragamkan penggunaan kategori di seluruh aplikasi dengan menggunakan tabel `categories` sebagai single source of truth.

## Problem Statement
**Sebelum:**
- ❌ Vendors menggunakan `category` (text) - hardcoded
- ❌ Products menggunakan `category` (text) - hardcoded  
- ❌ Tidak ada konsistensi kategori
- ❌ Filter kategori tidak seragam
- ❌ Sulit menambah/edit kategori

**Sesudah:**
- ✅ Semua menggunakan `categoryId` (foreign key ke tabel `categories`)
- ✅ Kategori dikelola dari dashboard admin
- ✅ Filter kategori seragam di semua halaman
- ✅ Dynamic category sidebar

## Database Changes

### Schema Updates

**Categories Table (Master):**
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

**Vendors Table:**
```sql
ALTER TABLE vendors ADD COLUMN category_id INTEGER REFERENCES categories(id);
-- Keep old 'category' field for backward compatibility
```

**Products Table:**
```sql
ALTER TABLE products ADD COLUMN category_id INTEGER REFERENCES categories(id);
-- Keep old 'category' field for backward compatibility
```

### Default Categories

| ID | Name | Slug | Icon | Color | Sort Order |
|----|------|------|------|-------|------------|
| 1 | Rekomen | rekomen | ⭐ | #ef4444 | 0 |
| 2 | Publik | publik | 🏛️ | #3b82f6 | 1 |
| 3 | Kuliner | kuliner | 🍽️ | #f59e0b | 2 |
| 4 | Ngopi | ngopi | ☕ | #d97706 | 3 |
| 5 | Wisata | wisata | 🎭 | #14b8a6 | 4 |
| 6 | ATM & Belanja | atm-belanja | 🏪 | #10b981 | 5 |

## Migration Strategy

### 1. Add Foreign Keys (Non-Breaking)
```sql
-- Add nullable category_id columns
ALTER TABLE vendors ADD COLUMN category_id INTEGER REFERENCES categories(id);
ALTER TABLE products ADD COLUMN category_id INTEGER REFERENCES categories(id);
```

### 2. Seed Default Categories
```sql
-- Run migration: 003_seed_and_migrate_categories.sql
-- This will:
-- 1. Insert default categories
-- 2. Map existing text categories to category IDs
-- 3. Create indexes for performance
```

### 3. Update Application Code

**Backend API:**
- ✅ Support filtering by `categoryId` or `category` (slug)
- ✅ Return category details with vendors/products
- ✅ Backward compatible with old `category` field

**Frontend:**
- ✅ CategorySidebar fetches from `/api/categories`
- ✅ Dynamic colors and icons from database
- ✅ Filter products/vendors by category

## API Updates

### Get Categories
```http
GET /api/categories
Response: [
  {
    "id": 1,
    "name": "Rekomen",
    "slug": "rekomen",
    "icon": "⭐",
    "color": "#ef4444",
    "description": "Rekomendasi pilihan terbaik",
    "isActive": true,
    "sortOrder": 0
  },
  ...
]
```

### Filter Vendors by Category
```http
GET /api/vendors?category=ngopi
GET /api/vendors?categoryId=4
```

### Filter Products by Category
```http
GET /api/products?category=kuliner
GET /api/products?categoryId=3
```

## Frontend Components Updated

### 1. CategorySidebar.jsx
**Before:**
```jsx
const categories = [
    { id: 'rekomen', label: 'Rekomen', icon: '📢', path: '/' },
    // ... hardcoded
];
```

**After:**
```jsx
const [categories, setCategories] = useState([]);

useEffect(() => {
    fetch('/api/categories')
        .then(res => res.json())
        .then(data => setCategories(data.filter(c => c.isActive)));
}, []);
```

### 2. Home.jsx / Category Pages
- Filter vendors by `categoryId`
- Show category name and description
- Dynamic routing based on category slug

## Migration Checklist

- [x] Create categories table schema
- [x] Add categoryId to vendors table
- [x] Add categoryId to products table
- [x] Create migration script for seeding
- [x] Update CategorySidebar to fetch from API
- [x] Add indexes for performance
- [ ] Update vendor creation form to use category dropdown
- [ ] Update product creation form to use category dropdown
- [ ] Add category filter to vendor list
- [ ] Add category filter to product list
- [ ] Update API endpoints to support category filtering
- [ ] Test backward compatibility

## Backward Compatibility

**Old field `category` (text) is kept for:**
1. Existing code that still references it
2. Fallback if categoryId is null
3. Gradual migration without breaking changes

**Deprecation Plan:**
1. Phase 1 (Current): Both fields exist, categoryId is primary
2. Phase 2 (Future): Migrate all data to use categoryId
3. Phase 3 (Future): Remove old `category` text field

## Testing

### 1. Test Category Management
```bash
# Access dashboard
http://localhost:5174/categories

# Test CRUD operations:
- Create new category
- Edit existing category
- Toggle active/inactive
- Change sort order
- Delete category
```

### 2. Test Category Sidebar
```bash
# Access client app
http://localhost:5173/

# Verify:
- Categories load from database
- Icons and colors display correctly
- Clicking category navigates to correct page
- Active state highlights correctly
```

### 3. Test Category Filtering
```bash
# Test vendor filtering
GET /api/vendors?category=ngopi

# Test product filtering  
GET /api/products?categoryId=3
```

## Benefits

1. **Centralized Management**: Admin can add/edit categories from dashboard
2. **Consistency**: Same categories used across vendors and products
3. **Flexibility**: Easy to add new categories without code changes
4. **Performance**: Indexed foreign keys for fast filtering
5. **UI Customization**: Dynamic colors and icons per category
6. **Scalability**: Can add category-specific features (banners, promotions, etc.)

## Next Steps

1. **Update Vendor Form**: Use category dropdown instead of text input
2. **Update Product Form**: Use category dropdown instead of text input
3. **Add Category Filter**: To vendor and product list pages
4. **Category Analytics**: Track popular categories
5. **Category-Specific Features**: Banners, promotions per category
