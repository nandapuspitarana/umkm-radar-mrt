import { Hono } from 'hono';
import { pool, db, redis, esClient, isProd, CACHE_CONTROL_LONG, CACHE_CONTROL_LONG_IMMUTABLE, CACHE_CONTROL_SHORT, ES_VENDORS_INDEX, writeAuditLog, indexVendors, getCategorySlug, flushVendorCache, flushDestinationsCache } from '../index';
import { vendors, products, orders, settings, users, vouchers, assets, categories, navigationItems, destinations, destinationCategories, destinationSubcategories } from '../db/schema';
import { eq, desc, and, sql, ilike, inArray, isNull, gte, lte } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { PUBLIC_ASSET_URL, BUCKET_NAME, uploadToMinIO, deleteFromMinIO } from '../storage';

const router = new Hono();

router.get('/api/subcategories', async (c) => {
    try {
        const categoryId = c.req.query('categoryId');
        let q = `
            SELECT vs.*, c.name as category_name, c.slug as category_slug
            FROM vendor_subcategories vs
            JOIN categories c ON c.id = vs.category_id
        `;
        const params: any[] = [];
        if (categoryId) {
            q += ' WHERE vs.category_id = $1';
            params.push(parseInt(categoryId));
        }
        q += ' ORDER BY vs.category_id, vs.sort_order, vs.name';
        const result = await pool.query(q, params);
        return c.json(result.rows);
    } catch (error) {
        console.error('Subcategories fetch error:', error);
        return c.json({ error: 'Failed to fetch subcategories' }, 500);
    }
});

router.get('/api/subcategories/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const result = await pool.query(
            'SELECT vs.*, c.name as category_name FROM vendor_subcategories vs JOIN categories c ON c.id = vs.category_id WHERE vs.id = $1',
            [parseInt(id)]
        );
        if (result.rows.length === 0) return c.json({ error: 'Not found' }, 404);
        return c.json(result.rows[0]);
    } catch (error) {
        return c.json({ error: 'Failed to fetch subcategory' }, 500);
    }
});

router.post('/api/subcategories', async (c) => {
    try {
        const body = await c.req.json();
        const { categoryId, name, slug, icon, description, isActive = true, sortOrder = 0 } = body;
        if (!categoryId || !name) return c.json({ error: 'categoryId and name required' }, 400);
        const autoSlug = slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        const result = await pool.query(
            `INSERT INTO vendor_subcategories (category_id, name, slug, icon, description, is_active, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [categoryId, name, autoSlug, icon || null, description || null, isActive, sortOrder]
        );
        return c.json(result.rows[0], 201);
    } catch (error: any) {
        if (error.code === '23505') return c.json({ error: 'Slug sudah ada untuk kategori ini' }, 409);
        return c.json({ error: 'Failed to create subcategory' }, 500);
    }
});

router.put('/api/subcategories/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const body = await c.req.json();
        const { name, slug, icon, description, isActive, sortOrder } = body;
        const result = await pool.query(
            `UPDATE vendor_subcategories SET
                name        = COALESCE($1, name),
                slug        = COALESCE($2, slug),
                icon        = COALESCE($3, icon),
                description = COALESCE($4, description),
                is_active   = COALESCE($5, is_active),
                sort_order  = COALESCE($6, sort_order)
             WHERE id = $7 RETURNING *`,
            [name, slug, icon, description, isActive, sortOrder, parseInt(id)]
        );
        if (result.rows.length === 0) return c.json({ error: 'Not found' }, 404);
        return c.json(result.rows[0]);
    } catch (error) {
        return c.json({ error: 'Failed to update subcategory' }, 500);
    }
});

router.delete('/api/subcategories/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const result = await pool.query('DELETE FROM vendor_subcategories WHERE id = $1 RETURNING *', [parseInt(id)]);
        if (result.rows.length === 0) return c.json({ error: 'Not found' }, 404);
        return c.json({ success: true });
    } catch (error) {
        return c.json({ error: 'Failed to delete subcategory' }, 500);
    }
});

export default router;
