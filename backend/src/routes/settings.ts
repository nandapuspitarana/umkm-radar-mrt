import { Hono } from 'hono';
import { pool, db, redis, esClient, isProd, CACHE_CONTROL_LONG, CACHE_CONTROL_LONG_IMMUTABLE, CACHE_CONTROL_SHORT, ES_VENDORS_INDEX, writeAuditLog, indexVendors, getCategorySlug, flushVendorCache, flushDestinationsCache } from '../index';
import { vendors, products, orders, settings, users, vouchers, assets, categories, navigationItems, destinations, destinationCategories, destinationSubcategories } from '../db/schema';
import { eq, desc, and, sql, ilike, inArray, isNull, gte, lte } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { PUBLIC_ASSET_URL, BUCKET_NAME, uploadToMinIO, deleteFromMinIO } from '../storage';

const router = new Hono();

router.get('/api/settings', async (c) => {
    try {
        const cacheKey = 'settings_all';
        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                // Cache hit: set HTTP caching header so browser caches too
                c.header('Cache-Control', CACHE_CONTROL_SHORT);
                return c.json(JSON.parse(cached));
            }
        } catch (redisError) {
            console.warn('Redis settings get error:', redisError);
        }

        const result = await db.select().from(settings);

        // Transform to a more usable format
        const settingsObj: any = {};
        result.forEach(setting => {
            // Parse JSON value if it's a string
            try {
                settingsObj[setting.key] = typeof setting.value === 'string'
                    ? JSON.parse(setting.value)
                    : setting.value;
            } catch {
                settingsObj[setting.key] = setting.value;
            }
        });

        try {
            await redis.set(cacheKey, JSON.stringify(settingsObj), 'EX', 3600);
        } catch (redisError) {
            console.warn('Redis settings set error:', redisError);
        }

        // Set HTTP caching header so browser/CDN can cache too (5 min, swr 30s)
        c.header('Cache-Control', CACHE_CONTROL_SHORT);
        return c.json(settingsObj);
    } catch (error) {
        console.error('Settings fetch error:', error);
        return c.json({ error: 'Failed to fetch settings' }, 500);
    }
});

router.post('/api/settings', async (c) => {
    try {
        const body = await c.req.json();
        const results = [];

        // Iterate over keys in body
        for (const key of Object.keys(body)) {
            const value = body[key];

            // Check if setting exists
            const existing = await db.select().from(settings).where(eq(settings.key, key)).limit(1);

            let result;
            if (existing.length > 0) {
                // Update existing
                const updated = await db.update(settings)
                    .set({ value: JSON.stringify(value) }) // Ensure value is stringified if object
                    .where(eq(settings.key, key))
                    .returning();
                result = updated[0];
            } else {
                // Create new
                const inserted = await db.insert(settings).values({
                    key,
                    value: JSON.stringify(value) // Ensure value is stringified if object
                }).returning();
                result = inserted[0];
            }
            results.push(result);
        }

        await redis.del('settings_all');
        return c.json({ success: true, results });
    } catch (error) {
        console.error('Settings bulk update error:', error);
        return c.json({ error: 'Failed to update settings' }, 500);
    }
});

router.get('/api/settings/:key', async (c) => {
    const key = c.req.param('key');
    try {
        const result = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
        if (result.length === 0) return c.json({ error: 'Setting not found' }, 404);

        // Parse JSON value
        try {
            const value = typeof result[0].value === 'string'
                ? JSON.parse(result[0].value)
                : result[0].value;
            return c.json({ key: result[0].key, value });
        } catch {
            await flushDestinationsCache();
            return c.json(result[0]);
        }
    } catch (error) {
        console.error('Setting fetch error:', error);
        return c.json({ error: 'Failed to fetch setting' }, 500);
    }
});

router.put('/api/settings/:key', async (c) => {
    const key = c.req.param('key');
    try {
        const body = await c.req.json();
        const { value } = body;

        // Check if setting exists
        const existing = await db.select().from(settings).where(eq(settings.key, key)).limit(1);

        if (existing.length > 0) {
            // Update existing
            const result = await db.update(settings)
                .set({ value })
                .where(eq(settings.key, key))
                .returning();
            await redis.del('settings_all');
            await flushDestinationsCache();
            return c.json(result[0]);
        } else {
            // Create new
            const result = await db.insert(settings).values({ key, value }).returning();
            await redis.del('settings_all');
            await flushDestinationsCache();
            return c.json(result[0]);
        }
    } catch (error) {
        console.error('Setting update error:', error);
        return c.json({ error: 'Failed to update setting' }, 500);
    }
});

export default router;
