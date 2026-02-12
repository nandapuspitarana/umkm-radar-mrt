import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { settings, vendors, categories, products } from './src/db/schema';
import { eq } from 'drizzle-orm';
import path from 'path';

// Load .env from current directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const dbUrl = process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/umkmradar';
console.log(`Connecting to database: ${dbUrl}`);

const pool = new Pool({
    connectionString: dbUrl,
});

const db = drizzle(pool);

async function main() {
    console.log('🚀 Starting database path fix...');

    const fixUrl = (url: any) => {
        if (typeof url === 'string' && url.includes('localhost:9000/assets/')) {
            return url.replace(/https?:\/\/localhost:9000\/assets\//, '');
        }
        return url;
    };

    // 1. Settings Table (Key-Value)
    console.log('Fetching settings...');
    const allSettings = await db.select().from(settings);

    for (const s of allSettings) {
        let val = s.value as any;
        let modified = false;

        // Only process relevant keys
        if (!['app_logo', 'homepage_banners', 'transport_links'].includes(s.key)) {
            continue;
        }

        if (s.key === 'app_logo') {
            if (typeof val === 'string') {
                const fixed = fixUrl(val);
                if (fixed !== val) {
                    val = fixed;
                    modified = true;
                }
            } else if (val && val.url) {
                const fixed = fixUrl(val.url);
                if (fixed !== val.url) {
                    val.url = fixed;
                    modified = true;
                }
            }
        } else if (s.key === 'homepage_banners') {
            let banners = Array.isArray(val) ? val : (val.banners || []);
            if (Array.isArray(banners)) {
                const newBanners = banners.map((b: any) => ({
                    ...b,
                    image: fixUrl(b.image)
                }));
                if (JSON.stringify(newBanners) !== JSON.stringify(banners)) {
                    if (Array.isArray(val)) {
                        val = newBanners;
                    } else {
                        val.banners = newBanners;
                    }
                    modified = true;
                }
            }
        } else if (s.key === 'transport_links') {
            let links = Array.isArray(val) ? val : (val.links || []);
            if (Array.isArray(links)) {
                const newLinks = links.map((l: any) => ({
                    ...l,
                    logo: fixUrl(l.logo)
                }));
                if (JSON.stringify(newLinks) !== JSON.stringify(links)) {
                    if (Array.isArray(val)) {
                        val = newLinks;
                    } else {
                        val.links = newLinks;
                    }
                    modified = true;
                }
            }
        }

        if (modified) {
            console.log(`Fixing settings key='${s.key}'`);
            await db.update(settings).set({ value: val }).where(eq(settings.id, s.id));
        }
    }

    // 2. Vendors Table (image)
    if (vendors) {
        console.log('Scanning vendors...');
        const allVendors = await db.select().from(vendors);
        for (const v of allVendors) {
            if (v.image && v.image.includes('localhost:9000/assets/')) {
                console.log(`Fixing vendor image #${v.id}`);
                const newImage = fixUrl(v.image);
                await db.update(vendors).set({ image: newImage }).where(eq(vendors.id, v.id));
            }
        }
    }

    // 3. Categories Table (icon)
    if (categories) {
        console.log('Scanning categories...');
        const allCategories = await db.select().from(categories);
        for (const c of allCategories) {
            if (c.icon && c.icon.includes('localhost:9000/assets/')) {
                console.log(`Fixing category icon #${c.id}`);
                const newIcon = fixUrl(c.icon);
                await db.update(categories).set({ icon: newIcon }).where(eq(categories.id, c.id));
            }
        }
    }

    // 4. Products Table (image)
    if (products) {
        console.log('Scanning products...');
        const allProducts = await db.select().from(products);
        for (const p of allProducts) {
            if (p.image && p.image.includes('localhost:9000/assets/')) {
                console.log(`Fixing product image #${p.id}`);
                const newImage = fixUrl(p.image);
                await db.update(products).set({ image: newImage }).where(eq(products.id, p.id));
            }
        }
    }

    console.log('✅ Database migration complete!');
    await pool.end();
}

main().catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
