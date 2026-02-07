-- ==================== UMKM RADAR MRT - DUMMY DATA ====================
-- Complete seed data for development and testing
-- Created: 2026-02-06

-- ==================== CATEGORIES ====================
INSERT INTO categories (name, slug, icon, color, description, is_active, sort_order) VALUES
('Rekomen', 'rekomen', '⭐', '#ef4444', 'Rekomendasi pilihan terbaik', true, 0),
('Publik', 'publik', '🏛️', '#3b82f6', 'Fasilitas publik', true, 1),
('Kuliner', 'kuliner', '🍽️', '#f59e0b', 'Makanan dan minuman', true, 2),
('Ngopi', 'ngopi', '☕', '#d97706', 'Kopi dan cafe', true, 3),
('Wisata', 'wisata', '🎭', '#14b8a6', 'Tempat wisata', true, 4),
('ATM & Belanja', 'atm-belanja', '🏪', '#10b981', 'ATM, minimarket, dan belanja', true, 5)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    description = EXCLUDED.description;

-- ==================== NAVIGATION ====================
-- Header Navigation
INSERT INTO navigation_items (label, path, icon, position, sort_order, is_visible, is_external, requires_auth) VALUES
('Beranda', '/', '🏠', 'header', 0, true, false, false),
('Kuliner', '/kuliner', '🍽️', 'header', 1, true, false, false),
('Ngopi', '/ngopi', '☕', 'header', 2, true, false, false),
('Wisata', '/wisata', '🎭', 'header', 3, true, false, false),
('ATM & Belanja', '/atm-belanja', '🏪', 'header', 4, true, false, false)
ON CONFLICT DO NOTHING;

-- Footer Navigation
INSERT INTO navigation_items (label, path, icon, position, sort_order, is_visible, is_external, requires_auth) VALUES
('Tentang Kami', '/about', NULL, 'footer', 0, true, false, false),
('Kontak', '/contact', NULL, 'footer', 1, true, false, false),
('Kebijakan Privasi', '/privacy', NULL, 'footer', 2, true, false, false),
('Syarat & Ketentuan', '/terms', NULL, 'footer', 3, true, false, false)
ON CONFLICT DO NOTHING;

-- ==================== USERS ====================
-- Admin user (password: admin123)
INSERT INTO users (email, password, role, name, vendor_id) VALUES
('admin@umkmradar.com', 'admin123', 'admin', 'Admin UMKM Radar', NULL)
ON CONFLICT (email) DO NOTHING;

-- Vendor users will be created after vendors

-- ==================== VENDORS ====================
-- Get category IDs
DO $$
DECLARE
    cat_kuliner_id INT;
    cat_ngopi_id INT;
    cat_wisata_id INT;
    cat_atm_id INT;
    cat_publik_id INT;
    cat_rekomen_id INT;
