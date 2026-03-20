import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './src/db/schema.js';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

const cats = await db.select().from(schema.destinationCategories);
cats.forEach(c => console.log(`CAT id=${c.id} slug=${c.slug} type=${c.type}`));

const dests = await db.select().from(schema.destinations);
console.log('\nTOTAL DESTS:', dests.length);
dests.forEach(d => console.log(`DEST id=${d.id} name="${d.name}" category="${d.category}" categoryId=${d.categoryId} active=${d.isActive}`));

await pool.end();
