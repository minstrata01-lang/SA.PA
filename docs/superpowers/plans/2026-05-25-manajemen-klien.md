# Manajemen Klien Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tambah menu "Manajemen Klien" di admin sidebar yang menampilkan tabel klien (Nama, Alamat, Nomor HP, Permasalahan, Konsultan), dan hapus kolom Konsultan dari halaman Konsultasi.

**Architecture:** Buat halaman baru `AdminClients.jsx` mengikuti pola `AdminConsultations.jsx` (Framer Motion, brand colors, Manrope font). Tambah route `/admin/clients` di `App.jsx` dan nav item di `AdminSidebar.jsx`. Hapus kolom + state konsultan dari `AdminConsultations.jsx`.

**Tech Stack:** React 18, Framer Motion, Supabase JS client, Tailwind CSS, React Router v6

---

## File Map

| File | Status | Tanggung Jawab |
|------|--------|----------------|
| `frontend/src/pages/admin/AdminClients.jsx` | **Buat baru** | Halaman Manajemen Klien — tabel klien + assign konsultan |
| `frontend/src/components/admin/AdminSidebar.jsx` | **Modifikasi** | Tambah nav item "Manajemen Klien" di posisi ke-2 (setelah Konsultasi) |
| `frontend/src/App.jsx` | **Modifikasi** | Tambah lazy import + route `/admin/clients` |
| `frontend/src/pages/admin/AdminConsultations.jsx` | **Modifikasi** | Hapus kolom Konsultan, state `consultants`, fetch consultants, fungsi `assignConsultant` |

---

### Task 1: Buat AdminClients.jsx

**Files:**
- Create: `frontend/src/pages/admin/AdminClients.jsx`

- [ ] **Step 1.1: Buat file AdminClients.jsx dengan konten lengkap**

Buat file baru di `frontend/src/pages/admin/AdminClients.jsx`:

