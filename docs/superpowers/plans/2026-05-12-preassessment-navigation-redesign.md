# Pre-Assessment Navigation Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pisahkan alur pre-assessment menjadi tiga halaman (`/layanan`, `/preassessment`, `/preassessment/form`) sehingga setiap halaman punya satu tanggung jawab jelas.

**Architecture:** `ServiceCards` dan `ServiceCTA` tidak lagi mengontrol TermsModal — keduanya cukup navigate ke `/preassessment`. Halaman baru `/preassessment` menampilkan info (BenefitSection + ProsesPelayanan) dan CTA dengan TermsModal yang, jika diterima, navigate ke `/preassessment/form`. Halaman form adalah wrapper tipis di atas `ConsultationForm` yang sudah ada.

**Tech Stack:** React 18, React Router v6, Framer Motion, Tailwind CSS

---

## File Map

| Aksi | Path |
|---|---|
| Modify | `frontend/src/components/preassessment/ServiceCards.jsx` |
| Modify | `frontend/src/components/preassessment/ServiceCTA.jsx` |
| Rename (git mv) | `frontend/src/pages/PreassessmentPage.jsx` → `frontend/src/pages/LayananPage.jsx` |
| Create | `frontend/src/pages/PreassessmentPage.jsx` |
| Create | `frontend/src/pages/PreassessmentFormPage.jsx` |
| Modify | `frontend/src/App.jsx` |
| Delete | `frontend/src/pages/Assesment.jsx` |

---

### Task 1: Update `ServiceCards.jsx` — navigate ke `/preassessment`

**Files:**
- Modify: `frontend/src/components/preassessment/ServiceCards.jsx`

- [ ] **Step 1: Ganti button menjadi Link**

Buka `frontend/src/components/preassessment/ServiceCards.jsx`. Ganti seluruh isi file dengan:

```jsx
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { blue, orange, muted, rule, EASE, fadeUp } from "./tokens";

const preFeatures = [
  "Evaluasi kondisi umum bangunan",
  "Identifikasi kerusakan visual & struktural",
  "Rekomendasi tindak lanjut awal",
  "Estimasi risiko kerusakan",
  "Laporan ringkas hasil survei",
  "Konsultasi via grup WhatsApp",
  "Respon cepat oleh tim ahli",
];

const assessFeatures = [
  "Semua fitur Pre-Assessment",
  "Pemeriksaan detail & mendalam",
  "Pengujian material & struktur",
  "Analisis beban & kapasitas",
  "Dokumentasi teknis lengkap",
  "Laporan formal seuai dengan standard dan peraturan yang berlaku",
  "Rekomendasi perbaikan terperinci",
  "Pendampingan oleh ahli bersertifikat",
];

function FeatureList({ items, accent }) {
  return (
    <ul className="flex flex-col gap-3 mb-6">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="shrink-0 mt-0.5 text-xs font-bold" style={{ color: accent }}>✓</span>
          <span className="text-sm leading-snug" style={{ color: blue, fontFamily: "'Manrope', sans-serif" }}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function ServiceCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">

      {/* Pre-Assessment — highlighted */}
      <motion.div className="flex flex-col" style={{ border: `1px solid ${orange}`, overflow: "hidden" }} {...fadeUp(0)}>
        <div style={{ height: 3, background: orange }} />
        <div className="flex flex-col flex-1 px-7 pt-6 pb-7">
          <span
            className="self-start text-[10px] font-bold tracking-[0.16em] uppercase mb-5 px-3 py-1"
            style={{ background: orange, color: "white", fontFamily: "'Manrope', sans-serif" }}
          >
            Paling Direkomendasikan
          </span>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>Layanan</p>
          <h3
            className="font-bold-hero leading-[1.1] tracking-[-0.02em] mb-6"
            style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)", color: blue }}
          >
            Pre-Assessment
          </h3>
          <FeatureList items={preFeatures} accent={orange} />
          <div className="mt-auto">
            <div className="h-px mb-5" style={{ background: rule }} />
            <p className="text-[10px] font-bold tracking-[0.16em] uppercase mb-1" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>Mulai dari</p>
            <p className="font-bold-hero tracking-[-0.02em] mb-6" style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", color: blue }}>Rp 500.000</p>

            <motion.div whileHover={{ scale: 1.025 }} whileTap={{ scale: 0.968 }} transition={{ duration: 0.22, ease: EASE }}>
              <Link
                to="/preassessment"
                className="w-full rounded-full font-semibold text-white relative overflow-hidden"
                style={{
                  height: 46,
                  background: orange,
                  border: "none",
                  fontSize: 14,
                  fontFamily: "'Manrope', sans-serif",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  textDecoration: "none",
                }}
              >
                <motion.span
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.18) 50%, transparent 65%)",
                    backgroundSize: "200% 100%",
                  }}
                  initial={{ backgroundPosition: "200% center" }}
                  whileHover={{ backgroundPosition: "-200% center" }}
                  transition={{ duration: 0.7, ease: "easeInOut" }}
                />
                <span style={{ position: "relative", zIndex: 1 }}>Mulai Pre-Assessment Sekarang</span>
                <motion.span
                  style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center" }}
                  whileHover={{ x: 3 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.span>
              </Link>
            </motion.div>

            <p className="text-[11px] mt-3 text-center" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
              S&amp;K berlaku · Baca sebelum memulai
            </p>
          </div>
        </div>
      </motion.div>

      {/* Assessment — plain */}
      <motion.div className="flex flex-col" style={{ border: `1px solid ${rule}` }} {...fadeUp(0.08)}>
        <div style={{ height: 3, background: rule }} />
        <div className="flex flex-col flex-1 px-7 pt-6 pb-7">
          <span
            className="self-start text-[10px] font-bold tracking-[0.16em] uppercase mb-5 px-3 py-1"
            style={{ border: `1px solid ${rule}`, color: muted, fontFamily: "'Manrope', sans-serif" }}
          >
            Layanan Lanjutan
          </span>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>Layanan</p>
          <h3
            className="font-bold-hero leading-[1.1] tracking-[-0.02em] mb-6"
            style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)", color: blue }}
          >
            Assessment
          </h3>
          <FeatureList items={assessFeatures} accent={muted} />
          <div className="mt-auto">
            <div className="h-px mb-5" style={{ background: rule }} />
            <p className="text-[10px] font-bold tracking-[0.16em] uppercase mb-1" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>Mulai dari</p>
            <p className="font-bold-hero tracking-[-0.02em] mb-6" style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", color: blue }}>Rp 5.700.000</p>
            <motion.a
              href="/pricing"
              whileHover={{ scale: 1.018 }}
              whileTap={{ scale: 0.975 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="w-full flex items-center justify-center rounded-full font-semibold"
              style={{ height: 46, border: `1px solid ${rule}`, background: "white", color: blue, fontSize: 14, fontFamily: "'Manrope', sans-serif", textDecoration: "none" }}
            >
              Pelajari Lebih Lanjut
            </motion.a>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/preassessment/ServiceCards.jsx
git commit -m "refactor: ServiceCards navigates to /preassessment instead of showing TermsModal"
```

