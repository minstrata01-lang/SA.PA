# Page Loader (Data-Driven) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ganti `FullscreenLoader` yang menggunakan timer palsu dengan sistem loading yang terhubung ke data Supabase nyata + preload gambar above-the-fold, berlaku untuk semua halaman, dengan timeout 5 detik dan progress bar nyata.

**Architecture:** `PageLoaderContext` global menyimpan Set `pendingKeys`. Setiap komponen memanggil `useRegisterLoading(key, isLoading)` untuk mendaftarkan loading state-nya. `FullscreenLoader` membaca `progress` dan `isReady` dari context, menunggu 200ms grace period sebelum muncul, lalu fade-out saat `isReady`. Timeout 5 detik memastikan loader tidak nyangkut selamanya.

**Tech Stack:** React 18 (automatic batching required), Vite, React Router v6, Supabase JS SDK

---

## File Map

**Buat baru:**
- `frontend/src/context/PageLoaderContext.jsx` — context + provider + `usePageLoader` consumer
- `frontend/src/hooks/useRegisterLoading.js` — hook: daftarkan loading key ke context
- `frontend/src/hooks/useImagePreload.js` — hook: preload URL gambar ke context

**Modifikasi:**
- `frontend/src/components/FullscreenLoader.jsx` — ganti timer palsu dengan context
- `frontend/src/App.jsx` — bungkus dengan provider, tambah route resetter
- `frontend/src/components/Tools.jsx` — tambah `useRegisterLoading('tools', loading)`
- `frontend/src/components/Questions.jsx` — destructure `loading` dari `useCases()`, tambah register
- `frontend/src/components/Team.jsx` — tambah `useRegisterLoading('consultants', loading)`
- `frontend/src/components/Hero.jsx` — tambah `useImagePreload('hero-image', gambar1)`
- `frontend/src/pages/NewTools.jsx` — tambah `useRegisterLoading('tools', loading)`
- `frontend/src/pages/Case.jsx` — tambah `useRegisterLoading('cases', loading)`
- `frontend/src/pages/ToolDetail.jsx` — tambah `useRegisterLoading` + `useImagePreload`
- `frontend/src/pages/CaseDetail.jsx` — tambah `useRegisterLoading` + `useImagePreload`

---

## Task 1: Buat `PageLoaderContext.jsx`

**Files:**
- Create: `frontend/src/context/PageLoaderContext.jsx`

- [ ] **Step 1.1: Buat file context**

Buat `frontend/src/context/PageLoaderContext.jsx` dengan isi berikut:

```jsx
import { createContext, useCallback, useContext, useRef, useState } from 'react';

const TIMEOUT_MS = 5000;  // force-ready setelah 5 detik
const NO_DATA_MS = 100;   // jika tidak ada yang register dalam 100ms → halaman tidak punya data

const PageLoaderContext = createContext(null);

export function PageLoaderProvider({ children }) {
  const [pendingKeys, setPendingKeys] = useState(() => new Set());
  const [totalKeys,   setTotalKeys]   = useState(() => new Set());
  const [timedOut,    setTimedOut]    = useState(false);
  const [noDataReady, setNoDataReady] = useState(false);

  const timeoutRef = useRef(null);
  const noDataRef  = useRef(null);

  const register = useCallback((key) => {
    // Ada data → batalkan fast-path "tidak ada data"
    clearTimeout(noDataRef.current);
    setNoDataReady(false);
    setPendingKeys(prev => { const s = new Set(prev); s.add(key);    return s; });
    setTotalKeys  (prev => { const s = new Set(prev); s.add(key);    return s; });
  }, []);

  const resolve = useCallback((key) => {
    setPendingKeys(prev => { const s = new Set(prev); s.delete(key); return s; });
  }, []);

  const reset = useCallback(() => {
    clearTimeout(timeoutRef.current);
    clearTimeout(noDataRef.current);
    setPendingKeys(new Set());
    setTotalKeys  (new Set());
    setTimedOut   (false);
    setNoDataReady(false);
    timeoutRef.current = setTimeout(() => setTimedOut(true),    TIMEOUT_MS);
    noDataRef.current  = setTimeout(() => setNoDataReady(true), NO_DATA_MS);
  }, []);

  const total    = totalKeys.size;
  const pending  = pendingKeys.size;
  const resolved = total - pending;

  const progress = timedOut    ? 100
                 : total === 0 ? 0
                 : (resolved / total) * 100;

  const isReady = timedOut || noDataReady || (total > 0 && pending === 0);

  return (
    <PageLoaderContext.Provider value={{ register, resolve, reset, progress, isReady }}>
      {children}
    </PageLoaderContext.Provider>
  );
}

export function usePageLoader() {
  const ctx = useContext(PageLoaderContext);
  if (!ctx) throw new Error('usePageLoader must be used within PageLoaderProvider');
  return ctx;
}
```

