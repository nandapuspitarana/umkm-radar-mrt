-- Migration: Seed default navigation items
-- Created: 2026-02-06

-- Insert default header navigation
INSERT INTO navigation_items (label, path, icon, position, sort_order, is_visible, is_external, requires_auth) VALUES
('Beranda', '/', '🏠', 'header', 0, true, false, false),
('Kuliner', '/kuliner', '🍽️', 'header', 1, true, false, false),
('Ngopi', '/ngopi', '☕', 'header', 2, true, false, false),
('Wisata', '/wisata', '🎭', 'header', 3, true, false, false),
('ATM & Belanja', '/atm-belanja', '🏪', 'header', 4, true, false, false)
ON CONFLICT DO NOTHING;

-- Insert default footer navigation
INSERT INTO navigation_items (label, path, icon, position, sort_order, is_visible, is_external, requires_auth) VALUES
('Tentang Kami', '/about', NULL, 'footer', 0, true, false, false),
('Kontak', '/contact', NULL, 'footer', 1, true, false, false),
('Kebijakan Privasi', '/privacy', NULL, 'footer', 2, true, false, false),
('Syarat & Ketentuan', '/terms', NULL, 'footer', 3, true, false, false)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_navigation_position ON navigation_items(position);
CREATE INDEX IF NOT EXISTS idx_navigation_visible ON navigation_items(is_visible);
CREATE INDEX IF NOT EXISTS idx_navigation_sort ON navigation_items(sort_order);
CREATE INDEX IF NOT EXISTS idx_navigation_parent ON navigation_items(parent_id);

-- Verify seeding
SELECT 
    position,
    COUNT(*) as total_items,
    COUNT(CASE WHEN is_visible THEN 1 END) as visible_items
FROM navigation_items
GROUP BY position
ORDER BY position;
