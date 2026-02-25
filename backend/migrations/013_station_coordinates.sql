-- ==================== MIGRATION: STATION COORDINATES + DISTANCE ====================
-- Tambah kolom lat/lng ke location_areas untuk calculate jarak vendor

-- 1. Tambah kolom jika belum ada
ALTER TABLE location_areas ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE location_areas ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

-- 2. Isi koordinat MRT Jakarta (data resmi)
UPDATE location_areas SET lat = -6.2892, lng = 106.7747 WHERE slug = 'lebak-bulus';
UPDATE location_areas SET lat = -6.2925, lng = 106.7925 WHERE slug = 'fatmawati';
UPDATE location_areas SET lat = -6.2750, lng = 106.7969 WHERE slug = 'cipete-raya';
UPDATE location_areas SET lat = -6.2642, lng = 106.7983 WHERE slug = 'haji-nawi';
UPDATE location_areas SET lat = -6.2536, lng = 106.7978 WHERE slug = 'blok-a';
UPDATE location_areas SET lat = -6.2444, lng = 106.7981 WHERE slug = 'blok-m';
UPDATE location_areas SET lat = -6.2389, lng = 106.7981 WHERE slug = 'asean';
UPDATE location_areas SET lat = -6.2272, lng = 106.8019 WHERE slug = 'senayan';
UPDATE location_areas SET lat = -6.2222, lng = 106.8067 WHERE slug = 'istora';
UPDATE location_areas SET lat = -6.2147, lng = 106.8186 WHERE slug = 'bendungan-hilir';
UPDATE location_areas SET lat = -6.2089, lng = 106.8225 WHERE slug = 'setiabudi';
UPDATE location_areas SET lat = -6.2011, lng = 106.8231 WHERE slug = 'dukuh-atas';
UPDATE location_areas SET lat = -6.1950, lng = 106.8228 WHERE slug = 'bundaran-hi';
UPDATE location_areas SET lat = -6.1872, lng = 106.8342 WHERE slug = 'monas';
UPDATE location_areas SET lat = -6.1803, lng = 106.8392 WHERE slug = 'harmoni';
UPDATE location_areas SET lat = -6.1653, lng = 106.8428 WHERE slug = 'sawah-besar';
UPDATE location_areas SET lat = -6.1522, lng = 106.8428 WHERE slug = 'mangga-besar';
UPDATE location_areas SET lat = -6.1469, lng = 106.8325 WHERE slug = 'glodok';
UPDATE location_areas SET lat = -6.1375, lng = 106.8172 WHERE slug = 'kota';

-- 3. Tambah kolom distance_from_station ke vendors (pre-calculated, optional manual override)
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS distance_meters INTEGER;

-- 4. Verifikasi
SELECT name, slug, lat, lng FROM location_areas WHERE lat IS NOT NULL ORDER BY sort_order;
