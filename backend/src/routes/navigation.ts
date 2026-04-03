import { Hono } from 'hono';
import { pool, db, redis, esClient, isProd, CACHE_CONTROL_LONG, CACHE_CONTROL_LONG_IMMUTABLE, CACHE_CONTROL_SHORT, ES_VENDORS_INDEX, writeAuditLog, indexVendors, getCategorySlug, flushVendorCache, flushDestinationsCache } from '../index';
import { vendors, products, orders, settings, users, vouchers, assets, categories, navigationItems, destinations, destinationCategories, destinationSubcategories } from '../db/schema';
import { eq, desc, and, sql, ilike, inArray, isNull, gte, lte } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { PUBLIC_ASSET_URL, BUCKET_NAME, uploadToMinIO, deleteFromMinIO } from '../storage';

const router = new Hono();

router.get('/api/navigation', async (c) => {
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

router.get('/api/navigation/:id', async (c) => {
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

router.post('/api/navigation', async (c) => {
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

router.put('/api/navigation/:id', async (c) => {
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

router.delete('/api/navigation/:id', async (c) => {
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

router.post('/api/navigation/reorder', async (c) => {
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

export default router;
