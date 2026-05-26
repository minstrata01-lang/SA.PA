# Performance & Accessibility Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menaikkan skor Lighthouse Performance dari 73 → ≥90 dan Accessibility dari 85 → ≥90 pada https://sapa.services/

**Architecture:** Tiga area perbaikan utama — (1) konversi 13 hero images PNG ke WebP via `vite-imagetools` untuk memangkas payload ~3,000 KiB, (2) non-blocking Google Fonts loading untuk menghilangkan render-blocking request, dan (3) accessibility fixes: touch targets, color contrast, dan missing aria-labels.

**Tech Stack:** React 19, Vite 7, vite-imagetools (baru), Tailwind CSS v4, framer-motion

---

## File Map

| File | Perubahan |
|---|---|
| `frontend/package.json` | Tambah `vite-imagetools` ke devDependencies |
| `frontend/vite.config.js` | Import dan tambahkan `imagetools()` plugin |
| `frontend/src/components/Hero.jsx` | WebP imports, fetchPriority, width/height, touch targets, contrast, aria-labels |
| `frontend/index.html` | Non-blocking Google Fonts pattern |
| `frontend/src/components/Navbar.jsx` | Fix mobile overlay inactive link contrast |
| `frontend/src/components/Team.jsx` | Tambah aria-label ke arrow buttons, fix dot touch targets |

---

## Task 1: Install dan Konfigurasi vite-imagetools

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.js`

- [ ] **Step 1: Install vite-imagetools**

```bash
cd frontend
npm install -D vite-imagetools
```

Expected output: `added 1 package` (atau similar). Package muncul di `devDependencies`.

- [ ] **Step 2: Update vite.config.js**

Buka `frontend/vite.config.js`. Ubah seluruh isi file menjadi:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import svgr from 'vite-plugin-svgr';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { imagetools } from 'vite-imagetools';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    svgr({ svgrOptions: { icon: true } }),
    imagetools(),
    ...(mode === 'development' ? [basicSsl()] : []),
  ],
  server: {
    allowedHosts: true,
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':    ['react', 'react-dom'],
          'vendor-router':   ['react-router-dom'],
          'vendor-motion':   ['framer-motion'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-tiptap': [
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-text-align',
            '@tiptap/extension-image',
            '@tiptap/extension-placeholder',
            '@tiptap/extension-bubble-menu',
          ],
        },
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
}));
```

- [ ] **Step 3: Verifikasi dev server masih berjalan**

```bash
npm run dev
```

Expected: server berjalan tanpa error. Buka browser, hero slider masih tampil normal.

- [ ] **Step 4: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/vite.config.js
git commit -m "feat: add vite-imagetools for WebP conversion at build time"
```

---

## Task 2: Konversi Hero Images ke WebP

**Files:**
- Modify: `frontend/src/components/Hero.jsx`

- [ ] **Step 1: Update semua import di Hero.jsx**

Buka `frontend/src/components/Hero.jsx`. Ganti 13 baris import (baris 5–17) dari:

```js
import gambar1 from "../assets/heroImage/hero1.png";
import gambar2 from "../assets/heroImage/hero2.png";
import gambar3 from "../assets/heroImage/hero3.png";
import gambar4 from "../assets/heroImage/hero4.png";
import gambar5 from "../assets/heroImage/hero5.png";
import gambar6 from "../assets/heroImage/hero6.png";
import gambar7 from "../assets/heroImage/hero7.png";
import gambar8 from "../assets/heroImage/hero8.png";
import gambar9 from "../assets/heroImage/hero9.png";
import gambar10 from "../assets/heroImage/hero10.png";
import gambar11 from "../assets/heroImage/hero11.png";
import gambar12 from "../assets/heroImage/hero12.png";
import gambar13 from "../assets/heroImage/hero13.png";
```

Menjadi:

```js
import gambar1 from "../assets/heroImage/hero1.png?format=webp&quality=80";
import gambar2 from "../assets/heroImage/hero2.png?format=webp&quality=80";
import gambar3 from "../assets/heroImage/hero3.png?format=webp&quality=80";
import gambar4 from "../assets/heroImage/hero4.png?format=webp&quality=80";
import gambar5 from "../assets/heroImage/hero5.png?format=webp&quality=80";
import gambar6 from "../assets/heroImage/hero6.png?format=webp&quality=80";
import gambar7 from "../assets/heroImage/hero7.png?format=webp&quality=80";
import gambar8 from "../assets/heroImage/hero8.png?format=webp&quality=80";
import gambar9 from "../assets/heroImage/hero9.png?format=webp&quality=80";
import gambar10 from "../assets/heroImage/hero10.png?format=webp&quality=80";
import gambar11 from "../assets/heroImage/hero11.png?format=webp&quality=80";
import gambar12 from "../assets/heroImage/hero12.png?format=webp&quality=80";
import gambar13 from "../assets/heroImage/hero13.png?format=webp&quality=80";
```

- [ ] **Step 2: Tambah fetchPriority dan explicit width/height pada `<img>` di Hero.jsx**

Cari blok `<img>` di Hero.jsx (sekitar baris 128–134):

```jsx
<img
    src={SLIDES[slideIdx]}
    alt=""
    className="w-full h-full object-cover"
    draggable={false}