- [ ] **Step 1.2: Verifikasi file tersimpan**

Buka `frontend/src/context/PageLoaderContext.jsx`. Pastikan ada `PageLoaderProvider`, `usePageLoader`, dan tiga konstanta `TIMEOUT_MS`, `NO_DATA_MS`, `PageLoaderContext`.

- [ ] **Step 1.3: Commit**

```bash
git add frontend/src/context/PageLoaderContext.jsx
git commit -m "feat: add PageLoaderContext with progress tracking and timeout"
```

---

## Task 2: Buat `useRegisterLoading.js`

**Files:**
- Create: `frontend/src/hooks/useRegisterLoading.js`

- [ ] **Step 2.1: Buat file hook**

Buat `frontend/src/hooks/useRegisterLoading.js`:

```js
import { useEffect } from 'react';
import { usePageLoader } from '../context/PageLoaderContext';

/**
 * Daftarkan sebuah loading key ke PageLoaderContext.
 * @param {string}  key       – identifier unik untuk sumber loading ini
 * @param {boolean} isLoading – nilai loading dari data hook
 */
export function useRegisterLoading(key, isLoading) {
  const { register, resolve } = usePageLoader();

  // Daftarkan saat mount; bersihkan saat unmount (idempotent)
  useEffect(() => {
    register(key);
    return () => resolve(key);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Resolve segera saat loading selesai
  useEffect(() => {
    if (!isLoading) resolve(key);
  }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps
}
```

- [ ] **Step 2.2: Commit**

```bash
git add frontend/src/hooks/useRegisterLoading.js
git commit -m "feat: add useRegisterLoading hook"
```

---

## Task 3: Buat `useImagePreload.js`

**Files:**
- Create: `frontend/src/hooks/useImagePreload.js`

- [ ] **Step 3.1: Buat file hook**

Buat `frontend/src/hooks/useImagePreload.js`:

```js
import { useEffect } from 'react';
import { usePageLoader } from '../context/PageLoaderContext';

/**
 * Preload sebuah URL gambar dan daftarkan ke PageLoaderContext.
 * @param {string}       key   – identifier unik untuk gambar ini
 * @param {string|null}  url   – URL gambar. Jika null/undefined, tidak mendaftar.
 * @param {boolean}      ready – true jika data sudah selesai dimuat (untuk gambar dinamis)
 */
export function useImagePreload(key, url, ready = true) {
  const { register, resolve } = usePageLoader();

  useEffect(() => {
    // Belum siap (data masih loading) → jangan daftar dulu
    if (!ready) return;

    // Siap tapi tidak ada URL (item tidak punya gambar) → tidak perlu daftar
    if (!url) return;

    register(key);
    const img = new Image();
    img.onload  = () => resolve(key);
    img.onerror = () => resolve(key); // gambar gagal pun tidak memblokir
    img.src = url;

    return () => resolve(key); // cleanup saat unmount
  }, [ready, url]); // eslint-disable-line react-hooks/exhaustive-deps
}
```

- [ ] **Step 3.2: Commit**

```bash
git add frontend/src/hooks/useImagePreload.js
git commit -m "feat: add useImagePreload hook"
```

---

## Task 4: Update `FullscreenLoader.jsx`

**Files:**
- Modify: `frontend/src/components/FullscreenLoader.jsx`

- [ ] **Step 4.1: Ganti seluruh isi file**

Timpa `frontend/src/components/FullscreenLoader.jsx` dengan:

