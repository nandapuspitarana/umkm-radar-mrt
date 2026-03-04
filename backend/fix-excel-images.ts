/**
 * Script untuk memperbaiki field `image` pada vendors dan destinations
 * yang diisi dengan /uploads/<filename> dari seeder Excel,
 * padahal file belum ada di MinIO.
 *
 * Opsi:
 * - Mode "clear": Set semua image /uploads/<excelfile> menjadi null
 * - Mode "check": Hanya tampilkan data yang bermasalah
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './src/db/schema.js';
import { like, isNotNull, sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

// Deteksi apakah path adalah file Excel mentah (bukan hasil upload melalui sistem)
// File hasil upload sistem formatnya: /uploads/general/1234567890-abc123.jpg
// File dari seeder Excel formatnya: /uploads/00 Pizza-Hut.jpg (tanpa subfolder, ada spasi, dll)
function isRawExcelPath(imagePath: string | null): boolean {
    if (!imagePath) return false;
    // Format excel: /uploads/<filename> langsung (tanpa subfolder)
    const withoutPrefix = imagePath.replace('/uploads/', '');
    // File upload sistem selalu punya subfolder: general/, banners/, logo/
    const hasSubfolder = withoutPrefix.includes('/');
    return !hasSubfolder;
}

async function fixImagePaths(mode: 'check' | 'clear' = 'check') {
    console.log(`\n🔍 Mode: ${mode.toUpperCase()}\n`);

    // === Vendors ===
    const vendors = await db.select({
        id: schema.vendors.id,
        name: schema.vendors.name,
        image: schema.vendors.image,
    }).from(schema.vendors).where(isNotNull(schema.vendors.image));

    const vendorsToFix = vendors.filter(v => isRawExcelPath(v.image));
    const vendorsOk = vendors.filter(v => !isRawExcelPath(v.image));

    console.log(`📦 VENDORS`);
    console.log(`   Total dengan image: ${vendors.length}`);
    console.log(`   Image valid (sudah upload): ${vendorsOk.length}`);
    console.log(`   Image Excel (perlu fix): ${vendorsToFix.length}`);
    if (vendorsToFix.length > 0 && mode === 'check') {
        console.log(`   Sample fix:`, vendorsToFix.slice(0, 5).map(v => `${v.name} → ${v.image}`));
    }

    // === Destinations ===
    const destinations = await db.select({
        id: schema.destinations.id,
        name: schema.destinations.name,
        image: schema.destinations.image,
    }).from(schema.destinations).where(isNotNull(schema.destinations.image));

    const destsToFix = destinations.filter(d => isRawExcelPath(d.image));
    const destsOk = destinations.filter(d => !isRawExcelPath(d.image));

    console.log(`\n🗺️  DESTINATIONS`);
    console.log(`   Total dengan image: ${destinations.length}`);
    console.log(`   Image valid (sudah upload): ${destsOk.length}`);
    console.log(`   Image Excel (perlu fix): ${destsToFix.length}`);
    if (destsToFix.length > 0 && mode === 'check') {
        console.log(`   Sample fix:`, destsToFix.slice(0, 5).map(d => `${d.name} → ${d.image}`));
    }

    if (mode === 'clear') {
        console.log('\n🧹 Membersihkan image paths yang belum valid...');

        let fixedVendors = 0;
        for (const v of vendorsToFix) {
            await db.update(schema.vendors)
                .set({ image: null })
                .where(sql`id = ${v.id}`);
            fixedVendors++;
        }

        let fixedDests = 0;
        for (const d of destsToFix) {
            await db.update(schema.destinations)
                .set({ image: null })
                .where(sql`id = ${d.id}`);
            fixedDests++;
        }

        console.log(`\n✅ Selesai!`);
        console.log(`   Vendors diperbaiki : ${fixedVendors}`);
        console.log(`   Destinations diperbaiki : ${fixedDests}`);
        console.log(`\n💡 Foto bisa diupload manual via dashboard admin.`);
    }
}

const mode = (process.argv[2] as 'check' | 'clear') || 'check';

fixImagePaths(mode)
    .catch(e => { console.error('Error:', e); process.exit(1); })
    .finally(() => pool.end());
