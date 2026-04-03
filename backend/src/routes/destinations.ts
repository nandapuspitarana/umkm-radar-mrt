import { Hono } from 'hono';
import { pool, db, redis, esClient, isProd, CACHE_CONTROL_LONG, CACHE_CONTROL_LONG_IMMUTABLE, CACHE_CONTROL_SHORT, ES_VENDORS_INDEX, writeAuditLog, indexVendors, getCategorySlug, flushVendorCache, flushDestinationsCache } from '../index';
import { vendors, products, orders, settings, users, vouchers, assets, categories, navigationItems, destinations, destinationCategories, destinationSubcategories } from '../db/schema';
import { eq, desc, and, sql, ilike, inArray, isNull, gte, lte } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { PUBLIC_ASSET_URL, BUCKET_NAME, uploadToMinIO, deleteFromMinIO } from '../storage';

const router = new Hono();

router.get('/api/destinations', async (c) => {
    try {
        const category = c.req.query('category') || '';
        const station = c.req.query('station') || 'Blok M';
        const stationType = c.req.query('stationType') || '';

        // Build a deterministic cache key from query params
        const cacheKey = `destinations_list_${category}_${station}_${stationType}`;
        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                console.log(`[destinations] Cache HIT [key: ${cacheKey}]`);
                return c.json(JSON.parse(cached));
            }
        } catch (redisError) {
            console.warn('[destinations] Redis get error:', redisError);
        }

        // Fetch all active destinations
        let result = await db.select().from(destinations).where(eq(destinations.isActive, true));

        // In-memory filters
        if (category) {
            result = result.filter(d => d.category && d.category.toLowerCase().includes(category.toLowerCase()));
        }
        if (station) {
            result = result.filter(d => d.nearestStation.toLowerCase().includes(station.toLowerCase()));
        }
        if (stationType) {
            result = result.filter(d => d.stationType.toLowerCase() === stationType.toLowerCase());
        }

        // Attach distance from the requested station when possible
        // Uses the already-stored distanceFromStation field (km) on each destination row
        // If the client passes ?station=, also compute live Haversine vs location_areas
        let stationLat: number | null = null;
        let stationLng: number | null = null;
        if (station) {
            try {
                const stationResult = await pool.query(
                    `SELECT lat, lng FROM location_areas
                     WHERE LOWER(station) LIKE $1 OR LOWER(name) LIKE $1
                     LIMIT 1`,
                    [`%${station.toLowerCase()}%`]
                );
                if (stationResult.rows.length > 0 && stationResult.rows[0].lat) {
                    stationLat = stationResult.rows[0].lat;
                    stationLng = stationResult.rows[0].lng;
                }
            } catch (_) { /* location_areas may not exist — graceful skip */ }
        }

        function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
            const R = 6371000;
            const toRad = (d: number) => d * Math.PI / 180;
            const dLat = toRad(lat2 - lat1);
            const dLng = toRad(lng2 - lng1);
            const a = Math.sin(dLat / 2) ** 2 +
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                Math.sin(dLng / 2) ** 2;
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        }

        function fmtDistance(meters: number): string {
            if (meters < 1000) return `${Math.round(meters)} m`;
            return `${(meters / 1000).toFixed(1)} km`;
        }

        const enriched = result.map(d => {
            let distanceMeters: number | null = null;
            let distanceLabel: string | null = null;
            // Prefer live Haversine when station coords are available
            if (stationLat && stationLng && d.lat && d.lng) {
                distanceMeters = Math.round(haversineMeters(stationLat, stationLng, d.lat, d.lng));
                distanceLabel = fmtDistance(distanceMeters);
            } else if (d.distanceFromStation != null) {
                // Fall back to stored distance (km) from nearest station field
                distanceMeters = Math.round(d.distanceFromStation * 1000);
                distanceLabel = fmtDistance(distanceMeters);
            }
            return { ...d, distanceMeters, distanceLabel, distance_from_station: distanceMeters ? distanceMeters / 1000 : d.distanceFromStation };
        });

        // Sort by distance ascending when a station is requested
        if (station) {
            enriched.sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity));
        }

        // Cache for 5 minutes
        try {
            await redis.set(cacheKey, JSON.stringify(enriched), 'EX', 300);
        } catch (redisError) {
            console.warn('[destinations] Redis set error:', redisError);
        }

        return c.json(enriched);
    } catch (error) {
        console.error('Destinations endpoint error:', error);
        return c.json({ error: 'Failed to fetch destinations' }, 500);
    }
});

