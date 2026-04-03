import { Hono } from 'hono';
import { pool, db, redis, esClient, isProd, CACHE_CONTROL_LONG, CACHE_CONTROL_LONG_IMMUTABLE, CACHE_CONTROL_SHORT, ES_VENDORS_INDEX, writeAuditLog, indexVendors, getCategorySlug, flushVendorCache, flushDestinationsCache } from '../index';
import { vendors, products, orders, settings, users, vouchers, assets, categories, navigationItems, destinations, destinationCategories, destinationSubcategories } from '../db/schema';
import { eq, desc, and, sql, ilike, inArray, isNull, gte, lte } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { PUBLIC_ASSET_URL, BUCKET_NAME, uploadToMinIO, deleteFromMinIO } from '../storage';

const router = new Hono();

router.get('/api/categories', async (c) => {
    try {
        const result = await db.select().from(categories).orderBy(categories.sortOrder, categories.name);
        return c.json(result);
    } catch (error) {
        console.error('Categories fetch error:', error);
        return c.json({ error: 'Failed to fetch categories' }, 500);
    }
});

router.get('/api/categories/:id', async (c) => {
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

router.post('/api/categories', async (c) => {
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

router.put('/api/categories/:id', async (c) => {
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

router.delete('/api/categories/:id', async (c) => {
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

export default router;
