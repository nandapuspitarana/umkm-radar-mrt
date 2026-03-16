import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { vendors, products, orders, settings, users, vouchers, assets, categories, navigationItems, destinations, destinationCategories, destinationSubcategories } from './db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import Redis from 'ioredis';
import { Client as ESClient } from '@elastic/elasticsearch';
import { initializeStorage, uploadToMinIO, deleteFromMinIO, PUBLIC_ASSET_URL, BUCKET_NAME } from './storage';

dotenv.config();

export const app = new Hono();

// Middleware
app.use('/*', cors());

// ==================== AUDIT LOG HELPER ====================
async function writeAuditLog(params: {
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
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/umkmradar',
});

const db = drizzle(pool);

// Redis Connection with error handling
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redis.on('error', (err) => {
    console.warn('Redis connection error:', err.message);
    console.warn('Continuing without Redis cache...');
});

redis.on('connect', () => {
    console.log('✅ Redis connected successfully');
});

const isProd = process.env.NODE_ENV === 'production';

// Helpers for cache control headers based on environment
const CACHE_CONTROL_LONG = isProd ? 'public, max-age=31536000' : 'no-cache, no-store, must-revalidate';
const CACHE_CONTROL_LONG_IMMUTABLE = isProd ? 'public, max-age=31536000, immutable' : 'no-cache, no-store, must-revalidate';
const CACHE_CONTROL_SHORT = isProd ? 'public, max-age=300, stale-while-revalidate=30' : 'no-cache, no-store, must-revalidate';

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
const esClient = new ESClient({
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
app.get('/api/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug: List files in MinIO bucket
app.get('/api/minio/list/:folder?', async (c) => {
    try {
        const { minioClient, BUCKET_NAME } = await import('./storage');
        const folder = c.req.param('folder') || '';

        const stream = minioClient.listObjects(BUCKET_NAME, folder, true);
        const files: any[] = [];

        for await (const obj of stream) {
            files.push({
                name: obj.name,
                size: obj.size,
                lastModified: obj.lastModified
            });
        }

        return c.json({ bucket: BUCKET_NAME, folder, files });
    } catch (error) {
        console.error('MinIO list error:', error);
        return c.json({ error: String(error) }, 500);
    }
});

// Proxy endpoint to serve MinIO assets via backend (for CORS issues)
app.get('/api/proxy/minio/*', async (c) => {
    try {
        const { minioClient, BUCKET_NAME } = await import('./storage');
        const path = c.req.path.replace('/api/proxy/minio/', '');

        // Get object from MinIO
        const stream = await minioClient.getObject(BUCKET_NAME, path);

        // Determine content type
        const ext = path.split('.').pop()?.toLowerCase();
        const mimeTypes: Record<string, string> = {
            'mp4': 'video/mp4',
            'webm': 'video/webm',
            'mov': 'video/quicktime',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'svg': 'image/svg+xml',
            'webp': 'image/webp'
        };

        const contentType = mimeTypes[ext || ''] || 'application/octet-stream';

        // Stream the file
        return new Response(stream as any, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': CACHE_CONTROL_LONG,
                'Access-Control-Allow-Origin': '*',
            }
        });
    } catch (error) {
        console.error('MinIO proxy error:', error);
        return c.json({ error: 'File not found in MinIO' }, 404);
    }
});

// Uploads proxy endpoint — serves files from MinIO
// For VIDEO files: redirect to a short-lived presigned URL. This lets Safari/iOS
//   talk directly to MinIO which natively handles Range requests (required for video).
// For IMAGE/other files: proxy through backend with proper ETag + cache headers.
app.get('/uploads/*', async (c) => {
    try {
        const { minioClient, BUCKET_NAME } = await import('./storage');
        // Remove /uploads/ prefix. URL fragments (#t=0.001) are stripped by browser before HTTP.
        const rawPath = c.req.path.replace('/uploads/', '').replace(/^\//, '');
        const cleanPath = rawPath.split('#')[0]; // safety strip

        // Determine content type
        const ext = cleanPath.split('.').pop()?.toLowerCase() ?? '';
        const mimeTypes: Record<string, string> = {
            'mp4': 'video/mp4',
            'webm': 'video/webm',
            'mov': 'video/quicktime',
            'm4v': 'video/mp4',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'svg': 'image/svg+xml',
            'webp': 'image/webp',
        };
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        const isVideo = ['mp4', 'webm', 'mov', 'm4v'].includes(ext);

        // ── VIDEO: proxy with Range request support ──
        // IMPORTANT: Do NOT redirect to PUBLIC_ASSET_URL — it may be localhost:9000 in prod,
        // which is inaccessible to browsers (causes net::ERR_SSL_PROTOCOL_ERROR).
        // Instead, proxy directly from MinIO internal endpoint with Range support.
        if (isVideo) {
            // Use internal MinIO URL (server-side, not browser-side)
            const minioInternal = (process.env.MINIO_URL || `http://${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || '9000'}`).replace(/\/$/, '');
            const videoInternalUrl = `${minioInternal}/${BUCKET_NAME}/${cleanPath}`;

            // Forward Range header (required for video seeking on Safari/iOS)
            const reqHeaders: Record<string, string> = {};
            const range = c.req.header('range');
            if (range) reqHeaders['Range'] = range;

            const upstream = await fetch(videoInternalUrl, { headers: reqHeaders });

            if (!upstream.ok && upstream.status !== 206) {
                return c.json({ error: 'Video not found' }, 404);
            }

            const resHeaders = new Headers();
            ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified'].forEach(key => {
                const val = upstream.headers.get(key);
                if (val) resHeaders.set(key, val);
            });
            if (!resHeaders.has('accept-ranges')) resHeaders.set('Accept-Ranges', 'bytes');
            resHeaders.set('Access-Control-Allow-Origin', '*');
            resHeaders.set('Cache-Control', CACHE_CONTROL_LONG);

            return new Response(upstream.body, {
                status: upstream.status,
                headers: resHeaders,
            });
        }

        // ── IMAGE / OTHER: proxy with ETag + 304 + cache headers ──
        let stat: any = null;
        try {
            stat = await minioClient.statObject(BUCKET_NAME, cleanPath);
        } catch (_) {
            return c.json({ error: 'File not found' }, 404);
        }

        const etag = stat.etag ? `"${stat.etag}"` : null;
        const lastModified = stat.lastModified ? new Date(stat.lastModified).toUTCString() : null;
        const size: number | undefined = stat.size;

        // 304 Not Modified — skip re-download if browser already has this version
        const ifNoneMatch = c.req.header('if-none-match');
        if (etag && ifNoneMatch === etag) {
            return new Response(null, {
                status: 304,
                headers: {
                    'ETag': etag,
                    'Cache-Control': CACHE_CONTROL_LONG_IMMUTABLE,
                }
            });
        }

        // Stream the image
        const stream = await minioClient.getObject(BUCKET_NAME, cleanPath);

        const headers: Record<string, string> = {
            'Content-Type': contentType,
            'Cache-Control': CACHE_CONTROL_LONG_IMMUTABLE,
            'Access-Control-Allow-Origin': '*',
        };
        if (etag) headers['ETag'] = etag;
        if (lastModified) headers['Last-Modified'] = lastModified;
        if (size !== undefined) headers['Content-Length'] = String(size);

        return new Response(stream as any, { headers });
    } catch (error) {
        console.error('Uploads proxy error:', error);
        return c.json({ error: 'File not found' }, 404);
    }
});

// Imgproxy Proxy Endpoint
const IMGPROXY_URL = process.env.IMGPROXY_URL || 'http://localhost:8088';

app.get('/api/image/*', async (c) => {
    try {
        const path = c.req.path.replace('/api/image', '');
        const query = c.req.query();

        // Default options if not provided
        const processingOptions = {
            resize: query.resize || 'fit',
            width: query.width || query.w || '0',
            height: query.height || query.h || '0',
            gravity: query.gravity || 'no',
            enlarge: query.enlarge || '0',
            extension: query.ext || 'webp'
        };

        // Construct imgproxy URL using path-based processing
        // Format: /resize:fit:300:200/gravity:no/plain/http://minio:9000/assets/banners/sample.jpg
        // Or using S3: /rs:fill:300:400/g:no/plain/s3://assets/banners/sample.jpg

        // Since imgproxy is in same docker network as minio, we use s3:// protocol
        // bucket name is 'assets', so path should be 'assets/...'

        // Clean path (remove leading slash)
        const assetPath = path.startsWith('/') ? path.substring(1) : path;

        // Construct processing path
        // url signature is disabled in dev mode (IMGPROXY_ALLOW_INSECURE_URLS=true)
        const processingPath = `/rs:${processingOptions.resize}:${processingOptions.width}:${processingOptions.height}:${processingOptions.enlarge}/g:${processingOptions.gravity}/plain/s3://${BUCKET_NAME}/${assetPath}@${processingOptions.extension}`;

        const imgproxyUrl = `${IMGPROXY_URL}${processingPath}`;

        console.log(`Proxying image: ${imgproxyUrl}`);

        const response = await fetch(imgproxyUrl);

        if (!response.ok) {
            console.error('Imgproxy error:', response.status, response.statusText);
            const status = response.status >= 400 && response.status < 600 ? response.status : 500;
            return c.json({ error: 'Image processing failed' }, status as any);
        }

        return new Response(response.body, {
            headers: {
                'Content-Type': response.headers.get('Content-Type') || 'image/webp',
                'Cache-Control': CACHE_CONTROL_LONG,
                'Access-Control-Allow-Origin': '*',
            }
        });
    } catch (error) {
        console.error('Imgproxy proxy error:', error);
        return c.json({ error: 'Image proxy failed' }, 500);
    }
});

// Raw Asset Proxy (Video/Files)
// No imgproxy processing, direct stream from MinIO
app.get('/api/raw/*', async (c) => {
    try {
        const path = c.req.path.replace('/api/raw/', '');
        let cleanPath = path.startsWith('/') ? path.substring(1) : path;

        // Strip "uploads/" prefix if present
        if (cleanPath.startsWith('uploads/')) {
            cleanPath = cleanPath.replace(/^uploads\//, '');
        }

        // Internal configuration (localhost for development)
        const minioHost = (process.env.MINIO_URL || 'http://localhost:9000').replace(/\/$/, '');
        const minioUri = `${minioHost}/${BUCKET_NAME}/${cleanPath}`;

        // Only forward Range header
        const reqHeaders: Record<string, string> = {};
        const range = c.req.header('range');
        if (range) reqHeaders['Range'] = range;

        console.log(`Proxying raw asset (video): ${minioUri} [Range: ${range || 'none'}]`);

        const response = await fetch(minioUri, { headers: reqHeaders });

        if (!response.ok) {
            console.error(`MinIO Raw Error: ${response.status} for ${minioUri}`);
            return c.text('File not found', response.status as any);
        }

        const resHeaders = new Headers();
        // Forward critical headers
        ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified'].forEach(key => {
            const val = response.headers.get(key);
            if (val) resHeaders.set(key, val);
        });

        if (!resHeaders.has('accept-ranges')) resHeaders.set('Accept-Ranges', 'bytes');
        resHeaders.set('Access-Control-Allow-Origin', '*');
        resHeaders.set('Cache-Control', CACHE_CONTROL_LONG);

        return new Response(response.body, {
            status: response.status,
            headers: resHeaders
        });
    } catch (e) {
        console.error('Raw proxy error', e);
        return c.text('Proxy error', 500);
    }
});


