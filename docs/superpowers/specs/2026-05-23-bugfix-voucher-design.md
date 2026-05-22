# Design Spec: Bug Fixes + Fitur Voucher Pembayaran

**Tanggal:** 2026-05-23  
**Status:** Approved

---

## Ringkasan

Tiga item kerja:
1. **Bug Fix** — `confirm-payment` edge function return 502 saat kirim invoice email
2. **Bug Fix** — `create-consultation` gagal saat ada duplikat email di tabel `clients` (dilaporkan sebagai "sama nama")
3. **Fitur Baru** — Voucher pembayaran: user input kode di review page, admin kelola di dashboard

---

## 1. Bug Fix: 502 pada Invoice Email (`confirm-payment`)

### Root Cause
`confirm-payment` menjalankan PDF generation + logo fetch + Resend email + WA Fonnte secara sequential dalam satu request. Total bisa 5–10 detik, melewati timeout Supabase Edge Function.

### Solusi
- Pindahkan blok email dan WA ke `EdgeRuntime.waitUntil(...)` — response `{ success: true }` dikirim segera setelah DB diupdate
- Tambah `try/catch` per-langkah (PDF, logo fetch, email, WA) agar satu kegagalan tidak crash seluruh function
- Tambah timeout 8 detik pada `fetch(logoUrl)` menggunakan `AbortController`

### File yang Berubah
- `supabase/functions/confirm-payment/index.ts`

---

## 2. Bug Fix: Duplikat Email di `clients` (`create-consultation`)

### Root Cause
Tabel `clients` tidak memiliki UNIQUE constraint pada `email`. Jika email yang sama masuk dua kali (race condition atau submit ulang), `.maybeSingle()` menemukan >1 baris dan return error `PGRST116`, menyebabkan edge function throw dan form gagal submit.

### Solusi

**Migration baru** (`20260523000001_clients_email_unique.sql`):
```sql
ALTER TABLE clients ADD CONSTRAINT clients_email_unique UNIQUE (email);
```

**`create-consultation`** — ganti lookup + insert terpisah menjadi `upsert` dengan `onConflict: 'email'` sehingga jika email sudah ada, data client diperbarui tanpa error.

**`confirm-payment` dan `notify-admin`** — perkuat null-check pada join `clients` agar tidak crash jika hasil join null atau berbentuk tak terduga.

### File yang Berubah
- `supabase/migrations/20260523000001_clients_email_unique.sql` (baru)
- `supabase/functions/create-consultation/index.ts`
- `supabase/functions/confirm-payment/index.ts`
- `supabase/functions/notify-admin/index.ts`

---

## 3. Fitur Voucher Pembayaran

### Alur User
1. User isi form → tiba di **ReviewConfirmationPage**
2. Di bawah review items, ada input "Kode Voucher" + tombol "Pakai"
3. Klik "Pakai" → call edge function `validate-voucher` → tampilkan hasil:
   - **Valid:** card hijau `✓ Voucher KODE — Diskon 50% = -Rp 250.000 | Total: Rp 250.000`
   - **Tidak valid:** error inline (kode salah / kadaluarsa / sudah habis)
4. Voucher bisa di-remove (tombol ✕) → `used_count` di-decrement, kolom di consultations di-clear
5. **Jika diskon < 100%:** lanjut ke PaymentUploadPage seperti biasa (nominal tampil sudah dipotong diskon)
6. **Jika diskon 100%:** tombol berubah "Konfirmasi Tanpa Pembayaran →" → panggil `notify-admin` langsung → navigate ke `/payment/pending`

### Database

**Tabel baru `vouchers`:**
```sql
CREATE TABLE vouchers (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code              text NOT NULL UNIQUE,
  description       text,
  discount_percent  integer NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
  max_uses          integer NOT NULL DEFAULT 1,
  used_count        integer NOT NULL DEFAULT 0,
  expires_at        timestamptz,
  is_active         boolean NOT NULL DEFAULT true,
  created_at        timestamptz DEFAULT now()
);
```

RLS: public tidak bisa SELECT (hanya via edge function). Admin authenticated: full access.

**Kolom baru di `consultations`:**
```sql
ALTER TABLE consultations
  ADD COLUMN voucher_code     text,
  ADD COLUMN discount_percent integer,
  ADD COLUMN discount_amount  numeric;
```

`discount_amount` disimpan permanen (nilai rupiah saat voucher dipakai) agar tidak berubah jika harga berubah di masa depan.

**File:** `supabase/migrations/20260523000002_vouchers.sql` (baru)

