import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    const res = await pool.query('SELECT count(*) as count FROM destinations WHERE subcategory_id IS NOT NULL');
    console.log(`With subcategory: ${res.rows[0].count}`);
    const res2 = await pool.query('SELECT count(*) as count FROM destinations WHERE subcategory_id IS NULL AND category_id IS NOT NULL');
    console.log(`With category only: ${res2.rows[0].count}`);
    await pool.end();
}

main();