```jsx
import { useEffect, useState } from 'react';
import { usePageLoader } from '../context/PageLoaderContext';

const blue   = '#003D6B';
const orange = '#D97706';

const GRACE_MS = 200;  // tidak tampil jika halaman selesai dalam 200ms
const FADE_MS  = 400;  // durasi fade-out

// phase: 'hidden' | 'showing' | 'fading-out'
export default function FullscreenLoader() {
  const { progress, isReady } = usePageLoader();
  const [phase, setPhase] = useState('hidden');

  // Grace period: tampil hanya jika loading > GRACE_MS
  useEffect(() => {
    if (isReady) return; // sudah selesai, tidak perlu grace timer
    const t = setTimeout(() => setPhase('showing'), GRACE_MS);
    return () => clearTimeout(t); // batalkan jika isReady sebelum GRACE_MS
  }, [isReady]);

  // Fade out saat ready
  useEffect(() => {
    if (!isReady || phase !== 'showing') return;
    setPhase('fading-out');
    const t = setTimeout(() => setPhase('hidden'), FADE_MS);
    return () => clearTimeout(t);
  }, [isReady, phase]);

  if (phase === 'hidden') return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
        overflow: 'hidden',
        opacity: phase === 'fading-out' ? 0 : 1,
        transition: phase === 'fading-out' ? `opacity ${FADE_MS}ms ease` : 'none',
        pointerEvents: phase === 'fading-out' ? 'none' : 'auto',
      }}
    >
      {/* Blueprint grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            `linear-gradient(rgba(0,61,107,0.035) 1px, transparent 1px),
             linear-gradient(90deg, rgba(0,61,107,0.035) 1px, transparent 1px)`,
          backgroundSize: '44px 44px',
        }}
      />

      {/* Konten */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2rem',
          width: '100%',
          maxWidth: 240,
          padding: '0 1rem',
        }}
      >
        {/* Logo */}
        <img
          src="/LOGO_SAPA_2.png"
          alt="SA.PA"
          style={{
            width: '100%',
            maxWidth: 160,
            height: 'auto',
            objectFit: 'contain',
            opacity: 0.9,
            display: 'block',
          }}
          onError={e => { e.currentTarget.style.display = 'none'; }}
        />

        {/* Progress bar */}
        <div style={{ width: '100%', position: 'relative' }}>
          <div
            style={{
              width: '100%',
              height: 2,
              background: 'rgba(0,61,107,0.1)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: `${progress}%`,
                background: orange,
                transition: 'width 0.15s ease-out',
              }}
            />
          </div>

          {/* Shimmer dot di ujung progress */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: `${progress}%`,
              transform: 'translate(-50%, -50%)',
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: orange,
              boxShadow: '0 0 8px 2px rgba(217,119,6,0.45)',
              transition: 'left 0.15s ease-out',
            }}
          />
        </div>

        {/* Label */}
        <p
          style={{
            fontSize: '0.62rem',
            fontWeight: 700,
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            color: 'rgba(0,61,107,0.38)',
            fontFamily: "'Manrope', sans-serif",
            marginTop: '-0.5rem',
          }}
        >
          Memuat&hellip;
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4.2: Commit**

```bash
git add frontend/src/components/FullscreenLoader.jsx
git commit -m "feat: connect FullscreenLoader to PageLoaderContext with grace period and fade-out"
```

---

## Task 5: Update `App.jsx`

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 5.1: Tambah import dan `RouteChangeResetter`**

Buka `frontend/src/App.jsx`. Tambahkan di bagian import (setelah baris `import FullscreenLoader`):

```js
import { PageLoaderProvider, usePageLoader } from './context/PageLoaderContext';
```

Tambahkan `useEffect` ke import dari React (ubah baris pertama):

```js
import { lazy, Suspense, useEffect } from 'react';
```

Tambahkan `useLocation` ke import dari react-router-dom:

```js
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
```

- [ ] **Step 5.2: Tambah komponen `RouteChangeResetter`**

Tambahkan fungsi berikut tepat sebelum `function App()`:

```jsx
function RouteChangeResetter() {
  const location = useLocation();
  const { reset } = usePageLoader();

  // Reset saat pertama kali mount (initial load)
  useEffect(() => { reset(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset setiap route berubah
  useEffect(() => { reset(); }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
```

- [ ] **Step 5.3: Bungkus App dengan provider**

Ubah `function App()` menjadi:

```jsx
function App() {
  return (
    <BrowserRouter>
      <PageLoaderProvider>
        <RouteChangeResetter />
        <ScrollToTop />
        {/* fallback={null} karena FullscreenLoader di luar sudah cover */}
        <Suspense fallback={null}>
          <Routes>
            {/* Public routes */}
            <Route element={<Layout />}>
              <Route path="/"                                   element={<Home />} />
              <Route path="/tool"                               element={<NewTools />} />
              <Route path="/tool/:slug"                         element={<ToolDetail />} />
              <Route path="/case"                               element={<Case />} />
              <Route path="/case/:slug"                         element={<CaseDetail />} />
              <Route path="/layanan"                            element={<LayananPage />} />
              <Route path="/preassessment"                      element={<PreassessmentPage />} />
              <Route path="/preassessment/form"                 element={<PreassessmentFormPage />} />
              <Route path="/preassessment/review-confirmation"  element={<ReviewConfirmationPage />} />
              <Route path="/waiting"                            element={<WaitingPage />} />
              <Route path="/payment/success"                    element={<PaymentSuccessPage />} />
              <Route path="/payment/failed"                     element={<PaymentFailedPage />} />
              <Route path="/payment/pending"                    element={<PaymentPendingPage />} />
              <Route path="/payment/upload"                     element={<PaymentUploadPage />} />
              <Route path="/payment-error"                      element={<PaymentFailedPage />} />
              <Route path="/session-used"                       element={<SessionUsedPage />} />
              <Route path="/session-pending"                    element={<SessionPendingPage />} />
              <Route path="/session-expired"                    element={<SessionExpiredPage />} />
              <Route path="/session-invalid"                    element={<SessionInvalidPage />} />
              <Route path="/join"                               element={<JoinPage />} />
              <Route path="/pricing"                            element={<Pricing />} />
            </Route>

            {/* Admin login */}
            <Route path="/admin-login" element={<AdminLoginPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Admin routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/consultations" replace />} />
              <Route path="consultations" element={<AdminConsultations />} />
              <Route path="tools"         element={<AdminTools />} />
              <Route path="cases"         element={<AdminCases />} />
              <Route path="cases/edit/:id" element={<AdminCaseEditor />} />
              <Route path="consultants"   element={<AdminConsultants />} />
              <Route path="vouchers"      element={<AdminVouchers />} />
              <Route path="clients"       element={<AdminClients />} />
            </Route>
          </Routes>
        </Suspense>
        {/* FullscreenLoader di luar Suspense — dikontrol PageLoaderContext */}
        <FullscreenLoader />
      </PageLoaderProvider>
    </BrowserRouter>
  );
}
```

- [ ] **Step 5.4: Verifikasi manual**

Jalankan `cd frontend && npm run dev`. Buka `http://localhost:5173`. Pastikan:
- Halaman Home muncul (tidak blank)
- Tidak ada error di console tentang `usePageLoader must be used within PageLoaderProvider`

- [ ] **Step 5.5: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: wrap App with PageLoaderProvider and add RouteChangeResetter"
```

---

## Task 6: Hook up komponen Home

### 6A — `Tools.jsx`

**Files:**
- Modify: `frontend/src/components/Tools.jsx`

- [ ] **Step 6A.1: Tambah import dan registration**

Buka `frontend/src/components/Tools.jsx`. Tambahkan setelah baris import terakhir:

```js
import { useRegisterLoading } from '../hooks/useRegisterLoading';
```

Cari baris (sekitar line 22):
```js
const { data: tools, loading } = useTools();
```

Tambahkan satu baris di bawahnya:
```js
useRegisterLoading('tools', loading);
```

- [ ] **Step 6A.2: Commit**

```bash
git add frontend/src/components/Tools.jsx
git commit -m "feat: register tools loading with PageLoaderContext"
```

---

### 6B — `Questions.jsx`

**Files:**
- Modify: `frontend/src/components/Questions.jsx`

- [ ] **Step 6B.1: Tambah import dan registration**

Buka `frontend/src/components/Questions.jsx`. Tambahkan setelah import terakhir:

```js
import { useRegisterLoading } from '../hooks/useRegisterLoading';
```

Cari baris (di dalam fungsi `Questions`):
```js
const { data: cases } = useCases();
```

Ubah menjadi:
```js
const { data: cases, loading: casesLoading } = useCases();
useRegisterLoading('cases', casesLoading);
```

- [ ] **Step 6B.2: Commit**

```bash
git add frontend/src/components/Questions.jsx
git commit -m "feat: register cases loading with PageLoaderContext"
```

---

### 6C — `Team.jsx`

**Files:**
- Modify: `frontend/src/components/Team.jsx`

- [ ] **Step 6C.1: Tambah import dan registration**

Buka `frontend/src/components/Team.jsx`. Tambahkan setelah import terakhir:

```js
import { useRegisterLoading } from '../hooks/useRegisterLoading';
```

Cari baris (di dalam fungsi `Team`):
```js
const { data: consultants, loading } = useConsultants();
```

Tambahkan satu baris di bawahnya:
```js
useRegisterLoading('consultants', loading);
```

- [ ] **Step 6C.2: Commit**

```bash
git add frontend/src/components/Team.jsx
git commit -m "feat: register consultants loading with PageLoaderContext"
```

---

### 6D — `Hero.jsx`

**Files:**
- Modify: `frontend/src/components/Hero.jsx`

- [ ] **Step 6D.1: Tambah import dan preload**

Buka `frontend/src/components/Hero.jsx`. Tambahkan setelah import terakhir:

```js
import { useImagePreload } from '../hooks/useImagePreload';
```

Catatan: `gambar1` sudah diimport di baris 5 (`import gambar1 from "../assets/heroImage/hero1.png";`). 

Di dalam fungsi `Hero()`, tepat setelah baris `const prefersReduced = useReducedMotion();`, tambahkan:

```js
// Preload gambar pertama hero (above the fold)
useImagePreload('hero-image', gambar1);
```

- [ ] **Step 6D.2: Commit**

```bash
git add frontend/src/components/Hero.jsx
git commit -m "feat: preload first hero image with PageLoaderContext"
```

---

### 6E — Verifikasi Home setelah semua komponen terhubung

- [ ] **Step 6E.1: Test manual Home**

Buka `http://localhost:5173/`. Pastikan:
1. Loading screen muncul saat pertama kali load
2. Progress bar bergerak (bukan stuck di satu angka)
3. Setelah data Supabase selesai + hero image loaded → loader fade-out
4. Halaman Home muncul dengan semua konten (Tools, Cases, Team)
5. Buka DevTools Network tab — pastikan tidak ada error network yang tidak terduga

---

## Task 7: Hook up halaman-halaman lain

### 7A — `NewTools.jsx` (`/tool`)

**Files:**
- Modify: `frontend/src/pages/NewTools.jsx`

- [ ] **Step 7A.1: Tambah import dan registration**

Buka `frontend/src/pages/NewTools.jsx`. Tambahkan setelah import terakhir:

```js
import { useRegisterLoading } from '../hooks/useRegisterLoading';
```

Cari baris (sekitar line 138, di dalam komponen utama `NewTools` atau komponen yang memanggilnya):
```js
const { data: allTools, loading, error } = useTools();
```

Tambahkan satu baris di bawahnya:
```js
useRegisterLoading('tools', loading);
```

- [ ] **Step 7A.2: Commit**

```bash
git add frontend/src/pages/NewTools.jsx
git commit -m "feat: register tools loading on /tool page"
```

---

### 7B — `Case.jsx` (`/case`)

**Files:**
- Modify: `frontend/src/pages/Case.jsx`

- [ ] **Step 7B.1: Tambah import dan registration**

Buka `frontend/src/pages/Case.jsx`. Tambahkan setelah import terakhir:

```js
import { useRegisterLoading } from '../hooks/useRegisterLoading';
```

Cari baris (sekitar line 23, di dalam fungsi `Case`):
```js
const { data: cases, totalCount, loading, error } = useCases({ page: currentPage, pageSize: PAGE_SIZE });
```

Tambahkan satu baris di bawahnya:
```js
useRegisterLoading('cases', loading);
```

- [ ] **Step 7B.2: Commit**

```bash
git add frontend/src/pages/Case.jsx
git commit -m "feat: register cases loading on /case page"
```

---

### 7C — `ToolDetail.jsx` (`/tool/:slug`)

**Files:**
- Modify: `frontend/src/pages/ToolDetail.jsx`

- [ ] **Step 7C.1: Tambah import**

Buka `frontend/src/pages/ToolDetail.jsx`. Tambahkan setelah import terakhir:

```js
import { useRegisterLoading } from '../hooks/useRegisterLoading';
import { useImagePreload } from '../hooks/useImagePreload';
```

- [ ] **Step 7C.2: Tambah registration**

Cari deklarasi state loading (sekitar line 24):
```js
const [tool, setTool]       = useState(null);
const [loading, setLoading] = useState(true);
```

Tambahkan dua baris setelahnya:
```js
useRegisterLoading('tool-detail', loading);
// Preload thumbnail utama (only when data loaded and URL available)
useImagePreload('tool-image', tool?.thumbnail_url, !loading);
```

- [ ] **Step 7C.3: Commit**

```bash
git add frontend/src/pages/ToolDetail.jsx
git commit -m "feat: register tool-detail loading and preload thumbnail on /tool/:slug"
```

---

### 7D — `CaseDetail.jsx` (`/case/:slug`)

**Files:**
- Modify: `frontend/src/pages/CaseDetail.jsx`

- [ ] **Step 7D.1: Tambah import**

Buka `frontend/src/pages/CaseDetail.jsx`. Tambahkan setelah import terakhir:

```js
import { useRegisterLoading } from '../hooks/useRegisterLoading';
import { useImagePreload } from '../hooks/useImagePreload';
```

- [ ] **Step 7D.2: Tambah registration**

Cari deklarasi state loading (sekitar line 53):
```js
const [loading, setLoading]   = useState(true);
```

Cari juga state yang menyimpan data case (biasanya `const [caseData, setCaseData] = useState(null)` atau serupa). Tambahkan setelah deklarasi state loading:

```js
useRegisterLoading('case-detail', loading);
```

Cari state yang menyimpan data case lengkap (perlu melihat struktur data untuk `cover_image_url`). Cari baris dengan `cover_image_url` atau variabel yang menyimpan data case, lalu tambahkan di dekat `useRegisterLoading`:

```js
// Preload cover image kasus (only when data loaded)
useImagePreload('case-image', caseData?.cover_image_url, !loading);
```

> **Catatan eksekutor:** Baca CaseDetail.jsx untuk mengetahui nama variabel state yang menyimpan data kasus (kemungkinan `caseData`, `kasus`, atau serupa). Sesuaikan nama variabel pada baris `useImagePreload`.

- [ ] **Step 7D.3: Commit**

```bash
git add frontend/src/pages/CaseDetail.jsx
git commit -m "feat: register case-detail loading and preload cover on /case/:slug"
```

---

## Task 8: Verifikasi End-to-End & Commit Final

- [ ] **Step 8.1: Test semua halaman**

Jalankan `cd frontend && npm run dev`. Test skenario berikut:

| Skenario | Yang Diharapkan |
|---|---|
| Buka `http://localhost:5173/` | Loading screen muncul, progress bergerak, fade-out setelah data + hero loaded |
| Navigasi ke `/tool` | Loading screen muncul saat tools loading, fade-out saat selesai |
| Navigasi ke `/case` | Loading screen untuk cases data |
| Navigasi ke `/tool/[slug]` | Loading untuk data tool + thumbnail |
| Navigasi ke `/case/[slug]` | Loading untuk data kasus + cover |
| Navigasi ke `/layanan` | Loading screen TIDAK muncul (tidak ada data fetch) |
| Navigasi ke `/preassessment` | Loading screen TIDAK muncul |
| Klik navigasi cepat (sebelum selesai) | Loader reset, tidak ada flicker atau stuck |
| Matikan internet → buka halaman | Setelah 5 detik, loader hilang (timeout) |

- [ ] **Step 8.2: Periksa console DevTools**

Buka DevTools → Console. Pastikan tidak ada:
- `usePageLoader must be used within PageLoaderProvider`
- Warning React tentang setState pada unmounted component
- Error CSP atau network yang tidak terduga

- [ ] **Step 8.3: Build test**

```bash
cd frontend && npm run build
```

Expected: Build sukses tanpa error. Warning tentang chunk size boleh diabaikan.

- [ ] **Step 8.4: Commit final**

```bash
git add frontend/src/pages/
git commit -m "feat: complete page loader integration across all public pages

- PageLoaderContext: progress nyata dari Supabase fetch + gambar
- useRegisterLoading: terhubung di Tools, Questions, Team, NewTools, Case,
  ToolDetail, CaseDetail
- useImagePreload: hero image (Home), thumbnail (ToolDetail), cover (CaseDetail)
- FullscreenLoader: grace period 200ms, fade-out 400ms, timeout 5 detik
- Halaman tanpa data (layanan, preassessment, dll): tidak tampil loader"
```
