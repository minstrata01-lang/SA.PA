# Bug Fixes + Voucher Payment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix dua bug kritis pada edge functions (502 email invoice + duplikat email client) dan tambahkan fitur voucher pembayaran end-to-end (validasi server-side, UI review page, admin kelola + statistik).

**Architecture:** Dua migration SQL menyiapkan schema, satu edge function baru (`validate-voucher`) menangani apply/remove voucher, edge functions yang ada (`confirm-payment`, `notify-admin`, `create-consultation`) diperbaiki, kemudian frontend dan admin dashboard diupdate untuk menampilkan data voucher.

**Tech Stack:** Supabase Edge Functions (Deno/TypeScript), Supabase JS SDK v2, React 19, Framer Motion, react-router-dom v7, pdf-lib, Resend API, Fonnte WA API

---

## File Map

**Dibuat baru:**
- `supabase/migrations/20260523000001_clients_email_unique.sql`
- `supabase/migrations/20260523000002_vouchers.sql`
- `supabase/functions/validate-voucher/index.ts`
- `frontend/src/pages/admin/AdminVouchers.jsx`

**Dimodifikasi:**
- `supabase/functions/create-consultation/index.ts` — upsert on email conflict
- `supabase/functions/confirm-payment/index.ts` — non-blocking email/WA, null-check clients, query voucher fields
- `supabase/functions/confirm-payment/invoice.ts` — tambah baris diskon di PDF, update `InvoiceParams`
- `supabase/functions/confirm-payment/invoice_test.ts` — test parameter baru
- `supabase/functions/notify-admin/index.ts` — null-check clients, voucher info, update payment_status for free voucher
- `frontend/src/pages/ReviewConfirmationPage.jsx` — voucher section + 100% flow
- `frontend/src/pages/PaymentUploadPage.jsx` — tampilkan harga setelah diskon
- `frontend/src/pages/admin/AdminConsultations.jsx` — stats card voucher + kolom voucher
- `frontend/src/components/admin/AdminSidebar.jsx` — tambah nav item Voucher
- `frontend/src/App.jsx` — tambah route admin/vouchers

---

## Task 1: Migration — UNIQUE constraint pada `clients.email`

**Files:**
- Create: `supabase/migrations/20260523000001_clients_email_unique.sql`

- [ ] **Step 1: Buat file migration**

```sql
-- supabase/migrations/20260523000001_clients_email_unique.sql
-- Tambah UNIQUE constraint pada clients.email
-- untuk mencegah duplikat yang menyebabkan .maybeSingle() error

ALTER TABLE clients
  ADD CONSTRAINT clients_email_unique UNIQUE (email);
```

- [ ] **Step 2: Terapkan migration**

Jalankan salah satu:
```bash
# Jika pakai Supabase CLI (lokal):
supabase db push

# Jika pakai Supabase Dashboard:
# Buka SQL Editor → paste isi file → Run
```

Expected: `ALTER TABLE` sukses tanpa error. Jika ada data duplikat existing, resolve dulu via:
```sql
-- Cek duplikat:
SELECT email, COUNT(*) FROM clients GROUP BY email HAVING COUNT(*) > 1;
-- Hapus duplikat (pertahankan yang paling baru):
DELETE FROM clients WHERE id NOT IN (
  SELECT DISTINCT ON (email) id FROM clients ORDER BY email, created_at DESC
);
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260523000001_clients_email_unique.sql
git commit -m "db: add UNIQUE constraint on clients.email"
```

---

## Task 2: Migration — Tabel `vouchers` dan kolom baru di `consultations`

**Files:**
- Create: `supabase/migrations/20260523000002_vouchers.sql`

- [ ] **Step 1: Buat file migration**

```sql
-- supabase/migrations/20260523000002_vouchers.sql

-- ── Tabel vouchers ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vouchers (
  id                uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  code              text    NOT NULL,
  description       text,
  discount_percent  integer NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
  max_uses          integer NOT NULL DEFAULT 1,
  used_count        integer NOT NULL DEFAULT 0,
  expires_at        timestamptz,
  is_active         boolean NOT NULL DEFAULT true,
  created_at        timestamptz DEFAULT now()
);

-- Case-insensitive unique index agar kode 'PROMO50' = 'promo50'
CREATE UNIQUE INDEX IF NOT EXISTS vouchers_code_ci_unique
  ON vouchers (lower(code));

-- ── RLS ──────────────────────────────────────────────────────────────────
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;

-- Public tidak bisa SELECT (hanya via edge function service role)
CREATE POLICY "Admin full access vouchers"
  ON vouchers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── Kolom baru di consultations ──────────────────────────────────────────
ALTER TABLE consultations
  ADD COLUMN IF NOT EXISTS voucher_code     text,
  ADD COLUMN IF NOT EXISTS discount_percent integer,
  ADD COLUMN IF NOT EXISTS discount_amount  numeric;
```

- [ ] **Step 2: Terapkan migration**

```bash
supabase db push
# atau via Dashboard SQL Editor
```

Expected: tabel `vouchers` muncul di Supabase Table Editor, kolom `voucher_code`, `discount_percent`, `discount_amount` ada di tabel `consultations`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260523000002_vouchers.sql
git commit -m "db: add vouchers table and voucher columns to consultations"
```

---

## Task 3: Bug Fix — `create-consultation` pakai upsert

**Files:**
- Modify: `supabase/functions/create-consultation/index.ts`

- [ ] **Step 1: Ganti blok lookup + insert client dengan upsert**

Di `supabase/functions/create-consultation/index.ts`, temukan blok ini (baris ~38–56):

```ts
// 1. Check or create client
const { data: existingClient, error: fetchClientError } = await supabase
  .from('clients')
  .select('id')
  .eq('email', email)
  .maybeSingle()

if (fetchClientError) throw fetchClientError

let clientId = existingClient?.id
if (!clientId) {
  const { data: newClient, error: insertClientError } = await supabase
    .from('clients')
    .insert([{ full_name: fullName, email, phone_number: phone }])
    .select('id')
    .single()
  if (insertClientError) throw insertClientError
  clientId = newClient.id
}
```

Ganti dengan:

```ts
// 1. Upsert client by email (UNIQUE constraint di-enforce di DB)
// ignoreDuplicates: false → jika email sama, update full_name & phone
const { data: clientRow, error: upsertClientError } = await supabase
  .from('clients')
  .upsert(
    { full_name: fullName, email, phone_number: phone },
    { onConflict: 'email', ignoreDuplicates: false }
  )
  .select('id')
  .single()

