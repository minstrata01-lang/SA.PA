# Page Loader — Design Spec
**Tanggal:** 2026-05-26  
**Status:** Approved

---

## Tujuan

Mengganti `FullscreenLoader` yang saat ini menggunakan progress bar berbasis timer palsu dengan sistem loading yang **terhubung ke data nyata**: fetch Supabase + preload gambar above-the-fold. Loading berlaku untuk semua halaman, dengan timeout 5 detik dan indikator progress nyata.

---

## Scope

- Semua halaman publik (`/`, `/tool`, `/tool/:slug`, `/case`, `/case/:slug`, dll.)
- Data: semua Supabase fetch yang dieksekusi saat halaman mount
- Gambar: hanya gambar above-the-fold (hero pertama, cover image utama)
- Timeout: 5 detik, setelah itu halaman tetap ditampilkan

---

## Arsitektur

### Komponen Baru

| File | Peran |
|---|---|
| `frontend/src/context/PageLoaderContext.jsx` | Context global — menyimpan pending keys, menghitung progress, mengelola timeout |
| `frontend/src/hooks/useRegisterLoading.js` | Hook — komponen daftar/resolve loading state ke context |
| `frontend/src/hooks/useImagePreload.js` | Hook — preload URL gambar dan daftarkan ke context |

### File yang Dimodifikasi

| File | Perubahan |
|---|---|
| `frontend/src/App.jsx` | Bungkus dengan `<PageLoaderProvider>`, reset context saat route berubah via `useLocation` |
| `frontend/src/components/FullscreenLoader.jsx` | Baca progress dari context, fade-out 400ms saat `isReady`, hapus timer palsu |
| `frontend/src/components/Tools.jsx` | Tambah `useRegisterLoading('tools', loading)` |
| `frontend/src/components/Team.jsx` | Tambah `useRegisterLoading('consultants', loading)` |
| `frontend/src/components/Questions.jsx` | Tambah `useRegisterLoading('cases', loading)` |
| `frontend/src/components/Hero.jsx` | Tambah `useImagePreload('hero-image', hero1)` |
| `frontend/src/pages/NewTools.jsx` | Tambah `useRegisterLoading('tools', loading)` |
| `frontend/src/pages/ToolDetail.jsx` | Tambah `useRegisterLoading('tool-detail', loading)` + `useImagePreload` thumbnail |
| `frontend/src/pages/Case.jsx` | Tambah `useRegisterLoading('cases', loading)` |
| `frontend/src/pages/CaseDetail.jsx` | Tambah `useRegisterLoading('case-detail', loading)` + `useImagePreload` cover |

---

## Detail Implementasi

### `PageLoaderContext`

**State internal:**
```
pendingKeys: Set<string>   // key yang belum selesai
totalKeys:   Set<string>   // semua key yang pernah didaftarkan sejak reset
timedOut:    boolean       // true setelah 5 detik
```

**API yang di-expose:**
```
register(key: string)  → tambah key ke pendingKeys & totalKeys
resolve(key: string)   → hapus dari pendingKeys
reset()                → bersihkan semua state, restart timer 5000ms
progress: number       → 0–100
isReady: boolean       → true jika pendingKeys kosong ATAU timedOut
```

**Formula progress:**
```
if (totalKeys.size === 0) → progress = 0
else → progress = (totalKeys.size - pendingKeys.size) / totalKeys.size × 100
if (timedOut) → progress = 100
```

**Timeout:**
```
reset() dipanggil (tiap route change):
  → clearTimeout timer lama
  → set timer baru 5000ms
  → jika habis sebelum semua resolve → timedOut = true
  → jika semua resolve lebih dulu → clearTimeout, isReady = true
```

---

### `useRegisterLoading(key, isLoading)`

```
Mount:                  register(key)
isLoading true → false: resolve(key)
Unmount:                resolve(key)   ← cleanup
```

Tidak ada perubahan pada hooks data yang ada (`useTools`, `useCases`, `useConsultants`). Komponen cukup tambah satu baris:

