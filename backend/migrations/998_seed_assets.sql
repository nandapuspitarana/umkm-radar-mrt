-- ==================== ASSET SEEDER - NAVBAR & BANNER ====================
-- Seeder untuk asset dari Figma: Logo, Banner, Navigation Icons
-- Created: 2026-02-06

-- ==================== TRANSPORT MODE LOGOS ====================
-- Logo untuk transport links (Figma: logo moda)
INSERT INTO assets (filename, storage_path, mime_type, size, bucket, category, alt) VALUES
-- MRT Logo
('mrt-logo.svg', 'transport/mrt-logo.svg', 'image/svg+xml', 2048, 'assets', 'transport-logo', 'Logo MRT Jakarta'),
-- TiJe (Transjakarta Integrated) Logo
('tije-logo.svg', 'transport/tije-logo.svg', 'image/svg+xml', 2048, 'assets', 'transport-logo', 'Logo TiJe Transjakarta'),
-- LRT Logo
('lrt-logo.svg', 'transport/lrt-logo.svg', 'image/svg+xml', 2048, 'assets', 'transport-logo', 'Logo LRT Jakarta'),
-- KAI Commuter Logo
('kai-commuter-logo.svg', 'transport/kai-commuter-logo.svg', 'image/svg+xml', 3072, 'assets', 'transport-logo', 'Logo KAI Commuter'),
-- Whoosh Logo
('whoosh-logo.svg', 'transport/whoosh-logo.svg', 'image/svg+xml', 2560, 'assets', 'transport-logo', 'Logo Whoosh High Speed Rail'),
-- Jaklingko Logo
('jaklingko-logo.svg', 'transport/jaklingko-logo.svg', 'image/svg+xml', 2048, 'assets', 'transport-logo', 'Logo Jaklingko')
ON CONFLICT DO NOTHING;

-- ==================== HOMEPAGE BANNERS (STORY FORMAT) ====================
-- Banner untuk homepage story section (175x300px portrait - Figma spec)
INSERT INTO assets (filename, storage_path, mime_type, size, bucket, category, alt) VALUES
-- Kuliner Banners
('banner-kuliner-1.jpg', 'banners/kuliner-1.jpg', 'image/jpeg', 45000, 'assets', 'banner', 'Banner Kuliner - Nasi Uduk'),
('banner-kuliner-2.jpg', 'banners/kuliner-2.jpg', 'image/jpeg', 48000, 'assets', 'banner', 'Banner Kuliner - Soto Betawi'),
('banner-kuliner-3.jpg', 'banners/kuliner-3.jpg', 'image/jpeg', 46000, 'assets', 'banner', 'Banner Kuliner - Gado-gado'),

-- Ngopi Banners
('banner-ngopi-1.jpg', 'banners/ngopi-1.jpg', 'image/jpeg', 42000, 'assets', 'banner', 'Banner Ngopi - Kopi Susu'),
('banner-ngopi-2.jpg', 'banners/ngopi-2.jpg', 'image/jpeg', 44000, 'assets', 'banner', 'Banner Ngopi - Espresso'),
('banner-ngopi-3.jpg', 'banners/ngopi-3.jpg', 'image/jpeg', 43000, 'assets', 'banner', 'Banner Ngopi - Cold Brew'),

-- Promo Banners
('banner-promo-1.jpg', 'banners/promo-1.jpg', 'image/jpeg', 50000, 'assets', 'banner', 'Banner Promo - Diskon 20%'),
('banner-promo-2.jpg', 'banners/promo-2.jpg', 'image/jpeg', 52000, 'assets', 'banner', 'Banner Promo - Gratis Ongkir'),
('banner-promo-3.jpg', 'banners/promo-3.jpg', 'image/jpeg', 51000, 'assets', 'banner', 'Banner Promo - Cashback'),

