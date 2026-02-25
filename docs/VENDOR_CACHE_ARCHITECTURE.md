# Vendor Data Pre-Calculation Architecture

## Masalah yang Diselesaikan

Sebelumnya, setiap kali user membuka `/kuliner`, `/ngopi`, atau `/atm`:
1. Backend query **semua vendor** dari DB → sort → return
2. Frontend **filter ulang** (per kategori) + **sort ulang** (per stasiun) via `useStationSort`
3. Redis cache hanya **60 detik** → sering hit DB

Ini menyebabkan:
- Latency tinggi saat pertama buka halaman
- Double computation (backend + frontend)
- Cache tidak efektif

---

## Solusi: Pre-Grouped + Pre-Sorted

### Backend: `/api/vendors/grouped?station=X`

Endpoint baru yang mengembalikan vendor yang sudah:
1. **Dikelompokkan per kategori** (kuliner / ngopi / atm / lainnya)
2. **Disort**: vendor dekat stasiun muncul duluan
3. **Di-cache Redis 10 menit** per stasiun

```json
{
  "station": "Senayan Mastercard",
  "kuliner": [...],  // sorted, station-first
  "ngopi":   [...],
  "atm":     [...],
  "lainnya": [...],
  "_cachedAt": "2026-02-25T00:00:00Z"
}
```

### Frontend: `App.jsx`

Fetch `/api/vendors/grouped` → simpan dalam `vendorsByCategory` state.
- Cache localStorage **10 menit** (mirror Redis TTL)
- Jika grouped API gagal → fallback ke `/api/vendors` (flat list)

### Pages: Kuliner / Ngopi / Atm

Menerima prop `vendors` yang **sudah pre-sorted** dan `preSorted={true}`.
- `useStationSort` dalam **pass-through mode** → tidak ada recompute
- Loading state langsung false (data sudah siap)

### `useStationSort` Hook

Dua mode:
- `preSorted=true` → data langsung dipakai, **0 computation**
- `preSorted=false` (fallback) → filter + sort client-side seperti sebelumnya

---

## Cache Invalidation (Auto-Sync Dashboard)

Saat admin dashboard mengedit/tambah/hapus vendor:
- Backend **POST/PUT/DELETE** `/api/vendors/:id` memanggil `flushVendorCache()`
- `flushVendorCache()` pakai **Redis SCAN** untuk hapus semua key `vendors_*`
  - Mencakup: `vendors_list`, `vendors_list_<station>`, `vendors_grouped_<station>`
- Request berikutnya akan re-compute dan re-cache

> **Tidak perlu manual flush** — sync otomatis saat ada perubahan vendor.

---

## Endpoints Baru

| Endpoint | Fungsi |
|---|---|
| `GET /api/vendors/grouped?station=X` | Vendor pre-grouped + pre-sorted per stasiun |
| `GET /api/location-areas` | Daftar stasiun MRT (dari tabel `location_areas`) |
| `GET /api/location-areas/:slug` | Detail satu stasiun |
| `POST /api/cache/flush-vendors` | Manual flush cache semua stasiun |
| `GET /api/vendors/cache-status` | Monitor TTL cache per key di Redis |

---

## Flow Diagram

```
User buka /kuliner (stasiun: Senayan)
  │
  ├── App.jsx cek localStorage → HIT? render instant ⚡
  │
  └── MISS → fetch /api/vendors/grouped?station=Senayan
              │
              ├── Redis cek → HIT (10 menit)? return cached ⚡
              │
              └── MISS → DB query (sort oleh SQL) → group → cache Redis
                         ↓
              App.jsx simpan ke localStorage + state
              ↓
              Kuliner.jsx terima vendors yg sudah sorted
              (useStationSort pass-through, tidak re-sort)
              ↓
              List vendor muncul instant ✅

Admin edit vendor di dashboard
  │
  └── PUT /api/vendors/:id
      ↓
      flushVendorCache() → Redis SCAN → DEL vendors_*
      (hapus semua stasiun sekaligus)
      ↓
      Request berikutnya recompute → cache baru 10 menit
```

---

## TTL Summary

| Layer | TTL |
|---|---|
| Redis (backend) | 10 menit |
| localStorage (frontend) | 10 menit |
| Invalidation trigger | Saat CRUD vendor dari dashboard |
