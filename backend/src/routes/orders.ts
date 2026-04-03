import { Hono } from 'hono';
import { pool, db, redis, esClient, isProd, CACHE_CONTROL_LONG, CACHE_CONTROL_LONG_IMMUTABLE, CACHE_CONTROL_SHORT, ES_VENDORS_INDEX, writeAuditLog, indexVendors, getCategorySlug, flushVendorCache, flushDestinationsCache } from '../index';
import { vendors, products, orders, settings, users, vouchers, assets, categories, navigationItems, destinations, destinationCategories, destinationSubcategories } from '../db/schema';
import { eq, desc, and, sql, ilike, inArray, isNull, gte, lte } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { PUBLIC_ASSET_URL, BUCKET_NAME, uploadToMinIO, deleteFromMinIO } from '../storage';

const router = new Hono();

router.post('/api/orders', async (c) => {
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

router.get('/api/orders', async (c) => {
    try {
        const customerParam = c.req.query('customer');
        const idsParam = c.req.query('ids'); // comma-separated order ids

        if (idsParam) {
            // Fetch specific orders by ID list (user my-orders page)
            const idList = idsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
            if (idList.length === 0) return c.json([]);
            const result = await db
                .select({
                    id: orders.id,
                    customer: orders.customer,
                    total: orders.total,
                    discount: orders.discount,
                    status: orders.status,
                    items: orders.items,
                    pickupCode: orders.pickupCode,
                    createdAt: orders.createdAt,
                    vendorName: vendors.name,
                    vendorId: orders.vendorId,
                    voucherCode: orders.voucherCode,
                })
                .from(orders)
                .leftJoin(vendors, eq(orders.vendorId, vendors.id))
                .where(inArray(orders.id, idList))
                .orderBy(desc(orders.createdAt));
            return c.json(result);
        }

        if (customerParam) {
            // Filter by customer name (used by user-facing page)
            const result = await db
                .select({
                    id: orders.id,
                    customer: orders.customer,
                    total: orders.total,
                    discount: orders.discount,
                    status: orders.status,
                    items: orders.items,
                    pickupCode: orders.pickupCode,
                    createdAt: orders.createdAt,
                    vendorName: vendors.name,
                    vendorId: orders.vendorId,
                    voucherCode: orders.voucherCode,
                })
                .from(orders)
                .leftJoin(vendors, eq(orders.vendorId, vendors.id))
                .where(ilike(orders.customer, `%${customerParam}%`))
                .orderBy(desc(orders.createdAt))
                .limit(20);
            return c.json(result);
        }

        // Dashboard: filter by vendorId if provided, else all orders
        const vendorIdParam = c.req.query('vendorId');
        let query = db
            .select({
                id: orders.id,
                customer: orders.customer,
                total: orders.total,
                discount: orders.discount,
                status: orders.status,
                items: orders.items,
                pickupCode: orders.pickupCode,
                createdAt: orders.createdAt,
                vendorName: vendors.name,
                vendorId: orders.vendorId,
                voucherCode: orders.voucherCode,
            })
            .from(orders)
            .leftJoin(vendors, eq(orders.vendorId, vendors.id))
            .$dynamic();

        if (vendorIdParam) {
            query = query.where(eq(orders.vendorId, parseInt(vendorIdParam)));
        }

        const result = await query.orderBy(desc(orders.createdAt));
        return c.json(result);
    } catch (error) {
        return c.json({ error: 'Failed to fetch orders' }, 500);
    }
});

router.patch('/api/orders/:id/status', async (c) => {
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

router.post('/api/orders/pickup', async (c) => {
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

export default router;
