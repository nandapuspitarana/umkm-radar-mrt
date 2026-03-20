import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    const res = await pool.query('SELECT ds.id, ds.name, dc.name as cat_name FROM destination_subcategories ds JOIN destination_categories dc ON dc.id = ds.category_id WHERE dc.type = \'publik\'');
    console.log(JSON.stringify(res.rows, null, 2));
    await pool.end();
}

main();
