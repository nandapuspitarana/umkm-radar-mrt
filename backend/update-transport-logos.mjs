// Update transport logos to PNG format
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/umkmradar',
});

async function updateLogos() {
    const client = await pool.connect();

    try {
        console.log('🔧 Updating transport logos to PNG format...');

        // Read and execute the SQL migration
        const sqlPath = join(__dirname, 'migrations', '008_use_png_transport_logos.sql');
        const sql = readFileSync(sqlPath, 'utf8');

        await client.query(sql);

        console.log('✅ Transport logos updated successfully!');
        console.log('\nNew logo format: PNG');
        console.log('  - TIJE.png');
        console.log('  - JAK.png (Jaklingko)');
        console.log('  - LRT.png');
        console.log('  - KAI.png');
        console.log('  - WHOOSH.png');

    } catch (error) {
        console.error('❌ Error updating logos:', error.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

updateLogos();
