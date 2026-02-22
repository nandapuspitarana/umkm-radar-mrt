-- ==================== MIGRATION: PINDAHKAN VENDOR WISATA/PUBLIK KE DESTINATIONS ====================
-- Vendor yang masuk kategori "Wisata" atau "Publik" harusnya ada di tabel destinations
-- Jalankan migration ini untuk memindahkan data dengan benar

BEGIN;

-- ======== LANGKAH 1: Pindahkan vendor kategori WISATA ke destinations ========
INSERT INTO destinations (
    name, description, lat, lng, category, address, image,
    nearest_station, station_type, distance_from_station,
    walking_time_minutes, opening_hours, is_active, created_at, updated_at
)
SELECT
    v.name,
    COALESCE(v.description, 'Destinasi wisata di Jakarta'),
    v.lat,
    v.lng,
    'Wisata Budaya',           -- default category destinations
    v.address,
    v.image,
    COALESCE(v.location_tags, 'Stasiun MRT Terdekat'),
    'MRT',
    0.5,
    7,
    '08:00 - 17:00',
    true,
    NOW(),
    NOW()
FROM vendors v
JOIN categories c ON c.id = v.category_id
WHERE c.slug = 'wisata'
  AND v.name NOT IN (SELECT name FROM destinations);  -- hindari duplikat

-- ======== LANGKAH 2: Pindahkan vendor kategori PUBLIK ke destinations ========
INSERT INTO destinations (
    name, description, lat, lng, category, address, image,
    nearest_station, station_type, distance_from_station,
    walking_time_minutes, opening_hours, is_active, created_at, updated_at
)
SELECT
    v.name,
    COALESCE(v.description, 'Fasilitas publik di Jakarta'),
    v.lat,
    v.lng,
    'Wisata Religi',           -- default category destinations (masjid, gereja, dll)
    v.address,
    v.image,
    COALESCE(v.location_tags, 'Stasiun MRT Terdekat'),
    'MRT',
    0.5,
    7,
    '24 Jam',
    true,
    NOW(),
    NOW()
FROM vendors v
JOIN categories c ON c.id = v.category_id
WHERE c.slug = 'publik'
  AND v.name NOT IN (SELECT name FROM destinations);  -- hindari duplikat

-- ======== LANGKAH 3: Hapus vendor yang dipindah dari tabel vendors ========
DELETE FROM vendors
WHERE category_id IN (SELECT id FROM categories WHERE slug IN ('wisata', 'publik'));

-- ======== LANGKAH 4: Hapus kategori Wisata dan Publik dari tabel categories ========
-- (tidak boleh dipakai lagi untuk vendors)
DELETE FROM categories WHERE slug IN ('wisata', 'publik');

-- ======== VERIFIKASI ========
SELECT 'Destinations setelah migrasi:' as info, COUNT(*) as total FROM destinations;
SELECT 'Vendors tersisa (hanya UMKM):' as info, COUNT(*) as total FROM vendors;
SELECT 'Categories tersisa:' as info, name FROM categories ORDER BY sort_order;

COMMIT;
