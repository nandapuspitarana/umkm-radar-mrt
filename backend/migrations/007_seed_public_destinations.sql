-- ==================== SEED PUBLIC SPACE DESTINATIONS ====================
-- Add public space destinations for /publik page

-- Delete existing public destinations if any
DELETE FROM destinations WHERE category IN ('ruang-terbuka-olahraga', 'mall-plaza', 'infrastruktur-transit', 'sosial-keagamaan');

-- RUANG TERBUKA DAN OLAHRAGA
INSERT INTO destinations (name, description, lat, lng, category, subcategory, address, image, nearest_station, station_type, distance_from_station, walking_time_minutes, opening_hours, ticket_price) VALUES

('Plaza Outdoor FX Sudirman', 
 'Area outdoor plaza dengan ruang terbuka hijau di kompleks FX Sudirman. Cocok untuk bersantai dan meeting outdoor.',
 -6.2253, 106.8026,
 'ruang-terbuka-olahraga', 'Plaza Outdoor',
 'FX Sudirman, Jl. Jenderal Sudirman, Jakarta Selatan',
 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=600&h=400&fit=crop',
 'Stasiun MRT ASEAN', 'MRT',
 0.3, 4,
 '24 Jam',
 'Gratis'
),

('Taman & Pedestrian GBK',
 'Area taman dan jalur pedestrian di kompleks Gelora Bung Karno. Tempat favorit untuk jogging dan olahraga outdoor.',
 -6.2188, 106.8024,
 'ruang-terbuka-olahraga', 'Taman',
 'Gelora Bung Karno, Senayan, Jakarta Pusat',
 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=400&fit=crop',
 'Stasiun MRT Senayan', 'MRT',
 0.3, 4,
 '05:00 - 22:00',
 'Gratis'
),

('GBK (Gelora Bung Karno)',
 'Kompleks olahraga terbesar di Indonesia dengan stadion utama berkapasitas 78.000 penonton.',
 -6.2188, 106.8024,
 'ruang-terbuka-olahraga', 'Kompleks Olahraga',
 'Jl. Pintu Satu Senayan, Jakarta Pusat',
 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&h=400&fit=crop',
 'Stasiun MRT Senayan', 'MRT',
 0.4, 5,
 '05:00 - 22:00',
 'Gratis (area luar)'
);

-- MALL & PLAZA TERBUKA
INSERT INTO destinations (name, description, lat, lng, category, subcategory, address, image, nearest_station, station_type, distance_from_station, walking_time_minutes, opening_hours, ticket_price) VALUES

('Plaza Senayan (Area Luar & Plaza Depan)',
 'Area outdoor Plaza Senayan dengan plaza depan yang luas. Sering digunakan untuk event dan gathering.',
 -6.2260, 106.7990,
 'mall-plaza', 'Plaza Outdoor',
 'Jl. Asia Afrika, Senayan, Jakarta Pusat',
 'https://images.unsplash.com/photo-1567449303078-57ad995bd329?w=600&h=400&fit=crop',
 'Stasiun MRT Senayan', 'MRT',
 0.7, 9,
 '10:00 - 22:00',
 'Gratis'
),

('Senayan City (Plaza Outdoor)',
 'Plaza outdoor di kompleks Senayan City dengan area terbuka dan taman.',
 -6.2259, 106.7997,
 'mall-plaza', 'Plaza Outdoor',
 'Jl. Asia Afrika Lot 19, Senayan, Jakarta Pusat',
 'https://images.unsplash.com/photo-1519567241046-7f570f5c0b9a?w=600&h=400&fit=crop',
 'Stasiun MRT Senayan', 'MRT',
 0.9, 12,
 '10:00 - 22:00',
 'Gratis'
),

('SPARK (Senayan Park)',
 'Taman outdoor modern di area Senayan dengan fasilitas olahraga dan ruang terbuka.',
 -6.2250, 106.8000,
 'mall-plaza', 'Taman',
 'Senayan, Jakarta Pusat',
 'https://images.unsplash.com/photo-1516475429286-465d815a0df7?w=600&h=400&fit=crop',
 'Stasiun MRT Senayan', 'MRT',
 1.0, 13,
 '24 Jam',
 'Gratis'
);

-- INFRASTRUKTUR PEJALAN & TRANSIT
INSERT INTO destinations (name, description, lat, lng, category, subcategory, address, image, nearest_station, station_type, distance_from_station, walking_time_minutes, opening_hours, ticket_price) VALUES

('JPO & Akses Pejalan MRT-FX',
 'Jembatan penyeberangan orang (JPO) dan akses pedestrian yang menghubungkan MRT dengan FX Sudirman.',
 -6.2253, 106.8030,
 'infrastruktur-transit', 'JPO',
 'Jl. Jenderal Sudirman, Jakarta Selatan',
 'https://images.unsplash.com/photo-1555217851-6141535b3d5a?w=600&h=400&fit=crop',
 'Stasiun MRT ASEAN', 'MRT',
 0.1, 1,
 '24 Jam',
 'Gratis'
),

('Koridor Pejalan Kaki FX-GBK-Sudirman',
 'Jalur pedestrian yang menghubungkan area FX, GBK, dan Jalan Sudirman dengan akses ramah pejalan kaki.',
 -6.2220, 106.8020,
 'infrastruktur-transit', 'Pedestrian',
 'Jl. Jenderal Sudirman - Senayan, Jakarta',
 'https://images.unsplash.com/photo-1518709594023-6eab9bab7b23?w=600&h=400&fit=crop',
 'Stasiun MRT ASEAN', 'MRT',
 0.2, 3,
 '24 Jam',
 'Gratis'
),

('Pedestrian Sudirman (Arah SCBD)',
 'Jalur pedestrian modern di Jalan Sudirman menuju arah SCBD dengan fasilitas lengkap.',
 -6.2280, 106.8050,
 'infrastruktur-transit', 'Pedestrian',
 'Jl. Jenderal Sudirman, Jakarta Selatan',
 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=600&h=400&fit=crop',
 'Stasiun MRT ASEAN', 'MRT',
 0.3, 4,
 '24 Jam',
 'Gratis'
);

-- FASILITAS SOSIAL & KEAGAMAAN
INSERT INTO destinations (name, description, lat, lng, category, subcategory, address, image, nearest_station, station_type, distance_from_station, walking_time_minutes, opening_hours, ticket_price) VALUES

('Masjid Al-Bina Senayan (GBK)',
 'Masjid di kompleks Gelora Bung Karno yang melayani jamaah di area Senayan.',
 -6.2190, 106.8020,
 'sosial-keagamaan', 'Masjid',
 'Kompleks GBK, Senayan, Jakarta Pusat',
 'https://images.unsplash.com/photo-1564769625688-5f043d6b1bc3?w=600&h=400&fit=crop',
 'Stasiun MRT Senayan', 'MRT',
 0.7, 9,
 '04:00 - 22:00',
 'Gratis'
),

('Musholla FX Sudirman',
 'Musholla di kompleks FX Sudirman yang nyaman dan bersih.',
 -6.2253, 106.8026,
 'sosial-keagamaan', 'Musholla',
 'FX Sudirman, Jakarta Selatan',
 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=600&h=400&fit=crop',
 'Stasiun MRT ASEAN', 'MRT',
 0.3, 4,
 '24 Jam',
 'Gratis'
);

-- Summary
SELECT 
    category,
    COUNT(*) as total
FROM destinations
WHERE category IN ('ruang-terbuka-olahraga', 'mall-plaza', 'infrastruktur-transit', 'sosial-keagamaan')
GROUP BY category
ORDER BY category;
