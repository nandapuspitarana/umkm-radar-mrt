# Panduan Setup Cloudflare Zero Trust (Cloudflare Tunnel)

Panduan ini akan membantu Anda mempublikasikan aplikasi client lokal (running di port `8082`) ke internet menggunakan Cloudflare Tunnel. Ini adalah metode yang aman karena tidak perlu membuka port di router/firewall Anda.

## Prasyarat
1.  Akun **Cloudflare** aktif denga satu domain yang sudah terhubung (untuk Custom Domain).
2.  Aplikasi Client berjalan lokal pada port 8082 (`npm run dev`).

---

## 1. Unduh & Install Cloudflared

Karena Anda menggunakan Windows:

1.  Kunjungi halaman download resmi: [Cloudflared Download Page](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/)
2.  Download versi **Windows (64-bit)** (`cloudflared-windows-amd64.exe`).
3.  Rename file tersebut menjadi `cloudflared.exe`.
4.  Pindahkan file tersebut ke folder project Anda atau lokasi yang mudah diakses via terminal (misal: `C:\cloudflared\`).

> **Tips:** Anda juga bisa install via winget:
> `winget install --id Cloudflare.cloudflared`

---

## 2. Metode Cepat (Quick Tunnel) - Untuk Testing
Jika Anda hanya ingin share link sementara tanpa login (random URL):

1.  Buka Terminal (PowerShell/CMD).
2.  Jalankan perintah berikut:
    ```powershell
    cloudflared tunnel --url http://localhost:8082
    ```
3.  Tunggu outputnya. Anda akan melihat link seperti `https://random-name.trycloudflare.com`.
4.  Buka link tersebut di browser HP atau device lain.

---

## 3. Metode Permanen (Cloudflare Zero Trust Dashboard) - Recommended

Untuk setup yang lebih stabil dan manajemen via dashboard Cloudflare:

### Langkah A: Login & Setup via Dashboard
1.  Log in ke [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/).
2.  Masuk ke menu **Networks** > **Tunnels**.
3.  Klik **Create a tunnel**.
4.  Pilih **Cloudflared** sebagai connector type.
5.  Beri nama tunnel (misal: `umkm-radar-mrt-client`).
6.  Anda akan melihat instruksi "Install and run a connector". Pilih **Windows**.

### Langkah B: Jalankan Connector
7.  Copy command yang muncul di dashboard (biasanya berupa block panjang dimulai dengan `cloudflared.exe service install ...`).
8.  Paste dan jalankan di **PowerShell (Run as Administrator)**.
    *   Jika `cloudflared` belum ada di path, pastikan Anda berada di folder tempat file `.exe` berada.

### Langkah C: Konfigurasi Public Hostname
9.  Setelah connector status "Connected", klik **Next** di dashboard.
10. Masuk ke tab **Public Hostname**.
11. Isi form:
    *   **Subdomain**: `umkm-radar-mrt` (atau nama lain yang diinginkan).
    *   **Domain**: pilih domain Anda yang terdaftar di Cloudflare.
    *   **Service**: pilih `HTTP`.
    *   **URL**: isi `localhost:8082`.
12. Klik **Save Tunnel**.

Selesai! Aplikasi Anda sekarang bisa diakses via `https://umkm-radar-mrt.domainanda.com`.

---

## 4. Troubleshooting (Jika Error)

**Masalah**: "Unable to reach the origin service"
*   **Solusi**: Pastikan aplikasi client (`npm run dev`) menyala dan bisa diakses di browser lokal via `http://localhost:8082`.
*   Jika project Vite/Next.js Anda block akses eksternal, coba ubah config `package.json` dev script menjadi:
    `"dev": "vite --host"` atau `"dev": "next dev -H 0.0.0.0"`. (Tapi biasanya cloudflared bisa baca `localhost` standar).

**Masalah**: Websocket Error (HMR disconnect terus)
*   Cloudflared support websocket otomatis, tapi kadang perlu restart tunnel jika koneksi putus-nyambung.
