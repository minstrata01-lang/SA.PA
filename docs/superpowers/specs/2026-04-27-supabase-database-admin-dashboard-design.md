# Design Spec: Supabase Database + Admin Dashboard & Client-Side Migration

**Tanggal:** 2026-04-27
**Project:** Stratalift Frontend
**Status:** Approved

---

## 1. Latar Belakang

Sistem saat ini menggunakan Supabase untuk alur konsultasi (clients, consultations, consultants) tetapi konten seperti Tools, Case Study, Pricing, dan profil Konsultan masih **hardcoded di file JS statis**. Ini berarti setiap perubahan konten membutuhkan deploy ulang.

Tujuan desain ini:
1. Migrasikan semua konten ke Supabase Database
2. Bangun Admin Dashboard yang bisa full CRUD semua entitas
3. Update sisi client untuk membaca data dari Supabase

---

## 2. Skema Database Supabase

### Tabel yang sudah ada (dimodifikasi)

#### `clients` — tidak berubah
```sql
id          uuid primary key default gen_random_uuid()
full_name   text not null
email       text not null unique
phone_number text
created_at  timestamptz default now()
```

#### `consultants` — tambah kolom baru
```sql
id           uuid primary key default gen_random_uuid()
name         text not null
title        text                        -- baru: jabatan/spesialisasi
description  text                        -- baru: bio singkat
photo_url    text                        -- baru: URL dari Supabase Storage
phone_number text
is_active    boolean default true
sort_order   integer default 0           -- baru: urutan tampil di halaman client
created_at   timestamptz default now()
```

#### `consultations` — tidak berubah
```sql
id                  uuid primary key default gen_random_uuid()
order_id            text unique
client_id           uuid references clients(id)
consultant_id       uuid references consultants(id)
payment_status      text default 'pending'   -- pending | paid
session_status      text default 'inactive'  -- inactive | active | used | expired
selected_categories text[]
project_details     text
created_at          timestamptz default now()
```

---

### Tabel baru

#### `tools`
```sql
id            uuid primary key default gen_random_uuid()
name          text not null
slug          text not null unique       -- contoh: "proceq-canin"
description   text
thumbnail_url text                       -- URL dari Supabase Storage bucket "tools"
tags          text[]                     -- contoh: ["Corrosion Analysis", "Structural Inspection"]
video_url     text                       -- URL YouTube embed
is_active     boolean default true
created_at    timestamptz default now()
```

#### `cases`
```sql
id               uuid primary key default gen_random_uuid()
title            text not null
slug             text not null unique
summary          text                    -- deskripsi pendek untuk card list
full_description text                    -- konten lengkap halaman detail
cover_image_url  text                    -- URL dari Supabase Storage bucket "cases"
category         text
tags             text[]
status           text default 'draft'    -- draft | published
sort_order       integer default 0
created_at       timestamptz default now()
```

#### `pricing_plans`
```sql
id          uuid primary key default gen_random_uuid()
name        text not null               -- contoh: "Pre-Assessment", "Basic", "Intermediate", "Advance"
tag_label   text                        -- contoh: "Kerusakan Ringan"
description text
price       numeric                     -- harga dalam rupiah
features    text[]                      -- daftar fitur/bullet points
is_featured boolean default false       -- tampil highlighted (card gelap)
sort_order  integer default 0
is_active   boolean default true
created_at  timestamptz default now()
```

> **Catatan:** Tabel ini menyimpan SEMUA tier harga termasuk Pre-Assessment (Rp 500.000) dan 3 tier Assessment (Basic/Intermediate/Advance mulai Rp 5.700.000). Harga Pre-Assessment yang saat ini hardcoded di tombol CTA halaman Pricing juga dikelola dari sini. Halaman Pricing membaca dan menampilkan data sesuai `sort_order`.

---

## 3. Supabase Storage Buckets

| Bucket       | Konten                                 | Akses  |
|-------------|----------------------------------------|--------|
| `consultants` | Foto profil konsultan                 | Public |
| `tools`       | Thumbnail & gambar tools              | Public |
| `cases`       | Cover image & foto case study         | Public |

Semua bucket bersifat **public read** — URL gambar langsung bisa digunakan di `<img>` tanpa signed URL.

---

## 4. Row Level Security (RLS)

| Tabel           | Akses Publik (client)              | Akses Admin (authenticated) |
|----------------|-----------------------------------|------------------------------|
| `tools`         | SELECT where `is_active = true`   | Full CRUD                   |
| `cases`         | SELECT where `status = published` | Full CRUD                   |
| `consultants`   | SELECT where `is_active = true`   | Full CRUD                   |
| `pricing_plans` | SELECT where `is_active = true`   | Full CRUD                   |
| `clients`       | INSERT only                        | Full CRUD                   |
| `consultations` | INSERT only                        | Full CRUD                   |

---

## 5. Arsitektur Admin Dashboard

### Pendekatan
Sidebar navigation dengan route terpisah per entitas (Opsi B). Menggantikan `AdminDashboard.jsx` monolitik.

### Struktur Route
```
/admin                     → redirect ke /admin/consultations
/admin/consultations       → kelola sesi konsultasi
/admin/tools               → CRUD tools
/admin/cases               → CRUD case study
/admin/consultants         → CRUD konsultan
/admin/pricing             → CRUD pricing plans
```

