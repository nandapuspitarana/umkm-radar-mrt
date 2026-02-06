import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { vendors, products, orders, settings, users, vouchers } from './db/schema';
import { eq, desc, and } from 'drizzle-orm';

dotenv.config();

export const app = new Hono();

// Middleware
app.use('/*', cors());
app.use('/uploads/*', serveStatic({ root: './' }));
import { serveStatic } from '@hono/node-server/serve-static';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';

import Redis from 'ioredis';

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

// Routes

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

        // Return user info
        return c.json({
            email: user.email,
            role: user.role,
            vendorId: user.vendorId,
            name: user.name,
            token: 'mock-jwt-token'
        });
    } catch (error) {
        console.error("Login server error:", error);
        return c.json({ error: 'Terjadi kesalahan pada server.' }, 500);
    }
});

// 1. Get All Vendors (Cached)
app.get('/api/vendors', async (c) => {
    try {
        const cacheKey = 'vendors_list';
        let cached = null;

        // Try to get from Redis cache
        try {
            cached = await redis.get(cacheKey);
        } catch (redisError) {
            console.warn('Redis get error:', redisError);
        }

        if (cached) {
            console.log('Serving vendors from Redis cache');
            return c.json(JSON.parse(cached));
        }

        const result = await db.select().from(vendors);

        // Transform data to match client expected format
        const transformedResult = result.map(v => ({
            ...v,
            location: { lat: v.lat, lng: v.lng }
        }));

        // Try to cache for 60 seconds
        try {
            await redis.set(cacheKey, JSON.stringify(transformedResult), 'EX', 60);
        } catch (redisError) {
            console.warn('Redis set error:', redisError);
        }

        return c.json(transformedResult);
    } catch (error) {
        console.error('Vendors endpoint error:', error);
        return c.json({ error: 'Failed to fetch vendors', details: error }, 500);
    }
});

// 1b. Get Single Vendor
app.get('/api/vendors/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const result = await db.select().from(vendors).where(eq(vendors.id, parseInt(id)));
        if (result.length === 0) return c.json(null, 404);
        return c.json(result[0]);
    } catch (error) {
        return c.json({ error: 'Failed to fetch vendor' }, 500);
    }
});

// 1c. Create Vendor
app.post('/api/vendors', async (c) => {
    try {
        const body = await c.req.json();
        // body should include: name, lat, lng, whatsapp, address, category, locationTags, etc.
        const result = await db.insert(vendors).values(body).returning();

        // Invalidate cache
        await redis.del('vendors_list');

        return c.json(result[0]);
    } catch (error) {
        console.error("Create Vendor Error:", error);
        return c.json({ error: 'Failed to create vendor' }, 500);
    }
});

// 1c. Update Vendor (Invalidate Cache)
app.put('/api/vendors/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const body = await c.req.json();
        // Allow updating name, address, whatsapp, lat, lng, image
        // (Clean or validate body as needed)
        const result = await db.update(vendors)
            .set(body)
            .where(eq(vendors.id, parseInt(id)))
            .returning();

        // Invalidate cache
        await redis.del('vendors_list');

        return c.json(result[0]);
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Failed to update vendor' }, 500);
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
        return c.json({ error: 'Failed to fetch products' }, 500);
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
        return c.json(result[0]);
    } catch (error) {
        return c.json({ error: 'Failed to update status' }, 500);
    }
});


// Seed Endpoint (For Demo Purposes)
app.post('/api/seed', async (c) => {
    // Check if vendors exist
    const v = await db.select().from(vendors);
    let v1, v2;

    if (v.length > 0) {
        console.log("Vendors already seeded. Checking users...");
        v1 = v[0];
        // Try to get second vendor if exists, otherwise fallback to first or null (safeguard)
        v2 = v.length > 1 ? v[1] : v[0];

        // Check if users exist
        const u = await db.select().from(users);
        if (u.length > 0) {
            return c.json({ message: 'Already seeded (Full)' });
        }
    } else {
        // Seed Vendors
        const [newV1] = await db.insert(vendors).values({
            name: "UMKM Radar Selatan",
            lat: -6.261493,
            lng: 106.810600,
            whatsapp: "6281234567890",
            address: "Jl. Kemang Raya No. 10",
            rating: 4.8
        }).returning();
        v1 = newV1;

        const [newV2] = await db.insert(vendors).values({
            name: "Berkah Sayur Mayur",
            lat: -6.175110,
            lng: 106.865039,
            whatsapp: "6281298765432",
            address: "Jl. Rawamangun Muka No. 5",
            rating: 4.9
        }).returning();
        v2 = newV2;

        // Seed Products
        await db.insert(products).values([
            { vendorId: v1.id, name: "Apel Fuji Premium Import", price: 45000, category: "Buah", image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=400&fit=crop" },
            { vendorId: v1.id, name: "Brokoli Hijau Segar", price: 25500, category: "Sayuran", image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&h=400&fit=crop" },
            { vendorId: v2.id, name: "Bayam Organik Ikat", price: 5000, category: "Sayuran", image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=400&fit=crop" }
        ]);
    }

    // Seed Users (Safe Insert)
    // We try to insert. If email collision, it will fail (API returns 500), but that means user exists.
    // Or we can check existence first.

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
                name: 'Owner Selatan',
                vendorId: v1.id
            },
            {
                email: 'mitra2@umkmradar.com',
                password: 'mitra',
                role: 'vendor',
                name: 'Owner Rawamangun',
                vendorId: v2.id
            }
        ]);

        await redis.del('vendors_list'); // Invalidate cache

        return c.json({ message: 'Users seeded successfully' });
    }

    await redis.del('vendors_list'); // Invalidate cache just in case

    return c.json({ message: 'Seeding completed' });
});


// 6. Settings API
app.get('/api/settings', async (c) => {
    try {
        const result = await db.select().from(settings);
        // Transform to object for easier consumption
        const settingsObj = result.reduce((acc: any, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
        return c.json(settingsObj);
    } catch (error) {
        return c.json({ error: 'Failed to fetch settings' }, 500);
    }
});

app.post('/api/settings', async (c) => {
    try {
        const body = await c.req.json();
        const results = [];

        // Upsert each key
        for (const [key, value] of Object.entries(body)) {
            // Check if exists
            const existing = await db.select().from(settings).where(eq(settings.key, key));

            if (existing.length > 0) {
                const updated = await db.update(settings)
                    .set({ value: value as any })
                    .where(eq(settings.key, key))
                    .returning();
                results.push(updated[0]);
            } else {
                const inserted = await db.insert(settings).values({ key, value: value as any }).returning();
                results.push(inserted[0]);
            }
        }

        return c.json(results);
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Failed to update settings' }, 500);
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

// 10. Upload Endpoint
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
        const path = join('./uploads', filename);

        await writeFile(path, Buffer.from(buffer));

        const url = `http://localhost:3000/uploads/${filename}`;
        return c.json({ url });
    } catch (error) {
        console.error("Upload error:", error);
        return c.json({ error: 'Upload failed' }, 500);
    }
});

const port = 3000;
if (process.env.NODE_ENV !== 'test') {
    console.log(`Server is running on port ${port}`);
    serve({
        fetch: app.fetch,
        port
    });
}
