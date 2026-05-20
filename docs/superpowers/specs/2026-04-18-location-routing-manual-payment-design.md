# Design: Location-Based Routing & Manual Bank Transfer Payment

**Date:** 2026-04-18  
**Status:** Approved  
**Scope:** Two independent features — location-based routing dan sistem pembayaran manual pengganti Midtrans

---

## 1. Overview

Terdapat dua perubahan utama pada sistem:

1. **Location-Based Routing** — User di luar Jabodetabek diarahkan ke WhatsApp admin untuk konsultasi terlebih dahulu, bukan langsung ke pembayaran.
2. **Manual Bank Transfer Payment** — Midtrans Snap diganti dengan sistem transfer bank manual + upload bukti + konfirmasi admin + email notifikasi.

---

## 2. Location-Based Routing

### 2.1 Perubahan PreassessmentPage

- Field lokasi diperluas dari hanya "Jakarta" menjadi pilihan lengkap Jabodetabek:
  - Jakarta, Bogor, Depok, Tangerang, Bekasi
- Nilai lokasi yang dipilih diteruskan ke `reviewData` saat navigate ke ReviewConfirmationPage.

### 2.2 Perubahan ReviewConfirmationPage

- Saat halaman load, cek `reviewData.location` apakah termasuk dalam daftar Jabodetabek.
- **Jika luar Jabodetabek:**
  - Tampilkan popup modal dengan pesan:
    > "Untuk daerah luar Jakarta akan dilakukan konsultasi dengan admin sebelum dilakukan transaksi pembayaran"
  - Popup memiliki dua tombol:
    - **"Hubungi Admin via WhatsApp"** — membuka `wa.me` dengan pesan template otomatis berisi nama dan kota user
    - **"Kembali"** — tutup popup, user bisa ubah data
  - WhatsApp URL format: `https://wa.me/62XXXX?text=Halo+Admin,+saya+[nama]+dari+[kota]+ingin+konsultasi+struktural`
- **Jika Jabodetabek:**
  - Flow normal ke pembayaran, popup tidak muncul.

### 2.3 Definisi Jabodetabek

```js
const JABODETABEK = ['Jakarta', 'Bogor', 'Depok', 'Tangerang', 'Bekasi']
```

---

## 3. Manual Bank Transfer Payment (Pengganti Midtrans)

### 3.1 Arsitektur Alur

```
[ReviewConfirmationPage]
  → Tampilkan info rekening bank
  → Tombol "Saya Sudah Transfer"
        ↓
[PaymentUploadPage] ← HALAMAN BARU
  → Upload foto/screenshot bukti transfer
  → Simpan ke Supabase Storage
  → Update URL bukti di tabel consultations
        ↓
[PaymentPendingPage] ← UPDATE
  → Pesan: "Bukti sedang diverifikasi admin"
        ↓
[AdminDashboard] ← TAMBAH FITUR
  → Tabel daftar pending verification
  → Tombol "Konfirmasi Pembayaran"
        ↓
[Edge Function: confirm-payment] ← BARU
  → Update status → 'paid'
  → Kirim email notifikasi ke user via Resend
        ↓
[User] → Terima email konfirmasi
```

### 3.2 ReviewConfirmationPage

- Hapus seluruh logika Midtrans (`window.snap.pay`, token, Edge Function `create-consultation` call).
- Tambah card UI yang menampilkan:
  - Nama bank
  - Nomor rekening
  - Nama pemilik rekening
  - Nominal transfer (tetap atau sesuai layanan)
- Tombol berubah: "Lanjut ke Pembayaran" → **"Saya Sudah Transfer"**
- Klik tombol → navigate ke `/payment/upload` dengan state `{ reviewData, orderId }`

### 3.3 PaymentUploadPage (Halaman Baru)

- Route: `/payment/upload`
- Komponen form:
  - Input file (accept: jpg, png, pdf; max 5MB)
  - Preview gambar setelah dipilih
  - Tombol "Kirim Bukti Transfer"
- Submit flow:
  1. Upload file ke Supabase Storage bucket `payment-proofs` dengan path `{orderId}.{ext}`
  2. Dapatkan public URL file
  3. Update baris di tabel `consultations`: `{ proof_url: fileUrl, status: 'pending_verification' }`
  4. Navigate ke `/payment/pending`

### 3.4 PaymentPendingPage

- Hapus tampilan VA number / info Midtrans.
- Update teks utama: *"Bukti transfer Anda sedang diverifikasi oleh admin. Kami akan mengirim konfirmasi ke email Anda setelah pembayaran terverifikasi."*

### 3.5 AdminDashboard

- Tambah tab atau section baru: **"Verifikasi Pembayaran"**
- Tampilkan tabel dengan kolom: Nama, Email, Kota, Tanggal Submit, Preview Bukti, Aksi
- Filter: hanya tampilkan `status = 'pending_verification'`
- Tombol **"Konfirmasi"** per baris:
  - Panggil Edge Function `confirm-payment` dengan `{ orderId, userEmail, userName }`

### 3.6 Edge Function: confirm-payment (Baru)

- Endpoint: `POST /functions/v1/confirm-payment`
- Input: `{ order_id, user_email, user_name }`
- Langkah:
  1. Update `consultations` set `status = 'paid'` where `order_id = ?`
  2. Kirim email via Resend API:
     - From: `noreply@[domain]`
     - To: `user_email`
     - Subject: "Pembayaran Konsultasi Dikonfirmasi"
     - Body: informasi konfirmasi + instruksi selanjutnya
- Environment variables yang dibutuhkan: `RESEND_API_KEY`

---

## 4. Perubahan Database

### Tabel `consultations` — Tambah Kolom

| Kolom | Tipe | Keterangan |
|---|---|---|
| `proof_url` | text | URL file bukti transfer di Supabase Storage |
| `status` | text | Nilai baru: `pending_verification`, `paid` |
| `location` | text | Kota user (dari preassessment) |

### Supabase Storage

- Buat bucket baru: `payment-proofs`
- Policy: authenticated upload, admin-only read (atau public read dengan path tidak dapat di-guess)

---

## 5. File yang Berubah

| File | Jenis Perubahan |
|---|---|
| `frontend/src/pages/PreassessmentPage.jsx` | Update pilihan lokasi ke Jabodetabek |
| `frontend/src/pages/ReviewConfirmationPage.jsx` | Hapus Midtrans, tambah bank info + popup |
| `frontend/src/pages/PaymentUploadPage.jsx` | **File baru** |
| `frontend/src/pages/PaymentPendingPage.jsx` | Update teks status |
| `frontend/src/pages/AdminDashboard.jsx` | Tambah section verifikasi pembayaran |
| `frontend/src/App.jsx` | Tambah route `/payment/upload` |
| `supabase/functions/confirm-payment/index.ts` | **File baru** |
| `supabase/functions/create-consultation/index.ts` | Hapus Midtrans Snap logic (opsional) |

---

## 6. Dependencies Eksternal

| Service | Kebutuhan | Status |
|---|---|---|
| Resend | Akun + API key untuk kirim email | Perlu daftar |
| Supabase Storage | Bucket `payment-proofs` | Perlu dibuat |
| WhatsApp | Nomor admin untuk `wa.me` URL | Sudah ada |
| Midtrans | Tidak digunakan lagi sementara | Dinonaktifkan |
