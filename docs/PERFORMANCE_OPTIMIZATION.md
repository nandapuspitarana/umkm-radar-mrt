# Performance Optimization Plan

## Current Issues
1. ❌ Setiap page load melakukan fetch ulang dari server
2. ❌ Tidak ada caching di client side
3. ❌ Loading state terlalu lama
4. ❌ Redundant API calls untuk data yang sama

## Optimization Strategy

### Phase 1: Client-Side Caching dengan React Query
**Impact: High | Effort: Medium**

#### Benefits:
- Automatic background refetching
- Cache management
- Stale-while-revalidate strategy
- Optimistic updates
- Request deduplication

#### Implementation:
```bash
# Install dependencies
npm install @tanstack/react-query
```

#### Files to Update:
1. `client/src/main.jsx` - Setup QueryClient
2. `client/src/pages/Home.jsx` - Use useQuery for vendors
3. `dashboard/src/pages/Categories.jsx` - Use useQuery & useMutation
4. `dashboard/src/pages/Products.jsx` - Use useQuery
5. `dashboard/src/pages/Dashboard.jsx` - Use useQuery for orders

### Phase 2: Backend Optimization
**Impact: High | Effort: Low**

#### Database Indexes:
```sql
-- Vendors
CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_vendors_category ON vendors(category);

-- Products
CREATE INDEX idx_products_vendor ON products(vendor_id);
CREATE INDEX idx_products_available ON products(is_available);

-- Orders
CREATE INDEX idx_orders_vendor ON orders(vendor_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- Categories
CREATE INDEX idx_categories_active ON categories(is_active);
CREATE INDEX idx_categories_sort ON categories(sort_order);
```

#### Connection Pooling:
Already implemented with `pg.Pool` ✅

### Phase 3: Redis Caching (Optional)
**Impact: Medium | Effort: High**

Cache frequently accessed data:
- Categories list (TTL: 1 hour)
- Active vendors (TTL: 5 minutes)
- Settings (TTL: 10 minutes)

### Phase 4: API Response Optimization
**Impact: Medium | Effort: Low**

1. **Add ETag support** for conditional requests
2. **Compress responses** with gzip
3. **Pagination** for large datasets
4. **Field selection** to reduce payload size

## Implementation Priority

### Week 1: React Query Setup
- [ ] Install React Query
- [ ] Setup QueryClient in client app
- [ ] Setup QueryClient in dashboard app
- [ ] Migrate Home.jsx to useQuery
- [ ] Migrate Categories.jsx to useQuery/useMutation

### Week 2: Backend Optimization
- [ ] Add database indexes
- [ ] Implement response compression
- [ ] Add ETag support
- [ ] Optimize slow queries

### Week 3: Advanced Caching
- [ ] Setup Redis (optional)
- [ ] Implement cache invalidation strategy
- [ ] Add cache warming for critical data

## Expected Results

### Before Optimization:
- Initial load: ~2-3 seconds
- Subsequent loads: ~2-3 seconds (no cache)
- API calls per page: 3-5 requests

### After Optimization:
- Initial load: ~1-2 seconds
- Subsequent loads: ~100-300ms (from cache)
- API calls per page: 1-2 requests (with deduplication)
- Background refetch: automatic & transparent

## Monitoring

Track these metrics:
1. Time to First Byte (TTFB)
2. Cache hit rate
3. API response time
4. Client-side render time
5. Network waterfall

## Quick Wins (Can implement now)

1. ✅ Add indexes to database
2. ✅ Enable gzip compression
3. ✅ Implement React Query for categories
4. ✅ Add loading skeletons instead of spinners
