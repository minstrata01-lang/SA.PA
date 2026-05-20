# Location-Based Routing & Manual Bank Transfer Payment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tambah routing berbasis lokasi (Jabodetabek → bayar, luar → WA admin) dan ganti Midtrans dengan sistem transfer bank manual + upload bukti + konfirmasi admin + email notifikasi.

**Architecture:** Field lokasi ditambahkan ke form step 1 (PersonalDetailsStep), lalu diteruskan ke ReviewConfirmationPage yang mengecek apakah user berada di Jabodetabek. Pembayaran manual menggunakan Supabase Storage untuk bukti transfer dan Edge Function baru `confirm-payment` yang mengirim email via Resend saat admin mengonfirmasi.

**Tech Stack:** React 19, React Router v7, Supabase JS v2, Supabase Storage, Supabase Edge Functions (Deno), Resend API, Tailwind CSS v4, Framer Motion

---

## ⚠️ Data yang Harus Disiapkan Sebelum Implementasi

Sebelum mulai, siapkan nilai berikut (akan digunakan di Task 3 dan Task 7):

| Data | Contoh | Digunakan di |
|---|---|---|
| Nomor WA admin | `6281234567890` | Task 2 |
| Nama bank | `BCA` | Task 3 |
| Nomor rekening | `1234567890` | Task 3 |
| Nama pemilik rekening | `PT Stratalift Indonesia` | Task 3 |
| Nominal transfer | `500000` (dalam rupiah) | Task 3 |
| Resend API Key | `re_xxxx` | Task 7 |
| Email pengirim | `noreply@yourdomain.com` | Task 7 |

---

## File Map

| File | Status | Tanggung Jawab |
|---|---|---|
| `frontend/src/components/preassessment/PersonalDetailsStep.jsx` | Modifikasi | Tambah dropdown lokasi (Jabodetabek + Luar Jakarta) |
| `frontend/src/components/preassessment/ConsultationForm.jsx` | Modifikasi | Tambah `location` ke formData, teruskan ke reviewData |
| `frontend/src/pages/ReviewConfirmationPage.jsx` | Modifikasi | Hapus Midtrans, tambah popup luar Jabotabek + info rekening |
| `frontend/src/pages/PaymentUploadPage.jsx` | **Baru** | Form upload bukti transfer ke Supabase Storage |
| `frontend/src/pages/PaymentPendingPage.jsx` | Modifikasi | Update teks status menunggu verifikasi |
| `frontend/src/pages/AdminDashboard.jsx` | Modifikasi | Tambah tab "Verifikasi Pembayaran" + tombol konfirmasi |
| `frontend/src/App.jsx` | Modifikasi | Tambah route `/payment/upload` |
| `supabase/functions/confirm-payment/index.ts` | **Baru** | Update status DB + kirim email via Resend |

---

## Task 1: Tambah Field Lokasi ke Form Preassessment

**Files:**
- Modify: `frontend/src/components/preassessment/PersonalDetailsStep.jsx`
- Modify: `frontend/src/components/preassessment/ConsultationForm.jsx`

### Langkah 1.1 — Tambah field lokasi ke formData di ConsultationForm

Buka `frontend/src/components/preassessment/ConsultationForm.jsx`.

Ubah `formData` initial state (baris 17–25) — tambah field `location`:

```jsx
const [formData, setFormData] = useState({
  fullName: "",
  email: "",
  phone: "",
  location: "",          // ← tambah ini
  selectedCategories: [],
  issueType: "",
  issueDescription: "",
  projectDetails: "",
});
```

### Langkah 1.2 — Teruskan `location` ke reviewData saat navigate

Di fungsi `handleSubmit` (baris 166–179), tambah `location` ke objek `reviewData`:

```jsx
navigate("/preassessment/review-confirmation", {
  state: {
    reviewData: {
      name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      location: formData.location,      // ← tambah ini
      projectDetails,
      selectedCategories: selected,
      issueType: formData.issueType,
      issueDescription: description,
      orderId,
    },
  },
});
```

