-- Migration: Seed default categories and migrate existing data
-- Created: 2026-02-06
-- CATATAN: Kategori ini HANYA untuk vendor/UMKM
-- Destinasi wisata menggunakan tabel 'destinations' terpisah

-- Insert default categories (with ON CONFLICT to avoid duplicates)
INSERT INTO categories (name, slug, icon, color, description, is_active, sort_order) VALUES
('Rekomen', 'rekomen', '⭐', '#ef4444', 'Rekomendasi pilihan terbaik dari UMKM terdekat', true, 0),
('Kuliner', 'kuliner', '🍽️', '#f59e0b', 'Makanan dan minuman UMKM', true, 1),
('Ngopi', 'ngopi', '☕', '#d97706', 'Kopi, cafe, dan minuman', true, 2),
('ATM & Belanja', 'atm-belanja', '🏪', '#10b981', 'ATM, minimarket, dan belanja', true, 3),
('Jasa', 'jasa', '🔧', '#6366f1', 'Jasa dan layanan UMKM', true, 4),
('Ritel', 'ritel', '🛍️', '#ec4899', 'Toko ritel dan gerai', true, 5)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order;

-- Migrate existing vendor categories to use category_id
-- Map old text categories to new category IDs
UPDATE vendors SET category_id = (
    CASE 
        WHEN LOWER(category) LIKE '%kuliner%' OR LOWER(category) LIKE '%makanan%' OR LOWER(category) LIKE '%makan%' THEN (SELECT id FROM categories WHERE slug = 'kuliner')
        WHEN LOWER(category) LIKE '%kopi%' OR LOWER(category) LIKE '%ngopi%' OR LOWER(category) LIKE '%cafe%' THEN (SELECT id FROM categories WHERE slug = 'ngopi')
        WHEN LOWER(category) LIKE '%atm%' OR LOWER(category) LIKE '%belanja%' OR LOWER(category) LIKE '%minimarket%' THEN (SELECT id FROM categories WHERE slug = 'atm-belanja')
        WHEN LOWER(category) LIKE '%jasa%' THEN (SELECT id FROM categories WHERE slug = 'jasa')
        WHEN LOWER(category) LIKE '%ritel%' OR LOWER(category) LIKE '%toko%' THEN (SELECT id FROM categories WHERE slug = 'ritel')
        -- CATATAN: wisata & publik TIDAK dimap ke vendors, mereka masuk ke destinations
        ELSE (SELECT id FROM categories WHERE slug = 'rekomen')
    END
)
WHERE category_id IS NULL;

-- Migrate existing product categories to use category_id
UPDATE products SET category_id = (
    CASE 
        WHEN LOWER(category) LIKE '%kuliner%' OR LOWER(category) LIKE '%makanan%' OR LOWER(category) LIKE '%makan%' THEN (SELECT id FROM categories WHERE slug = 'kuliner')
        WHEN LOWER(category) LIKE '%kopi%' OR LOWER(category) LIKE '%ngopi%' OR LOWER(category) LIKE '%minuman%' THEN (SELECT id FROM categories WHERE slug = 'ngopi')
        WHEN LOWER(category) LIKE '%snack%' OR LOWER(category) LIKE '%cemilan%' THEN (SELECT id FROM categories WHERE slug = 'kuliner')
        ELSE (SELECT id FROM categories WHERE slug = 'rekomen')
    END
)
WHERE category_id IS NULL;

-- Create indexes for better performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_vendors_category_id ON vendors(category_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- Verify migration
SELECT 
    'Vendors with category_id' as description,
    COUNT(*) as total,
    COUNT(category_id) as with_category_id,
    COUNT(*) - COUNT(category_id) as without_category_id
FROM vendors
UNION ALL
SELECT 
    'Products with category_id' as description,
    COUNT(*) as total,
    COUNT(category_id) as with_category_id,
    COUNT(*) - COUNT(category_id) as without_category_id
FROM products;