router.get('/api/destinations/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const result = await db.select().from(destinations).where(eq(destinations.id, parseInt(id)));
        if (result.length === 0) return c.json({ error: 'Destination not found' }, 404);
        return c.json(result[0]);
    } catch (error) {
        console.error('Destination endpoint error:', error);
        return c.json({ error: 'Failed to fetch destination' }, 500);
    }
});

router.post('/api/destinations/bulk', async (c) => {
    try {
        const body = await c.req.json();
        if (!Array.isArray(body) || body.length === 0) {
            return c.json({ error: 'Body must be a non-empty array' }, 400);
        }

        const result = await db.insert(destinations).values(body).returning();
        await flushDestinationsCache();

        return c.json({ message: 'Bulk destinations created', count: result.length, data: result }, 201);
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
});

router.post('/api/destinations', async (c) => {
    try {
        const body = await c.req.json();
        if (!body.name || !body.lat || !body.lng) {
            return c.json({ error: 'Name, Latitude, and Longitude are required' }, 400);
        }

        const insertData = { ...body };
        if (insertData.categoryId === '') insertData.categoryId = null;
        if (insertData.subcategoryId === '') insertData.subcategoryId = null;
        if (!insertData.categoryIds) insertData.categoryIds = [];
        if (!insertData.subcategoryIds) insertData.subcategoryIds = [];

        const result = await db.insert(destinations).values(insertData).returning();
        const created = result[0];

        await writeAuditLog({
            entity: 'destination', entityId: created.id, entityName: created.name,
            action: 'CREATE',
            actorName: c.req.header('X-Actor-Name') || 'Admin',
            newData: created,
        });

        await flushDestinationsCache();
        return c.json(created);
    } catch (error) {
        console.error('Create Destination Error:', error);
        return c.json({ error: 'Failed to create destination' }, 500);
    }
});

router.put('/api/destinations/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const body = await c.req.json();

        // Fetch old data for audit
        const oldResult = await db.select().from(destinations).where(eq(destinations.id, parseInt(id)));
        const oldData = oldResult[0];

        const allowed = [
            'name', 'description', 'lat', 'lng', 'category', 'subcategory',
            'address', 'image', 'nearestStation', 'stationType',
            'distanceFromStation', 'walkingTimeMinutes',
            'openingHours', 'ticketPrice', 'contact', 'website',
            'transitHints', 'isActive', 'categoryId', 'subcategoryId',
            'categoryIds', 'subcategoryIds'
        ] as const;

        const updateData: Record<string, any> = { updatedAt: new Date() };
        for (const key of allowed) {
            if (key in body && body[key] !== undefined) {
                updateData[key] = body[key];
            }
        }
        if ('lat' in updateData) updateData.lat = parseFloat(updateData.lat);
        if ('lng' in updateData) updateData.lng = parseFloat(updateData.lng);
        if ('distanceFromStation' in updateData) updateData.distanceFromStation = parseFloat(updateData.distanceFromStation) || null;
        if ('walkingTimeMinutes' in updateData) updateData.walkingTimeMinutes = parseInt(updateData.walkingTimeMinutes) || null;
        if ('isActive' in updateData) updateData.isActive = Boolean(updateData.isActive);
        if ('categoryId' in updateData) updateData.categoryId = updateData.categoryId || null;
        if ('subcategoryId' in updateData) updateData.subcategoryId = updateData.subcategoryId || null;

        const result = await db.update(destinations)
            .set(updateData)
            .where(eq(destinations.id, parseInt(id)))
            .returning();

        if (result.length === 0) return c.json({ error: 'Destination not found' }, 404);

        if (oldData && result[0]) {
            await writeAuditLog({
                entity: 'destination', entityId: parseInt(id), entityName: result[0].name,
                action: 'UPDATE',
                actorName: c.req.header('X-Actor-Name') || 'Admin',
                oldData, newData: result[0],
            });
        }

        await flushDestinationsCache();
        return c.json(result[0]);
    } catch (error) {
        console.error('Update Destination Error:', error);
        return c.json({ error: 'Failed to update destination', details: String(error) }, 500);
    }
});

