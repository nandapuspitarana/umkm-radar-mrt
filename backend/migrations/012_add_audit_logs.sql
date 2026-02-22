-- ==================== MIGRATION: AUDIT LOGS & USER TIMESTAMPS ====================

-- 1. Tambah kolom timestamps ke users table
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Buat tabel audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id          BIGSERIAL PRIMARY KEY,
    entity      TEXT NOT NULL,              -- 'user' | 'vendor' | 'destination'
    entity_id   INTEGER NOT NULL,           -- ID record yang diubah
    entity_name TEXT,                       -- Nama record (denormalized for readability)
    action      TEXT NOT NULL,              -- 'CREATE' | 'UPDATE' | 'DELETE'
    actor_id    INTEGER,                    -- User yang melakukan aksi (null = system)
    actor_name  TEXT,                       -- Nama admin/user yang melakukan
    actor_role  TEXT,                       -- Role aktor
    changes     JSONB,                      -- { field: { from, to } }
    old_data    JSONB,                      -- Snapshot data sebelum diubah
    new_data    JSONB,                      -- Snapshot data sesudah diubah
    ip_address  TEXT,
    user_agent  TEXT,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);

-- 3. Log semua user yang sudah ada sebagai initial seed
INSERT INTO audit_logs (entity, entity_id, entity_name, action, actor_name, actor_role, changes, created_at)
SELECT 'user', id, name, 'CREATE', 'System Migration', 'system',
       jsonb_build_object('note', 'existing user migrated'),
       NOW()
FROM users;

SELECT 'audit_logs created' as info, COUNT(*) as seed_logs FROM audit_logs;
