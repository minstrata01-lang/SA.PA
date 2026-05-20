# Payment Admin Confirmation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin dapat mengkonfirmasi atau menolak pembayaran user langsung dari `AdminConsultations` dashboard, dengan notifikasi email + WhatsApp ke user dan WA ke admin saat bukti transfer baru masuk.

**Architecture:** Dua Supabase Edge Function baru (`notify-admin`, `confirm-payment`) menangani semua operasi DB dan pengiriman notifikasi via Resend (email) dan Fonnte (WhatsApp). Frontend memanggil edge functions langsung — tidak ada credential sensitif yang di-expose ke browser selain anon key yang sudah ada.

**Tech Stack:** React + Vite, Supabase JS client, Supabase Edge Functions (Deno/TypeScript), Resend API, Fonnte API, Framer Motion

---

## File Structure

**Create:**
- `supabase/functions/notify-admin/index.ts` — kirim WA ke admin saat user upload bukti transfer
- `supabase/functions/confirm-payment/index.ts` — update payment_status + kirim email + WA ke user

**Modify:**
- `frontend/src/pages/PaymentUploadPage.jsx` — panggil `notify-admin` setelah upload berhasil
- `frontend/src/pages/admin/AdminConsultations.jsx` — stat card baru, filter tab baru, kolom Status Bayar + Bukti Transfer + Aksi Bayar, handler konfirmasi/tolak

---

## Task 1: Edge Function `notify-admin`

**Files:**
- Create: `supabase/functions/notify-admin/index.ts`

- [ ] **Step 1: Buat file edge function**

Buat file `supabase/functions/notify-admin/index.ts` dengan konten berikut:

```typescript
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
    const { order_id } = await req.json()

    if (!order_id) {
      return new Response(
        JSON.stringify({ error: 'order_id wajib diisi' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const pesan = `🔔 Ada pesanan konsultasi baru masuk. Buka dashboard untuk verifikasi: ${Deno.env.get('FRONTEND_URL')}/admin/consultations`

    const waRes = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { Authorization: Deno.env.get('FONNTE_TOKEN')! },
      body: new URLSearchParams({
        target: Deno.env.get('ADMIN_WA_NUMBER')!,
        message: pesan,
      }),
    })

    console.log('WA notify-admin sent, status:', waRes.status)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Unhandled error:', (err as Error).message)
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: (err as Error).message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

- [ ] **Step 2: Deploy edge function**

```bash
supabase functions deploy notify-admin --no-verify-jwt
```

Expected output: `Deployed Functions notify-admin`

- [ ] **Step 3: Test manual via curl**

```bash
curl -X POST https://<SUPABASE_PROJECT_REF>.supabase.co/functions/v1/notify-admin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -d '{"order_id": "<order_id_yang_ada_di_db>"}'
```

Expected: `{"success":true}` dan WA masuk ke nomor admin.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/notify-admin/index.ts
git commit -m "feat: add notify-admin edge function"
```

---

## Task 2: Edge Function `confirm-payment`

**Files:**
- Create: `supabase/functions/confirm-payment/index.ts`

- [ ] **Step 1: Buat file edge function**

Buat file `supabase/functions/confirm-payment/index.ts` dengan konten berikut:

```typescript
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
    const { consultation_id, action } = await req.json()

    if (!consultation_id || !['confirm', 'reject'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'consultation_id dan action (confirm|reject) wajib diisi' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const newStatus = action === 'confirm' ? 'confirmed' : 'rejected'

    const { error: updateError } = await supabase
      .from('consultations')
      .update({ payment_status: newStatus })
      .eq('id', consultation_id)

    if (updateError) {
      console.error('Update error:', updateError.message)
      return new Response(
        JSON.stringify({ error: 'Gagal update status pembayaran' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: consultation, error: selectError } = await supabase
      .from('consultations')
      .select('order_id, project_details, clients(full_name, email, phone_number)')
      .eq('id', consultation_id)
      .single()

    if (selectError || !consultation) {
      console.error('Select error:', selectError?.message)
      return new Response(JSON.stringify({ success: true, warning: 'DB updated, notifikasi dilewati' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const client = Array.isArray(consultation.clients)
      ? consultation.clients[0]
      : consultation.clients

    const clientName = client?.full_name || 'Pelanggan'
    const clientEmail = client?.email
    const clientPhone = client?.phone_number

    // ── Kirim email via Resend ──
    if (clientEmail) {
      try {
        const subject = action === 'confirm'
          ? `Pembayaran Dikonfirmasi — Order ${consultation.order_id}`
          : `Pembayaran Ditolak — Order ${consultation.order_id}`

        const html = action === 'confirm'
          ? `
            <h2>Pembayaran Dikonfirmasi ✅</h2>
            <p>Halo <strong>${clientName}</strong>,</p>
            <p>Pembayaran Anda untuk order <strong>${consultation.order_id}</strong> telah dikonfirmasi oleh admin kami.</p>
            <p>Konsultan kami akan segera menghubungi Anda melalui WhatsApp untuk langkah selanjutnya.</p>
            <p>Terima kasih telah menggunakan layanan SAPA.</p>
          `
          : `
            <h2>Pembayaran Ditolak ❌</h2>
            <p>Halo <strong>${clientName}</strong>,</p>
            <p>Maaf, pembayaran Anda untuk order <strong>${consultation.order_id}</strong> tidak dapat dikonfirmasi.</p>
            <p>Kemungkinan penyebab: bukti transfer tidak terbaca, nominal tidak sesuai, atau rekening tujuan berbeda.</p>
            <p>Silakan upload ulang bukti transfer atau hubungi admin kami via WhatsApp untuk bantuan lebih lanjut.</p>
          `

        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: Deno.env.get('FROM_EMAIL'),
            to: clientEmail,
            subject,
            html,
          }),
        })
        console.log('Email sent, status:', emailRes.status)
      } catch (emailErr) {
        console.error('Email gagal:', (emailErr as Error).message)
      }
    }

    // ── Kirim WA via Fonnte ke user ──
    if (clientPhone) {
      try {
        const formattedPhone =
          clientPhone.startsWith('0') ? '62' + clientPhone.slice(1) : clientPhone

        const pesanUser = action === 'confirm'
          ? `✅ *Pembayaran Dikonfirmasi*\n\nHalo ${clientName}, pembayaran Anda untuk order ${consultation.order_id} telah dikonfirmasi. Konsultan kami akan segera menghubungi Anda. Terima kasih!`
          : `❌ *Pembayaran Ditolak*\n\nHalo ${clientName}, maaf pembayaran Anda untuk order ${consultation.order_id} tidak dapat dikonfirmasi. Silakan upload ulang bukti transfer atau hubungi admin untuk bantuan.`

        const waRes = await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: { Authorization: Deno.env.get('FONNTE_TOKEN')! },
          body: new URLSearchParams({
            target: formattedPhone,
            message: pesanUser,
          }),
        })
        console.log('WA user sent, status:', waRes.status)
      } catch (waErr) {
        console.error('WA gagal:', (waErr as Error).message)
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
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

- [ ] **Step 2: Deploy edge function**

```bash
supabase functions deploy confirm-payment --no-verify-jwt
```

Expected output: `Deployed Functions confirm-payment`

- [ ] **Step 3: Test manual via curl (konfirmasi)**

```bash
curl -X POST https://<SUPABASE_PROJECT_REF>.supabase.co/functions/v1/confirm-payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -d '{"consultation_id": "<uuid_consultation>", "action": "confirm"}'
```

Expected: `{"success":true}`, `payment_status` di DB berubah jadi `"confirmed"`, user terima email + WA.

- [ ] **Step 4: Test manual via curl (tolak)**

```bash
curl -X POST https://<SUPABASE_PROJECT_REF>.supabase.co/functions/v1/confirm-payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -d '{"consultation_id": "<uuid_consultation>", "action": "reject"}'
```

Expected: `{"success":true}`, `payment_status` jadi `"rejected"`, user terima email + WA penolakan.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/confirm-payment/index.ts
git commit -m "feat: add confirm-payment edge function"
```

---

## Task 3: Panggil `notify-admin` dari `PaymentUploadPage`

**Files:**
- Modify: `frontend/src/pages/PaymentUploadPage.jsx`

- [ ] **Step 1: Tambah pemanggilan notify-admin di `handleSubmit`**

Di `frontend/src/pages/PaymentUploadPage.jsx`, cari blok `handleSubmit` (sekitar baris 68–98). Setelah baris `if (updateError) throw updateError;` dan sebelum `navigate("/payment/pending", ...)`, tambahkan pemanggilan notify-admin:

