-- ==================== MIGRATION: SUBCATEGORIES ====================
-- Sub-kategori untuk vendor (Kuliner, Ngopi, ATM)
-- dan sub-kategori lokasi (area/stasiun MRT)

-- ======== TABEL: vendor_subcategories ========
CREATE TABLE IF NOT EXISTS vendor_subcategories (
    id          SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL,
    icon        TEXT,               -- emoji atau URL
    description TEXT,
    is_active   BOOLEAN DEFAULT true,
    sort_order  INTEGER DEFAULT 0,
    created_at  TIMESTAMP DEFAULT NOW(),
    UNIQUE(category_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_vendor_subcat_category ON vendor_subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_vendor_subcat_active ON vendor_subcategories(is_active);

-- ======== TABEL: location_areas ========
-- Sub-kategori lokasi: area/koridor MRT yang bisa di-assign ke vendor
CREATE TABLE IF NOT EXISTS location_areas (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,          -- e.g. "Dukuh Atas", "Blok M"
    slug        TEXT NOT NULL UNIQUE,
    station     TEXT,                   -- nearest station name
    line        TEXT,                   -- 'MRT', 'KRL', 'LRT', 'TransJakarta'
    description TEXT,
    is_active   BOOLEAN DEFAULT true,
    sort_order  INTEGER DEFAULT 0,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_location_areas_active ON location_areas(is_active);

-- ======== SEED: Sub-kategori Kuliner ========
INSERT INTO vendor_subcategories (category_id, name, slug, icon, description, sort_order)
SELECT c.id, sub.name, sub.slug, sub.icon, sub.desc, sub.ord
FROM categories c,
(VALUES
    ('Nasi & Lauk', 'nasi-lauk', '🍚', 'Nasi uduk, nasi goreng, lauk pauk', 0),
    ('Soto & Sup', 'soto-sup', '🍜', 'Soto, bakso, sup, dll', 1),
    ('Gorengan', 'gorengan', '🍟', 'Gorengan dan makanan ringan', 2),
    ('Ayam & Seafood', 'ayam-seafood', '🍗', 'Ayam bakar, goreng, seafood', 3),
    ('Warung Makan', 'warung-makan', '🏠', 'Warung makan umum', 4),
    ('Jajanan Pasar', 'jajanan-pasar', '🌸', 'Jajanan tradisional pasar', 5),
    ('Sarapan', 'sarapan', '🌅', 'Menu sarapan dan breakfast', 6),
    ('Mie & Pasta', 'mie-pasta', '🍝', 'Mie ayam, bakmi, pasta', 7)
) sub(name, slug, icon, desc, ord)
WHERE c.slug = 'kuliner'
ON CONFLICT (category_id, slug) DO NOTHING;

-- ======== SEED: Sub-kategori Ngopi ========
INSERT INTO vendor_subcategories (category_id, name, slug, icon, description, sort_order)
SELECT c.id, sub.name, sub.slug, sub.icon, sub.desc, sub.ord
FROM categories c,
(VALUES
    ('Kopi Manual', 'kopi-manual', '☕', 'Pour over, V60, siphon, dll', 0),
    ('Espresso Based', 'espresso-based', '🤎', 'Americano, latte, cappuccino', 1),
    ('Kopi Susu', 'kopi-susu', '🥛', 'Kopi susu kekinian', 2),
    ('Non-Kopi', 'non-kopi', '🧋', 'Teh, coklat, matcha', 3),
    ('Cafe Coworking', 'cafe-coworking', '💻', 'Cafe dengan fasilitas kerja', 4),
    ('Cafe Outdoor', 'cafe-outdoor', '🌳', 'Cafe dengan area outdoor', 5)
) sub(name, slug, icon, desc, ord)
WHERE c.slug = 'ngopi'
ON CONFLICT (category_id, slug) DO NOTHING;

-- ======== SEED: Sub-kategori ATM & Belanja ========
INSERT INTO vendor_subcategories (category_id, name, slug, icon, description, sort_order)
SELECT c.id, sub.name, sub.slug, sub.icon, sub.desc, sub.ord
FROM categories c,
(VALUES
    ('ATM', 'atm', '🏧', 'Mesin ATM dan tarik tunai', 0),
    ('Minimarket', 'minimarket', '🛒', 'Indomaret, Alfamart, dll', 1),
    ('Apotek', 'apotek', '💊', 'Apotek dan toko obat', 2),
    ('Toko Kelontong', 'toko-kelontong', '🏪', 'Toko kelontong dan warung', 3),
    ('Ritel Fashion', 'ritel-fashion', '👕', 'Pakaian dan fashion', 4),
    ('Fotokopi & Print', 'fotokopi-print', '🖨️', 'Jasa fotokopi dan cetak', 5)
) sub(name, slug, icon, desc, ord)
WHERE c.slug = 'atm-belanja'
ON CONFLICT (category_id, slug) DO NOTHING;

-- ======== SEED: Sub-kategori Jasa ========
INSERT INTO vendor_subcategories (category_id, name, slug, icon, description, sort_order)
SELECT c.id, sub.name, sub.slug, sub.icon, sub.desc, sub.ord
FROM categories c,
(VALUES
    ('Laundry', 'laundry', '🫧', 'Laundry kiloan dan dryclean', 0),
    ('Potong Rambut', 'potong-rambut', '✂️', 'Barbershop dan salon', 1),
    ('Tambal Ban', 'tambal-ban', '🔧', 'Tambal ban dan bengkel kecil', 2),
    ('Servis Gadget', 'servis-gadget', '📱', 'Servis HP dan elektronik', 3),
    ('Jasa Kurir', 'jasa-kurir', '📦', 'Ekspedisi dan pengiriman', 4)
) sub(name, slug, icon, desc, ord)
WHERE c.slug = 'jasa'
ON CONFLICT (category_id, slug) DO NOTHING;

-- ======== SEED: Area Lokasi MRT Jakarta ========
INSERT INTO location_areas (name, slug, station, line, description, sort_order)
VALUES
('Lebak Bulus', 'lebak-bulus', 'MRT Lebak Bulus Grab', 'MRT', 'Area Lebak Bulus – terminus MRT Jakarta', 0),
('Fatmawati', 'fatmawati', 'MRT Fatmawati Indomaret', 'MRT', 'Area fatmawati dan RSUD', 1),
('Cipete Raya', 'cipete-raya', 'MRT Cipete Raya', 'MRT', 'Area Cipete Raya', 2),
('Haji Nawi', 'haji-nawi', 'MRT Haji Nawi', 'MRT', 'Area Haji Nawi', 3),
('Blok A', 'blok-a', 'MRT Blok A', 'MRT', 'Area Blok A, Radio Dalam', 4),
('Blok M', 'blok-m', 'MRT Blok M BCA', 'MRT', 'Area Blok M dan SCBD', 5),
('ASEAN', 'asean', 'MRT ASEAN', 'MRT', 'Area ASEAN, Kebayoran Baru', 6),
('Senayan', 'senayan', 'MRT Senayan Mastercard', 'MRT', 'Area Senayan, GBK, Plaza Senayan', 7),
('Istora', 'istora', 'MRT Istora Mandiri', 'MRT', 'Area Istora, Sudirman SCBD', 8),
('Bendungan Hilir', 'bendungan-hilir', 'MRT Bendungan Hilir', 'MRT', 'Area Benhil, Karet', 9),
('Setiabudi', 'setiabudi', 'MRT Setiabudi Astra', 'MRT', 'Area Setiabudi, Rasuna Said', 10),
('Dukuh Atas', 'dukuh-atas', 'MRT Dukuh Atas BNI', 'MRT', 'Hub Dukuh Atas: MRT, KRL, TransJakarta, LRT', 11),
('Bundaran HI', 'bundaran-hi', 'MRT Bundaran HI Astra', 'MRT', 'Area Bundaran Hotel Indonesia', 12),
('Monas', 'monas', 'MRT Monas', 'MRT', 'Area Monas, Gambir, Jakarta Pusat', 13),
('Harmoni', 'harmoni', 'MRT Harmoni', 'MRT', 'Area Harmoni, pusat kota lama', 14),
('Sawah Besar', 'sawah-besar', 'MRT Sawah Besar', 'MRT', 'Area Sawah Besar', 15),
('Mangga Besar', 'mangga-besar', 'MRT Mangga Besar', 'MRT', 'Area Mangga Besar', 16),
('Glodok', 'glodok', 'MRT Glodok', 'MRT', 'Area Glodok, Chinatown Jakarta', 17),
('Kota', 'kota', 'MRT Jakarta Kota', 'MRT', 'Terminus MRT Kota, kawasan wisata kota tua', 18)
ON CONFLICT (slug) DO NOTHING;

-- ======== VERIFIKASI ========
SELECT 'Vendor Subcategories:' as info, COUNT(*) as total FROM vendor_subcategories;
SELECT 'Location Areas:' as info, COUNT(*) as total FROM location_areas;
