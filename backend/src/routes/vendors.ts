import { Hono } from 'hono';
import { pool, db, redis, esClient, isProd, CACHE_CONTROL_LONG, CACHE_CONTROL_LONG_IMMUTABLE, CACHE_CONTROL_SHORT, ES_VENDORS_INDEX, writeAuditLog, indexVendors, getCategorySlug, flushVendorCache, flushDestinationsCache } from '../index';
import { vendors, products, orders, settings, users, vouchers, assets, categories, navigationItems, destinations, destinationCategories, destinationSubcategories } from '../db/schema';
import { eq, desc, and, sql, ilike, inArray, isNull, gte, lte } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { PUBLIC_ASSET_URL, BUCKET_NAME, uploadToMinIO, deleteFromMinIO } from '../storage';

const router = new Hono();

router.get('/api/vendors/search', async (c) => {
    const q = (c.req.query('q') || '').trim();
    const category = (c.req.query('category') || '').trim();
    const station = (c.req.query('station') || '').trim();

    // If no search term, fall back to a simple DB query
    if (!q) {
        try {
            const result = await db.select().from(vendors);
            return c.json(result);
        } catch (err) {
            return c.json({ error: 'Failed to fetch vendors' }, 500);
        }
    }

    try {
        // Build ES query
        const mustClauses: any[] = [
            {
                multi_match: {
                    query: q,
                    fields: ['name^3', 'description^2', 'address', 'locationTags^2', 'category'],
                    type: 'best_fields',
                    fuzziness: 'AUTO',
                },
            },
        ];

        const filterClauses: any[] = [];
        if (category) {
            filterClauses.push({ term: { category } });
        }
        if (station) {
            filterClauses.push({ match: { locationTags: station } });
        }

        const esQuery: any = {
            query: {
                bool: {
                    must: mustClauses,
                    ...(filterClauses.length > 0 ? { filter: filterClauses } : {}),
                },
            },
            size: 50,
        };

        const { body: esResult } = await esClient.search({
            index: ES_VENDORS_INDEX,
            body: esQuery,
        });

        const hits = esResult.hits?.hits ?? [];
        const vendorIds: number[] = hits.map((h: any) => Number(h._id)).filter((id: number) => !isNaN(id));

        if (vendorIds.length === 0) {
            return c.json([]);
        }

        // Fetch full vendor rows from DB to keep data fresh
        const dbVendors = await db.select().from(vendors);
        // Preserve ES relevance order
        const idOrder = new Map(vendorIds.map((id, i) => [id, i]));
        const matched = dbVendors
            .filter((v) => idOrder.has(v.id))
            .sort((a, b) => (idOrder.get(a.id) ?? 999) - (idOrder.get(b.id) ?? 999));

        return c.json(matched.map((v) => ({ ...v, location: { lat: v.lat, lng: v.lng } })));
    } catch (esErr) {
        console.warn('[ES] Search failed, falling back to Postgres:', (esErr as Error).message);
        // Graceful fallback: Postgres ILIKE search
        try {
            const allVendors = await db.select().from(vendors);
            const lower = q.toLowerCase();
            const filtered = allVendors.filter((v) =>
                (v.name || '').toLowerCase().includes(lower) ||
                (v.description || '').toLowerCase().includes(lower) ||
                (v.address || '').toLowerCase().includes(lower) ||
                (v.locationTags || '').toLowerCase().includes(lower) ||
                (v.category || '').toLowerCase().includes(lower)
            );
            return c.json(filtered.map((v) => ({ ...v, location: { lat: v.lat, lng: v.lng } })));
        } catch (pgErr) {
            return c.json({ error: 'Search failed' }, 500);
        }
    }
});

router.get('/api/vendors', async (c) => {
    try {
        const stationParam = c.req.query('station') || '';
        // Cache key includes station so each station has its own cache
        const cacheKey = stationParam ? `vendors_list_${stationParam}` : 'vendors_list';
        let cached = null;

        // Try to get from Redis cache
        try {
            cached = await redis.get(cacheKey);
        } catch (redisError) {
            console.warn('Redis get error:', redisError);
        }

        if (cached) {
            console.log(`Serving vendors from Redis cache [station: ${stationParam || 'all'}]`);
            return c.json(JSON.parse(cached));
        }

        let result;

        if (stationParam) {
            // Sort: vendors matching station locationTags first, then the rest
            result = await db.select().from(vendors).orderBy(
                sql`CASE WHEN LOWER(${vendors.locationTags}) LIKE ${`%${stationParam.toLowerCase()}%`} THEN 0 ELSE 1 END`
            );
        } else {
            result = await db.select().from(vendors);
        }

        // Transform data to match client expected format
        const transformedResult = result.map(v => ({
            ...v,
            location: { lat: v.lat, lng: v.lng }
        }));

        // Cache for 10 minutes
        try {
            await redis.set(cacheKey, JSON.stringify(transformedResult), 'EX', 600);
        } catch (redisError) {
            console.warn('Redis set error:', redisError);
        }

        return c.json(transformedResult);
    } catch (error) {
        console.error('Vendors endpoint error:', error);
        return c.json({ error: 'Failed to fetch vendors', details: error }, 500);
    }
});

