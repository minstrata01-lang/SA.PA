# Design: Case Pagination & Tool Link

**Date:** 2026-05-20  
**Status:** Approved  
**Scope:** Case listing pagination, CaseDetail content pagination, clickable tool names in articles

---

## Overview

Three interconnected features added to the SA.PA case study system:

1. **Case listing pagination** — 9 kasus per halaman dengan nomor halaman
2. **CaseDetail content pagination** — artikel panjang dipecah via page break manual di Tiptap editor
3. **Tool Link** — admin highlight nama alat di editor → jadi link ke halaman alat, buka tab baru

---

## Feature 1: Case Listing Pagination

### Data Layer

Hook `useCases` diubah untuk menerima `page` (default: 1) dan `pageSize` (default: 9).

- Query Supabase menggunakan `.range(from, to)` untuk fetch hanya 9 kasus sesuai halaman aktif
- Tambah `{ count: 'exact' }` untuk mendapatkan total jumlah kasus
- Return shape: `{ data, totalCount, loading, error }`

```js
// Contoh penggunaan
const { data, totalCount } = useCases({ page: 2, pageSize: 9 });
```

### URL State

Halaman aktif disimpan di URL sebagai query param `?page=2` menggunakan `useSearchParams` dari React Router v7.

- Saat user klik nomor halaman → URL berubah → hook re-fetch → grid update
- Mendukung bookmark, share link, dan tombol back browser
- Default: `page=1` jika param tidak ada

### Komponen Pagination

Komponen baru `<Pagination />` di `components/ui/Pagination.jsx`.

**Props:** `totalCount`, `pageSize`, `currentPage`, `onPageChange`

**Tampilan:**
- Tombol `←` (disabled di halaman pertama)
- Nomor halaman dengan ellipsis jika total > 7 halaman
- Tombol `→` (disabled di halaman terakhir)
- Styling: warna navy `#003D6B`, aksen orange `#D97706`, font Manrope, border-radius pill

### File yang Berubah

| File | Perubahan |
|------|-----------|
| `frontend/src/hooks/useCases.js` | Tambah parameter `page`, `pageSize`; gunakan `.range()`; return `totalCount` |
| `frontend/src/pages/Case.jsx` | Tambah `useSearchParams`; pass `page` ke hook; render `<Pagination />` |
| `frontend/src/components/ui/Pagination.jsx` | Komponen baru |

---

## Feature 2: CaseDetail Content Pagination

### Custom Tiptap Node: `PageBreak`

Node baru bertipe `block` yang berfungsi sebagai penanda pemisah halaman.

- Tersimpan di Tiptap JSON sebagai `{ type: "pageBreak" }`
- Di editor admin: dirender sebagai garis putus-putus dengan label "— Halaman Baru —"
- Tidak menerima konten teks (atom node)
- Di render publik: tidak dirender sama sekali (digunakan hanya untuk splitting)

### Toolbar Admin

Tambah tombol di toolbar `AdminCaseEditor` dengan ikon pemisah halaman. Saat diklik, insert node `PageBreak` di posisi kursor.

### Logic Splitting Konten

Di `CaseDetail.jsx`, sebelum konten di-set ke editor read-only:

1. Parse JSON konten
2. Split array `content` berdasarkan node bertipe `pageBreak`
3. Hasilkan array segment: `[segment1, segment2, segment3]`
4. Segment aktif ditentukan oleh query param `?p=1` (default: 1)
5. Hanya segment aktif yang di-set ke editor

```js
// Contoh hasil split
// Input JSON: [...nodes, {type:"pageBreak"}, ...nodes, {type:"pageBreak"}, ...nodes]
// Output: [segment1[], segment2[], segment3[]]
```

### URL State

- Query param `?p=2` (berbeda dari `?page=` di listing)
- Saat ganti halaman konten → scroll otomatis ke atas artikel (`window.scrollTo(0, 0)`)
- Param `p` dan `page` bisa hidup berdampingan tanpa konflik

