import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'freshmart',
});

async function runMigrations() {
    const client = await pool.connect();
    try {
        console.log('🔄 Running database migrations...');

        // Read and execute the dummy data seed file
        console.log('📦 Seeding dummy data...');
        const seedFile = path.join(__dirname, 'migrations', '999_seed_dummy_data.sql');
        const sql = fs.readFileSync(seedFile, 'utf8');
        await client.query(sql);
        console.log('✅ Dummy data seeded!');

        // Read and execute the assets seed file
        console.log('🖼️  Seeding assets (navbar, banners, icons)...');
        const assetsFile = path.join(__dirname, 'migrations', '998_seed_assets.sql');
        const assetsSql = fs.readFileSync(assetsFile, 'utf8');
        await client.query(assetsSql);
        console.log('✅ Assets seeded!');

        console.log('🎉 All migrations completed successfully!');
    } catch (error) {
        console.error('❌ Error running migrations:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

runMigrations();
