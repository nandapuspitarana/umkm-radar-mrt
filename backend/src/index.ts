import coreRoutes from './routes/core';
import assetsRoutes from './routes/assets';
import usersRoutes from './routes/users';
import vendorsRoutes from './routes/vendors';
import productsRoutes from './routes/products';
import destinationsRoutes from './routes/destinations';
import ordersRoutes from './routes/orders';
import seedRoutes from './routes/seed';
import vouchersRoutes from './routes/vouchers';
import categoriesRoutes from './routes/categories';
import navigationRoutes from './routes/navigation';
import settingsRoutes from './routes/settings';
import subcategoriesRoutes from './routes/subcategories';
import locationAreasRoutes from './routes/locationAreas';
import auditLogsRoutes from './routes/auditLogs';
import cacheRoutes from './routes/cache';

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { vendors, products, orders, settings, users, vouchers, assets, categories, navigationItems, destinations, destinationCategories, destinationSubcategories } from './db/schema';
import { eq, desc, and, sql, ilike, inArray } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import Redis from 'ioredis';
import { Client as ESClient } from '@elastic/elasticsearch';
import { initializeStorage, uploadToMinIO, deleteFromMinIO, PUBLIC_ASSET_URL, BUCKET_NAME } from './storage';

dotenv.config();

export const app = new Hono();

app.route('/', coreRoutes);
app.route('/', assetsRoutes);
app.route('/', usersRoutes);
app.route('/', vendorsRoutes);
app.route('/', productsRoutes);
app.route('/', destinationsRoutes);
app.route('/', ordersRoutes);
app.route('/', seedRoutes);
app.route('/', vouchersRoutes);
app.route('/', categoriesRoutes);
app.route('/', navigationRoutes);
app.route('/', settingsRoutes);
app.route('/', subcategoriesRoutes);
app.route('/', locationAreasRoutes);
app.route('/', auditLogsRoutes);
app.route('/', cacheRoutes);


// Middleware
app.use('/*', cors());