### Struktur File Baru
```
frontend/src/
├── layouts/
│   └── AdminLayout.jsx              ← sidebar + header wrapper untuk semua /admin/*
├── pages/admin/
│   ├── AdminConsultations.jsx       ← isi dari AdminDashboard.jsx yang di-refactor
│   ├── AdminTools.jsx
│   ├── AdminCases.jsx
│   ├── AdminConsultants.jsx
│   └── AdminPricing.jsx
└── components/admin/
    ├── AdminSidebar.jsx             ← navigasi sidebar dengan link ke semua section
    ├── AdminTable.jsx               ← tabel reusable (kolom, data, aksi)
    ├── AdminModal.jsx               ← modal form reusable untuk tambah/edit
    └── AdminImageUpload.jsx         ← upload gambar ke Supabase Storage
```

### Pola UI per Halaman Admin
Setiap halaman mengikuti pola konsisten:
1. **Header** — judul section + tombol "Tambah [item]"
2. **Tabel data** — kolom relevan + kolom Aksi (Edit, Hapus)
3. **Modal form** — muncul saat Tambah atau Edit, ditutup setelah submit berhasil

### Fitur per Halaman

| Halaman           | Kolom Tabel                                   | Fitur Khusus                            |
|------------------|-----------------------------------------------|-----------------------------------------|
| Consultations     | Nama client, email, status sesi, konsultan, tanggal | Assign konsultan, ubah status sesi  |
| Tools             | Nama, tags, status aktif                      | Toggle aktif/nonaktif                   |
| Cases             | Judul, kategori, status publish               | Toggle draft/published                  |
| Consultants       | Nama, jabatan, status aktif                   | Toggle aktif/nonaktif, sort_order       |
| Pricing           | Nama tier, harga, featured, status            | Toggle aktif, sort_order                |

### Alur Upload Gambar
```
Admin klik "Upload Gambar"
  → Pilih file dari komputer (input type=file)
  → Upload ke Supabase Storage bucket yang sesuai
  → Dapatkan public URL dari response
  → URL disimpan ke kolom *_url di form
  → Form di-submit → URL tersimpan di DB
```

### Extensibility Multi-Role (Future)
Struktur sudah siap di-extend tanpa refactor besar:
- `AdminLayout` bisa terima prop `userRole`
- Setiap route bisa dibungkus `<RoleProtectedRoute allowedRoles={['super_admin']}>`
- Tambah tabel `admin_users` dengan kolom `role` saat dibutuhkan

---

## 6. Perubahan Sisi Client

### Strategi
Setiap halaman yang membaca dari file JS statis diganti dengan fetch dari Supabase.

### Custom Hooks Baru
```
frontend/src/hooks/
├── useSupabaseQuery.js    ← generic hook: fetch + filter + loading/error state
├── useTools.js            ← SELECT tools WHERE is_active = true
├── useCases.js            ← SELECT cases WHERE status = 'published'
├── usePricing.js          ← SELECT pricing_plans WHERE is_active = true ORDER BY sort_order
└── useConsultants.js      ← SELECT consultants WHERE is_active = true ORDER BY sort_order
```

Contoh pola penggunaan:
```js
const { data: tools, loading, error } = useTools()
```

### Halaman yang Berubah

| Halaman         | Perubahan                                                         |
|----------------|-------------------------------------------------------------------|
| `/tool`         | Hapus import `tools.js`, pakai `useTools()`                      |
| `/tool/:id`     | Hapus import `toolDetails.js`, fetch by slug dari Supabase       |
| `/case`         | Hapus import `cases.js`, pakai `useCases()`                      |
| `/case/:id`     | Hapus import `caseDetails.js`, fetch by slug dari Supabase       |
| `/pricing`      | Hapus data hardcoded, pakai `usePricing()`                       |
| Home (Team section) | Hapus import `consultants.js`, pakai `useConsultants()`      |

### Loading & Error States
Setiap halaman memiliki 3 state:
- **Loading** — spinner/skeleton (konsisten dengan `FullscreenLoader`)
- **Error** — pesan sederhana + tombol retry
- **Empty** — pesan informatif jika data kosong

### File Statis yang Dihapus Setelah Migrasi
```
frontend/src/data/tools.js
frontend/src/data/toolDetails.js
frontend/src/data/cases.js
frontend/src/data/caseDetails.js
frontend/src/data/consultants.js  ← diganti sepenuhnya oleh tabel consultants di DB
```

---

## 7. Keputusan Desain

| Keputusan | Pilihan | Alasan |
|-----------|---------|--------|
| Gambar | Supabase Storage | Upload langsung dari admin, tidak perlu deploy ulang |
| Pricing structure | Simple (nama, harga, fitur) | Cukup untuk kebutuhan saat ini, bisa dikembangkan nanti |
| Admin auth | Single admin (sekarang) | Desain sudah extensible untuk multi-role di masa depan |
| Case study | Tambah status draft/published | Admin bisa siapkan konten sebelum dipublikasikan |
| Admin layout | Sidebar navigation + route terpisah | Scalable, maintainable, mudah extend untuk multi-role |
