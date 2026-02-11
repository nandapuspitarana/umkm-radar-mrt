# Update Transport Logos - PNG Migration

## Tanggal: 2026-02-10

### ✅ Perubahan yang Dilakukan

Logo moda transportasi telah diubah dari format **SVG** ke **PNG**.

### File PNG yang Digunakan

Semua file PNG sudah tersedia di `backend/uploads/assets/transport/`:

| Logo | File | Ukuran |
|------|------|--------|
| TiJe (Transjakarta) | `TIJE.png` | 4,775 bytes |
| Jaklingko | `JAK.png` | 5,474 bytes |
| LRT Jakarta | `LRT.png` | 4,561 bytes |
| KAI Commuter | `KAI.png` | 3,221 bytes |
| Whoosh | `WHOOSH.png` | 3,982 bytes |

### Urutan Tampilan (Sesuai Figma)

**Baris Atas** (3 item, tinggi 80px):
1. TiJe → `/assets/transport/TIJE.png`
2. Jaklingko → `/assets/transport/JAK.png`
3. LRT Jakarta → `/assets/transport/LRT.png`

**Baris Bawah** (2 item, tinggi 60px):
4. KAI Commuter → `/assets/transport/KAI.png`
5. Whoosh → `/assets/transport/WHOOSH.png`

### File yang Dibuat

1. `backend/migrations/008_use_png_transport_logos.sql` - Migration SQL
2. `backend/update-transport-logos.mjs` - Script untuk menjalankan migration
3. `TRANSPORT_LOGO_UPDATE.md` - Dokumentasi ini

### Status Migration

✅ **Berhasil dijalankan**

Database `settings` table sudah diupdate dengan path PNG yang baru.

### Cara Melihat Perubahan

1. **Restart backend** (jika perlu) untuk clear cache:
   ```powershell
   # Stop dev.ps1 dan jalankan ulang
   .\dev.ps1
   ```

2. **Refresh halaman client** di browser:
   ```
   http://localhost:5173
   ```

3. **Verifikasi** bahwa logo moda transportasi sekarang menggunakan PNG

### URL Akses Logo

Logo dapat diakses melalui:
- `http://localhost:3000/assets/transport/TIJE.png`
- `http://localhost:3000/assets/transport/JAK.png`
- `http://localhost:3000/assets/transport/LRT.png`
- `http://localhost:3000/assets/transport/KAI.png`
- `http://localhost:3000/assets/transport/WHOOSH.png`

### Catatan Teknis

- Format PNG memberikan compatibility yang lebih baik untuk berbagai browser
- File PNG sudah di-optimize untuk ukuran yang kecil (3-5 KB per logo)
- Component `TransportLinks.jsx` tidak perlu diubah karena sudah support PNG
- Backend serve static files dari folder `uploads/` secara otomatis

---

## Riwayat Perubahan

1. **2026-02-10 15:42** - Fix urutan transport links (MRT → Jaklingko)
2. **2026-02-10 17:59** - Ganti logo dari SVG ke PNG ✅
