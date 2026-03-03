import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import { destinations } from './src/db/schema.ts';
import { Redis } from 'ioredis';
import 'dotenv/config';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/umkm_radar',
});
const db = drizzle(pool);
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

async function seed() {
    const data = [
        // Publik
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
        // Wisata
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

    try {
        await db.insert(destinations).values(data);
        console.log("Seeded " + data.length + " Blok M destinations!");
        
        // flush redis cache
        let cursor = "0";
        const keysToDelete = [];
        do {
            const reply = await redis.scan(cursor, "MATCH", "dest_cache_*", "COUNT", 100);
            cursor = String(reply[0]);
            keysToDelete.push(...reply[1]);
        } while (cursor !== "0");
        keysToDelete.push("destinations_grouped");
        if (keysToDelete.length > 0) {
            await redis.del(...keysToDelete);
        }
        console.log("Redis cache flushed!");
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
seed();
