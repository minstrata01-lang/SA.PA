# Payment Admin Confirmation — Design Spec

**Date:** 2026-04-30
**Branch:** claude/ui-redesign

---

## Overview

Tambahkan fitur konfirmasi pembayaran di admin dashboard sehingga admin dapat mengkonfirmasi atau menolak pembayaran user langsung dari halaman `AdminConsultations` tanpa harus mengakses database secara langsung. Sistem akan mengirim notifikasi email dan WhatsApp ke user saat admin mengambil tindakan, serta notifikasi WhatsApp ke admin saat user baru mengupload bukti transfer.

---

## Alur Pembayaran (Post-Midtrans)

Midtrans sudah tidak digunakan. Alur aktif murni manual bank transfer:

```
1. PreassessmentPage         → user isi form konsultasi
2. ReviewConfirmationPage    → review data, klik "Lanjut ke Pembayaran"
3. PaymentUploadPage         → user lihat info rekening BCA, upload bukti transfer
                               → set payment_status = "pending_verification"
                               → simpan proof_url ke storage "payment-proofs"
                               → panggil edge fn notify-admin (WA ke admin)
4. PaymentPendingPage        → halaman statis, user menunggu konfirmasi
5. AdminConsultations        → admin lihat payment_status + bukti, klik Konfirmasi/Tolak
                               → panggil edge fn confirm-payment
                               → update DB + kirim email + WA ke user
```

### Dead Code (tidak dihapus, cukup didokumentasikan)
- `WaitingPage` — sisa Midtrans, route `/waiting` tidak digunakan
- `supabase/functions/midtrans-webhook` — tidak digunakan
- Logika Snap token di `supabase/functions/create-consultation` — tidak digunakan

---

## Perubahan Frontend: AdminConsultations

### Kolom Tabel Baru

Ditambahkan setelah kolom "Konsultan", sebelum kolom "Aksi":

| Kolom | Konten |
|---|---|
| **Status Bayar** | Badge warna: `pending_verification` = kuning, `confirmed` = hijau, `rejected` = merah, lainnya = abu-abu |
| **Bukti Transfer** | Ikon link — klik buka `proof_url` di tab baru. Jika kosong, tampilkan `-` |
| **Aksi Bayar** | Tombol Konfirmasi (hijau) + Tolak (merah) jika `payment_status = "pending_verification"`. Jika sudah confirmed/rejected, tampilkan teks status saja |

### Filter Tab Baru

Tambahkan ke `FILTER_TABS`:
```js
{ key: 'pending_payment', label: 'Menunggu Verifikasi' }
```
Filter: `payment_status === "pending_verification"`

### Stat Card Baru

Tambahkan card ke-4 di samping 3 card yang sudah ada:
- Label: "Menunggu Verifikasi"
- Value: count consultations dengan `payment_status = "pending_verification"`
- Warna: orange (#E8920A)

### Query Fetch

Update query `fetchData` agar include field `payment_status` dan `proof_url`:
```js
supabase
  .from('consultations')
  .select('*, clients(full_name, email, phone_number), consultants(name, phone_number)')
```
Field `payment_status` dan `proof_url` sudah ada di tabel `consultations`, sudah tercover oleh `*`.

---

## Perubahan Frontend: PaymentUploadPage

Setelah upload bukti transfer berhasil (sebelum navigate ke `/payment/pending`), panggil edge function `notify-admin`:

```js
await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-admin`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  },
  body: JSON.stringify({ order_id: orderId }),
});
```

Kegagalan panggilan ini tidak memblokir alur user (fire-and-forget).

---

## Edge Functions Baru

### 1. `confirm-payment`

**Path:** `supabase/functions/confirm-payment/index.ts`

**Request:**
```json
{ "consultation_id": "uuid", "action": "confirm" | "reject" }
```

**Langkah:**
1. Validasi input (`consultation_id` dan `action` wajib ada)
2. Set `payment_status`:
   - `"confirm"` → `"confirmed"`
   - `"reject"` → `"rejected"`
3. Update tabel `consultations` via service role (bypass RLS)
4. Ambil data client: `full_name`, `email`, `phone_number` dari relasi `clients`
5. Kirim email via **Resend**:
   - Konfirmasi: subjek "Pembayaran Dikonfirmasi", body berisi info order + instruksi selanjutnya
   - Tolak: subjek "Pembayaran Ditolak", body berisi penjelasan + ajakan hubungi admin
6. Kirim WA via **Fonnte** ke nomor `phone_number` user:
   - Konfirmasi: pesan singkat bahwa pembayaran dikonfirmasi, konsultan akan menghubungi
   - Tolak: pesan bahwa pembayaran ditolak, minta upload ulang atau hubungi admin

**Response:**
```json
{ "success": true }
```

**Error handling:** Kegagalan email/WA dicatat di log tapi tidak menggagalkan response (DB update sudah berhasil).

---

### 2. `notify-admin`

**Path:** `supabase/functions/notify-admin/index.ts`

**Request:**
```json
{ "order_id": "string" }
```

**Langkah:**
1. Ambil data consultation + client dari DB berdasarkan `order_id`
2. Kirim WA ke admin via **Fonnte** (`ADMIN_WA_NUMBER`) dengan pesan:
   ```
   🔔 Bukti Transfer Baru!
   👤 {nama_client}
   📧 {email}
   📱 {phone}
   🔑 Order ID: {order_id}
   Buka dashboard untuk verifikasi:
   {FRONTEND_URL}/admin/consultations
   ```

**Response:**
```json
{ "success": true }
```

---

## Environment Variables

Semua env var berikut sudah tersedia di project:

| Variable | Digunakan di |
|---|---|
| `SUPABASE_URL` | Kedua edge function |
| `SUPABASE_SERVICE_ROLE_KEY` | Kedua edge function |
| `RESEND_API_KEY` | `confirm-payment` |
| `FROM_EMAIL` | `confirm-payment` |
| `FONNTE_TOKEN` | Kedua edge function |
| `ADMIN_WA_NUMBER` | `notify-admin` |
| `FRONTEND_URL` | `notify-admin` |

---

## Data Model (Tidak Berubah)

Tabel `consultations` sudah memiliki kolom yang dibutuhkan:
- `payment_status` — string, nilai: `null`, `"pending_verification"`, `"confirmed"`, `"rejected"`
- `proof_url` — string, URL publik ke storage `payment-proofs`
- `order_id` — string
- `consultant_id` — FK ke `consultants`
- `session_status` — string: `"active"`, `"used"`, `"expired"`, `"inactive"`

Tidak ada migrasi database yang dibutuhkan.

---

## Out of Scope

- Polling di `PaymentPendingPage` (user tidak otomatis diarahkan ke success page setelah admin konfirmasi — mereka hanya terima notifikasi email/WA)
- Hapus dead code Midtrans (bisa dilakukan sebagai cleanup terpisah)
- Preview inline bukti transfer di tabel (cukup buka di tab baru)