### Navigasi Artikel

Di bawah konten artikel, tampil navigasi menggunakan komponen `<Pagination />` yang sama (reuse dari Feature 1):
- Menampilkan: `← Halaman Sebelumnya | 1 / 3 | Halaman Berikutnya →`
- Hanya muncul jika artikel memiliki lebih dari 1 halaman (ada minimal 1 `pageBreak`)

### File yang Berubah

| File | Perubahan |
|------|-----------|
| `frontend/src/lib/tiptap/PageBreak.js` | Node extension baru |
| `frontend/src/pages/CaseDetail.jsx` | Logic split konten + `useSearchParams` untuk `?p=` + render `<Pagination />` |
| `frontend/src/pages/admin/AdminCaseEditor.jsx` | Tambah tombol PageBreak di toolbar |

---

## Feature 3: Tool Link

### Custom Tiptap Mark: `ToolLink`

Mark baru yang menyimpan atribut:
- `toolSlug` — slug alat untuk URL (`/tool/:slug`)
- `toolName` — nama alat untuk tooltip (opsional, UX tambahan)

**Di editor admin:** teks dengan mark ini dirender berwarna orange `#D97706` dengan underline putus-putus, berbeda dari link biasa.

**Di halaman publik:** dirender sebagai:
```html
<a href="/tool/:slug" target="_blank" rel="noopener noreferrer" class="tool-link">
  nama alat
</a>
```

### UI Admin: Bubble Menu

Komponen baru `<ToolLinkBubbleMenu />` yang muncul saat admin menyeleksi teks di editor.

**Alur kerja admin:**
1. Admin highlight teks (misal: "Schmidt Hammer")
2. Bubble menu muncul di atas seleksi dengan tombol ikon 🔧 "Tautkan Alat"
3. Klik tombol → dropdown search muncul berisi daftar alat dari Supabase
4. Admin ketik untuk filter, pilih alat → teks jadi `ToolLink` mark
5. Untuk hapus: klik teks ToolLink → bubble menu tampil tombol "Hapus Tautan Alat"

**Fetch daftar alat:**
- Gunakan hook `useTools()` yang sudah ada
- Di-fetch sekali saat editor mount, disimpan di state lokal komponen
- Tidak perlu state global

### Render Publik

Di `CaseDetail.jsx`, register `ToolLink` extension ke konfigurasi Tiptap (read-only mode). Styling via CSS class `tool-link` di `index.css`:

```css
.case-prose a.tool-link {
  color: #D97706;
  text-decoration: underline;
  text-decoration-style: dotted;
  font-weight: 600;
  cursor: pointer;
}
.case-prose a.tool-link:hover {
  text-decoration-style: solid;
}
```

### File yang Berubah

| File | Perubahan |
|------|-----------|
| `frontend/src/lib/tiptap/ToolLink.js` | Mark extension baru |
| `frontend/src/components/admin/ToolLinkBubbleMenu.jsx` | Komponen bubble menu baru |
| `frontend/src/pages/admin/AdminCaseEditor.jsx` | Integrate `ToolLinkBubbleMenu` |
| `frontend/src/pages/CaseDetail.jsx` | Register `ToolLink` extension |
| `frontend/src/index.css` | Tambah style `.tool-link` di `.case-prose` |

---

## Urutan Implementasi

1. Komponen `<Pagination />` (dibutuhkan Feature 1 & 2)
2. Feature 1: `useCases` pagination + `Case.jsx`
3. Feature 2: `PageBreak` node + toolbar + splitting di `CaseDetail`
4. Feature 3: `ToolLink` mark + `ToolLinkBubbleMenu` + render publik

---

## Constraints

- Tidak ada perubahan skema database — konten Tiptap JSON sudah fleksibel untuk menyimpan node/mark baru
- Backward compatible — artikel lama tanpa `pageBreak` tetap tampil normal (1 halaman)
- Artikel lama tanpa `ToolLink` mark tetap tampil normal
