// Script to migrate assets from MinIO to local filesystem
import pg from 'pg';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/umkmradar',
});

const UPLOADS_DIR = path.resolve(__dirname, './uploads/assets');
const MINIO_URL = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
const MINIO_BUCKET = 'assets';

async function migrateAssets() {
    const client = await pool.connect();
    try {
        console.log('🔄 Migrating assets from MinIO to local filesystem...');

        // Ensure uploads directory exists
        if (!fs.existsSync(UPLOADS_DIR)) {
            fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        }

        // Get all assets from database
        const result = await client.query('SELECT * FROM assets ORDER BY id');
        const assets = result.rows;

        console.log(`📦 Found ${assets.length} assets to migrate`);

        let migrated = 0;
        let failed = 0;

        for (const asset of assets) {
            const localPath = path.join(UPLOADS_DIR, asset.storage_path);
            const localDir = path.dirname(localPath);

            // Ensure subdirectory exists
            if (!fs.existsSync(localDir)) {
                fs.mkdirSync(localDir, { recursive: true });
            }

            // Check if file already exists locally
            if (fs.existsSync(localPath)) {
                console.log(`⏭️  Already exists: ${asset.storage_path}`);
                migrated++;
                continue;
            }

            // Try to download from MinIO
            const minioUrl = `${MINIO_URL}/${MINIO_BUCKET}/${asset.storage_path}`;
            try {
                await downloadFile(minioUrl, localPath);
                migrated++;
                console.log(`✅ Migrated: ${asset.storage_path}`);
            } catch (err) {
                failed++;
                console.log(`❌ Failed: ${asset.storage_path} - ${err.message}`);

                // Create a placeholder image for failed downloads
                const placeholderSvg = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#e5e7eb"/><text x="100" y="100" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="sans-serif" font-size="12">${asset.filename}</text></svg>`;
                fs.writeFileSync(localPath, placeholderSvg);
                console.log(`📝 Created placeholder for: ${asset.storage_path}`);
            }
        }

        // Update bucket field to 'local' for all assets
        await client.query("UPDATE assets SET bucket = 'local'");

        console.log(`\n🎉 Migration complete!`);
        console.log(`   ✅ Migrated: ${migrated}`);
        console.log(`   ❌ Failed: ${failed}`);
    } catch (error) {
        console.error('❌ Migration error:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(dest);
        protocol.get(url, (response) => {
            if (response.statusCode !== 200) {
                file.close();
                fs.unlinkSync(dest);
                reject(new Error(`HTTP ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            file.close();
            if (fs.existsSync(dest)) fs.unlinkSync(dest);
            reject(err);
        });
    });
}

migrateAssets();
