import pg from 'pg';
const client = new pg.Client({ connectionString: 'postgres://postgres:password@localhost:5432/umkmradar' });
async function main() {
    await client.connect();
    const res = await client.query('SELECT id, name, type FROM destination_categories ORDER BY type, sort_order');
    console.table(res.rows);
    await client.end();
}
main();