if (upsertClientError) throw upsertClientError
const clientId = clientRow.id
```

- [ ] **Step 2: Verifikasi manual**

Deploy function lalu test dengan curl (ganti URL dan KEY):
```bash
curl -X POST https://<PROJECT>.supabase.co/functions/v1/create-consultation \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Budi Santoso","email":"budi@test.com","phone":"081234567890","selectedCategories":["low_rise"],"location":"Jakarta"}'
```

Expected: `{"order_id":"SAPA/DD/MM/YYYY/001"}` (atau order yang sudah ada jika pending).

Submit kedua kali dengan nama berbeda tapi email sama — harus return `order_id` tanpa error.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/create-consultation/index.ts
git commit -m "fix: use upsert on email conflict in create-consultation"
```

---

## Task 4: Bug Fix — `confirm-payment` non-blocking email + null-check clients

**Files:**
- Modify: `supabase/functions/confirm-payment/index.ts`

- [ ] **Step 1: Tambah type declaration untuk EdgeRuntime di atas file**

Di baris paling atas file (sebelum `import`):

```ts
// @ts-ignore: EdgeRuntime tersedia di Supabase Edge runtime
declare const EdgeRuntime: { waitUntil: (p: Promise<unknown>) => void }
```

- [ ] **Step 2: Perbaiki null-check clients**

Temukan baris:
```ts
const client = Array.isArray(consultation.clients)
  ? consultation.clients[0]
  : consultation.clients
```

Ganti dengan:
```ts
const rawClient = consultation.clients
const client = Array.isArray(rawClient)
  ? (rawClient[0] ?? null)
  : (rawClient ?? null)
```

- [ ] **Step 3: Pindahkan blok email+WA ke background task**

**Hapus** semua kode dari baris setelah `if (!updatedRows || updatedRows.length === 0) { ... }` sampai baris `return new Response(JSON.stringify({ success: true })` yang existing (yaitu: blok query consultation + blok email + blok WA + return). **Ganti** seluruhnya dengan kode berikut:

```ts
// ── Background task: kirim email + WA ────────────────────────────────────
const sendNotifications = async () => {
  const { data: consultation, error: selectError } = await supabase
    .from('consultations')
    .select('order_id, project_details, amount, clients(full_name, email, phone_number)')
    .eq('id', consultation_id)
    .single()

  if (selectError || !consultation) {
    console.error('Select error:', selectError?.message)
    return
  }

  const rawClient = consultation.clients
  const client = Array.isArray(rawClient) ? (rawClient[0] ?? null) : (rawClient ?? null)

  const clientName  = client?.full_name    || 'Pelanggan'
  const clientEmail = client?.email        || null
  const clientPhone = client?.phone_number || null

  // Kirim email via Resend
  if (clientEmail) {
    try {
      const subject = action === 'confirm'
        ? `Invoice & Konfirmasi Pembayaran — Order ${consultation.order_id}`
        : `Pembayaran Ditolak — Order ${consultation.order_id}`

      let attachments: Array<{ filename: string; content: string }> = []

      if (action === 'confirm') {
        try {
          const controller = new AbortController()
          const timeoutId  = setTimeout(() => controller.abort(), 8000)
          const logoUrl    = Deno.env.get('LOGO_URL')

          let logoFetched: string | undefined
          if (logoUrl) {
            try {
              const logoRes = await fetch(logoUrl, { signal: controller.signal })
              if (logoRes.ok) logoFetched = logoUrl
            } catch {
              console.warn('Logo fetch timeout/error, skip logo')
            } finally {
              clearTimeout(timeoutId)
            }
          }

          const pdfBytes = await generateInvoicePDF({
            orderId: consultation.order_id,
            clientName,
            clientEmail,
            clientPhone: clientPhone || '-',
            projectDetails: consultation.project_details || '-',
            amount: consultation.amount || 500000,
            logoUrl: logoFetched,
          })
          let binary = ''
          pdfBytes.forEach((b) => (binary += String.fromCharCode(b)))
          attachments = [{
            filename: `invoice-${consultation.order_id}.pdf`,
            content: btoa(binary),
          }]
        } catch (pdfErr) {
          console.error('PDF gagal:', (pdfErr as Error).message)
        }
      }

      const invoiceNote = attachments.length > 0
        ? '<p>Invoice resmi terlampir pada email ini sebagai bukti pembayaran.</p>'
        : ''

      const html = action === 'confirm'
        ? `<h2>Pembayaran Dikonfirmasi</h2>
           <p>Halo <strong>${clientName}</strong>,</p>
           <p>Pembayaran Anda untuk order <strong>${consultation.order_id}</strong> telah dikonfirmasi.</p>
           ${invoiceNote}
           <p>Konsultan kami akan segera menghubungi Anda melalui WhatsApp.</p>
           <p>Terima kasih telah menggunakan layanan SAPA.</p>`
        : `<h2>Pembayaran Ditolak</h2>
           <p>Halo <strong>${clientName}</strong>,</p>
           <p>Maaf, pembayaran Anda untuk order <strong>${consultation.order_id}</strong> tidak dapat dikonfirmasi.</p>
           <p>Silakan upload ulang bukti transfer atau hubungi admin kami via WhatsApp.</p>`

      const emailPayload: Record<string, unknown> = {
        from: Deno.env.get('FROM_EMAIL'),
        to: clientEmail,
        subject,
        html,
      }
      if (attachments.length > 0) emailPayload.attachments = attachments

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

  // Kirim WA via Fonnte ke user
  if (clientPhone) {
    try {
      const formattedPhone = clientPhone.startsWith('0')
        ? '62' + clientPhone.slice(1)
        : clientPhone

      const pesanUser = action === 'confirm'
        ? `✅ *Pembayaran Dikonfirmasi*\n\nHalo ${clientName}, pembayaran Anda untuk order ${consultation.order_id} telah dikonfirmasi. Konsultan kami akan segera menghubungi Anda. Terima kasih!`
        : `❌ *Pembayaran Ditolak*\n\nHalo ${clientName}, maaf pembayaran Anda untuk order ${consultation.order_id} tidak dapat dikonfirmasi. Silakan upload ulang bukti transfer atau hubungi admin.`

      const waRes = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: { Authorization: Deno.env.get('FONNTE_TOKEN')! },
        body: new URLSearchParams({ target: formattedPhone, message: pesanUser }),
      })
      console.log('WA user sent, status:', waRes.status)
    } catch (waErr) {
      console.error('WA gagal:', (waErr as Error).message)
    }
  }
}

// Return response segera, kirim notifikasi di background
EdgeRuntime.waitUntil(sendNotifications())

return new Response(JSON.stringify({ success: true }), {
  status: 200,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
})
```

