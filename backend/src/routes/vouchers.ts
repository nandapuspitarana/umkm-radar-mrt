import { Hono } from 'hono';
import { pool, db, redis, esClient, isProd, CACHE_CONTROL_LONG, CACHE_CONTROL_LONG_IMMUTABLE, CACHE_CONTROL_SHORT, ES_VENDORS_INDEX, writeAuditLog, indexVendors, getCategorySlug, flushVendorCache, flushDestinationsCache } from '../index';
import { vendors, products, orders, settings, users, vouchers, assets, categories, navigationItems, destinations, destinationCategories, destinationSubcategories } from '../db/schema';
import { eq, desc, and, sql, ilike, inArray, isNull, gte, lte } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { PUBLIC_ASSET_URL, BUCKET_NAME, uploadToMinIO, deleteFromMinIO } from '../storage';

const router = new Hono();

router.get('/api/vouchers', async (c) => {
    const vendorId = c.req.query('vendorId');
    const isAdmin = c.req.query('isAdmin') === 'true';

    try {
        let conditions = [];
        if (isAdmin) {
            // Admin sees all? Or just global? Let's say Admin sees everything for now
        } else if (vendorId) {
            // Vendor sees their own + Global vouchers
            // logic: vendorId = X OR vendorId IS NULL
            // Using raw SQL logic simpler here or iterate
            const all = await db.select().from(vouchers);
            const filtered = all.filter(v => v.vendorId === null || v.vendorId === parseInt(vendorId));
            return c.json(filtered);
        }

        const result = await db.select().from(vouchers);
        return c.json(result);
    } catch (error) {
        return c.json({ error: 'Failed to fetch vouchers' }, 500);
    }
});

router.post('/api/vouchers', async (c) => {
    try {
        const body = await c.req.json();
        const result = await db.insert(vouchers).values(body).returning();
        await flushDestinationsCache();
        return c.json(result[0]);
    } catch (error) {
        return c.json({ error: 'Failed to create voucher' }, 500);
    }
});

router.delete('/api/vouchers/:id', async (c) => {
    const id = c.req.param('id');
    try {
        await db.delete(vouchers).where(eq(vouchers.id, parseInt(id)));
        return c.json({ message: 'Deleted' });
    } catch (error) {
        return c.json({ error: 'Failed to delete' }, 500);
    }
});

export default router;
