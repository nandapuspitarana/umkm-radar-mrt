import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/umkm_radar',
});

async function patch() {
    try {
        console.log("Backing up vendors table...");
        await pool.query("CREATE TABLE IF NOT EXISTS vendors_backup AS SELECT * FROM vendors;");
        console.log("Backup completed.");
        
        console.log("Adding subcategory column to vendors...");
        await pool.query("ALTER TABLE vendors ADD COLUMN IF NOT EXISTS subcategory TEXT;");
        console.log("Added subcategory column successfully.");
    } catch(e) {
        console.error("Error patching DB:", e);
    }
    process.exit(0);
}
patch();