router.delete('/api/destinations/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const oldResult = await db.select().from(destinations).where(eq(destinations.id, parseInt(id)));
        const oldData = oldResult[0];

        await db.delete(destinations).where(eq(destinations.id, parseInt(id)));

        if (oldData) {
            await writeAuditLog({
                entity: 'destination', entityId: parseInt(id), entityName: oldData.name,
                action: 'DELETE',
                actorName: c.req.header('X-Actor-Name') || 'Admin',
                oldData,
            });
        }

        // Invalidate destination cache
        await flushDestinationsCache();
        return c.json({ success: true });
    } catch (error) {
        console.error('Delete Destination Error:', error);
        return c.json({ error: 'Failed to delete destination' }, 500);
    }
});

router.get('/api/destination-categories', async (c) => {
    try {
        const type = c.req.query('type'); // 'wisata' | 'publik'
        let query = db.select().from(destinationCategories);

        if (type) {
            const result = await db.select().from(destinationCategories)
                .where(eq(destinationCategories.type, type))
                .orderBy(destinationCategories.sortOrder);
            return c.json(result);
        }

        const result = await db.select().from(destinationCategories).orderBy(destinationCategories.sortOrder);
        return c.json(result);
    } catch (error) {
        console.error('Get Destination Categories Error:', error);
        return c.json({ error: 'Failed to fetch destination categories' }, 500);
    }
});

router.get('/api/destination-categories/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const result = await db.select().from(destinationCategories).where(eq(destinationCategories.id, parseInt(id)));
        if (result.length === 0) return c.json({ error: 'Category not found' }, 404);
        return c.json(result[0]);
    } catch (error) {
        console.error('Get Destination Category Error:', error);
        return c.json({ error: 'Failed to fetch destination category' }, 500);
    }
});

router.post('/api/destination-categories', async (c) => {
    try {
        const body = await c.req.json();
        const result = await db.insert(destinationCategories).values({
            name: body.name,
            slug: body.slug,
            type: body.type || 'wisata',
            icon: body.icon || null,
            bannerImage: body.bannerImage || null,
            sortOrder: body.sortOrder || 0,
            isActive: body.isActive !== undefined ? body.isActive : true,
        }).returning();
        return c.json(result[0], 201);
    } catch (error) {
        console.error('Create Destination Category Error:', error);
        return c.json({ error: 'Failed to create destination category' }, 500);
    }
});

router.put('/api/destination-categories/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const body = await c.req.json();
        const result = await db.update(destinationCategories)
            .set({
                name: body.name,
                slug: body.slug,
                type: body.type,
                icon: body.icon,
                bannerImage: body.bannerImage,
                sortOrder: body.sortOrder,
                isActive: body.isActive,
            })
            .where(eq(destinationCategories.id, parseInt(id)))
            .returning();
        if (result.length === 0) return c.json({ error: 'Category not found' }, 404);
        await flushDestinationsCache();
        return c.json(result[0]);
    } catch (error) {
        console.error('Update Destination Category Error:', error);
        return c.json({ error: 'Failed to update destination category' }, 500);
    }
});

router.delete('/api/destination-categories/:id', async (c) => {
    try {
        const id = c.req.param('id');
        await db.delete(destinationCategories).where(eq(destinationCategories.id, parseInt(id)));
        await flushDestinationsCache();
        return c.json({ success: true });
    } catch (error) {
        console.error('Delete Destination Category Error:', error);
        return c.json({ error: 'Failed to delete destination category' }, 500);
    }
});

router.get('/api/destination-subcategories', async (c) => {
    try {
        const result = await db
            .select({
                id: destinationSubcategories.id,
                name: destinationSubcategories.name,
                slug: destinationSubcategories.slug,
                bannerImage: destinationSubcategories.bannerImage,
                categoryId: destinationSubcategories.categoryId,
                sortOrder: destinationSubcategories.sortOrder,
                isActive: destinationSubcategories.isActive,
                createdAt: destinationSubcategories.createdAt,
                categoryName: destinationCategories.name,
                categoryType: destinationCategories.type,
            })
            .from(destinationSubcategories)
            .leftJoin(destinationCategories, eq(destinationSubcategories.categoryId, destinationCategories.id))
            .orderBy(destinationSubcategories.sortOrder);
        return c.json(result);
    } catch (error) {
        console.error('Get Destination Subcategories Error:', error);
        return c.json({ error: 'Failed to fetch destination subcategories' }, 500);
    }
});