```jsx
const handleSubmit = async () => {
  if (!selectedFile) { setError("Pilih file bukti transfer terlebih dahulu."); return; }
  setIsUploading(true);
  setError("");

  try {
    const ext      = selectedFile.name.split(".").pop();
    const filePath = `${orderId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(filePath, selectedFile, { upsert: true });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("payment-proofs")
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from("consultations")
      .update({ proof_url: urlData.publicUrl, payment_status: "pending_verification" })
      .eq("order_id", orderId);
    if (updateError) throw updateError;

    // Notifikasi WA ke admin (fire-and-forget, tidak memblokir alur)
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ order_id: orderId }),
    }).catch(() => {}); // abaikan error, jangan blokir navigasi

    navigate("/payment/pending", { state: { orderId, reviewData } });
  } catch (err) {
    setError(err.message || "Gagal mengupload bukti transfer. Coba lagi.");
  } finally {
    setIsUploading(false);
  }
};
```

- [ ] **Step 2: Verifikasi di browser**

Jalankan dev server:
```bash
cd frontend && npm run dev
```

Buka dev tools → tab Network. Lakukan upload bukti transfer. Pastikan:
- Request ke `/functions/v1/notify-admin` muncul di Network tab
- Status response 200
- Admin menerima WA notifikasi

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/PaymentUploadPage.jsx
git commit -m "feat: call notify-admin after payment proof upload"
```

---

## Task 4: Update `AdminConsultations` — Stat Card + Filter Tab

**Files:**
- Modify: `frontend/src/pages/admin/AdminConsultations.jsx`

- [ ] **Step 1: Tambah stat card "Menunggu Verifikasi"**

Di `AdminConsultations.jsx`, cari konstanta `stats` (sekitar baris 130–134):

```js
const stats = useMemo(() => ({
  total:  consultations.length,
  active: consultations.filter((c) => c.session_status === 'active').length,
  used:   consultations.filter((c) => c.session_status === 'used').length,
}), [consultations]);
```

Ubah menjadi:

```js
const stats = useMemo(() => ({
  total:   consultations.length,
  active:  consultations.filter((c) => c.session_status === 'active').length,
  used:    consultations.filter((c) => c.session_status === 'used').length,
  pending: consultations.filter((c) => c.payment_status === 'pending_verification').length,
}), [consultations]);
```

- [ ] **Step 2: Tambah card ke `STAT_CARDS`**

Cari array `STAT_CARDS` (sekitar baris 185). Tambahkan item ke-4 di akhir array:

```js
{
  label: 'Menunggu Verifikasi',
  value: stats.pending,
  icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
    </svg>
  ),
  accent: '#E8920A',
  bg: 'rgba(232,146,10,0.08)',
},
```

- [ ] **Step 3: Update grid stat cards dari 3 kolom ke 4**

Cari baris:
```jsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
```

Ubah menjadi:
```jsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
```

- [ ] **Step 4: Tambah filter tab "Menunggu Verifikasi"**

Cari konstanta `FILTER_TABS` (sekitar baris 10–16):

```js
const FILTER_TABS = [
  { key: 'all',        label: 'Semua' },
  { key: 'unassigned', label: 'Belum Diassign' },
  { key: 'assigned',   label: 'Sudah Diassign' },
  { key: 'active',     label: 'Sesi Aktif' },
  { key: 'used',       label: 'Selesai' },
];
```

Ubah menjadi:

```js
const FILTER_TABS = [
  { key: 'all',             label: 'Semua' },
  { key: 'pending_payment', label: 'Menunggu Verifikasi' },
  { key: 'unassigned',      label: 'Belum Diassign' },
  { key: 'assigned',        label: 'Sudah Diassign' },
  { key: 'active',          label: 'Sesi Aktif' },
  { key: 'used',            label: 'Selesai' },
];
```

- [ ] **Step 5: Tambah logika filter `pending_payment`**

Cari `filteredConsultations` useMemo (sekitar baris 122–128):

```js
const filteredConsultations = useMemo(() => {
  if (activeTab === 'unassigned') return consultations.filter((c) => !c.consultant_id);
  if (activeTab === 'assigned')   return consultations.filter((c) => Boolean(c.consultant_id));
  if (activeTab === 'active')     return consultations.filter((c) => c.session_status === 'active');
  if (activeTab === 'used')       return consultations.filter((c) => c.session_status === 'used');
  return consultations;
}, [activeTab, consultations]);
```

Ubah menjadi:

