import { Hono } from 'hono';
import { pool, db, redis, esClient, isProd, CACHE_CONTROL_LONG, CACHE_CONTROL_LONG_IMMUTABLE, CACHE_CONTROL_SHORT, ES_VENDORS_INDEX, writeAuditLog, indexVendors, getCategorySlug, flushVendorCache, flushDestinationsCache } from '../index';
import { vendors, products, orders, settings, users, vouchers, assets, categories, navigationItems, destinations, destinationCategories, destinationSubcategories } from '../db/schema';
import { eq, desc, and, sql, ilike, inArray, isNull, gte, lte } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { PUBLIC_ASSET_URL, BUCKET_NAME, uploadToMinIO, deleteFromMinIO } from '../storage';

const router = new Hono();

router.get('/api/location-areas', async (c) => {
    try {
        const result = await pool.query(
            'SELECT * FROM location_areas ORDER BY sort_order, name'
        );
        return c.json(result.rows);
    } catch (error) {
        return c.json({ error: 'Failed to fetch location areas' }, 500);
    }
});

router.get('/api/location-areas/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const result = await pool.query('SELECT * FROM location_areas WHERE id = $1', [parseInt(id)]);
        if (result.rows.length === 0) return c.json({ error: 'Not found' }, 404);
        return c.json(result.rows[0]);
    } catch (error) {
        return c.json({ error: 'Failed to fetch location area' }, 500);
    }
});

router.post('/api/location-areas', async (c) => {
    try {
        const body = await c.req.json();
        const { name, slug, station, line, description, isActive = true, sortOrder = 0 } = body;
        if (!name) return c.json({ error: 'name required' }, 400);
        const autoSlug = slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        const result = await pool.query(
            `INSERT INTO location_areas (name, slug, station, line, description, is_active, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [name, autoSlug, station || null, line || 'MRT', description || null, isActive, sortOrder]
        );
        return c.json(result.rows[0], 201);
    } catch (error: any) {
        if (error.code === '23505') return c.json({ error: 'Slug sudah ada' }, 409);
        return c.json({ error: 'Failed to create location area' }, 500);
    }
});

router.put('/api/location-areas/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const body = await c.req.json();
        const { name, slug, station, line, description, isActive, sortOrder } = body;
        const result = await pool.query(
            `UPDATE location_areas SET
                name        = COALESCE($1, name),
                slug        = COALESCE($2, slug),
                station     = COALESCE($3, station),
                line        = COALESCE($4, line),
                description = COALESCE($5, description),
                is_active   = COALESCE($6, is_active),
                sort_order  = COALESCE($7, sort_order)
             WHERE id = $8 RETURNING *`,
            [name, slug, station, line, description, isActive, sortOrder, parseInt(id)]
        );
        if (result.rows.length === 0) return c.json({ error: 'Not found' }, 404);
        return c.json(result.rows[0]);
    } catch (error) {
        return c.json({ error: 'Failed to update location area' }, 500);
    }
});

router.delete('/api/location-areas/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const result = await pool.query('DELETE FROM location_areas WHERE id = $1 RETURNING *', [parseInt(id)]);
        if (result.rows.length === 0) return c.json({ error: 'Not found' }, 404);
        return c.json({ success: true });
    } catch (error) {
        return c.json({ error: 'Failed to delete location area' }, 500);
    }
});

router.get('/api/location-areas', async (c) => {
    try {
        const result = await pool.query(
            `SELECT id, name, slug, station, line, description, sort_order
             FROM location_areas
             WHERE is_active = true
             ORDER BY sort_order ASC, name ASC`
        );
        return c.json(result.rows);
    } catch (error) {
        console.error('location-areas fetch error:', error);
        return c.json({ error: 'Failed to fetch location areas' }, 500);
    }
});

router.get('/api/location-areas/:slug', async (c) => {
    const slug = c.req.param('slug');
    try {
        const result = await pool.query(
            `SELECT * FROM location_areas WHERE slug = $1 LIMIT 1`, [slug]
        );
        if (result.rows.length === 0) return c.json({ error: 'Area not found' }, 404);
        return c.json(result.rows[0]);
    } catch (error) {
        return c.json({ error: 'Failed to fetch location area' }, 500);
    }
});

export default router;
