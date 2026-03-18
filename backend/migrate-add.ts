import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgres://postgres:password@localhost:5432/umkmradar'
});

async function run() {
  try {
    await pool.query('ALTER TABLE destinations ADD COLUMN IF NOT EXISTS category_ids jsonb;');
    console.log('Added category_ids');
    await pool.query('ALTER TABLE destinations ADD COLUMN IF NOT EXISTS subcategory_ids jsonb;');
    console.log('Added subcategory_ids');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

run();