```js
const filteredConsultations = useMemo(() => {
  if (activeTab === 'pending_payment') return consultations.filter((c) => c.payment_status === 'pending_verification');
  if (activeTab === 'unassigned')      return consultations.filter((c) => !c.consultant_id);
  if (activeTab === 'assigned')        return consultations.filter((c) => Boolean(c.consultant_id));
  if (activeTab === 'active')          return consultations.filter((c) => c.session_status === 'active');
  if (activeTab === 'used')            return consultations.filter((c) => c.session_status === 'used');
  return consultations;
}, [activeTab, consultations]);
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/admin/AdminConsultations.jsx
git commit -m "feat: add pending payment stat card and filter tab"
```

---

## Task 5: Update `AdminConsultations` — Kolom Pembayaran + Handler

**Files:**
- Modify: `frontend/src/pages/admin/AdminConsultations.jsx`

- [ ] **Step 1: Tambah state + handler konfirmasi/tolak**

Di dalam komponen `AdminConsultations`, setelah deklarasi state yang sudah ada (sekitar baris 85–91), tambahkan state baru:

```js
const [confirmingId, setConfirmingId] = useState(null);
```

Kemudian tambahkan fungsi `handlePaymentAction` setelah fungsi `deleteConsultation` (sekitar baris 159–170):

```js
const handlePaymentAction = async (consultationId, action) => {
  const label = action === 'confirm' ? 'konfirmasi' : 'tolak';
  if (!window.confirm(`${label.charAt(0).toUpperCase() + label.slice(1)} pembayaran ini?`)) return;
  setConfirmingId(consultationId);
  try {
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirm-payment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ consultation_id: consultationId, action }),
      }
    );
    if (res.ok) {
      showToast(action === 'confirm' ? 'Pembayaran dikonfirmasi!' : 'Pembayaran ditolak.');
      fetchData();
    } else {
      showToast('Gagal memproses pembayaran.', 'error');
    }
  } catch {
    showToast('Gagal memproses pembayaran.', 'error');
  } finally {
    setConfirmingId(null);
  }
};
```

- [ ] **Step 2: Tambah helper `getPaymentStatusStyle`**

Tambahkan fungsi ini setelah fungsi `getStatusStyle` yang sudah ada (sekitar baris 26–29):

```js
function getPaymentStatusStyle(status) {
  if (status === 'confirmed')            return { background: 'rgba(5,150,105,0.1)',  color: '#065f46', border: '1px solid rgba(5,150,105,0.25)' };
  if (status === 'rejected')             return { background: 'rgba(190,18,60,0.08)', color: '#9f1239', border: '1px solid rgba(190,18,60,0.2)' };
  if (status === 'pending_verification') return { background: 'rgba(232,146,10,0.1)', color: '#92400e', border: '1px solid rgba(232,146,10,0.25)' };
  return { background: 'rgba(0,61,107,0.06)', color: muted, border: `1px solid ${border}` };
}

function getPaymentStatusLabel(status) {
  if (status === 'confirmed')            return 'Dikonfirmasi';
  if (status === 'rejected')             return 'Ditolak';
  if (status === 'pending_verification') return 'Menunggu';
  return status || '-';
}
```

- [ ] **Step 3: Tambah header kolom baru di tabel**

Cari baris header tabel (sekitar baris 339):

```jsx
{['No', 'Client', 'No. HP', 'Tanggal', 'Status Sesi', 'Konsultan', 'Aksi'].map((h) => (
```

Ubah menjadi:

```jsx
{['No', 'Client', 'No. HP', 'Tanggal', 'Status Sesi', 'Konsultan', 'Status Bayar', 'Bukti', 'Aksi Bayar', 'Aksi'].map((h) => (
```

- [ ] **Step 4: Tambah sel data kolom baru di setiap baris**

Di dalam `filteredConsultations.map(...)`, cari blok `<td>` kolom Konsultan (sekitar baris 393–410) dan sebelum `<td>` kolom Aksi (hapus, sekitar baris 411), tambahkan 3 `<td>` baru setelah `<td>` kolom Konsultan:

