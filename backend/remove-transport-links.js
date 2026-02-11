// Quick script to remove transport links from settings
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/umkmradar',
});

async function removeTransportLinks() {
    const client = await pool.connect();
    try {
        console.log('🗑️  Removing transport links from settings...');

        await client.query("DELETE FROM settings WHERE key = 'transport_links'");

        console.log('✅ Transport links removed!');
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

removeTransportLinks();
