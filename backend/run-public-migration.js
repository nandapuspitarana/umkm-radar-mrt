// Quick script to run the public destinations migration
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/umkmradar'
});

async function runMigration() {
    try {
        console.log('🔄 Running public destinations migration...');

        const sqlFile = path.join(__dirname, 'migrations', '007_seed_public_destinations.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        await pool.query(sql);

        console.log('✅ Migration completed successfully!');

        // Show summary
        const result = await pool.query(`
      SELECT category, COUNT(*) as total
      FROM destinations
      WHERE category IN ('ruang-terbuka-olahraga', 'mall-plaza', 'infrastruktur-transit', 'sosial-keagamaan')
      GROUP BY category
      ORDER BY category
    `);

        console.log('\n📊 Public Destinations Summary:');
        result.rows.forEach(row => {
            console.log(`   ${row.category}: ${row.total} destinations`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();
