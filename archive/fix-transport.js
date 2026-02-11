// Quick script to fix transport links in database
import { drizzle } from 'drizzle-orm/drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { settings } from './backend/src/db/schema.js';
import { eq } from 'drizzle-orm';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/umkm_radar',
});

const db = drizzle(pool);

const newTransportLinks = {
    links: [
        {
            id: 1,
            name: "TiJe",
            logo: "/assets/transport/tije-logo.svg",
            url: "https://transjakarta.co.id"
        },
        {
            id: 2,
            name: "Jaklingko",
            logo: "/assets/transport/jaklingko-logo.svg",
            url: "https://jaklingko.jakarta.go.id"
        },
        {
            id: 3,
            name: "LRT Jakarta",
            logo: "/assets/transport/lrt-logo.svg",
            url: "https://lrtjakarta.co.id"
        },
        {
            id: 4,
            name: "KAI Commuter",
            logo: "/assets/transport/kai-commuter-logo.svg",
            url: "https://krl.co.id"
        },
        {
            id: 5,
            name: "Whoosh",
            logo: "/assets/transport/whoosh-logo.svg",
            url: "https://whoosh.co.id"
        }
    ]
};

try {
    await db.update(settings)
        .set({ value: newTransportLinks })
        .where(eq(settings.key, 'transport_links'));

    console.log('✅ Transport links updated successfully!');
    await pool.end();
} catch (error) {
    console.error('❌ Error updating transport links:', error);
    await pool.end();
    process.exit(1);
}