router.get('/api/destination-subcategories/by-category/:categoryId', async (c) => {
    try {
        const categoryId = c.req.param('categoryId');
        const result = await db.select()
            .from(destinationSubcategories)
            .where(eq(destinationSubcategories.categoryId, parseInt(categoryId)))
            .orderBy(destinationSubcategories.sortOrder);
        return c.json(result);
    } catch (error) {
        console.error('Get Destination Subcategories by Category Error:', error);
        return c.json({ error: 'Failed to fetch destination subcategories' }, 500);
    }
});

router.post('/api/destination-subcategories', async (c) => {
    try {
        const body = await c.req.json();
        const result = await db.insert(destinationSubcategories).values({
            categoryId: body.categoryId,
            name: body.name,
            slug: body.slug,
            bannerImage: body.bannerImage || null,
            sortOrder: body.sortOrder || 0,
            isActive: body.isActive !== undefined ? body.isActive : true,
        }).returning();
        return c.json(result[0], 201);
    } catch (error) {
        console.error('Create Destination Subcategory Error:', error);
        return c.json({ error: 'Failed to create destination subcategory' }, 500);
    }
});

router.put('/api/destination-subcategories/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const body = await c.req.json();
        const result = await db.update(destinationSubcategories)
            .set({
                categoryId: body.categoryId,
                name: body.name,
                slug: body.slug,
                bannerImage: body.bannerImage,
                sortOrder: body.sortOrder,
                isActive: body.isActive,
            })
            .where(eq(destinationSubcategories.id, parseInt(id)))
            .returning();
        if (result.length === 0) return c.json({ error: 'Subcategory not found' }, 404);
        await flushDestinationsCache();
        return c.json(result[0]);
    } catch (error) {
        console.error('Update Destination Subcategory Error:', error);
        return c.json({ error: 'Failed to update destination subcategory' }, 500);
    }
});

router.delete('/api/destination-subcategories/:id', async (c) => {
    try {
        const id = c.req.param('id');
        await db.delete(destinationSubcategories).where(eq(destinationSubcategories.id, parseInt(id)));
        await flushDestinationsCache();
        return c.json({ success: true });
    } catch (error) {
        console.error('Delete Destination Subcategory Error:', error);
        return c.json({ error: 'Failed to delete destination subcategory' }, 500);
    }
});

router.get('/api/destinations', async (c) => {
    try {
        const type = c.req.query('type'); // 'publik' | 'wisata' | undefined

        let result;
        if (type) {
            // Join with destination_categories to filter by type
            const rows = await pool.query(
                `SELECT d.* FROM destinations d
                 JOIN destination_categories dc ON dc.id = d.category_id
                 WHERE d.is_active = true AND dc.type = $1
                 ORDER BY d.id ASC`,
                [type]
            );
            // Map snake_case DB columns -> camelCase to match Drizzle ORM output
            result = rows.rows.map((r: any) => ({
                id: r.id,
                name: r.name,
                description: r.description,
                lat: r.lat,
                lng: r.lng,
                category: r.category,
                subcategory: r.subcategory,
                categoryId: r.category_id,
                subcategoryId: r.subcategory_id,
                categoryIds: r.category_ids,
                subcategoryIds: r.subcategory_ids,
                address: r.address,
                image: r.image,
                nearestStation: r.nearest_station,
                stationType: r.station_type,
                distanceFromStation: r.distance_from_station,
                walkingTimeMinutes: r.walking_time_minutes,
                openingHours: r.opening_hours,
                ticketPrice: r.ticket_price,
                contact: r.contact,
                website: r.website,
                transitHints: r.transit_hints,
                isActive: r.is_active,
                createdAt: r.created_at,
                updatedAt: r.updated_at,
            }));
        } else {
            result = await db.select().from(destinations).where(eq(destinations.isActive, true));
        }

        return c.json(result);
    } catch (error) {
        console.error('Error fetching destinations:', error);
        return c.json({ error: 'Failed to fetch destinations' }, 500);
    }
});