### Langkah 1.3 — Tambah dropdown lokasi ke PersonalDetailsStep

Buka `frontend/src/components/preassessment/PersonalDetailsStep.jsx`.

Tambah validasi lokasi di fungsi `validate()`:

```jsx
function validate() {
  const newErrors = {};

  if (!formData.fullName || formData.fullName.trim().length < 2) {
    newErrors.fullName = "Nama lengkap wajib diisi (minimal 2 karakter).";
  }
  if (!formData.email || !EMAIL_REGEX.test(formData.email)) {
    newErrors.email = "Format email tidak valid. Contoh: nama@email.com";
  }
  if (!formData.phone || !PHONE_REGEX.test(formData.phone)) {
    newErrors.phone =
      "Nomor HP harus diawali 08 dan terdiri dari 10–14 digit. Contoh: 081234567890";
  }
  if (!formData.location) {
    newErrors.location = "Lokasi proyek wajib dipilih.";  // ← tambah ini
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
}
```

Tambah dropdown lokasi di dalam `<div className="mt-6 grid gap-4">`, setelah field Phone:

```jsx
{/* Location */}
<label className="grid gap-2">
  <span className="text-sm font-semibold text-[#003D6B]">Lokasi Proyek</span>
  <select
    name="location"
    value={formData.location}
    onChange={handleChange}
    className={`${inputBase} ${errors.location ? inputError : inputNormal} bg-white`}
  >
    <option value="">-- Pilih Kota/Wilayah --</option>
    <option value="Jakarta">Jakarta</option>
    <option value="Bogor">Bogor</option>
    <option value="Depok">Depok</option>
    <option value="Tangerang">Tangerang</option>
    <option value="Bekasi">Bekasi</option>
    <option value="Luar Jabodetabek">Luar Jabodetabek</option>
  </select>
  {errors.location && (
    <p className="flex items-center gap-1 text-xs text-red-500">
      <span>⚠</span>
      {errors.location}
    </p>
  )}
</label>
```

### Langkah 1.4 — Tambah `location` ke initialFormData saat user kembali dari ReviewPage

Di `ConsultationForm.jsx`, di dalam `useEffect` yang menangani `location.state?.initialFormData` (baris 36–47), tambah field `location`:

```jsx
setFormData((prev) => ({
  ...prev,
  fullName: incoming.fullName || prev.fullName,
  email: incoming.email || prev.email,
  phone: incoming.phone || prev.phone,
  location: incoming.location || prev.location,      // ← tambah ini
  selectedCategories: Array.isArray(incoming.selectedCategories)
    ? incoming.selectedCategories
    : prev.selectedCategories,
  issueType: incoming.issueType || prev.issueType,
  issueDescription: incoming.issueDescription || prev.issueDescription,
  projectDetails: incoming.projectDetails || prev.projectDetails,
}));
```

Di `ReviewConfirmationPage.jsx`, di dalam `handleEditData`, tambah `location` ke `initialFormData`:

```jsx
const handleEditData = () => {
  navigate("/preassessment", {
    state: {
      initialFormData: {
        fullName: reviewData.name || reviewData.fullName || "",
        email: reviewData.email || "",
        phone: reviewData.phone || "",
        location: reviewData.location || "",      // ← tambah ini
        selectedCategories: reviewData.selectedCategories || [],
        issueType: reviewData.issueType || "",
        issueDescription: reviewData.issueDescription || "",
        projectDetails,
      },
    },
  });
};
```

### Langkah 1.5 — Verifikasi manual

Jalankan dev server:
```bash
cd frontend && npm run dev
```

Buka `http://localhost:5173/preassessment`, klik "Mulai Konsultasi", pastikan:
- Dropdown lokasi muncul di Step 1 setelah field No. HP
- Tidak bisa lanjut jika lokasi belum dipilih
- Data lokasi tampil di URL state saat navigate ke ReviewConfirmation (cek React DevTools → Router state)

