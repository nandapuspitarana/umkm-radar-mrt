import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/umkmradar',
});

async function runDestinationsMigration() {
    const client = await pool.connect();
    try {
        console.log('🔄 Running destinations migration...');

        // Read and execute the destinations migration file
        const migrationFile = path.join(__dirname, 'migrations', '006_create_destinations.sql');
        const sql = fs.readFileSync(migrationFile, 'utf8');
        await client.query(sql);
        console.log('✅ Destinations table created and seeded!');

        // Verify
        const result = await client.query('SELECT COUNT(*) FROM destinations');
        console.log(`📊 Total destinations: ${result.rows[0].count}`);

        console.log('🎉 Migration completed successfully!');
    } catch (error) {
        console.error('❌ Error running migration:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

runDestinationsMigration();
