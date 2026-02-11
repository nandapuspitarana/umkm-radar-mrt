# FreshMart - Version History

## Version 1.0.0 (2026-02-03)

### Features
- ✅ Multi-vendor grocery marketplace platform
- ✅ Customer mobile-first web application
- ✅ Admin & Vendor dashboard
- ✅ Real-time order management
- ✅ Location-based vendor discovery
- ✅ Shopping cart with voucher support
- ✅ WhatsApp integration for orders
- ✅ Product catalog management
- ✅ Vendor profile management with operating hours
- ✅ Order status tracking (pending → confirmed → completed)
- ✅ Order cancellation feature for vendors
- ✅ Voucher & promo management
- ✅ Location tags for vendors (e.g., "Near MRT Bundaran HI")

### Technical Stack
- **Backend**: Hono.js, PostgreSQL 16, Redis 7, Drizzle ORM
- **Client**: React + Vite, Framer Motion, Lucide Icons
- **Dashboard**: React + Vite, Lucide Icons
- **Infrastructure**: Docker Compose, Elasticsearch 8.12
- **Deployment**: Cloudflare Tunnel support

### Docker Images
- `freshmart/backend:1.0.0` - Backend API service
- `freshmart/client:1.0.0` - Customer web application
- `freshmart/dashboard:1.0.0` - Admin & vendor dashboard

### Database Schema
- Users (admin, vendor roles)
- Vendors (with location, schedule, ratings)
- Products (with pricing, discounts, availability)
- Orders (with status tracking)
- Vouchers (global and vendor-specific)

### API Endpoints
- Authentication: `/api/login`
- Vendors: `/api/vendors` (GET, POST, PUT)
- Products: `/api/products` (GET, POST, PUT, DELETE)
- Orders: `/api/orders` (GET, POST, PATCH)
- Vouchers: `/api/vouchers` (GET, POST, DELETE)
- Settings: `/api/settings` (GET, POST)

### Known Issues
- Password hashing not implemented (TODO for production)
- Camera/QR scanner feature requires HTTPS and additional libraries

### Future Enhancements
- Payment gateway integration
- Push notifications
- Advanced analytics dashboard
- Mobile apps (iOS/Android)
- Multi-language support