### Langkah 1.6 — Commit

```bash
git add frontend/src/components/preassessment/PersonalDetailsStep.jsx frontend/src/components/preassessment/ConsultationForm.jsx frontend/src/pages/ReviewConfirmationPage.jsx
git commit -m "feat: tambah field lokasi ke form preassessment"
```

---

## Task 2: Popup Peringatan Luar Jabodetabek di ReviewConfirmationPage

**Files:**
- Modify: `frontend/src/pages/ReviewConfirmationPage.jsx`

### Langkah 2.1 — Tambah konstanta dan state popup

Di awal fungsi `ReviewConfirmationPage()`, setelah deklarasi state yang ada, tambah:

```jsx
const JABODETABEK = ["Jakarta", "Bogor", "Depok", "Tangerang", "Bekasi"];
const isOutsideJabodetabek = reviewData.location && !JABODETABEK.includes(reviewData.location);
const [showOutsidePopup, setShowOutsidePopup] = useState(false);

// Tampilkan popup otomatis jika lokasi luar Jabodetabek
useEffect(() => {
  if (isOutsideJabodetabek) {
    setShowOutsidePopup(true);
  }
}, [isOutsideJabodetabek]);
```

Pastikan `useEffect` diimport dari React (sudah ada di file ini karena menggunakan hooks).

### Langkah 2.2 — Tambah handler WA redirect

