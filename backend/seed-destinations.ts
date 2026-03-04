import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './src/db/schema.js';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function seedDestinations() {
    try {
        console.log('Fetching categories...');
        const categories = await db.select().from(schema.destinationCategories);

        if (categories.length === 0) {
            console.error('No categories found. Please run seed-destination-categories.ts first.');
            process.exit(1);
        }

        const categorySlugToId: Record<string, number> = {};
        for (const cat of categories) {
            categorySlugToId[cat.slug] = cat.id;
        }

        const destinationsData = [
            // Wisata
            {
                name: 'Museum Nasional Indonesia',
                description: 'Dikenal juga sebagai Museum Gajah, merupakan museum arkeologi, sejarah, etnografi, dan geografi.',
                lat: -6.1764,
                lng: 106.8216,
                categorySlug: 'sejarah-museum',
                address: 'Jl. Medan Merdeka Barat No.12, Jakarta',
                image: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                nearestStation: 'Bundaran HI',
                stationType: 'MRT',
                distanceFromStation: 1.5,
                walkingTimeMinutes: 20,
                openingHours: '08:00 - 16:00',
                ticketPrice: 'Rp 5.000',
            },
            {
                name: 'Taman Suropati',
                description: 'Taman kota yang asri dan sejuk dengan rimbunnya pepohonan, sering digunakan untuk bersantai dan olahraga ringan.',
                lat: -6.1989,
                lng: 106.8326,
                categorySlug: 'alam-ruang-terbuka',
                address: 'Jl. Taman Suropati No.5, Menteng',
                image: 'https://images.unsplash.com/photo-1524311582294-8255b8eb8d5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                nearestStation: 'Dukuh Atas BNI',
                stationType: 'MRT',
                distanceFromStation: 1.2,
                walkingTimeMinutes: 15,
                openingHours: '24 Jam',
                ticketPrice: 'Gratis',
            },
            {
                name: 'Grand Indonesia',
                description: 'Pusat perbelanjaan premium dengan beragam pilihan tenant, restoran, dan hiburan.',
                lat: -6.1952,
                lng: 106.8194,
                categorySlug: 'belanja',
                address: 'Jl. M.H. Thamrin No.1, Jakarta',
                image: 'https://images.unsplash.com/photo-1519999482648-25049ddd37b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                nearestStation: 'Bundaran HI',
                stationType: 'MRT',
                distanceFromStation: 0.2,
                walkingTimeMinutes: 3,
                openingHours: '10:00 - 22:00',
                ticketPrice: 'Gratis Masuk',
            },
            {
                name: 'Masjid Istiqlal',
                description: 'Masjid terbesar di Asia Tenggara dengan arsitektur yang megah.',
                lat: -6.1702,
                lng: 106.8315,
                categorySlug: 'religi',
                address: 'Jl. Taman Wijaya Kusuma, Ps. Baru',
                image: 'https://images.unsplash.com/photo-1548048026-5a1a941d93da?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                nearestStation: 'Bundaran HI',
                stationType: 'MRT',
                distanceFromStation: 2.5,
                walkingTimeMinutes: 35,
                openingHours: '24 Jam',
                ticketPrice: 'Gratis',
            },

            // Publik
            {
                name: 'Gelora Bung Karno (GBK)',
                description: 'Kawasan fasilitas olahraga terbesar di Indonesia, lengkap dengan stadion dan taman yang bisa diakses publik.',
                lat: -6.2185,
                lng: 106.8016,
                categorySlug: 'ruang-terbuka-olahraga',
                address: 'Jl. Pintu Satu Senayan, Gelora',
                image: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                nearestStation: 'Istora Mandiri',
                stationType: 'MRT',
                distanceFromStation: 0.5,
                walkingTimeMinutes: 7,
                openingHours: '05:00 - 22:00',
                ticketPrice: 'Gratis Masuk Kawasan',
            },
            {
                name: 'Terowongan Kendal',
                description: 'Area pejalan kaki ikonik dan sering digunakan untuk pementasan seni, yang mengubungkan berbagai moda transportasi transportasi.',
                lat: -6.2023,
                lng: 106.8227,
                categorySlug: 'infrastruktur-pejalan-transit',
                address: 'Jl. Kendal, Dukuh Atas',
                image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                nearestStation: 'Dukuh Atas BNI',
                stationType: 'MRT',
                distanceFromStation: 0.1,
                walkingTimeMinutes: 2,
                openingHours: '24 Jam',
                ticketPrice: 'Gratis',
            },
            {
                name: 'Taman Literasi Martha Christina Tiahahu',
                description: 'Taman publik tematik berbasis literasi dengan fasilitas perpustakaan mini dan area hijau yang nyaman.',
                lat: -6.2443,
                lng: 106.7997,
                categorySlug: 'ruang-terbuka-olahraga',
                address: 'Jl. Sisingamangaraja, Blok M',
                image: 'https://images.unsplash.com/photo-1506869640319-baa1f349edb1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                nearestStation: 'Blok M BCA',
                stationType: 'MRT',
                distanceFromStation: 0.2,
                walkingTimeMinutes: 3,
                openingHours: '06:00 - 22:00',
                ticketPrice: 'Gratis',
            },
            {
                name: 'Sarinah Thamrin Plaza',
                description: 'Pusat perbelanjaan pertama di Indonesia dengan wajah baru sebagai ruang publik seni, budaya, dan produk lokal.',
                lat: -6.1873,
                lng: 106.8228,
                categorySlug: 'mall-plaza-terbuka',
                address: 'Jl. M.H. Thamrin No.11, Jakarta',
                image: 'https://images.unsplash.com/photo-1555396273-367ea4e18379?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                nearestStation: 'Bundaran HI',
                stationType: 'MRT',
                distanceFromStation: 0.8,
                walkingTimeMinutes: 10,
                openingHours: '10:00 - 22:00',
                ticketPrice: 'Gratis',
            }
        ];

        console.log(`Ready to insert ${destinationsData.length} destinations.`);

        for (const data of destinationsData) {
            const categoryId = categorySlugToId[data.categorySlug];

            if (!categoryId) {
                console.warn(`Category slug '${data.categorySlug}' not found for destination '${data.name}'. Skipping...`);
                continue;
            }

            // Check if exists
            const existing = await db.select().from(schema.destinations).where(eq(schema.destinations.name, data.name));

            if (existing.length === 0) {
                await db.insert(schema.destinations).values({
                    name: data.name,
                    description: data.description,
                    lat: data.lat,
                    lng: data.lng,
                    category: data.categorySlug, // Fix NOT NULL constraint
                    categoryId: categoryId,
                    address: data.address,
                    image: data.image,
                    nearestStation: data.nearestStation,
                    stationType: data.stationType,
                    distanceFromStation: data.distanceFromStation,
                    walkingTimeMinutes: data.walkingTimeMinutes,
                    openingHours: data.openingHours,
                    ticketPrice: data.ticketPrice,
                    isActive: true
                });
                console.log(`Created destination: ${data.name}`);
            } else {
                await db.update(schema.destinations)
                    .set({
                        description: data.description,
                        lat: data.lat,
                        lng: data.lng,
                        category: data.categorySlug, // Fix NOT NULL constraint
                        categoryId: categoryId,
                        address: data.address,
                        image: data.image,
                        nearestStation: data.nearestStation,
                        stationType: data.stationType,
                        distanceFromStation: data.distanceFromStation,
                        walkingTimeMinutes: data.walkingTimeMinutes,
                        openingHours: data.openingHours,
                        ticketPrice: data.ticketPrice,
                    })
                    .where(eq(schema.destinations.name, data.name));
                console.log(`Updated destination: ${data.name}`);
            }
        }

        console.log('Seed completed successfully!');
    } catch (error) {
        console.error('Error seeding destinations:', error);
    } finally {
        await pool.end();
    }
}

seedDestinations();
