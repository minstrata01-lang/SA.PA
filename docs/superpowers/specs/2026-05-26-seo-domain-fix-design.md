# SEO Domain Fix Design

**Date:** 2026-05-26  
**Issue Source:** Google Search Console Coverage Report (sapa.services)

---

## Problem

Three GSC coverage errors share a single root cause: incomplete domain migration from `sapa.stratalift.co.id` → `sapa.services`.

| GSC Issue | Count | Root Cause |
|-----------|-------|------------|
| Halaman dengan pengalihan | 1 | Google follows canonical to old domain, hits redirect |
| Halaman alternatif dengan tag kanonis yang tepat | 1 | Old domain treated as alternate page |
| Ditemukan - saat ini tidak diindeks | 5 | Canonical URLs mismatch sitemap URLs |

**Files out of sync:**

| File | Current State | Correct State |
|------|--------------|---------------|
| `frontend/public/sitemap.xml` | `sapa.services` | ✅ Already correct |
| `frontend/src/components/SEO.jsx` | `BASE_URL = sapa.stratalift.co.id` | ❌ Must update |
| `frontend/index.html` | All refs to `sapa.stratalift.co.id` | ❌ Must update |
| `frontend/public/robots.txt` | Sitemap URL `sapa.stratalift.co.id` | ❌ Must update |
| `frontend/src/pages/Pricing.jsx` | No `<SEO>` component | ❌ Missing |

---

## Solution

### Fix 1 — SEO.jsx

Change `BASE_URL` constant:

```js
// Before
const BASE_URL = 'https://sapa.stratalift.co.id';

// After
const BASE_URL = 'https://sapa.services';
```

Impact: All pages using `<SEO canonical="..." />` will emit correct canonical URLs.

### Fix 2 — index.html

Replace all occurrences of `https://sapa.stratalift.co.id` with `https://sapa.services` in:
- `<link rel="canonical">`
- `og:url`, `og:image`
- `twitter:image`
- `ld+json` structured data `"url"` field

This matters because Googlebot reads static HTML before JavaScript executes.

### Fix 3 — robots.txt

```
# Before
Sitemap: https://sapa.stratalift.co.id/sitemap.xml

# After
Sitemap: https://sapa.services/sitemap.xml
```

### Fix 4 — Pricing.jsx

Add `<SEO>` at the top of the Pricing page render:

```jsx
<SEO
  title="Harga Layanan Pre-Assessment & Investigasi Struktural"
  description="Lihat paket harga layanan konsultasi struktural SA.PA mulai Rp500.000. Pre-assessment, diagnosis, dan investigasi geoteknik oleh tim bersertifikat."
  canonical="/pricing"
/>
```

---

## Out of Scope

- Hosting-level redirect setup (Vercel dashboard)
- Sitemap.xml changes (already uses correct domain)
- Admin / payment pages (correctly noindexed)

---

## Success Criteria

After deploy, Google Search Console should show:
- No more "redirect" page errors
- No more "alternate with canonical" errors  
- `/pricing` has proper canonical tag
- All canonical URLs match `sapa.services/*`
