# Design: Performance & Accessibility Improvement

**Date:** 2026-05-26  
**Target:** Performance ≥ 90, Accessibility ≥ 90  
**Current scores:** Performance 73, Accessibility 85, Best Practices 92, SEO 100  
**Source:** Lighthouse 13.0.2 audit on https://sapa.services/

---

## Problem Statement

Lighthouse audit menunjukkan dua area utama yang perlu diperbaiki:

1. **Performance (73)** — didominasi oleh image delivery yang buruk: 13 hero images PNG di-import secara statis ke bundle JavaScript, menghasilkan total payload 7.2 MB. LCP mencapai 3.5s akibat tidak ada preload pada gambar pertama. Google Fonts dimuat secara blocking.

2. **Accessibility (85)** — touch targets terlalu kecil (slide dots 6×3px), color contrast tidak memenuhi WCAG AA pada beberapa elemen, dan beberapa icon-only buttons perlu accessible name yang lebih baik.

---

## Approach: Comprehensive Fix (Approach B)

Dipilih karena titik optimal antara effort dan hasil — sangat realistis mencapai target 90+ tanpa overhaul arsitektur.

---

## Section 1: Performance

### 1.1 Hero Image Optimization (dampak terbesar)

**Root cause:** `Hero.jsx` menggunakan 13 static ES module imports:
```js
import gambar1 from '../assets/heroImage/hero1.png'
// ... ×13
```
Semua PNG ter-bundle ke dalam JavaScript build, membebani payload ~3,381 KiB.

**Fix:**
- Install `vite-imagetools` sebagai devDependency
- Ubah semua 13 import menggunakan query `?format=webp&quality=80`
- Vite akan otomatis convert PNG → WebP saat `vite build`
- Format WebP menghemat 60-80% dibanding PNG untuk foto

```js
// Before
import gambar1 from '../assets/heroImage/hero1.png'

// After
import gambar1 from '../assets/heroImage/hero1.png?format=webp&quality=80'
```

**LCP fix (Largest Contentful Paint 3.5s → target <2s):**
- Tambah `fetchPriority="high"` dan `loading="eager"` hanya pada gambar pertama (`SLIDES[0]`)
- Slide lainnya tetap `loading="lazy"` (default)
- Tambah explicit `width` dan `height` pada semua `<img>` di Hero untuk menghindari layout shift

### 1.2 Google Fonts Non-Blocking Loading (120ms savings)

**Root cause:** `index.html` menggunakan `<link rel="stylesheet">` untuk Google Fonts yang bersifat render-blocking.

**Fix:** Ganti ke non-blocking pattern:
```html
<!-- Before (blocking) -->
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Poppins:wght@700;900&display=swap" rel="stylesheet" />

<!-- After (non-blocking) -->
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Poppins:wght@700;900&display=swap" onload="this.rel='stylesheet'" />
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Poppins:wght@700;900&display=swap" /></noscript>
```
`preconnect` ke `fonts.googleapis.com` dan `fonts.gstatic.com` sudah ada — pertahankan.

### 1.3 JavaScript (138 KiB unused — tidak diubah)

Code splitting yang ada sudah baik (framer-motion, tiptap, supabase, react sudah di-chunk manual). Sisa 138 KiB unused JS berasal dari library internals yang sulit dihilangkan tanpa refactor besar. Fix image (Section 1.1) sudah akan mendominasi kenaikan skor — JS optimization diabaikan agar tidak over-engineer.

---

## Section 2: Accessibility

### 2.1 Touch Targets (minimum 44×44px)

**Root cause:** `Hero.jsx` slide dot buttons berukuran `width: 6px, height: 3px` — jauh di bawah minimum.

**Fix:** Tambah invisible padding agar hit area mencapai 44×44px, visual tidak berubah:
```jsx
// Tambah ke style button slide dot:
padding: '20px 19px',  // membuat total hit area ~44×44px
margin: '-20px -19px', // kompensasi agar layout tidak bergeser
```

Hero prev/next buttons saat ini 36×36px → naikkan ke 44×44px.

### 2.2 Color Contrast (WCAG AA = rasio minimum 4.5:1)

| Elemen | Before | After | Rasio setelah fix |
|---|---|---|---|
| Mobile nav inactive links | `rgba(255,255,255,0.6)` | `rgba(255,255,255,0.82)` | ≥ 4.5:1 ✓ |
| Hero slide counter (inactive) | `rgba(255,255,255,0.4)` | `rgba(255,255,255,0.65)` | Lebih baik dengan text-shadow |

Warna brand (biru `#003D6B`, oranye `#E8920A`) tidak diubah — keduanya sudah memenuhi WCAG AA pada background putih.

### 2.3 Accessible Names pada Buttons

- Slide dots di `Hero.jsx` sudah punya `aria-label="Slide X"` — ✓ sudah benar
- Prev/Next buttons sudah punya `aria-label="Previous"/"Next"` — ubah ke Bahasa Indonesia: `"Sebelumnya"/"Berikutnya"`
- `Team.jsx` dot buttons — verifikasi saat implementasi, fix jika belum ada `aria-label`
- Semua icon-only buttons di seluruh codebase — audit saat implementasi

---

## Section 3: Best Practices (scope terbatas)

- **Browser console errors:** Investigasi saat implementasi — fix jika dapat diidentifikasi penyebabnya tanpa breaking changes.
- **CSP / COOP / Trusted Types:** Diabaikan — bersifat informational (bukan failing audit) dan commit `ba0576a` menunjukkan bahwa implementasi CSP/COOP sebelumnya menyebabkan masalah dan di-revert. Tidak akan disentuh.

---

## Files yang Diubah

| File | Jenis Perubahan |
|---|---|
| `frontend/package.json` | Tambah `vite-imagetools` ke devDependencies |
| `frontend/vite.config.js` | Tambah `imagetools()` plugin |
| `frontend/src/components/Hero.jsx` | WebP imports, fetchPriority, width/height, touch targets, contrast |
| `frontend/index.html` | Non-blocking Google Fonts |
| `frontend/src/components/Navbar.jsx` | Fix mobile overlay text contrast |
| `frontend/src/components/Team.jsx` | Verifikasi & fix dot button touch targets |

---

## Success Criteria

- [ ] Lighthouse Performance ≥ 90
- [ ] Lighthouse Accessibility ≥ 90
- [ ] LCP ≤ 2.0s
- [ ] Total network payload < 2,000 KiB (dari 7,211 KiB)
- [ ] Semua touch targets ≥ 44×44px
- [ ] WCAG AA contrast ratio ≥ 4.5:1 pada semua teks
- [ ] Tidak ada regresi visual — tampilan site tetap sama
