import { Hono } from 'hono';
import { pool, db, redis, esClient, isProd, CACHE_CONTROL_LONG, CACHE_CONTROL_LONG_IMMUTABLE, CACHE_CONTROL_SHORT, ES_VENDORS_INDEX, writeAuditLog, indexVendors, getCategorySlug, flushVendorCache, flushDestinationsCache, IMGPROXY_URL } from '../index';
import { vendors, products, orders, settings, users, vouchers, assets, categories, navigationItems, destinations, destinationCategories, destinationSubcategories } from '../db/schema';
import { eq, desc, and, sql, ilike, inArray, isNull, gte, lte } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { PUBLIC_ASSET_URL, BUCKET_NAME, uploadToMinIO, deleteFromMinIO } from '../storage';

const router = new Hono();

router.get('/api/minio/list/:folder?', async (c) => {
    try {
        const { minioClient, BUCKET_NAME } = await import('../storage');
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

router.get('/api/proxy/minio/*', async (c) => {
    try {
        const { minioClient, BUCKET_NAME } = await import('../storage');
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

router.get('/uploads/*', async (c) => {
    try {
        const { minioClient, BUCKET_NAME } = await import('../storage');
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

router.get('/api/image/*', async (c) => {
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

router.get('/api/raw/*', async (c) => {
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

router.post('/api/assets/upload', async (c) => {
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

router.get('/api/assets', async (c) => {
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

router.get('/api/assets/:id', async (c) => {
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

router.delete('/api/assets/:id', async (c) => {
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

export default router;
