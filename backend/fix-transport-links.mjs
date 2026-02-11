// Fix transport links in database
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/umkmradar',
});

async function fixTransportLinks() {
    const client = await pool.connect();

    try {
        console.log('🔧 Fixing transport links...');

        // Read and execute the SQL migration
        const sqlPath = join(__dirname, 'migrations', '007_fix_transport_links.sql');
        const sql = readFileSync(sqlPath, 'utf8');

        await client.query(sql);

        console.log('✅ Transport links fixed successfully!');
        console.log('\nNew order:');
        console.log('  Top row: TiJe, Jaklingko, LRT Jakarta');
        console.log('  Bottom row: KAI Commuter, Whoosh');

    } catch (error) {
        console.error('❌ Error fixing transport links:', error.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

fixTransportLinks();
