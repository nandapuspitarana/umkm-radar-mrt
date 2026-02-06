
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';


// Mock Redis
vi.mock('ioredis', () => {
    const mockRedisInstance = {
        on: vi.fn(),
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue('OK'),
        del: vi.fn().mockResolvedValue(1),
    };
    return {
        default: class {
            constructor() {
                return mockRedisInstance;
            }
        }
    };
});

// Mock Postgres Pool
vi.mock('pg', () => {
    class MockPool {
        connect() { return { release: () => { } }; }
        query() { return Promise.resolve({ rows: [] }); }
        end() { return Promise.resolve(); }
    }
    return {
        Pool: MockPool
    };
});

// Mock Drizzle behavior control variables
// We need a way to control the mock behavior from tests, but since we are moving definition inside, 
// we need to expose the mock function or use a global/hoisted variable.
// Let's use vi.hoisted for the db mock to allow control.

const { mockDb } = vi.hoisted(() => {
    const db = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => resolve([])),
    };
    return { mockDb: db };
});

vi.mock('drizzle-orm/node-postgres', () => {
    return {
        drizzle: vi.fn(() => mockDb)
    };
});

// Implement specific return behaviors (this runs after hoisting, which is fine)
mockDb.returning.mockImplementation(() => ({
    then: (resolve: any) => resolve([{ id: 1, name: 'Test', email: 'test@example.com' }])
}));

// Now import the app
import { app } from './index';


describe('Backend API Tests', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset default promise resolution for db
        mockDb.then = vi.fn((resolve) => resolve([]));
    });

    describe('GET /api/vendors', () => {
        it('should return 200 and list vendors', async () => {
            // Setup mock for select -> from -> promise
            // The chain is: db.select().from(vendors)
            // We need to ensure the final object (from result) has a .then or is a promise resolving to data

            // Hacky mock adjustment for this test
            const vendorList = [{ id: 1, name: 'Vendor 1', lat: 0, lng: 0 }];
            mockDb.from.mockReturnValueOnce({
                // @ts-ignore
                then: (resolve) => resolve(vendorList),
                map: (cb: any) => vendorList.map(cb) // In case map is called on the query builder? No, map is on result.
            });

            const res = await app.request('/api/vendors');
            expect(res.status).toBe(200);
            const data = await res.json();
            // The code transforms result using .map, so ensure mock returns array
            expect(data).toBeInstanceOf(Array);
        });
    });

    describe('POST /api/vendors', () => {
        it('should create a new vendor', async () => {
            const newVendor = { name: 'New Vendor', lat: 10, lng: 10, whatsapp: '123', address: 'Address' };

            // Mock insert...values...returning
            mockDb.returning.mockReturnValueOnce(Promise.resolve([{ id: 2, ...newVendor }]));

            const res = await app.request('/api/vendors', {
                method: 'POST',
                body: JSON.stringify(newVendor),
                headers: { 'Content-Type': 'application/json' }
            });

            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.name).toBe(newVendor.name);
        });
    });

    describe('Security Tests', () => {
        it('should handle XSS payloads in inputs', async () => {
            // We want to ensure that even if a script tag is sent, it's saved as text (DB handles it)
            // and the API doesn't execute it or crash.
            // But main XSS protection is on Client output.
            // On backend, we just check if it accepts it.

            const xssPayload = { name: '<script>alert(1)</script>', lat: 0, lng: 0 };
            mockDb.returning.mockReturnValueOnce(Promise.resolve([{ id: 3, ...xssPayload }]));

            const res = await app.request('/api/vendors', {
                method: 'POST',
                body: JSON.stringify(xssPayload),
                headers: { 'Content-Type': 'application/json' }
            });

            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.name).toBe('<script>alert(1)</script>'); // It acts as a simpler echo here
        });

        it('should survive SQL Injection attempts in login', async () => {
            // Mock login select
            // db.select().from(users).where(eq(users.email, email)).limit(1);

            // If injection works, it might change the query structure, but Drizzle uses params.
            // We can't easily verify Drizzle's internal parameterization here without deep spying,
            // but we can verify our logic doesn't crash.

            mockDb.limit.mockReturnValueOnce(Promise.resolve([])); // User not found

            const loginPayload = { email: "' OR '1'='1", password: "password", role: "admin" };
            const res = await app.request('/api/login', {
                method: 'POST',
                body: JSON.stringify(loginPayload),
                headers: { 'Content-Type': 'application/json' }
            });

            // Should return 401 because user not found (or 500 if DB crashed)
            expect(res.status).toBe(401);
            expect(await res.json()).toEqual({ error: 'Email tidak terdaftar.' });
        });
    });
});
