-- ==================== DESTINATIONS TABLE ====================
-- Table for tourist destinations with transport navigation info

CREATE TABLE IF NOT EXISTS destinations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    lat DECIMAL(10, 7) NOT NULL,
    lng DECIMAL(10, 7) NOT NULL,
    category VARCHAR(100) NOT NULL, -- e.g., 'Wisata Alam', 'Wisata Budaya', 'Wisata Sejarah', 'Wisata Religi'
    subcategory VARCHAR(100), -- more specific category
    address TEXT,
    image VARCHAR(500),
    
    -- Transport navigation fields
    nearest_station VARCHAR(255) NOT NULL, -- e.g., 'Stasiun Sudirman', 'Stasiun Dukuh Atas'
    station_type VARCHAR(50) NOT NULL, -- 'MRT', 'KRL', 'LRT', 'TransJakarta'
    distance_from_station DECIMAL(5, 2), -- in kilometers
    walking_time_minutes INT, -- estimated walking time from station
    
    -- Additional info
    opening_hours VARCHAR(100),
    ticket_price VARCHAR(100),
    contact VARCHAR(100),
    website VARCHAR(255),
    
    -- Transit hints for different origin stations
    transit_hints JSONB, -- e.g., {"from_bekasi": "Naik KRL ke Sudirman", "from_bogor": "Transit di Manggarai, lalu ke Sudirman"}
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_destinations_category ON destinations(category);
CREATE INDEX IF NOT EXISTS idx_destinations_nearest_station ON destinations(nearest_station);
CREATE INDEX IF NOT EXISTS idx_destinations_station_type ON destinations(station_type);
CREATE INDEX IF NOT EXISTS idx_destinations_active ON destinations(is_active);

