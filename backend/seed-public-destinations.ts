import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './src/db/schema.js';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

interface PublicCsvRow {
    nama: string;
    kategori: string;
    'sub kategori': string;
    deskripsi: string;
    alamat: string;
    'Jam Operasional buka': string;
    tutup: string;
    stasiun: string;
    'Latitude ': string;
    'Longitude ': string;
    'google maps': string;
    gambar: string;
    'mobile phone': string;
}

async function seedPublicDestinations() {
    try {
        console.log('Reading public destinations CSV...');
        const csvPath = 'd:/playground/umkm-radar-mrt/data/publik.csv';
        const fileContent = fs.readFileSync(csvPath, { encoding: 'utf-8' });
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        }) as PublicCsvRow[];

        // Load categories to map slug to id
        const categories = await db.select().from(schema.destinationCategories);
        const categorySlugToId: Record<string, number> = {};
        for (const cat of categories) {
            categorySlugToId[cat.slug] = cat.id;
        }

        console.log(`Found ${records.length} public destinations to seed.`);
        for (const row of records) {
            const name = row['nama'];
            const description = row['deskripsi'];
            const lat = parseFloat(row['Latitude ']);
            const lng = parseFloat(row['Longitude ']);
            const subKategori = row['sub kategori'] || '';
            const address = row['alamat'];
            const image = row['gambar'];
            const nearestStation = row['stasiun'] || 'Blok M BCA';
            const openingHours = `${row['Jam Operasional buka']}-${row['tutup']}`;
            const contact = row['mobile phone'];

            // Map sub kategori to our defined categories
            let categorySlug = 'ruang-terbuka-olahraga'; // Default

            const lowerSub = subKategori.toLowerCase();
            if (lowerSub.includes('mall') || lowerSub.includes('plaza')) {
                categorySlug = 'mall-plaza-terbuka';
            } else if (lowerSub.includes('pejalan') || lowerSub.includes('transit') || lowerSub.includes('underpass') || lowerSub.includes('skybridge')) {
                categorySlug = 'infrastruktur-pejalan-transit';
            } else if (lowerSub.includes('sosial') || lowerSub.includes('keagamaan') || lowerSub.includes('masjid') || lowerSub.includes('mushola') || lowerSub.includes('religi')) {
                categorySlug = 'fasilitas-sosial-keagamaan';
            } else if (lowerSub.includes('terbuka') || lowerSub.includes('olahraga') || lowerSub.includes('taman')) {
                categorySlug = 'ruang-terbuka-olahraga';
            }

            const categoryId = categorySlugToId[categorySlug];
            if (!categoryId) {
                console.warn(`Category slug '${categorySlug}' not found for destination '${name}'. Skipping...`);
                continue;
            }

            // Check if destination already exists
            const existing = await db
                .select()
                .from(schema.destinations)
                .where(eq(schema.destinations.name, name));

            if (existing.length === 0) {
                await db.insert(schema.destinations).values({
                    name,
                    description,
                    lat,
                    lng,
                    category: categorySlug,
                    categoryId,
                    address,
                    image,
                    nearestStation,
                    stationType: 'MRT',
                    distanceFromStation: 0.1,
                    walkingTimeMinutes: 5,
                    openingHours,
                    ticketPrice: 'Gratis',
                    contact,
                    isActive: true,
                });
                console.log(`Created public destination: ${name}`);
            } else {
                await db
                    .update(schema.destinations)
                    .set({
                        description,
                        lat,
                        lng,
                        category: categorySlug,
                        categoryId,
                        address,
                        image,
                        nearestStation,
                        stationType: 'MRT',
                        openingHours,
                        contact,
                    })
                    .where(eq(schema.destinations.name, name));
                console.log(`Updated public destination: ${name}`);
            }
        }
        console.log('Public destinations seed completed successfully!');
    } catch (error) {
        console.error('Error seeding public destinations:', error);
    } finally {
        await pool.end();
    }
}

seedPublicDestinations();
