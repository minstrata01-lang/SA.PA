# SEO Domain Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify all domain references to `https://sapa.services` across SEO component, index.html, robots.txt, and add missing SEO meta to Pricing page — resolving all 3 Google Search Console coverage errors.

**Architecture:** Pure config/markup changes across 4 files. No new components needed. `SEO.jsx` is the single source of truth for canonical URLs at runtime; `index.html` covers the static pre-JS state; `robots.txt` guides Googlebot to the correct sitemap.

**Tech Stack:** React + react-helmet-async, Vite, Vercel

---

### Task 1: Fix BASE_URL in SEO.jsx

**Files:**
- Modify: `frontend/src/components/SEO.jsx:3`

- [ ] **Step 1: Open `frontend/src/components/SEO.jsx` and change `BASE_URL`**

  Replace line 3:

  ```js
  // Before
  const BASE_URL = 'https://sapa.stratalift.co.id';

  // After
  const BASE_URL = 'https://sapa.services';
  ```

- [ ] **Step 2: Verify the constant and all derived URLs look correct**

  After the change, lines 3–5 should read:

  ```js
  const BASE_URL = 'https://sapa.services';
  const DEFAULT_IMAGE = `${BASE_URL}/og-image.jpg`;
  const DEFAULT_DESC = 'SA.PA menyediakan layanan pre-assessment, ...';
  ```

  And line 23 (url derivation) should stay unchanged:
  ```js
  const url = canonical ? `${BASE_URL}${canonical}` : BASE_URL;
  ```
  This now resolves to e.g. `https://sapa.services/layanan`. ✅

- [ ] **Step 3: Commit**

  ```bash
  git add frontend/src/components/SEO.jsx
  git commit -m "fix: update SEO.jsx BASE_URL to sapa.services"
  ```

---

### Task 2: Fix domain references in index.html

**Files:**
- Modify: `frontend/index.html` (lines 16, 20, 23, 31, 50)

- [ ] **Step 1: Replace all `sapa.stratalift.co.id` references with `sapa.services`**

  There are 5 occurrences. After editing, the relevant lines should read:

  ```html
  <!-- line 16 -->
  <link rel="canonical" href="https://sapa.services/" />

  <!-- line 20 -->
  <meta property="og:url" content="https://sapa.services/" />

  <!-- line 23 -->
  <meta property="og:image" content="https://sapa.services/og-image.jpg" />

  <!-- line 31 -->
  <meta name="twitter:image" content="https://sapa.services/og-image.jpg" />

  <!-- line 50 (inside ld+json script) -->
  "url": "https://sapa.services",
  ```

- [ ] **Step 2: Verify no `sapa.stratalift.co.id` remains in index.html**

  Run:
  ```bash
  grep "sapa.stratalift" frontend/index.html
  ```
  Expected output: *(no output — zero matches)*

- [ ] **Step 3: Commit**

  ```bash
  git add frontend/index.html
  git commit -m "fix: update index.html canonical and OG URLs to sapa.services"
  ```

---

### Task 3: Fix sitemap URL in robots.txt

**Files:**
- Modify: `frontend/public/robots.txt:17`

- [ ] **Step 1: Open `frontend/public/robots.txt` and update the Sitemap line**

  Replace line 17:

  ```
  # Before
  Sitemap: https://sapa.stratalift.co.id/sitemap.xml

  # After
  Sitemap: https://sapa.services/sitemap.xml
  ```

  Full file should now look like:
  ```
  User-agent: *
  Allow: /
  Disallow: /admin
  Disallow: /admin/
  Disallow: /admin-login
  Disallow: /admin/login
  Disallow: /payment/
  Disallow: /preassessment/form
  Disallow: /preassessment/review-confirmation
  Disallow: /waiting
  Disallow: /join
  Disallow: /session-used
  Disallow: /session-pending
  Disallow: /session-expired
  Disallow: /session-invalid

  Sitemap: https://sapa.services/sitemap.xml
  ```

- [ ] **Step 2: Verify no `sapa.stratalift.co.id` remains anywhere in public/**

  Run:
  ```bash
  grep -r "sapa.stratalift" frontend/public/
  ```
  Expected output: *(no output — zero matches)*

- [ ] **Step 3: Commit**

  ```bash
  git add frontend/public/robots.txt
  git commit -m "fix: update robots.txt sitemap URL to sapa.services"
  ```

---

### Task 4: Add SEO component to Pricing.jsx

**Files:**
- Modify: `frontend/src/pages/Pricing.jsx`

- [ ] **Step 1: Add the SEO import at the top of `frontend/src/pages/Pricing.jsx`**

  After the existing imports (currently lines 1–4), add:

  ```jsx
  import SEO from '../components/SEO';
  ```

  The top of the file should now look like:

  ```jsx
  import { useState } from "react";
  import { motion } from "framer-motion";
  import { Link } from "react-router-dom";
  import SEO from '../components/SEO';
  ```

- [ ] **Step 2: Add `<SEO>` as the first child inside the Pricing return**

  Locate the JSX return in the Pricing component. Wrap the existing return content in a fragment and add `<SEO>` first:

  ```jsx
  return (
    <>
      <SEO
        title="Harga Layanan Pre-Assessment & Investigasi Struktural"
        description="Lihat paket harga layanan konsultasi struktural SA.PA mulai Rp500.000. Pre-assessment, diagnosis, dan investigasi geoteknik oleh tim bersertifikat."
        canonical="/pricing"
      />
      {/* existing JSX continues unchanged below */}
  ```

- [ ] **Step 3: Verify the Pricing page now generates a canonical tag**

  Start the dev server:
  ```bash
  cd frontend && npm run dev
  ```
  Open `http://localhost:5173/pricing` in browser → DevTools → Elements → `<head>`. Confirm:
  ```html
  <link rel="canonical" href="https://sapa.services/pricing" />
  <meta name="description" content="Lihat paket harga layanan konsultasi struktural SA.PA ..." />
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add frontend/src/pages/Pricing.jsx
  git commit -m "feat: add SEO meta tags to Pricing page"
  ```

---

### Task 5: Final verification

- [ ] **Step 1: Confirm zero `sapa.stratalift.co.id` references remain in the frontend**

  Run:
  ```bash
  grep -r "sapa.stratalift" frontend/ --include="*.jsx" --include="*.html" --include="*.txt" --include="*.json" --include="*.xml"
  ```
  Expected output: *(no output)*

- [ ] **Step 2: Confirm sitemap still uses `sapa.services`**

  Run:
  ```bash
  grep "sapa.services" frontend/public/sitemap.xml
  ```
  Expected output: 6 lines, all URLs starting with `https://sapa.services/`

- [ ] **Step 3: After deploy, submit sitemap to GSC**

  Go to Google Search Console → Sitemaps → submit `https://sapa.services/sitemap.xml` to trigger fresh crawl.