/>
```

Ganti dengan:

```jsx
<img
    src={SLIDES[slideIdx]}
    alt={`Slide ${slideIdx + 1} — proyek struktural SA.PA`}
    className="w-full h-full object-cover"
    draggable={false}
    fetchPriority={slideIdx === 0 ? "high" : "auto"}
    loading={slideIdx === 0 ? "eager" : "lazy"}
    width={1920}
    height={1080}
/>
```

- [ ] **Step 3: Verifikasi di browser**

```bash
npm run dev
```

Buka browser → hero slider harus tetap tampil normal, gambar-gambar masih muncul. Tidak ada error di console.

- [ ] **Step 4: Verifikasi build menghasilkan WebP**

```bash
npm run build
```

Expected: build berhasil tanpa error. Di folder `dist/assets/`, cari file dengan nama `hero1-*.webp` (atau hash). Ukuran file WebP harus jauh lebih kecil dari PNG aslinya.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/Hero.jsx
git commit -m "perf: convert hero images to WebP via vite-imagetools, add fetchPriority for LCP"
```

---

## Task 3: Non-Blocking Google Fonts

**Files:**
- Modify: `frontend/index.html`

- [ ] **Step 1: Ganti link Google Fonts di index.html**

Buka `frontend/index.html`. Cari baris ini (sekitar baris 38):

```html
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Poppins:wght@700;900&display=swap" rel="stylesheet" />
```

Ganti dengan:

```html
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Poppins:wght@700;900&display=swap" onload="this.rel='stylesheet'" />
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Poppins:wght@700;900&display=swap" /></noscript>
```

Dua tag `<link rel="preconnect">` di atasnya tetap tidak diubah.

- [ ] **Step 2: Verifikasi font masih ter-load**

```bash
npm run dev
```

Buka browser → font Manrope dan Poppins harus tetap muncul di hero dan navbar. Ada kemungkinan font muncul setelah sedetik (FOUT — Flash of Unstyled Text) karena load non-blocking, ini normal dan expected.

- [ ] **Step 3: Commit**

```bash
git add frontend/index.html
git commit -m "perf: load Google Fonts non-blocking to eliminate render-blocking request"
```

---

## Task 4: Fix Touch Targets di Hero.jsx

**Files:**
- Modify: `frontend/src/components/Hero.jsx`

- [ ] **Step 1: Fix slide dot buttons — buat hit area 44×44px**

Di Hero.jsx, cari blok dot buttons (sekitar baris 162–177):

```jsx
{SLIDES.map((_, i) => (
    <button
        key={i}
        onClick={() => goTo(i)}
        aria-label={`Slide ${i + 1}`}
        style={{
            width: i === slideIdx ? 22 : 6,
            height: 3,
            background: i === slideIdx ? orange : "rgba(255,255,255,0.45)",
            border: "none", cursor: "pointer", padding: 0, borderRadius: 2,
            transition: "width 0.35s ease, background 0.3s ease",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }}
    />
))}
```

Ganti dengan (button menjadi 44×44 invisible container, span menjadi visual indicator):

```jsx
{SLIDES.map((_, i) => (
    <button
        key={i}
        onClick={() => goTo(i)}
        aria-label={`Slide ${i + 1}`}
        style={{
            width: 44,
            height: 44,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
        }}
    >
        <span
            style={{
                width: i === slideIdx ? 22 : 6,
                height: 3,
                background: i === slideIdx ? orange : "rgba(255,255,255,0.45)",
                borderRadius: 2,
                transition: "width 0.35s ease, background 0.3s ease",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                display: "block",
                flexShrink: 0,
            }}
        />
    </button>
))}
```