```js
const { data, loading } = useTools();
useRegisterLoading('tools', loading);
```

---

### `useImagePreload(key, url)`

```
url tersedia (tidak null/undefined):
  → register(key)
  → new Image(), set src = url
  → onload:  resolve(key)
  → onerror: resolve(key)   ← gagal pun tetap lanjut

url belum tersedia:
  → tidak register (menunggu data fetch selesai dulu)

Unmount: resolve(key)       ← cleanup
```

Untuk gambar dari Supabase Storage (ToolDetail, CaseDetail), `useImagePreload` dipanggil setelah data fetch selesai dan URL tersedia — bukan saat mount.

---

### `FullscreenLoader` — Perubahan

- Hapus seluruh logika `requestAnimationFrame` + `Math.exp` (timer palsu)
- Baca `progress` dan `isReady` dari `usePageLoader()` (consumer context)
- Saat `isReady = true`: animasi opacity 0 selama 400ms, lalu unmount
- Progress bar dan shimmer dot tetap menggunakan animasi yang ada, tapi nilai `progress` dari context

---

### `App.jsx` — Perubahan

```jsx
// RouteChangeResetter: reset() saat mount (initial load) DAN saat route berubah
function RouteChangeResetter() {
  const location = useLocation();
  const { reset } = usePageLoader();

  // Mount pertama (initial load) → reset sekali
  useEffect(() => { reset(); }, []);

  // Setiap route change → reset lagi
  useEffect(() => { reset(); }, [location.pathname]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <PageLoaderProvider>
        <RouteChangeResetter />
        <ScrollToTop />
        {/* Suspense: fallback null — FullscreenLoader (di luar) sudah cover */}
        <Suspense fallback={null}>
          <Routes>...</Routes>
        </Suspense>
        {/* FullscreenLoader di luar Suspense — dikontrol PageLoaderContext */}
        <FullscreenLoader />
      </PageLoaderProvider>
    </BrowserRouter>
  );
}
```

**Kenapa `fallback={null}`:** `FullscreenLoader` sudah dirender di luar `<Suspense>` dan dikontrol oleh context (`isReady`). Saat JS chunk belum selesai, FullscreenLoader sudah menutupi layar. Suspense fallback tidak perlu menampilkan apapun lagi — jika ditampilkan juga, akan muncul dua loader sekaligus.

**Initial load:** `RouteChangeResetter` memanggil `reset()` dua kali — sekali saat mount awal (mengaktifkan timer 5s dan menyiapkan context untuk halaman pertama), lalu lagi setiap kali route berubah.

---

## Per-Halaman: Apa yang Didaftarkan

| Halaman | Keys | Gambar Preload |
|---|---|---|
| `/` (Home) | `tools`, `cases`, `consultants` | `hero-image` (hero1.png) |
| `/tool` | `tools` | — |
| `/tool/:slug` | `tool-detail` | thumbnail utama tool |
| `/case` | `cases` | — |
| `/case/:slug` | `case-detail` | cover image kasus |
| `/layanan`, `/preassessment`, dll | — | — (langsung muncul) |

---

## Error Handling & Edge Cases

| Skenario | Behavior |
|---|---|
| Supabase error | `loading` tetap jadi `false` → `resolve(key)` dipanggil → loader tidak nyangkut |
| Gambar gagal load | `onerror` memanggil `resolve(key)` → loader tetap lanjut |
| Navigasi cepat sebelum selesai | `reset()` membersihkan semua, timer lama di-`clearTimeout` |
| Key didaftarkan dua kali | `Set` tidak menyimpan duplikat → aman |
| Halaman tanpa data | Tidak ada key → `totalKeys` kosong → `isReady = true` seketika |
| Cold load (pertama buka situs) | Suspense tangkap JS chunk → selesai → PageLoaderContext tangkap data+gambar |

---

## Yang Tidak Berubah

- `useTools`, `useCases`, `useConsultants`, `useFetch` — tidak ada perubahan
- Desain visual `FullscreenLoader` (logo, grid, warna) — tidak berubah
- Semua admin pages — tidak terpengaruh
