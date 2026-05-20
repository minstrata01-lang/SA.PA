# Invoice PDF Professional Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate dan kirim invoice PDF profesional sebagai email attachment saat admin mengkonfirmasi pembayaran via `confirm-payment` edge function.

**Architecture:** PDF dibuat oleh helper `generateInvoicePDF()` di file terpisah `invoice.ts` menggunakan `pdf-lib@1.17.1`, di-convert ke base64 lalu dilampirkan ke email Resend. Database ditambah kolom `amount` dengan default Rp 500.000. Semua error PDF bersifat non-fatal — jika gagal, email tetap terkirim tanpa attachment.

**Tech Stack:** Deno (Supabase Edge Functions), `pdf-lib@1.17.1` via esm.sh, Resend API v1, Supabase PostgreSQL

---

## File Map

| File | Status | Tanggung jawab |
|------|--------|----------------|
| `supabase/migrations/20260501000001_add_amount_to_consultations.sql` | Baru | Tambah kolom `amount` ke tabel `consultations` |
| `supabase/functions/confirm-payment/invoice.ts` | Baru | Helper `generateInvoicePDF()` — pure function, testable |
| `supabase/functions/confirm-payment/invoice_test.ts` | Baru | Deno tests untuk `generateInvoicePDF` |
| `supabase/functions/confirm-payment/index.ts` | Modifikasi | Import invoice.ts, perluas query, attach PDF ke email |

---

## Task 1: Database Migration — Tambah Kolom `amount`

**Files:**
- Create: `supabase/migrations/20260501000001_add_amount_to_consultations.sql`

- [ ] **Step 1: Buat file migration**

Buat `supabase/migrations/20260501000001_add_amount_to_consultations.sql`:

```sql
ALTER TABLE consultations
  ADD COLUMN IF NOT EXISTS amount numeric DEFAULT 500000;
```

- [ ] **Step 2: Apply migration ke database**

```bash
supabase db push
```

Expected output berisi: `Applying migration 20260501000001_add_amount_to_consultations`

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260501000001_add_amount_to_consultations.sql
git commit -m "feat: add amount column to consultations with default 500000"
```

---

## Task 2: Buat `invoice.ts` — Helper PDF Generator

**Files:**
- Create: `supabase/functions/confirm-payment/invoice.ts`
- Create: `supabase/functions/confirm-payment/invoice_test.ts`

- [ ] **Step 1: Tulis failing test**

Buat `supabase/functions/confirm-payment/invoice_test.ts`:

```ts
import { assert, assertEquals, assertInstanceOf } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { generateInvoicePDF } from './invoice.ts'

const baseParams = {
  orderId: 'TEST-001',
  clientName: 'Budi Santoso',
  clientEmail: 'budi@example.com',
  clientPhone: '6281234567890',
  projectDetails: 'Renovasi rumah 2 lantai di Bekasi',
  amount: 500000,
}

Deno.test('generateInvoicePDF returns Uint8Array', async () => {
  const bytes = await generateInvoicePDF(baseParams)
  assertInstanceOf(bytes, Uint8Array)
  assert(bytes.length > 0)
})

Deno.test('generateInvoicePDF output starts with PDF magic bytes', async () => {
  const bytes = await generateInvoicePDF(baseParams)
  // PDF magic bytes: %PDF = [0x25, 0x50, 0x44, 0x46]
  assertEquals(bytes[0], 0x25)
  assertEquals(bytes[1], 0x50)
  assertEquals(bytes[2], 0x44)
  assertEquals(bytes[3], 0x46)
})

Deno.test('generateInvoicePDF works without logoUrl', async () => {
  const bytes = await generateInvoicePDF({ ...baseParams, logoUrl: undefined })
  assertInstanceOf(bytes, Uint8Array)
  assert(bytes.length > 0)
})
```

- [ ] **Step 2: Run test — pastikan FAIL**

```bash
deno test --allow-net supabase/functions/confirm-payment/invoice_test.ts
```

Expected: error `Cannot resolve module './invoice.ts'`

- [ ] **Step 3: Buat `invoice.ts`**

Buat `supabase/functions/confirm-payment/invoice.ts`:

```ts
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1'

export interface InvoiceParams {
  orderId: string
  clientName: string
  clientEmail: string
  clientPhone: string
  projectDetails: string
  amount: number
  logoUrl?: string
}