router.get('/api/vendors/grouped', async (c) => {
    try {
        const stationParam = c.req.query('station') || 'all';
        const cacheKey = `vendors_grouped_${stationParam}`;

        // 1. Try Redis cache first
        let cached = null;
        try {
            cached = await redis.get(cacheKey);
        } catch (redisError) {
            console.warn('[vendors/grouped] Redis get error:', redisError);
        }

        if (cached) {
            console.log(`[vendors/grouped] Cache HIT [station: ${stationParam}]`);
            return c.json(JSON.parse(cached));
        }

        console.log(`[vendors/grouped] Cache MISS — computing [station: ${stationParam}]`);

        // 2. Get station coordinates from location_areas
        let stationLat: number | null = null;
        let stationLng: number | null = null;
        const stationLower = stationParam.toLowerCase();

        if (stationParam !== 'all') {
            const stationResult = await pool.query(
                `SELECT lat, lng FROM location_areas
                 WHERE LOWER(station) LIKE $1 OR LOWER(name) LIKE $1
                 LIMIT 1`,
                [`%${stationLower}%`]
            );
            if (stationResult.rows.length > 0 && stationResult.rows[0].lat) {
                stationLat = stationResult.rows[0].lat;
                stationLng = stationResult.rows[0].lng;
            }
        }

        // Haversine distance calculator (meters)
        function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
            const R = 6371000; // Earth radius in meters
            const toRad = (d: number) => d * Math.PI / 180;
            const dLat = toRad(lat2 - lat1);
            const dLng = toRad(lng2 - lng1);
            const a = Math.sin(dLat / 2) ** 2 +
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                Math.sin(dLng / 2) ** 2;
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        }

        // Format distance for display
        function formatDistance(meters: number): string {
            if (meters < 1000) return `${Math.round(meters)} m`;
            return `${(meters / 1000).toFixed(1)} km`;
        }

        // 3. Fetch all vendors
        const allVendors = await db.select().from(vendors).orderBy(
            sql`CASE WHEN LOWER(${vendors.locationTags}) LIKE ${`%${stationLower}%`} THEN 0 ELSE 1 END`,
            sql`${vendors.name} ASC`
        );

        // 4. Group by category slug + calculate distance
        const grouped: Record<string, any[]> = {
            kuliner: [],
            ngopi: [],
            atm: [],
            lainnya: [],
        };

        for (const v of allVendors) {
            const slug = getCategorySlug(v);

            // Calculate distance from station
            let distanceMeters: number | null = null;
            let distanceLabel: string | null = null;

            // Calculate distance from selected station via Haversine formula
            if (stationLat && stationLng && v.lat && v.lng) {
                distanceMeters = Math.round(haversineMeters(stationLat, stationLng, v.lat, v.lng));
                distanceLabel = formatDistance(distanceMeters);
            }

            const transformed = {
                ...v,
                location: { lat: v.lat, lng: v.lng },
                distanceMeters,
                distanceLabel,
            };

            grouped[slug] = grouped[slug] || [];
            grouped[slug].push(transformed);
        }

        // 5. Sort each category by distance (nearest first)
        for (const key of Object.keys(grouped)) {
            grouped[key].sort((a: any, b: any) => {
                const da = a.distanceMeters ?? Infinity;
                const db = b.distanceMeters ?? Infinity;
                return da - db;
            });
        }

        const response = {
            station: stationParam,
            stationCoords: stationLat ? { lat: stationLat, lng: stationLng } : null,
            kuliner: grouped.kuliner,
            ngopi: grouped.ngopi,
            atm: grouped.atm,
            lainnya: grouped.lainnya,
            _cachedAt: new Date().toISOString(),
        };

        // 6. Cache for 10 minutes
        try {
            await redis.set(cacheKey, JSON.stringify(response), 'EX', 600);
            console.log(`[vendors/grouped] Cached [station: ${stationParam}] — kuliner:${grouped.kuliner.length} ngopi:${grouped.ngopi.length} atm:${grouped.atm.length}`);
        } catch (redisError) {
            console.warn('[vendors/grouped] Redis set error:', redisError);
        }

        return c.json(response);
    } catch (error) {
        console.error('[vendors/grouped] Error:', error);
        return c.json({ error: 'Failed to fetch grouped vendors', details: String(error) }, 500);
    }
});