- [ ] **Step 4: Verifikasi manual**

Deploy lalu trigger dari admin dashboard (confirm satu pembayaran). Pastikan:
- Response dari admin UI kembali cepat (< 1 detik) tanpa timeout
- Email dan WA tetap terkirim (cek inbox + WA)
- Tidak ada error 502

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/confirm-payment/index.ts
git commit -m "fix: make email+WA non-blocking in confirm-payment, fix 502 timeout"
```

---

## Task 5: Bug Fix — `notify-admin` null-check clients

**Files:**
- Modify: `supabase/functions/notify-admin/index.ts`

- [ ] **Step 1: Perbaiki null-check clients**

Temukan:
```ts
const client = consultation
  ? (Array.isArray(consultation.clients) ? consultation.clients[0] : consultation.clients)
  : null
```

Ganti dengan:
```ts
const rawClient = consultation?.clients ?? null
const client = Array.isArray(rawClient) ? (rawClient[0] ?? null) : rawClient
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/notify-admin/index.ts
git commit -m "fix: defensive null-check for clients join in notify-admin"
```

---

## Task 6: Edge Function Baru — `validate-voucher`

**Files:**
- Create: `supabase/functions/validate-voucher/index.ts`

- [ ] **Step 1: Buat file edge function**

```ts
// supabase/functions/validate-voucher/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { order_id, code } = body as { order_id: string; code: string | null }

    if (!order_id || typeof order_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'order_id wajib diisi' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── REMOVE VOUCHER ───────────────────────────────────────────────────
    if (!code || !code.trim()) {
      // Cek apakah ada voucher sebelumnya
      const { data: current } = await supabase
        .from('consultations')
        .select('voucher_code')
        .eq('order_id', order_id)
        .single()

      if (current?.voucher_code) {
        // Decrement used_count dari voucher sebelumnya
        const { data: prevVoucher } = await supabase
          .from('vouchers')
          .select('id, used_count')
          .ilike('code', current.voucher_code)
          .single()

        if (prevVoucher && prevVoucher.used_count > 0) {
          await supabase
            .from('vouchers')
            .update({ used_count: prevVoucher.used_count - 1 })
            .eq('id', prevVoucher.id)
        }
      }

      // Clear voucher di consultation
      await supabase
        .from('consultations')
        .update({ voucher_code: null, discount_percent: null, discount_amount: null })
        .eq('order_id', order_id)

      return new Response(
        JSON.stringify({ removed: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── VALIDATE & APPLY VOUCHER ─────────────────────────────────────────
    const { data: voucher, error: vErr } = await supabase
      .from('vouchers')
      .select('id, code, discount_percent, max_uses, used_count, expires_at, is_active')
      .ilike('code', code.trim())
      .single()

    if (vErr || !voucher) {
      return new Response(
        JSON.stringify({ valid: false, reason: 'Kode voucher tidak ditemukan' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!voucher.is_active) {
      return new Response(
        JSON.stringify({ valid: false, reason: 'Voucher tidak aktif' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (voucher.used_count >= voucher.max_uses) {
      return new Response(
        JSON.stringify({ valid: false, reason: 'Kuota voucher sudah habis' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ valid: false, reason: 'Voucher sudah kadaluarsa' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Ambil amount konsultasi + cek apakah sudah ada voucher sebelumnya
    const { data: consultation } = await supabase
      .from('consultations')
      .select('amount, voucher_code')
      .eq('order_id', order_id)
      .single()

    if (!consultation) {
      return new Response(
        JSON.stringify({ error: 'Konsultasi tidak ditemukan' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const isSameVoucher = consultation.voucher_code?.toLowerCase() === voucher.code.toLowerCase()

    // Jika voucher sebelumnya berbeda, decrement yang lama
    if (consultation.voucher_code && !isSameVoucher) {
      const { data: prevV } = await supabase
        .from('vouchers')
        .select('id, used_count')
        .ilike('code', consultation.voucher_code)
        .single()

      if (prevV && prevV.used_count > 0) {
        await supabase
          .from('vouchers')
          .update({ used_count: prevV.used_count - 1 })
          .eq('id', prevV.id)
      }
    }

    // Increment used_count hanya jika bukan voucher yang sama
    if (!isSameVoucher) {
      await supabase
        .from('vouchers')
        .update({ used_count: voucher.used_count + 1 })
        .eq('id', voucher.id)
    }

    const amount          = consultation.amount ?? 500000
    const discountAmount  = Math.round(amount * voucher.discount_percent / 100)
    const finalAmount     = amount - discountAmount

    // Simpan ke consultation
    await supabase
      .from('consultations')
      .update({
        voucher_code:     voucher.code,
        discount_percent: voucher.discount_percent,
        discount_amount:  discountAmount,
      })
      .eq('order_id', order_id)

    return new Response(
      JSON.stringify({
        valid:            true,
        code:             voucher.code,
        discount_percent: voucher.discount_percent,
        discount_amount:  discountAmount,
        final_amount:     finalAmount,
      }),
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

- [ ] **Step 2: Deploy dan test manual**

```bash
supabase functions deploy validate-voucher
```

Buat dulu satu voucher test via Supabase Dashboard (Table Editor → vouchers):
```
code: TEST50, discount_percent: 50, max_uses: 10, is_active: true
```

Lalu test apply:
```bash
curl -X POST https://<PROJECT>.supabase.co/functions/v1/validate-voucher \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"code":"TEST50","order_id":"<VALID_ORDER_ID>"}'
```

Expected:
```json
{"valid":true,"code":"TEST50","discount_percent":50,"discount_amount":250000,"final_amount":250000}
```

Test remove (code null):
```bash
curl -X POST https://<PROJECT>.supabase.co/functions/v1/validate-voucher \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"code":null,"order_id":"<VALID_ORDER_ID>"}'
```

Expected: `{"removed":true}`

Test kode salah:
```bash
curl ... -d '{"code":"SALAH","order_id":"<VALID_ORDER_ID>"}'
```

Expected: `{"valid":false,"reason":"Kode voucher tidak ditemukan"}`

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/validate-voucher/index.ts
git commit -m "feat: add validate-voucher edge function with apply/remove logic"
```

---

## Task 7: Update `notify-admin` — tambah voucher info + update payment_status untuk 100% voucher

**Files:**
- Modify: `supabase/functions/notify-admin/index.ts`

- [ ] **Step 1: Update query dan logika untuk mendukung `voucher_used`**

Ganti seluruh isi `notify-admin/index.ts` dengan:

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { order_id, voucher_used } = body as { order_id: string; voucher_used?: boolean }

    if (!order_id || typeof order_id !== 'string' || !order_id.trim()) {
      return new Response(
        JSON.stringify({ error: 'order_id wajib diisi' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Jika 100% voucher, update payment_status ke pending_verification
    if (voucher_used) {
      await supabase
        .from('consultations')
        .update({ payment_status: 'pending_verification' })
        .eq('order_id', order_id)
    }

    const { data: consultation } = await supabase
      .from('consultations')
      .select('order_id, amount, voucher_code, discount_percent, discount_amount, clients(full_name, email, phone_number)')
      .eq('order_id', order_id)
      .single()

    const rawClient = consultation?.clients ?? null
    const client = Array.isArray(rawClient) ? (rawClient[0] ?? null) : rawClient

    const clientName  = client?.full_name    || 'Pelanggan'
    const clientPhone = client?.phone_number  || null

    // Susun pesan WA admin
    let voucherLine = ''
    if (voucher_used && consultation?.voucher_code) {
      const disc     = consultation.discount_percent ?? 0
      const discAmt  = consultation.discount_amount ?? 0
      const finalAmt = (consultation.amount ?? 500000) - discAmt
      voucherLine = `\n\n🎟️ *Voucher digunakan*\nKode: ${consultation.voucher_code} — Diskon ${disc}% (Rp ${discAmt.toLocaleString('id-ID')})\nTotal dibayar: Rp ${finalAmt.toLocaleString('id-ID')}`
    }

    const pesanAdmin = `🔔 *${voucher_used ? 'Pesanan Voucher 100%' : 'Pesanan Baru Masuk'}*\n\nNo. Order: *${order_id}*\nNama: ${clientName}\nEmail: ${client?.email || '-'}\nNo. HP: ${clientPhone || '-'}${voucherLine}\n\n${voucher_used ? 'Pesanan ini menggunakan voucher 100%.' : 'Bukti transfer telah diupload.'} Buka dashboard untuk verifikasi:\n${Deno.env.get('FRONTEND_URL')}/admin/consultations`

    const waAdminRes = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { Authorization: Deno.env.get('FONNTE_TOKEN')! },
      body: new URLSearchParams({
        target:  Deno.env.get('ADMIN_WA_NUMBER')!,
        message: pesanAdmin,
      }),
    })
    console.log('WA admin sent, status:', waAdminRes.status)

    // WA ke client
    if (clientPhone) {
      try {
        const formattedPhone = clientPhone.startsWith('0')
          ? '62' + clientPhone.slice(1)
          : clientPhone

        const pesanClient = `✅ *${voucher_used ? 'Voucher Berhasil Digunakan' : 'Bukti Transfer Diterima'}*\n\nHalo *${clientName}*,\n\n${
          voucher_used
            ? `Voucher Anda untuk order *${order_id}* telah berhasil diproses.\n\n⏳ Admin kami akan mengaktifkan sesi konsultasi Anda segera.`
            : `Bukti transfer Anda untuk order *${order_id}* telah berhasil kami terima.\n\n📧 *Silakan cek email Anda* untuk informasi lebih lanjut.\n\n⏳ Admin kami akan memverifikasi pembayaran dalam *maksimal 1x24 jam*.`
        }\n\nTerima kasih telah mempercayai layanan *SAPA*! 🙏`

        await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: { Authorization: Deno.env.get('FONNTE_TOKEN')! },
          body: new URLSearchParams({ target: formattedPhone, message: pesanClient }),
        })
      } catch (waErr) {
        console.error('WA client gagal:', (waErr as Error).message)
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Unhandled error:', (err as Error).message)
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/notify-admin/index.ts
git commit -m "feat: notify-admin supports voucher_used flag and WA voucher info"
```

---

## Task 8: Update `confirm-payment` + `invoice.ts` — diskon di PDF

**Files:**
- Modify: `supabase/functions/confirm-payment/invoice.ts`
- Modify: `supabase/functions/confirm-payment/invoice_test.ts`
- Modify: `supabase/functions/confirm-payment/index.ts`

- [ ] **Step 1: Update `InvoiceParams` interface di `invoice.ts`**

Ganti interface `InvoiceParams`:

```ts
export interface InvoiceParams {
  orderId:        string
  clientName:     string
  clientEmail:    string
  clientPhone:    string
  projectDetails: string
  amount:         number
  logoUrl?:       string
  discountPercent?: number   // ← baru
  discountAmount?:  number   // ← baru
}
```

- [ ] **Step 2: Tambah baris diskon di tabel PDF**

Di `generateInvoicePDF`, di awal fungsi destructure parameter baru:

```ts
const {
  orderId, clientName, clientEmail, clientPhone,
  projectDetails, amount, logoUrl,
  discountPercent, discountAmount,    // ← baru
} = params

const finalAmount = discountAmount != null ? amount - discountAmount : amount
const formattedAmount      = formatRupiah(amount)
const formattedDiscount    = discountAmount != null ? formatRupiah(discountAmount) : null
const formattedFinalAmount = formatRupiah(finalAmount)
```

Kemudian di blok **TABLE → Data row**, ganti:
```ts
// SEBELUM (satu baris):
const tRow: [string, number][] = [
  ['Layanan Konsultasi Struktural', c0 + 8],
  [formattedAmount,                 c1 + 8],
  ['1',                             c2 + 8],
  [formattedAmount,                 c3 + 8],
]
```

Dengan:
```ts
const tRow: [string, number][] = [
  ['Layanan Konsultasi Struktural', c0 + 8],
  [formattedAmount,                 c1 + 8],
  ['1',                             c2 + 8],
  [formattedAmount,                 c3 + 8],
]
tRow.forEach(([text, x]) => {
  page.drawText(text, { x, y: r1Y - 11, size: 8.5, font: fontRegular, color: black })
})

// Baris diskon (jika ada)
if (formattedDiscount != null) {
  const r2Y = r1Y - rH
  page.drawRectangle({ x: mL, y: r2Y - rH + 5, width: mR - mL, height: rH, color: grayLight })
  const discRow: [string, number][] = [
    [`Diskon Voucher (${discountPercent}%)`, c0 + 8],
    [`-${formattedDiscount}`,                c1 + 8],
    ['1',                                    c2 + 8],
    [`-${formattedDiscount}`,                c3 + 8],
  ]
  discRow.forEach(([text, x]) => {
    page.drawText(text, { x, y: r2Y - 11, size: 8.5, font: fontRegular, color: rgb(0.6, 0.1, 0.1) })
  })
}
```

> **Penting:** hapus pemanggilan `tRow.forEach(...)` yang lama (sebelum blok ini) karena sudah dipindah ke dalam blok baru.

Di blok **TOTAL** (kanan), ganti `formattedAmount` di tombol navy menjadi `formattedFinalAmount`:

```ts
page.drawText(formattedFinalAmount, {  // ← dulu formattedAmount
  x: totalBoxX + 12, y: payY - 38,
  size: 15, font: fontBold, color: white,
})
```

- [ ] **Step 3: Update test `invoice_test.ts`**

Tambah dua test case baru di `invoice_test.ts`:

```ts
Deno.test('generateInvoicePDF dengan diskon menampilkan baris diskon', async () => {
  const bytes = await generateInvoicePDF({
    ...baseParams,
    discountPercent: 50,
    discountAmount: 250000,
  })
  assertInstanceOf(bytes, Uint8Array)
  assert(bytes.length > 0)
})

Deno.test('generateInvoicePDF dengan diskon 100% tidak error', async () => {
  const bytes = await generateInvoicePDF({
    ...baseParams,
    discountPercent: 100,
    discountAmount: 500000,
  })
  assertInstanceOf(bytes, Uint8Array)
  assert(bytes.length > 0)
})
```

- [ ] **Step 4: Jalankan test Deno**

```bash
cd supabase/functions/confirm-payment
deno test invoice_test.ts --allow-net
```

Expected: semua 5 test PASS

- [ ] **Step 5: Update query di `confirm-payment/index.ts`**

Di dalam fungsi `sendNotifications()` (Task 4), ubah query select consultation menjadi:

```ts
const { data: consultation, error: selectError } = await supabase
  .from('consultations')
  .select('order_id, project_details, amount, voucher_code, discount_percent, discount_amount, clients(full_name, email, phone_number)')
  .eq('id', consultation_id)
  .single()
```

Dan update pemanggilan `generateInvoicePDF` menjadi:

```ts
const pdfBytes = await generateInvoicePDF({
  orderId:         consultation.order_id,
  clientName,
  clientEmail,
  clientPhone:     clientPhone || '-',
  projectDetails:  consultation.project_details || '-',
  amount:          consultation.amount || 500000,
  logoUrl:         logoFetched,
  discountPercent: consultation.discount_percent ?? undefined,
  discountAmount:  consultation.discount_amount  ?? undefined,
})
```

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/confirm-payment/invoice.ts \
        supabase/functions/confirm-payment/invoice_test.ts \
        supabase/functions/confirm-payment/index.ts
git commit -m "feat: show discount row in invoice PDF, pass voucher fields to generateInvoicePDF"
```

---

## Task 9: Frontend — `ReviewConfirmationPage` voucher section + 100% flow

**Files:**
- Modify: `frontend/src/pages/ReviewConfirmationPage.jsx`

- [ ] **Step 1: Tambah state voucher di atas fungsi**

Setelah `const [isConfirmed, setIsConfirmed] = useState(false);` tambahkan:

```jsx
const [voucherCode,         setVoucherCode]         = useState('')
const [voucherResult,       setVoucherResult]       = useState(null)
const [voucherError,        setVoucherError]        = useState('')
const [isValidatingVoucher, setIsValidatingVoucher] = useState(false)
```

- [ ] **Step 2: Tambah fungsi apply dan remove voucher**

Setelah `handleEditData`, tambahkan:

```jsx
const handleApplyVoucher = async () => {
  if (!voucherCode.trim()) return
  setIsValidatingVoucher(true)
  setVoucherError('')
  try {
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-voucher`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ code: voucherCode.trim(), order_id: reviewData.orderId }),
      }
    )
    const data = await res.json()
    if (data.valid) {
      setVoucherResult(data)
      setVoucherError('')
    } else {
      setVoucherError(data.reason || 'Kode voucher tidak valid')
      setVoucherResult(null)
    }
  } catch {
    setVoucherError('Gagal memvalidasi voucher. Coba lagi.')
  } finally {
    setIsValidatingVoucher(false)
  }
}

const handleRemoveVoucher = async () => {
  fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-voucher`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ code: null, order_id: reviewData.orderId }),
    }
  ).catch(() => {})
  setVoucherResult(null)
  setVoucherCode('')
  setVoucherError('')
}
```

- [ ] **Step 3: Ganti `handleProceedToUpload` dengan logika voucher**

Ganti fungsi `handleProceedToUpload`:

```jsx
const handleProceedToPayment = async () => {
  const isFree = voucherResult?.final_amount === 0

  if (isFree) {
    // 100% voucher: skip upload, langsung notify admin
    try {
      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-admin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ order_id: reviewData.orderId, voucher_used: true }),
        }
      )
    } catch {}
    navigate('/payment/pending', { state: { orderId: reviewData.orderId, reviewData } })
    return
  }

  const updatedReviewData = voucherResult
    ? {
        ...reviewData,
        voucher_code:     voucherResult.code,
        discount_percent: voucherResult.discount_percent,
        discount_amount:  voucherResult.discount_amount,
        final_amount:     voucherResult.final_amount,
      }
    : reviewData

  navigate('/payment/upload', {
    state: { reviewData: updatedReviewData, orderId: reviewData.orderId },
  })
}
```

- [ ] **Step 4: Tambah section voucher di JSX**

Di antara blok review items (`</motion.div>` setelah `.map(...)`) dan blok checkbox konfirmasi, sisipkan:

```jsx
{/* Voucher Section */}
<motion.div
  className="mt-8"
  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
  transition={{ duration: 0.5, ease: EASE, delay: 0.15 }}
>
  <p className="text-xs font-bold tracking-[0.12em] uppercase mb-3"
     style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
    Kode Voucher <span style={{ color: orange }}>(Opsional)</span>
  </p>

  {!voucherResult ? (
    <div className="flex gap-2">
      <input
        type="text"
        value={voucherCode}
        onChange={(e) => { setVoucherCode(e.target.value.toUpperCase()); setVoucherError('') }}
        onKeyDown={(e) => e.key === 'Enter' && handleApplyVoucher()}
        placeholder="Masukkan kode voucher"
        style={{
          flex: 1, height: 44, padding: '0 14px',
          border: `1px solid ${voucherError ? '#ef4444' : rule}`,
          outline: 'none', fontSize: 13, color: blue,
          fontFamily: "'Manrope', sans-serif", background: 'white',
        }}
      />
      <button
        type="button"
        onClick={handleApplyVoucher}
        disabled={!voucherCode.trim() || isValidatingVoucher}
        style={{
          height: 44, padding: '0 20px',
          background: !voucherCode.trim() || isValidatingVoucher ? 'rgba(217,119,6,0.4)' : orange,
          color: 'white', border: 'none', fontSize: 13,
          fontFamily: "'Manrope', sans-serif",
          cursor: !voucherCode.trim() || isValidatingVoucher ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s',
        }}
      >
        {isValidatingVoucher ? '...' : 'Pakai'}
      </button>
    </div>
  ) : (
    <div className="flex items-start justify-between p-4"
         style={{ background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.2)' }}>
      <div>
        <p className="text-sm font-bold" style={{ color: '#065f46', fontFamily: "'Manrope', sans-serif" }}>
          ✓ Voucher {voucherResult.code}
        </p>
        <p className="text-xs mt-1" style={{ color: '#065f46', fontFamily: "'Manrope', sans-serif" }}>
          Diskon {voucherResult.discount_percent}% = -Rp {voucherResult.discount_amount.toLocaleString('id-ID')}
        </p>
        <p className="text-xs font-bold mt-1" style={{ color: blue, fontFamily: "'Manrope', sans-serif" }}>
          Total yang dibayar: Rp {voucherResult.final_amount.toLocaleString('id-ID')}
        </p>
      </div>
      <button
        type="button"
        onClick={handleRemoveVoucher}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: muted, fontSize: 18, padding: '2px 6px' }}
        title="Hapus voucher"
      >
        ✕
      </button>
    </div>
  )}

  {voucherError && (
    <p className="mt-2 text-xs font-medium" style={{ color: '#ef4444', fontFamily: "'Manrope', sans-serif" }}>
      ⚠ {voucherError}
    </p>
  )}
</motion.div>
```

- [ ] **Step 5: Update tombol "Lanjut ke Pembayaran"**

Ganti `onClick={handleProceedToUpload}` dengan `onClick={handleProceedToPayment}`.

Ganti label tombol menjadi dinamis:

```jsx
{voucherResult?.final_amount === 0
  ? 'Konfirmasi Tanpa Pembayaran →'
  : 'Lanjut ke Pembayaran →'}
```

- [ ] **Step 6: Jalankan dev server dan verifikasi**

```bash
cd frontend && npm run dev
```

Buka `/preassessment/review-confirmation` (dengan state yang valid). Verifikasi:
- Input voucher muncul di antara data review dan checkbox
- Kode valid menampilkan card hijau dengan nominal diskon
- Tombol ✕ menghapus voucher
- Voucher tidak valid menampilkan error merah
- Jika `final_amount = 0` → tombol bertuliskan "Konfirmasi Tanpa Pembayaran →" dan navigate ke `/payment/pending`
- Jika ada diskon partial → navigate ke `/payment/upload` dengan `reviewData` berisi `discount_amount`

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/ReviewConfirmationPage.jsx
git commit -m "feat: add voucher input section and free-payment flow to ReviewConfirmationPage"
```

---

## Task 10: Frontend — `PaymentUploadPage` tampilkan harga setelah diskon

**Files:**
- Modify: `frontend/src/pages/PaymentUploadPage.jsx`

- [ ] **Step 1: Ambil discount_amount dari reviewData**

Di bagian atas komponen (setelah `const { reviewData, orderId } = location.state || {};`), tambahkan:

```jsx
const discountAmount = reviewData?.discount_amount ?? null
const finalAmount    = discountAmount != null
  ? (BANK_INFO.amount - discountAmount)
  : BANK_INFO.amount
```

- [ ] **Step 2: Update baris "Nominal" di tabel bank info**

Di array tabel bank info, ubah baris `Nominal`:

```jsx
{ label: 'Nominal', value: `Rp ${finalAmount.toLocaleString('id-ID')}` },
```

Jika ada diskon, tambahkan baris voucher sebelum Nominal:

```jsx
...(discountAmount != null ? [
  {
    label: 'Harga Normal',
    value: `Rp ${BANK_INFO.amount.toLocaleString('id-ID')}`,
  },
  {
    label: 'Diskon Voucher',
    value: `-Rp ${discountAmount.toLocaleString('id-ID')}`,
    highlight: true,
  },
] : []),
{ label: 'Total Transfer', value: `Rp ${finalAmount.toLocaleString('id-ID')}`, bold: true },
```

Update render baris tabel untuk mendukung prop `highlight` dan `bold`:

```jsx
{[
  { label: 'Bank',          value: BANK_INFO.bankName },
  { label: 'No. Rekening',  value: BANK_INFO.accountNumber, copyable: true },
  { label: 'Atas Nama',     value: BANK_INFO.accountHolder },
  ...(discountAmount != null ? [
    { label: 'Harga Normal',   value: `Rp ${BANK_INFO.amount.toLocaleString('id-ID')}` },
    { label: 'Diskon Voucher', value: `-Rp ${discountAmount.toLocaleString('id-ID')}`, highlight: true },
  ] : []),
  { label: 'Total Transfer', value: `Rp ${finalAmount.toLocaleString('id-ID')}`, bold: true },
].map((row, i) => (
  <div key={i} className="grid grid-cols-[130px_1fr] items-center"
       style={{ borderTop: i !== 0 ? `1px solid ${rule}` : 'none' }}>
    <p className="px-4 py-3 text-xs font-bold tracking-[0.1em] uppercase"
       style={{ color: muted, fontFamily: "'Manrope', sans-serif", background: 'rgba(0,61,107,0.025)' }}>
      {row.label}
    </p>
    <div className="px-4 py-3 flex items-center justify-between gap-2">
      <p className="text-sm font-semibold"
         style={{
           color: row.highlight ? '#065f46' : row.bold ? blue : blue,
           fontFamily: "'Manrope', sans-serif",
           fontWeight: row.bold ? 700 : 600,
         }}>
        {row.value}
      </p>
      {row.copyable && (
        <button type="button" onClick={handleCopy}
          className="text-xs font-bold rounded-full px-3 py-1 shrink-0"
          style={{
            background: copied ? 'rgba(0,61,107,0.08)' : 'rgba(217,119,6,0.1)',
            color: copied ? blue : orange,
            border: 'none', cursor: 'pointer', fontFamily: "'Manrope', sans-serif",
          }}>
          {copied ? 'Tersalin ✓' : 'Salin'}
        </button>
      )}
    </div>
  </div>
))}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/PaymentUploadPage.jsx
git commit -m "feat: show discounted amount in PaymentUploadPage bank info"
```

---

## Task 11: Admin — Halaman `AdminVouchers`

**Files:**
- Create: `frontend/src/pages/admin/AdminVouchers.jsx`

- [ ] **Step 1: Buat file AdminVouchers.jsx**

```jsx
// frontend/src/pages/admin/AdminVouchers.jsx
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import AdminTable from '../../components/admin/AdminTable';
import AdminModal from '../../components/admin/AdminModal';

const blue   = '#003D6B';
const orange = '#E8920A';
const muted  = 'rgba(0,61,107,0.5)';
const border = 'rgba(0,61,107,0.1)';

const EMPTY_FORM = {
  code: '', description: '', discount_percent: '', max_uses: 1,
  expires_at: '', is_active: true,
};

const COLUMNS = [
  { key: 'code', label: 'Kode', render: (v) => (
    <span className="font-mono font-bold text-sm" style={{ color: blue }}>{v}</span>
  )},
  { key: 'description', label: 'Deskripsi', render: (v) => v || '-' },
  { key: 'discount_percent', label: 'Diskon', render: (v) => `${v}%` },
  { key: 'used_count', label: 'Dipakai', render: (v, row) => `${v} / ${row.max_uses}` },
  { key: 'expires_at', label: 'Kadaluarsa', render: (v) => v
    ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Tidak ada' },
  { key: 'is_active', label: 'Status', render: (v) => (
    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={v
        ? { background: 'rgba(5,150,105,0.1)', color: '#065f46', border: '1px solid rgba(5,150,105,0.25)' }
        : { background: 'rgba(0,61,107,0.06)', color: muted, border: `1px solid ${border}` }}>
      {v ? 'Aktif' : 'Nonaktif'}
    </span>
  )},
];

export default function AdminVouchers() {
  const [data,       setData]       = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [toast,      setToast]      = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId,  setEditingId]  = useState(null);
  const [form,       setForm]       = useState(EMPTY_FORM);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from('vouchers').select('*').order('created_at', { ascending: false });
    if (!error) setData(rows || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd  = () => { setEditingId(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      code: row.code, description: row.description || '',
      discount_percent: row.discount_percent, max_uses: row.max_uses,
      expires_at: row.expires_at ? row.expires_at.slice(0, 10) : '',
      is_active: row.is_active,
    });
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditingId(null); setForm(EMPTY_FORM); };

  const fc = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      code:             form.code.toUpperCase().trim(),
      description:      form.description || null,
      discount_percent: Number(form.discount_percent),
      max_uses:         Number(form.max_uses) || 1,
      expires_at:       form.expires_at ? new Date(form.expires_at).toISOString() : null,
      is_active:        form.is_active,
    };
    const { error } = editingId
      ? await supabase.from('vouchers').update(payload).eq('id', editingId)
      : await supabase.from('vouchers').insert([payload]);

    if (error) { showToast(`Gagal: ${error.message}`); }
    else { showToast(editingId ? 'Voucher diperbarui!' : 'Voucher dibuat!'); closeModal(); fetchData(); }
    setSubmitting(false);
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Hapus voucher "${row.code}"?`)) return;
    setDeletingId(row.id);
    const { error } = await supabase.from('vouchers').delete().eq('id', row.id);
    if (error) { showToast('Gagal menghapus.'); }
    else { setData((prev) => prev.filter((v) => v.id !== row.id)); showToast('Voucher dihapus.'); }
    setDeletingId(null);
  };

  const inputCls   = 'w-full h-9 rounded-xl px-3 text-sm focus:outline-none transition-colors';
  const inputStyle = { border: `1px solid ${border}`, color: blue, fontFamily: "'Manrope', sans-serif", background: 'rgba(0,61,107,0.03)' };
  const labelStyle = { color: muted, fontFamily: "'Manrope', sans-serif" };

  return (
    <section className="px-5 py-8 sm:px-8 lg:px-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: blue, fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.02em' }}>
            Voucher
          </h1>
          <p className="text-sm mt-1" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
            Kelola kode voucher dan diskon pembayaran konsultasi.
          </p>
        </div>
        <button type="button" onClick={openAdd}
          className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-bold text-white self-start sm:self-auto"
          style={{ background: orange, boxShadow: '0 4px 14px rgba(232,146,10,0.3)', fontFamily: "'Manrope', sans-serif" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Buat Voucher
        </button>
      </div>

      {/* Tabel */}
      <div className="overflow-hidden rounded-2xl bg-white" style={{ border: `1px solid ${border}`, boxShadow: '0 2px 16px rgba(0,61,107,0.06)' }}>
        <AdminTable columns={COLUMNS} data={data} onEdit={openEdit} onDelete={handleDelete} loading={loading} deletingId={deletingId} />
      </div>

      {/* Modal */}
      <AdminModal isOpen={modalOpen} onClose={closeModal} title={editingId ? 'Edit Voucher' : 'Buat Voucher'} onSubmit={handleSubmit} isSubmitting={submitting}>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={labelStyle}>Kode Voucher *</label>
          <input value={form.code} onChange={fc('code')} required className={inputCls} style={inputStyle}
            placeholder="PROMO50" disabled={!!editingId} />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={labelStyle}>Deskripsi (untuk admin)</label>
          <input value={form.description} onChange={fc('description')} className={inputCls} style={inputStyle}
            placeholder="Voucher untuk klien referral" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={labelStyle}>Diskon (%) *</label>
            <input type="number" value={form.discount_percent} onChange={fc('discount_percent')} required min="1" max="100"
              className={inputCls} style={inputStyle} placeholder="50" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={labelStyle}>Maks Penggunaan *</label>
            <input type="number" value={form.max_uses} onChange={fc('max_uses')} required min="1"
              className={inputCls} style={inputStyle} placeholder="1" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={labelStyle}>Kadaluarsa (opsional)</label>
          <input type="date" value={form.expires_at} onChange={fc('expires_at')} className={inputCls} style={inputStyle} />
        </div>
        <div className="flex items-center gap-2.5">
          <input type="checkbox" id="voucherActive" checked={form.is_active} onChange={fc('is_active')}
            className="w-4 h-4" style={{ accentColor: orange }} />
          <label htmlFor="voucherActive" className="text-sm font-semibold cursor-pointer" style={{ color: blue, fontFamily: "'Manrope', sans-serif" }}>
            Voucher aktif
          </label>
        </div>
      </AdminModal>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-semibold text-white shadow-xl"
          style={{ background: blue, fontFamily: "'Manrope', sans-serif" }}>
          {toast}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/admin/AdminVouchers.jsx
git commit -m "feat: add AdminVouchers page for managing voucher codes"
```

---

## Task 12: Admin — `AdminConsultations` stats voucher + kolom voucher

**Files:**
- Modify: `frontend/src/pages/admin/AdminConsultations.jsx`

- [ ] **Step 1: Tambah stats voucher ke useMemo stats**

Temukan blok `const stats = useMemo(...)`, tambahkan dua properti baru:

```js
const stats = useMemo(() => ({
  total:         consultations.length,
  active:        consultations.filter((c) => c.session_status === 'active').length,
  used:          consultations.filter((c) => c.session_status === 'used').length,
  pending:       consultations.filter((c) => c.payment_status === 'pending_verification').length,
  voucherCount:  consultations.filter((c) => Boolean(c.voucher_code)).length,                           // ← baru
  totalDiscount: consultations.reduce((sum, c) => sum + (c.discount_amount || 0), 0),                   // ← baru
}), [consultations]);
```

- [ ] **Step 2: Tambah dua stat card di JSX**

Temukan area render stats card (biasanya grid berisi card Total, Aktif, Selesai, Pending). Tambahkan dua card baru setelah yang sudah ada:

```jsx
<AdminCard>
  <div className="p-5">
    <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
      Voucher Dipakai
    </p>
    <p className="text-3xl font-bold tabular-nums" style={{ color: blue, fontFamily: "'Poppins', sans-serif" }}>
      {stats.voucherCount}
    </p>
  </div>
</AdminCard>

<AdminCard>
  <div className="p-5">
    <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
      Total Diskon
    </p>
    <p className="text-2xl font-bold tabular-nums" style={{ color: blue, fontFamily: "'Poppins', sans-serif" }}>
      Rp {stats.totalDiscount.toLocaleString('id-ID')}
    </p>
  </div>
</AdminCard>
```

- [ ] **Step 3: Tambah kolom voucher di tabel konsultasi**

Di bagian render setiap kartu/row konsultasi, temukan area dimana `order_id`, `payment_status`, dll ditampilkan. Tambahkan badge voucher:

```jsx
{c.voucher_code && (
  <span
    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
    style={{ background: 'rgba(5,150,105,0.1)', color: '#065f46', border: '1px solid rgba(5,150,105,0.2)' }}
  >
    🎟️ {c.voucher_code}
    {c.discount_percent ? ` (-${c.discount_percent}%)` : ''}
  </span>
)}
```

Temukan di `AdminConsultations.jsx` bagian render setiap row/card konsultasi — cari dimana `getPaymentStatusLabel(c.payment_status)` atau badge payment ditampilkan. Sisipkan badge voucher tepat setelah badge payment status tersebut.

- [ ] **Step 4: Update query fetchData untuk menyertakan kolom voucher**

Di `fetchData`, pastikan query select menyertakan kolom baru:

```js
supabase
  .from('consultations')
  .select('*, clients(full_name, email, phone_number), consultants(name, phone_number)')
  .order('created_at', { ascending: false })
```

> Kolom `voucher_code`, `discount_percent`, `discount_amount` sudah ter-include karena query pakai `*`.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/admin/AdminConsultations.jsx
git commit -m "feat: add voucher stats cards and voucher badge in AdminConsultations"
```

---

## Task 13: Admin — `AdminSidebar` nav item + `App.jsx` route

**Files:**
- Modify: `frontend/src/components/admin/AdminSidebar.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Tambah icon Voucher di AdminSidebar**

Temukan blok icon components (IconClipboard, IconWrench, dll). Tambahkan:

```jsx
const IconTicket = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/>
    <path d="M13 5v2M13 17v2M13 11v2"/>
  </svg>
)
```

Tambahkan ke array `NAV_ITEMS`:

```js
const NAV_ITEMS = [
  { to: '/admin/consultations', label: 'Konsultasi', Icon: IconClipboard },
  { to: '/admin/tools',         label: 'Tools',      Icon: IconWrench    },
  { to: '/admin/cases',         label: 'Case Study', Icon: IconFolder    },
  { to: '/admin/consultants',   label: 'Konsultan',  Icon: IconUsers     },
  { to: '/admin/vouchers',      label: 'Voucher',    Icon: IconTicket    }, // ← baru
];
```

- [ ] **Step 2: Tambah route di App.jsx**

Tambahkan import lazy:

```jsx
const AdminVouchers = lazy(() => import('./pages/admin/AdminVouchers'));
```

Di dalam blok admin routes `<Route path="/admin" element={<AdminLayout />}>`, tambahkan:

```jsx
<Route path="vouchers" element={<AdminVouchers />} />
```

- [ ] **Step 3: Verifikasi navigasi admin**

```bash
cd frontend && npm run dev
```

Buka `/admin` → klik "Voucher" di sidebar → halaman AdminVouchers tampil. Buat satu voucher test, pastikan tersimpan di DB.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/admin/AdminSidebar.jsx \
        frontend/src/App.jsx
git commit -m "feat: add Voucher nav item to AdminSidebar and route to App.jsx"
```

---

## Verifikasi End-to-End

Setelah semua task selesai, jalankan flow lengkap:

1. **Bug 1 fix:** Konfirmasi pembayaran dari dashboard admin → response cepat (<1s), email terkirim di background, tidak 502
2. **Bug 2 fix:** Submit form dengan email yang sudah ada → `order_id` dikembalikan tanpa error
3. **Voucher partial:** Isi form → di review page masukkan kode voucher → tampil nominal diskon → lanjut ke upload → nominal sudah dipotong
4. **Voucher 100%:** Masukkan voucher 100% → tombol berubah "Konfirmasi Tanpa Pembayaran" → klik → langsung ke pending page → admin dashboard menampilkan di "Menunggu Verifikasi" → konfirmasi → invoice PDF dikirim via email dengan baris diskon 100%
5. **Admin voucher:** Buat, edit, nonaktifkan voucher di `/admin/vouchers` → stats card di `/admin/consultations` update

```bash
git log --oneline -15
```

Expected: 13 commit terakhir mencakup semua task di atas.