export async function generateInvoicePDF(params: InvoiceParams): Promise<Uint8Array> {
  const { orderId, clientName, clientEmail, clientPhone, projectDetails, amount, logoUrl } = params

  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842]) // A4 portrait

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const { width, height } = page.getSize()

  const black = rgb(0, 0, 0)
  const grayColor = rgb(0.5, 0.5, 0.5)
  const darkBlue = rgb(0.1, 0.2, 0.5)
  const white = rgb(1, 1, 1)
  const lightGray = rgb(0.93, 0.93, 0.93)
  const green = rgb(0.18, 0.65, 0.29)

  // ── Logo ─────────────────────────────────────────────────────────────
  let companyX = 50
  if (logoUrl) {
    try {
      const logoRes = await fetch(logoUrl)
      if (logoRes.ok) {
        const logoBytes = new Uint8Array(await logoRes.arrayBuffer())
        const logoImage = await pdfDoc.embedPng(logoBytes)
        const logoDims = logoImage.scaleToFit(70, 50)
        page.drawImage(logoImage, {
          x: 50,
          y: height - 45 - logoDims.height,
          width: logoDims.width,
          height: logoDims.height,
        })
        companyX = 50 + logoDims.width + 14
      }
    } catch {
      // Logo gagal di-fetch — lanjut tanpa logo
    }
  }

  // ── Nama & kontak perusahaan ──────────────────────────────────────────
  page.drawText('SAPA', {
    x: companyX,
    y: height - 40,
    size: 18,
    font: fontBold,
    color: darkBlue,
  })
  const contactLines = [
    'Jl. Condet Raya No. 27, Jakarta Timur, DKI 13760',
    'WA: 62881010512829  |  contact@stratalift.co.id',
  ]
  contactLines.forEach((line, i) => {
    page.drawText(line, {
      x: companyX,
      y: height - 56 - i * 13,
      size: 8.5,
      font: fontRegular,
      color: grayColor,
    })
  })

  // ── Nomor & tanggal invoice (kanan atas) ─────────────────────────────
  const today = new Date()
  const dd = today.getDate().toString().padStart(2, '0')
  const mm = (today.getMonth() + 1).toString().padStart(2, '0')
  const yyyy = today.getFullYear()

  page.drawText(`No: INV-${orderId}`, {
    x: width - 210,
    y: height - 40,
    size: 10,
    font: fontBold,
    color: black,
  })
  page.drawText(`Tanggal: ${dd}/${mm}/${yyyy}`, {
    x: width - 210,
    y: height - 55,
    size: 9,
    font: fontRegular,
    color: grayColor,
  })

  // ── Garis biru pemisah header ────────────────────────────────────────
  page.drawLine({
    start: { x: 50, y: height - 100 },
    end: { x: width - 50, y: height - 100 },
    thickness: 1.5,
    color: darkBlue,
  })

  // ── Judul INVOICE ────────────────────────────────────────────────────
  page.drawText('INVOICE', {
    x: 50,
    y: height - 132,
    size: 24,
    font: fontBold,
    color: darkBlue,
  })

  // ── Data klien ───────────────────────────────────────────────────────
  page.drawText('Kepada:', {
    x: 50,
    y: height - 172,
    size: 10,
    font: fontBold,
    color: black,
  })
  const clientRows: [string, string][] = [
    ['Nama  ', clientName],
    ['Email ', clientEmail],
    ['Telp  ', clientPhone],
  ]
  clientRows.forEach(([label, value], i) => {
    page.drawText(`${label}: ${value}`, {
      x: 50,
      y: height - 190 - i * 16,
      size: 10,
      font: fontRegular,
      color: black,
    })
  })

  // ── Header tabel ─────────────────────────────────────────────────────
  const tableTop = height - 272
  page.drawRectangle({
    x: 50,
    y: tableTop - 6,
    width: width - 100,
    height: 22,
    color: darkBlue,
  })
  page.drawText('Deskripsi', {
    x: 62,
    y: tableTop,
    size: 10,
    font: fontBold,
    color: white,
  })
  page.drawText('Jumlah', {
    x: width - 140,
    y: tableTop,
    size: 10,
    font: fontBold,
    color: white,
  })

  // ── Baris item ───────────────────────────────────────────────────────
  const rowY = tableTop - 32
  page.drawRectangle({
    x: 50,
    y: rowY - 8,
    width: width - 100,
    height: 22,
    color: lightGray,
  })
  page.drawText('Layanan Konsultasi Struktural', {
    x: 62,
    y: rowY,
    size: 10,
    font: fontRegular,
    color: black,
  })

  const formattedAmount = formatRupiah(amount)
  page.drawText(formattedAmount, {
    x: width - 140,
    y: rowY,
    size: 10,
    font: fontRegular,
    color: black,
  })

  // ── Garis bawah tabel ────────────────────────────────────────────────
  page.drawLine({
    start: { x: 50, y: rowY - 18 },
    end: { x: width - 50, y: rowY - 18 },
    thickness: 0.5,
    color: grayColor,
  })

  // ── Baris total ──────────────────────────────────────────────────────
  const totalY = rowY - 48
  page.drawRectangle({
    x: width - 210,
    y: totalY - 8,
    width: 160,
    height: 24,
    color: darkBlue,
  })
  page.drawText('TOTAL', {
    x: width - 198,
    y: totalY,
    size: 11,
    font: fontBold,
    color: white,
  })
  page.drawText(formattedAmount, {
    x: width - 140,
    y: totalY,
    size: 11,
    font: fontBold,
    color: white,
  })

  // ── Catatan proyek ───────────────────────────────────────────────────
  const notesY = totalY - 58
  page.drawText('Catatan Proyek:', {
    x: 50,
    y: notesY,
    size: 10,
    font: fontBold,
    color: black,
  })

  // Sanitize teks agar hanya ASCII (StandardFonts tidak support Unicode)
  const safeDetails = sanitizeText(projectDetails || '-')
  page.drawText(safeDetails, {
    x: 50,
    y: notesY - 18,
    size: 9,
    font: fontRegular,
    color: grayColor,
    maxWidth: width - 100,
    lineHeight: 14,
  })

  // ── Status LUNAS ─────────────────────────────────────────────────────
  const statusY = notesY - 68
  page.drawRectangle({
    x: 50,
    y: statusY - 6,
    width: 100,
    height: 24,
    color: green,
  })
  page.drawText('LUNAS', {
    x: 68,
    y: statusY,
    size: 12,
    font: fontBold,
    color: white,
  })

  // ── Footer ───────────────────────────────────────────────────────────
  page.drawLine({
    start: { x: 50, y: 55 },
    end: { x: width - 50, y: 55 },
    thickness: 0.5,
    color: lightGray,
  })
  page.drawText('2026 SAPA', {
    x: width - 100,
    y: 40,
    size: 8,
    font: fontRegular,
    color: grayColor,
  })

  return pdfDoc.save()
}