```jsx
import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabaseClient';

const blue   = '#003D6B';
const muted  = 'rgba(0,61,107,0.5)';
const border = 'rgba(0,61,107,0.1)';

const pageVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const cardVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

function AdminCard({ children, style = {}, className = '' }) {
  return (
    <motion.div
      variants={cardVariants}
      className={`rounded-2xl bg-white ${className}`}
      style={{ border: `1px solid ${border}`, boxShadow: '0 2px 16px rgba(0,61,107,0.06)', ...style }}
    >
      {children}
    </motion.div>
  );
}

function truncate(text, max = 80) {
  if (!text) return '-';
  return text.length > max ? text.slice(0, max) + '…' : text;
}

export default function AdminClients() {
  const [consultations, setConsultations] = useState([]);
  const [consultants,   setConsultants]   = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [toast,         setToast]         = useState({ msg: '', type: 'success' });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 2500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cResult, consultResult] = await Promise.all([
        supabase
          .from('consultations')
          .select('id, location, project_details, consultant_id, clients(full_name, phone_number)')
          .order('created_at', { ascending: false }),
        supabase.from('consultants').select('id, name').eq('is_active', true),
      ]);
      if (!cResult.error) setConsultations(cResult.data || []);
      if (!consultResult.error) setConsultants(consultResult.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const assignConsultant = async (consultationId, consultantId) => {
    if (!consultantId) return;
    const { error } = await supabase
      .from('consultations')
      .update({ consultant_id: consultantId })
      .eq('id', consultationId);
    if (!error) {
      showToast('Konsultan berhasil diassign!');
      setConsultations((prev) =>
        prev.map((c) => c.id === consultationId ? { ...c, consultant_id: consultantId } : c)
      );
    } else {
      showToast(`Gagal assign konsultan: ${error.message}`, 'error');
    }
  };

  return (
    <motion.section
      className="px-5 py-8 sm:px-8 lg:px-10 space-y-6"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.header variants={cardVariants}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: blue, fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.02em' }}
            >
              Manajemen Klien
            </h1>
            <p className="text-sm mt-1" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
              Data klien, permasalahan yang dihadapi, dan penugasan konsultan.
            </p>
          </div>
          <motion.button
            type="button"
            onClick={fetchData}
            className="inline-flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-semibold self-start lg:self-auto"
            style={{
              color: blue,
              background: 'rgba(0,61,107,0.07)',
              border: `1px solid ${border}`,
              fontFamily: "'Manrope', sans-serif",
            }}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,61,107,0.13)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,61,107,0.07)'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Refresh
          </motion.button>
        </div>
      </motion.header>

      {/* Table */}
      <AdminCard>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex min-h-64 items-center justify-center gap-3">
              <div
                className="h-7 w-7 rounded-full border-[3px] animate-spin"
                style={{ borderColor: 'rgba(0,61,107,0.15)', borderTopColor: blue }}
              />
              <span className="text-sm font-medium" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
                Memuat data…
              </span>
            </div>
          ) : consultations.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-1" style={{ background: 'rgba(0,61,107,0.06)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={blue} strokeWidth="1.6" strokeLinecap="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                </svg>
              </div>
              <p className="text-sm font-semibold" style={{ color: blue, fontFamily: "'Manrope', sans-serif" }}>Tidak ada data klien</p>
              <p className="text-xs" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>Data akan muncul setelah ada klien yang mendaftar.</p>
            </div>
          ) : (
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr style={{ background: 'rgba(0,61,107,0.04)', borderBottom: '1px solid rgba(0,61,107,0.08)' }}>
                  {['No', 'Nama', 'Alamat', 'Nomor HP', 'Permasalahan', 'Konsultan'].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3.5 text-xs font-bold uppercase tracking-widest"
                      style={{ color: 'rgba(0,61,107,0.45)', fontFamily: "'Manrope', sans-serif" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {consultations.map((item, index) => {
                  const client = Array.isArray(item.clients) ? item.clients[0] : item.clients;
                  return (
                    <tr
                      key={item.id}
                      style={{ borderBottom: '1px solid rgba(0,61,107,0.06)', verticalAlign: 'middle' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,61,107,0.025)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* No */}
                      <td className="px-5 py-4 font-semibold text-xs tabular-nums" style={{ color: 'rgba(0,61,107,0.35)', fontFamily: "'Manrope', sans-serif" }}>
                        {String(index + 1).padStart(2, '0')}
                      </td>

                      {/* Nama */}
                      <td className="px-5 py-4">
                        <p className="font-semibold text-sm" style={{ color: blue, fontFamily: "'Manrope', sans-serif" }}>
                          {client?.full_name || '-'}
                        </p>
                      </td>

                      {/* Alamat */}
                      <td className="px-5 py-4">
                        {item.location ? (
                          <span
                            className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                            style={{
                              background: item.location === 'Jakarta' ? 'rgba(0,61,107,0.08)' : 'rgba(232,146,10,0.1)',
                              color:      item.location === 'Jakarta' ? blue : '#92400e',
                              border:     item.location === 'Jakarta' ? '1px solid rgba(0,61,107,0.2)' : '1px solid rgba(232,146,10,0.25)',
                            }}
                          >
                            {item.location}
                          </span>
                        ) : (
                          <span className="text-xs" style={{ color: muted }}>-</span>
                        )}
                      </td>

                      {/* Nomor HP */}
                      <td className="px-5 py-4 text-sm" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
                        {client?.phone_number || '-'}
                      </td>

                      {/* Permasalahan */}
                      <td className="px-5 py-4" style={{ maxWidth: 280 }}>
                        <p
                          className="text-xs leading-relaxed"
                          style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}
                          title={item.project_details || ''}
                        >
                          {truncate(item.project_details)}
                        </p>
                      </td>

                      {/* Konsultan */}
                      <td className="px-5 py-4">
                        <select
                          value={item.consultant_id || ''}
                          onChange={(e) => assignConsultant(item.id, e.target.value)}
                          className="h-8 rounded-lg px-2.5 text-sm focus:outline-none cursor-pointer"
                          style={{
                            color: blue,
                            border: `1px solid ${border}`,
                            background: 'rgba(0,61,107,0.04)',
                            fontFamily: "'Manrope', sans-serif",
                          }}
                        >
                          <option value="">Pilih Konsultan</option>
                          {consultants.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </AdminCard>

      {/* Toast */}
      <AnimatePresence>
        {toast.msg && (
          <motion.div
            key={toast.msg}
            className="fixed right-5 top-5 z-50 rounded-xl px-4 py-3 text-sm font-semibold shadow-xl flex items-center gap-2"
            style={{
              background: toast.type === 'error' ? '#fff1f2' : '#f0fdf4',
              color:      toast.type === 'error' ? '#be123c'  : '#15803d',
              border:     toast.type === 'error' ? '1px solid rgba(190,18,60,0.25)' : '1px solid rgba(21,128,61,0.25)',
              fontFamily: "'Manrope', sans-serif",
            }}
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {toast.type === 'error' ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
```

