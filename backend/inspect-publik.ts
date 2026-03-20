import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    try {
        const res = await pool.query('SELECT id, name, slug, type FROM destination_categories ORDER BY id');
        console.log('--- ALL CATEGORIES ---');
        res.rows.forEach(r => console.log(`${r.id}\t${r.type}\t${r.slug}\t${r.name}`));

        const res2 = await pool.query('SELECT count(*) as count, dc.name, dc.type FROM destinations d JOIN destination_categories dc ON dc.id = d.category_id GROUP BY dc.id, dc.name, dc.type');
        console.log('\n--- DESTINATION COUNTS PER CATEGORY ---');
        res2.rows.forEach(r => console.log(`${r.count}\t${r.type}\t${r.name}`));

        const res3 = await pool.query('SELECT d.id, d.name, d.category_id FROM destinations d JOIN destination_categories dc ON dc.id = d.category_id WHERE dc.type = \'publik\'');
        console.log('\n--- PUBLIC DESTINATIONS ---');
        res3.rows.forEach(r => console.log(`${r.id}\t${r.category_id}\t${r.name}`));
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

main();
