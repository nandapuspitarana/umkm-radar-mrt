# UMKM Radar MRT

Platform UMKM Radar yang menghubungkan pelanggan dengan UMKM terdekat dari stasiun MRT menggunakan Geolocation.

## 🚀 Tech Stack

*   **Frontend (Consumer)**: React + Vite + TailwindCSS (Folder: `client`)
*   **Frontend (Dashboard)**: React + Vite + TailwindCSS (Folder: `dashboard`)
*   **Backend**: HonoJS + Node.js (Folder: `backend`)
*   **Database**: PostgreSQL (via Docker)
*   **ORM**: Drizzle ORM
*   **Cache**: Redis

## 📂 Struktur Project

```
├── client/          # Web Aplikasi untuk Pembeli (Mobile First)
├── dashboard/       # Web Dashboard untuk Admin & Penjual
├── backend/         # API Server (Hono)
└── docker-compose.yml
```

## 🛠 Cara Menjalankan (Docker)

Cara paling mudah untuk menjalankan seluruh aplikasi adalah menggunakan Docker Compose.

### Quick Start
1.  Pastikan Docker sudah terinstall.
2.  Jalankan perintah:
    ```bash
    docker-compose up --build
    ```
3.  Akses aplikasi:
    *   **Website Pembeli**: [http://localhost:8082](http://localhost:8082)
    *   **Dashboard Admin**: [http://localhost:8083](http://localhost:8083)
    *   **API Server**: [http://localhost:3000](http://localhost:3000)

### Build dengan Versioning

**Current Version: 1.0.0**

Untuk build images dengan version tags:

**Linux/Mac:**
```bash
chmod +x build.sh
./build.sh
```

**Windows (PowerShell):**
```powershell
.\build.ps1
```

Images yang dibuat:
- `umkmradar/backend:1.0.0`
- `umkmradar/client:1.0.0`
- `umkmradar/dashboard:1.0.0`

## 🛠 Cara Menjalankan (Manual)

Jika ingin menjalankan satu per satu secara lokal untuk development.

### 1. Database
Pastikan PostgreSQL berjalan lokal atau gunakan Docker untuk DB saja:
```bash
docker-compose up -d db redis
```

### 2. Backend
```bash
cd backend
cp .env.example .env  # Pastikan URL DB sesuai
npm install
npm run db:push       # Push schema ke database
npm run dev
```

### 3. Client (Pembeli)
```bash
cd client
npm install
npm run dev
```

### 4. Dashboard (Admin)
```bash
cd dashboard
npm install
npm run dev
```


## 🌱 Inisialisasi Database (Seeding)

Saat pertama kali dijalankan, database akan kosong. Jalankan perintah berikut untuk mengisi **Data Dummy** (Toko, Produk, User):

**Menggunakan Curl (Linux/Mac/Git Bash):**
```bash
curl -X POST http://localhost:3000/api/seed
```

**Menggunakan PowerShell (Windows):**
```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/seed -Method POST
```

> **Catatan:** Reset database (jika perlu) dapat dilakukan dengan menghapus volume docker `postgres_data`.

### 📦 Data Seed (Dummy Data)

Setelah seeding berhasil, akan terbuat data berikut:

#### Vendor Kuliner (6 UMKM Makanan)

| No | Nama | Kategori | Alamat | Jam Buka |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Warung Betawi Babeh Patal Senayan | Kuliner | Jalan Patal Senayan No. 7 | 07:00 - 12:00 |
| 2 | Tenda Bang Jali | Kuliner | Blok C 28 | 06:00 - 10:00 |
| 3 | Warung Padang Uni Ami | Kuliner | Blok D 12 | 06:00 - 10:00 |
| 4 | Mie Ayam Gaul Senayan | Kuliner | Area Sudirman, FX Sudirman | 06:00 - 16:00 |
| 5 | Bubur Ayam Jakarta | Kuliner | Kawasan FX Sudirman | 06:00 - 10:00 |
| 6 | Sedjuk Bakmi & Kopi | Kuliner | Koridor Sudirman-Senayan | 06:00 - 21:00 |

#### Convenience Store (3 Toko)

| No | Nama | Kategori | Alamat | Jam Buka |
| :--- | :--- | :--- | :--- | :--- |
| 7 | Indomaret Point | Convenience Store | Blok B 45 | 05:00 - 22:00 |
| 8 | Lawson | Convenience Store | Blok B 82 | 05:30 - 22:00 |
| 9 | Family Mart | Convenience Store | Blok A 12 | 05:00 - 22:00 |

#### Produk per Vendor

- **Warung Betawi Babeh**: Nasi Uduk Komplit, Ketupat Sayur, Lontong Sayur, Gorengan
- **Tenda Bang Jali**: Nasi Uduk Spesial, Ketan Serundeng
- **Warung Padang Uni Ami**: Ketupat Sayur Padang, Bubur Kampiun, Gorengan Mix
- **Mie Ayam Gaul**: Mie Ayam Biasa, Komplit, Jumbo
- **Bubur Ayam Jakarta**: Bubur Ayam Biasa, Spesial, Komplit
- **Sedjuk Bakmi & Kopi**: Bakmi Ayam, Bakmi Pangsit, Kopi Susu, Es Kopi
- **Indomaret Point**: Onigiri Salmon, Roti Isi Coklat, Salad Buah
- **Lawson**: Onigiri Tuna, Oden Set, Sosis Panggang
- **Family Mart**: Famichiki, Onigiri Teriyaki, Salad Sayur

### 🔐 Akun Demo Login Dashboard

Setelah seeding, gunakan akun berikut untuk login di [Dashboard](http://localhost:8083):

| Role | Email | Password | Keterangan |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@umkmradar.com` | `admin` | Akses Penuh (Global Settings) |
| **Mitra** | `babeh@umkmradar.com` | `mitra` | Toko: Warung Betawi Babeh Patal Senayan |
| **Mitra** | `bangjali@umkmradar.com` | `mitra` | Toko: Tenda Bang Jali |
| **Mitra** | `uniami@umkmradar.com` | `mitra` | Toko: Warung Padang Uni Ami |
| **Mitra** | `mieayam@umkmradar.com` | `mitra` | Toko: Mie Ayam Gaul Senayan |
| **Mitra** | `buburayam@umkmradar.com` | `mitra` | Toko: Bubur Ayam Jakarta |
| **Mitra** | `sedjuk@umkmradar.com` | `mitra` | Toko: Sedjuk Bakmi & Kopi |

## 📱 Fitur Utama

### Consumer App
*   **Geolocation Sorting**: Menampilkan toko terdekat dari lokasi user.
*   **Kategori Navigasi**: Rekomen, Publik, Kuliner, Ngopi, Wisata, ATM & Belanja
*   **Real-time Cart**: Keranjang belanja yang responsif.
*   **WhatsApp Checkout**: Order diteruskan langsung ke WhatsApp penjual dengan format rapi.

### Dashboard
*   **Multirole**: Login sebagai Admin atau Mitra Penjual.
*   **Order Management**: Ubah status pesanan (Pending -> Confirmed -> Done).
*   **Product Management**: Kelola produk toko.
*   **Voucher Management**: Kelola voucher diskon.

## 🗺️ Halaman Aplikasi

### Client (Pembeli)
- `/` - Homepage dengan rekomendasi toko
- `/kuliner` - Halaman kategori Kuliner (warung makan terdekat MRT)
- `/about` - Tentang Kami
- `/terms` - Syarat & Ketentuan
- `/privacy` - Kebijakan Privasi

### Dashboard
- `/login` - Login Admin/Mitra
- `/` - Dashboard utama
- `/products` - Kelola produk
- `/orders` - Kelola pesanan
- `/vouchers` - Kelola voucher

## 🧪 Testing

Jalankan unit test:
```bash
cd client && npm test
cd backend && npm test
```

