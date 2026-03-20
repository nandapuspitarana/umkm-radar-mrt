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

interface WisataCsvRow {
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

async function seedWisataDestinations() {
    try {
        console.log('Reading wisata destinations CSV...');
        const csvPath = 'd:/playground/umkm-radar-mrt/data/wisata.csv';
        const fileContent = fs.readFileSync(csvPath, { encoding: 'utf-8' });
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        }) as WisataCsvRow[];

        // Load categories to map slug to id
        const categories = await db.select().from(schema.destinationCategories);
        const categorySlugToId: Record<string, number> = {};
        for (const cat of categories) {
            categorySlugToId[cat.slug] = cat.id;
        }

        console.log(`Found ${records.length} wisata destinations to seed.`);
        for (const row of records) {
            const name = row['nama'];
            const description = row['deskripsi'];
            const latStr = (row['Latitude '] || '').trim();
            const lngStr = (row['Longitude '] || '').trim();
            const lat = parseFloat(latStr);
            const lng = parseFloat(lngStr);
            const subKategori = row['sub kategori'] || '';
            const address = row['alamat'];
            const image = row['gambar'];
            const nearestStation = row['stasiun'] || 'Blok M BCA';
            const openingHours = `${row['Jam Operasional buka']}-${row['tutup']}`;
            const contact = row['mobile phone'];

            // Mapping algorithm for categories
            const categoryIds: number[] = [];
            const lowerSub = subKategori.toLowerCase();

            // Check for matches and add all that apply
            if (lowerSub.includes('sejarah') || lowerSub.includes('museum')) {
                if (categorySlugToId['sejarah-museum']) categoryIds.push(categorySlugToId['sejarah-museum']);
            }
            if (lowerSub.includes('seni') || lowerSub.includes('budaya')) {
                if (categorySlugToId['budaya-seni']) categoryIds.push(categorySlugToId['budaya-seni']);
            }
            if (lowerSub.includes('religi') || lowerSub.includes('masjid') || lowerSub.includes('gereja') || lowerSub.includes('vihara')) {
                if (categorySlugToId['religi']) categoryIds.push(categorySlugToId['religi']);
            }
            if (lowerSub.includes('alam') || lowerSub.includes('taman') || lowerSub.includes('hutan') || lowerSub.includes('pantai') || lowerSub.includes('terbuka') || lowerSub.includes('pulau')) {
                if (categorySlugToId['alam-ruang-terbuka']) categoryIds.push(categorySlugToId['alam-ruang-terbuka']);
            }
            if (lowerSub.includes('keluarga') || lowerSub.includes('rekreasi') || lowerSub.includes('dufan') || lowerSub.includes('ancol') || lowerSub.includes('aquarium')) {
                if (categorySlugToId['keluarga-rekreasi']) categoryIds.push(categorySlugToId['keluarga-rekreasi']);
            }
            if (lowerSub.includes('edukasi') || lowerSub.includes('iptek') || lowerSub.includes('sains')) {
                if (categorySlugToId['edukasi']) categoryIds.push(categorySlugToId['edukasi']);
            }

            // Fallback if no matching categories found
            if (categoryIds.length === 0) {
                if (categorySlugToId['sejarah-museum']) categoryIds.push(categorySlugToId['sejarah-museum']);
            }

            const primaryId = categoryIds[0];
            const primarySlug = categories.find(c => c.id === primaryId)?.slug || 'sejarah-museum';

            // Check if destination already exists
            const existing = await db
                .select()
                .from(schema.destinations)
                .where(eq(schema.destinations.name, name));

            const destinationData = {
                name,
                description,
                lat: isNaN(lat) ? -6.175392 : lat,
                lng: isNaN(lng) ? 106.827153 : lng,
                category: primarySlug,
                categoryId: primaryId,
                categoryIds: categoryIds,
                address,
                image,
                nearestStation,
                stationType: 'MRT',
                distanceFromStation: 0.1,
                walkingTimeMinutes: 5,
                openingHours,
                ticketPrice: 'Cek di Lokasi',
                contact,
                isActive: true,
            };

            if (existing.length === 0) {
                await db.insert(schema.destinations).values(destinationData);
                console.log(`Created wisata destination: ${name}`);
            } else {
                await db
                    .update(schema.destinations)
                    .set(destinationData)
                    .where(eq(schema.destinations.name, name));
                console.log(`Updated wisata destination: ${name}`);
            }
        }
        console.log('Wisata destinations seed completed successfully!');
    } catch (error) {
        console.error('Error seeding wisata destinations:', error);
    } finally {
        await pool.end();
    }
}

seedWisataDestinations();
