import { Hono } from 'hono';
import { pool, db, redis, esClient, isProd, CACHE_CONTROL_LONG, CACHE_CONTROL_LONG_IMMUTABLE, CACHE_CONTROL_SHORT, ES_VENDORS_INDEX, writeAuditLog, indexVendors, getCategorySlug, flushVendorCache, flushDestinationsCache } from '../index';
import { vendors, products, orders, settings, users, vouchers, assets, categories, navigationItems, destinations, destinationCategories, destinationSubcategories } from '../db/schema';
import { eq, desc, and, sql, ilike, inArray, isNull, gte, lte } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { PUBLIC_ASSET_URL, BUCKET_NAME, uploadToMinIO, deleteFromMinIO } from '../storage';

const router = new Hono();

router.get('/api/products', async (c) => {
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

router.post('/api/products', async (c) => {
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

router.put('/api/products/:id', async (c) => {
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

router.delete('/api/products/:id', async (c) => {
    const id = c.req.param('id');
    try {
        await db.delete(products).where(eq(products.id, parseInt(id)));
        return c.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Delete Product Error:', error);
        return c.json({ error: 'Failed to delete product' }, 500);
    }
});

router.post('/api/products', async (c) => {
    try {
        const body = await c.req.json();
        const result = await db.insert(products).values(body).returning();
        await flushDestinationsCache();
        return c.json(result[0]);
    } catch (error) {
        return c.json({ error: 'Failed to create product' }, 500);
    }
});

router.put('/api/products/:id', async (c) => {
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

router.delete('/api/products/:id', async (c) => {
    const id = c.req.param('id');
    try {
        await db.delete(products).where(eq(products.id, parseInt(id)));
        return c.json({ message: 'Deleted' });
    } catch (error) {
        return c.json({ error: 'Failed to delete' }, 500);
    }
});

router.post('/api/cleanup-products', async (c) => {
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

export default router;
