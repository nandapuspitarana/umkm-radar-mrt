import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { destinations, destinationCategories, destinationSubcategories, categories } from './db/schema.js';
import { eq } from 'drizzle-orm';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/umkmradar',
});

const db = drizzle(pool);

async function sync() {
    try {
        const dests = await db.select().from(destinations);
        const dcats = await db.select().from(destinationCategories);
        const dsubs = await db.select().from(destinationSubcategories);

        console.log(`Found ${dests.length} destinations.`);

        for (const dest of dests) {
            let catType = dest.category?.toLowerCase() === 'wisata' ? 'wisata' : 'publik';
            let catName = dest.category || 'Belum Terkategori';
            let subName = dest.subcategory || '';

            // Handle the case where category is just "Publik" and the subcategory stores the real category
            if (dest.category?.toLowerCase() === 'publik' || dest.category?.toLowerCase() === 'wisata') {
                catType = dest.category.toLowerCase() === 'publik' ? 'publik' : 'wisata';
                if (subName) {
                    catName = subName;
                    subName = '';
                } else {
                    catName = 'Belum Terkategori';
                }
            }

            // Find or create category
            let cat = dcats.find(c => c.name.toLowerCase() === catName.toLowerCase() && c.type === catType);
            if (!cat) {
                cat = dcats.find(c => c.name.toLowerCase().includes(catName.toLowerCase()) || catName.toLowerCase().includes(c.name.toLowerCase()));
            }

            if (!cat) {
                let slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                if (!slug) slug = 'cat-' + Math.random().toString(36).substring(7);

                // Make slug unique just in case
                let suffix = 0;
                while (dcats.some(c => c.slug === (suffix === 0 ? slug : slug + '-' + suffix))) {
                    suffix++;
                }
                if (suffix > 0) slug = slug + '-' + suffix;

                console.log(`Creating category: ${catName} (${catType}) with slug: ${slug}`);
                const res = await db.insert(destinationCategories).values({
                    name: catName,
                    slug: slug,
                    type: catType as 'wisata' | 'publik', // explicit cast for type safety
                    isActive: true,
                }).returning();
                cat = res[0];
                dcats.push(cat);
            }

            // Find or create subcategory
            let sub = null;
            if (subName) {
                sub = dsubs.find(s => s.name.toLowerCase() === subName.toLowerCase() && s.categoryId === cat.id);
                if (!sub) {
                    let slug = subName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    if (!slug) slug = 'sub-' + Math.random().toString(36).substring(7);

                    // Make slug unique just in case
                    let suffix = 0;
                    while (dsubs.some(s => s.slug === (suffix === 0 ? slug : slug + '-' + suffix))) {
                        suffix++;
                    }
                    if (suffix > 0) slug = slug + '-' + suffix;

                    console.log(`Creating subcategory: ${subName}`);
                    const res = await db.insert(destinationSubcategories).values({
                        categoryId: cat.id,
                        name: subName,
                        slug: slug,
                        isActive: true,
                    }).returning();
                    sub = res[0];
                    dsubs.push(sub);
                }
            }

            // Update destination
            await db.update(destinations).set({
                categoryId: cat.id,
                subcategoryId: sub ? sub.id : null,
                category: cat.name,
                subcategory: sub ? sub.name : null
            }).where(eq(destinations.id, dest.id));
            console.log(`Updated destination: ${dest.name} -> Cat: ${cat.name}, Sub: ${sub ? sub.name : '-'}`);
        }
        console.log('Done mapping.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
sync();
