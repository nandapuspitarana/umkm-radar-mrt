# 🚇 UMKM Radar MRT

Platform untuk menemukan UMKM terbaik di sekitar stasiun MRT Jakarta. Memudahkan pengguna menemukan kuliner, kopi, wisata, dan fasilitas publik terdekat dari stasiun MRT.

![UMKM Radar MRT](https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200&h=400&fit=crop)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Database Setup](#-database-setup)
- [Documentation](#-documentation)
- [API Endpoints](#-api-endpoints)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🌐 Client App (User-Facing)
- 🗺️ **Interactive Map** - Lihat vendor di peta dengan marker
- 📍 **Location-Based** - Temukan UMKM terdekat dari lokasi Anda
- 🏷️ **Category Filter** - Filter berdasarkan kategori (Kuliner, Ngopi, Wisata, dll)
- 🛒 **Shopping Cart** - Keranjang belanja dengan voucher support
- 📱 **Responsive Design** - Mobile-friendly interface
- 🎟️ **Voucher System** - Diskon dengan kode voucher
- 📦 **Order Tracking** - Track pesanan dengan pickup code
- ⭐ **Ratings & Reviews** - Lihat rating vendor dan produk

### 🎛️ Admin Dashboard
- 👥 **Vendor Management** - CRUD vendors dengan approval system
- 📦 **Product Management** - Kelola produk per vendor
- 📊 **Order Management** - Track dan update status pesanan
- 🏷️ **Category Management** - Kelola kategori secara dinamis
- 🧭 **Navigation Management** - Kelola menu header/footer
- 🖼️ **Asset Management** - Upload dan kelola gambar (MinIO)
- 🎟️ **Voucher Management** - Buat dan kelola voucher diskon
- ⚙️ **Settings** - Konfigurasi aplikasi
- 📈 **Analytics** - Dashboard dengan statistik

### 🔐 Vendor Dashboard
- 📦 **Product Management** - Kelola produk sendiri
- 📋 **Order Management** - Lihat dan proses pesanan
- ⚙️ **Profile Settings** - Update info vendor
- 📊 **Sales Report** - Laporan penjualan

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 + Vite
- **Routing**: React Router v6
- **Styling**: Vanilla CSS (modern, responsive)
- **Icons**: Lucide React
- **Maps**: Leaflet + React Leaflet
- **HTTP Client**: Fetch API
- **State Management**: React Hooks

### Backend
- **Runtime**: Node.js
- **Framework**: Hono (fast web framework)
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **File Storage**: MinIO (S3-compatible)
- **Cache**: Redis (optional)

### DevOps
- **Package Manager**: npm
- **Build Tool**: Vite
- **Database Migrations**: Drizzle Kit
- **Process Manager**: tsx (TypeScript execution)

---

## 📁 Project Structure

```
umkm-radar-mrt/
├── backend/                 # Backend API
│   ├── src/
│   │   ├── db/
│   │   │   └── schema.ts   # Database schema
│   │   └── index.ts        # Main API server
│   ├── migrations/         # SQL migration files
│   └── package.json
│
├── client/                 # Client app (user-facing)
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   └── package.json
│
├── dashboard/             # Admin/Vendor dashboard
│   ├── src/
│   │   ├── components/   # Dashboard components
│   │   ├── pages/        # Dashboard pages
│   │   ├── App.jsx       # Dashboard app
│   │   └── main.jsx      # Entry point
│   └── package.json
│
├── docs/                  # Documentation
│   ├── CATEGORY_MANAGEMENT.md
│   ├── CATEGORY_STANDARDIZATION.md
│   ├── NAVIGATION_MANAGEMENT.md
│   ├── PERFORMANCE_OPTIMIZATION.md
│   └── DUMMY_DATA.md
│
├── dev.mjs               # Development server script
├── dev.ps1               # PowerShell dev script
├── seed-database.ps1     # Database seeding script
└── package.json          # Root package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- MinIO (optional, for file uploads)
- Redis (optional, for caching)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/umkm-radar-mrt.git
   cd umkm-radar-mrt
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   
   Create `.env` file in `backend/`:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/umkm_radar
   MINIO_ENDPOINT=localhost
   MINIO_PORT=9000
   MINIO_ACCESS_KEY=minioadmin
   MINIO_SECRET_KEY=minioadmin
   MINIO_USE_SSL=false
   REDIS_URL=redis://localhost:6379
   ```

4. **Setup database**
   ```bash
   # Create database
   createdb umkm_radar

   # Run migrations
   cd backend
   npm run db:push

   # Seed dummy data
   cd ..
   .\seed-database.ps1
   ```

5. **Start development servers**
   ```bash
   # Option 1: Using Node.js script
   npm run dev

   # Option 2: Using PowerShell script
   .\dev.ps1
   ```

6. **Access the applications**
   - Client App: http://localhost:5173
   - Dashboard: http://localhost:5174
   - Backend API: http://localhost:3000

---

## 🗄️ Database Setup

### Quick Setup (Recommended)

```powershell
# Run the automated seed script
.\seed-database.ps1
```

This will:
1. Create all tables
2. Add indexes for performance
3. Seed categories
4. Seed navigation items
5. Create admin user
6. Add 17 dummy vendors
7. Add 40+ dummy products
8. Add vouchers and settings

### Manual Setup

```bash
cd backend

# Push schema to database
npm run db:push

# Run migrations manually
psql -h localhost -U postgres -d umkm_radar -f migrations/001_add_categories.sql
psql -h localhost -U postgres -d umkm_radar -f migrations/002_add_indexes.sql
psql -h localhost -U postgres -d umkm_radar -f migrations/003_seed_and_migrate_categories.sql
psql -h localhost -U postgres -d umkm_radar -f migrations/004_seed_navigation.sql
psql -h localhost -U postgres -d umkm_radar -f migrations/999_seed_dummy_data.sql
```

### Default Credentials

**Admin Account:**
- Email: `admin@umkmradar.com`
- Password: `admin123`

---

## 📚 Documentation

Detailed documentation available in `/docs`:

- **[Category Management](docs/CATEGORY_MANAGEMENT.md)** - Manage vendor/product categories
- **[Category Standardization](docs/CATEGORY_STANDARDIZATION.md)** - Category system architecture
- **[Navigation Management](docs/NAVIGATION_MANAGEMENT.md)** - Dynamic navigation menus
- **[Performance Optimization](docs/PERFORMANCE_OPTIMIZATION.md)** - Caching & optimization strategies
- **[Dummy Data](docs/DUMMY_DATA.md)** - Complete dummy data documentation

---

## 🔌 API Endpoints

### Vendors
- `GET /api/vendors` - Get all vendors
- `GET /api/vendors/:id` - Get single vendor
- `POST /api/vendors` - Create vendor
- `PUT /api/vendors/:id` - Update vendor
- `DELETE /api/vendors/:id` - Delete vendor

### Products
- `GET /api/products` - Get all products
- `GET /api/products/vendor/:vendorId` - Get products by vendor
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Navigation
- `GET /api/navigation` - Get navigation items
- `GET /api/navigation?position=header` - Filter by position
- `POST /api/navigation` - Create navigation item
- `PUT /api/navigation/:id` - Update navigation item
- `DELETE /api/navigation/:id` - Delete navigation item

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/vendor/:vendorId` - Get orders by vendor
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order status

### Assets
- `GET /api/assets` - Get all assets
- `POST /api/assets/upload` - Upload asset
- `DELETE /api/assets/:id` - Delete asset

### Vouchers
- `GET /api/vouchers` - Get all vouchers
- `POST /api/vouchers/validate` - Validate voucher code

---

## 📸 Screenshots

### Client App
![Home Page](https://via.placeholder.com/800x400?text=Home+Page)
![Vendor Details](https://via.placeholder.com/800x400?text=Vendor+Details)
![Shopping Cart](https://via.placeholder.com/800x400?text=Shopping+Cart)

### Admin Dashboard
![Dashboard](https://via.placeholder.com/800x400?text=Admin+Dashboard)
![Vendor Management](https://via.placeholder.com/800x400?text=Vendor+Management)
![Category Management](https://via.placeholder.com/800x400?text=Category+Management)

---

## 🎯 Roadmap

### Phase 1: Core Features ✅
- [x] Vendor management
- [x] Product management
- [x] Order system
- [x] Category system
- [x] Navigation management
- [x] Asset management

### Phase 2: Enhancements 🚧
- [ ] React Query integration for caching
- [ ] Real-time order updates (WebSocket)
- [ ] Push notifications
- [ ] Advanced search & filters
- [ ] Reviews & ratings system
- [ ] Loyalty points

### Phase 3: Advanced Features 📋
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Progressive Web App (PWA)
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard
- [ ] AI-powered recommendations

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

- **Developer**: Your Name
- **Designer**: Designer Name
- **Project Manager**: PM Name

---

## 🙏 Acknowledgments

- MRT Jakarta for inspiration
- UMKM community in Jakarta
- Open source community

---

## 📞 Contact

- **Email**: info@umkmradar.com
- **WhatsApp**: +62 812-3456-7890
- **Website**: https://umkmradar.com

---

<div align="center">
  <p>Made with ❤️ for Jakarta UMKM Community</p>
  <p>© 2026 UMKM Radar MRT. All rights reserved.</p>
</div>