router.get('/api/vendors/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const result = await db.select().from(vendors).where(eq(vendors.id, parseInt(id)));
        if (result.length === 0) return c.json(null, 404);
        await flushDestinationsCache();
        return c.json(result[0]);
    } catch (error) {
        return c.json({ error: 'Failed to fetch vendor' }, 500);
    }
});

router.post('/api/vendors/bulk', async (c) => {
    try {
        const body = await c.req.json();
        if (!Array.isArray(body) || body.length === 0) {
            return c.json({ error: 'Body must be a non-empty array' }, 400);
        }

        const result = await db.insert(vendors).values(body).returning();

        await writeAuditLog({
            entity: 'vendor', entityId: 0, entityName: 'Bulk Import',
            action: 'CREATE',
            actorName: c.req.header('X-Actor-Name') || 'Admin',
            newData: { count: result.length },
        });

        await flushVendorCache();
        return c.json({ message: 'Bulk vendors created', count: result.length, data: result }, 201);
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
});

router.post('/api/vendors', async (c) => {
    try {
        const body = await c.req.json();
        const result = await db.insert(vendors).values(body).returning();
        const created = result[0];

        await writeAuditLog({
            entity: 'vendor', entityId: created.id, entityName: created.name,
            action: 'CREATE',
            actorName: c.req.header('X-Actor-Name') || 'Admin',
            newData: created,
        });

        // Flush ALL vendor cache (per-station list + grouped)
        await flushVendorCache();
        await flushDestinationsCache();
        return c.json(created);
    } catch (error) {
        console.error('Create Vendor Error:', error);
        return c.json({ error: 'Failed to create vendor' }, 500);
    }
});

router.put('/api/vendors/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const body = await c.req.json();

        // Fetch old data for audit
        const oldResult = await db.select().from(vendors).where(eq(vendors.id, parseInt(id)));
        const oldData = oldResult[0];

        const result = await db.update(vendors)
            .set(body)
            .where(eq(vendors.id, parseInt(id)))
            .returning();

        if (oldData && result[0]) {
            await writeAuditLog({
                entity: 'vendor', entityId: parseInt(id), entityName: result[0].name,
                action: 'UPDATE',
                actorName: c.req.header('X-Actor-Name') || 'Admin',
                oldData, newData: result[0],
            });
        }

        // Flush ALL vendor cache (per-station list + grouped)
        await flushVendorCache();
        await flushDestinationsCache();
        return c.json(result[0]);
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Failed to update vendor' }, 500);
    }
});

router.delete('/api/vendors/:id', async (c) => {
    const id = c.req.param('id');
    try {
        // Fetch vendor before delete
        const oldResult = await db.select().from(vendors).where(eq(vendors.id, parseInt(id)));
        const oldData = oldResult[0];

        if (!oldData) {
            return c.json({ error: 'Vendor not found' }, 404);
        }

        const vendorId = parseInt(id);

        // Safely cascade/nullify related records to prevent foreign key errors
        // 1. Delete associated products
        await db.delete(products).where(eq(products.vendorId, vendorId));
        // 2. Unlink vouchers (vouchers.vendorId is nullable)
        await db.update(vouchers).set({ vendorId: null }).where(eq(vouchers.vendorId, vendorId));
        // 3. Unlink users (users.vendorId is nullable)
        await db.update(users).set({ vendorId: null }).where(eq(users.vendorId, vendorId));
        // 4. Delete associated orders (orders.vendorId is not null, so we must delete to remove vendor)
        await db.delete(orders).where(eq(orders.vendorId, vendorId));

        // Finally, delete the vendor
        await db.delete(vendors).where(eq(vendors.id, vendorId));

        if (oldData) {
            await writeAuditLog({
                entity: 'vendor', entityId: parseInt(id), entityName: oldData.name,
                action: 'DELETE',
                actorName: c.req.header('X-Actor-Name') || 'Admin',
                oldData,
            });
        }

        // Flush ALL vendor cache (per-station list + grouped)
        await flushVendorCache();
        return c.json({ message: 'Vendor and associated products deleted successfully' });
    } catch (error) {
        console.error('Delete Vendor Error:', error);
        return c.json({ error: 'Failed to delete vendor' }, 500);
    }
});

router.get('/api/vendors/cache-status', async (c) => {
    try {
        let cursor = '0';
        const cacheInfo: Array<{ key: string; ttl: number }> = [];

        do {
            const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', 'vendors_*', 'COUNT', 100);
            cursor = nextCursor;
            for (const key of keys) {
                const ttl = await redis.ttl(key);
                cacheInfo.push({ key, ttl });
            }
        } while (cursor !== '0');

        cacheInfo.sort((a, b) => a.key.localeCompare(b.key));

        return c.json({
            totalKeys: cacheInfo.length,
            keys: cacheInfo,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        return c.json({ error: 'Failed to check cache status', details: String(error) }, 500);
    }
});

export default router;
