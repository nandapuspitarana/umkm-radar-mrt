import { Hono } from 'hono';
import { pool, db, redis, esClient, isProd, CACHE_CONTROL_LONG, CACHE_CONTROL_LONG_IMMUTABLE, CACHE_CONTROL_SHORT, ES_VENDORS_INDEX, writeAuditLog, indexVendors, getCategorySlug, flushVendorCache, flushDestinationsCache } from '../index';
import { vendors, products, orders, settings, users, vouchers, assets, categories, navigationItems, destinations, destinationCategories, destinationSubcategories } from '../db/schema';
import { eq, desc, and, sql, ilike, inArray, isNull, gte, lte } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { PUBLIC_ASSET_URL, BUCKET_NAME, uploadToMinIO, deleteFromMinIO } from '../storage';

const router = new Hono();

router.get('/api/audit-logs', async (c) => {
    try {
        const entity = c.req.query('entity');
        const entityId = c.req.query('entityId');
        const action = c.req.query('action');
        const limit = parseInt(c.req.query('limit') || '100');
        const offset = parseInt(c.req.query('offset') || '0');

        const conditions: string[] = [];
        const params: any[] = [];
        let idx = 1;

        if (entity) { conditions.push(`entity = $${idx++}`); params.push(entity); }
        if (entityId) { conditions.push(`entity_id = $${idx++}`); params.push(parseInt(entityId)); }
        if (action) { conditions.push(`action = $${idx++}`); params.push(action); }

        const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        const countResult = await pool.query(
            `SELECT COUNT(*) FROM audit_logs ${where}`, params
        );

        params.push(limit, offset);
        const result = await pool.query(
            `SELECT * FROM audit_logs ${where}
             ORDER BY created_at DESC
             LIMIT $${idx} OFFSET $${idx + 1}`,
            params
        );

        return c.json({
            total: parseInt(countResult.rows[0].count),
            logs: result.rows,
        });
    } catch (error) {
        console.error('Audit log fetch error:', error);
        return c.json({ error: 'Failed to fetch audit logs' }, 500);
    }
});

router.get('/api/audit-logs/:entity/:id', async (c) => {
    const entity = c.req.param('entity');
    const id = c.req.param('id');
    try {
        const result = await pool.query(
            `SELECT * FROM audit_logs WHERE entity = $1 AND entity_id = $2 ORDER BY created_at DESC`,
            [entity, parseInt(id)]
        );
        return c.json(result.rows);
    } catch (error) {
        return c.json({ error: 'Failed to fetch logs' }, 500);
    }
});

export default router;