- [ ] **Step 1.2: Verifikasi file terbuat**

Cek file ada:
```
ls frontend/src/pages/admin/
```
Harus ada: `AdminClients.jsx` di dalam daftar.

- [ ] **Step 1.3: Commit**

```bash
git add frontend/src/pages/admin/AdminClients.jsx
git commit -m "feat: add AdminClients page for client management"
```

---

### Task 2: Tambah Route di App.jsx

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 2.1: Tambah lazy import AdminClients**

Di `frontend/src/App.jsx`, setelah baris:
```js
const AdminVouchers     = lazy(() => import('./pages/admin/AdminVouchers'));
```

Tambah:
```js
const AdminClients      = lazy(() => import('./pages/admin/AdminClients'));
```

- [ ] **Step 2.2: Tambah route `/admin/clients`**

Di dalam blok `<Route path="/admin" element={<AdminLayout />}>`, setelah baris:
```jsx
<Route path="vouchers"      element={<AdminVouchers />} />
```

Tambah:
```jsx
<Route path="clients"       element={<AdminClients />} />
```

- [ ] **Step 2.3: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: add /admin/clients route"
```

---

### Task 3: Tambah Nav Item di AdminSidebar.jsx

**Files:**
- Modify: `frontend/src/components/admin/AdminSidebar.jsx`

- [ ] **Step 3.1: Tambah icon IconPersonCard**

Di `frontend/src/components/admin/AdminSidebar.jsx`, setelah fungsi `IconClipboard` (sekitar baris 17), tambah fungsi icon baru:

```jsx
function IconPersonCard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <circle cx="8" cy="12" r="2.5"/>
      <path d="M13 10h5M13 14h3"/>
    </svg>
  );
}
```

- [ ] **Step 3.2: Tambah nav item ke array NAV_ITEMS**

Di `frontend/src/components/admin/AdminSidebar.jsx`, cari array `NAV_ITEMS`:
```js
const NAV_ITEMS = [
  { to: '/admin/consultations', label: 'Konsultasi',  Icon: IconClipboard },
  { to: '/admin/tools',         label: 'Tools',       Icon: IconWrench    },
  { to: '/admin/cases',         label: 'Case Study',  Icon: IconFolder    },
  { to: '/admin/consultants',   label: 'Konsultan',   Icon: IconUsers     },
  { to: '/admin/vouchers',      label: 'Voucher',     Icon: IconTicket    },
];
```

Ganti dengan:
```js
const NAV_ITEMS = [
  { to: '/admin/consultations', label: 'Konsultasi',       Icon: IconClipboard  },
  { to: '/admin/clients',       label: 'Manajemen Klien',  Icon: IconPersonCard },
  { to: '/admin/tools',         label: 'Tools',            Icon: IconWrench     },
  { to: '/admin/cases',         label: 'Case Study',       Icon: IconFolder     },
  { to: '/admin/consultants',   label: 'Konsultan',        Icon: IconUsers      },
  { to: '/admin/vouchers',      label: 'Voucher',          Icon: IconTicket     },
];
```

- [ ] **Step 3.3: Commit**

```bash
git add frontend/src/components/admin/AdminSidebar.jsx
git commit -m "feat: add Manajemen Klien nav item to admin sidebar"
```

---

### Task 4: Hapus Kolom Konsultan dari AdminConsultations.jsx

**Files:**
- Modify: `frontend/src/pages/admin/AdminConsultations.jsx`

- [ ] **Step 4.1: Hapus state `consultants`**

Di `frontend/src/pages/admin/AdminConsultations.jsx`, hapus baris:
```js
const [consultants, setConsultants]     = useState([]);
```

- [ ] **Step 4.2: Sederhanakan fetchData — hapus fetch consultants**

Cari blok `fetchData` yang berisi `Promise.all` dengan dua query. Ubah dari:
```js
const [cResult, consultResult] = await Promise.all([
  supabase
    .from('consultations')
    .select('*, clients(full_name, email, phone_number), consultants(name, phone_number)')
    .order('created_at', { ascending: false }),
  supabase.from('consultants').select('*').eq('is_active', true),
]);
if (!cResult.error) setConsultations(cResult.data || []);
if (!consultResult.error) setConsultants(consultResult.data || []);
```

Menjadi:
```js
const cResult = await supabase
  .from('consultations')
  .select('*, clients(full_name, email, phone_number)')
  .order('created_at', { ascending: false });