function formatRupiah(amount: number): string {
  // Implementasi manual agar aman di semua environment Deno
  const str = Math.floor(amount).toString()
  let result = ''
  for (let i = 0; i < str.length; i++) {
    if (i > 0 && (str.length - i) % 3 === 0) result += '.'
    result += str[i]
  }
  return `Rp ${result}`
}

function sanitizeText(text: string): string {
  // Hilangkan karakter non-ASCII agar tidak crash di StandardFonts
  return text.replace(/[^\x20-\x7E]/g, '?')
}
```

- [ ] **Step 4: Run test — pastikan PASS**

```bash
deno test --allow-net supabase/functions/confirm-payment/invoice_test.ts
```

Expected:
```
running 3 tests from ./supabase/functions/confirm-payment/invoice_test.ts
generateInvoicePDF returns Uint8Array ... ok
generateInvoicePDF output starts with PDF magic bytes ... ok
generateInvoicePDF works without logoUrl ... ok

ok | 3 passed | 0 failed
```

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/confirm-payment/invoice.ts supabase/functions/confirm-payment/invoice_test.ts
git commit -m "feat: add generateInvoicePDF helper with pdf-lib"
```

---

## Task 3: Update `confirm-payment/index.ts` — Attach PDF ke Email

**Files:**
- Modify: `supabase/functions/confirm-payment/index.ts`

- [ ] **Step 1: Tambah import di baris ke-2 `index.ts`**

Setelah baris `import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'`, tambahkan:

```ts
import { generateInvoicePDF } from './invoice.ts'
```

- [ ] **Step 2: Perluas query untuk ambil `amount`**

Cari baris (sekitar baris 53):
```ts
.select('order_id, project_details, clients(full_name, email, phone_number)')
```

Ganti dengan:
```ts
.select('order_id, project_details, amount, clients(full_name, email, phone_number)')
```

- [ ] **Step 3: Ganti seluruh blok `if (clientEmail)` (baris 74–113)**

Hapus blok `if (clientEmail) { ... }` yang lama dan ganti dengan:

```ts
if (clientEmail) {
  try {
    const subject = action === 'confirm'
      ? `Invoice & Konfirmasi Pembayaran — Order ${consultation.order_id}`
      : `Pembayaran Ditolak — Order ${consultation.order_id}`

    let attachments: Array<{ filename: string; content: string }> = []

    if (action === 'confirm') {
      try {
        const pdfBytes = await generateInvoicePDF({
          orderId: consultation.order_id,
          clientName,
          clientEmail,
          clientPhone: clientPhone || '-',
          projectDetails: consultation.project_details || '-',
          amount: consultation.amount ?? 500000,
          logoUrl: Deno.env.get('LOGO_URL'),
        })
        let binary = ''
        pdfBytes.forEach((b) => (binary += String.fromCharCode(b)))
        attachments = [{
          filename: `invoice-${consultation.order_id}.pdf`,
          content: btoa(binary),
        }]
      } catch (pdfErr) {
        console.error('PDF generation gagal, kirim email tanpa attachment:', (pdfErr as Error).message)
      }
    }

    const html = action === 'confirm'
      ? `
        <h2>Pembayaran Dikonfirmasi</h2>
        <p>Halo <strong>${clientName}</strong>,</p>
        <p>Pembayaran Anda untuk order <strong>${consultation.order_id}</strong> telah dikonfirmasi.</p>
        <p>Invoice resmi terlampir pada email ini sebagai bukti pembayaran.</p>
        <p>Konsultan kami akan segera menghubungi Anda melalui WhatsApp untuk langkah selanjutnya.</p>
        <p>Terima kasih telah menggunakan layanan SAPA.</p>
      `
      : `
        <h2>Pembayaran Ditolak</h2>
        <p>Halo <strong>${clientName}</strong>,</p>
        <p>Maaf, pembayaran Anda untuk order <strong>${consultation.order_id}</strong> tidak dapat dikonfirmasi.</p>
        <p>Kemungkinan penyebab: bukti transfer tidak terbaca, nominal tidak sesuai, atau rekening tujuan berbeda.</p>
        <p>Silakan upload ulang bukti transfer atau hubungi admin kami via WhatsApp untuk bantuan lebih lanjut.</p>
      `

    const emailPayload: Record<string, unknown> = {
      from: Deno.env.get('FROM_EMAIL'),
      to: clientEmail,
      subject,
      html,
    }
    if (attachments.length > 0) {
      emailPayload.attachments = attachments
    }

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    })
    console.log('Email sent, status:', emailRes.status)
  } catch (emailErr) {
    console.error('Email gagal:', (emailErr as Error).message)
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/confirm-payment/index.ts
git commit -m "feat: attach PDF invoice to confirmation email in confirm-payment"
```

---

## Task 4: Upload Logo & Set Secret `LOGO_URL`

**Files:** Tidak ada file kode — konfigurasi Supabase Storage + secrets

- [ ] **Step 1: Upload logo ke Supabase Storage**

1. Buka Supabase Dashboard → **Storage**
2. Buat bucket bernama `assets` dengan visibility **Public** (jika belum ada)
3. Upload file logo PNG SAPA ke bucket tersebut
4. Klik logo yang sudah diupload → salin **Public URL**

Format URL: `https://<project-ref>.supabase.co/storage/v1/object/public/assets/<nama-file>.png`

- [ ] **Step 2: Set secret `LOGO_URL`**

```bash
supabase secrets set LOGO_URL=https://<project-ref>.supabase.co/storage/v1/object/public/assets/<nama-file>.png
```

- [ ] **Step 3: Verifikasi semua secrets ada**

```bash
supabase secrets list
```

Expected — semua secrets berikut terdaftar:
```
LOGO_URL
RESEND_API_KEY
FROM_EMAIL
FONNTE_TOKEN
ADMIN_WA_NUMBER
FRONTEND_URL
```

---

## Task 5: Deploy & End-to-End Test

- [ ] **Step 1: Deploy edge function**

```bash
supabase functions deploy confirm-payment
```

Expected output berisi: `Deployed Functions confirm-payment`

- [ ] **Step 2: Pastikan ada test order di database**

Buka Supabase Dashboard → Table Editor → `consultations`.
Pastikan ada 1 baris dengan:
- `payment_status = 'paid'`
- Relasi ke `clients` yang memiliki `email` yang bisa Anda akses inbox-nya

- [ ] **Step 3: Trigger confirm dari admin dashboard**

Buka halaman admin → klik tombol **Confirm** pada order tersebut.

- [ ] **Step 4: Verifikasi hasil**

| Yang dicek | Expected |
|---|---|
| Email masuk di inbox klien | Subject: `Invoice & Konfirmasi Pembayaran — Order ...` |
| Attachment di email | File `invoice-<order_id>.pdf` terlampir |
| Isi PDF: header | Logo SAPA + nama + alamat + kontak |
| Isi PDF: data klien | Nama, email, nomor telp benar |
| Isi PDF: tabel | `Layanan Konsultasi Struktural — Rp 500.000` |
| Isi PDF: total | `Rp 500.000` dengan background biru |
| Isi PDF: status | Kotak hijau bertuliskan `LUNAS` |
| WA masuk ke klien | Pesan konfirmasi terkirim via Fonnte |
| Logs Supabase | Tidak ada error di function logs `confirm-payment` |

- [ ] **Step 5: Test skenario gagal logo (opsional)**

Hapus sementara secret `LOGO_URL` atau set ke URL yang tidak valid:

```bash
supabase secrets set LOGO_URL=https://invalid-url.example.com/logo.png
supabase functions deploy confirm-payment
```

Trigger confirm lagi → email tetap terkirim dengan PDF tanpa logo (tidak crash).
Kemudian restore URL logo yang benar.