-- Event Banners
('banner-event-1.jpg', 'banners/event-1.jpg', 'image/jpeg', 48000, 'assets', 'banner', 'Banner Event - Festival Kuliner'),
('banner-event-2.jpg', 'banners/event-2.jpg', 'image/jpeg', 49000, 'assets', 'banner', 'Banner Event - Bazar UMKM'),
('banner-event-3.jpg', 'banners/event-3.jpg', 'image/jpeg', 47000, 'assets', 'banner', 'Banner Event - Car Free Day')
ON CONFLICT DO NOTHING;

-- ==================== NAVIGATION ICONS ====================
-- Icon untuk navigation (Figma: icon navigantion)
INSERT INTO assets (filename, storage_path, mime_type, size, bucket, category, alt) VALUES
('icon-nav-back.svg', 'icons/nav-back.svg', 'image/svg+xml', 512, 'assets', 'icon', 'Icon Navigation Back'),
('icon-nav-close.svg', 'icons/nav-close.svg', 'image/svg+xml', 512, 'assets', 'icon', 'Icon Navigation Close'),
('icon-nav-search.svg', 'icons/nav-search.svg', 'image/svg+xml', 512, 'assets', 'icon', 'Icon Navigation Search'),
('icon-nav-power.svg', 'icons/nav-power.svg', 'image/svg+xml', 512, 'assets', 'icon', 'Icon Navigation Power/Logout'),
('icon-nav-chevron-down.svg', 'icons/nav-chevron-down.svg', 'image/svg+xml', 512, 'assets', 'icon', 'Icon Navigation Chevron Down'),
('icon-nav-chevron-right.svg', 'icons/nav-chevron-right.svg', 'image/svg+xml', 512, 'assets', 'icon', 'Icon Navigation Chevron Right'),
('icon-nav-check-on.svg', 'icons/nav-check-on.svg', 'image/svg+xml', 512, 'assets', 'icon', 'Icon Navigation Check On'),
('icon-nav-check-off.svg', 'icons/nav-check-off.svg', 'image/svg+xml', 512, 'assets', 'icon', 'Icon Navigation Check Off')
ON CONFLICT DO NOTHING;

-- ==================== CATEGORY ICONS ====================
-- Icon untuk kategori (Figma: master-icon)
INSERT INTO assets (filename, storage_path, mime_type, size, bucket, category, alt) VALUES
('icon-rekomen-off.svg', 'icons/rekomen-off.svg', 'image/svg+xml', 1024, 'assets', 'category-icon', 'Icon Rekomen Off'),
('icon-rekomen-on.svg', 'icons/rekomen-on.svg', 'image/svg+xml', 1024, 'assets', 'category-icon', 'Icon Rekomen On'),
('icon-publik-off.svg', 'icons/publik-off.svg', 'image/svg+xml', 1024, 'assets', 'category-icon', 'Icon Publik Off'),
('icon-publik-on.svg', 'icons/publik-on.svg', 'image/svg+xml', 1024, 'assets', 'category-icon', 'Icon Publik On'),
('icon-kuliner-off.svg', 'icons/kuliner-off.svg', 'image/svg+xml', 1024, 'assets', 'category-icon', 'Icon Kuliner Off'),
('icon-kuliner-on.svg', 'icons/kuliner-on.svg', 'image/svg+xml', 1024, 'assets', 'category-icon', 'Icon Kuliner On'),
('icon-ngopi-off.svg', 'icons/ngopi-off.svg', 'image/svg+xml', 1024, 'assets', 'category-icon', 'Icon Ngopi Off'),
('icon-ngopi-on.svg', 'icons/ngopi-on.svg', 'image/svg+xml', 1024, 'assets', 'category-icon', 'Icon Ngopi On'),
('icon-wisata-off.svg', 'icons/wisata-off.svg', 'image/svg+xml', 1024, 'assets', 'category-icon', 'Icon Wisata Off'),
('icon-wisata-on.svg', 'icons/wisata-on.svg', 'image/svg+xml', 1024, 'assets', 'category-icon', 'Icon Wisata On'),
('icon-atm-off.svg', 'icons/atm-off.svg', 'image/svg+xml', 1024, 'assets', 'category-icon', 'Icon ATM & Belanja Off'),
('icon-atm-on.svg', 'icons/atm-on.svg', 'image/svg+xml', 1024, 'assets', 'category-icon', 'Icon ATM & Belanja On')
ON CONFLICT DO NOTHING;

