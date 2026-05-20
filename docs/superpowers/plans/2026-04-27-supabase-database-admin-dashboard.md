# Supabase Database + Admin Dashboard & Client Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrasikan semua konten statis ke Supabase, bangun Admin Dashboard dengan sidebar + full CRUD untuk semua entitas, dan update halaman client untuk membaca dari DB.

**Architecture:** Supabase menjadi single source of truth untuk semua konten. Admin Dashboard diredesign dengan `AdminLayout` + sidebar navigasi + 5 halaman CRUD terpisah. Client pages menggunakan custom hooks yang fetch dari Supabase dengan loading/error states.

**Tech Stack:** React 18, Vite, Supabase JS v2, React Router v6, Tailwind CSS, Framer Motion (client pages only)

---

## File Map

### Dibuat baru
```
frontend/src/layouts/AdminLayout.jsx
frontend/src/components/admin/AdminSidebar.jsx
frontend/src/components/admin/AdminTable.jsx
frontend/src/components/admin/AdminModal.jsx
frontend/src/components/admin/AdminImageUpload.jsx
frontend/src/pages/admin/AdminConsultations.jsx
frontend/src/pages/admin/AdminTools.jsx
frontend/src/pages/admin/AdminCases.jsx
frontend/src/pages/admin/AdminConsultants.jsx
frontend/src/pages/admin/AdminPricing.jsx
frontend/src/hooks/useTools.js
frontend/src/hooks/useCases.js
frontend/src/hooks/usePricing.js
frontend/src/hooks/useConsultants.js
```

### Dimodifikasi
```
frontend/src/App.jsx                          — rute admin baru
frontend/src/pages/NewTools.jsx               — pakai useTools()
frontend/src/pages/ToolDetail.jsx             — fetch dari Supabase by slug
frontend/src/pages/Case.jsx                   — pakai useCases()
frontend/src/pages/CaseDetail.jsx             — fetch dari Supabase by slug
frontend/src/pages/Pricing.jsx                — pakai usePricing()
frontend/src/components/Team.jsx              — pakai useConsultants()
frontend/src/components/Card/CardConsultant.jsx — terima photo_url bukan image
```

### Dihapus (setelah semua migrasi selesai)
```
frontend/src/data/tools.js
frontend/src/data/toolDetails.js
frontend/src/data/cases.js
frontend/src/data/caseDetails.js
frontend/src/data/consultants.js
```

---

## Phase 1 — Supabase Database Setup

### Task 1: Buat tabel baru & modifikasi tabel consultants

**Files:**
- Create: `supabase/migrations/20260427000001_add_content_tables.sql`

- [ ] **Step 1: Buat file migration SQL**

```sql
-- supabase/migrations/20260427000001_add_content_tables.sql

-- ── 1. Modifikasi tabel consultants (tambah kolom baru) ──────────────────
ALTER TABLE consultants
  ADD COLUMN IF NOT EXISTS title        text,
  ADD COLUMN IF NOT EXISTS description  text,
  ADD COLUMN IF NOT EXISTS photo_url    text,
  ADD COLUMN IF NOT EXISTS sort_order   integer DEFAULT 0;

-- ── 2. Tabel tools ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tools (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  slug          text NOT NULL UNIQUE,
  description   text,
  thumbnail_url text,
  tags          text[] DEFAULT '{}',
  video_url     text,
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

-- ── 3. Tabel cases ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cases (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text NOT NULL,
  slug             text NOT NULL UNIQUE,
  summary          text,
  full_description text,
  cover_image_url  text,
  category         text,
  tags             text[] DEFAULT '{}',
  status           text DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  sort_order       integer DEFAULT 0,
  created_at       timestamptz DEFAULT now()
);

-- ── 4. Tabel pricing_plans ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pricing_plans (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  tag_label   text,
  description text,
  price       numeric,
  features    text[] DEFAULT '{}',
  is_featured boolean DEFAULT false,
  sort_order  integer DEFAULT 0,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);
```

- [ ] **Step 2: Jalankan migration di Supabase Dashboard**

Buka Supabase Dashboard → SQL Editor → paste seluruh isi SQL di atas → klik Run.

Verifikasi: Buka Table Editor, pastikan tabel `tools`, `cases`, `pricing_plans` muncul dan kolom baru di `consultants` tersedia.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260427000001_add_content_tables.sql
git commit -m "feat: add content tables (tools, cases, pricing_plans) and extend consultants"
```

---

### Task 2: Setup RLS & Storage Buckets

**Files:**
- Create: `supabase/migrations/20260427000002_rls_and_storage.sql`

- [ ] **Step 1: Buat file RLS migration**

```sql
-- supabase/migrations/20260427000002_rls_and_storage.sql

-- ── Enable RLS ────────────────────────────────────────────────────────────
ALTER TABLE tools          ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases          ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_plans  ENABLE ROW LEVEL SECURITY;

-- ── tools: publik bisa SELECT aktif, authenticated bisa semua ────────────
CREATE POLICY "Public read active tools"
  ON tools FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin full access tools"
  ON tools FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── cases: publik bisa SELECT published, authenticated bisa semua ─────────
CREATE POLICY "Public read published cases"
  ON cases FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admin full access cases"
  ON cases FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── pricing_plans: publik bisa SELECT aktif, authenticated bisa semua ────
CREATE POLICY "Public read active pricing"
  ON pricing_plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin full access pricing"
  ON pricing_plans FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── consultants: publik bisa SELECT aktif ─────────────────────────────────
-- (tabel sudah ada, tambah policy baru)
CREATE POLICY "Public read active consultants"
  ON consultants FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin full access consultants"
  ON consultants FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

- [ ] **Step 2: Jalankan di Supabase SQL Editor**

Paste SQL di atas → Run.

- [ ] **Step 3: Buat Storage Buckets**

Di Supabase Dashboard → Storage → New Bucket:
1. Nama: `consultants` → Public bucket: ✅ → Create
2. Nama: `tools` → Public bucket: ✅ → Create
3. Nama: `cases` → Public bucket: ✅ → Create

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260427000002_rls_and_storage.sql
git commit -m "feat: add RLS policies for content tables and storage buckets"
```

---

## Phase 2 — Admin Shared Components

### Task 3: AdminSidebar & AdminLayout

**Files:**
- Create: `frontend/src/components/admin/AdminSidebar.jsx`
- Create: `frontend/src/layouts/AdminLayout.jsx`

- [ ] **Step 1: Buat AdminSidebar.jsx**

```jsx
// frontend/src/components/admin/AdminSidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const NAV_ITEMS = [
  { to: '/admin/consultations', label: 'Konsultasi',  icon: '📋' },
  { to: '/admin/tools',         label: 'Tools',        icon: '🔧' },
  { to: '/admin/cases',         label: 'Case Study',   icon: '📁' },
  { to: '/admin/consultants',   label: 'Konsultan',    icon: '👥' },
  { to: '/admin/pricing',       label: 'Pricing',      icon: '💰' },
];

