/**
 * Seeder: Destinations dari file Excel
 * File: data/MERCHANTS and destination.xlsx
 *
 * Sheet "All Merchants" baris 77–118 (Kategori Utama = "Wisata"):
 *   - Sejarah & Museum, Budaya & Seni, Religi, Alam & Ruang Terbuka,
 *     Keluarga & Rekreasi, Edukasi
 *
 * Cara pakai:
 *   npx tsx seed-destinations-excel.ts
 *
 * Prasyarat:
 *   - Jalankan seed-destination-categories.ts terlebih dahulu
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import XLSX from 'xlsx';
import * as schema from './src/db/schema.js';
import { eq, and } from 'drizzle-orm';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

// ─────────────────────────────────────────────
// Helper: konversi waktu Excel serial → "HH:MM"
// ─────────────────────────────────────────────
function excelTimeToString(value: any): string {
    if (!value && value !== 0) return '';
    if (typeof value === 'string') {
        const lower = value.trim().toLowerCase();
        if (lower.includes('24 jam')) return '24 Jam';
        return value.trim();
    }
    if (typeof value === 'number') {
        const totalMinutes = Math.round(value * 24 * 60);
        const h = Math.floor(totalMinutes / 60) % 24;
        const m = totalMinutes % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    return '';
}

function buildOpeningHours(openRaw: any, closeRaw: any): string {
    if (typeof openRaw === 'string' && openRaw.trim().toLowerCase().includes('24')) {
        return '24 Jam';
    }
    const open = excelTimeToString(openRaw);
    const close = excelTimeToString(closeRaw);
    if (!open && !close) return '';
    if (!close || close === '00:00') return open || '24 Jam';
    return `${open} - ${close}`;
}

// ─────────────────────────────────────────────
// Mapping Sub Kategori Excel → slug category di DB
// Mengikuti slug yang sudah di-seed oleh seed-destination-categories.ts
// ─────────────────────────────────────────────
function mapSubKategoriToCategory(subKategori: string): string {
    const sub = (subKategori || '').toLowerCase();

    // Cek urutan prioritas
    if (sub.includes('sejarah') || sub.includes('museum')) return 'sejarah-museum';
    if (sub.includes('religi') || sub.includes('keagamaan')) return 'religi';
    if (sub.includes('seni') || sub.includes('budaya')) return 'budaya-seni';
    if (sub.includes('keluarga') || sub.includes('rekreasi')) return 'keluarga-rekreasi';
    if (sub.includes('edukasi')) return 'edukasi';
    if (sub.includes('alam') || sub.includes('ruang terbuka')) return 'alam-ruang-terbuka';
    if (sub.includes('belanja') || sub.includes('mall')) return 'belanja';

    return 'alam-ruang-terbuka'; // fallback
}

// Mapping berdasarkan nama Photo (prefix) yang lebih akurat
function mapPhotoToCategory(photo: string): string | null {
    if (!photo) return null;
    const p = photo.toLowerCase();
    if (p.startsWith('sejarah-museum') || p.startsWith('sejarah')) return 'sejarah-museum';
    if (p.startsWith('religi')) return 'religi';
    if (p.startsWith('budaya-seni') || p.startsWith('budaya')) return 'budaya-seni';
    if (p.startsWith('keluarga-rekreasi') || p.startsWith('keluarga')) return 'keluarga-rekreasi';
    if (p.startsWith('edukasi')) return 'edukasi';
    if (p.startsWith('alam-ruang-terbuka') || p.startsWith('alam')) return 'alam-ruang-terbuka';
    return null;
}

// ─────────────────────────────────────────────
// Mapping nearest station berdasarkan lokasi
// (destinations tersebar se-Jakarta, pakai stasiun MRT terdekat umum)
// ─────────────────────────────────────────────
function guessNearestStation(lat: number, lng: number): { station: string; type: string } {
    // Koordinat stasiun MRT Jakarta (approximate)
    const stations = [
        { name: 'Lebak Bulus Grab', lat: -6.2894, lng: 106.7742, type: 'MRT' },
        { name: 'Fatmawati Indomaret', lat: -6.2768, lng: 106.7944, type: 'MRT' },
        { name: 'Cipete Raya', lat: -6.2666, lng: 106.7996, type: 'MRT' },
        { name: 'Haji Nawi', lat: -6.2583, lng: 106.7994, type: 'MRT' },
        { name: 'Blok A', lat: -6.2501, lng: 106.7993, type: 'MRT' },
        { name: 'Blok M BCA', lat: -6.2443, lng: 106.7988, type: 'MRT' },
        { name: 'ASEAN', lat: -6.2357, lng: 106.7994, type: 'MRT' },
        { name: 'Senayan', lat: -6.2272, lng: 106.8007, type: 'MRT' },
        { name: 'Istora Mandiri', lat: -6.2234, lng: 106.8023, type: 'MRT' },
        { name: 'Bendungan Hilir', lat: -6.2127, lng: 106.8183, type: 'MRT' },
        { name: 'Setiabudi Astra', lat: -6.2075, lng: 106.8218, type: 'MRT' },
        { name: 'Dukuh Atas BNI', lat: -6.2011, lng: 106.8229, type: 'MRT' },
        { name: 'Bundaran HI', lat: -6.1953, lng: 106.8230, type: 'MRT' },
    ];

    let nearest = stations[0];
    let minDist = Infinity;

    for (const s of stations) {
        const dist = Math.sqrt(Math.pow(lat - s.lat, 2) + Math.pow(lng - s.lng, 2));
        if (dist < minDist) {
            minDist = dist;
            nearest = s;
        }
    }

    return { station: nearest.name, type: nearest.type };
}

// ─────────────────────────────────────────────
// Main Seeder
// ─────────────────────────────────────────────
async function seedDestinationsFromExcel() {
    try {
        // 1. Baca Excel
        const filePath = path.join(__dirname, '..', 'data', 'MERCHANTS  and destination.xlsx');
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets['All Merchants'];
        const allRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        // 2. Filter hanya rows "Wisata" murni (baris 77–118 berdasarkan nomor)
        //    Identifikasi: Kategori Utama mengandung "Wisata" dan Products kosong
        const wisataRows = allRows.filter(row => {
            const kat = (row['Kategori Utama'] || '').toLowerCase();
            const hasProducts = String(row['Products'] || '').trim() !== '';
            const isWisata = kat.includes('wisata');
            // Destination: kategori mengandung wisata ATAU tidak punya Products
            return isWisata && !hasProducts;
        });

        console.log(`📊 Total rows di Excel: ${allRows.length}`);
        console.log(`🗺️  Destination rows: ${wisataRows.length}`);

        // 3. Ambil semua destination categories dari DB
        const categories = await db.select().from(schema.destinationCategories);
        if (categories.length === 0) {
            console.error('❌ Tidak ada destination_categories di DB!');
            console.error('   Jalankan terlebih dahulu: npx tsx seed-destination-categories.ts');
            process.exit(1);
        }
        const catSlugToId: Record<string, number> = {};
        const catSlugToType: Record<string, string> = {};
        for (const cat of categories) {
            catSlugToId[cat.slug] = cat.id;
            catSlugToType[cat.slug] = cat.type;
        }
        console.log(`📁 Categories di DB: ${categories.map(c => c.slug).join(', ')}`);

        let created = 0;
        let updated = 0;
        let skipped = 0;

        for (const row of wisataRows) {
            const name = String(row['Nama Merchant / Tempat'] || '').trim();
            if (!name) { skipped++; continue; }

            const lat = typeof row['Latitude'] === 'number' ? row['Latitude'] : parseFloat(row['Latitude']) || 0;
            const lng = typeof row['Longitude'] === 'number' ? row['Longitude'] : parseFloat(row['Longitude']) || 0;

            // Koordinat Jakarta selatan positif = salah tanda
            const correctedLat = lat > 0 && lat < 10 ? -lat : lat;

            if (correctedLat === 0 || lng === 0) {
                console.warn(`  ⚠️  Skip (invalid coords): ${name}`);
                skipped++;
                continue;
            }

            const subKategoriRaw = String(row['Sub Kategori'] || '').trim();
            const photoFile = String(row['Photo Tempat / Merchant'] || '').trim();

            // Prioritas: dari prefix foto → dari sub kategori
            const catSlug = mapPhotoToCategory(photoFile) || mapSubKategoriToCategory(subKategoriRaw);
            const categoryId = catSlugToId[catSlug];

            if (!categoryId) {
                console.warn(`  ⚠️  Category slug '${catSlug}' tidak ditemukan untuk: ${name}`);
            }

            const openingHours = buildOpeningHours(row['Jam Buka'], row['Jam Tutup']);
            const { station: nearestStation, type: stationType } = guessNearestStation(correctedLat, lng);

            // Image: foto dari Excel belum di-upload ke MinIO → simpan null
            // Upload foto manual via dashboard admin setelah data masuk
            const image = null;
            const description = String(row['Spesialisasi / Deskripsi'] || '').trim();
            const address = String(row['Alamat'] || '').trim();
            const ticketPrice = String(row['Tiket'] || '').trim() || null;

            const destinationData = {
                name: name.trim(),
                description: description || null,
                lat: correctedLat,
                lng,
                category: catSlug,
                categoryId: categoryId || null,
                address: address || null,
                image,
                nearestStation,
                stationType,
                distanceFromStation: null,
                walkingTimeMinutes: null,
                openingHours: openingHours || null,
                ticketPrice,
                isActive: true,
            };

            // Check apakah sudah ada (by name)
            const existing = await db.select().from(schema.destinations).where(eq(schema.destinations.name, name.trim()));

            if (existing.length === 0) {
                await db.insert(schema.destinations).values(destinationData);
                console.log(`  ✅ Created: ${name} (${catSlug})`);
                created++;
            } else {
                await db.update(schema.destinations)
                    .set({
                        description: destinationData.description,
                        lat: destinationData.lat,
                        lng: destinationData.lng,
                        category: destinationData.category,
                        categoryId: destinationData.categoryId,
                        address: destinationData.address,
                        // image: jangan timpa jika existing sudah punya image valid (sudah diupload)
                        ...(existing[0].image === null ? { image: null } : {}),
                        nearestStation: destinationData.nearestStation,
                        stationType: destinationData.stationType,
                        openingHours: destinationData.openingHours,
                        ticketPrice: destinationData.ticketPrice,
                    })
                    .where(eq(schema.destinations.name, name.trim()));
                console.log(`  🔄 Updated: ${name} (${catSlug})`);
                updated++;
            }
        }

        console.log('\n─────────────────────────────────');
        console.log(`✅ Selesai seeding destinations dari Excel`);
        console.log(`   Created : ${created}`);
        console.log(`   Updated : ${updated}`);
        console.log(`   Skipped : ${skipped}`);
        console.log('─────────────────────────────────');
    } catch (error) {
        console.error('❌ Error seeding destinations:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

seedDestinationsFromExcel();