-- ==================== APP LOGO ====================
-- Logo aplikasi (Figma: master-icon/MRT)
INSERT INTO assets (filename, storage_path, mime_type, size, bucket, category, alt) VALUES
('app-logo.svg', 'branding/app-logo.svg', 'image/svg+xml', 2048, 'assets', 'logo', 'UMKM Radar MRT Logo'),
('app-logo-inline.svg', 'branding/app-logo-inline.svg', 'image/svg+xml', 3072, 'assets', 'logo', 'UMKM Radar MRT Logo Inline')
ON CONFLICT DO NOTHING;

-- ==================== UPDATE SETTINGS WITH ASSET REFERENCES ====================
-- Update settings untuk menggunakan asset yang baru dibuat

-- Transport Links dengan logo dari assets (Static Path)
INSERT INTO settings (key, value) VALUES
('transport_links', '{
  "links": [
    {
      "id": 1,
      "name": "TiJe",
      "logo": "/assets/transport/tije-logo.svg",
      "url": "https://transjakarta.co.id"
    },
    {
      "id": 2,
      "name": "LRT Jakarta",
      "logo": "/assets/transport/lrt-logo.svg",
      "url": "https://lrtjakarta.co.id"
    },
    {
      "id": 3,
      "name": "MRT Jakarta",
      "logo": "/assets/transport/mrt-logo.svg",
      "url": "https://jakartamrt.co.id"
    },
    {
      "id": 4,
      "name": "KAI Commuter",
      "logo": "/assets/transport/kai-commuter-logo.svg",
      "url": "https://krl.co.id"
    },
    {
      "id": 5,
      "name": "Whoosh",
      "logo": "/assets/transport/whoosh-logo.svg",
      "url": "https://whoosh.co.id"
    }
  ]
}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Homepage Banners dengan asset references (Unsplash for realism)
INSERT INTO settings (key, value) VALUES
('homepage_banners', '{
  "banners": [
    {
      "id": 1,
      "title": "Kuliner Nusantara",
      "subtitle": "Cita Rasa Tradisional",
      "image": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=600&fit=crop",
      "link": "/kuliner"
    },
    {
      "id": 2,
      "title": "Ngopi Santai",
      "subtitle": "Kopi Pilihan",
      "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=600&fit=crop",
      "link": "/ngopi"
    },
    {
      "id": 3,
      "title": "Promo Spesial",
      "subtitle": "Diskon 20%",
      "image": "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=600&fit=crop",
      "link": "/promo"
    },
    {
      "id": 4,
      "title": "Soto Betawi",
      "subtitle": "Legendaris",
      "image": "https://images.unsplash.com/photo-1547573854-74d2a71d0826?w=400&h=600&fit=crop",
      "link": "/kuliner"
    },
    {
      "id": 5,
      "title": "Espresso Premium",
      "subtitle": "Kopi Berkualitas",
      "image": "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&h=600&fit=crop",
      "link": "/ngopi"
    },
    {
      "id": 6,
      "title": "Festival Kuliner",
      "subtitle": "Akhir Pekan",
      "image": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=600&fit=crop",
      "link": "/events"
    }
  ]
}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- App Logo
INSERT INTO settings (key, value) VALUES
('app_logo', '{
  "logo": "/assets/branding/app-logo.svg",
  "logo_inline": "/assets/branding/app-logo-inline.svg"
}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ==================== SUMMARY ====================
SELECT 
    'Assets Created' as info,
    COUNT(*) as total
FROM assets
WHERE category IN ('transport-logo', 'banner', 'icon', 'category-icon', 'logo');
