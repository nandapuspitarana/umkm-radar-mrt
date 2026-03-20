import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    const res = await pool.query('SELECT id, name, slug FROM destination_categories WHERE type = \'wisata\'');
    console.table(res.rows);
    await pool.end();
}

main();