// ==================== AUDIT LOG HELPER ====================
export async function writeAuditLog(params: {
    entity: string;       // 'user' | 'vendor' | 'destination'
    entityId: number;
    entityName?: string;
    action: string;       // 'CREATE' | 'UPDATE' | 'DELETE'
    actorId?: number;
    actorName?: string;
    actorRole?: string;
    oldData?: any;
    newData?: any;
    changes?: Record<string, { from: any; to: any }>;
    ip?: string;
    userAgent?: string;
}) {
    try {
        // Compute field-level changes if both old and new data provided
        let changes = params.changes;
        if (!changes && params.oldData && params.newData) {
            changes = {};
            const allKeys = new Set([...Object.keys(params.oldData), ...Object.keys(params.newData)]);
            for (const k of allKeys) {
                if (['password', 'created_at', 'updated_at'].includes(k)) continue;
                const from = params.oldData[k];
                const to = params.newData[k];
                if (JSON.stringify(from) !== JSON.stringify(to)) {
                    changes[k] = { from, to };
                }
            }
        }
        await pool.query(
            `INSERT INTO audit_logs (entity, entity_id, entity_name, action, actor_id, actor_name, actor_role, old_data, new_data, changes, ip_address, user_agent)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
            [
                params.entity,
                params.entityId,
                params.entityName || null,
                params.action,
                params.actorId || null,
                params.actorName || 'Admin',
                params.actorRole || 'admin',
                params.oldData ? JSON.stringify(params.oldData) : null,
                params.newData ? JSON.stringify(params.newData) : null,
                changes ? JSON.stringify(changes) : null,
                params.ip || null,
                params.userAgent || null,
            ]
        );
    } catch (e) {
        console.error('[AuditLog] Failed to write log:', e);
    }
}

// Database Connection
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/umkmradar',
});

export const db = drizzle(pool);

// Redis Connection with error handling
export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redis.on('error', (err) => {
    console.warn('Redis connection error:', err.message);
    console.warn('Continuing without Redis cache...');
});

redis.on('connect', () => {
    console.log('✅ Redis connected successfully');
});

export const isProd = process.env.NODE_ENV === 'production';

// Helpers for cache control headers based on environment
export const CACHE_CONTROL_LONG = isProd ? 'public, max-age=31536000' : 'no-cache, no-store, must-revalidate';
export const CACHE_CONTROL_LONG_IMMUTABLE = isProd ? 'public, max-age=31536000, immutable' : 'no-cache, no-store, must-revalidate';
export const CACHE_CONTROL_SHORT = isProd ? 'public, max-age=300, stale-while-revalidate=30' : 'no-cache, no-store, must-revalidate';

// DEV MODE: Bypass Redis cache
if (!isProd) {
    console.log('⚠️ Development mode: Redis caching is DISABLED');
    // Override get to always return null (cache miss)
    const originalGet = redis.get.bind(redis);
    redis.get = async (...args: any[]) => null as any;
    // Override set to just do nothing
    const originalSet = redis.set.bind(redis);
    redis.set = async (...args: any[]) => 'OK' as any;
}

// Elasticsearch Connection
export const esClient = new ESClient({
    node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
});

esClient.ping().then(() => {
    console.log('✅ Elasticsearch connected successfully');
}).catch((err) => {
    console.warn('Elasticsearch connection warning:', err.message);
    console.warn('Continuing without Elasticsearch...');
});

// Routes

// Health Check

// Debug: List files in MinIO bucket

// Proxy endpoint to serve MinIO assets via backend (for CORS issues)

// Uploads proxy endpoint — serves files from MinIO
// For VIDEO files: redirect to a short-lived presigned URL. This lets Safari/iOS
//   talk directly to MinIO which natively handles Range requests (required for video).
// For IMAGE/other files: proxy through backend with proper ETag + cache headers.

// Imgproxy Proxy Endpoint
export const IMGPROXY_URL = process.env.IMGPROXY_URL || 'http://localhost:8088';

// Raw Asset Proxy (Video/Files)
// No imgproxy processing, direct stream from MinIO

// File Upload Endpoint - Using MinIO

// List all assets

// Get single asset metadata

// Delete asset

// 0. Login

// 1. Get All Vendors (Cached, with optional station-based sorting)
// ==================== VENDOR CACHE HELPER ====================
// Flush ALL vendor-related cache keys (list + grouped, all stations)
export async function flushVendorCache() {
    try {
        // Use SCAN to find all vendor cache keys (pattern-based)
        let cursor = '0';
        const keysToDelete: string[] = [];
        do {
            const [nextCursor, keys] = await redis.scan(
                cursor, 'MATCH', 'vendors_*', 'COUNT', 100
            );
            cursor = nextCursor;
            keysToDelete.push(...keys);
        } while (cursor !== '0');

        if (keysToDelete.length > 0) {
            await redis.del(...keysToDelete);
            console.log(`[Cache] Flushed ${keysToDelete.length} vendor cache keys:`, keysToDelete);
        }
    } catch (redisError) {
        console.warn('[Cache] Redis flush error:', redisError);
    }
}

// ==================== DESTINATIONS CACHE HELPER ====================
// Flush ALL destination-related cache keys
export async function flushDestinationsCache() {
    try {
        let cursor = '0';
        const keysToDelete: string[] = [];
        do {
            const [nextCursor, keys] = await redis.scan(
                cursor, 'MATCH', 'destinations_*', 'COUNT', 100
            );
            cursor = nextCursor;
            keysToDelete.push(...keys);
        } while (cursor !== '0');

        if (keysToDelete.length > 0) {
            await redis.del(...keysToDelete);
            console.log(`[Cache] Flushed ${keysToDelete.length} destination cache keys:`, keysToDelete);
        }
    } catch (redisError) {
        console.warn('[Cache] Destinations Redis flush error:', redisError);
    }
}

export const ES_VENDORS_INDEX = 'vendors';

export async function indexVendors(): Promise<void> {
    try {
        // Ensure index exists with proper mapping
        const indexExists = await esClient.indices.exists({ index: ES_VENDORS_INDEX });
        if (!indexExists.body) {
            await esClient.indices.create({
                index: ES_VENDORS_INDEX,
                body: {
                    mappings: {
                        properties: {
                            id: { type: 'integer' },
                            name: { type: 'text', analyzer: 'standard' },
                            description: { type: 'text', analyzer: 'standard' },
                            address: { type: 'text', analyzer: 'standard' },
                            category: { type: 'keyword' },
                            locationTags: { type: 'text', analyzer: 'standard' },
                            status: { type: 'keyword' },
                            rating: { type: 'float' },
                            lat: { type: 'float' },
                            lng: { type: 'float' },
                        },
                    },
                },
            });
            console.log(`[ES] Created index: ${ES_VENDORS_INDEX}`);
        }

        // Fetch all vendors from DB
        const allVendors = await db.select().from(vendors);

        if (allVendors.length === 0) {
            console.log('[ES] No vendors to index.');
            return;
        }

        // Bulk index
        const body = allVendors.flatMap((v) => [
            { index: { _index: ES_VENDORS_INDEX, _id: String(v.id) } },
            {
                id: v.id,
                name: v.name,
                description: v.description || '',
                address: v.address || '',
                category: v.category || '',
                locationTags: v.locationTags || '',
                status: v.status || '',
                rating: v.rating || 0,
                lat: v.lat,
                lng: v.lng,
                whatsapp: v.whatsapp || '',
                image: v.image || '',
                schedule: v.schedule,
            },
        ]);

        const { body: bulkResponse } = await esClient.bulk({ refresh: true, body });

        if (bulkResponse.errors) {
            const errorItems = bulkResponse.items.filter((item: any) => item.index?.error);
            console.error(`[ES] Bulk indexing had ${errorItems.length} errors:`, JSON.stringify(errorItems.slice(0, 3)));
        } else {
            console.log(`[ES] Successfully indexed ${allVendors.length} vendors.`);
        }
    } catch (err) {
        console.warn('[ES] indexVendors() failed (continuing):', (err as Error).message);
    }
}

// ==================== CATEGORY SLUG MAPPING ====================
// Maps category text values → page slug (for grouping)
export function getCategorySlug(v: { category?: string | null; categoryId?: number | null }): string {
    const cat = (v.category || '').toLowerCase();
    if (
        cat.includes('ngopi') || cat.includes('coffee') ||
        cat.includes('kopi') || cat.includes('cafe')
    ) return 'ngopi';
    if (
        cat.includes('atm') || cat.includes('minimarket') ||
        cat.includes('supermarket') || cat.includes('belanja') ||
        cat.includes('store')
    ) return 'atm';
    if (
        cat.includes('kuliner') || cat.includes('makanan') ||
        cat.includes('food') || cat.includes('restaurant') ||
        cat.includes('warung') || cat.includes('convenience')
    ) return 'kuliner';
    return 'lainnya';
}

// ==================== ELASTICSEARCH SEARCH ENDPOINT ====================
/**
 * GET /api/vendors/search?q=<term>&category=<cat>&station=<station>
 *
 * Uses Elasticsearch full-text search when a query term (q) is provided.
 * Falls back to Postgres when ES is unavailable or q is empty.
 */

// 1. Get All Vendors (Cached, with optional station-based sorting)

/**
 * GET /api/vendors/grouped?station=Blok+M
 * 
 * Returns vendors pre-grouped by category (kuliner/ngopi/atm/lainnya),
 * sorted: station-matching vendors first, others second.
 * Result is cached in Redis for 10 minutes per station.
 * Cache is busted whenever any vendor is created/updated/deleted from dashboard.
 *
 * Response shape:
 * {
 *   station: string,
 *   kuliner: Vendor[],
 *   ngopi:   Vendor[],
 *   atm:     Vendor[],
 *   lainnya: Vendor[],
 *   _cachedAt: ISO string,
 * }
 */

// 1b. Get Single Vendor

// 1c. Create Vendor

// 1c. Update Vendor (Invalidate Cache)

// 1d. Delete Vendor (Invalidate Cache)

// 2. Get Products by Vendor

// 2a. Create Product

// 2b. Update Product

// 2c. Delete Product

// 2b. Get All Destinations (Cached, with optional filtering + distance)

// 2c. Get Single Destination

// 2d. Create Destination

// 2e. Update Destination

// 2f. Delete Destination

// ==================== DESTINATION CATEGORIES ====================

// Get All Destination Categories (with optional type filter)

// Get Single Destination Category

// Create Destination Category

// Update Destination Category

// Delete Destination Category

// ==================== DESTINATION SUBCATEGORIES ====================

// Get All Destination Subcategories (with category info)

// Get Subcategories by Category ID

// Create Destination Subcategory

// Update Destination Subcategory

// Delete Destination Subcategory

// 3. Create Order

// 4. Get Orders — admin: all, user: by customer name or IDs

// 5. Update Order Status

// Seed Endpoint (For Demo Purposes)

// Seed Ngopi Vendors Only (Add without reset)

// Seed ATM/Minimarket/Supermarket Vendors Only (Add without reset)

// Seed Homepage Settings (Banners & Transport Links)

// 7. Pickup Order by Code

// ... (Existing orders/pickup endpoints)

// 8. Product Management (CRUD)
// Create Product

// Update Product

// Delete Product

// 9. Voucher Management
// Get Vouchers (Filtered by Vendor or Global)

// Create Voucher

// Delete Voucher

// 10. Upload Endpoint - Using MinIO

// ==================== CATEGORIES MANAGEMENT ====================

// Get all categories

// Get single category

// Create category

// Update category

// Delete category

// ==================== NAVIGATION ITEMS MANAGEMENT ====================

// Get all navigation items

// Get single navigation item

// Create navigation item

// Update navigation item

// Delete navigation item

// Reorder navigation items

// ==================== SETTINGS API ====================
// Get all settings

// Update multiple settings (Bulk Update)

// Get single setting by key

// Update or create setting

// ==================== CLEANUP API ====================
// Cleanup Duplicate Products Endpoint

// ==================== DESTINATIONS API ====================

// GET /api/destinations — all active destinations, optional ?type=publik|wisata filter

// Get destinations grouped by category (Cached)

// Get destination by ID

// Get transit directions to a destination

// Search destinations

// Get unique categories

// Get unique stations

// ==================== SUB-KATEGORI VENDOR ====================

// GET all subcategories (optionally filtered by categoryId)

// GET single subcategory

// POST create subcategory

// PUT update subcategory

// DELETE subcategory

// ==================== AREA / LOKASI ====================

// GET all location areas

// GET single location area

// POST create location area

// PUT update location area

// DELETE location area

// ==================== USER MANAGEMENT ====================

// GET all users (admin only) - with vendor name

// GET single user

// POST create user

// PUT update user

// DELETE user

// PATCH toggle active status

// PATCH reset password (super admin only)

// ==================== AUDIT LOGS API ====================

// GET audit logs with filters

// GET audit logs for a specific entity record

// ==================== LOCATION AREAS API ====================
// Daftar stasiun MRT yang tersedia (dari tabel location_areas)
// Dipakai dashboard untuk menampilkan opsi stasiun & sync data

// GET /api/location-areas — semua area/stasiun MRT aktif

// GET /api/location-areas/:slug — detail satu area

// ==================== CACHE MANAGEMENT API ====================

/**
 * POST /api/cache/flush-vendors
 * Flush semua cache vendor (list + grouped, semua stasiun).
 * Dipanggil dari dashboard saat perlu sync manual.
 * Biasanya tidak perlu manual — backend auto-flush saat CRUD vendor.
 */

/**
 * POST /api/cache/flush-destinations
 * Flush semua cache destination (list + grouped, semua variasi filter).
 * Dipanggil dari dashboard saat perlu sync manual.
 * Biasanya tidak perlu manual — backend auto-flush saat CRUD destination.
 */

/**
 * GET /api/vendors/cache-status
 * Cek status cache vendor per stasiun (TTL tersisa di Redis).
 * Berguna untuk debugging atau dashboard monitoring.
 */

const port = 3000;
const hostname = '0.0.0.0'; // Listen on all network interfaces

if (process.env.NODE_ENV !== 'test') {
    // Initialize MinIO storage
    initializeStorage().catch(err => {
        console.error('Failed to initialize storage:', err);
        console.warn('Continuing without MinIO storage...');
    });

    console.log(`Server is running on http://${hostname}:${port}`);
    console.log(`Network access: http://<your-ip>:${port}`);
    serve({
        fetch: app.fetch,
        port,
        hostname
    });
}
