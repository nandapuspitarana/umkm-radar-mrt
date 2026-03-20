import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    const res = await pool.query('SELECT * FROM destination_categories');
    res.rows.forEach(r => {
        console.log(`${r.id}\t${r.type}\t${r.slug}\t${r.name}`);
    });
    await pool.end();
}

main();