---

### Task 2: Update `ServiceCTA.jsx` — navigate ke `/preassessment`

**Files:**
- Modify: `frontend/src/components/preassessment/ServiceCTA.jsx`

- [ ] **Step 1: Ganti button menjadi Link**

Ganti seluruh isi `frontend/src/components/preassessment/ServiceCTA.jsx` dengan:

```jsx
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { orange, muted, EASE, fadeUp } from "./tokens";

export default function ServiceCTA() {
  return (
    <motion.div className="flex flex-col items-center text-center gap-5" {...fadeUp(0.1)}>
      <p
        className="text-[11px] font-bold tracking-[0.26em] uppercase"
        style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}
      >
        Siap memulai?
      </p>
      <motion.div whileHover={{ scale: 1.025 }} whileTap={{ scale: 0.968 }} transition={{ duration: 0.22, ease: EASE }}>
        <Link
          to="/preassessment"
          className="rounded-full font-semibold text-white relative overflow-hidden"
          style={{
            height: 46,
            background: orange,
            fontSize: 14,
            fontFamily: "'Manrope', sans-serif",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            maxWidth: 420,
            minWidth: 280,
            textDecoration: "none",
            padding: "0 1.5rem",
          }}
        >
          <motion.span
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.18) 50%, transparent 65%)",
              backgroundSize: "200% 100%",
            }}
            initial={{ backgroundPosition: "200% center" }}
            whileHover={{ backgroundPosition: "-200% center" }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
          />
          <span style={{ position: "relative", zIndex: 1 }}>Mulai Pre-Assessment Sekarang</span>
          <motion.span
            style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center" }}
            whileHover={{ x: 3 }}
            transition={{ duration: 0.2 }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.span>
        </Link>
      </motion.div>
      <p className="text-xs" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
        S&K berlaku · Baca sebelum memulai
      </p>
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/preassessment/ServiceCTA.jsx
git commit -m "refactor: ServiceCTA navigates to /preassessment instead of showing TermsModal"
```

---

### Task 3: Rename `PreassessmentPage.jsx` → `LayananPage.jsx`

**Files:**
- Rename: `frontend/src/pages/PreassessmentPage.jsx` → `frontend/src/pages/LayananPage.jsx`