// File Upload Endpoint - Using MinIO
app.post('/api/assets/upload', async (c) => {
    try {
        const body = await c.req.parseBody();
        const file = body['file'] as File;
        const category = (body['category'] as string) || 'general';

        if (!file) {
            return c.json({ error: 'No file uploaded' }, 400);
        }

        // ── Server-side file type validation ──────────────────────────────
        const ALLOWED_MIME_TYPES = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
            'image/webp', 'image/svg+xml', 'image/avif',
            'video/mp4', 'video/webm', 'video/quicktime',
        ];
        const BLOCKED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
            'txt', 'csv', 'zip', 'rar', '7z', 'exe', 'apk', 'dmg', 'iso', 'xml', 'json'];

        const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
        const fileMime = file.type?.toLowerCase() || '';

        if (BLOCKED_EXTENSIONS.includes(fileExt) || (!ALLOWED_MIME_TYPES.includes(fileMime) && fileMime !== '')) {
            return c.json({
                error: `Tipe file tidak diizinkan (.${fileExt}). Hanya gambar (JPG, PNG, GIF, WebP, SVG) atau video (MP4, WebM, MOV) yang diterima.`
            }, 400);
        }
        // ──────────────────────────────────────────────────────────────────

        // Generate unique filename
        const timestamp = Date.now();
        const randomId = randomBytes(8).toString('hex');
        const ext = file.name.split('.').pop() || 'bin';
        const filename = `${timestamp}-${randomId}.${ext}`;

        // Determine folder based on category
        const folder = category === 'banner' ? 'banners' :
            category === 'logo' ? 'logo' :
                category === 'transport' ? 'transport' :
                    'general';

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Determine MIME type
        const mimeTypes: Record<string, string> = {
            'mp4': 'video/mp4',
            'webm': 'video/webm',
            'mov': 'video/quicktime',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'svg': 'image/svg+xml',
            'webp': 'image/webp'
        };

        const contentType = mimeTypes[ext.toLowerCase()] || 'application/octet-stream';

        // Upload to MinIO
        const publicUrl = await uploadToMinIO(buffer, filename, folder, contentType);

        // Save metadata to database
        const [inserted] = await db.insert(assets).values({
            filename: file.name,
            storagePath: `${folder}/${filename}`,
            mimeType: contentType,
            size: buffer.length,
            bucket: BUCKET_NAME,
            category: folder,
            alt: file.name,
        }).returning();

        // Return relative path for proxying instead of full MinIO URL
        const relativePath = `/uploads/${folder}/${filename}`;

        return c.json({
            success: true,
            directUrl: relativePath, // Relative path for proxy
            fullUrl: publicUrl, // Full MinIO URL for debugging
            filename,
            size: buffer.length,
            id: inserted.id,
            storagePath: inserted.storagePath,
        });
    } catch (error) {
        console.error('Upload error:', error);
        return c.json({ error: 'Upload failed' }, 500);
    }
});

// List all assets
app.get('/api/assets', async (c) => {
    try {
        const category = c.req.query('category');

        const result = category
            ? await db.select().from(assets).where(eq(assets.category, category)).orderBy(desc(assets.createdAt))
            : await db.select().from(assets).orderBy(desc(assets.createdAt));

        // Add URLs to each asset
        const assetsWithUrls = result.map(asset => {
            const directUrl = `${PUBLIC_ASSET_URL}/${asset.storagePath}`;
            return {
                ...asset,
                directUrl,
                thumbnailUrl: directUrl,
                imgproxyUrl: directUrl,
            };
        });

        return c.json(assetsWithUrls);
    } catch (error) {
        console.error('List assets error:', error);
        return c.json({ error: 'Failed to list assets' }, 500);
    }
});

// Get single asset metadata
app.get('/api/assets/:id', async (c) => {
    try {
        const id = parseInt(c.req.param('id'));

        const [asset] = await db.select().from(assets).where(eq(assets.id, id));

        if (!asset) {
            return c.json({ error: 'Asset not found' }, 404);
        }

        const directUrl = `${PUBLIC_ASSET_URL}/${asset.storagePath}`;

        return c.json({
            ...asset,
            directUrl,
            thumbnailUrl: directUrl,
            imgproxyUrl: directUrl,
        });
    } catch (error) {
        console.error('Get asset error:', error);
        return c.json({ error: 'Failed to get asset' }, 500);
    }
});

// Delete asset
app.delete('/api/assets/:id', async (c) => {
    try {
        const id = parseInt(c.req.param('id'));

        // Get asset info first
        const [asset] = await db.select().from(assets).where(eq(assets.id, id));

        if (!asset) {
            return c.json({ error: 'Asset not found' }, 404);
        }

        // Delete file from MinIO
        try {
            await deleteFromMinIO(asset.storagePath);
        } catch (e) {
            console.warn('Could not delete file from MinIO:', asset.storagePath);
        }

        // Delete from database
        await db.delete(assets).where(eq(assets.id, id));

        return c.json({ success: true, message: 'Asset deleted' });
    } catch (error) {
        console.error('Delete asset error:', error);
        return c.json({ error: 'Failed to delete asset' }, 500);
    }
});

