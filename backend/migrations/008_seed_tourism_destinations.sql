-- Migration: Seed Tourism Destinations Data
-- Description: Populate destinations table with tourism data from Figma design

-- Clear existing tourism data
DELETE FROM destinations WHERE category IN (
    'sejarah-museum',
    'budaya-seni',
    'religi',
    'alam-ruang-terbuka',
    'keluarga-rekreasi',
    'edukasi',
    'belanja'
);

-- Wisata Sejarah & Museum
INSERT INTO destinations (name, category, lat, lng, nearest_station, station_type, distance_from_station, opening_hours, image, description) VALUES
('Museum Nasional (Museum Gajah)', 'sejarah-museum', -6.1762, 106.8224, 'Stasiun MRT Senayan', 'MRT', 4.50, '08:00 - 16:00', 'https://images.unsplash.com/photo-1566127444979-b3d2b64a9b1f?w=400&h=300&fit=crop', 'Museum nasional dengan koleksi arkeologi dan etnografi terlengkap di Indonesia'),
('Monas & Taman Sekitarnya', 'sejarah-museum', -6.1754, 106.8272, 'Stasiun MRT Senayan', 'MRT', 4.70, '06:00 - 20:00', 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=400&h=300&fit=crop', 'Monumen Nasional sebagai simbol perjuangan kemerdekaan Indonesia'),
('Museum Fatahilah (Sejarah Jakarta)', 'sejarah-museum', -6.1345, 106.8133, 'Stasiun MRT Senayan', 'MRT', 9.50, '09:00 - 15:00', 'https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=400&h=300&fit=crop', 'Museum sejarah Jakarta di kawasan Kota Tua'),
('Museum Wayang', 'sejarah-museum', -6.1343, 106.8128, 'Stasiun MRT Senayan', 'MRT', 9.60, '09:00 - 15:00', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop', 'Museum yang menyimpan berbagai koleksi wayang dari seluruh Indonesia'),
('Museum Seni Rupa & Keramik', 'sejarah-museum', -6.1340, 106.8130, 'Stasiun MRT Senayan', 'MRT', 9.60, '09:00 - 15:00', 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=400&h=300&fit=crop', 'Museum seni rupa dan keramik Indonesia dan mancanegara');

-- Wisata Budaya & Seni
INSERT INTO destinations (name, category, lat, lng, nearest_station, station_type, distance_from_station, opening_hours, image, description) VALUES
('Taman Ismail Marzuki (TIM)', 'budaya-seni', -6.1891, 106.8386, 'Stasiun MRT Senayan', 'MRT', 4.20, '09:00 - 21:00', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=300&fit=crop', 'Pusat kesenian dan kebudayaan Jakarta'),
('Gedung Kesenian Jakarta', 'budaya-seni', -6.1669, 106.8305, 'Stasiun MRT Senayan', 'MRT', 5.50, '10:00 - 18:00', 'https://images.unsplash.com/photo-1580809361436-42a7ec204889?w=400&h=300&fit=crop', 'Gedung pertunjukan seni tertua di Jakarta'),
('Galeri Nasional Indonesia', 'budaya-seni', -6.1758, 106.8231, 'Stasiun MRT Senayan', 'MRT', 5.00, '09:00 - 16:00', 'https://images.unsplash.com/photo-1577083552431-6e5fd01988ec?w=400&h=300&fit=crop', 'Galeri seni rupa modern dan kontemporer Indonesia'),
('Balai Budaya', 'budaya-seni', -6.1850, 106.8300, 'Stasiun MRT Senayan', 'MRT', 4.00, '09:00 - 17:00', 'https://images.unsplash.com/photo-1577083165633-14ebcdb0f658?w=400&h=300&fit=crop', 'Tempat pertunjukan dan pameran seni budaya');

-- Wisata Religi
INSERT INTO destinations (name, category, lat, lng, nearest_station, station_type, distance_from_station, opening_hours, image, description) VALUES
('Masjid Istiqlal', 'religi', -6.1702, 106.8297, 'Stasiun MRT Senayan', 'MRT', 5.50, '04:00 - 21:00', 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=400&h=300&fit=crop', 'Masjid terbesar di Asia Tenggara'),
('Gereja Katedral Jakarta', 'religi', -6.1695, 106.8316, 'Stasiun MRT Senayan', 'MRT', 5.60, '06:00 - 18:00', 'https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=400&h=300&fit=crop', 'Gereja Katedral bersejarah di Jakarta Pusat'),
('Masjid Sunda Kelapa', 'religi', -6.1400, 106.8100, 'Stasiun MRT Senayan', 'MRT', 3.50, '04:00 - 21:00', 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=400&h=300&fit=crop', 'Masjid bersejarah di kawasan Sunda Kelapa'),
('Vihara Bahtera Bhakti', 'religi', -6.1390, 106.8115, 'Stasiun MRT Senayan', 'MRT', 9.20, '06:00 - 18:00', 'https://images.unsplash.com/photo-1548625149-2f8c8f4e8f3f?w=400&h=300&fit=crop', 'Vihara dengan arsitektur tradisional Tiongkok');

-- Wisata Alam & Ruang Terbuka
INSERT INTO destinations (name, category, lat, lng, nearest_station, station_type, distance_from_station, opening_hours, image, description) VALUES
('Gelora Bung Karno (GBK)', 'alam-ruang-terbuka', -6.2188, 106.8024, 'Stasiun MRT Senayan', 'MRT', 0.30, '05:00 - 21:00', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=300&fit=crop', 'Kompleks olahraga terbesar di Indonesia'),
('Hutan Kota GBK', 'alam-ruang-terbuka', -6.2195, 106.8030, 'Stasiun MRT Senayan', 'MRT', 0.40, '05:00 - 18:00', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop', 'Hutan kota untuk jogging dan bersantai'),
('Tebet Eco Park', 'alam-ruang-terbuka', -6.2350, 106.8500, 'Stasiun MRT Senayan', 'MRT', 4.50, '06:00 - 22:00', 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&h=300&fit=crop', 'Taman kota dengan fasilitas olahraga dan rekreasi'),
('Taman Lapangan Banteng', 'alam-ruang-terbuka', -6.1681, 106.8344, 'Stasiun MRT Senayan', 'MRT', 5.50, '06:00 - 18:00', 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=400&h=300&fit=crop', 'Taman bersejarah di Jakarta Pusat');

-- Wisata Keluarga & Rekreasi
INSERT INTO destinations (name, category, lat, lng, nearest_station, station_type, distance_from_station, opening_hours, image, description) VALUES
('Ancol Dreamland', 'keluarga-rekreasi', -6.1239, 106.8456, 'Stasiun MRT Senayan', 'MRT', 10.00, '06:00 - 18:00', 'https://images.unsplash.com/photo-1594818379496-da1e345b0ded?w=400&h=300&fit=crop', 'Taman rekreasi terpadu terbesar di Indonesia'),
('Dunia Fantasi (Dufan)', 'keluarga-rekreasi', -6.1247, 106.8341, 'Stasiun MRT Senayan', 'MRT', 11.00, '10:00 - 18:00', 'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=400&h=300&fit=crop', 'Taman hiburan dengan berbagai wahana seru'),
('SeaWorld Ancol', 'keluarga-rekreasi', -6.1253, 106.8378, 'Stasiun MRT Senayan', 'MRT', 11.00, '09:00 - 18:00', 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop', 'Akuarium raksasa dengan berbagai biota laut'),
('Jakarta Aquarium', 'keluarga-rekreasi', -6.2000, 106.7900, 'Stasiun MRT Senayan', 'MRT', 5.00, '10:00 - 20:00', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop', 'Akuarium modern di Neo Soho Mall');

-- Wisata Edukasi
INSERT INTO destinations (name, category, lat, lng, nearest_station, station_type, distance_from_station, opening_hours, image, description) VALUES
('Taman Mini Indonesia Indah (TMII)', 'edukasi', -6.3126, 106.8199, 'Stasiun MRT Senayan', 'MRT', 18.00, '07:00 - 17:00', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop', 'Miniatur kebudayaan Indonesia dari berbagai provinsi'),
('Planetarium Jakarta', 'edukasi', -6.1900, 106.8350, 'Stasiun MRT Senayan', 'MRT', 4.80, '08:00 - 16:00', 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=300&fit=crop', 'Planetarium untuk belajar tentang astronomi'),
('KidZania Jakarta', 'edukasi', -6.2100, 106.7950, 'Stasiun MRT Senayan', 'MRT', 3.00, '09:00 - 18:00', 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=300&fit=crop', 'Kota mini untuk anak-anak belajar berbagai profesi'),
('Perpustakaan Nasional RI', 'edukasi', -6.1850, 106.8400, 'Stasiun MRT Senayan', 'MRT', 4.60, '08:00 - 20:00', 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&h=300&fit=crop', 'Perpustakaan nasional dengan koleksi buku terlengkap');