```jsx
{/* Status Bayar */}
<td className="px-5 py-4">
  <span
    className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
    style={getPaymentStatusStyle(item.payment_status)}
  >
    {getPaymentStatusLabel(item.payment_status)}
  </span>
</td>

{/* Bukti Transfer */}
<td className="px-5 py-4">
  {item.proof_url ? (
    <a
      href={item.proof_url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-xs font-semibold"
      style={{ color: blue, textDecoration: 'none' }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
        <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
      </svg>
      Lihat
    </a>
  ) : (
    <span className="text-xs" style={{ color: muted }}>-</span>
  )}
</td>

{/* Aksi Bayar */}
<td className="px-5 py-4">
  {item.payment_status === 'pending_verification' ? (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => handlePaymentAction(item.id, 'confirm')}
        disabled={confirmingId === item.id}
        className="inline-flex h-8 items-center gap-1 rounded-lg px-3 text-xs font-semibold transition-all duration-150 disabled:opacity-50"
        style={{
          color: '#065f46',
          background: 'rgba(5,150,105,0.1)',
          border: '1px solid rgba(5,150,105,0.25)',
          fontFamily: "'Manrope', sans-serif",
          cursor: confirmingId === item.id ? 'not-allowed' : 'pointer',
        }}
        onMouseEnter={e => { if (confirmingId !== item.id) e.currentTarget.style.background = 'rgba(5,150,105,0.2)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(5,150,105,0.1)'; }}
      >
        {confirmingId === item.id ? '...' : '✓ Konfirmasi'}
      </button>
      <button
        type="button"
        onClick={() => handlePaymentAction(item.id, 'reject')}
        disabled={confirmingId === item.id}
        className="inline-flex h-8 items-center gap-1 rounded-lg px-3 text-xs font-semibold transition-all duration-150 disabled:opacity-50"
        style={{
          color: '#9f1239',
          background: 'rgba(190,18,60,0.08)',
          border: '1px solid rgba(190,18,60,0.2)',
          fontFamily: "'Manrope', sans-serif",
          cursor: confirmingId === item.id ? 'not-allowed' : 'pointer',
        }}
        onMouseEnter={e => { if (confirmingId !== item.id) e.currentTarget.style.background = 'rgba(190,18,60,0.15)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(190,18,60,0.08)'; }}
      >
        ✕ Tolak
      </button>
    </div>
  ) : (
    <span className="text-xs" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>-</span>
  )}
</td>
```

- [ ] **Step 5: Verifikasi di browser**

Jalankan dev server jika belum berjalan:
```bash
cd frontend && npm run dev
```

Buka `/admin/consultations`. Verifikasi:
- Ada 4 stat card (Total, Sesi Aktif, Selesai, Menunggu Verifikasi)
- Tab "Menunggu Verifikasi" tampil dan memfilter dengan benar
- Kolom "Status Bayar", "Bukti", "Aksi Bayar" muncul di tabel
- Baris dengan `payment_status = "pending_verification"` menampilkan tombol Konfirmasi + Tolak
- Baris dengan status lain menampilkan `-` di kolom Aksi Bayar
- Klik link "Lihat" pada bukti transfer membuka file di tab baru
- Klik "Konfirmasi" → confirm dialog → toast sukses → row di-refresh dengan status baru
- Klik "Tolak" → confirm dialog → toast → row di-refresh

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/admin/AdminConsultations.jsx
git commit -m "feat: add payment status column, proof link, and confirm/reject actions to AdminConsultations"
```

---

## Self-Review Checklist

- [x] **Spec coverage:**
  - ✅ Kolom Status Bayar + badge warna → Task 5, Step 2 + 3
  - ✅ Kolom Bukti Transfer dengan link → Task 5, Step 4
  - ✅ Tombol Konfirmasi + Tolak hanya saat `pending_verification` → Task 5, Step 4
  - ✅ Edge function `confirm-payment` update DB + email + WA user → Task 2
  - ✅ Edge function `notify-admin` WA ke admin saat upload → Task 1
  - ✅ `PaymentUploadPage` memanggil `notify-admin` → Task 3
  - ✅ Filter tab "Menunggu Verifikasi" → Task 4, Step 4–5
  - ✅ Stat card baru → Task 4, Step 1–3

- [x] **Placeholder scan:** Tidak ada TBD atau TODO dalam plan ini

- [x] **Type consistency:**
  - `confirmingId` dideklarasikan di Task 5 Step 1, digunakan di Step 4 ✅
  - `handlePaymentAction(consultationId, action)` dideklarasikan di Task 5 Step 1, dipanggil di Step 4 ✅
  - `getPaymentStatusStyle(status)` dan `getPaymentStatusLabel(status)` dideklarasikan di Task 5 Step 2, digunakan di Step 4 ✅
  - `payment_status` field tersedia dari query `select('*')` yang sudah ada ✅
