# 1. Add destination cache flush helper in backend
sed -i '/async function flushVendorCache/i async function flushDestinationsCache() {\n    try {\n        let cursor = "0";\n        const keysToDelete: string[] = [];\n        do {\n            const reply = await redis.scan(cursor, "MATCH", "dest_cache_*", "COUNT", 100);\n            cursor = reply[0];\n            keysToDelete.push(...reply[1]);\n        } while (cursor !== "0");\n        if (keysToDelete.length > 0) {\n            await redis.del(...keysToDelete);\n            console.log(`[flushDestinationsCache] Flushed ${keysToDelete.length} keys`);\n        }\n    } catch (err) {\n        console.error("flushDestinationsCache error:", err);\n    }\n}\n' backend/src/index.ts

# 2. Add flush in mutations
sed -i 's/return c.json(created);/await flushDestinationsCache();\n        return c.json(created);/g' backend/src/index.ts
sed -i 's/return c.json(result\[0\]);/await flushDestinationsCache();\n        return c.json(result[0]);/g' backend/src/index.ts
sed -i 's/return c.json({ message: '"'"'Destination deleted successfully'"'"' });/await flushDestinationsCache();\n        return c.json({ message: '"'"'Destination deleted successfully'"'"' });/g' backend/src/index.ts