```jsx
const handleContactAdmin = () => {
  const name = encodeURIComponent(reviewData.name || reviewData.fullName || "");
  const city = encodeURIComponent(reviewData.location || "");
  const waUrl = `https://wa.me/62XXXXXXXXXX?text=Halo+Admin%2C+saya+${name}+dari+${city}+ingin+konsultasi+struktural.`;
  window.open(waUrl, "_blank");
};
```

Ganti `62XXXXXXXXXX` dengan nomor WA admin yang sebenarnya (tanpa tanda `+` atau `0` di depan).

### Langkah 2.3 — Tambah komponen popup modal

Tambahkan JSX popup ini tepat sebelum tag `</section>` penutup di return statement:

```jsx
{/* Popup Luar Jabodetabek */}
{showOutsidePopup && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
    <motion.div
      className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,61,107,0.22)]"
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F58220]/10 mb-4">
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#F58220]" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-[#003D6B] mb-3">Perhatian</h2>
      <p className="text-sm sm:text-base leading-relaxed text-[#003D6B]/80 mb-6">
        Untuk daerah luar Jakarta akan dilakukan konsultasi dengan admin sebelum dilakukan transaksi pembayaran.
      </p>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleContactAdmin}
          className="cursor-pointer w-full rounded-xl bg-[#25D366] px-6 py-3 text-base font-bold text-white shadow-[0_8px_20px_rgba(37,211,102,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(37,211,102,0.42)]"
        >
          Hubungi Admin via WhatsApp
        </button>
        <button
          type="button"
          onClick={() => setShowOutsidePopup(false)}
          className="cursor-pointer w-full rounded-xl border border-[#003D6B]/20 bg-white px-6 py-3 text-base font-semibold text-[#003D6B] transition-colors hover:bg-[#003D6B]/5"
        >
          Kembali
        </button>
      </div>
    </motion.div>
  </div>
)}
```

### Langkah 2.4 — Verifikasi manual

- Isi form preassessment, pilih lokasi "Luar Jabodetabek", lanjut ke ReviewConfirmation
- Pastikan popup muncul otomatis saat halaman load
- Klik "Kembali" → popup tutup
- Klik "Hubungi Admin via WhatsApp" → buka WA dengan pesan template

### Langkah 2.5 — Commit

```bash
git add frontend/src/pages/ReviewConfirmationPage.jsx
git commit -m "feat: tambah popup peringatan untuk user luar Jabodetabek"
```

---

## Task 3: Ganti Midtrans dengan Info Transfer Bank di ReviewConfirmationPage

**Files:**
- Modify: `frontend/src/pages/ReviewConfirmationPage.jsx`

### Langkah 3.1 — Hapus semua logika Midtrans

Hapus seluruh fungsi `handleProceedToPayment` (dari baris `const handleProceedToPayment = async () => {` hingga kurung kurawal penutupnya).

Hapus juga state `isPaying`:
```jsx
// HAPUS baris ini:
const [isPaying, setIsPaying] = useState(false);
```

### Langkah 3.2 — Tambah konstanta info bank

Tambahkan setelah deklarasi `JABODETABEK` di awal fungsi:

```jsx
const BANK_INFO = {
  bankName: "BCA",                        // ← ganti dengan nama bank
  accountNumber: "1234567890",            // ← ganti dengan nomor rekening
  accountHolder: "PT Stratalift Indonesia", // ← ganti dengan nama pemilik
  amount: 500000,                          // ← ganti dengan nominal (dalam rupiah)
};
```

### Langkah 3.3 — Tambah handler navigasi ke upload page

```jsx
const handleProceedToUpload = () => {
  navigate("/payment/upload", {
    state: {
      reviewData,
      orderId: reviewData.orderId,
    },
  });
};
```

### Langkah 3.4 — Tambah card info rekening bank di JSX

Tambahkan card ini di dalam `<motion.div>` utama, setelah `<div className="mt-7 grid gap-4">` yang menampilkan reviewItems (setelah closing `</div>` dari grid), sebelum `<label>` checkbox:

```jsx
{/* Info Rekening Bank */}
<div className="mt-6 rounded-2xl border border-[#003D6B]/15 bg-[#F8FBFF] p-5">
  <p className="text-xs font-semibold tracking-[0.08em] uppercase text-[#003D6B]/65 mb-3">
    Transfer ke Rekening Berikut
  </p>
  <div className="grid gap-2">
    <div className="flex justify-between text-sm">
      <span className="text-[#003D6B]/60">Bank</span>
      <span className="font-bold text-[#003D6B]">{BANK_INFO.bankName}</span>
    </div>
    <div className="flex justify-between text-sm">
      <span className="text-[#003D6B]/60">No. Rekening</span>
      <span className="font-bold text-[#003D6B] tracking-wider">{BANK_INFO.accountNumber}</span>
    </div>
    <div className="flex justify-between text-sm">
      <span className="text-[#003D6B]/60">Atas Nama</span>
      <span className="font-bold text-[#003D6B]">{BANK_INFO.accountHolder}</span>
    </div>
    <div className="mt-2 border-t border-[#003D6B]/10 pt-2 flex justify-between text-sm">
      <span className="text-[#003D6B]/60">Jumlah Transfer</span>
      <span className="font-extrabold text-[#F58220] text-base">
        Rp {BANK_INFO.amount.toLocaleString("id-ID")}
      </span>
    </div>
  </div>
</div>
```

### Langkah 3.5 — Update tombol di bagian bawah

Ganti tombol "Lanjut ke Pembayaran" yang lama:

```jsx
<button
  type="button"
  onClick={handleProceedToUpload}
  disabled={!isConfirmed}
  className="cursor-pointer rounded-xl bg-[#F58220] px-6 py-3 text-base font-bold text-white shadow-[0_12px_26px_rgba(245,130,32,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(245,130,32,0.42)] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 disabled:hover:shadow-[0_12px_26px_rgba(245,130,32,0.35)]"
>
  Saya Sudah Transfer →
</button>
```

### Langkah 3.6 — Hapus Midtrans script dari index.html (jika ada)

Cek `frontend/index.html`:
```bash
grep -n "midtrans\|snap.js" frontend/index.html
```

Jika ditemukan, hapus tag `<script>` Midtrans dari `index.html`.

### Langkah 3.7 — Verifikasi manual

- Pilih lokasi Jakarta, lanjut ke ReviewConfirmation
- Pastikan card info rekening bank tampil dengan benar
- Centang checkbox → tombol "Saya Sudah Transfer →" aktif
- Klik tombol → navigate ke `/payment/upload`

### Langkah 3.8 — Commit

```bash
git add frontend/src/pages/ReviewConfirmationPage.jsx frontend/index.html
git commit -m "feat: ganti Midtrans dengan info transfer bank manual"
```

---

## Task 4: Buat PaymentUploadPage

**Files:**
- Create: `frontend/src/pages/PaymentUploadPage.jsx`
- Modify: `frontend/src/App.jsx`

### Langkah 4.1 — Buat file PaymentUploadPage.jsx

Buat file baru `frontend/src/pages/PaymentUploadPage.jsx`:

```jsx
import { useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "../supabaseClient";

function PaymentUploadPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);

  const { reviewData, orderId } = location.state || {};

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  if (!orderId || !reviewData) {
    return <Navigate to="/preassessment" replace />;
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setError("Format file tidak didukung. Gunakan JPG, PNG, atau PDF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran file maksimal 5MB.");
      return;
    }

    setError("");
    setSelectedFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreview("pdf");
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError("Pilih file bukti transfer terlebih dahulu.");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const ext = selectedFile.name.split(".").pop();
      const filePath = `${orderId}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(filePath, selectedFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("payment-proofs")
        .getPublicUrl(filePath);

      const proofUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from("consultations")
        .update({
          proof_url: proofUrl,
          payment_status: "pending_verification",
        })
        .eq("order_id", orderId);

      if (updateError) throw updateError;

      navigate("/payment/pending", {
        state: { orderId, reviewData },
      });
    } catch (err) {
      setError(err.message || "Gagal mengupload bukti transfer. Coba lagi.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="relative w-full overflow-hidden bg-linear-to-b from-[#F3F7FB] via-white to-[#F6FAFF] pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-24 page-fade-in">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(rgba(0,61,107,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,61,107,0.05) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-lg px-4 sm:px-6 lg:px-8 font-[Inter,Montserrat,sans-serif] text-[#003D6B]">
        <motion.div
          className="rounded-4xl border border-[#003D6B]/15 bg-white/95 p-6 sm:p-8 shadow-[0_20px_55px_rgba(0,61,107,0.14)] backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <p className="inline-flex rounded-full border border-[#003D6B]/20 bg-[#003D6B]/8 px-3 py-1 text-xs sm:text-sm font-semibold text-[#003D6B]">
            Upload Bukti Transfer
          </p>

          <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold leading-tight text-[#003D6B]">
            Unggah Bukti Pembayaran
          </h1>

          <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#003D6B]/80">
            Upload screenshot atau foto bukti transfer Anda. Format: JPG, PNG, atau PDF. Maks 5MB.
          </p>

          {/* Upload Area */}
          <div
            className="mt-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#003D6B]/20 bg-[#F8FBFF] p-8 cursor-pointer hover:border-[#F58220]/50 hover:bg-[#FFF8F3] transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {preview && preview !== "pdf" ? (
              <img src={preview} alt="Preview" className="max-h-48 rounded-xl object-contain" />
            ) : preview === "pdf" ? (
              <div className="flex flex-col items-center gap-2 text-[#003D6B]/60">
                <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span className="text-sm font-medium">{selectedFile?.name}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-[#003D6B]/45">
                <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span className="text-sm font-medium">Klik untuk pilih file</span>
                <span className="text-xs">JPG, PNG, PDF — maks 5MB</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {error && (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-red-500">
              <span>⚠</span> {error}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedFile || isUploading}
              className="cursor-pointer w-full rounded-xl bg-[#F58220] px-6 py-3 text-base font-bold text-white shadow-[0_12px_26px_rgba(245,130,32,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(245,130,32,0.42)] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
            >
              {isUploading ? "Mengunggah..." : "Kirim Bukti Transfer"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="cursor-pointer w-full rounded-xl border border-[#003D6B]/20 bg-white px-6 py-3 text-base font-semibold text-[#003D6B] transition-colors hover:bg-[#003D6B]/5"
            >
              Kembali
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default PaymentUploadPage;
```

### Langkah 4.2 — Tambah route di App.jsx

Buka `frontend/src/App.jsx`. Di bagian lazy imports, tambah:

```jsx
const PaymentUploadPage = lazy(() => import('./pages/PaymentUploadPage'));
```

Di dalam `<Routes>`, tambah route baru di antara route payment yang ada:

```jsx
<Route path="/payment/upload" element={<PaymentUploadPage />} />
```

### Langkah 4.3 — Buat Supabase Storage bucket `payment-proofs`

Buka Supabase Dashboard → Storage → New Bucket:
- Name: `payment-proofs`
- Public: **Yes** (agar admin bisa lihat preview tanpa auth)

Tambah policy untuk upload (Supabase Dashboard → Storage → payment-proofs → Policies):
```sql
-- Policy: Allow authenticated anon key to upload
CREATE POLICY "Allow upload" ON storage.objects
FOR INSERT TO anon
WITH CHECK (bucket_id = 'payment-proofs');
```

### Langkah 4.4 — Tambah kolom ke tabel consultations

Di Supabase Dashboard → SQL Editor, jalankan:

```sql
ALTER TABLE consultations
  ADD COLUMN IF NOT EXISTS proof_url text,
  ADD COLUMN IF NOT EXISTS location text;
```

### Langkah 4.5 — Verifikasi manual

- Setelah klik "Saya Sudah Transfer" di ReviewConfirmationPage, pastikan navigate ke `/payment/upload`
- Upload gambar → preview tampil
- Klik "Kirim Bukti Transfer" → loading state aktif → navigate ke `/payment/pending`
- Cek Supabase Storage → file ada di bucket `payment-proofs`
- Cek tabel `consultations` → `proof_url` dan `payment_status = 'pending_verification'` terupdate

### Langkah 4.6 — Commit

```bash
git add frontend/src/pages/PaymentUploadPage.jsx frontend/src/App.jsx
git commit -m "feat: buat PaymentUploadPage untuk upload bukti transfer"
```

---

## Task 5: Update PaymentPendingPage

**Files:**
- Modify: `frontend/src/pages/PaymentPendingPage.jsx`

### Langkah 5.1 — Ganti konten PaymentPendingPage

Baca file saat ini, lalu ganti seluruh konten dengan versi yang sudah dibersihkan dari info Midtrans:

```jsx
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";

function PaymentPendingPage() {
  const location = useLocation();
  const { reviewData } = location.state || {};
  const email = reviewData?.email || "email Anda";

  return (
    <section className="relative w-full overflow-hidden bg-linear-to-b from-[#F3F7FB] via-white to-[#F6FAFF] pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-24 page-fade-in">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(rgba(0,61,107,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,61,107,0.05) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-lg px-4 sm:px-6 lg:px-8 font-[Inter,Montserrat,sans-serif] text-[#003D6B]">
        <motion.div
          className="rounded-4xl border border-[#003D6B]/15 bg-white/95 p-6 sm:p-8 lg:p-10 shadow-[0_20px_55px_rgba(0,61,107,0.14)] backdrop-blur-sm text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          {/* Icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 mb-5">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#003D6B] leading-tight">
            Bukti Transfer Diterima
          </h1>

          <p className="mt-4 text-sm sm:text-base leading-relaxed text-[#003D6B]/75">
            Bukti transfer Anda sedang diverifikasi oleh admin kami.
            Kami akan mengirimkan konfirmasi ke <strong>{email}</strong> setelah pembayaran terverifikasi.
          </p>

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left">
            <p className="text-xs font-semibold tracking-wide uppercase text-amber-700 mb-2">Yang perlu diketahui</p>
            <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
              <li>Proses verifikasi biasanya 1×24 jam di hari kerja</li>
              <li>Cek folder spam jika email tidak masuk</li>
              <li>Jika ada pertanyaan, hubungi admin via WhatsApp</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default PaymentPendingPage;
```

### Langkah 5.2 — Verifikasi manual

- Setelah upload bukti transfer, pastikan navigate ke PaymentPendingPage
- Halaman menampilkan email user dengan benar
- Tidak ada info VA number atau referensi Midtrans

### Langkah 5.3 — Commit

```bash
git add frontend/src/pages/PaymentPendingPage.jsx
git commit -m "feat: update PaymentPendingPage untuk alur transfer manual"
```

---

## Task 6: Tambah Fitur Verifikasi Pembayaran di AdminDashboard

**Files:**
- Modify: `frontend/src/pages/AdminDashboard.jsx`

### Langkah 6.1 — Tambah tab "Verifikasi Pembayaran" ke FILTER_TABS

Di `AdminDashboard.jsx`, tambah entry baru ke `FILTER_TABS`:

```jsx
const FILTER_TABS = [
  { key: "all", label: "Semua" },
  { key: "pending_verification", label: "Verifikasi Pembayaran" },  // ← tambah ini
  { key: "unassigned", label: "Belum Diassign" },
  { key: "assigned", label: "Sudah Diassign" },
  { key: "active", label: "Sesi Aktif" },
  { key: "used", label: "Selesai" },
];
```

### Langkah 6.2 — Tambah filter untuk tab baru di filteredConsultations

Cari `filteredConsultations` (useMemo). Tambah case baru:

```jsx
const filteredConsultations = useMemo(() => {
  if (activeTab === "pending_verification")
    return consultations.filter((c) => c.payment_status === "pending_verification");  // ← tambah ini
  if (activeTab === "unassigned") return consultations.filter((c) => !c.consultant_id);
  // ... sisanya tetap sama
}, [consultations, activeTab]);
```

### Langkah 6.3 — Tambah fungsi konfirmasi pembayaran

Tambahkan fungsi `handleConfirmPayment` di dalam komponen `AdminDashboard`, setelah `fetchReports`:

```jsx
const handleConfirmPayment = async (consultation) => {
  const clientEmail = consultation.clients?.email;
  const clientName = consultation.clients?.full_name;
  const orderId = consultation.order_id;

  if (!window.confirm(`Konfirmasi pembayaran untuk ${clientName}?`)) return;

  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirm-payment`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: orderId,
          user_email: clientEmail,
          user_name: clientName,
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(err);
    }

    setToast(`Pembayaran ${clientName} berhasil dikonfirmasi!`);
    fetchData();
  } catch (err) {
    setToast(`Gagal konfirmasi: ${err.message}`);
  }
};
```

### Langkah 6.4 — Tambah tampilan bukti transfer + tombol konfirmasi di tabel

Cari bagian JSX yang merender baris konsultasi (biasanya di dalam `.map(consultation => ...)`). Tambahkan kolom/aksi berikut untuk row yang memiliki `proof_url`:

Di dalam setiap baris konsultasi, tambah section ini setelah aksi yang sudah ada:

```jsx
{consultation.proof_url && consultation.payment_status === "pending_verification" && (
  <div className="mt-2 flex items-center gap-3">
    <a
      href={consultation.proof_url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs font-semibold text-[#003D6B] underline underline-offset-2"
    >
      Lihat Bukti Transfer
    </a>
    <button
      type="button"
      onClick={() => handleConfirmPayment(consultation)}
      className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600 transition-colors"
    >
      Konfirmasi Pembayaran
    </button>
  </div>
)}
```

### Langkah 6.5 — Verifikasi manual

- Login ke `/admin`
- Tab "Verifikasi Pembayaran" muncul
- Konsultasi dengan `payment_status = 'pending_verification'` tampil di tab tersebut
- Link "Lihat Bukti Transfer" membuka file di tab baru
- Tombol "Konfirmasi Pembayaran" memunculkan confirm dialog

### Langkah 6.6 — Commit

```bash
git add frontend/src/pages/AdminDashboard.jsx
git commit -m "feat: tambah tab verifikasi pembayaran di AdminDashboard"
```

---

## Task 7: Buat Edge Function confirm-payment

**Files:**
- Create: `supabase/functions/confirm-payment/index.ts`

### Langkah 7.1 — Buat Edge Function

Buat file `supabase/functions/confirm-payment/index.ts`:

```typescript
declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void
  env: { get: (key: string) => string | undefined }
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { order_id, user_email, user_name } = await req.json()

    if (!order_id || !user_email) {
      return new Response(
        JSON.stringify({ error: 'order_id dan user_email wajib diisi' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Update status konsultasi
    const { error: updateError } = await supabase
      .from('consultations')
      .update({ payment_status: 'paid' })
      .eq('order_id', order_id)

    if (updateError) {
      console.error('Gagal update status:', updateError.message)
      return new Response(
        JSON.stringify({ error: 'Gagal update status pembayaran' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Kirim email konfirmasi via Resend
    const resendKey = Deno.env.get('RESEND_API_KEY')!
    const senderEmail = Deno.env.get('SENDER_EMAIL') || 'noreply@yourdomain.com'

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: senderEmail,
        to: user_email,
        subject: 'Pembayaran Konsultasi Anda Telah Dikonfirmasi',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #003D6B;">Pembayaran Dikonfirmasi ✓</h2>
            <p>Halo <strong>${user_name || 'Pelanggan'}</strong>,</p>
            <p>Pembayaran konsultasi struktural Anda telah berhasil dikonfirmasi oleh tim kami.</p>
            <p>Tim konsultan kami akan segera menghubungi Anda untuk menjadwalkan sesi konsultasi.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            <p style="color: #6b7280; font-size: 13px;">
              Jika ada pertanyaan, balas email ini atau hubungi kami via WhatsApp.
            </p>
          </div>
        `,
      }),
    })

    if (!emailRes.ok) {
      const emailErr = await emailRes.json()
      console.error('Gagal kirim email:', JSON.stringify(emailErr))
      // Tidak throw error — status DB sudah terupdate, email gagal tidak membatalkan konfirmasi
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Unhandled error:', (err as Error).message)
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

### Langkah 7.2 — Set environment variables di Supabase

Di Supabase Dashboard → Settings → Edge Functions → Environment Variables, tambah:

| Key | Value |
|---|---|
| `RESEND_API_KEY` | API key dari resend.com |
| `SENDER_EMAIL` | Email pengirim yang sudah diverifikasi di Resend |

### Langkah 7.3 — Deploy Edge Function

```bash
npx supabase functions deploy confirm-payment --project-ref <YOUR_PROJECT_REF>
```

Ganti `<YOUR_PROJECT_REF>` dengan project ref dari Supabase Dashboard (Settings → General).

### Langkah 7.4 — Verifikasi manual

- Di AdminDashboard, klik "Konfirmasi Pembayaran" pada konsultasi yang pending
- Cek Supabase tabel `consultations` → `payment_status` berubah ke `paid`
- Cek inbox email user → email konfirmasi diterima
- Cek Resend dashboard → email tercatat sebagai delivered

### Langkah 7.5 — Commit

```bash
git add supabase/functions/confirm-payment/index.ts
git commit -m "feat: buat Edge Function confirm-payment dengan notifikasi email"
```

---

## Checklist Akhir

Setelah semua task selesai, lakukan end-to-end test lengkap:

- [ ] User pilih **Jakarta** → ReviewConfirmation muncul tanpa popup → info rekening tampil → upload bukti → PaymentPending tampil
- [ ] User pilih **Luar Jabodetabek** → ReviewConfirmation → popup muncul otomatis → klik WA → buka WhatsApp dengan template pesan
- [ ] Admin login → tab "Verifikasi Pembayaran" → lihat bukti → konfirmasi → status berubah → user dapat email
- [ ] Tidak ada referensi atau error Midtrans di console browser