-- ==================== SEED DESTINATIONS ====================
-- Skip if destinations already exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM destinations LIMIT 1) THEN
        RAISE NOTICE 'Destinations already seeded, skipping...';
        RETURN;
    END IF;

    -- WISATA SEJARAH & MUSEUM
    INSERT INTO destinations (name, description, lat, lng, category, subcategory, address, image, nearest_station, station_type, distance_from_station, walking_time_minutes, opening_hours, ticket_price, transit_hints) VALUES
    
    ('Monumen Nasional (Monas)', 
     'Tugu peringatan setinggi 132 meter yang menjadi ikon Jakarta. Dibangun untuk mengenang perjuangan kemerdekaan Indonesia. Di puncak terdapat api emas berlapis emas 24 karat.',
     -6.1754, 106.8272, 
     'Wisata Sejarah', 'Monumen',
     'Jl. Silang Monas, Gambir, Jakarta Pusat',
     'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=600',
     'Stasiun Gambir', 'KRL',
     1.2, 15,
     '08:00 - 16:00 (Selasa-Minggu)',
     'Rp 20.000 (Dewasa), Rp 10.000 (Anak)',
     '{"from_bekasi": "Naik KRL Commuter Line ke Stasiun Gambir langsung", "from_bogor": "Naik KRL ke Manggarai, lanjut ke Gambir", "from_tangerang": "Naik KRL ke Tanah Abang, lanjut ke Gambir", "from_depok": "Naik KRL ke Manggarai, lanjut ke Gambir"}'
    ),
    
    ('Museum Nasional Indonesia (Museum Gajah)',
     'Museum tertua dan terlengkap di Indonesia dengan koleksi lebih dari 140.000 artefak prasejarah, arkeologi, etnografi, numismatik, dan geografi.',
     -6.1762, 106.8224,
     'Wisata Sejarah', 'Museum',
     'Jl. Medan Merdeka Barat No. 12, Jakarta Pusat',
     'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=600',
     'Stasiun Gambir', 'KRL',
     1.5, 20,
     '08:00 - 16:00 (Selasa-Minggu)',
     'Rp 15.000 (Dewasa), Rp 7.500 (Anak)',
     '{"from_bekasi": "Naik KRL ke Stasiun Gambir", "from_bogor": "Naik KRL ke Manggarai, transit ke Gambir", "from_tangerang": "Naik KRL ke Tanah Abang, lanjut ke Gambir"}'
    ),
    
    ('Museum Fatahillah (Museum Sejarah Jakarta)',
     'Museum yang menampilkan sejarah Jakarta dari zaman prasejarah hingga berdirinya Batavia. Terletak di kawasan Kota Tua yang bersejarah.',
     -6.1345, 106.8133,
     'Wisata Sejarah', 'Museum',
     'Jl. Taman Fatahillah No. 1, Kota Tua, Jakarta Barat',
     'https://images.unsplash.com/photo-1555217851-6141535b3d5a?w=600',
     'Stasiun Jakarta Kota', 'KRL',
     0.5, 7,
     '09:00 - 15:00 (Selasa-Minggu)',
     'Rp 5.000',
     '{"from_bekasi": "Naik KRL ke Jakarta Kota langsung", "from_bogor": "Naik KRL ke Manggarai, lanjut ke Jakarta Kota", "from_tangerang": "Naik KRL ke Duri, lanjut ke Jakarta Kota"}'
    ),
    
    ('Museum Wayang',
     'Museum yang menyimpan koleksi wayang dari berbagai daerah di Indonesia dan mancanegara. Terdapat lebih dari 6.000 koleksi wayang.',
     -6.1343, 106.8128,
     'Wisata Sejarah', 'Museum',
     'Jl. Pintu Besar Utara No. 27, Kota Tua, Jakarta Barat',
     'https://images.unsplash.com/photo-1518709594023-6eab9bab7b23?w=600',
     'Stasiun Jakarta Kota', 'KRL',
     0.4, 5,
     '09:00 - 15:00 (Selasa-Minggu)',
     'Rp 5.000',
     '{"from_bekasi": "Naik KRL ke Jakarta Kota", "from_bogor": "Naik KRL ke Manggarai, transit ke Jakarta Kota"}'
    ),

    -- WISATA BUDAYA & SENI
    ('Taman Ismail Marzuki (TIM)',
     'Pusat kesenian Jakarta yang menjadi rumah bagi berbagai pertunjukan seni, teater, dan pameran. Dinamai dari komponis lagu Rayuan Pulau Kelapa.',
     -6.1891, 106.8386,
     'Wisata Budaya', 'Pusat Seni',
     'Jl. Cikini Raya No. 73, Menteng, Jakarta Pusat',
     'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=600',
     'Stasiun Cikini', 'KRL',
     0.3, 5,
     '09:00 - 21:00',
     'Gratis (tergantung acara)',
     '{"from_bekasi": "Naik KRL ke Cikini langsung", "from_bogor": "Naik KRL ke Manggarai, lanjut ke Cikini", "from_tangerang": "Naik KRL ke Tanah Abang, lanjut ke Cikini"}'
    ),
    
    ('Gedung Kesenian Jakarta',
     'Gedung pertunjukan bersejarah bergaya neoklasik yang dibangun tahun 1821. Menjadi venue utama untuk pertunjukan teater, musik klasik, dan tari.',
     -6.1669, 106.8305,
     'Wisata Budaya', 'Gedung Pertunjukan',
     'Jl. Gedung Kesenian No. 1, Pasar Baru, Jakarta Pusat',
     'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=600',
     'Stasiun Juanda', 'KRL',
     0.6, 8,
     'Sesuai jadwal pertunjukan',
     'Tergantung acara',
     '{"from_bekasi": "Naik KRL ke Juanda", "from_bogor": "Naik KRL ke Manggarai, lanjut ke Juanda"}'
    ),
    
    ('Galeri Nasional Indonesia',
     'Museum seni rupa nasional dengan koleksi lebih dari 1.700 karya seni dari seniman Indonesia dan internasional.',
     -6.1758, 106.8231,
     'Wisata Budaya', 'Galeri Seni',
     'Jl. Medan Merdeka Timur No. 14, Jakarta Pusat',
     'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=600',
     'Stasiun Gambir', 'KRL',
     1.0, 12,
     '10:00 - 17:00 (Selasa-Minggu)',
     'Gratis',
     '{"from_bekasi": "Naik KRL ke Gambir", "from_bogor": "Naik KRL ke Manggarai, transit ke Gambir"}'
    ),

    -- WISATA RELIGI
    ('Masjid Istiqlal',
     'Masjid terbesar di Asia Tenggara dengan kapasitas 200.000 jamaah. Dirancang oleh arsitek Frederich Silaban dan diresmikan tahun 1978.',
     -6.1702, 106.8297,
     'Wisata Religi', 'Masjid',
     'Jl. Taman Wijaya Kusuma, Pasar Baru, Jakarta Pusat',
     'https://images.unsplash.com/photo-1564769625688-5f043d6b1bc3?w=600',
     'Stasiun Juanda', 'KRL',
     1.0, 12,
     '04:00 - 22:00',
     'Gratis',
     '{"from_bekasi": "Naik KRL ke Juanda, jalan 12 menit", "from_bogor": "Naik KRL ke Manggarai, lanjut ke Juanda", "from_tangerang": "Naik KRL ke Tanah Abang, lanjut ke Juanda"}'
    ),
    
    ('Gereja Katedral Jakarta',
     'Gereja Katolik bergaya neo-gothic yang dibangun tahun 1901. Berseberangan dengan Masjid Istiqlal, menjadi simbol toleransi beragama.',
     -6.1695, 106.8316,
     'Wisata Religi', 'Gereja',
     'Jl. Katedral No. 7B, Jakarta Pusat',
     'https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=600',
     'Stasiun Juanda', 'KRL',
     1.1, 14,
     '09:00 - 16:00',
     'Gratis',
     '{"from_bekasi": "Naik KRL ke Juanda", "from_bogor": "Naik KRL ke Manggarai, transit ke Juanda"}'
    ),
    
    ('Vihara Dharma Bhakti (Klenteng Jin De Yuan)',
     'Kelenteng tertua di Jakarta yang dibangun tahun 1650. Merupakan pusat peribadatan umat Buddha dan tempat wisata religi populer.',
     -6.1390, 106.8115,
     'Wisata Religi', 'Vihara',
     'Jl. Kemenangan III No. 13, Glodok, Jakarta Barat',
     'https://images.unsplash.com/photo-1545296664-39db56ad95bd?w=600',
     'Stasiun Jakarta Kota', 'KRL',
     1.0, 15,
     '07:00 - 17:00',
     'Gratis',
     '{"from_bekasi": "Naik KRL ke Jakarta Kota", "from_bogor": "Naik KRL ke Manggarai, lanjut ke Jakarta Kota"}'
    ),

    -- WISATA ALAM & RUANG TERBUKA
    ('Taman Lapangan Banteng',
     'Taman kota seluas 5,2 hektar dengan air mancur, jogging track, dan berbagai fasilitas olahraga. Terdapat Patung Pembebasan Irian Barat.',
     -6.1681, 106.8344,
     'Wisata Alam', 'Taman Kota',
     'Jl. Lapangan Banteng, Jakarta Pusat',
     'https://images.unsplash.com/photo-1516475429286-465d815a0df7?w=600',
     'Stasiun Juanda', 'KRL',
     0.8, 10,
     '05:00 - 22:00',
     'Gratis',
     '{"from_bekasi": "Naik KRL ke Juanda", "from_bogor": "Naik KRL ke Manggarai, lanjut ke Juanda"}'
    ),
    
    ('Taman Suropati',
     'Taman dengan patung-patung seni dari negara ASEAN. Tempat favorit untuk bersantai dan berolahraga di kawasan Menteng.',
     -6.1961, 106.8374,
     'Wisata Alam', 'Taman Kota',
     'Jl. Teuku Umar, Menteng, Jakarta Pusat',
     'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=600',
     'Stasiun Cikini', 'KRL',
     0.7, 10,
     '24 Jam',
     'Gratis',
     '{"from_bekasi": "Naik KRL ke Cikini", "from_bogor": "Naik KRL ke Manggarai, lanjut ke Cikini"}'
    ),
    
    ('Gelora Bung Karno (GBK)',
     'Kompleks olahraga terbesar di Indonesia dengan stadion utama berkapasitas 78.000 penonton. Tempat jogging dan olahraga favorit warga Jakarta.',
     -6.2188, 106.8024,
     'Wisata Alam', 'Kompleks Olahraga',
     'Jl. Pintu Satu Senayan, Jakarta Pusat',
     'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600',
     'Stasiun MRT Senayan', 'MRT',
     0.3, 5,
     '05:00 - 22:00',
     'Gratis (area luar)',
     '{"from_bekasi": "Naik KRL ke Sudirman, sambung MRT ke Senayan", "from_bogor": "Naik KRL ke Manggarai, ke Sudirman, sambung MRT ke Senayan", "from_tangerang": "Naik KRL ke Tanah Abang, ke Sudirman, sambung MRT"}'
    ),
    
    ('Pantai Ancol',
     'Kawasan wisata pantai terbesar di Jakarta dengan berbagai wahana rekreasi, pantai pasir putih, dan pemandangan laut.',
     -6.1239, 106.8456,
     'Wisata Alam', 'Pantai',
     'Jl. Lodan Timur No. 7, Ancol, Jakarta Utara',
     'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
     'Stasiun Ancol', 'KRL',
     2.0, 25,
     '24 Jam (wahana berbeda)',
     'Rp 25.000 (pintu gerbang)',
     '{"from_bekasi": "Naik KRL ke Kampung Bandan, lanjut ke Ancol", "from_bogor": "Naik KRL ke Manggarai, ke Jakarta Kota, lanjut ke Ancol"}'
    ),

    -- WISATA KELUARGA & REKREASI
    ('Dunia Fantasi (Dufan)',
     'Taman hiburan terbesar di Indonesia dengan berbagai wahana permainan seru untuk keluarga. Bagian dari kompleks Ancol.',
     -6.1247, 106.8341,
     'Wisata Keluarga', 'Taman Hiburan',
     'Taman Impian Jaya Ancol, Jakarta Utara',
     'https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?w=600',
     'Stasiun Ancol', 'KRL',
     2.5, 30,
     '10:00 - 20:00 (Weekday), 10:00 - 21:00 (Weekend)',
     'Rp 250.000 - Rp 400.000',
     '{"from_bekasi": "Naik KRL ke Kampung Bandan, lanjut ke Ancol", "from_bogor": "Naik KRL ke Jakarta Kota, lanjut ke Ancol"}'
    ),
    
    ('Sea World Ancol',
     'Akuarium raksasa dengan lebih dari 7.300 biota laut dari 48 spesies ikan air tawar dan laut. Cocok untuk edukasi anak.',
     -6.1253, 106.8378,
     'Wisata Keluarga', 'Akuarium',
     'Taman Impian Jaya Ancol, Jakarta Utara',
     'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600',
     'Stasiun Ancol', 'KRL',
     2.3, 28,
     '09:00 - 17:00',
     'Rp 110.000 - Rp 130.000',
     '{"from_bekasi": "Naik KRL ke Kampung Bandan, lanjut ke Ancol", "from_bogor": "Naik KRL ke Jakarta Kota, lanjut ke Ancol"}'
    ),
    
    ('Ragunan Zoo',
     'Kebun binatang seluas 140 hektar dengan lebih dari 2.000 spesies satwa. Tempat wisata keluarga favorit warga Jakarta.',
     -6.3126, 106.8199,
     'Wisata Keluarga', 'Kebun Binatang',
     'Jl. Harsono RM No. 1, Pasar Minggu, Jakarta Selatan',
     'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=600',
     'Stasiun Pasar Minggu', 'KRL',
     3.0, 40,
     '07:00 - 16:00',
     'Rp 4.000 (Dewasa), Rp 3.000 (Anak)',
     '{"from_bekasi": "Naik KRL ke Manggarai, lanjut ke Pasar Minggu", "from_bogor": "Naik KRL ke Pasar Minggu langsung", "from_tangerang": "Naik KRL ke Tanah Abang, ke Manggarai, ke Pasar Minggu"}'
    ),

    -- WISATA BELANJA & KULINER
    ('Pasar Baru',
     'Pasar tradisional tertua di Jakarta yang berdiri sejak 1820. Terkenal dengan kain, tekstil, dan kuliner legendaris.',
     -6.1643, 106.8345,
     'Wisata Belanja', 'Pasar Tradisional',
     'Jl. Pasar Baru, Sawah Besar, Jakarta Pusat',
     'https://images.unsplash.com/photo-1555529669-2269763671c0?w=600',
     'Stasiun Juanda', 'KRL',
     0.4, 5,
     '09:00 - 17:00',
     'Gratis',
     '{"from_bekasi": "Naik KRL ke Juanda langsung", "from_bogor": "Naik KRL ke Manggarai, lanjut ke Juanda"}'
    ),
    
    ('Grand Indonesia',
     'Mal premium dengan berbagai brand internasional, restoran, dan bioskop. Terhubung langsung dengan stasiun MRT Bundaran HI.',
     -6.1951, 106.8208,
     'Wisata Belanja', 'Mal',
     'Jl. M.H. Thamrin No. 1, Jakarta Pusat',
     'https://images.unsplash.com/photo-1519567241046-7f570f5c0b9a?w=600',
     'Stasiun MRT Bundaran HI', 'MRT',
     0.1, 2,
     '10:00 - 22:00',
     'Gratis',
     '{"from_bekasi": "Naik KRL ke Sudirman, sambung MRT ke Bundaran HI", "from_bogor": "Naik KRL ke Manggarai, ke Sudirman, sambung MRT", "from_tangerang": "Naik KRL ke Tanah Abang, ke Sudirman, sambung MRT"}'
    ),

    ('Plaza Indonesia',
     'Mal mewah dengan koleksi brand high-end dan restoran fine dining. Lokasi strategis di jantung Jakarta.',
     -6.1938, 106.8219,
     'Wisata Belanja', 'Mal',
     'Jl. M.H. Thamrin Kav. 28-30, Jakarta Pusat',
     'https://images.unsplash.com/photo-1567449303078-57ad995bd329?w=600',
     'Stasiun MRT Bundaran HI', 'MRT',
     0.2, 3,
     '10:00 - 22:00',
     'Gratis',
     '{"from_bekasi": "Naik KRL ke Sudirman, sambung MRT ke Bundaran HI", "from_bogor": "Naik KRL ke Manggarai, ke Sudirman, sambung MRT"}'
    );

END $$;

-- Summary
SELECT 
    category,
    COUNT(*) as total
FROM destinations
GROUP BY category
ORDER BY category;