// 0. Login
app.post('/api/login', async (c) => {
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

// 1. Get All Vendors (Cached, with optional station-based sorting)
// ==================== VENDOR CACHE HELPER ====================
// Flush ALL vendor-related cache keys (list + grouped, all stations)
async function flushVendorCache() {
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
async function flushDestinationsCache() {
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

const ES_VENDORS_INDEX = 'vendors';

async function indexVendors(): Promise<void> {
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
function getCategorySlug(v: { category?: string | null; categoryId?: number | null }): string {
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
app.get('/api/vendors/search', async (c) => {
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

// 1. Get All Vendors (Cached, with optional station-based sorting)
app.get('/api/vendors', async (c) => {
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
app.get('/api/vendors/grouped', async (c) => {
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


// 1b. Get Single Vendor
app.get('/api/vendors/:id', async (c) => {
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

// 1c. Create Vendor

app.post('/api/vendors/bulk', async (c) => {
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

app.post('/api/vendors', async (c) => {
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

// 1c. Update Vendor (Invalidate Cache)
app.put('/api/vendors/:id', async (c) => {
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

// 1d. Delete Vendor (Invalidate Cache)
app.delete('/api/vendors/:id', async (c) => {
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

// 2. Get Products by Vendor
app.get('/api/products', async (c) => {
    const vendorId = c.req.query('vendorId');
    if (!vendorId) return c.json({ error: 'vendorId required' }, 400);

    try {
        const result = await db.select().from(products).where(eq(products.vendorId, parseInt(vendorId)));
        return c.json(result);
    } catch (error) {
        console.error('Failed to fetch products:', error);
        return c.json({ error: 'Failed to fetch products', details: String(error) }, 500);
        return c.json({ error: 'Failed to fetch products' }, 500);
    }
});

// 2a. Create Product
app.post('/api/products', async (c) => {
    try {
        const body = await c.req.json();
        if (!body.vendorId || !body.name || body.price === undefined) {
            return c.json({ error: 'vendorId, name, and price are required' }, 400);
        }
        const result = await db.insert(products).values({
            vendorId: parseInt(body.vendorId),
            name: body.name,
            price: parseInt(body.price),
            originalPrice: body.originalPrice ? parseInt(body.originalPrice) : null,
            discountPrice: body.discountPrice ? parseInt(body.discountPrice) : null,
            category: body.category || 'Umum',
            image: body.image || '',
            description: body.description || null,
            isAvailable: body.isAvailable !== undefined ? body.isAvailable : true,
            rating: 0,
        }).returning();
        await flushDestinationsCache();
        return c.json(result[0]);
    } catch (error) {
        console.error('Create Product Error:', error);
        return c.json({ error: 'Failed to create product' }, 500);
    }
});

// 2b. Update Product
app.put('/api/products/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const body = await c.req.json();
        const updateData: Record<string, any> = {};
        if (body.name !== undefined) updateData.name = body.name;
        if (body.price !== undefined) updateData.price = parseInt(body.price);
        if (body.originalPrice !== undefined) updateData.originalPrice = body.originalPrice ? parseInt(body.originalPrice) : null;
        if (body.discountPrice !== undefined) updateData.discountPrice = body.discountPrice ? parseInt(body.discountPrice) : null;
        if (body.category !== undefined) updateData.category = body.category;
        if (body.image !== undefined) updateData.image = body.image;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.isAvailable !== undefined) updateData.isAvailable = body.isAvailable;

        const result = await db.update(products)
            .set(updateData)
            .where(eq(products.id, parseInt(id)))
            .returning();

        if (result.length === 0) return c.json({ error: 'Product not found' }, 404);
        await flushDestinationsCache();
        return c.json(result[0]);
    } catch (error) {
        console.error('Update Product Error:', error);
        return c.json({ error: 'Failed to update product' }, 500);
    }
});

// 2c. Delete Product
app.delete('/api/products/:id', async (c) => {
    const id = c.req.param('id');
    try {
        await db.delete(products).where(eq(products.id, parseInt(id)));
        return c.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Delete Product Error:', error);
        return c.json({ error: 'Failed to delete product' }, 500);
    }
});

// 2b. Get All Destinations (Cached, with optional filtering + distance)
app.get('/api/destinations', async (c) => {
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
            result = result.filter(d => d.category.toLowerCase().includes(category.toLowerCase()));
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

// 2c. Get Single Destination
app.get('/api/destinations/:id', async (c) => {
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

// 2d. Create Destination

app.post('/api/destinations/bulk', async (c) => {
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

app.post('/api/destinations', async (c) => {
    try {
        const body = await c.req.json();
        if (!body.name || !body.lat || !body.lng) {
            return c.json({ error: 'Name, Latitude, and Longitude are required' }, 400);
        }

        const result = await db.insert(destinations).values(body).returning();
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

// 2e. Update Destination
app.put('/api/destinations/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const body = await c.req.json();

        // Fetch old data for audit
        const oldResult = await db.select().from(destinations).where(eq(destinations.id, parseInt(id)));
        const oldData = oldResult[0];

        // Sanitize: only pick known schema fields
        const allowed = [
            'name', 'description', 'lat', 'lng', 'category', 'subcategory',
            'address', 'image', 'nearestStation', 'stationType',
            'distanceFromStation', 'walkingTimeMinutes',
            'openingHours', 'ticketPrice', 'contact', 'website',
            'transitHints', 'isActive', 'categoryId', 'subcategoryId'
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

// 2f. Delete Destination
app.delete('/api/destinations/:id', async (c) => {
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

// ==================== DESTINATION CATEGORIES ====================

// Get All Destination Categories (with optional type filter)
app.get('/api/destination-categories', async (c) => {
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

// Get Single Destination Category
app.get('/api/destination-categories/:id', async (c) => {
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

// Create Destination Category
app.post('/api/destination-categories', async (c) => {
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

// Update Destination Category
app.put('/api/destination-categories/:id', async (c) => {
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

// Delete Destination Category
app.delete('/api/destination-categories/:id', async (c) => {
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

// ==================== DESTINATION SUBCATEGORIES ====================

// Get All Destination Subcategories (with category info)
app.get('/api/destination-subcategories', async (c) => {
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

// Get Subcategories by Category ID
app.get('/api/destination-subcategories/by-category/:categoryId', async (c) => {
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

// Create Destination Subcategory
app.post('/api/destination-subcategories', async (c) => {
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

// Update Destination Subcategory
app.put('/api/destination-subcategories/:id', async (c) => {
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

// Delete Destination Subcategory
app.delete('/api/destination-subcategories/:id', async (c) => {
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

// 3. Create Order
app.post('/api/orders', async (c) => {
    try {
        const body = await c.req.json();
        // Validate body here...

        // Generate 6 digit pickup code
        const pickupCode = Math.floor(100000 + Math.random() * 900000).toString();

        const result = await db.insert(orders).values({
            vendorId: body.vendorId,
            customer: body.customer,
            total: body.total,
            items: body.items,
            status: 'pending',
            pickupCode: pickupCode
        }).returning();

        await flushDestinationsCache();
        return c.json(result[0]);
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Failed to create order' }, 500);
    }
});

// 4. Get Orders (for Dashboard)
app.get('/api/orders', async (c) => {
    try {
        const result = await db.select().from(orders).orderBy(desc(orders.createdAt));
        return c.json(result);
    } catch (error) {
        return c.json({ error: 'Failed to fetch orders' }, 500);
    }
});

// 5. Update Order Status
app.patch('/api/orders/:id/status', async (c) => {
    const id = c.req.param('id');
    const { status } = await c.req.json();

    try {
        const result = await db.update(orders)
            .set({ status })
            .where(eq(orders.id, parseInt(id)))
            .returning();
        await flushDestinationsCache();
        return c.json(result[0]);
    } catch (error) {
        return c.json({ error: 'Failed to update status' }, 500);
    }
});


// Seed Endpoint (For Demo Purposes)

app.post('/api/seed-destinations', async (c) => {
    const existing = await db.select().from(destinations);
    if (existing.length > 0) {
        return c.json({ message: 'Destinations already seeded', count: existing.length });
    }

    const data = [
        // Publik - Ruang Terbuka & Olahraga
        {
            name: "Taman Literasi Martha Christina Tiahahu",
            description: "Taman hijau terbuka di jantung Blok M, lengkap dengan perpustakaan mini, area baca, dan tempat bersantai.",
            lat: -6.2435, lng: 106.7997,
            category: "Publik", subcategory: "Ruang Terbuka & Olahraga",
            address: "Jl. Sisingamangaraja, Blok M, Jakarta Selatan",
            image: "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=600&h=400&fit=crop",
            nearestStation: "Stasiun MRT Blok M", stationType: "MRT",
            distanceFromStation: 150, walkingTimeMinutes: 2, ticketPrice: "Gratis"
        },
        {
            name: "GOR Bulungan",
            description: "Gelanggang Olahraga serbaguna yang sering digunakan untuk turnamen basket, voli, dan bulu tangkis.",
            lat: -6.2415, lng: 106.7960,
            category: "Publik", subcategory: "Ruang Terbuka & Olahraga",
            address: "Jl. Bulungan No.1, Blok M, Jakarta Selatan",
            image: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=600&h=400&fit=crop",
            nearestStation: "Stasiun MRT Blok M", stationType: "MRT",
            distanceFromStation: 500, walkingTimeMinutes: 7, ticketPrice: "Bervariasi"
        },
        // Publik - Mall & Plaza Terbuka
        {
            name: "Blok M Square",
            description: "Pusat perbelanjaan ikonik dengan ribuan kios, pujasera, dan pusat elektronik.",
            lat: -6.2442, lng: 106.7990,
            category: "Publik", subcategory: "Mall & Plaza Terbuka",
            address: "Jl. Melawai 5, Blok M, Jakarta Selatan",
            image: "https://images.unsplash.com/photo-1555529733-0e670560f7e1?w=600&h=400&fit=crop",
            nearestStation: "Stasiun MRT Blok M", stationType: "MRT",
            distanceFromStation: 300, walkingTimeMinutes: 4, ticketPrice: "Gratis"
        },
        // Publik - Infrastruktur Pejalan & Transit
        {
            name: "Terminal Blok M",
            description: "Terminal terpadu modern yang terhubung langsung dengan TransJakarta dan MRT.",
            lat: -6.2430, lng: 106.8010,
            category: "Publik", subcategory: "Infrastruktur Pejalan & Transit",
            address: "Kawasan Terminal Blok M, Jakarta Selatan",
            image: "https://images.unsplash.com/photo-1506452583856-11f621980862?w=600&h=400&fit=crop",
            nearestStation: "Stasiun MRT Blok M", stationType: "MRT",
            distanceFromStation: 50, walkingTimeMinutes: 1, ticketPrice: "Gratis"
        },
        // Publik - Fasilitas Sosial & Keagamaan
        {
            name: "Masjid Nurul Iman Blok M Square",
            description: "Masjid luas dan nyaman yang terletak di rooftop Blok M Square.",
            lat: -6.2442, lng: 106.7990,
            category: "Publik", subcategory: "Fasilitas Sosial & Keagamaan",
            address: "Lantai 7 Blok M Square, Jakarta Selatan",
            image: "https://images.unsplash.com/photo-1542382156909-9ae37b3f56fd?w=600&h=400&fit=crop",
            nearestStation: "Stasiun MRT Blok M", stationType: "MRT",
            distanceFromStation: 300, walkingTimeMinutes: 4, ticketPrice: "Gratis"
        },
        // Wisata - Belanja
        {
            name: "Little Tokyo Melawai",
            description: "Kawasan belanja dan kuliner bernuansa Jepang otentik dengan berbagai restoran legendaris.",
            lat: -6.2450, lng: 106.8000,
            category: "belanja", subcategory: null,
            address: "Kawasan Melawai, Blok M, Jakarta Selatan",
            image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&h=400&fit=crop",
            nearestStation: "Stasiun MRT Blok M", stationType: "MRT",
            distanceFromStation: 400, walkingTimeMinutes: 6, ticketPrice: "Gratis"
        },
        {
            name: "Pasaraya Blok M",
            description: "Pusat perbelanjaan yang menampilkan kerajinan tangan, batik, dan suvenir khas Indonesia.",
            lat: -6.2420, lng: 106.8015,
            category: "belanja", subcategory: null,
            address: "Jl. Iskandarsyah II No.2, Blok M, Jakarta Selatan",
            image: "https://images.unsplash.com/photo-1519999482648-25049ddd37b1?w=600&h=400&fit=crop",
            nearestStation: "Stasiun MRT Blok M", stationType: "MRT",
            distanceFromStation: 600, walkingTimeMinutes: 8, ticketPrice: "Gratis"
        },
        // Wisata - Budaya & Seni
        {
            name: "M Bloc Space",
            description: "Pusat kreatif komunal dengan live music, restoran, dan ruang ekshibisi seni, dulunya adalah rumah dinas Peruri.",
            lat: -6.2435, lng: 106.7985,
            category: "budaya-seni", subcategory: null,
            address: "Jl. Panglima Polim No.37, Blok M, Jakarta Selatan",
            image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=400&fit=crop",
            nearestStation: "Stasiun MRT Blok M", stationType: "MRT",
            distanceFromStation: 200, walkingTimeMinutes: 3, ticketPrice: "Mulai Rp 20.000"
        }
    ];

    const result = await db.insert(destinations).values(data).returning();
    await flushDestinationsCache();
    return c.json({ message: 'Blok M destinations seeded successfully', count: result.length, data: result });
});


app.post('/api/seed', async (c) => {
    // Check if vendors exist
    const v = await db.select().from(vendors);

    if (v.length > 0) {
        console.log("Vendors already seeded. Checking users...");

        // Check if users exist
        const u = await db.select().from(users);
        if (u.length > 0) {
            return c.json({ message: 'Already seeded (Full)' });
        }

        // Seed users for existing vendors
        const adminExists = await db.select().from(users).where(eq(users.email, 'admin@umkmradar.com'));
        if (adminExists.length === 0) {
            await db.insert(users).values([
                {
                    email: 'admin@umkmradar.com',
                    password: 'admin',
                    role: 'admin',
                    name: 'Super Admin',
                    vendorId: null
                },
                {
                    email: 'mitra1@umkmradar.com',
                    password: 'mitra',
                    role: 'vendor',
                    name: 'Owner Warung Betawi',
                    vendorId: v[0].id
                }
            ]);
        }

        await redis.del('vendors_list');
        return c.json({ message: 'Users seeded for existing vendors' });
    }

    // Seed Vendors based on Figma design - Kuliner near MRT Blok M
    const vendorData = [
        {
            name: "Warung Betawi Babeh Patal Blok M",
            lat: -6.2273,
            lng: 106.8021,
            whatsapp: "6281234567890",
            address: "Jalan Patal Blok M No. 7",
            image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"], open: "07:00", close: "12:00" },
            status: "approved",
            category: "Kuliner",
            rating: 4.8,
            locationTags: "Dekat MRT Blok M, Patal Blok M",
            description: "Nasi uduk, Ketupat sayur, Lontong, Ketan, Gorengan"
        },
        {
            name: "Tenda Bang Jali",
            lat: -6.2268,
            lng: 106.8015,
            whatsapp: "6281234567891",
            address: "Blok C 28",
            image: "https://images.unsplash.com/photo-1547573854-74d2a71d0826?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"], open: "06:00", close: "10:00" },
            status: "approved",
            category: "Kuliner",
            rating: 4.7,
            locationTags: "Dekat MRT Blok M",
            description: "Nasi uduk, Ketupat sayur, Lontong, Ketan, Gorengan"
        },
        {
            name: "Warung Padang Uni Ami",
            lat: -6.2271,
            lng: 106.8018,
            whatsapp: "6281234567892",
            address: "Blok D 12",
            image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"], open: "06:00", close: "10:00" },
            status: "approved",
            category: "Kuliner",
            rating: 4.9,
            locationTags: "Dekat MRT Blok M",
            description: "Ketupat padang, gorengan, kripik, bubur kampiun"
        },
        {
            name: "Mie Ayam Gaul Blok M",
            lat: -6.2280,
            lng: 106.8028,
            whatsapp: "6281234567893",
            address: "Area Sudirman, arah pintu FX Sudirman dari MRT Blok M",
            image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"], open: "06:00", close: "16:00" },
            status: "approved",
            category: "Kuliner",
            rating: 4.6,
            locationTags: "FX Sudirman, MRT Blok M",
            description: "Mie Ayam toping lengkap"
        },
        {
            name: "Bubur Ayam Jakarta",
            lat: -6.2275,
            lng: 106.8025,
            whatsapp: "6281234567894",
            address: "Sekitar kawasan FX Sudirman, jalur pejalan kaki dari MRT",
            image: "https://images.unsplash.com/photo-1584269600519-112d071b35e6?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"], open: "06:00", close: "10:00" },
            status: "approved",
            category: "Kuliner",
            rating: 4.5,
            locationTags: "FX Sudirman, MRT Blok M",
            description: "Bubur biasa & spesial. Topping sate, telur, ampela, usus, ati"
        },
        {
            name: "Sedjuk Bakmi & Kopi",
            lat: -6.2282,
            lng: 106.8022,
            whatsapp: "6281234567895",
            address: "Koridor Sudirman–Blok M, dekat akses pejalan kaki MRT",
            image: "https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"], open: "06:00", close: "21:00" },
            status: "approved",
            category: "Kuliner",
            rating: 4.7,
            locationTags: "Koridor Sudirman, MRT Blok M",
            description: "Bakmi & Kopi"
        },
        {
            name: "Indomaret Point",
            lat: -6.2278,
            lng: 106.8030,
            whatsapp: "6281234567896",
            address: "Blok B 45",
            image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"], open: "05:00", close: "22:00" },
            status: "approved",
            category: "Convenience Store",
            rating: 4.3,
            locationTags: "Dekat MRT Blok M",
            description: "Roti tawar & Isi, onigiri, Sosis, Salad buah"
        },
        {
            name: "Lawson",
            lat: -6.2285,
            lng: 106.8035,
            whatsapp: "6281234567897",
            address: "Blok B 82",
            image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"], open: "05:30", close: "22:00" },
            status: "approved",
            category: "Convenience Store",
            rating: 4.4,
            locationTags: "Dekat MRT Blok M",
            description: "Roti tawar & Isi, onigiri, Sosis, Salad buah"
        },
        {
            name: "Family Mart",
            lat: -6.2290,
            lng: 106.8040,
            whatsapp: "6281234567898",
            address: "Blok A 12",
            image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"], open: "05:00", close: "22:00" },
            status: "approved",
            category: "Convenience Store",
            rating: 4.2,
            locationTags: "Dekat MRT Blok M",
            description: "Roti tawar & Isi, onigiri, Sosis, Salad buah"
        },
        // Ngopi/Coffee Shops based on Figma design
        {
            name: "Kopi Kenangan",
            lat: -6.2274,
            lng: 106.8020,
            whatsapp: "6281234567899",
            address: "FX Sudirman Lt. GF",
            image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"], open: "08:00", close: "21:00" },
            status: "approved",
            category: "Ngopi",
            rating: 4.7,
            locationTags: "FX Sudirman, MRT Blok M",
            description: "Es Kopi Kenangan, Kopi Susu, Snacks"
        },
        {
            name: "Djournal Coffee",
            lat: -6.2276,
            lng: 106.8019,
            whatsapp: "6281234567900",
            address: "FX Sudirman Lt. G",
            image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"], open: "08:00", close: "21:00" },
            status: "approved",
            category: "Ngopi",
            rating: 4.6,
            locationTags: "FX Sudirman, MRT Blok M",
            description: "Specialty Coffee, Latte Art, Pastries"
        },
        {
            name: "Starbucks",
            lat: -6.2279,
            lng: 106.8023,
            whatsapp: "6281234567901",
            address: "FX Sudirman Lt. G",
            image: "https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"], open: "08:00", close: "21:00" },
            status: "approved",
            category: "Ngopi",
            rating: 4.5,
            locationTags: "FX Sudirman, MRT Blok M",
            description: "Espresso, Frappuccino, Tea, Pastries"
        },
        {
            name: "Fore Coffee",
            lat: -6.2281,
            lng: 106.8024,
            whatsapp: "6281234567902",
            address: "FX Sudirman Lt. G",
            image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"], open: "08:00", close: "21:00" },
            status: "approved",
            category: "Ngopi",
            rating: 4.6,
            locationTags: "FX Sudirman, MRT Blok M",
            description: "Kopi Lokal, Es Kopi Susu, Single Origin"
        },
        {
            name: "Anomali Coffee",
            lat: -6.2340,
            lng: 106.8010,
            whatsapp: "6281234567903",
            address: "Jl. Senopati Raya 115",
            image: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"], open: "08:00", close: "23:00" },
            status: "approved",
            category: "Ngopi",
            rating: 4.8,
            locationTags: "Senopati, MRT Blok M",
            description: "Single Origin Indonesia, Manual Brew, Pour Over"
        },
        {
            name: "Kopi Kalyan",
            lat: -6.2345,
            lng: 106.8015,
            whatsapp: "6281234567904",
            address: "Jl. Senopati Raya No. 28",
            image: "https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"], open: "06:00", close: "21:00" },
            status: "approved",
            category: "Ngopi",
            rating: 4.5,
            locationTags: "Senopati, MRT Blok M",
            description: "Specialty Coffee, Cold Brew, V60"
        },
        {
            name: "Giyanti Coffee Roastery",
            lat: -6.1995,
            lng: 106.8400,
            whatsapp: "6281234567905",
            address: "Jl. Surabaya No. 20, Menteng",
            image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"], open: "06:00", close: "21:00" },
            status: "approved",
            category: "Ngopi",
            rating: 4.9,
            locationTags: "Menteng, Area Jakarta Selatan",
            description: "Artisan Coffee, Fresh Roasted Beans, Coffee Lab"
        },
        {
            name: "Common Grounds",
            lat: -6.2265,
            lng: 106.7990,
            whatsapp: "6281234567906",
            address: "Plaza Blok M Lt. 2",
            image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"], open: "10:00", close: "21:00" },
            status: "approved",
            category: "Ngopi",
            rating: 4.7,
            locationTags: "Plaza Blok M, MRT Blok M",
            description: "Specialty Coffee, Australian Style, Brunch"
        },
        {
            name: "Union Coffee",
            lat: -6.2268,
            lng: 106.7992,
            whatsapp: "6281234567907",
            address: "Plaza Blok M Lt. 1",
            image: "https://images.unsplash.com/photo-1498804103079-a6351b050096?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"], open: "10:00", close: "21:00" },
            status: "approved",
            category: "Ngopi",
            rating: 4.6,
            locationTags: "Plaza Blok M, MRT Blok M",
            description: "Espresso Based, Cold Brew, Light Snacks"
        }
    ];

    // Insert vendors
    const insertedVendors = [];
    for (const vendor of vendorData) {
        const [newVendor] = await db.insert(vendors).values(vendor as any).returning();
        insertedVendors.push(newVendor);
    }

    // Seed Products for each vendor
    const productData = [
        // Warung Betawi Babeh
        { vendorId: insertedVendors[0].id, name: "Nasi Uduk Komplit", price: 18000, category: "Nasi", image: "https://images.unsplash.com/photo-1547573854-74d2a71d0826?w=400&h=400&fit=crop", description: "Nasi uduk dengan lauk lengkap" },
        { vendorId: insertedVendors[0].id, name: "Ketupat Sayur", price: 15000, category: "Ketupat", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop", description: "Ketupat dengan kuah sayur khas Betawi" },
        { vendorId: insertedVendors[0].id, name: "Lontong Sayur", price: 15000, category: "Lontong", image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=400&fit=crop", description: "Lontong dengan kuah santan gurih" },
        { vendorId: insertedVendors[0].id, name: "Gorengan (5 pcs)", price: 10000, category: "Gorengan", image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=400&fit=crop", description: "Aneka gorengan renyah" },

        // Tenda Bang Jali
        { vendorId: insertedVendors[1].id, name: "Nasi Uduk Spesial", price: 20000, category: "Nasi", image: "https://images.unsplash.com/photo-1547573854-74d2a71d0826?w=400&h=400&fit=crop", description: "Nasi uduk dengan ayam goreng" },
        { vendorId: insertedVendors[1].id, name: "Ketan Serundeng", price: 8000, category: "Ketan", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop", description: "Ketan dengan serundeng kelapa" },

        // Warung Padang Uni Ami  
        { vendorId: insertedVendors[2].id, name: "Ketupat Sayur Padang", price: 18000, category: "Ketupat", image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=400&fit=crop", description: "Ketupat dengan kuah padang" },
        { vendorId: insertedVendors[2].id, name: "Bubur Kampiun", price: 12000, category: "Bubur", image: "https://images.unsplash.com/photo-1584269600519-112d071b35e6?w=400&h=400&fit=crop", description: "Bubur manis khas Padang" },
        { vendorId: insertedVendors[2].id, name: "Gorengan Mix", price: 12000, category: "Gorengan", image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=400&fit=crop", description: "Aneka gorengan bakwan, tahu, tempe" },

        // Mie Ayam Gaul Blok M
        { vendorId: insertedVendors[3].id, name: "Mie Ayam Biasa", price: 15000, category: "Mie", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop", description: "Mie ayam dengan bakso" },
        { vendorId: insertedVendors[3].id, name: "Mie Ayam Komplit", price: 22000, category: "Mie", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop", description: "Mie ayam dengan topping lengkap" },
        { vendorId: insertedVendors[3].id, name: "Mie Ayam Jumbo", price: 25000, category: "Mie", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop", description: "Porsi jumbo untuk yang lapar" },

        // Bubur Ayam Jakarta
        { vendorId: insertedVendors[4].id, name: "Bubur Ayam Biasa", price: 12000, category: "Bubur", image: "https://images.unsplash.com/photo-1584269600519-112d071b35e6?w=400&h=400&fit=crop", description: "Bubur ayam dengan cakue" },
        { vendorId: insertedVendors[4].id, name: "Bubur Ayam Spesial", price: 18000, category: "Bubur", image: "https://images.unsplash.com/photo-1584269600519-112d071b35e6?w=400&h=400&fit=crop", description: "Bubur dengan sate, telur, ampela, usus, ati" },
        { vendorId: insertedVendors[4].id, name: "Bubur Ayam Komplit", price: 25000, category: "Bubur", image: "https://images.unsplash.com/photo-1584269600519-112d071b35e6?w=400&h=400&fit=crop", description: "Bubur dengan semua topping" },

        // Sedjuk Bakmi & Kopi
        { vendorId: insertedVendors[5].id, name: "Bakmi Ayam", price: 18000, category: "Bakmi", image: "https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&h=400&fit=crop", description: "Bakmi dengan ayam kecap" },
        { vendorId: insertedVendors[5].id, name: "Bakmi Pangsit", price: 22000, category: "Bakmi", image: "https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&h=400&fit=crop", description: "Bakmi dengan pangsit goreng" },
        { vendorId: insertedVendors[5].id, name: "Kopi Susu", price: 15000, category: "Minuman", image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop", description: "Kopi susu gula aren" },
        { vendorId: insertedVendors[5].id, name: "Es Kopi", price: 18000, category: "Minuman", image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop", description: "Es kopi susu segar" },

        // Indomaret Point
        { vendorId: insertedVendors[6].id, name: "Onigiri Salmon", price: 12000, category: "Snack", image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=400&fit=crop", description: "Nasi kepal isi salmon" },
        { vendorId: insertedVendors[6].id, name: "Roti Isi Coklat", price: 8500, category: "Roti", image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=400&fit=crop", description: "Roti tawar isi coklat" },
        { vendorId: insertedVendors[6].id, name: "Salad Buah", price: 15000, category: "Snack", image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=400&fit=crop", description: "Salad buah segar dengan yogurt" },

        // Lawson
        { vendorId: insertedVendors[7].id, name: "Onigiri Tuna", price: 13000, category: "Snack", image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=400&fit=crop", description: "Nasi kepal isi tuna mayo" },
        { vendorId: insertedVendors[7].id, name: "Oden Set", price: 25000, category: "Snack", image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=400&fit=crop", description: "Aneka oden Jepang" },
        { vendorId: insertedVendors[7].id, name: "Sosis Panggang", price: 12000, category: "Snack", image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=400&fit=crop", description: "Sosis panggang crispy" },

        // Family Mart
        { vendorId: insertedVendors[8].id, name: "Famichiki", price: 16000, category: "Snack", image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=400&fit=crop", description: "Ayam goreng crispy signature" },
        { vendorId: insertedVendors[8].id, name: "Onigiri Teriyaki", price: 12000, category: "Snack", image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=400&fit=crop", description: "Nasi kepal isi teriyaki" },
        { vendorId: insertedVendors[8].id, name: "Salad Sayur", price: 18000, category: "Snack", image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=400&fit=crop", description: "Salad sayuran segar" },

        // Kopi Kenangan (index 9)
        { vendorId: insertedVendors[9].id, name: "Es Kopi Kenangan Mantan", price: 18000, category: "Kopi", image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop", description: "Signature coffee dengan gula aren" },
        { vendorId: insertedVendors[9].id, name: "Es Kopi Kenangan Caramel", price: 22000, category: "Kopi", image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop", description: "Kopi susu dengan caramel" },
        { vendorId: insertedVendors[9].id, name: "Matcha Latte", price: 25000, category: "Non-Kopi", image: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400&h=400&fit=crop", description: "Green tea latte creamy" },

        // Djournal Coffee (index 10)
        { vendorId: insertedVendors[10].id, name: "Cafe Latte", price: 35000, category: "Kopi", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop", description: "Espresso dengan steamed milk" },
        { vendorId: insertedVendors[10].id, name: "Cappuccino", price: 35000, category: "Kopi", image: "https://images.unsplash.com/photo-1557006021-b85faa2bc5e2?w=400&h=400&fit=crop", description: "Espresso dengan foam tebal" },
        { vendorId: insertedVendors[10].id, name: "Croissant", price: 28000, category: "Pastry", image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=400&fit=crop", description: "French butter croissant" },

        // Starbucks (index 11)
        { vendorId: insertedVendors[11].id, name: "Caramel Macchiato", price: 55000, category: "Kopi", image: "https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=400&h=400&fit=crop", description: "Espresso vanilla caramel" },
        { vendorId: insertedVendors[11].id, name: "Java Chip Frappuccino", price: 58000, category: "Blended", image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop", description: "Blended mocha chocolate chip" },
        { vendorId: insertedVendors[11].id, name: "Green Tea Latte", price: 50000, category: "Non-Kopi", image: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400&h=400&fit=crop", description: "Matcha dengan steamed milk" },

        // Fore Coffee (index 12)
        { vendorId: insertedVendors[12].id, name: "Aren Latte", price: 28000, category: "Kopi", image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop", description: "Kopi susu gula aren" },
        { vendorId: insertedVendors[12].id, name: "Butterscotch Latte", price: 32000, category: "Kopi", image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop", description: "Kopi dengan butterscotch" },
        { vendorId: insertedVendors[12].id, name: "Cold Brew", price: 25000, category: "Kopi", image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop", description: "Cold brew 12 jam" },

        // Anomali Coffee (index 13)
        { vendorId: insertedVendors[13].id, name: "Aceh Gayo Pour Over", price: 45000, category: "Single Origin", image: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&h=400&fit=crop", description: "Pour over single origin Aceh" },
        { vendorId: insertedVendors[13].id, name: "Toraja V60", price: 48000, category: "Single Origin", image: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&h=400&fit=crop", description: "V60 single origin Toraja" },
        { vendorId: insertedVendors[13].id, name: "Espresso Double", price: 35000, category: "Kopi", image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&h=400&fit=crop", description: "Double shot espresso" },

        // Kopi Kalyan (index 14)
        { vendorId: insertedVendors[14].id, name: "Cold Brew Black", price: 32000, category: "Kopi", image: "https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=400&h=400&fit=crop", description: "Cold brew tanpa susu" },
        { vendorId: insertedVendors[14].id, name: "Kalyan Signature", price: 35000, category: "Kopi", image: "https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=400&h=400&fit=crop", description: "Signature coffee blend" },
        { vendorId: insertedVendors[14].id, name: "V60 Single Origin", price: 42000, category: "Single Origin", image: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&h=400&fit=crop", description: "Manual brew V60" },

        // Giyanti Coffee Roastery (index 15)
        { vendorId: insertedVendors[15].id, name: "House Blend Espresso", price: 28000, category: "Kopi", image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&h=400&fit=crop", description: "House blend espresso" },
        { vendorId: insertedVendors[15].id, name: "Syphon Brew", price: 55000, category: "Single Origin", image: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&h=400&fit=crop", description: "Artisan syphon brewing" },
        { vendorId: insertedVendors[15].id, name: "Coffee Beans 250g", price: 120000, category: "Retail", image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&h=400&fit=crop", description: "Fresh roasted beans" },

        // Common Grounds (index 16)
        { vendorId: insertedVendors[16].id, name: "Flat White", price: 45000, category: "Kopi", image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=400&fit=crop", description: "Australian style flat white" },
        { vendorId: insertedVendors[16].id, name: "Long Black", price: 40000, category: "Kopi", image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=400&fit=crop", description: "Double shot americano" },
        { vendorId: insertedVendors[16].id, name: "Avocado Toast", price: 65000, category: "Food", image: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400&h=400&fit=crop", description: "Brunch favorite" },

        // Union Coffee (index 17)
        { vendorId: insertedVendors[17].id, name: "Piccolo Latte", price: 38000, category: "Kopi", image: "https://images.unsplash.com/photo-1498804103079-a6351b050096?w=400&h=400&fit=crop", description: "Small latte dengan ristretto" },
        { vendorId: insertedVendors[17].id, name: "Iced Long Black", price: 35000, category: "Kopi", image: "https://images.unsplash.com/photo-1498804103079-a6351b050096?w=400&h=400&fit=crop", description: "Es americano" },
        { vendorId: insertedVendors[17].id, name: "Banana Bread", price: 35000, category: "Pastry", image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=400&fit=crop", description: "Homemade banana bread" }
    ];

    // Check if products already exist to prevent duplicates
    const existingProducts = await db.select().from(products);
    if (existingProducts.length === 0) {
        for (const product of productData) {
            await db.insert(products).values(product as any);
        }
        console.log("Products seeded successfully");
    } else {
        console.log("Products already exist, skipping product seed");
    }

    // Seed Users
    await db.insert(users).values([
        {
            email: 'admin@umkmradar.com',
            password: 'admin',
            role: 'admin',
            name: 'Super Admin',
            vendorId: null
        },
        {
            email: 'babeh@umkmradar.com',
            password: 'mitra',
            role: 'vendor',
            name: 'Owner Warung Betawi Babeh',
            vendorId: insertedVendors[0].id
        },
        {
            email: 'bangjali@umkmradar.com',
            password: 'mitra',
            role: 'vendor',
            name: 'Owner Tenda Bang Jali',
            vendorId: insertedVendors[1].id
        },
        {
            email: 'uniami@umkmradar.com',
            password: 'mitra',
            role: 'vendor',
            name: 'Owner Warung Padang Uni Ami',
            vendorId: insertedVendors[2].id
        },
        {
            email: 'mieayam@umkmradar.com',
            password: 'mitra',
            role: 'vendor',
            name: 'Owner Mie Ayam Gaul',
            vendorId: insertedVendors[3].id
        },
        {
            email: 'buburayam@umkmradar.com',
            password: 'mitra',
            role: 'vendor',
            name: 'Owner Bubur Ayam Jakarta',
            vendorId: insertedVendors[4].id
        },
        {
            email: 'sedjuk@umkmradar.com',
            password: 'mitra',
            role: 'vendor',
            name: 'Owner Sedjuk Bakmi & Kopi',
            vendorId: insertedVendors[5].id
        }
    ]);

    await redis.del('vendors_list');
    await indexVendors();

    return c.json({
        message: 'Seeding completed successfully!',
        vendors: insertedVendors.length,
        products: productData.length,
        users: 7
    });
});

// Seed Ngopi Vendors Only (Add without reset)
app.post('/api/seed-ngopi', async (c) => {
    // Check if Ngopi vendors already exist
    const existingNgopi = await db.select().from(vendors).where(eq(vendors.category, 'Ngopi'));

    if (existingNgopi.length > 0) {
        return c.json({ message: 'Ngopi vendors already seeded', count: existingNgopi.length });
    }

    // Ngopi/Coffee Shops based on Figma design
    const ngopiVendors = [
        {
            name: "Kopi Kenangan",
            lat: -6.2274,
            lng: 106.8020,
            whatsapp: "6281234567899",
            address: "FX Sudirman Lt. GF",
            image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"], open: "08:00", close: "21:00" },
            status: "approved",
            category: "Ngopi",
            rating: 4.7,
            locationTags: "FX Sudirman, MRT Blok M",
            description: "Es Kopi Kenangan, Kopi Susu, Snacks"
        },
        {
            name: "Djournal Coffee",
            lat: -6.2276,
            lng: 106.8019,
            whatsapp: "6281234567900",
            address: "FX Sudirman Lt. G",
            image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"], open: "08:00", close: "21:00" },
            status: "approved",
            category: "Ngopi",
            rating: 4.6,
            locationTags: "FX Sudirman, MRT Blok M",
            description: "Specialty Coffee, Latte Art, Pastries"
        },
        {
            name: "Starbucks",
            lat: -6.2279,
            lng: 106.8023,
            whatsapp: "6281234567901",
            address: "FX Sudirman Lt. G",
            image: "https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"], open: "08:00", close: "21:00" },
            status: "approved",
            category: "Ngopi",
            rating: 4.5,
            locationTags: "FX Sudirman, MRT Blok M",
            description: "Espresso, Frappuccino, Tea, Pastries"
        },
        {
            name: "Fore Coffee",
            lat: -6.2281,
            lng: 106.8024,
            whatsapp: "6281234567902",
            address: "FX Sudirman Lt. G",
            image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"], open: "08:00", close: "21:00" },
            status: "approved",
            category: "Ngopi",
            rating: 4.6,
            locationTags: "FX Sudirman, MRT Blok M",
            description: "Kopi Lokal, Es Kopi Susu, Single Origin"
        },
        {
            name: "Anomali Coffee",
            lat: -6.2340,
            lng: 106.8010,
            whatsapp: "6281234567903",
            address: "Jl. Senopati Raya 115",
            image: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"], open: "08:00", close: "23:00" },
            status: "approved",
            category: "Ngopi",
            rating: 4.8,
            locationTags: "Senopati, MRT Blok M",
            description: "Single Origin Indonesia, Manual Brew, Pour Over"
        },
        {
            name: "Kopi Kalyan",
            lat: -6.2345,
            lng: 106.8015,
            whatsapp: "6281234567904",
            address: "Jl. Senopati Raya No. 28",
            image: "https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"], open: "06:00", close: "21:00" },
            status: "approved",
            category: "Ngopi",
            rating: 4.5,
            locationTags: "Senopati, MRT Blok M",
            description: "Specialty Coffee, Cold Brew, V60"
        },
        {
            name: "Giyanti Coffee Roastery",
            lat: -6.1995,
            lng: 106.8400,
            whatsapp: "6281234567905",
            address: "Jl. Surabaya No. 20, Menteng",
            image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"], open: "06:00", close: "21:00" },
            status: "approved",
            category: "Ngopi",
            rating: 4.9,
            locationTags: "Menteng, Area Jakarta Selatan",
            description: "Artisan Coffee, Fresh Roasted Beans, Coffee Lab"
        },
        {
            name: "Common Grounds",
            lat: -6.2265,
            lng: 106.7990,
            whatsapp: "6281234567906",
            address: "Plaza Blok M Lt. 2",
            image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"], open: "10:00", close: "21:00" },
            status: "approved",
            category: "Ngopi",
            rating: 4.7,
            locationTags: "Plaza Blok M, MRT Blok M",
            description: "Specialty Coffee, Australian Style, Brunch"
        },
        {
            name: "Union Coffee",
            lat: -6.2268,
            lng: 106.7992,
            whatsapp: "6281234567907",
            address: "Plaza Blok M Lt. 1",
            image: "https://images.unsplash.com/photo-1498804103079-a6351b050096?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"], open: "10:00", close: "21:00" },
            status: "approved",
            category: "Ngopi",
            rating: 4.6,
            locationTags: "Plaza Blok M, MRT Blok M",
            description: "Espresso Based, Cold Brew, Light Snacks"
        }
    ];

    // Insert vendors
    const insertedVendors = [];
    for (const vendor of ngopiVendors) {
        const [newVendor] = await db.insert(vendors).values(vendor as any).returning();
        insertedVendors.push(newVendor);
    }

    // Add products for each coffee shop
    const coffeeProducts = [
        // Kopi Kenangan
        { vendorId: insertedVendors[0].id, name: "Es Kopi Kenangan Mantan", price: 18000, category: "Kopi", image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop", description: "Signature coffee dengan gula aren" },
        { vendorId: insertedVendors[0].id, name: "Es Kopi Kenangan Caramel", price: 22000, category: "Kopi", image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop", description: "Kopi susu dengan caramel" },
        { vendorId: insertedVendors[0].id, name: "Matcha Latte", price: 25000, category: "Non-Kopi", image: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400&h=400&fit=crop", description: "Green tea latte creamy" },

        // Djournal Coffee
        { vendorId: insertedVendors[1].id, name: "Cafe Latte", price: 35000, category: "Kopi", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop", description: "Espresso dengan steamed milk" },
        { vendorId: insertedVendors[1].id, name: "Cappuccino", price: 35000, category: "Kopi", image: "https://images.unsplash.com/photo-1557006021-b85faa2bc5e2?w=400&h=400&fit=crop", description: "Espresso dengan foam tebal" },
        { vendorId: insertedVendors[1].id, name: "Croissant", price: 28000, category: "Pastry", image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=400&fit=crop", description: "French butter croissant" },

        // Starbucks
        { vendorId: insertedVendors[2].id, name: "Caramel Macchiato", price: 55000, category: "Kopi", image: "https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=400&h=400&fit=crop", description: "Espresso vanilla caramel" },
        { vendorId: insertedVendors[2].id, name: "Java Chip Frappuccino", price: 58000, category: "Blended", image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop", description: "Blended mocha chocolate chip" },
        { vendorId: insertedVendors[2].id, name: "Green Tea Latte", price: 50000, category: "Non-Kopi", image: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400&h=400&fit=crop", description: "Matcha dengan steamed milk" },

        // Fore Coffee
        { vendorId: insertedVendors[3].id, name: "Aren Latte", price: 28000, category: "Kopi", image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop", description: "Kopi susu gula aren" },
        { vendorId: insertedVendors[3].id, name: "Butterscotch Latte", price: 32000, category: "Kopi", image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop", description: "Kopi dengan butterscotch" },
        { vendorId: insertedVendors[3].id, name: "Cold Brew", price: 25000, category: "Kopi", image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop", description: "Cold brew 12 jam" },

        // Anomali Coffee
        { vendorId: insertedVendors[4].id, name: "Aceh Gayo Pour Over", price: 45000, category: "Single Origin", image: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&h=400&fit=crop", description: "Pour over single origin Aceh" },
        { vendorId: insertedVendors[4].id, name: "Toraja V60", price: 48000, category: "Single Origin", image: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&h=400&fit=crop", description: "V60 single origin Toraja" },
        { vendorId: insertedVendors[4].id, name: "Espresso Double", price: 35000, category: "Kopi", image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&h=400&fit=crop", description: "Double shot espresso" },

        // Kopi Kalyan
        { vendorId: insertedVendors[5].id, name: "Cold Brew Black", price: 32000, category: "Kopi", image: "https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=400&h=400&fit=crop", description: "Cold brew tanpa susu" },
        { vendorId: insertedVendors[5].id, name: "Kalyan Signature", price: 35000, category: "Kopi", image: "https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=400&h=400&fit=crop", description: "Signature coffee blend" },
        { vendorId: insertedVendors[5].id, name: "V60 Single Origin", price: 42000, category: "Single Origin", image: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&h=400&fit=crop", description: "Manual brew V60" },

        // Giyanti Coffee Roastery
        { vendorId: insertedVendors[6].id, name: "House Blend Espresso", price: 28000, category: "Kopi", image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&h=400&fit=crop", description: "House blend espresso" },
        { vendorId: insertedVendors[6].id, name: "Syphon Brew", price: 55000, category: "Single Origin", image: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&h=400&fit=crop", description: "Artisan syphon brewing" },
        { vendorId: insertedVendors[6].id, name: "Coffee Beans 250g", price: 120000, category: "Retail", image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&h=400&fit=crop", description: "Fresh roasted beans" },

        // Common Grounds
        { vendorId: insertedVendors[7].id, name: "Flat White", price: 45000, category: "Kopi", image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=400&fit=crop", description: "Australian style flat white" },
        { vendorId: insertedVendors[7].id, name: "Long Black", price: 40000, category: "Kopi", image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=400&fit=crop", description: "Double shot americano" },
        { vendorId: insertedVendors[7].id, name: "Avocado Toast", price: 65000, category: "Food", image: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400&h=400&fit=crop", description: "Brunch favorite" },

        // Union Coffee
        { vendorId: insertedVendors[8].id, name: "Piccolo Latte", price: 38000, category: "Kopi", image: "https://images.unsplash.com/photo-1498804103079-a6351b050096?w=400&h=400&fit=crop", description: "Small latte dengan ristretto" },
        { vendorId: insertedVendors[8].id, name: "Iced Long Black", price: 35000, category: "Kopi", image: "https://images.unsplash.com/photo-1498804103079-a6351b050096?w=400&h=400&fit=crop", description: "Es americano" },
        { vendorId: insertedVendors[8].id, name: "Banana Bread", price: 35000, category: "Pastry", image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=400&fit=crop", description: "Homemade banana bread" }
    ];

    for (const product of coffeeProducts) {
        await db.insert(products).values(product as any);
    }

    await redis.del('vendors_list');
    await indexVendors();

    return c.json({
        message: 'Ngopi vendors seeded successfully!',
        vendors: insertedVendors.length,
        products: coffeeProducts.length
    });
});

// Seed ATM/Minimarket/Supermarket Vendors Only (Add without reset)
app.post('/api/seed-atm', async (c) => {
    // Check if ATM vendors already exist
    const existingAtm = await db.select().from(vendors).where(eq(vendors.category, 'Minimarket'));

    if (existingAtm.length > 3) {  // We already have some from convenience stores
        return c.json({ message: 'ATM vendors already seeded', count: existingAtm.length });
    }

    // ATM/Minimarket/Supermarket vendors based on Figma design
    const atmVendors = [
        {
            name: "Alfamidi",
            lat: -6.2277,
            lng: 106.8033,
            whatsapp: "6281234567908",
            address: "Area Parkir Timur GBK",
            image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"], open: "06:00", close: "21:00" },
            status: "approved",
            category: "Minimarket",
            rating: 4.4,
            locationTags: "Area GBK, MRT Blok M",
            description: "Minimarket, Snacks, Minuman"
        },
        {
            name: "Superindo",
            lat: -6.2270,
            lng: 106.8018,
            whatsapp: "6281234567909",
            address: "FX Sudirman Lt. UG",
            image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"], open: "09:00", close: "21:00" },
            status: "approved",
            category: "Supermarket",
            rating: 4.5,
            locationTags: "FX Sudirman, MRT Blok M",
            description: "Supermarket, Groceries, Fresh Produce"
        },
        {
            name: "Transmart",
            lat: -6.2295,
            lng: 106.8005,
            whatsapp: "6281234567910",
            address: "Ratu Plaza Lt. LG",
            image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"], open: "09:00", close: "21:00" },
            status: "approved",
            category: "Supermarket",
            rating: 4.3,
            locationTags: "Ratu Plaza, MRT Blok M",
            description: "Hypermarket, Electronics, Home Needs"
        },
        {
            name: "Hero Supermarket",
            lat: -6.2260,
            lng: 106.7995,
            whatsapp: "6281234567911",
            address: "Plaza Blok M Lt. B1",
            image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"], open: "09:00", close: "21:00" },
            status: "approved",
            category: "Supermarket",
            rating: 4.6,
            locationTags: "Plaza Blok M, MRT Blok M",
            description: "Premium Supermarket, Imported Goods"
        },
        {
            name: "TheFoodHall",
            lat: -6.2272,
            lng: 106.7988,
            whatsapp: "6281234567912",
            address: "Blok M City Lt. LG",
            image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"], open: "09:00", close: "21:00" },
            status: "approved",
            category: "Supermarket",
            rating: 4.7,
            locationTags: "Blok M City, MRT Blok M",
            description: "Gourmet Food Market, Premium Products"
        }
    ];

    // Insert vendors
    const insertedVendors = [];
    for (const vendor of atmVendors) {
        const [newVendor] = await db.insert(vendors).values(vendor as any).returning();
        insertedVendors.push(newVendor);
    }

    // Add products for supermarkets
    const supermarketProducts = [
        // Alfamidi
        { vendorId: insertedVendors[0].id, name: "Onigiri Salmon", price: 12000, category: "Snack", image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=400&fit=crop", description: "Nasi kepal isi salmon" },
        { vendorId: insertedVendors[0].id, name: "Minuman Dingin", price: 8000, category: "Minuman", image: "https://images.unsplash.com/photo-1561758033-48d52648ae8b?w=400&h=400&fit=crop", description: "Berbagai minuman dingin" },
        { vendorId: insertedVendors[0].id, name: "Roti Fresh", price: 15000, category: "Roti", image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=400&fit=crop", description: "Roti fresh berbagai rasa" },

        // Superindo
        { vendorId: insertedVendors[1].id, name: "Buah Segar Pack", price: 35000, category: "Produce", image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&h=400&fit=crop", description: "Pack buah segar pilihan" },
        { vendorId: insertedVendors[1].id, name: "Sayuran Organik", price: 25000, category: "Produce", image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=400&fit=crop", description: "Sayuran organik segar" },

        // Transmart
        { vendorId: insertedVendors[2].id, name: "Daging Sapi Slice", price: 85000, category: "Meat", image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop", description: "Daging sapi premium sliced" },
        { vendorId: insertedVendors[2].id, name: "Seafood Pack", price: 75000, category: "Seafood", image: "https://images.unsplash.com/photo-1565680018093-ebb6aca4522f?w=400&h=400&fit=crop", description: "Aneka seafood segar" },

        // Hero Supermarket  
        { vendorId: insertedVendors[3].id, name: "Cheese Import", price: 95000, category: "Dairy", image: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&h=400&fit=crop", description: "Keju import premium" },
        { vendorId: insertedVendors[3].id, name: "Wine Selection", price: 250000, category: "Beverage", image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=400&fit=crop", description: "Pilihan wine import" },

        // TheFoodHall
        { vendorId: insertedVendors[4].id, name: "Truffle Oil", price: 185000, category: "Gourmet", image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop", description: "Truffle oil premium" },
        { vendorId: insertedVendors[4].id, name: "Artisan Bread", price: 65000, category: "Bakery", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop", description: "Roti artisan fresh baked" }
    ];

    for (const product of supermarketProducts) {
        await db.insert(products).values(product as any);
    }

    await redis.del('vendors_list');
    await indexVendors();

    return c.json({
        message: 'ATM/Minimarket vendors seeded successfully!',
        vendors: insertedVendors.length,
        products: supermarketProducts.length
    });
});

// Seed Homepage Settings (Banners & Transport Links)
app.post('/api/seed-homepage-settings', async (c) => {
    // Default banner data from Figma design
    const defaultBanners = [
        { id: 1, image: '/assets/homepage/banner_kopken.png', title: 'Kopi Kenangan', subtitle: 'Black Aren' },
        { id: 2, image: '/assets/homepage/banner_famicafe.png', title: 'FamiCafe', subtitle: 'New Americano' },
        { id: 3, image: '/assets/homepage/banner_alfamart.png', title: 'Alfamart', subtitle: 'Promo Spesial' },
    ];

    // Default transport links from Figma design
    const defaultTransportLinks = [
        { id: 'tije', name: 'TransJakarta', logo: '/assets/homepage/logo_tije.png', url: 'https://transjakarta.co.id/' },
        { id: 'jaklingko', name: 'JakLingko', logo: '/assets/homepage/logo_jaklingko.png', url: 'https://jaklingko.id/' },
        { id: 'lrt', name: 'LRT Jakarta', logo: '/assets/homepage/logo_lrt.png', url: 'https://www.lrtjakarta.co.id/' },
        { id: 'kai', name: 'KAI Commuter', logo: '/assets/homepage/logo_kai.png', url: 'https://www.krl.co.id/' },
        { id: 'whoosh', name: 'Whoosh', logo: '/assets/homepage/logo_whoosh.png', url: 'https://whoosh.id/' }
    ];

    try {
        // Check if already exists
        const existingBanners = await db.select().from(settings).where(eq(settings.key, 'homepage_banners'));
        const existingTransport = await db.select().from(settings).where(eq(settings.key, 'transport_links'));

        const results = [];

        if (existingBanners.length === 0) {
            const inserted = await db.insert(settings).values({
                key: 'homepage_banners',
                value: defaultBanners as any
            }).returning();
            results.push({ key: 'homepage_banners', status: 'created' });
        } else {
            results.push({ key: 'homepage_banners', status: 'already_exists' });
        }

        if (existingTransport.length === 0) {
            const inserted = await db.insert(settings).values({
                key: 'transport_links',
                value: defaultTransportLinks as any
            }).returning();
            results.push({ key: 'transport_links', status: 'created' });
        } else {
            results.push({ key: 'transport_links', status: 'already_exists' });
        }

        return c.json({ message: 'Homepage settings seeded', results });
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Failed to seed homepage settings' }, 500);
    }
});


// 7. Pickup Order by Code
app.post('/api/orders/pickup', async (c) => {
    try {
        const { code, vendorId } = await c.req.json();

        if (!code) return c.json({ error: 'Pickup code is required' }, 400);

        // Find order matching code
        // Note: In real app, ensure vendorId matches to prevent stealing orders
        const conditions = [eq(orders.pickupCode, code)];
        if (vendorId) {
            conditions.push(eq(orders.vendorId, vendorId));
        }

        const list = await db.select().from(orders).where(and(...conditions));

        if (list.length === 0) {
            return c.json({ error: 'Kode pesanan tidak ditemukan atau bukan milik toko Anda.' }, 404);
        }

        const order = list[0];

        if (order.status === 'completed') {
            return c.json({ error: 'Pesanan sudah selesai sebelumnya.', order }, 400);
        }

        // Allow pickup if ready or processing (flexible)
        // Update to completed
        const updated = await db.update(orders)
            .set({ status: 'completed' })
            .where(eq(orders.id, order.id))
            .returning();

        return c.json({ success: true, order: updated[0] });

    } catch (error) {
        console.error("Pickup Error:", error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// ... (Existing orders/pickup endpoints)

// 8. Product Management (CRUD)
// Create Product
app.post('/api/products', async (c) => {
    try {
        const body = await c.req.json();
        const result = await db.insert(products).values(body).returning();
        await flushDestinationsCache();
        return c.json(result[0]);
    } catch (error) {
        return c.json({ error: 'Failed to create product' }, 500);
    }
});

// Update Product
app.put('/api/products/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const body = await c.req.json();
        const result = await db.update(products)
            .set(body)
            .where(eq(products.id, parseInt(id)))
            .returning();
        await flushDestinationsCache();
        return c.json(result[0]);
    } catch (error) {
        return c.json({ error: 'Failed to update product' }, 500);
    }
});

// Delete Product
app.delete('/api/products/:id', async (c) => {
    const id = c.req.param('id');
    try {
        await db.delete(products).where(eq(products.id, parseInt(id)));
        return c.json({ message: 'Deleted' });
    } catch (error) {
        return c.json({ error: 'Failed to delete' }, 500);
    }
});

// 9. Voucher Management
// Get Vouchers (Filtered by Vendor or Global)
app.get('/api/vouchers', async (c) => {
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

// Create Voucher
app.post('/api/vouchers', async (c) => {
    try {
        const body = await c.req.json();
        const result = await db.insert(vouchers).values(body).returning();
        await flushDestinationsCache();
        return c.json(result[0]);
    } catch (error) {
        return c.json({ error: 'Failed to create voucher' }, 500);
    }
});

// Delete Voucher
app.delete('/api/vouchers/:id', async (c) => {
    const id = c.req.param('id');
    try {
        await db.delete(vouchers).where(eq(vouchers.id, parseInt(id)));
        return c.json({ message: 'Deleted' });
    } catch (error) {
        return c.json({ error: 'Failed to delete' }, 500);
    }
});

// 10. Upload Endpoint - Using MinIO
app.post('/api/upload', async (c) => {
    try {
        const body = await c.req.parseBody();
        const file = body['file'];

        if (!file || typeof file === 'string' || Array.isArray(file)) {
            return c.json({ error: 'No file uploaded' }, 400);
        }

        // It's a Blob/File
        const buffer = await (file as any).arrayBuffer();
        const extension = (file as any).name.split('.').pop() || 'jpg';
        const filename = `${randomBytes(8).toString('hex')}.${extension}`;

        // Determine MIME type
        const mimeTypes: Record<string, string> = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'svg': 'image/svg+xml'
        };

        const contentType = mimeTypes[extension.toLowerCase()] || 'application/octet-stream';

        // Upload to MinIO
        const url = await uploadToMinIO(Buffer.from(buffer), filename, 'general', contentType);

        return c.json({ url });
    } catch (error) {
        console.error("Upload error:", error);
        return c.json({ error: 'Upload failed' }, 500);
    }
});


// ==================== CATEGORIES MANAGEMENT ====================

// Get all categories
app.get('/api/categories', async (c) => {
    try {
        const result = await db.select().from(categories).orderBy(categories.sortOrder, categories.name);
        return c.json(result);
    } catch (error) {
        console.error('Categories fetch error:', error);
        return c.json({ error: 'Failed to fetch categories' }, 500);
    }
});

// Get single category
app.get('/api/categories/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const result = await db.select().from(categories).where(eq(categories.id, parseInt(id)));
        if (result.length === 0) return c.json(null, 404);
        await flushDestinationsCache();
        return c.json(result[0]);
    } catch (error) {
        return c.json({ error: 'Failed to fetch category' }, 500);
    }
});

// Create category
app.post('/api/categories', async (c) => {
    try {
        const body = await c.req.json();
        const { name, slug, icon, color, description, isActive, sortOrder } = body;

        // Generate slug if not provided
        const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        const result = await db.insert(categories).values({
            name,
            slug: finalSlug,
            icon: icon || null,
            color: color || '#0969da',
            description: description || null,
            isActive: isActive !== undefined ? isActive : true,
            sortOrder: sortOrder || 0,
        }).returning();

        return c.json(result[0], 201);
    } catch (error) {
        console.error('Category creation error:', error);
        return c.json({ error: 'Failed to create category' }, 500);
    }
});

// Update category
app.put('/api/categories/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const body = await c.req.json();
        const { name, slug, icon, color, description, isActive, sortOrder } = body;

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (slug !== undefined) updateData.slug = slug;
        if (icon !== undefined) updateData.icon = icon;
        if (color !== undefined) updateData.color = color;
        if (description !== undefined) updateData.description = description;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

        const result = await db.update(categories)
            .set(updateData)
            .where(eq(categories.id, parseInt(id)))
            .returning();

        if (result.length === 0) return c.json({ error: 'Category not found' }, 404);
        await flushDestinationsCache();
        return c.json(result[0]);
    } catch (error) {
        console.error('Category update error:', error);
        return c.json({ error: 'Failed to update category' }, 500);
    }
});

// Delete category
app.delete('/api/categories/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const result = await db.delete(categories).where(eq(categories.id, parseInt(id))).returning();
        if (result.length === 0) return c.json({ error: 'Category not found' }, 404);
        return c.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Category deletion error:', error);
        return c.json({ error: 'Failed to delete category' }, 500);
    }
});

// ==================== NAVIGATION ITEMS MANAGEMENT ====================

// Get all navigation items
app.get('/api/navigation', async (c) => {
    try {
        const position = c.req.query('position'); // Optional filter by position
        let query = db.select().from(navigationItems);

        if (position) {
            query = query.where(eq(navigationItems.position, position)) as any;
        }

        const result = await query.orderBy(navigationItems.sortOrder, navigationItems.label);
        return c.json(result);
    } catch (error) {
        console.error('Navigation fetch error:', error);
        return c.json({ error: 'Failed to fetch navigation items' }, 500);
    }
});

// Get single navigation item
app.get('/api/navigation/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const result = await db.select().from(navigationItems).where(eq(navigationItems.id, parseInt(id)));
        if (result.length === 0) return c.json(null, 404);
        await flushDestinationsCache();
        return c.json(result[0]);
    } catch (error) {
        return c.json({ error: 'Failed to fetch navigation item' }, 500);
    }
});

// Create navigation item
app.post('/api/navigation', async (c) => {
    try {
        const body = await c.req.json();
        const { label, path, icon, parentId, position, sortOrder, isExternal, isVisible, requiresAuth } = body;

        const result = await db.insert(navigationItems).values({
            label,
            path,
            icon: icon || null,
            parentId: parentId || null,
            position: position || 'header',
            sortOrder: sortOrder || 0,
            isExternal: isExternal !== undefined ? isExternal : false,
            isVisible: isVisible !== undefined ? isVisible : true,
            requiresAuth: requiresAuth !== undefined ? requiresAuth : false,
        }).returning();

        return c.json(result[0], 201);
    } catch (error) {
        console.error('Navigation creation error:', error);
        return c.json({ error: 'Failed to create navigation item' }, 500);
    }
});

// Update navigation item
app.put('/api/navigation/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const body = await c.req.json();
        const { label, path, icon, parentId, position, sortOrder, isExternal, isVisible, requiresAuth } = body;

        const updateData: any = {};
        if (label !== undefined) updateData.label = label;
        if (path !== undefined) updateData.path = path;
        if (icon !== undefined) updateData.icon = icon;
        if (parentId !== undefined) updateData.parentId = parentId;
        if (position !== undefined) updateData.position = position;
        if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
        if (isExternal !== undefined) updateData.isExternal = isExternal;
        if (isVisible !== undefined) updateData.isVisible = isVisible;
        if (requiresAuth !== undefined) updateData.requiresAuth = requiresAuth;

        const result = await db.update(navigationItems)
            .set(updateData)
            .where(eq(navigationItems.id, parseInt(id)))
            .returning();

        if (result.length === 0) return c.json({ error: 'Navigation item not found' }, 404);
        await flushDestinationsCache();
        return c.json(result[0]);
    } catch (error) {
        console.error('Navigation update error:', error);
        return c.json({ error: 'Failed to update navigation item' }, 500);
    }
});

// Delete navigation item
app.delete('/api/navigation/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const result = await db.delete(navigationItems).where(eq(navigationItems.id, parseInt(id))).returning();
        if (result.length === 0) return c.json({ error: 'Navigation item not found' }, 404);
        return c.json({ message: 'Navigation item deleted successfully' });
    } catch (error) {
        console.error('Navigation deletion error:', error);
        return c.json({ error: 'Failed to delete navigation item' }, 500);
    }
});

// Reorder navigation items
app.post('/api/navigation/reorder', async (c) => {
    try {
        const body = await c.req.json();
        const { items } = body; // Array of { id, sortOrder }

        // Update sort order for each item
        for (const item of items) {
            await db.update(navigationItems)
                .set({ sortOrder: item.sortOrder })
                .where(eq(navigationItems.id, item.id));
        }

        return c.json({ message: 'Navigation items reordered successfully' });
    } catch (error) {
        console.error('Navigation reorder error:', error);
        return c.json({ error: 'Failed to reorder navigation items' }, 500);
    }
});

// ==================== SETTINGS API ====================
// Get all settings
app.get('/api/settings', async (c) => {
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

// Update multiple settings (Bulk Update)
app.post('/api/settings', async (c) => {
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

// Get single setting by key
app.get('/api/settings/:key', async (c) => {
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

// Update or create setting
app.put('/api/settings/:key', async (c) => {
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



// ==================== CLEANUP API ====================
// Cleanup Duplicate Products Endpoint
app.post('/api/cleanup-products', async (c) => {
    try {
        console.log("Cleaning duplicate products...");
        // Deletes products that are duplicates based on name and vendor_id, keeping the one with the smallest ID
        await db.execute(sql`
            DELETE FROM products a USING products b
            WHERE a.id > b.id 
            AND a.vendor_id = b.vendor_id 
            AND a.name = b.name;
        `);

        // Also invalidate cache
        await redis.del('vendors_list');

        return c.json({ message: 'Duplicate products removed successfully' });
    } catch (error) {
        console.error("Cleanup error:", error);
        return c.json({ error: 'Failed to clean products' }, 500);
    }
});

// ==================== DESTINATIONS API ====================

// Get all destinations
// Get destinations grouped by category (Cached)
app.get('/api/destinations/grouped', async (c) => {
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
            if (!grouped[dest.category]) {
                grouped[dest.category] = [];
            }
            grouped[dest.category].push(dest);
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

// Get destination by ID
app.get('/api/destinations/:id', async (c) => {
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

// Get transit directions to a destination
app.get('/api/destinations/:id/directions', async (c) => {
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

// Search destinations
app.get('/api/destinations/search/:query', async (c) => {
    try {
        const query = c.req.param('query').toLowerCase();
        const result = await db.select().from(destinations).where(eq(destinations.isActive, true));

        // Search in name, description, category, subcategory, address
        const filtered = result.filter(d =>
            d.name.toLowerCase().includes(query) ||
            (d.description && d.description.toLowerCase().includes(query)) ||
            d.category.toLowerCase().includes(query) ||
            (d.subcategory && d.subcategory.toLowerCase().includes(query)) ||
            (d.address && d.address.toLowerCase().includes(query)) ||
            d.nearestStation.toLowerCase().includes(query)
        );

        return c.json(filtered);
    } catch (error) {
        console.error("Error searching destinations:", error);
        return c.json({ error: 'Failed to search destinations' }, 500);
    }
});

// Get unique categories
app.get('/api/destinations/meta/categories', async (c) => {
    try {
        const result = await db.select().from(destinations).where(eq(destinations.isActive, true));
        const categories = [...new Set(result.map(d => d.category))];
        return c.json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        return c.json({ error: 'Failed to fetch categories' }, 500);
    }
});

// Get unique stations
app.get('/api/destinations/meta/stations', async (c) => {
    try {
        const result = await db.select().from(destinations).where(eq(destinations.isActive, true));
        const stations = [...new Set(result.map(d => ({ name: d.nearestStation, type: d.stationType })))];
        return c.json(stations);
    } catch (error) {
        console.error("Error fetching stations:", error);
        return c.json({ error: 'Failed to fetch stations' }, 500);
    }
});

// ==================== SUB-KATEGORI VENDOR ====================

// GET all subcategories (optionally filtered by categoryId)
app.get('/api/subcategories', async (c) => {
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

// GET single subcategory
app.get('/api/subcategories/:id', async (c) => {
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

// POST create subcategory
app.post('/api/subcategories', async (c) => {
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

// PUT update subcategory
app.put('/api/subcategories/:id', async (c) => {
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

// DELETE subcategory
app.delete('/api/subcategories/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const result = await pool.query('DELETE FROM vendor_subcategories WHERE id = $1 RETURNING *', [parseInt(id)]);
        if (result.rows.length === 0) return c.json({ error: 'Not found' }, 404);
        return c.json({ success: true });
    } catch (error) {
        return c.json({ error: 'Failed to delete subcategory' }, 500);
    }
});


// ==================== AREA / LOKASI ====================

// GET all location areas
app.get('/api/location-areas', async (c) => {
    try {
        const result = await pool.query(
            'SELECT * FROM location_areas ORDER BY sort_order, name'
        );
        return c.json(result.rows);
    } catch (error) {
        return c.json({ error: 'Failed to fetch location areas' }, 500);
    }
});

// GET single location area
app.get('/api/location-areas/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const result = await pool.query('SELECT * FROM location_areas WHERE id = $1', [parseInt(id)]);
        if (result.rows.length === 0) return c.json({ error: 'Not found' }, 404);
        return c.json(result.rows[0]);
    } catch (error) {
        return c.json({ error: 'Failed to fetch location area' }, 500);
    }
});

// POST create location area
app.post('/api/location-areas', async (c) => {
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

// PUT update location area
app.put('/api/location-areas/:id', async (c) => {
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

// DELETE location area
app.delete('/api/location-areas/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const result = await pool.query('DELETE FROM location_areas WHERE id = $1 RETURNING *', [parseInt(id)]);
        if (result.rows.length === 0) return c.json({ error: 'Not found' }, 404);
        return c.json({ success: true });
    } catch (error) {
        return c.json({ error: 'Failed to delete location area' }, 500);
    }
});

// ==================== USER MANAGEMENT ====================

// GET all users (admin only) - with vendor name
app.get('/api/users', async (c) => {
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

// GET single user
app.get('/api/users/:id', async (c) => {
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

// POST create user
app.post('/api/users', async (c) => {
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

// PUT update user
app.put('/api/users/:id', async (c) => {
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

// DELETE user
app.delete('/api/users/:id', async (c) => {
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

// PATCH toggle active status
app.patch('/api/users/:id/toggle-active', async (c) => {
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

// PATCH reset password (super admin only)
app.patch('/api/users/:id/reset-password', async (c) => {
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


// ==================== AUDIT LOGS API ====================

// GET audit logs with filters
app.get('/api/audit-logs', async (c) => {
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

// GET audit logs for a specific entity record
app.get('/api/audit-logs/:entity/:id', async (c) => {
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

// ==================== LOCATION AREAS API ====================
// Daftar stasiun MRT yang tersedia (dari tabel location_areas)
// Dipakai dashboard untuk menampilkan opsi stasiun & sync data

// GET /api/location-areas — semua area/stasiun MRT aktif
app.get('/api/location-areas', async (c) => {
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

// GET /api/location-areas/:slug — detail satu area
app.get('/api/location-areas/:slug', async (c) => {
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

// ==================== CACHE MANAGEMENT API ====================

/**
 * POST /api/cache/flush-vendors
 * Flush semua cache vendor (list + grouped, semua stasiun).
 * Dipanggil dari dashboard saat perlu sync manual.
 * Biasanya tidak perlu manual — backend auto-flush saat CRUD vendor.
 */
app.post('/api/cache/flush-vendors', async (c) => {
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

/**
 * POST /api/cache/flush-destinations
 * Flush semua cache destination (list + grouped, semua variasi filter).
 * Dipanggil dari dashboard saat perlu sync manual.
 * Biasanya tidak perlu manual — backend auto-flush saat CRUD destination.
 */
app.post('/api/cache/flush-destinations', async (c) => {
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

/**
 * GET /api/vendors/cache-status
 * Cek status cache vendor per stasiun (TTL tersisa di Redis).
 * Berguna untuk debugging atau dashboard monitoring.
 */
app.get('/api/vendors/cache-status', async (c) => {
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
