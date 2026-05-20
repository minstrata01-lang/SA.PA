# Design: Professional PDF Invoice via confirm-payment

**Date:** 2026-05-01  
**Status:** Approved

## Overview

Menambahkan fitur generate invoice PDF profesional yang dikirim sebagai email attachment saat admin mengkonfirmasi pembayaran manual. Invoice dibuat menggunakan `pdf-lib` (pure TypeScript) di dalam Supabase Edge Function `confirm-payment`.

## Scope

- **In scope:** PDF generation, email attachment, database migration, logo embedding
- **Out of scope:** Invoice storage/history, invoice nomor sequence, Midtrans webhook (`midtrans-webhook` tidak disentuh)

---

## Arsitektur & Alur

### File yang berubah

```
supabase/migrations/
  └── 20260501000001_add_amount_to_consultations.sql   ← baru

supabase/functions/
  └── confirm-payment/
        └── index.ts   ← dimodifikasi
```

### Alur saat admin confirm

1. Admin klik confirm → `confirm-payment` dipanggil dengan `{ consultation_id, action: 'confirm' }`
2. Function update `payment_status = 'confirmed'` di tabel `consultations`
3. Query data konsultasi + client (termasuk kolom `amount`)
4. Generate PDF invoice via `generateInvoicePDF()`:
   - Fetch logo dari Supabase Storage URL → embed ke PDF
   - Render header bisnis (logo, nama, alamat, kontak)
   - Render data klien
   - Render tabel item + total
   - Render catatan proyek + status LUNAS
5. Kirim email via Resend API dengan PDF sebagai `attachments` (base64)
6. Kirim WA notifikasi ke klien via Fonnte (tidak berubah)

---

## Database Migration

```sql
ALTER TABLE consultations
  ADD COLUMN IF NOT EXISTS amount numeric DEFAULT 500000;
```

- Default `500000` (Rp 500.000) — fixed amount untuk semua order
- Baris lama otomatis mendapat nilai default
- Tidak perlu diisi dari frontend/admin — selalu Rp 500.000

---

## PDF Invoice Layout

### Halaman: A4 Portrait (595 × 842 pt)

```
┌─────────────────────────────────────────────┐
│  [LOGO]   SAPA                              │
│           Jl. Condet Raya No. 27            │
│           Jakarta Timur, DKI 13760          │
│           WA: 62881010512829                │
│           contact@stratalift.co.id          │
│                          No: INV-{order_id} │
│                          Tanggal: DD/MM/YYYY│
├─────────────────────────────────────────────┤
│  INVOICE                                    │
│                                             │
│  Kepada:                                    │
│  Nama  : {full_name}                        │
│  Email : {email}                            │
│  Telp  : {phone_number}                     │
├─────────────────────────────────────────────┤
│  Deskripsi              Jumlah              │
│  ──────────────────────────────             │
│  Layanan Konsultasi     Rp 500.000          │
│  Struktural                                 │
├─────────────────────────────────────────────┤
│                  TOTAL  Rp 500.000          │
├─────────────────────────────────────────────┤
│  Catatan Proyek:                            │
│  {project_details}                          │
│                                             │
│  Status: LUNAS ✓                            │
│                          © 2026 SAPA        │
└─────────────────────────────────────────────┘
```

### Data header bisnis (hardcoded)

| Field    | Nilai                        |
|----------|------------------------------|
| Nama     | SAPA                         |
| Alamat   | Jl. Condet Raya No. 27, Jakarta Timur, DKI 13760 |
| WA       | 62881010512829               |
| Email    | contact@stratalift.co.id     |
| Website  | — (belum fix, dilewati)      |

---

## Implementasi `confirm-payment/index.ts`

### Perubahan

1. **Import `pdf-lib`** di baris atas:
   ```ts
   import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib'
   ```

2. **Query diperluas** — tambah `amount` ke select:
   ```ts
   .select('order_id, project_details, amount, clients(full_name, email, phone_number)')
   ```

3. **Fungsi `generateInvoicePDF()`** — helper di file yang sama:
   - Parameter: `{ orderId, clientName, clientEmail, clientPhone, projectDetails, amount, logoUrl }`
   - Return: `Uint8Array`
   - Logo di-fetch via `fetch(logoUrl)` → embed sebagai PNG/JPG
   - Jika logo fetch gagal: PDF dibuat tanpa logo

4. **Email Resend diupdate** — tambah field `attachments`:
   ```ts
   // Konversi Uint8Array ke base64 via loop (aman untuk file besar)
   let binary = ''
   pdfBytes.forEach((b) => (binary += String.fromCharCode(b)))
   attachments: [{
     filename: `invoice-${order_id}.pdf`,
     content: btoa(binary),
   }]
   ```

### Environment variables yang dibutuhkan (tambahan)

| Variable         | Nilai                                          |
|-----------------|------------------------------------------------|
| `LOGO_URL`      | URL publik logo SAPA di Supabase Storage       |

---

## Error Handling

Semua error bersifat **non-fatal** terhadap status update DB:

| Skenario                   | Behavior                                          |
|----------------------------|---------------------------------------------------|
| Gagal fetch logo           | PDF dibuat tanpa logo, proses lanjut              |
| Gagal generate PDF         | Log error, email dikirim tanpa attachment         |
| Gagal kirim email          | Log error, WA notifikasi tetap jalan              |
| Gagal kirim WA             | Log error, return success (DB sudah terupdate)    |

---

## Yang Tidak Berubah

- `midtrans-webhook/index.ts` — tidak disentuh
- `notify-admin/index.ts` — tidak disentuh
- `create-consultation/index.ts` — tidak disentuh
- Logika reject di `confirm-payment` — tidak dapat invoice (hanya konfirmasi)
