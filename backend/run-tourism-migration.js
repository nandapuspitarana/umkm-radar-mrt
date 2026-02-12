import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
    connectionString: 'postgres://postgres:password@localhost:5432/umkmradar'
});

async function runMigration() {
    try {
        await client.connect();
        console.log('✅ Connected to database');

        const migrationPath = path.join(__dirname, 'migrations', '008_seed_tourism_destinations.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('🚀 Running tourism destinations migration...');
        await client.query(sql);
        console.log('✅ Tourism destinations seeded successfully!');

        // Verify the data
        const result = await client.query(`
            SELECT category, COUNT(*) as count 
            FROM destinations 
            WHERE category IN (
                'sejarah-museum',
                'budaya-seni',
                'religi',
                'alam-ruang-terbuka',
                'keluarga-rekreasi',
                'edukasi'
            )
            GROUP BY category
            ORDER BY category
        `);

        console.log('\n📊 Tourism Destinations Summary:');
        result.rows.forEach(row => {
            console.log(`  ${row.category}: ${row.count} destinations`);
        });

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await client.end();
        console.log('\n✅ Database connection closed');
    }
}

runMigration();
