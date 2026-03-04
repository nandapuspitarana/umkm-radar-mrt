/**
 * Seeder: Merchants / Vendors dari file Excel
 * File: data/MERCHANTS and destination.xlsx
 *
 * Sheet "All Merchants" baris 1–76 (Kategori Utama bukan "Wisata"):
 *   - Kuliner, Ngopi, Ruang publik, ATM & Belanja, dll.
 *
 * Cara pakai:
 *   npx tsx seed-merchants-excel.ts
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import XLSX from 'xlsx';
import * as schema from './src/db/schema.js';
import { eq } from 'drizzle-orm';
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
        if (lower === '24 jam' || lower === '24jam') return '00:00'; // untuk keperluan schedule buka
        return value.trim();
    }
    if (typeof value === 'number') {
        // Excel menyimpan waktu sebagai fraksi hari (0–1)
        const totalMinutes = Math.round(value * 24 * 60);
        const h = Math.floor(totalMinutes / 60) % 24;
        const m = totalMinutes % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    return '';
}

// ─────────────────────────────────────────────
// Helper: deteksi "24 Jam"
// ─────────────────────────────────────────────
function is24Jam(open: any, close: any): boolean {
    if (typeof open === 'string' && open.trim().toLowerCase().includes('24')) return true;
    return false;
}

// ─────────────────────────────────────────────
// Mapping Kategori Utama Excel → slug category
// Mengikuti slug yang sudah ada di DB (dari seed-categories)
// ─────────────────────────────────────────────
function mapKategoriToSlug(kategori: string): string {
    const k = (kategori || '').toLowerCase();
    if (k.includes('kuliner')) return 'kuliner';
    if (k.includes('ngopi') || k.includes('kopi')) return 'ngopi';
    if (k.includes('atm') || k.includes('belanja')) return 'atm-belanja';
    if (k.includes('ruang publik') || k.includes('publik')) return 'ruang-publik';
    if (k.includes('wisata')) return 'wisata';
    return 'umum';
}

// ─────────────────────────────────────────────
// Bersihkan nama merchant untuk nilai WhatsApp
// (kolom Contact di Excel adalah nomor admin, bukan vendor)
// ─────────────────────────────────────────────
function formatWhatsapp(contact: any): string {
    if (!contact) return '';
    const s = String(contact).replace(/\D/g, '');
    if (s.startsWith('62')) return `+${s}`;
    if (s.startsWith('0')) return `+62${s.slice(1)}`;
    return `+62${s}`;
}

// ─────────────────────────────────────────────
// Main Seeder
// ─────────────────────────────────────────────
async function seedMerchantsFromExcel() {
    try {
        // 1. Baca Excel
        const filePath = path.join(__dirname, '..', 'data', 'MERCHANTS  and destination.xlsx');
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets['All Merchants'];
        const allRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        // 2. Filter hanya merchant (bukan "Wisata" murni)
        //    Baris yang memiliki Products (kolom kosong untuk destinations)
        //    atau Kategori Utama yang bukan "Wisata" saja
        const merchantRows = allRows.filter(row => {
            const kat = (row['Kategori Utama'] || '').toLowerCase();
            // Masukkan baris yang BUKAN hanya "Wisata"
            // atau yang punya field Products (nama produk)
            const hasProducts = String(row['Products'] || '').trim() !== '';
            const isWisataOnly = kat === 'wisata';
            return hasProducts || !isWisataOnly;
        });

        console.log(`📊 Total rows di Excel: ${allRows.length}`);
        console.log(`🏪 Merchant rows yang akan di-seed: ${merchantRows.length}`);

        // 3. Ambil semua category dari DB
        const categories = await db.select().from(schema.categories);
        const catSlugToId: Record<string, number> = {};
        for (const cat of categories) {
            catSlugToId[cat.slug] = cat.id;
        }
        console.log(`📁 Categories di DB: ${categories.map(c => c.slug).join(', ')}`);

        let created = 0;
        let updated = 0;
        let skipped = 0;

        for (const row of merchantRows) {
            const name = String(row['Nama Merchant / Tempat'] || '').trim();
            if (!name) { skipped++; continue; }

            const kategoriRaw = String(row['Kategori Utama'] || '').trim();
            const categorySlug = mapKategoriToSlug(kategoriRaw);
            const categoryId = catSlugToId[categorySlug] || null;

            const lat = typeof row['Latitude'] === 'number' ? row['Latitude'] : parseFloat(row['Latitude']) || 0;
            const lng = typeof row['Longitude'] === 'number' ? row['Longitude'] : parseFloat(row['Longitude']) || 0;

            // Pastikan lat negatif (koordinat Jakarta) - beberapa data mungkin salah tanda
            const correctedLat = lat > 0 ? -lat : lat;

            const openRaw = row['Jam Buka'];
            const closeRaw = row['Jam Tutup'];
            const isAllDay = is24Jam(openRaw, closeRaw);

            const openStr = isAllDay ? '00:00' : excelTimeToString(openRaw);
            const closeStr = isAllDay ? '23:59' : excelTimeToString(closeRaw);

            const schedule = {
                days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'],
                open: openStr || '10:00',
                close: closeStr || '22:00',
                holidayClosed: false,
                is24Hours: isAllDay,
                rawOpeningHours: isAllDay ? '24 Jam' : `${openStr} - ${closeStr}`,
            };

            const address = String(row['Alamat'] || '').trim();
            const description = String(row['Spesialisasi / Deskripsi'] || '').trim();
            const subcategory = String(row['Sub Kategori'] || '').trim();
            const locationTags = String(row['Tag Lokasi'] || '').trim();
            const photoFile = String(row['Photo Tempat / Merchant'] || '').trim();
            const contact = formatWhatsapp(row['Contact']);

            // Image: foto dari Excel belum di-upload ke MinIO → simpan null
            // Upload foto manual via dashboard admin setelah data masuk
            const image = null;

            // Nilai whatsapp wajib di schema (notNull), pakai nomor kontak atau default admin
            const whatsapp = contact || '+6281399008872';

            const vendorData = {
                name,
                lat: correctedLat,
                lng,
                whatsapp,
                address: address || 'Blok M, Jakarta Selatan',
                image,
                schedule: schedule as any,
                status: 'approved' as const,
                category: kategoriRaw || 'Umum',
                subcategory: subcategory || null,
                categoryId: categoryId ?? null,
                description: description || null,
                locationTags: locationTags || null,
            };

            // Check apakah sudah ada (by name)
            const existing = await db.select().from(schema.vendors).where(eq(schema.vendors.name, name));

            if (existing.length === 0) {
                await db.insert(schema.vendors).values(vendorData);
                console.log(`  ✅ Created: ${name}`);
                created++;
            } else {
                await db.update(schema.vendors)
                    .set({
                        lat: vendorData.lat,
                        lng: vendorData.lng,
                        address: vendorData.address,
                        // image: jangan timpa jika existing sudah punya image valid (sudah diupload)
                        ...(existing[0].image === null ? { image: null } : {}),
                        schedule: vendorData.schedule,
                        category: vendorData.category,
                        subcategory: vendorData.subcategory,
                        categoryId: vendorData.categoryId,
                        description: vendorData.description,
                        locationTags: vendorData.locationTags,
                    })
                    .where(eq(schema.vendors.name, name));
                console.log(`  🔄 Updated: ${name}`);
                updated++;
            }
        }

        console.log('\n─────────────────────────────────');
        console.log(`✅ Selesai seeding merchants dari Excel`);
        console.log(`   Created : ${created}`);
        console.log(`   Updated : ${updated}`);
        console.log(`   Skipped : ${skipped}`);
        console.log('─────────────────────────────────');
    } catch (error) {
        console.error('❌ Error seeding merchants:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

seedMerchantsFromExcel();
