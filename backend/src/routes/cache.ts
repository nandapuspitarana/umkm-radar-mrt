import { Hono } from 'hono';
import { pool, db, redis, esClient, isProd, CACHE_CONTROL_LONG, CACHE_CONTROL_LONG_IMMUTABLE, CACHE_CONTROL_SHORT, ES_VENDORS_INDEX, writeAuditLog, indexVendors, getCategorySlug, flushVendorCache, flushDestinationsCache } from '../index';
import { vendors, products, orders, settings, users, vouchers, assets, categories, navigationItems, destinations, destinationCategories, destinationSubcategories } from '../db/schema';
import { eq, desc, and, sql, ilike, inArray, isNull, gte, lte } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { PUBLIC_ASSET_URL, BUCKET_NAME, uploadToMinIO, deleteFromMinIO } from '../storage';

const router = new Hono();

router.post('/api/cache/flush-vendors', async (c) => {
    try {
        await flushVendorCache();
        return c.json({
            success: true,
            message: 'Vendor cache flushed. Data segar akan di-fetch pada request berikutnya.',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Cache flush error:', error);
        return c.json({ error: 'Failed to flush cache' }, 500);
    }
});

router.post('/api/cache/flush-destinations', async (c) => {
    try {
        await flushDestinationsCache();
        return c.json({
            success: true,
            message: 'Destination cache flushed. Data segar akan di-fetch pada request berikutnya.',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Destination cache flush error:', error);
        return c.json({ error: 'Failed to flush destination cache' }, 500);
    }
});

export default router;
