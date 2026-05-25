# Design: Menu Manajemen Klien (Admin)

**Date:** 2026-05-25
**Status:** Approved

## Problem

Admin tidak bisa melihat dengan jelas detail klien (nama, alamat, nomor HP, permasalahan) dan assignment konsultan dalam satu tampilan yang terfokus. Informasi ini tersebar dan bercampur dengan data pembayaran/status sesi di halaman Konsultasi.

## Solution

Buat halaman admin baru **"Manajemen Klien"** (`/admin/clients`) yang menampilkan tabel khusus data klien dan assignment konsultan. Hapus kolom konsultan dari halaman Konsultasi agar setiap halaman punya tanggung jawab yang jelas.

## Scope

### File Baru
- `frontend/src/pages/admin/AdminClients.jsx` — halaman Manajemen Klien

### File Diubah
- `frontend/src/components/admin/AdminSidebar.jsx` — tambah nav item "Manajemen Klien"
- `frontend/src/App.jsx` — tambah route `/admin/clients`
- `frontend/src/pages/admin/AdminConsultations.jsx` — hapus kolom "Konsultan" (thead + tbody + state assignConsultant + fetch consultants)

## Data

Query: `consultations` join `clients`, join `consultants`

Fields yang ditampilkan:
- `clients.full_name` → kolom Nama
- `consultations.location` → kolom Alamat (nilai: "Jakarta" / "Luar Jakarta")
- `clients.phone_number` → kolom Nomor HP
- `consultations.project_details` → kolom Permasalahan (truncated, full text on hover/expand)
- `consultations.consultant_id` + dropdown dari `consultants` aktif → kolom Konsultan

## Tabel Kolom

| # | Nama | Alamat | Nomor HP | Permasalahan | Konsultan |
|---|------|--------|----------|--------------|-----------|
| Nomor urut | full_name | location | phone_number | project_details (truncated) | dropdown assign |

## UI/UX

- Style mengikuti `AdminConsultations.jsx`: motion/framer-motion, warna brand (#003D6B, #E8920A), font Manrope/Poppins
- Kolom Permasalahan: tampilkan max ~80 karakter dengan `...`, full text tersedia saat hover (title attribute)
- Assign konsultan: dropdown, update langsung ke Supabase (`consultations.consultant_id`)
- Toast notifikasi sukses/gagal assign
- Loading state dan empty state konsisten dengan halaman lain

## Perubahan AdminConsultations

- Hapus kolom header "Konsultan"
- Hapus cell konsultan dari setiap baris
- Hapus fungsi `assignConsultant`
- Hapus fetch `consultants` dari `fetchData` (tidak dibutuhkan lagi di halaman ini)
- Hapus state `consultants`

## Out of Scope

- Tidak ada perubahan pada database/migrations
- Tidak ada perubahan pada fitur pembayaran atau status sesi
- Tidak ada filter/search di halaman Manajemen Klien (bisa ditambah nanti)
