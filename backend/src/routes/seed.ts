import { Hono } from 'hono';
import { pool, db, redis, esClient, isProd, CACHE_CONTROL_LONG, CACHE_CONTROL_LONG_IMMUTABLE, CACHE_CONTROL_SHORT, ES_VENDORS_INDEX, writeAuditLog, indexVendors, getCategorySlug, flushVendorCache, flushDestinationsCache } from '../index';
import { vendors, products, orders, settings, users, vouchers, assets, categories, navigationItems, destinations, destinationCategories, destinationSubcategories } from '../db/schema';
import { eq, desc, and, sql, ilike, inArray, isNull, gte, lte } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { PUBLIC_ASSET_URL, BUCKET_NAME, uploadToMinIO, deleteFromMinIO } from '../storage';

const router = new Hono();

router.post('/api/seed-destinations', async (c) => {
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

router.post('/api/seed', async (c) => {
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

router.post('/api/seed-ngopi', async (c) => {
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

router.post('/api/seed-atm', async (c) => {
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

router.post('/api/seed-homepage-settings', async (c) => {
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

export default router;