export default function AdminSidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  return (
    <aside className="w-60 shrink-0 min-h-screen bg-slate-900 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-800">
        <p className="text-xs font-bold tracking-[0.2em] uppercase text-slate-400">Stratalift</p>
        <p className="text-sm font-semibold text-white mt-0.5">Admin Dashboard</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <span>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-800">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Buat AdminLayout.jsx**

```jsx
// frontend/src/layouts/AdminLayout.jsx
import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AdminSidebar from '../components/admin/AdminSidebar';

export default function AdminLayout() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error || !data.session) {
        navigate('/admin/login');
      }
      setChecking(false);
    });
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Verifikasi**

Belum bisa ditest langsung — akan ditest setelah routing di-update pada Task 8.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/admin/AdminSidebar.jsx frontend/src/layouts/AdminLayout.jsx
git commit -m "feat: add AdminSidebar and AdminLayout with auth check"
```

---

### Task 4: AdminTable & AdminModal

**Files:**
- Create: `frontend/src/components/admin/AdminTable.jsx`
- Create: `frontend/src/components/admin/AdminModal.jsx`

- [ ] **Step 1: Buat AdminTable.jsx**

```jsx
// frontend/src/components/admin/AdminTable.jsx

/**
 * columns: Array<{ key: string, label: string, render?: (value, row) => ReactNode }>
 * data: Array<object>
 * onEdit: (row) => void
 * onDelete: (row) => void
 * loading: boolean
 * deletingId: string | null
 */
export default function AdminTable({ columns, data, onEdit, onDelete, loading, deletingId }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-48">
        <div className="w-7 h-7 border-4 border-slate-200 border-t-slate-700 rounded-full animate-spin" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-48 text-slate-500">
        <p className="font-medium text-slate-700">Belum ada data</p>
        <p className="text-sm mt-1">Klik tombol Tambah untuk menambahkan data baru.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-700">
          <tr>
            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide">No</th>
            {columns.map((col) => (
              <th key={col.key} className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide">
                {col.label}
              </th>
            ))}
            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
              <td className="px-5 py-4 text-slate-500 font-medium">{index + 1}</td>
              {columns.map((col) => (
                <td key={col.key} className="px-5 py-4 text-slate-700">
                  {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '-')}
                </td>
              ))}
              <td className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(row)}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(row)}
                    disabled={deletingId === row.id}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 shadow-sm hover:bg-rose-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {deletingId === row.id ? 'Menghapus...' : 'Hapus'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Buat AdminModal.jsx**

```jsx
// frontend/src/components/admin/AdminModal.jsx
import { useEffect } from 'react';

/**
 * isOpen: boolean
 * onClose: () => void
 * title: string
 * onSubmit: (e: FormEvent) => void
 * isSubmitting: boolean
 * children: form fields JSX
 */
export default function AdminModal({ isOpen, onClose, title, onSubmit, isSubmitting, children }) {
  // Tutup modal dengan tombol Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-4">
            {children}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-9 px-4 rounded-xl bg-slate-800 text-sm font-semibold text-white hover:bg-slate-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/admin/AdminTable.jsx frontend/src/components/admin/AdminModal.jsx
git commit -m "feat: add reusable AdminTable and AdminModal components"
```

---

### Task 5: AdminImageUpload

**Files:**
- Create: `frontend/src/components/admin/AdminImageUpload.jsx`

- [ ] **Step 1: Buat AdminImageUpload.jsx**

```jsx
// frontend/src/components/admin/AdminImageUpload.jsx
import { useState } from 'react';
import { supabase } from '../../supabaseClient';

/**
 * bucket: string — nama Supabase Storage bucket ('tools' | 'cases' | 'consultants')
 * currentUrl: string | null — URL gambar yang sudah ada
 * onUpload: (publicUrl: string) => void — dipanggil setelah upload sukses
 */
export default function AdminImageUpload({ bucket, currentUrl, onUpload }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi: hanya gambar, max 5MB
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5MB.');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      onUpload(data.publicUrl);
    } catch (err) {
      setError(`Upload gagal: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Preview gambar saat ini */}
      {currentUrl && (
        <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200">
          <img src={currentUrl} alt="Preview" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Input file */}
      <label className="cursor-pointer inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
        {uploading ? 'Mengupload...' : currentUrl ? 'Ganti Gambar' : 'Upload Gambar'}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="sr-only"
        />
      </label>

      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/admin/AdminImageUpload.jsx
git commit -m "feat: add AdminImageUpload component with Supabase Storage integration"
```

---

## Phase 3 — Admin Pages

### Task 6: AdminConsultations (refactor dari AdminDashboard)

**Files:**
- Create: `frontend/src/pages/admin/AdminConsultations.jsx`

- [ ] **Step 1: Buat folder dan file**

```bash
mkdir -p frontend/src/pages/admin
```

- [ ] **Step 2: Buat AdminConsultations.jsx**

Ambil seluruh logika dari `AdminDashboard.jsx` yang sudah ada, hapus bagian auth check (sudah ditangani `AdminLayout`), dan sesuaikan:

```jsx
// frontend/src/pages/admin/AdminConsultations.jsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabaseClient';

const FILTER_TABS = [
  { key: 'all',        label: 'Semua' },
  { key: 'unassigned', label: 'Belum Diassign' },
  { key: 'assigned',   label: 'Sudah Diassign' },
  { key: 'active',     label: 'Sesi Aktif' },
  { key: 'used',       label: 'Selesai' },
];

const SESSION_STATUSES = [
  { value: 'active',   label: 'Active' },
  { value: 'used',     label: 'Used' },
  { value: 'expired',  label: 'Expired' },
  { value: 'inactive', label: 'Inactive' },
];

function getStatusClass(status) {
  if (status === 'active')   return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'used')     return 'bg-sky-50 text-sky-700 border-sky-200';
  if (status === 'expired')  return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminConsultations() {
  const [consultations, setConsultations] = useState([]);
  const [consultants, setConsultants]     = useState([]);
  const [activeTab, setActiveTab]         = useState('all');
  const [loading, setLoading]             = useState(false);
  const [toast, setToast]                 = useState('');
  const [deletingId, setDeletingId]       = useState(null);
  const [reportFiles, setReportFiles]     = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cResult, consultResult] = await Promise.all([
        supabase
          .from('consultations')
          .select('*, clients(full_name, email, phone_number), consultants(name, phone_number)')
          .order('created_at', { ascending: false }),
        supabase.from('consultants').select('*').eq('is_active', true),
      ]);
      if (!cResult.error) setConsultations(cResult.data || []);
      if (!consultResult.error) setConsultants(consultResult.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    const { data, error } = await supabase.storage.from('reports').list('');
    if (!error) setReportFiles(data || []);
  }, []);

  useEffect(() => { fetchData(); fetchReports(); }, [fetchData, fetchReports]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const filteredConsultations = useMemo(() => {
    if (activeTab === 'unassigned') return consultations.filter((c) => !c.consultant_id);
    if (activeTab === 'assigned')   return consultations.filter((c) => Boolean(c.consultant_id));
    if (activeTab === 'active')     return consultations.filter((c) => c.session_status === 'active');
    if (activeTab === 'used')       return consultations.filter((c) => c.session_status === 'used');
    return consultations;
  }, [activeTab, consultations]);

  const stats = useMemo(() => ({
    total:  consultations.length,
    active: consultations.filter((c) => c.session_status === 'active').length,
    used:   consultations.filter((c) => c.session_status === 'used').length,
  }), [consultations]);

  const updateSessionStatus = async (id, newStatus) => {
    const { error } = await supabase.from('consultations').update({ session_status: newStatus }).eq('id', id);
    if (!error) {
      setToast('Status sesi berhasil diperbarui!');
      setConsultations((prev) => prev.map((c) => c.id === id ? { ...c, session_status: newStatus } : c));
    } else {
      setToast('Gagal memperbarui status.');
    }
  };

  const assignConsultant = async (consultationId, consultantId) => {
    if (!consultantId) return;
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assign-consultant`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ consultation_id: consultationId, consultant_id: consultantId }),
      }
    );
    if (res.ok) { setToast('Konsultan berhasil diassign!'); fetchData(); }
  };

  const deleteConsultation = async (consultationId, clientName = 'klien ini') => {
    if (!window.confirm(`Hapus ${clientName} dari daftar konsultasi?`)) return;
    setDeletingId(consultationId);
    try {
      const { error } = await supabase.from('consultations').delete().eq('id', consultationId);
      if (error) { setToast('Gagal menghapus data.'); return; }
      setConsultations((prev) => prev.filter((c) => c.id !== consultationId));
      setToast('Data berhasil dihapus.');
    } finally {
      setDeletingId(null);
    }
  };

  const downloadReport = async (fileName) => {
    const { data } = await supabase.storage.from('reports').createSignedUrl(fileName, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  const generateReport = async () => {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-report`, {
      headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
    });
    const data = await res.json();
    if (data.success) { alert('✅ Laporan berhasil dibuat!'); fetchReports(); }
  };

  return (
    <section className="px-4 py-10 sm:px-6 sm:py-12 lg:px-10 space-y-7">
      {/* Header */}
      <header className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Manajemen Konsultasi</h1>
            <p className="text-sm text-slate-500 mt-1">Kelola sesi konsultasi, assign konsultan, dan monitor status.</p>
          </div>
          <button
            type="button"
            onClick={fetchData}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors self-start lg:self-auto"
          >
            ↻ Refresh
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Total', value: stats.total, cls: 'border-slate-200 bg-white' },
          { label: 'Aktif', value: stats.active, cls: 'border-emerald-200/70 bg-emerald-50/70 text-emerald-900' },
          { label: 'Selesai', value: stats.used, cls: 'border-sky-200/70 bg-sky-50/70 text-sky-900' },
        ].map(({ label, value, cls }) => (
          <div key={label} className={`rounded-2xl border p-5 shadow-sm ${cls}`}>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.key ? 'bg-slate-800 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-slate-700 animate-spin" />
            </div>
          ) : filteredConsultations.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-2 text-slate-500">
              <p className="text-base font-medium text-slate-700">Tidak ada data</p>
              <p className="text-sm">Data akan muncul setelah ada sesi masuk.</p>
            </div>
          ) : (
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['No','Client','No. HP','Tanggal','Status Sesi','Konsultan','Aksi'].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredConsultations.map((item, index) => {
                  const client = Array.isArray(item.clients) ? item.clients[0] : item.clients;
                  return (
                    <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4 text-slate-500 font-medium">{index + 1}</td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">{client?.full_name || '-'}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{client?.email || '-'}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{client?.phone_number || '-'}</td>
                      <td className="px-5 py-4 text-slate-600 text-xs">{formatDate(item.created_at)}</td>
                      <td className="px-5 py-4">
                        <select
                          value={item.session_status || 'inactive'}
                          onChange={(e) => updateSessionStatus(item.id, e.target.value)}
                          className={`h-8 rounded-xl border px-2.5 text-xs font-semibold focus:outline-none ${getStatusClass(item.session_status)}`}
                        >
                          {SESSION_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={item.consultant_id || ''}
                          onChange={(e) => assignConsultant(item.id, e.target.value)}
                          className="h-8 rounded-xl border border-slate-200 bg-white px-2.5 text-sm text-slate-700 focus:outline-none"
                        >
                          <option value="">Pilih Konsultan</option>
                          {consultants.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => deleteConsultation(item.id, client?.full_name)}
                          disabled={deletingId === item.id}
                          className="inline-flex h-8 items-center rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-60"
                        >
                          {deletingId === item.id ? 'Menghapus...' : 'Hapus'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Laporan */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800">Laporan Harian</h3>
          <button
            type="button"
            onClick={generateReport}
            className="inline-flex h-9 items-center rounded-xl bg-slate-800 px-4 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
          >
            Generate Sekarang
          </button>
        </div>
        {reportFiles.length === 0 ? (
          <div className="flex min-h-36 flex-col items-center justify-center text-slate-500">
            <p className="font-medium text-slate-700">Belum ada laporan</p>
            <p className="text-sm mt-1">Klik Generate Sekarang untuk membuat laporan terbaru.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['File','Tanggal','Aksi'].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportFiles.map((file) => (
                <tr key={file.name} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-5 py-4 font-medium text-slate-800">{file.name}</td>
                  <td className="px-5 py-4 text-slate-600 text-xs">
                    {file.created_at ? new Date(file.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => downloadReport(file.name)}
                      className="inline-flex h-8 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 shadow-lg">
          {toast}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/admin/AdminConsultations.jsx
git commit -m "feat: add AdminConsultations page (refactored from AdminDashboard)"
```

---

### Task 7: AdminTools

**Files:**
- Create: `frontend/src/pages/admin/AdminTools.jsx`

- [ ] **Step 1: Buat AdminTools.jsx**

```jsx
// frontend/src/pages/admin/AdminTools.jsx
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import AdminTable from '../../components/admin/AdminTable';
import AdminModal from '../../components/admin/AdminModal';
import AdminImageUpload from '../../components/admin/AdminImageUpload';

const EMPTY_FORM = {
  name: '', slug: '', description: '', thumbnail_url: '',
  tags: '', video_url: '', is_active: true,
};

function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

const COLUMNS = [
  { key: 'name', label: 'Nama' },
  { key: 'tags', label: 'Tags', render: (v) => (v || []).join(', ') || '-' },
  {
    key: 'is_active', label: 'Status',
    render: (v) => (
      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${v ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
        {v ? 'Aktif' : 'Nonaktif'}
      </span>
    ),
  },
];

export default function AdminTools() {
  const [data, setData]             = useState([]);
  const [loading, setLoading]       = useState(false);
  const [toast, setToast]           = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [modalOpen, setModalOpen]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await supabase.from('tools').select('*').order('created_at', { ascending: false });
    if (!error) setData(rows || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => { setEditingId(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({ ...row, tags: (row.tags || []).join(', ') });
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditingId(null); setForm(EMPTY_FORM); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      ...form,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      slug: form.slug || slugify(form.name),
    };
    delete payload.id;
    delete payload.created_at;

    const { error } = editingId
      ? await supabase.from('tools').update(payload).eq('id', editingId)
      : await supabase.from('tools').insert([payload]);

    if (error) { showToast(`Gagal: ${error.message}`); }
    else { showToast(editingId ? 'Tool berhasil diperbarui!' : 'Tool berhasil ditambahkan!'); closeModal(); fetchData(); }
    setSubmitting(false);
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Hapus tool "${row.name}"?`)) return;
    setDeletingId(row.id);
    const { error } = await supabase.from('tools').delete().eq('id', row.id);
    if (error) { showToast('Gagal menghapus.'); }
    else { setData((prev) => prev.filter((t) => t.id !== row.id)); showToast('Tool dihapus.'); }
    setDeletingId(null);
  };

  const fc = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({
      ...prev,
      [field]: val,
      ...(field === 'name' && !editingId ? { slug: slugify(val) } : {}),
    }));
  };

  return (
    <section className="px-4 py-10 sm:px-6 lg:px-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tools / Instrumen</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola daftar instrumen teknis yang ditampilkan di halaman client.</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-800 px-4 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
        >
          + Tambah Tool
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <AdminTable columns={COLUMNS} data={data} onEdit={openEdit} onDelete={handleDelete} loading={loading} deletingId={deletingId} />
      </div>

      {/* Modal */}
      <AdminModal isOpen={modalOpen} onClose={closeModal} title={editingId ? 'Edit Tool' : 'Tambah Tool'} onSubmit={handleSubmit} isSubmitting={submitting}>
        {/* Nama */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Nama *</label>
          <input value={form.name} onChange={fc('name')} required className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
        </div>
        {/* Slug */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Slug *</label>
          <input value={form.slug} onChange={fc('slug')} required className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" placeholder="auto-diisi dari nama" />
        </div>
        {/* Tags */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Tags (pisahkan dengan koma)</label>
          <input value={form.tags} onChange={fc('tags')} className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" placeholder="Corrosion Analysis, Structural Inspection" />
        </div>
        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Deskripsi</label>
          <textarea value={form.description} onChange={fc('description')} rows={4} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none" />
        </div>
        {/* Video URL */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">URL Video YouTube</label>
          <input value={form.video_url} onChange={fc('video_url')} className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" placeholder="https://www.youtube.com/watch?v=..." />
        </div>
        {/* Thumbnail */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Thumbnail</label>
          <AdminImageUpload bucket="tools" currentUrl={form.thumbnail_url} onUpload={(url) => setForm((prev) => ({ ...prev, thumbnail_url: url }))} />
        </div>
        {/* Active */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.is_active} onChange={fc('is_active')} className="w-4 h-4 rounded" />
          <span className="text-sm font-medium text-slate-700">Tampilkan di halaman client</span>
        </label>
      </AdminModal>

      {/* Toast */}
      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 shadow-lg">
          {toast}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/admin/AdminTools.jsx
git commit -m "feat: add AdminTools page with full CRUD"
```

---

### Task 8: AdminCases

**Files:**
- Create: `frontend/src/pages/admin/AdminCases.jsx`

- [ ] **Step 1: Buat AdminCases.jsx**

```jsx
// frontend/src/pages/admin/AdminCases.jsx
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import AdminTable from '../../components/admin/AdminTable';
import AdminModal from '../../components/admin/AdminModal';
import AdminImageUpload from '../../components/admin/AdminImageUpload';

const EMPTY_FORM = {
  title: '', slug: '', summary: '', full_description: '',
  cover_image_url: '', category: '', tags: '',
  status: 'draft', sort_order: 0,
};

function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

const COLUMNS = [
  { key: 'title', label: 'Judul' },
  { key: 'category', label: 'Kategori' },
  {
    key: 'status', label: 'Status',
    render: (v) => (
      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${v === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
        {v === 'published' ? 'Published' : 'Draft'}
      </span>
    ),
  },
  { key: 'sort_order', label: 'Urutan' },
];

export default function AdminCases() {
  const [data, setData]             = useState([]);
  const [loading, setLoading]       = useState(false);
  const [toast, setToast]           = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [modalOpen, setModalOpen]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await supabase.from('cases').select('*').order('sort_order', { ascending: true });
    if (!error) setData(rows || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd  = () => { setEditingId(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({ ...row, tags: (row.tags || []).join(', ') });
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditingId(null); setForm(EMPTY_FORM); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      ...form,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      slug: form.slug || slugify(form.title),
      sort_order: Number(form.sort_order) || 0,
    };
    delete payload.id;
    delete payload.created_at;

    const { error } = editingId
      ? await supabase.from('cases').update(payload).eq('id', editingId)
      : await supabase.from('cases').insert([payload]);

    if (error) { showToast(`Gagal: ${error.message}`); }
    else { showToast(editingId ? 'Case berhasil diperbarui!' : 'Case berhasil ditambahkan!'); closeModal(); fetchData(); }
    setSubmitting(false);
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Hapus case "${row.title}"?`)) return;
    setDeletingId(row.id);
    const { error } = await supabase.from('cases').delete().eq('id', row.id);
    if (error) { showToast('Gagal menghapus.'); }
    else { setData((prev) => prev.filter((c) => c.id !== row.id)); showToast('Case dihapus.'); }
    setDeletingId(null);
  };

  const fc = (field) => (e) => {
    const val = e.target.value;
    setForm((prev) => ({
      ...prev,
      [field]: val,
      ...(field === 'title' && !editingId ? { slug: slugify(val) } : {}),
    }));
  };

  return (
    <section className="px-4 py-10 sm:px-6 lg:px-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Case Study</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola portofolio case study. Status "Draft" tidak tampil di halaman client.</p>
        </div>
        <button type="button" onClick={openAdd} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-800 px-4 text-sm font-semibold text-white hover:bg-slate-700 transition-colors">
          + Tambah Case
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <AdminTable columns={COLUMNS} data={data} onEdit={openEdit} onDelete={handleDelete} loading={loading} deletingId={deletingId} />
      </div>

      <AdminModal isOpen={modalOpen} onClose={closeModal} title={editingId ? 'Edit Case' : 'Tambah Case'} onSubmit={handleSubmit} isSubmitting={submitting}>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Judul *</label>
          <input value={form.title} onChange={fc('title')} required className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Slug *</label>
          <input value={form.slug} onChange={fc('slug')} required className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Kategori</label>
          <input value={form.category} onChange={fc('category')} className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Tags (pisahkan koma)</label>
          <input value={form.tags} onChange={fc('tags')} className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Summary (ditampilkan di card list)</label>
          <textarea value={form.summary} onChange={fc('summary')} rows={2} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Deskripsi Lengkap (halaman detail)</label>
          <textarea value={form.full_description} onChange={fc('full_description')} rows={5} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Cover Image</label>
          <AdminImageUpload bucket="cases" currentUrl={form.cover_image_url} onUpload={(url) => setForm((prev) => ({ ...prev, cover_image_url: url }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
            <select value={form.status} onChange={fc('status')} className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Urutan</label>
            <input type="number" value={form.sort_order} onChange={fc('sort_order')} min="0" className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
          </div>
        </div>
      </AdminModal>

      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 shadow-lg">{toast}</div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/admin/AdminCases.jsx
git commit -m "feat: add AdminCases page with full CRUD and draft/published toggle"
```

---

### Task 9: AdminConsultants

**Files:**
- Create: `frontend/src/pages/admin/AdminConsultants.jsx`

- [ ] **Step 1: Buat AdminConsultants.jsx**

```jsx
// frontend/src/pages/admin/AdminConsultants.jsx
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import AdminTable from '../../components/admin/AdminTable';
import AdminModal from '../../components/admin/AdminModal';
import AdminImageUpload from '../../components/admin/AdminImageUpload';

const EMPTY_FORM = {
  name: '', title: '', description: '', photo_url: '',
  phone_number: '', is_active: true, sort_order: 0,
};

const COLUMNS = [
  { key: 'name',  label: 'Nama' },
  { key: 'title', label: 'Jabatan' },
  { key: 'phone_number', label: 'No. HP' },
  {
    key: 'is_active', label: 'Status',
    render: (v) => (
      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${v ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
        {v ? 'Aktif' : 'Nonaktif'}
      </span>
    ),
  },
  { key: 'sort_order', label: 'Urutan' },
];

export default function AdminConsultants() {
  const [data, setData]             = useState([]);
  const [loading, setLoading]       = useState(false);
  const [toast, setToast]           = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [modalOpen, setModalOpen]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await supabase.from('consultants').select('*').order('sort_order', { ascending: true });
    if (!error) setData(rows || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd  = () => { setEditingId(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (row) => { setEditingId(row.id); setForm({ ...EMPTY_FORM, ...row }); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingId(null); setForm(EMPTY_FORM); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = { ...form, sort_order: Number(form.sort_order) || 0 };
    delete payload.id;
    delete payload.created_at;

    const { error } = editingId
      ? await supabase.from('consultants').update(payload).eq('id', editingId)
      : await supabase.from('consultants').insert([payload]);

    if (error) { showToast(`Gagal: ${error.message}`); }
    else { showToast(editingId ? 'Konsultan diperbarui!' : 'Konsultan ditambahkan!'); closeModal(); fetchData(); }
    setSubmitting(false);
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Hapus konsultan "${row.name}"?`)) return;
    setDeletingId(row.id);
    const { error } = await supabase.from('consultants').delete().eq('id', row.id);
    if (error) { showToast('Gagal menghapus.'); }
    else { setData((prev) => prev.filter((c) => c.id !== row.id)); showToast('Konsultan dihapus.'); }
    setDeletingId(null);
  };

  const fc = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  return (
    <section className="px-4 py-10 sm:px-6 lg:px-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Konsultan</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola profil tim konsultan yang tampil di halaman Tim.</p>
        </div>
        <button type="button" onClick={openAdd} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-800 px-4 text-sm font-semibold text-white hover:bg-slate-700 transition-colors">
          + Tambah Konsultan
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <AdminTable columns={COLUMNS} data={data} onEdit={openEdit} onDelete={handleDelete} loading={loading} deletingId={deletingId} />
      </div>

      <AdminModal isOpen={modalOpen} onClose={closeModal} title={editingId ? 'Edit Konsultan' : 'Tambah Konsultan'} onSubmit={handleSubmit} isSubmitting={submitting}>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Nama *</label>
          <input value={form.name} onChange={fc('name')} required className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Jabatan / Spesialisasi</label>
          <input value={form.title} onChange={fc('title')} className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" placeholder="Senior Structural Engineer" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Bio Singkat</label>
          <textarea value={form.description} onChange={fc('description')} rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">No. HP</label>
          <input value={form.phone_number} onChange={fc('phone_number')} className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" placeholder="08xx-xxxx-xxxx" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Foto Profil</label>
          <AdminImageUpload bucket="consultants" currentUrl={form.photo_url} onUpload={(url) => setForm((prev) => ({ ...prev, photo_url: url }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Urutan tampil</label>
            <input type="number" value={form.sort_order} onChange={fc('sort_order')} min="0" className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={fc('is_active')} className="w-4 h-4 rounded" />
              <span className="text-sm font-medium text-slate-700">Aktif</span>
            </label>
          </div>
        </div>
      </AdminModal>

      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 shadow-lg">{toast}</div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/admin/AdminConsultants.jsx
git commit -m "feat: add AdminConsultants page with full CRUD"
```

---

### Task 10: AdminPricing

**Files:**
- Create: `frontend/src/pages/admin/AdminPricing.jsx`

- [ ] **Step 1: Buat AdminPricing.jsx**

```jsx
// frontend/src/pages/admin/AdminPricing.jsx
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import AdminTable from '../../components/admin/AdminTable';
import AdminModal from '../../components/admin/AdminModal';

const EMPTY_FORM = {
  name: '', tag_label: '', description: '', price: '',
  features: '', is_featured: false, sort_order: 0, is_active: true,
};

const COLUMNS = [
  { key: 'name',      label: 'Nama Tier' },
  { key: 'tag_label', label: 'Label' },
  { key: 'price',     label: 'Harga (Rp)', render: (v) => v ? Number(v).toLocaleString('id-ID') : '-' },
  {
    key: 'is_featured', label: 'Featured',
    render: (v) => v ? <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">Featured</span> : '-',
  },
  {
    key: 'is_active', label: 'Status',
    render: (v) => (
      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${v ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
        {v ? 'Aktif' : 'Nonaktif'}
      </span>
    ),
  },
  { key: 'sort_order', label: 'Urutan' },
];

export default function AdminPricing() {
  const [data, setData]             = useState([]);
  const [loading, setLoading]       = useState(false);
  const [toast, setToast]           = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [modalOpen, setModalOpen]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await supabase.from('pricing_plans').select('*').order('sort_order', { ascending: true });
    if (!error) setData(rows || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd  = () => { setEditingId(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({ ...EMPTY_FORM, ...row, features: (row.features || []).join('\n') });
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditingId(null); setForm(EMPTY_FORM); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      ...form,
      price: form.price ? Number(form.price) : null,
      features: form.features.split('\n').map((f) => f.trim()).filter(Boolean),
      sort_order: Number(form.sort_order) || 0,
    };
    delete payload.id;
    delete payload.created_at;

    const { error } = editingId
      ? await supabase.from('pricing_plans').update(payload).eq('id', editingId)
      : await supabase.from('pricing_plans').insert([payload]);

    if (error) { showToast(`Gagal: ${error.message}`); }
    else { showToast(editingId ? 'Pricing diperbarui!' : 'Pricing ditambahkan!'); closeModal(); fetchData(); }
    setSubmitting(false);
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Hapus pricing "${row.name}"?`)) return;
    setDeletingId(row.id);
    const { error } = await supabase.from('pricing_plans').delete().eq('id', row.id);
    if (error) { showToast('Gagal menghapus.'); }
    else { setData((prev) => prev.filter((p) => p.id !== row.id)); showToast('Pricing dihapus.'); }
    setDeletingId(null);
  };

  const fc = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  return (
    <section className="px-4 py-10 sm:px-6 lg:px-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pricing Plans</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola semua tier harga termasuk Pre-Assessment dan Assessment.</p>
        </div>
        <button type="button" onClick={openAdd} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-800 px-4 text-sm font-semibold text-white hover:bg-slate-700 transition-colors">
          + Tambah Pricing
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <AdminTable columns={COLUMNS} data={data} onEdit={openEdit} onDelete={handleDelete} loading={loading} deletingId={deletingId} />
      </div>

      <AdminModal isOpen={modalOpen} onClose={closeModal} title={editingId ? 'Edit Pricing' : 'Tambah Pricing'} onSubmit={handleSubmit} isSubmitting={submitting}>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Tier *</label>
          <input value={form.name} onChange={fc('name')} required className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" placeholder="Basic / Intermediate / Pre-Assessment" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Label Tag</label>
          <input value={form.tag_label} onChange={fc('tag_label')} className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" placeholder="Kerusakan Ringan" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Harga (Rp)</label>
          <input type="number" value={form.price} onChange={fc('price')} min="0" className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" placeholder="500000" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Deskripsi</label>
          <textarea value={form.description} onChange={fc('description')} rows={2} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Fitur (satu per baris)</label>
          <textarea value={form.features} onChange={fc('features')} rows={5} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none" placeholder={"Analisis kondisi bangunan\nIdentifikasi kerusakan visual\nLaporan ringkas"} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Urutan</label>
            <input type="number" value={form.sort_order} onChange={fc('sort_order')} min="0" className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={fc('is_featured')} className="w-4 h-4 rounded" />
              <span className="text-sm font-medium text-slate-700">Featured</span>
            </label>
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={fc('is_active')} className="w-4 h-4 rounded" />
              <span className="text-sm font-medium text-slate-700">Aktif</span>
            </label>
          </div>
        </div>
      </AdminModal>

      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 shadow-lg">{toast}</div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/admin/AdminPricing.jsx
git commit -m "feat: add AdminPricing page with full CRUD"
```

---

## Phase 4 — Update Routing

### Task 11: Update App.jsx

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Update App.jsx**

Ganti seluruh isi `App.jsx` dengan:

```jsx
// frontend/src/App.jsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Layout from './components/Layout';
import FullscreenLoader from './components/FullscreenLoader';
import AdminLayout from './layouts/AdminLayout';
import AdminLoginPage from './pages/AdminLoginPage';

// Public pages
const Home                  = lazy(() => import('./pages/Home'));
const NewTools              = lazy(() => import('./pages/NewTools'));
const ToolDetail            = lazy(() => import('./pages/ToolDetail'));
const Case                  = lazy(() => import('./pages/Case'));
const CaseDetail            = lazy(() => import('./pages/CaseDetail'));
const PreassessmentPage     = lazy(() => import('./pages/PreassessmentPage'));
const ReviewConfirmationPage = lazy(() => import('./pages/ReviewConfirmationPage'));
const WaitingPage           = lazy(() => import('./pages/WaitingPage'));
const PaymentSuccessPage    = lazy(() => import('./pages/PaymentSuccessPage'));
const PaymentPendingPage    = lazy(() => import('./pages/PaymentPendingPage'));
const PaymentFailedPage     = lazy(() => import('./pages/PaymentFailedPage'));
const PaymentUploadPage     = lazy(() => import('./pages/PaymentUploadPage'));
const SessionUsedPage       = lazy(() => import('./pages/SessionUsedPage'));
const SessionPendingPage    = lazy(() => import('./pages/SessionPendingPage'));
const SessionExpiredPage    = lazy(() => import('./pages/SessionExpiredPage'));
const SessionInvalidPage    = lazy(() => import('./pages/SessionInvalidPage'));
const JoinPage              = lazy(() => import('./pages/JoinPage'));
const Pricing               = lazy(() => import('./pages/Pricing'));

// Admin pages
const AdminConsultations = lazy(() => import('./pages/admin/AdminConsultations'));
const AdminTools         = lazy(() => import('./pages/admin/AdminTools'));
const AdminCases         = lazy(() => import('./pages/admin/AdminCases'));
const AdminConsultants   = lazy(() => import('./pages/admin/AdminConsultants'));
const AdminPricing       = lazy(() => import('./pages/admin/AdminPricing'));

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<FullscreenLoader />}>
        <Routes>
          {/* Public routes */}
          <Route element={<Layout />}>
            <Route path="/"                               element={<Home />} />
            <Route path="/tool"                           element={<NewTools />} />
            <Route path="/tool/:slug"                     element={<ToolDetail />} />
            <Route path="/case"                           element={<Case />} />
            <Route path="/case/:slug"                     element={<CaseDetail />} />
            <Route path="/preassessment"                  element={<PreassessmentPage />} />
            <Route path="/preassessment/review-confirmation" element={<ReviewConfirmationPage />} />
            <Route path="/waiting"                        element={<WaitingPage />} />
            <Route path="/payment/success"                element={<PaymentSuccessPage />} />
            <Route path="/payment/failed"                 element={<PaymentFailedPage />} />
            <Route path="/payment/pending"                element={<PaymentPendingPage />} />
            <Route path="/payment/upload"                 element={<PaymentUploadPage />} />
            <Route path="/payment-error"                  element={<PaymentFailedPage />} />
            <Route path="/session-used"                   element={<SessionUsedPage />} />
            <Route path="/session-pending"                element={<SessionPendingPage />} />
            <Route path="/session-expired"                element={<SessionExpiredPage />} />
            <Route path="/session-invalid"                element={<SessionInvalidPage />} />
            <Route path="/join"                           element={<JoinPage />} />
            <Route path="/pricing"                        element={<Pricing />} />
          </Route>

          {/* Admin login (tidak pakai AdminLayout) */}
          <Route path="/admin-login" element={<AdminLoginPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Admin routes — pakai AdminLayout sebagai wrapper */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/consultations" replace />} />
            <Route path="consultations" element={<AdminConsultations />} />
            <Route path="tools"         element={<AdminTools />} />
            <Route path="cases"         element={<AdminCases />} />
            <Route path="consultants"   element={<AdminConsultants />} />
            <Route path="pricing"       element={<AdminPricing />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
```

- [ ] **Step 2: Verifikasi routing admin**

Jalankan dev server:
```bash
cd frontend && npm run dev
```

Buka browser → `http://localhost:5173/admin` → seharusnya redirect ke `/admin/login` (belum login).
Login → setelah login, buka `/admin/consultations` → sidebar muncul, halaman consultations tampil.
Klik semua item sidebar: Tools, Cases, Konsultan, Pricing → masing-masing halamannya muncul.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: update routing — AdminLayout with sidebar, route /admin/* per entity"
```

---

## Phase 5 — Client Hooks

### Task 12: Custom hooks untuk fetch Supabase

**Files:**
- Create: `frontend/src/hooks/useTools.js`
- Create: `frontend/src/hooks/useCases.js`
- Create: `frontend/src/hooks/usePricing.js`
- Create: `frontend/src/hooks/useConsultants.js`

- [ ] **Step 1: Buat useTools.js**

```js
// frontend/src/hooks/useTools.js
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export function useTools() {
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: rows, error: err } = await supabase
      .from('tools')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });
    if (err) setError(err.message);
    else setData(rows || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
```

- [ ] **Step 2: Buat useCases.js**

```js
// frontend/src/hooks/useCases.js
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export function useCases() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: rows, error: err } = await supabase
      .from('cases')
      .select('*')
      .eq('status', 'published')
      .order('sort_order', { ascending: true });
    if (err) setError(err.message);
    else setData(rows || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
```

- [ ] **Step 3: Buat usePricing.js**

```js
// frontend/src/hooks/usePricing.js
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export function usePricing() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: rows, error: err } = await supabase
      .from('pricing_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (err) setError(err.message);
    else setData(rows || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
```

- [ ] **Step 4: Buat useConsultants.js**

```js
// frontend/src/hooks/useConsultants.js
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export function useConsultants() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: rows, error: err } = await supabase
      .from('consultants')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (err) setError(err.message);
    else setData(rows || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/useTools.js frontend/src/hooks/useCases.js frontend/src/hooks/usePricing.js frontend/src/hooks/useConsultants.js
git commit -m "feat: add Supabase data hooks (useTools, useCases, usePricing, useConsultants)"
```

---

## Phase 6 — Client Page Migration

### Task 13: Migrate NewTools & ToolDetail

**Files:**
- Modify: `frontend/src/pages/NewTools.jsx`
- Modify: `frontend/src/pages/ToolDetail.jsx`

- [ ] **Step 1: Update NewTools.jsx**

Ganti bagian import dan data fetch. Ubah dua bagian ini:

**Hapus:**
```js
import toolClusters from "../data/tools";
```

**Tambah di baris pertama:**
```js
import { useTools } from "../hooks/useTools";
```

**Hapus:**
```js
export default function NewTools() {
    const allTools = toolClusters.flatMap(c => c.tools);
```

**Ganti dengan:**
```jsx
export default function NewTools() {
    const { data: allTools, loading, error } = useTools();

    if (loading) {
        return (
            <div className="bg-white flex items-center justify-center" style={{ minHeight: '60vh', paddingTop: '7rem' }}>
                <div className="w-8 h-8 border-4 border-slate-200 border-t-[#F58220] rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white flex items-center justify-center" style={{ minHeight: '60vh', paddingTop: '7rem' }}>
                <div className="text-center px-4">
                    <p className="text-sm font-semibold text-slate-500">Gagal memuat data. Silakan refresh halaman.</p>
                </div>
            </div>
        );
    }
```

**Ubah** di dalam `ToolCard` — `tool.image` → `tool.thumbnail_url`:
```jsx
// Baris dengan OptimizedImage, ganti src:
src={tool.thumbnail_url}
// Baris dengan to={`/tool/${tool.id}`}, ganti dengan:
to={`/tool/${tool.slug}`}
// Baris dengan tool.tags[0] — tidak berubah
```

**Ubah** counter di bawah header:
```jsx
// Ganti String(allTools.length) — sudah benar, tidak perlu ubah
```

- [ ] **Step 2: Update ToolDetail.jsx**

**Hapus:**
```js
import toolDetails from "../data/toolDetails";
```

**Tambah di bagian import:**
```js
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
```

**Ganti:**
```js
export default function ToolDetail() {
    const { id } = useParams();
    const tool = toolDetails.find(t => t.id === id);
```

**Dengan:**
```jsx
export default function ToolDetail() {
    const { slug } = useParams();
    const [tool, setTool]     = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase
            .from('tools')
            .select('*')
            .eq('slug', slug)
            .eq('is_active', true)
            .maybeSingle()
            .then(({ data }) => { setTool(data); setLoading(false); });
    }, [slug]);

    if (loading) {
        return (
            <div className="bg-white flex items-center justify-center" style={{ minHeight: '60vh', paddingTop: '7rem' }}>
                <div className="w-8 h-8 border-4 border-slate-200 border-t-[#F58220] rounded-full animate-spin" />
            </div>
        );
    }
```

**Ubah** semua `tool.image` → `tool.thumbnail_url` di dalam return JSX (ada 2 tempat: src OptimizedImage dan kondisi `if (tool.image)`):
```jsx
// Kondisi gambar:
{tool.thumbnail_url ? (
    <OptimizedImage src={tool.thumbnail_url} ... />
) : ( ... )}
```

- [ ] **Step 3: Verifikasi**

Buka `http://localhost:5173/tool` — daftar tools muncul (dari Supabase, bukan file statis).
Klik salah satu tool → halaman detail tampil dengan benar.

*Catatan: Jika tabel `tools` masih kosong, halaman akan tampil empty state yang valid. Isi data dulu dari `/admin/tools`.*

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/NewTools.jsx frontend/src/pages/ToolDetail.jsx
git commit -m "feat: migrate Tools pages to read from Supabase"
```

---

### Task 14: Migrate Case & CaseDetail

**Files:**
- Modify: `frontend/src/pages/Case.jsx`
- Modify: `frontend/src/pages/CaseDetail.jsx`

- [ ] **Step 1: Update Case.jsx**

**Hapus:**
```js
import cases from "../data/cases";
```

**Tambah:**
```js
import { useCases } from "../hooks/useCases";
```

**Ganti bagian dalam `function Case()`:**

```jsx
function Case() {
    const prefersReduced = useReducedMotion();
    const { data: cases, loading, error } = useCases();

    if (loading) {
        return (
            <section className="bg-white pt-32 pb-24 px-4 sm:px-6 md:px-8 flex items-center justify-center" style={{ minHeight: '60vh' }}>
                <div className="w-8 h-8 border-4 border-slate-200 border-t-[#F58220] rounded-full animate-spin" />
            </section>
        );
    }
    // ... (sisa JSX tetap sama)
```

**Ubah** di dalam `.map()`:
```jsx
// Ganti:
{cases.map(({ id, img, title, description, to }, index) => (
    <CardCase img={img} title={title} description={description} to={to} index={index} />
))}

// Dengan:
{cases.map((item, index) => (
    <CardCase
        key={item.id}
        img={item.cover_image_url}
        title={item.title}
        description={item.summary}
        to={`/case/${item.slug}`}
        index={index}
    />
))}
```

- [ ] **Step 2: Update CaseDetail.jsx**

**Hapus:**
```js
import caseDetails from "../data/caseDetails";
```

**Tambah:**
```js
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
```

**Ganti:**
```js
function CaseDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const prefersReduced = useReducedMotion();
    const caseItem = caseDetails.find((c) => String(c.id) === id);
```

**Dengan:**
```jsx
function CaseDetail() {
    const { slug } = useParams();
    const navigate  = useNavigate();
    const prefersReduced = useReducedMotion();
    const [caseItem, setCaseItem] = useState(null);
    const [loading, setLoading]   = useState(true);

    useEffect(() => {
        supabase
            .from('cases')
            .select('*')
            .eq('slug', slug)
            .eq('status', 'published')
            .maybeSingle()
            .then(({ data }) => { setCaseItem(data); setLoading(false); });
    }, [slug]);

    if (loading) {
        return (
            <section className="bg-white pt-32 pb-24 px-4 flex items-center justify-center" style={{ minHeight: '60vh' }}>
                <div className="w-8 h-8 border-4 border-slate-200 border-t-[#F58220] rounded-full animate-spin" />
            </section>
        );
    }
```

**Ubah** referensi field di JSX:
- `caseItem.img` → `caseItem.cover_image_url`
- `caseItem.description` → `caseItem.full_description`

- [ ] **Step 3: Verifikasi**

Buka `/case` → daftar case muncul. Klik salah satu → detail tampil.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Case.jsx frontend/src/pages/CaseDetail.jsx
git commit -m "feat: migrate Case pages to read from Supabase"
```

---

### Task 15: Migrate Pricing

**Files:**
- Modify: `frontend/src/pages/Pricing.jsx`

- [ ] **Step 1: Tambah hook di Pricing.jsx**

Tambah import di bagian atas:
```js
import { usePricing } from "../hooks/usePricing";
```

Di dalam `export default function Pricing()`, tambah:
```js
const { data: pricingPlans, loading: pricingLoading } = usePricing();
```

- [ ] **Step 2: Ganti `tierData` hardcoded dengan data dari DB**

**Hapus** definisi `tierData` dan `assessFeatures` yang hardcoded.

**Ganti** bagian render tiers:
```jsx
// Sebelum: {tierData.map((tier, i) => ...)}
// Sesudah:
{pricingPlans
  .filter((p) => p.name !== 'Pre-Assessment')
  .map((tier, i) => (
    <motion.div
      key={tier.id}
      className="flex flex-col p-7 relative overflow-hidden"
      style={{
        background: tier.is_featured ? darkNav : 'white',
        borderRight: i < 2 ? `1px solid ${rule}` : 'none',
      }}
      {...fadeUp(i * 0.1)}
    >
      {tier.is_featured && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: orange }} />
      )}
      <span className="self-start text-[9px] font-bold tracking-[0.18em] uppercase mb-5 px-2.5 py-1"
        style={{
          background: tier.is_featured ? 'rgba(217,119,6,0.18)' : 'rgba(0,61,107,0.06)',
          color: tier.is_featured ? orange : muted,
          fontFamily: "'Manrope', sans-serif",
        }}
      >
        {tier.tag_label}
      </span>
      <h3 className="font-bold-hero leading-none tracking-[-0.02em] mb-3"
        style={{ fontSize: 'clamp(1.5rem, 2.2vw, 2rem)', color: tier.is_featured ? 'white' : blue }}
      >
        {tier.name}
      </h3>
      <div className="flex items-center gap-2 mb-4">
        <div style={{ height: 1, width: 20, background: orange }} />
      </div>
      <p className="text-sm leading-relaxed mb-6"
        style={{ color: tier.is_featured ? 'rgba(255,255,255,0.55)' : muted, fontFamily: "'Manrope', sans-serif" }}
      >
        {tier.description}
      </p>
      <ul className="flex flex-col gap-3 mt-auto">
        {(tier.features || []).map((item, ii) => (
          <li key={ii} className="flex items-start gap-3">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
              <path d="M2.5 7l3 3 6-6" stroke={orange} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: '0.8rem', lineHeight: 1.6, color: tier.is_featured ? 'rgba(255,255,255,0.7)' : blue, fontFamily: "'Manrope', sans-serif" }}>
              {item}
            </span>
          </li>
        ))}
      </ul>
    </motion.div>
  ))
}
```

**Ubah** harga Pre-Assessment di CTA — ambil dari DB:
```jsx
// Cari plan Pre-Assessment
const preAssessmentPlan = pricingPlans.find((p) => p.name === 'Pre-Assessment');
const preAssessmentPrice = preAssessmentPlan
  ? `Rp ${Number(preAssessmentPlan.price).toLocaleString('id-ID')}`
  : 'Rp 500.000';

// Ubah teks tombol CTA:
Coba Pre-Assessment — {preAssessmentPrice}
```

**Ubah** harga Assessment di hero section:
```jsx
const assessmentPlan = pricingPlans.find((p) => p.name !== 'Pre-Assessment' && p.price);
const assessmentBasePrice = assessmentPlan
  ? `Rp ${Number(assessmentPlan.price).toLocaleString('id-ID')}`
  : 'Rp 5.700.000';

// Di hero section:
{assessmentBasePrice}
```

- [ ] **Step 3: Verifikasi**

Buka `/pricing` → tier cards muncul dari DB. Harga Pre-Assessment dan Assessment menggunakan nilai dari DB.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Pricing.jsx
git commit -m "feat: migrate Pricing page to read from Supabase"
```

---

### Task 16: Migrate Team (Consultants)

**Files:**
- Modify: `frontend/src/components/Team.jsx`
- Modify: `frontend/src/components/Card/CardConsultant.jsx`

- [ ] **Step 1: Update CardConsultant.jsx**

Ganti prop `image` dengan `photo_url` (field dari DB) dengan tetap menjaga backward-compatibility:

```jsx
// Ubah signature props:
export default function CardConsultant({
    name        = "Consultant",
    title       = "",
    description = "",
    photo_url   = null,   // ← ganti 'image' dengan 'photo_url'
}) {
    // ...

    // Ganti semua referensi 'image' dengan 'photo_url':
    // src={image} → src={photo_url || dummyImage}
    // alt={name} — tidak berubah

    return (
        <div ...>
            <div ...>
                <OptimizedImage
                    src={photo_url || dummyImage}   // ← di sini
                    alt={name}
                    ...
                />
```

**Hapus** import yang tidak lagi digunakan:
```js
// Hapus baris ini:
import dummyImage from "../../assets/teamImage/dummyImage.png";
import Badar from "../../assets/teamImage/Badar.webp";

// Ganti dengan default lokal:
const FALLBACK_IMAGE = 'https://via.placeholder.com/400x500?text=Foto+Tidak+Tersedia';
// Dan gunakan FALLBACK_IMAGE sebagai fallback: src={photo_url || FALLBACK_IMAGE}
```

- [ ] **Step 2: Update Team.jsx**

**Hapus:**
```js
import consultants from "../data/consultants";
```

**Tambah:**
```js
import { useConsultants } from "../hooks/useConsultants";
```

**Ganti:**
```jsx
export default function Team() {
    return (
        // ...
        {consultants.map((consultant, i) => (
```

**Dengan:**
```jsx
export default function Team() {
    const { data: consultants, loading } = useConsultants();

    // Render loading state di dalam section (tidak mengubah layout):
    // Tambahkan di dalam grid div:
    {loading ? (
        <div className="col-span-5 flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-white/20 border-t-white/60 rounded-full animate-spin" />
        </div>
    ) : consultants.map((consultant, i) => (
        <motion.div key={consultant.id} ...>
            <CardConsultant
                name={consultant.name}
                title={consultant.title}
                description={consultant.description}
                photo_url={consultant.photo_url}
            />
        </motion.div>
    ))}
```

- [ ] **Step 3: Verifikasi**

Buka homepage → section Tim muncul dengan data dari Supabase.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/Team.jsx frontend/src/components/Card/CardConsultant.jsx
git commit -m "feat: migrate Team section to read consultants from Supabase"
```

---

## Phase 7 — Cleanup

### Task 17: Hapus file statis dan isi data awal

**Files:**
- Delete: `frontend/src/data/tools.js`
- Delete: `frontend/src/data/toolDetails.js`
- Delete: `frontend/src/data/cases.js`
- Delete: `frontend/src/data/caseDetails.js`
- Delete: `frontend/src/data/consultants.js`

- [ ] **Step 1: Verifikasi semua halaman tidak lagi import file statis**

```bash
grep -r "from.*data/tools"       frontend/src --include="*.jsx" --include="*.js"
grep -r "from.*data/toolDetails" frontend/src --include="*.jsx" --include="*.js"
grep -r "from.*data/cases"       frontend/src --include="*.jsx" --include="*.js"
grep -r "from.*data/caseDetails" frontend/src --include="*.jsx" --include="*.js"
grep -r "from.*data/consultants" frontend/src --include="*.jsx" --include="*.js"
```

Expected output: tidak ada hasil (semua import sudah dihapus).

- [ ] **Step 2: Hapus file**

```bash
rm frontend/src/data/tools.js
rm frontend/src/data/toolDetails.js
rm frontend/src/data/cases.js
rm frontend/src/data/caseDetails.js
rm frontend/src/data/consultants.js
```

- [ ] **Step 3: Build test — pastikan tidak ada error**

```bash
cd frontend && npm run build
```

Expected: build sukses tanpa error.

- [ ] **Step 4: Isi data awal via Admin Dashboard**

Buka `/admin/tools` → tambahkan semua 12 tools dari data lama.
Buka `/admin/consultants` → tambahkan semua 5 konsultan.
Buka `/admin/pricing` → tambahkan Pre-Assessment (Rp 500.000), Basic, Intermediate (featured), Advance.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove static data files — all content now served from Supabase"
```

---

## Checklist Verifikasi Akhir

Setelah semua task selesai, verifikasi berikut di browser:

- [ ] `/tool` — daftar tools dari DB, loading state tampil saat fetch
- [ ] `/tool/proceq-canin` — halaman detail tool dari DB
- [ ] `/case` — daftar cases yang berstatus published
- [ ] `/case/<slug>` — halaman detail case dari DB
- [ ] `/pricing` — tier harga dari DB, harga Pre-Assessment dinamis
- [ ] Homepage section Tim — konsultan dari DB
- [ ] `/admin/consultations` — tabel konsultasi, assign, ubah status
- [ ] `/admin/tools` — CRUD tools (tambah, edit, hapus, toggle aktif)
- [ ] `/admin/cases` — CRUD cases (tambah, edit, hapus, toggle draft/published)
- [ ] `/admin/consultants` — CRUD konsultan (tambah, edit, hapus)
- [ ] `/admin/pricing` — CRUD pricing (tambah, edit, hapus)
- [ ] Upload gambar dari admin → gambar tampil di halaman client
- [ ] Logout dari sidebar admin → redirect ke `/admin/login`
