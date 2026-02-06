-- Migration: Add categories table
-- Created: 2026-02-06

CREATE TABLE IF NOT EXISTS categories (
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

-- Insert default categories
INSERT INTO categories (name, slug, icon, color, description, is_active, sort_order) VALUES
('Rekomen', 'rekomen', '⭐', '#0969da', 'Rekomendasi pilihan terbaik', true, 0),
('Publik', 'publik', '🏛️', '#6366f1', 'Fasilitas publik', true, 1),
('Kuliner', 'kuliner', '🍽️', '#f59e0b', 'Makanan dan minuman', true, 2),
('Ngopi', 'ngopi', '☕', '#8b5cf6', 'Kopi dan cafe', true, 3),
('Wisata', 'wisata', '🎭', '#ec4899', 'Tempat wisata', true, 4),
('ATM & Belanja', 'atm-belanja', '🏪', '#10b981', 'ATM, minimarket, dan belanja', true, 5)
ON CONFLICT (slug) DO NOTHING;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories(sort_order);
