import { Hono } from 'hono';
import { pool, db, redis, esClient, isProd, CACHE_CONTROL_LONG, CACHE_CONTROL_LONG_IMMUTABLE, CACHE_CONTROL_SHORT, ES_VENDORS_INDEX, writeAuditLog, indexVendors, getCategorySlug, flushVendorCache, flushDestinationsCache } from '../index';
import { vendors, products, orders, settings, users, vouchers, assets, categories, navigationItems, destinations, destinationCategories, destinationSubcategories } from '../db/schema';
import { eq, desc, and, sql, ilike, inArray, isNull, gte, lte } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { PUBLIC_ASSET_URL, BUCKET_NAME, uploadToMinIO, deleteFromMinIO } from '../storage';

const router = new Hono();

router.get('/api/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.post('/api/upload', async (c) => {
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

export default router;