### Edge Function Baru: `validate-voucher`

**Input:** `{ code: string, order_id: string }`

**Logic:**
1. Query `vouchers` by `code` (case-insensitive via `ilike`)
2. Validasi: `is_active = true`, `used_count < max_uses`, `expires_at > now()` atau null
3. Ambil `amount` dari `consultations` by `order_id` → hitung `discount_amount = amount * discount_percent / 100`
4. Jika valid: update `consultations` set `voucher_code`, `discount_percent`, `discount_amount`; increment `vouchers.used_count`; return `{ valid: true, discount_percent, discount_amount, final_amount }`
5. Jika tidak valid: return `{ valid: false, reason: string }`

> `used_count` di-increment saat validasi (bukan saat confirmed) untuk keamanan. Jika user remove voucher, endpoint yang sama dipanggil dengan `{ code: null, order_id }` untuk rollback.

**File:** `supabase/functions/validate-voucher/index.ts` (baru)

### Modifikasi `notify-admin`

- Terima field opsional `voucher_used: boolean`
- Jika `true`, query juga ambil `voucher_code, discount_percent, discount_amount` dari consultations
- Pesan WA ke admin ditambah blok:
  ```
  🎟️ Voucher digunakan
  Kode: KODE — Diskon 50% (Rp 250.000)
  Total dibayar: Rp 0
  ```

**File:** `supabase/functions/notify-admin/index.ts`

### Modifikasi `confirm-payment`

- Query tambahkan `voucher_code, discount_percent, discount_amount` dari consultations
- Pass ke `generateInvoicePDF()` sebagai parameter opsional
- Invoice PDF tampilkan baris diskon jika ada:
  ```
  Layanan Konsultasi Struktural  | Rp 500.000
  Diskon Voucher (50%)           | -Rp 250.000
  TOTAL                          | Rp 250.000
  ```

**File:** `supabase/functions/confirm-payment/index.ts`, `invoice.ts`

### Frontend

**`ReviewConfirmationPage.jsx`:**
- Tambah state: `voucherCode`, `voucherResult`, `voucherError`, `isValidatingVoucher`
- Section voucher antara review items dan checkbox konfirmasi
- Tombol "Lanjut ke Pembayaran" → jika 100% berubah "Konfirmasi Tanpa Pembayaran"
- Jika 100%: panggil `notify-admin` dengan `{ order_id, voucher_used: true }` lalu navigate ke `/payment/pending`

**`PaymentUploadPage.jsx`:**
- Jika `reviewData.discount_amount` ada, tampilkan nominal setelah diskon di baris "Nominal" bank info

### Admin Dashboard

**Halaman baru `AdminVouchers.jsx`:**
- Tabel: Kode, Deskripsi, Diskon (%), Dipakai/Maks, Kadaluarsa, Status
- Form modal buat voucher baru: kode, deskripsi, diskon %, maks penggunaan, tanggal kadaluarsa
- Aksi: toggle aktif/nonaktif, hapus

**`AdminConsultations.jsx`:**
- 2 stats card tambahan: "Voucher Dipakai" (count) dan "Total Diskon" (sum discount_amount)
- Kolom/badge "Voucher" di tabel: `🎟️ KODE (-50%)` jika ada, dash jika tidak

**Routing:** tambah `/admin/vouchers` ke App router

**File baru/berubah:**
- `frontend/src/pages/admin/AdminVouchers.jsx` (baru)
- `frontend/src/pages/admin/AdminConsultations.jsx`
- `frontend/src/pages/ReviewConfirmationPage.jsx`
- `frontend/src/pages/PaymentUploadPage.jsx`
- `frontend/src/App.jsx` (tambah route `path="vouchers"` di dalam admin block)
- `frontend/src/components/admin/AdminSidebar.jsx` (tambah item "Voucher" ke `NAV_ITEMS`)

---

## Urutan Implementasi

1. Migrations (DB schema) — harus duluan sebelum edge functions
2. Bug fix `confirm-payment` (502)
3. Bug fix `create-consultation` + null-check `notify-admin`
4. Edge function `validate-voucher` (baru)
5. Modifikasi `notify-admin` (voucher info)
6. Modifikasi `confirm-payment` + `invoice.ts` (diskon di PDF)
7. Frontend `ReviewConfirmationPage` (voucher input + 100% flow)
8. Frontend `PaymentUploadPage` (tampilkan harga diskon)
9. Admin `AdminVouchers` (halaman baru)
10. Admin `AdminConsultations` (stats + kolom voucher)
