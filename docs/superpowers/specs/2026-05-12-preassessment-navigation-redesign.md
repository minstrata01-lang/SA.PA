# Pre-Assessment Navigation Redesign

**Date:** 2026-05-12  
**Status:** Approved

## Overview

Memisahkan alur pre-assessment menjadi tiga halaman dengan tanggung jawab masing-masing: halaman pemilihan layanan, halaman info pre-assessment, dan halaman form pendaftaran. Tombol di ServiceCard tidak lagi membuka TermsModal langsung, melainkan mengarahkan pengguna ke halaman info terlebih dahulu.

## Route Changes

| Route | Komponen | Keterangan |
|---|---|---|
| `/layanan` | `LayananPage.jsx` | Rename dari `PreassessmentPage.jsx` lama |
| `/preassessment` | `PreassessmentPage.jsx` | Halaman baru: info + CTA |
| `/preassessment/form` | `PreassessmentFormPage.jsx` | Halaman baru: form pendaftaran |
| `/preassessment/review-confirmation` | `ReviewConfirmationPage.jsx` | Tidak berubah |

## File Changes

### Rename
- `pages/PreassessmentPage.jsx` → `pages/LayananPage.jsx`

### Create
- `pages/PreassessmentPage.jsx` — halaman info baru
- `pages/PreassessmentFormPage.jsx` — wrapper untuk ConsultationForm

### Delete
- `pages/Assesment.jsx` — file kosong, tidak digunakan

## Component Changes

### `ServiceCards.jsx`
- Hapus state `showTerms`, import `TermsModal`, dan prop `onStartForm`
- Button "Mulai Pre-Assessment Sekarang" menggunakan `<Link to="/preassessment">` (react-router)

### `LayananPage.jsx` (old PreassessmentPage)
- Hapus state `showForm` dan semua render `ConsultationForm` inline
- Hapus prop `onStartForm` yang diteruskan ke `ServiceCards` dan `ServiceCTA`
- Konten: `ServiceHeader` → divider → `ServiceCards` → `AlurPelayanan` → `ServiceCTA`
- `ServiceCTA` button juga diarahkan ke `/preassessment`

### `PreassessmentPage.jsx` (baru)
- Konten: `BenefitSection` + `ProsesPelayanan` + tombol CTA
- State `showTerms` lokal untuk mengontrol `TermsModal`
- Accept TermsModal → `navigate('/preassessment/form')`

### `PreassessmentFormPage.jsx` (baru)
- Wrapper untuk `ConsultationForm`
- Tombol "Kembali" → `navigate('/preassessment')`

### `App.jsx`
- Tambah lazy import untuk `LayananPage`, `PreassessmentFormPage`
- Ubah route `/preassessment` ke `PreassessmentPage` baru
- Tambah route `/layanan` → `LayananPage`
- Tambah route `/preassessment/form` → `PreassessmentFormPage`

## Navigation Flow

```
/layanan
  ServiceCards → klik "Mulai Pre-Assessment" → /preassessment
  ServiceCTA   → klik tombol CTA            → /preassessment

/preassessment
  BenefitSection
  ProsesPelayanan
  Tombol CTA → TermsModal
    Accept → /preassessment/form
    Close  → tetap di /preassessment

/preassessment/form
  ConsultationForm
  Kembali → /preassessment
```