- [ ] **Step 1: Git mv dan bersihkan state form**

```bash
git mv frontend/src/pages/PreassessmentPage.jsx frontend/src/pages/LayananPage.jsx
```

Buka `frontend/src/pages/LayananPage.jsx`. Ganti seluruh isi dengan versi bersih (tanpa `showForm` state dan `ConsultationForm`):

```jsx
import { motion } from "framer-motion";
import ServiceHeader  from "../components/preassessment/ServiceHeader";
import ServiceCards   from "../components/preassessment/ServiceCards";
import AlurPelayanan  from "../components/preassessment/AlurPelayanan";
import ServiceCTA     from "../components/preassessment/ServiceCTA";
import { rule } from "../components/preassessment/tokens";

export default function LayananPage() {
  return (
    <div className="bg-white overflow-x-hidden">

      {/* Header + Service Cards */}
      <section className="pt-32 pb-20 px-4 sm:px-6 md:px-8">
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <ServiceHeader />
          <div className="mt-14 h-px" style={{ background: rule }} />
          <div className="mt-14">
            <ServiceCards />
          </div>
        </div>
      </section>

      {/* Alur Pelayanan */}
      <AlurPelayanan />

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 md:px-8">
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div className="h-px mb-16" style={{ background: rule }} />
          <ServiceCTA />
        </div>
      </section>

    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/LayananPage.jsx
git commit -m "refactor: rename PreassessmentPage to LayananPage, remove inline form state"
```

---

### Task 4: Buat `PreassessmentPage.jsx` baru

**Files:**
- Create: `frontend/src/pages/PreassessmentPage.jsx`

- [ ] **Step 1: Buat file**

Buat `frontend/src/pages/PreassessmentPage.jsx` dengan isi:

```jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import BenefitSection  from "../components/preassessment/BenefitSection";
import ProsesPelayanan from "../components/preassessment/ProsesPelayanan";
import TermsModal      from "../components/preassessment/TermsModal";
import { orange, muted, EASE, fadeUp } from "../components/preassessment/tokens";

export default function PreassessmentPage() {
  const navigate = useNavigate();
  const [showTerms, setShowTerms] = useState(false);

  const handleAcceptTerms = () => {
    setShowTerms(false);
    navigate("/preassessment/form");
  };

  return (
    <>
      <div className="bg-white overflow-x-hidden">
        <BenefitSection />
        <ProsesPelayanan />

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 md:px-8">
          <div style={{ maxWidth: 1120, margin: "0 auto" }}>
            <motion.div className="flex flex-col items-center text-center gap-5" {...fadeUp(0.1)}>
              <p
                className="text-[11px] font-bold tracking-[0.26em] uppercase"
                style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}
              >
                Siap memulai?
              </p>
              <motion.button
                type="button"
                onClick={() => setShowTerms(true)}
                whileHover={{ scale: 1.025 }}
                whileTap={{ scale: 0.968 }}
                transition={{ duration: 0.22, ease: EASE }}
                className="rounded-full font-semibold text-white relative overflow-hidden"
                style={{
                  height: 46,
                  background: orange,
                  border: "none",
                  fontSize: 14,
                  fontFamily: "'Manrope', sans-serif",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  minWidth: 280,
                  padding: "0 1.5rem",
                }}
              >
                <motion.span
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.18) 50%, transparent 65%)",
                    backgroundSize: "200% 100%",
                  }}
                  initial={{ backgroundPosition: "200% center" }}
                  whileHover={{ backgroundPosition: "-200% center" }}
                  transition={{ duration: 0.7, ease: "easeInOut" }}
                />
                <span style={{ position: "relative", zIndex: 1 }}>Lanjut ke Formulir Pendaftaran</span>
                <motion.span
                  style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center" }}
                  whileHover={{ x: 3 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.span>
              </motion.button>
              <p className="text-xs" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
                S&K berlaku · Baca sebelum memulai
              </p>
            </motion.div>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {showTerms && (
          <TermsModal
            onAccept={handleAcceptTerms}
            onClose={() => setShowTerms(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/PreassessmentPage.jsx
git commit -m "feat: add PreassessmentPage with BenefitSection, ProsesPelayanan, and TermsModal CTA"
```

---

### Task 5: Buat `PreassessmentFormPage.jsx`

**Files:**
- Create: `frontend/src/pages/PreassessmentFormPage.jsx`

- [ ] **Step 1: Buat file**

Buat `frontend/src/pages/PreassessmentFormPage.jsx` dengan isi:

