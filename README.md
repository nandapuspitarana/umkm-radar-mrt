# GrocGrocery Multivendor

Platform Grocery Multivendor (FreshMart) yang menghubungkan pelanggan dengan toko sayur/buah terdekat menggunakan Geolocation.

## 🚀 Tech Stack

*   **Frontend (Consumer)**: React + Vite + TailwindCSS (Folder: `client`)
*   **Frontend (Dashboard)**: React + Vite + TailwindCSS (Folder: `dashboard`)
*   **Backend**: HonoJS + Node.js (Folder: `backend`)
*   **Database**: PostgreSQL (via Docker)
*   **ORM**: Drizzle ORM

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
- `freshmart/backend:1.0.0`
- `freshmart/client:1.0.0`
- `freshmart/dashboard:1.0.0`

## 🛠 Cara Menjalankan (Manual)

Jika ingin menjalankan satu per satu secara lokal untuk development.

### 1. Database
Pastikan PostgreSQL berjalan lokal atau gunakan Docker untuk DB saja:
```bash
docker-compose up -d db
```

### 2. Backend
```bash
cd backend
cp .env.example .env  # Pastikan URL DB sesuai
npm install
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
Invoke-WebRequest -Uri http://localhost:3000/api/seed -Method POST
```

> **Catatan:** Reset database (jika perlu) dapat dilakukan dengan menghapus volume docker `postgres_data`.

### 🔐 Akun Demo Login Dashboard

Setelah seeding, gunakan akun berikut untuk login di [Dashboard](http://localhost:8081):

| Role | Email | Password | Keterangan |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@freshmart.com` | `admin` | Akses Penuh (Global Settings) |
| **Mitra** | `mitra1@freshmart.com` | `mitra` | Toko: FreshMart Selatan |
| **Mitra** | `mitra2@freshmart.com` | `mitra` | Toko: Berkah Sayur Mayur |

## 📱 Fitur Utama

### Consumer App
*   **Geolocation Sorting**: Menampilkan toko terdekat dari lokasi user.
*   **Real-time Cart**: Keranjang belanja yang responsif.
*   **WhatsApp Checkout**: Order diteruskan langsung ke WhatsApp penjual dengan format rapi.

### Dashboard
*   **Multirole**: Login sebagai Admin atau Mitra Penjual.
*   **Order Management**: Ubah status pesanan (Pending -> Confirmed -> Done).
*   **Product Management**: Kelola produk toko.

## 🧪 Testing (Mock Data vs Real Data)
Secara default, Frontend saat ini menggunakan **Mock Data** (`client/src/data.js`) untuk kemudahan demo tanpa backend menyala. Untuk menghubungkan ke Backend Hono yang asli, silahkan edit `client/src/pages/Home.jsx` untuk melakukan `fetch` ke endpoint API.
