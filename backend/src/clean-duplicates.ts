import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq, inArray } from 'drizzle-orm';
import { vendors, products, vouchers, users, orders } from './db/schema';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/umkmradar',
});
const db = drizzle(pool);

async function cleanupDuplicates() {
    try {
        console.log('🔄 Memulai pembersihan duplicate vendors...');

        // 1. Ambil semua vendors
        const allVendors = await db.select().from(vendors);

        // 2. Kelompokkan berdasarkan nama
        const grouped = allVendors.reduce((acc, v) => {
            if (!acc[v.name]) acc[v.name] = [];
            acc[v.name].push(v);
            return acc;
        }, {} as Record<string, typeof allVendors>);

        // 3. Filter yang duplicate (> 1)
        const duplicates = Object.entries(grouped).filter(([_, group]) => group.length > 1);

        console.log(`Ditemukan ${duplicates.length} nama vendor yang duplikat.`);

        for (const [name, group] of duplicates) {
            console.log(`\n📦 Vendor: "${name}" (Total: ${group.length})`);

            // Cek jumlah produk tiap id
            const productsInfo = await Promise.all(
                group.map(async (v) => {
                    const vendorProducts = await db.select().from(products).where(eq(products.vendorId, v.id));
                    return { ...v, productCount: vendorProducts.length, products: vendorProducts };
                })
            );

            // Sort: prioritize vendor yang punya produk terbanyak
            productsInfo.sort((a, b) => b.productCount - a.productCount);

            // Kita simpan yang pertama (index 0)
            const vendorToKeep = productsInfo[0];
            const vendorsToDelete = productsInfo.slice(1);

            console.log(`  ✅ KEEP ID: ${vendorToKeep.id} (Punya ${vendorToKeep.productCount} produk)`);

            // Delete duplicates
            for (const vDel of vendorsToDelete) {
                console.log(`  🗑️  DELETING ID: ${vDel.id} (Punya ${vDel.productCount} produk)`);
                // Reassign / delete relasi
                if (vDel.productCount > 0) {
                    // Pindahkan products ke vendor yang disimpan
                    console.log(`      * Memindahkan ${vDel.productCount} produk ke ID ${vendorToKeep.id}...`);
                    await db.update(products)
                        .set({ vendorId: vendorToKeep.id })
                        .where(eq(products.vendorId, vDel.id));
                }

                // Unlink vouchers & users (nullable)
                await db.update(vouchers).set({ vendorId: null }).where(eq(vouchers.vendorId, vDel.id));
                await db.update(users).set({ vendorId: null }).where(eq(users.vendorId, vDel.id));

                // Pindahkan orders (opsional, jika kita tidak mau kehilangan history order)
                // await db.update(orders).set({ vendorId: vendorToKeep.id }).where(eq(orders.vendorId, vDel.id));
                await db.delete(orders).where(eq(orders.vendorId, vDel.id));

                // Terakhir hapus vendorya
                await db.delete(vendors).where(eq(vendors.id, vDel.id));
                console.log(`      * Sukses hapus Vendor ID ${vDel.id}`);
            }
        }

        console.log('\n✅ Pembersihan selesai.');
        process.exit(0);
    } catch (e) {
        console.error('❌ Error during cleanup:', e);
        process.exit(1);
    }
}

cleanupDuplicates();
