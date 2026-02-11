// Fix transport links in database
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/umkm_radar',
});

async function fixTransportLinks() {
    const client = await pool.connect();

    try {
        console.log('🔧 Fixing transport links...');

        // Read and execute the SQL migration
        const sqlPath = path.join(__dirname, 'backend', 'migrations', '007_fix_transport_links.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

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
