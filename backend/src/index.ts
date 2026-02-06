import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { vendors, products, orders, settings, users, vouchers, assets } from './db/schema';
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

// MinIO / S3 Client
import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
    endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
    region: 'us-east-1',
    credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || 'umkmradar',
        secretAccessKey: process.env.MINIO_SECRET_KEY || 'umkmradar123',
    },
    forcePathStyle: true, // Required for MinIO
});

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

// Health Check
app.get('/api/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
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

    // Seed Vendors based on Figma design - Kuliner near MRT Senayan
    const vendorData = [
        {
            name: "Warung Betawi Babeh Patal Senayan",
            lat: -6.2273,
            lng: 106.8021,
            whatsapp: "6281234567890",
            address: "Jalan Patal Senayan No. 7",
            image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"], open: "07:00", close: "12:00" },
            status: "approved",
            category: "Kuliner",
            rating: 4.8,
            locationTags: "Dekat MRT Senayan, Patal Senayan",
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
            locationTags: "Dekat MRT Senayan",
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
            locationTags: "Dekat MRT Senayan",
            description: "Ketupat padang, gorengan, kripik, bubur kampiun"
        },
        {
            name: "Mie Ayam Gaul Senayan",
            lat: -6.2280,
            lng: 106.8028,
            whatsapp: "6281234567893",
            address: "Area Sudirman, arah pintu FX Sudirman dari MRT Senayan",
            image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"], open: "06:00", close: "16:00" },
            status: "approved",
            category: "Kuliner",
            rating: 4.6,
            locationTags: "FX Sudirman, MRT Senayan",
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
            locationTags: "FX Sudirman, MRT Senayan",
            description: "Bubur biasa & spesial. Topping sate, telur, ampela, usus, ati"
        },
        {
            name: "Sedjuk Bakmi & Kopi",
            lat: -6.2282,
            lng: 106.8022,
            whatsapp: "6281234567895",
            address: "Koridor Sudirman–Senayan, dekat akses pejalan kaki MRT",
            image: "https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"], open: "06:00", close: "21:00" },
            status: "approved",
            category: "Kuliner",
            rating: 4.7,
            locationTags: "Koridor Sudirman, MRT Senayan",
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
            locationTags: "Dekat MRT Senayan",
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
            locationTags: "Dekat MRT Senayan",
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
            locationTags: "Dekat MRT Senayan",
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
            locationTags: "FX Sudirman, MRT Senayan",
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
            locationTags: "FX Sudirman, MRT Senayan",
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
            locationTags: "FX Sudirman, MRT Senayan",
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
            locationTags: "FX Sudirman, MRT Senayan",
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
            locationTags: "Senopati, MRT Senayan",
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
            locationTags: "Senopati, MRT Senayan",
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
            locationTags: "Menteng, Area Jakarta Pusat",
            description: "Artisan Coffee, Fresh Roasted Beans, Coffee Lab"
        },
        {
            name: "Common Grounds",
            lat: -6.2265,
            lng: 106.7990,
            whatsapp: "6281234567906",
            address: "Plaza Senayan Lt. 2",
            image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"], open: "10:00", close: "21:00" },
            status: "approved",
            category: "Ngopi",
            rating: 4.7,
            locationTags: "Plaza Senayan, MRT Senayan",
            description: "Specialty Coffee, Australian Style, Brunch"
        },
        {
            name: "Union Coffee",
            lat: -6.2268,
            lng: 106.7992,
            whatsapp: "6281234567907",
            address: "Plaza Senayan Lt. 1",
            image: "https://images.unsplash.com/photo-1498804103079-a6351b050096?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"], open: "10:00", close: "21:00" },
            status: "approved",
            category: "Ngopi",
            rating: 4.6,
            locationTags: "Plaza Senayan, MRT Senayan",
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

        // Mie Ayam Gaul Senayan
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

    for (const product of productData) {
        await db.insert(products).values(product as any);
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
            locationTags: "FX Sudirman, MRT Senayan",
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
            locationTags: "FX Sudirman, MRT Senayan",
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
            locationTags: "FX Sudirman, MRT Senayan",
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
            locationTags: "FX Sudirman, MRT Senayan",
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
            locationTags: "Senopati, MRT Senayan",
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
            locationTags: "Senopati, MRT Senayan",
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
            locationTags: "Menteng, Area Jakarta Pusat",
            description: "Artisan Coffee, Fresh Roasted Beans, Coffee Lab"
        },
        {
            name: "Common Grounds",
            lat: -6.2265,
            lng: 106.7990,
            whatsapp: "6281234567906",
            address: "Plaza Senayan Lt. 2",
            image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"], open: "10:00", close: "21:00" },
            status: "approved",
            category: "Ngopi",
            rating: 4.7,
            locationTags: "Plaza Senayan, MRT Senayan",
            description: "Specialty Coffee, Australian Style, Brunch"
        },
        {
            name: "Union Coffee",
            lat: -6.2268,
            lng: 106.7992,
            whatsapp: "6281234567907",
            address: "Plaza Senayan Lt. 1",
            image: "https://images.unsplash.com/photo-1498804103079-a6351b050096?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"], open: "10:00", close: "21:00" },
            status: "approved",
            category: "Ngopi",
            rating: 4.6,
            locationTags: "Plaza Senayan, MRT Senayan",
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
            locationTags: "Area GBK, MRT Senayan",
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
            locationTags: "FX Sudirman, MRT Senayan",
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
            locationTags: "Ratu Plaza, MRT Senayan",
            description: "Hypermarket, Electronics, Home Needs"
        },
        {
            name: "Hero Supermarket",
            lat: -6.2260,
            lng: 106.7995,
            whatsapp: "6281234567911",
            address: "Plaza Senayan Lt. B1",
            image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"], open: "09:00", close: "21:00" },
            status: "approved",
            category: "Supermarket",
            rating: 4.6,
            locationTags: "Plaza Senayan, MRT Senayan",
            description: "Premium Supermarket, Imported Goods"
        },
        {
            name: "TheFoodHall",
            lat: -6.2272,
            lng: 106.7988,
            whatsapp: "6281234567912",
            address: "Senayan City Lt. LG",
            image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=400&fit=crop",
            schedule: { days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"], open: "09:00", close: "21:00" },
            status: "approved",
            category: "Supermarket",
            rating: 4.7,
            locationTags: "Senayan City, MRT Senayan",
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

// ==========================================
// ASSET MANAGEMENT API (MinIO + imgproxy)
// ==========================================

const MINIO_BUCKET = 'assets';
const IMGPROXY_URL = process.env.IMGPROXY_URL || 'http://localhost:8088';
const MINIO_PUBLIC_URL = process.env.MINIO_PUBLIC_URL || 'http://localhost:9000';

// Ensure bucket exists
async function ensureBucketExists() {
    try {
        await s3Client.send(new HeadBucketCommand({ Bucket: MINIO_BUCKET }));
    } catch (err: any) {
        if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
            await s3Client.send(new CreateBucketCommand({ Bucket: MINIO_BUCKET }));
            console.log(`✅ Created MinIO bucket: ${MINIO_BUCKET}`);
        }
    }
}

// Generate imgproxy URL with transformations
function generateImgproxyUrl(storagePath: string, options: {
    width?: number,
    height?: number,
    resize?: 'fit' | 'fill' | 'crop',
    quality?: number,
    format?: 'webp' | 'avif' | 'jpg' | 'png',
    blur?: number,
} = {}) {
    const transforms: string[] = [];

    if (options.resize && (options.width || options.height)) {
        transforms.push(`rs:${options.resize}:${options.width || 0}:${options.height || 0}`);
    } else if (options.width || options.height) {
        transforms.push(`rs:fit:${options.width || 0}:${options.height || 0}`);
    }

    if (options.quality) transforms.push(`q:${options.quality}`);
    if (options.format) transforms.push(`f:${options.format}`);
    if (options.blur) transforms.push(`bl:${options.blur}`);

    const transformPath = transforms.length > 0 ? transforms.join('/') + '/' : '';
    const s3Path = `s3://${MINIO_BUCKET}/${storagePath}`;

    return `${IMGPROXY_URL}/insecure/${transformPath}plain/${s3Path}`;
}

// Upload asset to MinIO
app.post('/api/assets/upload', async (c) => {
    try {
        await ensureBucketExists();

        const formData = await c.req.formData();
        const file = formData.get('file') as File;
        const category = formData.get('category') as string || 'general';
        const alt = formData.get('alt') as string || '';

        if (!file) {
            return c.json({ error: 'No file provided' }, 400);
        }

        // Generate unique filename
        const ext = file.name.split('.').pop() || 'jpg';
        const timestamp = Date.now();
        const randomId = randomBytes(8).toString('hex');
        const storagePath = `${category}/${timestamp}-${randomId}.${ext}`;

        // Upload to MinIO
        const buffer = await file.arrayBuffer();
        await s3Client.send(new PutObjectCommand({
            Bucket: MINIO_BUCKET,
            Key: storagePath,
            Body: Buffer.from(buffer),
            ContentType: file.type,
        }));

        // Save metadata to database
        const [inserted] = await db.insert(assets).values({
            filename: file.name,
            storagePath: storagePath,
            mimeType: file.type,
            size: file.size,
            bucket: MINIO_BUCKET,
            category: category,
            alt: alt,
        }).returning();

        // Generate URLs - use /api/files/ proxy for external access
        const directUrl = `/api/files/${MINIO_BUCKET}/${storagePath}`;
        const imgproxyUrl = generateImgproxyUrl(storagePath);
        const thumbnailUrl = generateImgproxyUrl(storagePath, { width: 200, height: 200, resize: 'fill', format: 'webp' });

        return c.json({
            id: inserted.id,
            filename: inserted.filename,
            storagePath: inserted.storagePath,
            directUrl,
            imgproxyUrl,
            thumbnailUrl,
            size: inserted.size,
            category: inserted.category,
        });
    } catch (error) {
        console.error("Asset upload error:", error);
        return c.json({ error: 'Upload failed' }, 500);
    }
});

// List all assets
app.get('/api/assets', async (c) => {
    try {
        const category = c.req.query('category');

        let query = db.select().from(assets).orderBy(desc(assets.createdAt));

        const result = category
            ? await db.select().from(assets).where(eq(assets.category, category)).orderBy(desc(assets.createdAt))
            : await db.select().from(assets).orderBy(desc(assets.createdAt));

        // Add URLs to each asset
        const assetsWithUrls = result.map(asset => ({
            ...asset,
            directUrl: `/api/files/${asset.bucket}/${asset.storagePath}`,
            imgproxyUrl: generateImgproxyUrl(asset.storagePath),
            thumbnailUrl: generateImgproxyUrl(asset.storagePath, { width: 200, height: 200, resize: 'fill', format: 'webp' }),
        }));

        return c.json(assetsWithUrls);
    } catch (error) {
        console.error("List assets error:", error);
        return c.json({ error: 'Failed to list assets' }, 500);
    }
});

// Get single asset with transformation options
app.get('/api/assets/:id', async (c) => {
    try {
        const id = parseInt(c.req.param('id'));
        const width = c.req.query('w') ? parseInt(c.req.query('w')!) : undefined;
        const height = c.req.query('h') ? parseInt(c.req.query('h')!) : undefined;
        const quality = c.req.query('q') ? parseInt(c.req.query('q')!) : undefined;
        const format = c.req.query('f') as 'webp' | 'avif' | 'jpg' | 'png' | undefined;
        const resize = c.req.query('rs') as 'fit' | 'fill' | 'crop' | undefined;

        const [asset] = await db.select().from(assets).where(eq(assets.id, id));

        if (!asset) {
            return c.json({ error: 'Asset not found' }, 404);
        }

        const url = generateImgproxyUrl(asset.storagePath, { width, height, quality, format, resize });

        return c.json({
            ...asset,
            directUrl: `/api/files/${asset.bucket}/${asset.storagePath}`,
            transformedUrl: url,
        });
    } catch (error) {
        console.error("Get asset error:", error);
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

        // Delete from MinIO
        await s3Client.send(new DeleteObjectCommand({
            Bucket: MINIO_BUCKET,
            Key: asset.storagePath,
        }));

        // Delete from database
        await db.delete(assets).where(eq(assets.id, id));

        return c.json({ success: true, message: 'Asset deleted' });
    } catch (error) {
        console.error("Delete asset error:", error);
        return c.json({ error: 'Failed to delete asset' }, 500);
    }
});

// Get imgproxy URL generator (for frontend to build URLs)
app.get('/api/assets/url/:storagePath', async (c) => {
    const storagePath = c.req.param('storagePath');
    const width = c.req.query('w') ? parseInt(c.req.query('w')!) : undefined;
    const height = c.req.query('h') ? parseInt(c.req.query('h')!) : undefined;
    const quality = c.req.query('q') ? parseInt(c.req.query('q')!) : 80;
    const format = c.req.query('f') as 'webp' | 'avif' | 'jpg' | 'png' || 'webp';
    const resize = c.req.query('rs') as 'fit' | 'fill' | 'crop' || 'fit';

    const url = generateImgproxyUrl(storagePath, { width, height, quality, format, resize });

    return c.json({ url });
});

// Proxy route to serve MinIO files through backend (avoids localhost:9000 CORS issues)
app.get('/api/files/:bucket/:filename{.+}', async (c) => {
    try {
        const bucket = c.req.param('bucket');
        const filename = c.req.param('filename');

        const { GetObjectCommand } = await import('@aws-sdk/client-s3');
        const command = new GetObjectCommand({
            Bucket: bucket,
            Key: filename,
        });

        const response = await s3Client.send(command);

        if (!response.Body) {
            return c.json({ error: 'File not found' }, 404);
        }

        // Convert stream to buffer
        const chunks: Uint8Array[] = [];
        const reader = response.Body.transformToWebStream().getReader();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }

        const buffer = Buffer.concat(chunks);

        // Set content type
        const contentType = response.ContentType || 'application/octet-stream';

        return new Response(buffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
            },
        });
    } catch (error) {
        console.error("File proxy error:", error);
        return c.json({ error: 'File not found' }, 404);
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