BEGIN
    SELECT id INTO cat_kuliner_id FROM categories WHERE slug = 'kuliner';
    SELECT id INTO cat_ngopi_id FROM categories WHERE slug = 'ngopi';
    SELECT id INTO cat_wisata_id FROM categories WHERE slug = 'wisata';
    SELECT id INTO cat_atm_id FROM categories WHERE slug = 'atm-belanja';
    SELECT id INTO cat_publik_id FROM categories WHERE slug = 'publik';
    SELECT id INTO cat_rekomen_id FROM categories WHERE slug = 'rekomen';

    -- KULINER VENDORS
    INSERT INTO vendors (name, lat, lng, whatsapp, address, category, category_id, status, rating, location_tags, description, image) VALUES
    ('Warung Nasi Ibu Siti', -6.2088, 106.8456, '081234567890', 'Jl. Sudirman No. 123, Jakarta Pusat', 'Kuliner', cat_kuliner_id, 'approved', 4.8, 'Dekat MRT Dukuh Atas', 'Nasi uduk, ayam goreng, sayur asem, pecel lele', 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400'),
    ('Soto Betawi Pak Haji', -6.2095, 106.8463, '081234567891', 'Jl. MH Thamrin No. 45, Jakarta Pusat', 'Kuliner', cat_kuliner_id, 'approved', 4.7, 'Dekat MRT Bundaran HI', 'Soto betawi, kerupuk, emping, nasi putih', 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400'),
    ('Bakso Malang Cak Eko', -6.2102, 106.8470, '081234567892', 'Jl. Kebon Sirih No. 78, Jakarta Pusat', 'Kuliner', cat_kuliner_id, 'approved', 4.6, 'Dekat MRT Bundaran HI', 'Bakso urat, bakso halus, mie ayam, pangsit goreng', 'https://images.unsplash.com/photo-1623341214825-9f4f963727da?w=400'),
    ('Gado-Gado Jakarta Mak Ijah', -6.2085, 106.8448, '081234567893', 'Jl. Sabang No. 12, Jakarta Pusat', 'Kuliner', cat_kuliner_id, 'approved', 4.9, 'Dekat MRT Dukuh Atas', 'Gado-gado, ketoprak, asinan, rujak', 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400'),
    ('Nasi Goreng Kambing Kebon Sirih', -6.2098, 106.8465, '081234567894', 'Jl. Kebon Sirih Raya No. 34, Jakarta Pusat', 'Kuliner', cat_kuliner_id, 'approved', 4.5, 'Dekat MRT Bundaran HI', 'Nasi goreng kambing, sate kambing, gulai kambing', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400'),
    
    -- NGOPI VENDORS
    ('Kopi Kenangan', -6.2090, 106.8460, '081234567895', 'Jl. Sudirman No. 88, Jakarta Pusat', 'Ngopi', cat_ngopi_id, 'approved', 4.7, 'Dekat MRT Dukuh Atas', 'Kopi susu, es kopi, kopi hitam, matcha latte', 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400'),
    ('Janji Jiwa Coffee', -6.2093, 106.8458, '081234567896', 'Jl. MH Thamrin No. 67, Jakarta Pusat', 'Ngopi', cat_ngopi_id, 'approved', 4.6, 'Dekat MRT Bundaran HI', 'Kopi janji jiwa, es kopi susu, americano', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400'),
    ('Fore Coffee', -6.2088, 106.8455, '081234567897', 'Jl. Sudirman No. 100, Jakarta Pusat', 'Ngopi', cat_ngopi_id, 'approved', 4.8, 'Dekat MRT Dukuh Atas', 'Latte, cappuccino, cold brew, affogato', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400'),
    ('Kopi Tuku', -6.2096, 106.8462, '081234567898', 'Jl. Sabang No. 56, Jakarta Pusat', 'Ngopi', cat_ngopi_id, 'approved', 4.9, 'Dekat MRT Dukuh Atas', 'Es kopi susu tetangga, kopi tuku original', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400'),
    
    -- ATM & BELANJA VENDORS
    ('Indomaret Sudirman', -6.2087, 106.8457, '081234567899', 'Jl. Sudirman No. 150, Jakarta Pusat', 'ATM & Belanja', cat_atm_id, 'approved', 4.5, 'Dekat MRT Dukuh Atas', 'Minimarket, ATM BCA, ATM Mandiri, sembako', 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400'),
    ('Alfamart Thamrin', -6.2094, 106.8461, '081234567900', 'Jl. MH Thamrin No. 89, Jakarta Pusat', 'ATM & Belanja', cat_atm_id, 'approved', 4.4, 'Dekat MRT Bundaran HI', 'Minimarket, ATM BRI, ATM BNI, pulsa token', 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400'),
    ('ATM Center BNI', -6.2091, 106.8459, '081234567901', 'Jl. Sudirman No. 200, Jakarta Pusat', 'ATM & Belanja', cat_atm_id, 'approved', 4.3, 'Dekat MRT Dukuh Atas', 'ATM BNI, ATM BCA, ATM Mandiri, ATM BRI', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400'),
    
    -- WISATA VENDORS
    ('Museum Nasional Indonesia', -6.1751, 106.8270, '081234567902', 'Jl. Medan Merdeka Barat No. 12, Jakarta Pusat', 'Wisata', cat_wisata_id, 'approved', 4.7, 'Dekat MRT Monas', 'Museum sejarah, koleksi arkeologi, tur guide', 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3b7?w=400'),
    ('Monumen Nasional (Monas)', -6.1754, 106.8272, '081234567903', 'Jl. Silang Monas, Jakarta Pusat', 'Wisata', cat_wisata_id, 'approved', 4.8, 'Dekat MRT Monas', 'Tugu monas, museum, taman, spot foto', 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=400'),
    ('Taman Menteng', -6.1950, 106.8350, '081234567904', 'Jl. HOS Cokroaminoto, Menteng, Jakarta Pusat', 'Wisata', cat_wisata_id, 'approved', 4.6, 'Dekat MRT Bundaran HI', 'Taman kota, jogging track, playground, wifi gratis', 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=400'),
    
    -- PUBLIK VENDORS
    ('Masjid Istiqlal', -6.1702, 106.8297, '081234567905', 'Jl. Taman Wijaya Kusuma, Jakarta Pusat', 'Publik', cat_publik_id, 'approved', 4.9, 'Dekat MRT Monas', 'Masjid, tempat ibadah, kajian, parkir luas', 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=400'),
    ('Gereja Katedral Jakarta', -6.1707, 106.8300, '081234567906', 'Jl. Katedral No. 7B, Jakarta Pusat', 'Publik', cat_publik_id, 'approved', 4.8, 'Dekat MRT Monas', 'Gereja, misa, arsitektur gothic, wisata religi', 'https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=400'),
    ('Perpustakaan Nasional RI', -6.1850, 106.8320, '081234567907', 'Jl. Salemba Raya No. 28A, Jakarta Pusat', 'Publik', cat_publik_id, 'approved', 4.7, 'Dekat MRT Bundaran HI', 'Perpustakaan, baca buku, wifi gratis, ruang belajar', 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400')
    ON CONFLICT DO NOTHING;

END $$;

-- ==================== PRODUCTS ====================
-- Products for each vendor
DO $$
DECLARE
    vendor_id_temp INT;
    cat_kuliner_id INT;
    cat_ngopi_id INT;
BEGIN
    SELECT id INTO cat_kuliner_id FROM categories WHERE slug = 'kuliner';
    SELECT id INTO cat_ngopi_id FROM categories WHERE slug = 'ngopi';

    -- Skip if products already exist (prevent duplicates)
    IF EXISTS (SELECT 1 FROM products LIMIT 1) THEN
        RAISE NOTICE 'Products already seeded, skipping...';
        RETURN;
    END IF;

    -- Warung Nasi Ibu Siti
    SELECT id INTO vendor_id_temp FROM vendors WHERE name = 'Warung Nasi Ibu Siti' LIMIT 1;
    INSERT INTO products (vendor_id, name, price, category, category_id, image, rating, description, is_available) VALUES
    (vendor_id_temp, 'Nasi Uduk Komplit', 25000, 'Kuliner', cat_kuliner_id, 'https://images.unsplash.com/photo-1596040033229-a0b3b83b7e8f?w=400', 4.8, 'Nasi uduk + ayam goreng + tempe + tahu + sambal', true),
    (vendor_id_temp, 'Ayam Goreng Kremes', 18000, 'Kuliner', cat_kuliner_id, 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400', 4.7, 'Ayam goreng dengan kremesan renyah', true),
    (vendor_id_temp, 'Pecel Lele', 20000, 'Kuliner', cat_kuliner_id, 'https://images.unsplash.com/photo-1625937286074-9ca519d5d9df?w=400', 4.6, 'Lele goreng + sambal + lalapan + nasi', true),
    (vendor_id_temp, 'Sayur Asem', 12000, 'Kuliner', cat_kuliner_id, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400', 4.5, 'Sayur asem segar dengan jagung dan kacang', true);

    -- Soto Betawi Pak Haji
    SELECT id INTO vendor_id_temp FROM vendors WHERE name = 'Soto Betawi Pak Haji' LIMIT 1;
    INSERT INTO products (vendor_id, name, price, category, category_id, image, rating, description, is_available) VALUES
    (vendor_id_temp, 'Soto Betawi Daging', 30000, 'Kuliner', cat_kuliner_id, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400', 4.8, 'Soto betawi kuah santan dengan daging sapi', true),
    (vendor_id_temp, 'Soto Betawi Jeroan', 28000, 'Kuliner', cat_kuliner_id, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400', 4.7, 'Soto betawi dengan jeroan sapi pilihan', true),
    (vendor_id_temp, 'Soto Betawi Campur', 35000, 'Kuliner', cat_kuliner_id, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400', 4.9, 'Soto betawi daging + jeroan + paru', true),
    (vendor_id_temp, 'Emping Melinjo', 5000, 'Kuliner', cat_kuliner_id, 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400', 4.5, 'Emping melinjo renyah', true);

    -- Bakso Malang Cak Eko
    SELECT id INTO vendor_id_temp FROM vendors WHERE name = 'Bakso Malang Cak Eko' LIMIT 1;
    INSERT INTO products (vendor_id, name, price, category, category_id, image, rating, description, is_available) VALUES
    (vendor_id_temp, 'Bakso Urat Jumbo', 25000, 'Kuliner', cat_kuliner_id, 'https://images.unsplash.com/photo-1623341214825-9f4f963727da?w=400', 4.8, 'Bakso urat besar dengan kuah kaldu sapi', true),
    (vendor_id_temp, 'Bakso Halus', 20000, 'Kuliner', cat_kuliner_id, 'https://images.unsplash.com/photo-1623341214825-9f4f963727da?w=400', 4.7, 'Bakso halus lembut dengan mie', true),
    (vendor_id_temp, 'Mie Ayam Bakso', 22000, 'Kuliner', cat_kuliner_id, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400', 4.6, 'Mie ayam + bakso + pangsit goreng', true),
    (vendor_id_temp, 'Pangsit Goreng', 15000, 'Kuliner', cat_kuliner_id, 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400', 4.5, 'Pangsit goreng isi ayam cincang', true);

    -- Gado-Gado Jakarta Mak Ijah
    SELECT id INTO vendor_id_temp FROM vendors WHERE name = 'Gado-Gado Jakarta Mak Ijah' LIMIT 1;
    INSERT INTO products (vendor_id, name, price, category, category_id, image, rating, description, is_available) VALUES
    (vendor_id_temp, 'Gado-Gado Komplit', 18000, 'Kuliner', cat_kuliner_id, 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400', 4.9, 'Sayuran + tahu + tempe + telur + bumbu kacang', true),
    (vendor_id_temp, 'Ketoprak Jakarta', 16000, 'Kuliner', cat_kuliner_id, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400', 4.8, 'Ketupat + tahu + tauge + bumbu kacang', true),
    (vendor_id_temp, 'Asinan Betawi', 15000, 'Kuliner', cat_kuliner_id, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', 4.7, 'Asinan sayur dengan kuah asam pedas', true),
    (vendor_id_temp, 'Rujak Buah', 17000, 'Kuliner', cat_kuliner_id, 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400', 4.6, 'Rujak buah segar dengan bumbu petis', true);

    -- Kopi Kenangan
    SELECT id INTO vendor_id_temp FROM vendors WHERE name = 'Kopi Kenangan' LIMIT 1;
    INSERT INTO products (vendor_id, name, price, category, category_id, image, rating, description, is_available) VALUES
    (vendor_id_temp, 'Kopi Kenangan Mantan', 22000, 'Ngopi', cat_ngopi_id, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400', 4.8, 'Kopi susu gula aren signature', true),
    (vendor_id_temp, 'Es Kopi Susu Tetangga', 18000, 'Ngopi', cat_ngopi_id, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400', 4.7, 'Es kopi susu creamy', true),
    (vendor_id_temp, 'Americano', 15000, 'Ngopi', cat_ngopi_id, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400', 4.6, 'Kopi hitam americano', true),
    (vendor_id_temp, 'Matcha Latte', 25000, 'Ngopi', cat_ngopi_id, 'https://images.unsplash.com/photo-1536013266787-c0a5c2f6a6e5?w=400', 4.5, 'Matcha latte premium', true);

    -- Janji Jiwa Coffee
    SELECT id INTO vendor_id_temp FROM vendors WHERE name = 'Janji Jiwa Coffee' LIMIT 1;
    INSERT INTO products (vendor_id, name, price, category, category_id, image, rating, description, is_available) VALUES
    (vendor_id_temp, 'Kopi Janji Jiwa Original', 12000, 'Ngopi', cat_ngopi_id, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', 4.7, 'Kopi hitam robusta pilihan', true),
    (vendor_id_temp, 'Es Kopi Susu Jiwa', 15000, 'Ngopi', cat_ngopi_id, 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400', 4.6, 'Es kopi susu signature', true),
    (vendor_id_temp, 'Cappuccino', 18000, 'Ngopi', cat_ngopi_id, 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400', 4.5, 'Cappuccino dengan foam tebal', true),
    (vendor_id_temp, 'Caramel Macchiato', 22000, 'Ngopi', cat_ngopi_id, 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400', 4.4, 'Macchiato dengan caramel sauce', true);

    -- Fore Coffee
    SELECT id INTO vendor_id_temp FROM vendors WHERE name = 'Fore Coffee' LIMIT 1;
    INSERT INTO products (vendor_id, name, price, category, category_id, image, rating, description, is_available) VALUES
    (vendor_id_temp, 'Latte', 25000, 'Ngopi', cat_ngopi_id, 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400', 4.8, 'Latte dengan espresso premium', true),
    (vendor_id_temp, 'Cold Brew', 28000, 'Ngopi', cat_ngopi_id, 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400', 4.7, 'Cold brew smooth dan rich', true),
    (vendor_id_temp, 'Affogato', 30000, 'Ngopi', cat_ngopi_id, 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400', 4.9, 'Espresso + vanilla ice cream', true),
    (vendor_id_temp, 'Spanish Latte', 27000, 'Ngopi', cat_ngopi_id, 'https://images.unsplash.com/photo-1578374173705-0a5a0c6c0d7e?w=400', 4.6, 'Latte dengan condensed milk', true);

    -- Kopi Tuku
    SELECT id INTO vendor_id_temp FROM vendors WHERE name = 'Kopi Tuku' LIMIT 1;
    INSERT INTO products (vendor_id, name, price, category, category_id, image, rating, description, is_available) VALUES
    (vendor_id_temp, 'Es Kopi Susu Tetangga', 20000, 'Ngopi', cat_ngopi_id, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400', 4.9, 'Signature es kopi susu Tuku', true),
    (vendor_id_temp, 'Kopi Tuku Original', 18000, 'Ngopi', cat_ngopi_id, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400', 4.8, 'Kopi hitam original Tuku', true),
    (vendor_id_temp, 'Es Coklat Tuku', 22000, 'Ngopi', cat_ngopi_id, 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400', 4.7, 'Coklat susu premium', true),
    (vendor_id_temp, 'Matcha Tuku', 25000, 'Ngopi', cat_ngopi_id, 'https://images.unsplash.com/photo-1536013266787-c0a5c2f6a6e5?w=400', 4.6, 'Matcha latte Tuku', true);

END $$;

-- ==================== VOUCHERS ====================
INSERT INTO vouchers (code, type, value, vendor_id, min_purchase, max_discount, is_active) VALUES
('WELCOME10', 'percentage', 10, NULL, 20000, 10000, true),
('HEMAT15K', 'fixed', 15000, NULL, 50000, NULL, true),
('NGOPI20', 'percentage', 20, NULL, 25000, 15000, true),
('KULINER25K', 'fixed', 25000, NULL, 100000, NULL, true),
('GRATIS5K', 'fixed', 5000, NULL, 15000, NULL, true)
ON CONFLICT (code) DO NOTHING;

-- ==================== SETTINGS ====================
INSERT INTO settings (key, value) VALUES
('footer_text', '{"text": "© 2026 UMKM Radar MRT. Platform untuk menemukan UMKM terbaik di sekitar stasiun MRT Jakarta."}'),
('footer_links', '{"links": [{"label": "Tentang Kami", "url": "/about"}, {"label": "Kontak", "url": "/contact"}, {"label": "Kebijakan Privasi", "url": "/privacy"}]}'),
('app_name', '{"name": "UMKM Radar MRT"}'),
('app_tagline', '{"tagline": "Temukan UMKM Terbaik di Sekitar MRT"}'),
('contact_whatsapp', '{"number": "6281234567890"}'),
('contact_email', '{"email": "info@umkmradar.com"}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ==================== SUMMARY ====================
SELECT 
    'Categories' as table_name,
    COUNT(*) as total_records
FROM categories
UNION ALL
SELECT 'Navigation Items', COUNT(*) FROM navigation_items
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'Vendors', COUNT(*) FROM vendors
UNION ALL
SELECT 'Products', COUNT(*) FROM products
UNION ALL
SELECT 'Vouchers', COUNT(*) FROM vouchers
UNION ALL
SELECT 'Settings', COUNT(*) FROM settings
ORDER BY table_name;
