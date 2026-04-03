import { Hono } from 'hono';
import { pool, db, redis, esClient, isProd, CACHE_CONTROL_LONG, CACHE_CONTROL_LONG_IMMUTABLE, CACHE_CONTROL_SHORT, ES_VENDORS_INDEX, writeAuditLog, indexVendors, getCategorySlug, flushVendorCache, flushDestinationsCache } from '../index';
import { vendors, products, orders, settings, users, vouchers, assets, categories, navigationItems, destinations, destinationCategories, destinationSubcategories } from '../db/schema';
import { eq, desc, and, sql, ilike, inArray, isNull, gte, lte } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { PUBLIC_ASSET_URL, BUCKET_NAME, uploadToMinIO, deleteFromMinIO } from '../storage';

const router = new Hono();

router.post('/api/login', async (c) => {
    try {
        const { email, password, role } = await c.req.json();

        // 1. Check Email
        const usersFound = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (usersFound.length === 0) {
            return c.json({ error: 'Email tidak terdaftar.' }, 401);
        }

        const user = usersFound[0];

        // 2. Check Password
        if (user.password !== password) {
            return c.json({ error: 'Password salah.' }, 401);
        }

        // 3. Check Role
        if (user.role !== role) {
            const roleName = role === 'admin' ? 'Admin' : 'Mitra Penjual';
            return c.json({ error: `Akun ini tidak memiliki akses sebagai ${roleName}.` }, 403);
        }

        // Return user info (fetch is_super_admin via raw query since schema may not include it yet)
        const fullUser = await pool.query('SELECT * FROM users WHERE id = $1', [user.id]);
        const u = fullUser.rows[0];
        return c.json({
            id: u.id,
            email: u.email,
            role: u.role,
            vendorId: u.vendor_id,
            name: u.name,
            isSuperAdmin: u.is_super_admin === true,
            token: 'mock-jwt-token'
        });
    } catch (error) {
        console.error("Login server error:", error);
        return c.json({ error: 'Terjadi kesalahan pada server.' }, 500);
    }
});

router.get('/api/users', async (c) => {
    try {
        const result = await pool.query(`
            SELECT u.id, u.name, u.email, u.role, u.vendor_id,
                   u.is_active, u.created_at, u.updated_at, u.last_login_at, u.notes,
                   v.name as vendor_name
            FROM users u
            LEFT JOIN vendors v ON v.id = u.vendor_id
            ORDER BY u.role, u.name
        `);
        // Strip passwords
        return c.json(result.rows.map(r => ({ ...r, password: undefined })));
    } catch (error) {
        return c.json({ error: 'Failed to fetch users' }, 500);
    }
});

router.get('/api/users/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const result = await pool.query(
            `SELECT u.id, u.name, u.email, u.role, u.vendor_id, u.is_active,
                    u.created_at, u.updated_at, u.last_login_at, u.notes,
                    v.name as vendor_name
             FROM users u LEFT JOIN vendors v ON v.id = u.vendor_id
             WHERE u.id = $1`,
            [parseInt(id)]
        );
        if (result.rows.length === 0) return c.json({ error: 'User not found' }, 404);
        return c.json({ ...result.rows[0], password: undefined });
    } catch (error) {
        return c.json({ error: 'Failed to fetch user' }, 500);
    }
});

router.post('/api/users', async (c) => {
    try {
        const body = await c.req.json();
        const { name, email, password, role, vendorId, notes } = body;
        if (!name || !email || !password || !role) {
            return c.json({ error: 'name, email, password, dan role wajib diisi' }, 400);
        }

        const result = await pool.query(
            `INSERT INTO users (name, email, password, role, vendor_id, notes, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW()) RETURNING *`,
            [name, email, password, role, vendorId || null, notes || null]
        );
        const created = result.rows[0];

        await writeAuditLog({
            entity: 'user', entityId: created.id, entityName: created.name,
            action: 'CREATE',
            actorName: c.req.header('X-Actor-Name') || 'Admin',
            newData: { ...created, password: '***' },
            ip: c.req.header('X-Forwarded-For') || '',
        });

        return c.json({ ...created, password: undefined }, 201);
    } catch (error: any) {
        if (error.code === '23505') return c.json({ error: 'Email sudah dipakai' }, 409);
        return c.json({ error: 'Failed to create user' }, 500);
    }
});

