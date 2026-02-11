-- Add logo settings
INSERT INTO settings (key, value) VALUES
('app_logo', '{"url": "", "alt": "MRT Logo"}'),
('app_logo_text', '{"text": "M", "show": true}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
