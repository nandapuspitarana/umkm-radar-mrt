-- Remove Transport Links (User doesn't like the design)
-- This migration removes all transport links from settings

DELETE FROM settings WHERE key = 'transport_links';

-- Verify deletion
SELECT key, value FROM settings WHERE key = 'transport_links';