```jsx
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ConsultationForm from "../components/preassessment/ConsultationForm";
import { blue, muted, rule, EASE } from "../components/preassessment/tokens";

export default function PreassessmentFormPage() {
  const navigate = useNavigate();

  return (
    <section className="bg-white pt-32 pb-24 px-4 sm:px-6 md:px-8">
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <motion.button
          type="button"
          onClick={() => navigate("/preassessment")}
          className="flex items-center gap-2 mb-8 text-sm font-semibold"
          style={{ color: muted, fontFamily: "'Manrope', sans-serif", background: "none", border: "none", cursor: "pointer" }}
          whileHover={{ x: -3 }}
          transition={{ duration: 0.2 }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Kembali
        </motion.button>
        <p className="text-[11px] font-bold tracking-[0.26em] uppercase mb-5" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
          Pre-Assessment
        </p>
        <h1
          className="font-bold-hero leading-[1.08] tracking-[-0.03em] mb-3"
          style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: blue }}
        >
          Isi Data Konsultasi
        </h1>
        <div className="h-px mb-10" style={{ background: rule }} />
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <ConsultationForm onBackToIntro={() => navigate("/preassessment")} />
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/PreassessmentFormPage.jsx
git commit -m "feat: add PreassessmentFormPage as dedicated route for ConsultationForm"
```

---

### Task 6: Update `App.jsx` — daftarkan semua route baru

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Update imports dan routes**

Ganti seluruh isi `frontend/src/App.jsx` dengan:

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
const Home                   = lazy(() => import('./pages/Home'));
const NewTools               = lazy(() => import('./pages/NewTools'));
const ToolDetail             = lazy(() => import('./pages/ToolDetail'));
const Case                   = lazy(() => import('./pages/Case'));
const CaseDetail             = lazy(() => import('./pages/CaseDetail'));
const LayananPage            = lazy(() => import('./pages/LayananPage'));
const PreassessmentPage      = lazy(() => import('./pages/PreassessmentPage'));
const PreassessmentFormPage  = lazy(() => import('./pages/PreassessmentFormPage'));
const ReviewConfirmationPage = lazy(() => import('./pages/ReviewConfirmationPage'));
const WaitingPage            = lazy(() => import('./pages/WaitingPage'));
const PaymentSuccessPage     = lazy(() => import('./pages/PaymentSuccessPage'));
const PaymentPendingPage     = lazy(() => import('./pages/PaymentPendingPage'));
const PaymentFailedPage      = lazy(() => import('./pages/PaymentFailedPage'));
const PaymentUploadPage      = lazy(() => import('./pages/PaymentUploadPage'));
const SessionUsedPage        = lazy(() => import('./pages/SessionUsedPage'));
const SessionPendingPage     = lazy(() => import('./pages/SessionPendingPage'));
const SessionExpiredPage     = lazy(() => import('./pages/SessionExpiredPage'));
const SessionInvalidPage     = lazy(() => import('./pages/SessionInvalidPage'));
const JoinPage               = lazy(() => import('./pages/JoinPage'));
const Pricing                = lazy(() => import('./pages/Pricing'));

// Admin pages
const AdminConsultations = lazy(() => import('./pages/admin/AdminConsultations'));
const AdminTools         = lazy(() => import('./pages/admin/AdminTools'));
const AdminCases         = lazy(() => import('./pages/admin/AdminCases'));
const AdminCaseEditor    = lazy(() => import('./pages/admin/AdminCaseEditor'));
const AdminConsultants   = lazy(() => import('./pages/admin/AdminConsultants'));

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<FullscreenLoader />}>
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

          {/* Admin login (outside AdminLayout) */}
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
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: register /layanan, /preassessment, /preassessment/form routes in App"
```

---

### Task 7: Hapus `Assesment.jsx` dan verifikasi akhir

**Files:**
- Delete: `frontend/src/pages/Assesment.jsx`

- [ ] **Step 1: Hapus file kosong**

```bash
git rm frontend/src/pages/Assesment.jsx
git commit -m "chore: remove empty Assesment.jsx"
```

- [ ] **Step 2: Jalankan dev server dan verifikasi alur**

```bash
cd frontend && npm run dev
```

Cek di browser:
1. Buka `/layanan` → tampil ServiceHeader, ServiceCards, AlurPelayanan, ServiceCTA
2. Klik "Mulai Pre-Assessment Sekarang" di ServiceCard → navigate ke `/preassessment`
3. Di `/preassessment` → tampil BenefitSection + ProsesPelayanan + tombol CTA
4. Klik tombol CTA → muncul TermsModal
5. Klik Accept di TermsModal → navigate ke `/preassessment/form`
6. Di `/preassessment/form` → tampil form dengan tombol Kembali
7. Klik Kembali → kembali ke `/preassessment`
8. Klik tombol CTA di ServiceCTA (`/layanan`) → navigate ke `/preassessment`