router.put('/api/users/:id', async (c) => {
    const id = c.req.param('id');
    try {
        // Get old data for audit
        const oldResult = await pool.query('SELECT * FROM users WHERE id = $1', [parseInt(id)]);
        if (oldResult.rows.length === 0) return c.json({ error: 'User not found' }, 404);
        const oldData = { ...oldResult.rows[0], password: '***' };

        const body = await c.req.json();
        const updates: string[] = [];
        const vals: any[] = [];
        let idx = 1;

        const allowed: Record<string, string> = {
            name: 'name', email: 'email', role: 'role',
            vendorId: 'vendor_id', isActive: 'is_active', notes: 'notes',
        };
        // Only super admin can change isSuperAdmin flag
        const actorIsSuperAdmin = c.req.header('X-Is-Super-Admin') === 'true';
        if (actorIsSuperAdmin && 'isSuperAdmin' in body) {
            allowed['isSuperAdmin'] = 'is_super_admin';
        }
        for (const [jsKey, dbCol] of Object.entries(allowed)) {
            if (jsKey in body && body[jsKey] !== undefined) {
                updates.push(`${dbCol} = $${idx++}`);
                vals.push(body[jsKey]);
            }
        }
        // Password change (plain, not hashed – matches current system)
        if (body.password) {
            updates.push(`password = $${idx++}`);
            vals.push(body.password);
        }
        updates.push(`updated_at = NOW()`);
        vals.push(parseInt(id));

        const result = await pool.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
            vals
        );
        const updated = { ...result.rows[0], password: '***' };

        await writeAuditLog({
            entity: 'user', entityId: parseInt(id), entityName: updated.name,
            action: 'UPDATE',
            actorName: c.req.header('X-Actor-Name') || 'Admin',
            oldData, newData: updated,
            ip: c.req.header('X-Forwarded-For') || '',
        });

        return c.json({ ...result.rows[0], password: undefined });
    } catch (error: any) {
        if (error.code === '23505') return c.json({ error: 'Email sudah dipakai' }, 409);
        return c.json({ error: 'Failed to update user' }, 500);
    }
});

router.delete('/api/users/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const oldResult = await pool.query('SELECT * FROM users WHERE id = $1', [parseInt(id)]);
        if (oldResult.rows.length === 0) return c.json({ error: 'User not found' }, 404);
        const oldData = { ...oldResult.rows[0], password: '***' };

        await pool.query('DELETE FROM users WHERE id = $1', [parseInt(id)]);

        await writeAuditLog({
            entity: 'user', entityId: parseInt(id), entityName: oldData.name,
            action: 'DELETE',
            actorName: c.req.header('X-Actor-Name') || 'Admin',
            oldData,
            ip: c.req.header('X-Forwarded-For') || '',
        });

        return c.json({ success: true });
    } catch (error) {
        return c.json({ error: 'Failed to delete user' }, 500);
    }
});

router.patch('/api/users/:id/toggle-active', async (c) => {
    const id = c.req.param('id');
    try {
        const result = await pool.query(
            `UPDATE users SET is_active = NOT is_active, updated_at = NOW()
             WHERE id = $1 RETURNING id, name, is_active`,
            [parseInt(id)]
        );
        if (result.rows.length === 0) return c.json({ error: 'User not found' }, 404);
        const u = result.rows[0];

        await writeAuditLog({
            entity: 'user', entityId: parseInt(id), entityName: u.name,
            action: 'UPDATE',
            actorName: c.req.header('X-Actor-Name') || 'Admin',
            changes: { is_active: { from: !u.is_active, to: u.is_active } },
        });

        return c.json(u);
    } catch (error) {
        return c.json({ error: 'Failed to toggle user status' }, 500);
    }
});

router.patch('/api/users/:id/reset-password', async (c) => {
    const id = c.req.param('id');
    try {
        // Guard: only super admin can reset passwords
        const actorIsSuperAdmin = c.req.header('X-Is-Super-Admin') === 'true';
        if (!actorIsSuperAdmin) {
            return c.json({ error: 'Akses ditolak. Hanya Super Admin yang dapat mereset password.' }, 403);
        }

        const { newPassword } = await c.req.json();
        if (!newPassword) return c.json({ error: 'newPassword required' }, 400);

        const result = await pool.query(
            `UPDATE users SET password = $1, updated_at = NOW()
             WHERE id = $2 RETURNING id, name`,
            [newPassword, parseInt(id)]
        );
        if (result.rows.length === 0) return c.json({ error: 'User not found' }, 404);

        await writeAuditLog({
            entity: 'user', entityId: parseInt(id), entityName: result.rows[0].name,
            action: 'UPDATE',
            actorName: c.req.header('X-Actor-Name') || 'Admin',
            changes: { password: { from: '***', to: '***reset-by-superadmin***' } },
        });

        return c.json({ success: true, message: 'Password berhasil direset' });
    } catch (error) {
        return c.json({ error: 'Failed to reset password' }, 500);
    }
});

export default router;
