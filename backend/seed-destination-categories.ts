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

async function seedDestinationCategories() {
    try {
        // First, create the tables if they don't exist
        await pool.query(`
            CREATE TABLE IF NOT EXISTS destination_categories (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                slug TEXT NOT NULL UNIQUE,
                type TEXT NOT NULL DEFAULT 'wisata',
                icon TEXT,
                banner_image TEXT,
                sort_order INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS destination_subcategories (
                id SERIAL PRIMARY KEY,
                category_id INTEGER REFERENCES destination_categories(id) NOT NULL,
                name TEXT NOT NULL,
                slug TEXT NOT NULL,
                banner_image TEXT,
                sort_order INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // Add columns to destinations table if they don't exist
        await pool.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'destinations' AND column_name = 'category_id') THEN
                    ALTER TABLE destinations ADD COLUMN category_id INTEGER REFERENCES destination_categories(id);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'destinations' AND column_name = 'subcategory_id') THEN
                    ALTER TABLE destinations ADD COLUMN subcategory_id INTEGER REFERENCES destination_subcategories(id);
                END IF;
            END $$;
        `);

        // Add new columns to existing tables if they don't exist
        await pool.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'destination_categories' AND column_name = 'type') THEN
                    ALTER TABLE destination_categories ADD COLUMN type TEXT NOT NULL DEFAULT 'wisata';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'destination_categories' AND column_name = 'banner_image') THEN
                    ALTER TABLE destination_categories ADD COLUMN banner_image TEXT;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'destination_subcategories' AND column_name = 'banner_image') THEN
                    ALTER TABLE destination_subcategories ADD COLUMN banner_image TEXT;
                END IF;
            END $$;
        `);

        console.log('Tables created/verified successfully');

        // Seed initial WISATA categories matching Wisata.jsx expectations
        const wisataCategories = [
            { name: 'Wisata Sejarah & Museum', slug: 'sejarah-museum', type: 'wisata', icon: 'landmark', sortOrder: 1 },
            { name: 'Wisata Budaya & Seni', slug: 'budaya-seni', type: 'wisata', icon: 'palette', sortOrder: 2 },
            { name: 'Wisata Religi', slug: 'religi', type: 'wisata', icon: 'church', sortOrder: 3 },
            { name: 'Wisata Alam & Ruang Terbuka', slug: 'alam-ruang-terbuka', type: 'wisata', icon: 'trees', sortOrder: 4 },
            { name: 'Wisata Keluarga & Rekreasi', slug: 'keluarga-rekreasi', type: 'wisata', icon: 'smile', sortOrder: 5 },
            { name: 'Wisata Edukasi', slug: 'edukasi', type: 'wisata', icon: 'graduation-cap', sortOrder: 6 },
            { name: 'Wisata Belanja', slug: 'belanja', type: 'wisata', icon: 'shopping-bag', sortOrder: 7 },
        ];

        // Seed PUBLIK categories matching Publik.jsx expectations
        const publikCategories = [
            { name: 'Ruang Terbuka & Olahraga', slug: 'ruang-terbuka-olahraga', type: 'publik', icon: 'trees', sortOrder: 1 },
            { name: 'Mall & Plaza Terbuka', slug: 'mall-plaza-terbuka', type: 'publik', icon: 'shopping-bag', sortOrder: 2 },
            { name: 'Infrastruktur Pejalan & Transit', slug: 'infrastruktur-pejalan-transit', type: 'publik', icon: 'footprints', sortOrder: 3 },
            { name: 'Fasilitas Sosial & Keagamaan', slug: 'fasilitas-sosial-keagamaan', type: 'publik', icon: 'heart', sortOrder: 4 },
        ];

        const allCategories = [...wisataCategories, ...publikCategories];

        for (const cat of allCategories) {
            const existing = await db.select().from(schema.destinationCategories).where(eq(schema.destinationCategories.slug, cat.slug));
            if (existing.length === 0) {
                await db.insert(schema.destinationCategories).values(cat);
                console.log(`Created category: ${cat.name} (${cat.type})`);
            } else {
                // Update existing with type if missing
                await db.update(schema.destinationCategories)
                    .set({ type: cat.type })
                    .where(eq(schema.destinationCategories.slug, cat.slug));
                console.log(`Category already exists: ${cat.name}`);
            }
        }

        console.log('Seed completed successfully!');
    } catch (error) {
        console.error('Error seeding:', error);
    } finally {
        await pool.end();
    }
}

seedDestinationCategories();