if (!cResult.error) setConsultations(cResult.data || []);
```

- [ ] **Step 4.3: Hapus fungsi `assignConsultant`**

Cari dan hapus seluruh fungsi ini:
```js
const assignConsultant = async (consultationId, consultantId) => {
  if (!consultantId) return;
  const { error } = await supabase
    .from('consultations')
    .update({ consultant_id: consultantId })
    .eq('id', consultationId);
  if (!error) {
    showToast('Konsultan berhasil diassign!');
    setConsultations((prev) =>
      prev.map((c) => c.id === consultationId ? { ...c, consultant_id: consultantId } : c)
    );
  } else {
    showToast(`Gagal assign konsultan: ${error.message}`, 'error');
  }
};
```

- [ ] **Step 4.4: Hapus header "Konsultan" dari thead**

Cari array header di dalam `<thead>`:
```js
{['No', 'Klien', 'Telepon', 'Lokasi', 'Tanggal', 'Status Sesi', 'Konsultan', 'Voucher', 'Status Bayar', 'Pembayaran', 'Aksi'].map((h) => (
```

Hapus `'Konsultan', ` sehingga menjadi:
```js
{['No', 'Klien', 'Telepon', 'Lokasi', 'Tanggal', 'Status Sesi', 'Voucher', 'Status Bayar', 'Pembayaran', 'Aksi'].map((h) => (
```

- [ ] **Step 4.5: Hapus cell Konsultan dari tbody**

Di dalam `<tbody>`, cari dan hapus seluruh blok `<td>` untuk konsultan:
```jsx
<td className="px-5 py-4">
  <select
    value={item.consultant_id || ''}
    onChange={(e) => assignConsultant(item.id, e.target.value)}
    className="h-8 rounded-lg px-2.5 text-sm focus:outline-none cursor-pointer"
    style={{
      color: blue,
      border: `1px solid ${border}`,
      background: 'rgba(0,61,107,0.04)',
      fontFamily: "'Manrope', sans-serif",
    }}
  >
    <option value="">Pilih Konsultan</option>
    {consultants.map((c) => (
      <option key={c.id} value={c.id}>{c.name}</option>
    ))}
  </select>
</td>
```

- [ ] **Step 4.6: Commit**

```bash
git add frontend/src/pages/admin/AdminConsultations.jsx
git commit -m "refactor: remove consultant column from AdminConsultations (moved to AdminClients)"
```

---

### Task 5: Verifikasi Manual

- [ ] **Step 5.1: Jalankan dev server**

```bash
cd frontend && npm run dev
```

- [ ] **Step 5.2: Verifikasi sidebar**

Buka `http://localhost:5173/admin/consultations`. Sidebar harus menampilkan menu "Manajemen Klien" di antara "Konsultasi" dan "Tools".

- [ ] **Step 5.3: Verifikasi halaman Manajemen Klien**

Klik "Manajemen Klien" di sidebar. Harus:
- Navigasi ke `/admin/clients`
- Menampilkan tabel dengan kolom: No, Nama, Alamat, Nomor HP, Permasalahan, Konsultan
- Dropdown konsultan bisa diklik dan assign berhasil (muncul toast sukses)

- [ ] **Step 5.4: Verifikasi halaman Konsultasi**

Klik "Konsultasi" di sidebar. Tabel harus:
- Tidak lagi memiliki kolom "Konsultan"
- Semua kolom lain (No, Klien, Telepon, Lokasi, Tanggal, Status Sesi, Voucher, Status Bayar, Pembayaran, Aksi) masih berfungsi normal

- [ ] **Step 5.5: Final commit (jika ada perubahan kecil setelah verifikasi)**

```bash
git add -A
git commit -m "feat: Manajemen Klien menu — client table with consultant assignment"
```