router.get('/api/destinations/grouped', async (c) => {
    try {
        const cacheKey = 'destinations_grouped';
        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                console.log('[destinations/grouped] Cache HIT');
                return c.json(JSON.parse(cached));
            }
        } catch (redisError) {
            console.warn('[destinations/grouped] Redis get error:', redisError);
        }

        const result = await db.select().from(destinations).where(eq(destinations.isActive, true));

        // Group by category
        const grouped: Record<string, typeof result> = {};
        result.forEach(dest => {
            const key = dest.category ?? 'uncategorized';
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(dest);
        });

        // Cache for 5 minutes
        try {
            await redis.set(cacheKey, JSON.stringify(grouped), 'EX', 300);
        } catch (redisError) {
            console.warn('[destinations/grouped] Redis set error:', redisError);
        }

        return c.json(grouped);
    } catch (error) {
        console.error("Error fetching grouped destinations:", error);
        return c.json({ error: 'Failed to fetch destinations' }, 500);
    }
});

router.get('/api/destinations/:id', async (c) => {
    try {
        const id = parseInt(c.req.param('id'));
        const result = await db.select().from(destinations).where(eq(destinations.id, id));

        if (result.length === 0) {
            return c.json({ error: 'Destination not found' }, 404);
        }

        await flushDestinationsCache();
        return c.json(result[0]);
    } catch (error) {
        console.error("Error fetching destination:", error);
        return c.json({ error: 'Failed to fetch destination' }, 500);
    }
});

router.get('/api/destinations/:id/directions', async (c) => {
    try {
        const id = parseInt(c.req.param('id'));
        const from = c.req.query('from'); // e.g., 'bekasi', 'bogor', 'tangerang', 'depok'

        const result = await db.select().from(destinations).where(eq(destinations.id, id));

        if (result.length === 0) {
            return c.json({ error: 'Destination not found' }, 404);
        }

        const dest = result[0];
        const transitHints = dest.transitHints as Record<string, string> || {};

        // Build response with directions
        const response = {
            destination: dest.name,
            nearestStation: dest.nearestStation,
            stationType: dest.stationType,
            distanceFromStation: dest.distanceFromStation,
            walkingTime: dest.walkingTimeMinutes,
            allTransitHints: transitHints,
            specificDirection: from ? transitHints[`from_${from.toLowerCase()}`] || `Tidak ada petunjuk untuk ${from}` : null
        };

        return c.json(response);
    } catch (error) {
        console.error("Error fetching directions:", error);
        return c.json({ error: 'Failed to fetch directions' }, 500);
    }
});

router.get('/api/destinations/search/:query', async (c) => {
    try {
        const query = c.req.param('query').toLowerCase();
        const result = await db.select().from(destinations).where(eq(destinations.isActive, true));

        // Search in name, description, category, subcategory, address
        const filtered = result.filter(d =>
            d.name.toLowerCase().includes(query) ||
            (d.description && d.description.toLowerCase().includes(query)) ||
            (d.category && d.category.toLowerCase().includes(query)) ||
            (d.subcategory && d.subcategory.toLowerCase().includes(query)) ||
            (d.address && d.address.toLowerCase().includes(query)) ||
            (d.nearestStation && d.nearestStation.toLowerCase().includes(query))
        );

        return c.json(filtered);
    } catch (error) {
        console.error("Error searching destinations:", error);
        return c.json({ error: 'Failed to search destinations' }, 500);
    }
});

router.get('/api/destinations/meta/categories', async (c) => {
    try {
        const result = await db.select().from(destinations).where(eq(destinations.isActive, true));
        const categories = [...new Set(result.map(d => d.category))];
        return c.json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        return c.json({ error: 'Failed to fetch categories' }, 500);
    }
});

router.get('/api/destinations/meta/stations', async (c) => {
    try {
        const result = await db.select().from(destinations).where(eq(destinations.isActive, true));
        const stations = [...new Set(result.map(d => ({ name: d.nearestStation, type: d.stationType })))];
        return c.json(stations);
    } catch (error) {
        console.error("Error fetching stations:", error);
        return c.json({ error: 'Failed to fetch stations' }, 500);
    }
});

export default router;