- [ ] **Step 2: Fix prev/next buttons — naikkan dari 36px ke 44px**

Di Hero.jsx, cari dua button prev/next (sekitar baris 185–208). Keduanya punya `width: 36, height: 36` dalam style. Ubah ke `width: 44, height: 44`:

```jsx
// Pada KEDUANYA (prev dan next), ubah:
width: 36, height: 36,
// Menjadi:
width: 44, height: 44,
```

- [ ] **Step 3: Fix aria-label prev/next ke Bahasa Indonesia**

Pada array `[{ fn: prev, label: "Previous", ... }, { fn: next, label: "Next", ... }]` (sekitar baris 181), ganti:

```jsx
{ fn: prev, label: "Previous", path: "M6 2L2 6L6 10" },
{ fn: next, label: "Next",     path: "M2 2L6 6L2 10" },
```

Menjadi:

```jsx
{ fn: prev, label: "Sebelumnya", path: "M6 2L2 6L6 10" },
{ fn: next, label: "Berikutnya", path: "M2 2L6 6L2 10" },
```

- [ ] **Step 4: Verifikasi di browser**

```bash
npm run dev
```

Cek: dot buttons dan prev/next buttons di hero slider masih berfungsi normal. Visual tetap sama (dots kecil, tapi area klik besar).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/Hero.jsx
git commit -m "a11y: fix hero touch targets to 44x44px, update aria-labels to Indonesian"
```

---

## Task 5: Fix Color Contrast di Hero.jsx

**Files:**
- Modify: `frontend/src/components/Hero.jsx`

- [ ] **Step 1: Fix slide counter inactive text contrast**

Di Hero.jsx, cari slide counter (sekitar baris 150–159):

```jsx
<span style={{ color: "rgba(255,255,255,0.4)", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
    {" / "}
</span>
<span style={{ color: "rgba(255,255,255,0.4)", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
    {String(SLIDES.length).padStart(2, "0")}
</span>
```

Ganti kedua `rgba(255,255,255,0.4)` menjadi `rgba(255,255,255,0.65)`:

```jsx
<span style={{ color: "rgba(255,255,255,0.65)", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
    {" / "}
</span>
<span style={{ color: "rgba(255,255,255,0.65)", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
    {String(SLIDES.length).padStart(2, "0")}
</span>
```

- [ ] **Step 2: Verifikasi**

```bash
npm run dev
```

Cek slide counter di pojok kanan bawah hero: angka inactive (counter "/" dan total) harus sedikit lebih terang dari sebelumnya. Tidak ada perubahan dramatis.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Hero.jsx
git commit -m "a11y: improve hero slide counter contrast ratio to meet WCAG AA"
```

---

## Task 6: Fix Color Contrast di Navbar.jsx

**Files:**
- Modify: `frontend/src/components/Navbar.jsx`

- [ ] **Step 1: Fix inactive nav link color di mobile overlay**

Buka `frontend/src/components/Navbar.jsx`. Cari blok map mobile overlay links (sekitar baris 74–91). Ada tiga kemunculan `rgba(255,255,255,0.6)`:

**Kemunculan 1 — `style` prop:**
```jsx
color: isActive(item.href) ? "#fff" : "rgba(255,255,255,0.6)",
```
Ganti menjadi:
```jsx
color: isActive(item.href) ? "#fff" : "rgba(255,255,255,0.82)",
```

**Kemunculan 2 — `onMouseEnter`:**
```jsx
onMouseEnter={e => e.currentTarget.style.color = "#fff"}
```
Tidak perlu diubah (hover → full white).

**Kemunculan 3 — `onMouseLeave`:**
```jsx
onMouseLeave={e => e.currentTarget.style.color = isActive(item.href) ? "#fff" : "rgba(255,255,255,0.6)"}
```
Ganti menjadi:
```jsx
onMouseLeave={e => e.currentTarget.style.color = isActive(item.href) ? "#fff" : "rgba(255,255,255,0.82)"}
```

- [ ] **Step 2: Verifikasi**

```bash
npm run dev
```

Buka di mobile/responsive mode, klik burger menu → overlay terbuka. Link yang tidak aktif harus terlihat sedikit lebih terang dari sebelumnya.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Navbar.jsx
git commit -m "a11y: fix mobile nav inactive link contrast to meet WCAG AA (0.6 → 0.82 opacity)"
```

---

## Task 7: Fix Accessibility di Team.jsx

**Files:**
- Modify: `frontend/src/components/Team.jsx`

- [ ] **Step 1: Tambah aria-label ke arrow buttons**

Di `Team.jsx`, cari dua `motion.button` untuk navigasi (sekitar baris 202–248). Keduanya tidak memiliki `aria-label`. Tambahkan:

**Button pertama (prev, `go(-1)`):**
```jsx
<motion.button
    onClick={() => go(-1)}
    aria-label="Konsultan sebelumnya"
    className="flex items-center justify-center w-11 h-11 rounded-full shrink-0"
    ...
>
```

**Button kedua (next, `go(1)`):**
```jsx
<motion.button
    onClick={() => go(1)}
    aria-label="Konsultan berikutnya"
    className="flex items-center justify-center w-11 h-11 rounded-full shrink-0"
    ...
>
```

- [ ] **Step 2: Fix dot touch targets di Team.jsx**

Cari blok dot buttons di Team.jsx (sekitar baris 319–336):

```jsx
<button
    key={i}
    onClick={() => goTo(i)}
    aria-label={`Tampilkan konsultan ${c.name || i + 1}`}
    style={{
        width: activeIdx === i ? 20 : 5,
        height: 5,
        borderRadius: 3,
        background: activeIdx === i ? orange : "rgba(255,255,255,0.2)",
        transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
        border: "none",
        cursor: "pointer",
        padding: 0,
    }}
/>
```

Ganti dengan pola yang sama seperti Hero dots (44×44 button + inner span):

```jsx
<button
    key={i}
    onClick={() => goTo(i)}
    aria-label={`Tampilkan konsultan ${c.name || i + 1}`}
    style={{
        width: 44,
        height: 44,
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    }}
>
    <span
        style={{
            width: activeIdx === i ? 20 : 5,
            height: 5,
            borderRadius: 3,
            background: activeIdx === i ? orange : "rgba(255,255,255,0.2)",
            transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
            display: "block",
            flexShrink: 0,
        }}
    />
</button>
```

- [ ] **Step 3: Verifikasi**

```bash
npm run dev
```

Buka halaman utama → scroll ke section Team. Dot buttons dan arrow buttons harus tetap berfungsi normal. Visual tidak berubah.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/Team.jsx
git commit -m "a11y: add aria-labels to Team arrows, fix dot touch targets to 44x44px"
```

---

## Task 8: Final Build Verification

- [ ] **Step 1: Clean build**

```bash
cd frontend
npm run build
```

Expected: build berhasil. Perhatikan output size di terminal — ukuran chunk assets harus jauh lebih kecil dibanding sebelumnya (hero images sekarang WebP).

- [ ] **Step 2: Preview build lokal**

```bash
npm run preview
```

Buka `http://localhost:4173` → pastikan:
- Hero slider tampil normal dan gambar muncul
- Font (Manrope/Poppins) ter-load dengan benar
- Navbar mobile menu berfungsi
- Team section dot dan arrow navigation berfungsi

- [ ] **Step 3: Commit final**

```bash
git add -A
git commit -m "build: verify production build post-performance and accessibility fixes"
```

---

## Cara Verifikasi Lighthouse

Setelah deploy ke production (https://sapa.services/), jalankan Lighthouse audit ulang:

1. Buka Chrome DevTools → Lighthouse tab
2. Pilih: Desktop, Navigation, pilih semua kategori
3. Generate report
4. Target: **Performance ≥ 90, Accessibility ≥ 90**

Atau gunakan PageSpeed Insights (https://pagespeed.web.dev/) untuk hasil yang lebih konsisten.

---

## Success Criteria

- [ ] Lighthouse Performance ≥ 90
- [ ] Lighthouse Accessibility ≥ 90
- [ ] LCP ≤ 2.0s
- [ ] Total network payload < 2,500 KiB (turun dari 7,211 KiB)
- [ ] Semua touch targets ≥ 44×44px
- [ ] Tidak ada regresi visual — tampilan site tetap sama
