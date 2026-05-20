# Case Pagination & Tool Link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add numbered pagination to the Case listing (9 per page), manual page-break pagination inside long CaseDetail articles, and admin-inserted clickable tool-name links that open in a new tab.

**Architecture:** Three interconnected features sharing a `<Pagination />` UI component. Pagination state lives in URL query params (`?page=N` for listing, `?p=N` for article). Content pagination uses a custom Tiptap `PageBreak` atom node; tool links use a custom Tiptap `ToolLink` mark with a bubble-menu UI for admin.

**Tech Stack:** React 19 + React Router v7 (`useSearchParams`), Tiptap v3 (custom node + mark, `BubbleMenu` from `@tiptap/react/menus`, `useEditorState`), Supabase JS v2 (`.range()` + `count: 'exact'`), Tailwind CSS v4.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `frontend/src/components/ui/Pagination.jsx` | **Create** | Reusable numbered pagination bar |
| `frontend/src/hooks/useCases.js` | **Modify** | Add `page`/`pageSize` params, `.range()`, return `totalCount` |
| `frontend/src/pages/Case.jsx` | **Modify** | Wire `useSearchParams` + `<Pagination />` |
| `frontend/src/lib/tiptap/PageBreak.js` | **Create** | Custom Tiptap atom node for page breaks |
| `frontend/src/pages/admin/AdminCaseEditor.jsx` | **Modify** | Add PageBreak toolbar button + ToolLinkBubbleMenu |
| `frontend/src/pages/CaseDetail.jsx` | **Modify** | Content splitting logic + article pagination + ToolLink extension |
| `frontend/src/lib/tiptap/ToolLink.js` | **Create** | Custom Tiptap mark with `toolSlug`/`toolName` attrs |
| `frontend/src/components/admin/ToolLinkBubbleMenu.jsx` | **Create** | Bubble menu for linking/unlinking tool names |
| `frontend/src/index.css` | **Modify** | Add `.tool-link` styles inside `.case-prose` |

---

## Task 1: `<Pagination />` Component

**Files:**
- Create: `frontend/src/components/ui/Pagination.jsx`

### Step 1.1: Create the Pagination component

```jsx
// frontend/src/components/ui/Pagination.jsx

const blue   = "#003D6B";
const orange = "#D97706";

function buildPageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [];
  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, '...', total);
  } else if (current >= total - 3) {
    pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', total);
  }
  return pages;
}

const btnBase = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 36,
  minWidth: 36,
  borderRadius: 999,
  border: `1px solid rgba(0,61,107,0.15)`,
  background: 'white',
  fontFamily: "'Manrope', sans-serif",
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.18s ease',
  padding: '0 10px',
};

export default function Pagination({ totalCount, pageSize, currentPage, onPageChange }) {
  const totalPages = Math.ceil(totalCount / pageSize);
  if (totalPages <= 1) return null;

  const pages = buildPageRange(currentPage, totalPages);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 40 }}>
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          ...btnBase,
          color: currentPage === 1 ? 'rgba(0,61,107,0.25)' : blue,
          cursor: currentPage === 1 ? 'default' : 'pointer',
          borderColor: currentPage === 1 ? 'rgba(0,61,107,0.08)' : 'rgba(0,61,107,0.15)',
        }}
        aria-label="Halaman sebelumnya"
      >
        ←
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} style={{ color: 'rgba(0,61,107,0.35)', fontFamily: "'Manrope', sans-serif", fontSize: 13, padding: '0 4px' }}>
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            style={{
              ...btnBase,
              background: p === currentPage ? blue : 'white',
              color:      p === currentPage ? 'white' : blue,
              borderColor: p === currentPage ? blue : 'rgba(0,61,107,0.15)',
            }}
            aria-label={`Halaman ${p}`}
            aria-current={p === currentPage ? 'page' : undefined}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          ...btnBase,
          color: currentPage === totalPages ? 'rgba(0,61,107,0.25)' : blue,
          cursor: currentPage === totalPages ? 'default' : 'pointer',
          borderColor: currentPage === totalPages ? 'rgba(0,61,107,0.08)' : 'rgba(0,61,107,0.15)',
        }}
        aria-label="Halaman berikutnya"
      >
        →
      </button>
    </div>
  );
}
```

- [ ] **Step 1.1:** Create file `frontend/src/components/ui/Pagination.jsx` with the code above.

- [ ] **Step 1.2: Verify component renders without errors**

  Start dev server if not running: `cd frontend && npm run dev`

  Import Pagination in a page temporarily and check it renders. Then remove the temporary import.

- [ ] **Step 1.3: Commit**

  ```
  git add frontend/src/components/ui/Pagination.jsx
  git commit -m "feat: tambah komponen Pagination reusable"
  ```

---

## Task 2: `useCases` Hook — Pagination Support

**Files:**
- Modify: `frontend/src/hooks/useCases.js`

- [ ] **Step 2.1: Rewrite `useCases` to accept `page` and `pageSize`**

  Replace the entire file content with:

  ```js
  // frontend/src/hooks/useCases.js
  import { useCallback, useEffect, useState } from 'react';
  import { supabase } from '../supabaseClient';

  export function useCases({ page = 1, pageSize = 9 } = {}) {
    const [data, setData]           = useState([]);
    const [totalCount, setTotal]    = useState(0);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState(null);

    const fetchData = useCallback(async () => {
      setLoading(true);
      setError(null);
      const from = (page - 1) * pageSize;
      const to   = from + pageSize - 1;
      const { data: rows, count, error: err } = await supabase
        .from('cases')
        .select('*', { count: 'exact' })
        .eq('status', 'published')
        .order('sort_order', { ascending: true })
        .range(from, to);
      if (err) {
        setError(err.message);
      } else {
        setData(rows || []);
        setTotal(count ?? 0);
      }
      setLoading(false);
    }, [page, pageSize]);

    useEffect(() => { fetchData(); }, [fetchData]);

    return { data, totalCount, loading, error, refetch: fetchData };
  }
  ```

- [ ] **Step 2.2: Verify no TypeScript/build errors**

  Run: `cd frontend && npm run build 2>&1 | head -30`

  Expected: build succeeds with no errors about `useCases`.

- [ ] **Step 2.3: Commit**

  ```
  git add frontend/src/hooks/useCases.js
  git commit -m "feat: useCases mendukung pagination dengan range dan totalCount"
  ```

---

## Task 3: `Case.jsx` — Wire Pagination

**Files:**
- Modify: `frontend/src/pages/Case.jsx`

- [ ] **Step 3.1: Update `Case.jsx` with `useSearchParams` and `<Pagination />`**

  Replace the entire file content with:

  ```jsx
  // frontend/src/pages/Case.jsx
  import { useSearchParams } from "react-router-dom";
  import { motion } from "framer-motion";
  import { useReducedMotion } from "framer-motion";
  import CardCase from "../components/Card/CardCase";
  import Pagination from "../components/ui/Pagination";
  import { useCases } from "../hooks/useCases";
  import SEO from "../components/SEO";

  const blue   = "#003D6B";
  const orange = "#D97706";
  const muted  = "rgba(0,61,107,0.5)";
  const rule   = "rgba(0,61,107,0.1)";
  const PAGE_SIZE = 9;

  const EASE = [0.22, 1, 0.36, 1];

  function Case() {
      const prefersReduced = useReducedMotion();
      const [searchParams, setSearchParams] = useSearchParams();
      const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

      const { data: cases, totalCount, loading } = useCases({ page: currentPage, pageSize: PAGE_SIZE });

      const handlePageChange = (page) => {
          setSearchParams({ page: String(page) });
          window.scrollTo({ top: 0, behavior: 'smooth' });
      };

      if (loading) {
          return (
              <section className="bg-white pt-28 pb-14 px-4 sm:px-6 md:px-8 flex items-center justify-center" style={{ minHeight: '60vh' }}>
                  <div className="w-8 h-8 border-4 border-slate-200 border-t-[#F58220] rounded-full animate-spin" />
              </section>
          );
      }

      return (
          <section className="bg-white pt-28 pb-14 px-4 sm:px-6 md:px-8">
              <SEO
                  title="Studi Kasus Struktural"
                  description="Pelajari berbagai kasus kerusakan dan masalah struktural bangunan yang pernah ditangani tim SA.PA. Temukan solusi berbasis data akurat untuk masalah bangunan Anda."
                  canonical="/case"
              />
              <div style={{ maxWidth: 1120, margin: "0 auto" }}>

                  {/* Header */}
                  <motion.div
                      className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-0"
                      initial={{ opacity: 0, y: prefersReduced ? 0 : 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, ease: EASE }}
                  >
                      <div className="max-w-lg">
                          <p
                              className="text-[11px] font-bold tracking-[0.26em] uppercase mb-5"
                              style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}
                          >
                              Catatan Kasus
                          </p>
                          <h1
                              className="font-bold-hero leading-[1.08] tracking-[-0.03em]"
                              style={{ fontSize: "clamp(2rem, 3.5vw, 3.2rem)", color: blue }}
                          >
                              Kenali Masalahnya,{" "}
                              <span style={{ color: orange }}>Temukan</span> Solusinya.
                          </h1>
                      </div>

                      <p
                          className="text-base leading-relaxed max-w-xs pb-1"
                          style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}
                      >
                          Pelajari berbagai kasus kebocoran dan kerusakan bangunan yang sering muncul,
                          agar Anda bisa mengambil keputusan perbaikan secara tepat dan terukur.
                      </p>
                  </motion.div>

                  {/* Rule */}
                  <div className="mt-8 mb-8 h-px" style={{ background: rule }} />

                  {/* Cards grid */}
                  <div className="grid gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                      {cases.map((item, index) => (
                          <motion.div
                              key={item.id}
                              initial={{ opacity: 0, y: prefersReduced ? 0 : 28 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true, amount: 0.15 }}
                              transition={{ duration: 0.6, delay: index * 0.07, ease: EASE }}
                          >
                              <CardCase
                                  img={item.cover_image_url}
                                  title={item.title}
                                  description={item.summary}
                                  to={`/case/${item.slug}`}
                                  index={index}
                              />
                          </motion.div>
                      ))}
                  </div>

                  {/* Pagination */}
                  <Pagination
                      totalCount={totalCount}
                      pageSize={PAGE_SIZE}
                      currentPage={currentPage}
                      onPageChange={handlePageChange}
                  />
              </div>
          </section>
      );
  }

  export default Case;
  ```

- [ ] **Step 3.2: Verify in browser**

  Open `http://localhost:5173/case` (or the Vite port). Check:
  - Cards load for page 1
  - If total cases > 9, pagination bar appears below grid
  - Clicking a page number updates URL to `?page=2` and loads new cards
  - Prev/Next arrow buttons work and disable at boundaries
  - Back button restores previous page from URL

- [ ] **Step 3.3: Commit**

  ```
  git add frontend/src/pages/Case.jsx
  git commit -m "feat: Case listing pagination dengan URL query param ?page"
  ```

---

## Task 4: `PageBreak` Tiptap Node

**Files:**
- Create: `frontend/src/lib/tiptap/PageBreak.js`

- [ ] **Step 4.1: Create the PageBreak extension**

  ```js
  // frontend/src/lib/tiptap/PageBreak.js
  import { Node, mergeAttributes } from '@tiptap/core';

  export const PageBreak = Node.create({
    name: 'pageBreak',
    group: 'block',
    atom: true,

    parseHTML() {
      return [{ tag: 'div[data-page-break]' }];
    },

    renderHTML({ HTMLAttributes }) {
      return ['div', mergeAttributes(HTMLAttributes, { 'data-page-break': '' }), 0];
    },

    addCommands() {
      return {
        setPageBreak:
          () =>
          ({ chain }) =>
            chain().insertContent({ type: 'pageBreak' }).run(),
      };
    },
  });
  ```

- [ ] **Step 4.2: Commit**

  ```
  git add frontend/src/lib/tiptap/PageBreak.js
  git commit -m "feat: tambah Tiptap PageBreak atom node"
  ```

---

## Task 5: Admin Editor — PageBreak Toolbar Button

**Files:**
- Modify: `frontend/src/pages/admin/AdminCaseEditor.jsx`

Two changes needed in this file:
1. Import `PageBreak` and add to `extensions` array in `useEditor`
2. Add toolbar button for inserting PageBreak

- [ ] **Step 5.1: Add PageBreak import at the top of AdminCaseEditor.jsx**

  After the existing imports, add:
  ```js
  import { PageBreak } from '../../lib/tiptap/PageBreak';
  ```

- [ ] **Step 5.2: Add `PageBreak` to the `extensions` array in `useEditor`**

  Find:
  ```js
    extensions: [
      StarterKit,
      CustomImage,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Mulai menulis konten kasus...' }),
    ],
  ```
  Replace with:
  ```js
    extensions: [
      StarterKit,
      CustomImage,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Mulai menulis konten kasus...' }),
      PageBreak,
    ],
  ```

- [ ] **Step 5.3: Add PageBreak toolbar button after the image button**

  Find the closing `</div>` of the sticky toolbar section — it comes right after the image upload `<input>`. Add the separator and button just before that closing `</div>`:

  Find:
  ```jsx
              <input
                ref={imgInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageFileChange}
              />
            </div>
  ```
  Replace with:
  ```jsx
              <input
                ref={imgInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageFileChange}
              />

              <div className="mx-1 h-5 w-px bg-slate-200" />

              <button
                type="button"
                title="Sisipkan pemisah halaman"
                onClick={() => editor.chain().focus().setPageBreak().run()}
                className="h-7 rounded px-2 text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                ⊟ Halaman Baru
              </button>
            </div>
  ```

- [ ] **Step 5.4: Add CSS for PageBreak in editor (admin view)**

  Open `frontend/src/index.css`. Find the `@layer utilities {` block (or add after existing utility styles). Add:

  ```css
  /* PageBreak — visible in admin editor as dashed divider */
  .case-editor div[data-page-break] {
    display: block;
    border: none;
    border-top: 2px dashed rgba(0,61,107,0.25);
    margin: 1.5rem 0;
    position: relative;
    pointer-events: none;
    user-select: none;
  }
  .case-editor div[data-page-break]::after {
    content: '— Halaman Baru —';
    position: absolute;
    top: -0.65em;
    left: 50%;
    transform: translateX(-50%);
    background: white;
    padding: 0 0.75rem;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(0,61,107,0.35);
    font-family: 'Manrope', sans-serif;
  }
  ```

- [ ] **Step 5.5: Verify in browser**

  Open an admin case editor. Check:
  - "⊟ Halaman Baru" button appears in toolbar
  - Clicking it inserts a dashed "— Halaman Baru —" divider at cursor position
  - Saving and reloading preserves the page break in Tiptap JSON

- [ ] **Step 5.6: Commit**

  ```
  git add frontend/src/pages/admin/AdminCaseEditor.jsx frontend/src/index.css
  git commit -m "feat: toolbar PageBreak di AdminCaseEditor dengan visual dashed divider"
  ```

---

## Task 6: `CaseDetail.jsx` — Content Splitting & Article Pagination

**Files:**
- Modify: `frontend/src/pages/CaseDetail.jsx`

- [ ] **Step 6.1: Rewrite `CaseDetail.jsx` with splitting logic and article pagination**

  Replace the entire file content with:

  ```jsx
  // frontend/src/pages/CaseDetail.jsx
  import { useEffect, useState } from "react";
  import { useParams, Link, useSearchParams } from "react-router-dom";
  import { motion, useReducedMotion } from "framer-motion";
  import { useEditor, EditorContent } from "@tiptap/react";
  import StarterKit from "@tiptap/starter-kit";
  import TextAlign from "@tiptap/extension-text-align";
  import { supabase } from "../supabaseClient";
  import { CustomImage } from "../lib/tiptap/CustomImage";
  import { PageBreak } from "../lib/tiptap/PageBreak";
  import { ToolLink } from "../lib/tiptap/ToolLink";
  import Pagination from "../components/ui/Pagination";
  import OrangeButtonArrow from "../components/Button/OrangeButtonArrow";
  import SEO from "../components/SEO";

  const blue   = "#003D6B";
  const orange = "#D97706";
  const muted  = "rgba(0,61,107,0.5)";
  const rule   = "rgba(0,61,107,0.1)";
  const EASE   = [0.22, 1, 0.36, 1];

  function normalizeContent(raw) {
    if (!raw) return { type: 'doc', content: [] };
    if (typeof raw === 'string') {
      return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: raw }] }] };
    }
    if (typeof raw === 'object' && raw.type === 'doc') return raw;
    return { type: 'doc', content: [] };
  }

  // Split Tiptap JSON content array on pageBreak nodes.
  // Returns an array of segments; each segment is an array of nodes (without the pageBreak itself).
  function splitOnPageBreaks(nodes) {
    const segments = [];
    let current = [];
    for (const node of nodes) {
      if (node.type === 'pageBreak') {
        segments.push(current);
        current = [];
      } else {
        current.push(node);
      }
    }
    segments.push(current);
    return segments;
  }

  function CaseDetail() {
    const { slug } = useParams();
    const prefersReduced = useReducedMotion();
    const [searchParams, setSearchParams] = useSearchParams();
    const [caseItem, setCaseItem] = useState(null);
    const [loading, setLoading]   = useState(true);

    // Segments derived from full_description
    const [segments, setSegments] = useState([]);
    const currentArticlePage = Math.max(1, parseInt(searchParams.get('p') || '1', 10));

    const editor = useEditor({
      extensions: [
        StarterKit,
        CustomImage,
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        PageBreak,
        ToolLink,
      ],
      content: { type: 'doc', content: [] },
      editable: false,
    });

    useEffect(() => {
      let cancelled = false;
      supabase
        .from('cases')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle()
        .then(({ data }) => {
          if (!cancelled) {
            setCaseItem(data);
            if (data?.full_description) {
              const doc = normalizeContent(data.full_description);
              const segs = splitOnPageBreaks(doc.content || []);
              setSegments(segs);
            }
            setLoading(false);
          }
        });
      return () => { cancelled = true; };
    }, [slug]);

    // Update editor whenever segments or current page changes
    useEffect(() => {
      if (!editor || segments.length === 0) return;
      const idx = Math.min(currentArticlePage - 1, segments.length - 1);
      editor.commands.setContent({ type: 'doc', content: segments[idx] });
    }, [editor, segments, currentArticlePage]);

    const handleArticlePageChange = (p) => {
      const params = {};
      if (searchParams.get('page')) params.page = searchParams.get('page');
      params.p = String(p);
      setSearchParams(params);
      window.scrollTo(0, 0);
    };

    if (loading) {
      return (
        <section className="bg-white pt-28 pb-14 px-4 flex items-center justify-center" style={{ minHeight: '60vh' }}>
          <div className="w-8 h-8 border-4 border-slate-200 border-t-[#F58220] rounded-full animate-spin" />
        </section>
      );
    }

    if (!caseItem) {
      return (
        <section className="bg-white min-h-[60vh] flex items-center justify-center px-4 sm:px-6 md:px-8 py-24">
          <div style={{ maxWidth: 480, textAlign: "center" }}>
            <p className="text-[11px] font-bold tracking-[0.26em] uppercase mb-4" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
              404
            </p>
            <h1 className="font-bold-hero leading-[1.08] tracking-[-0.03em] mb-4" style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: blue }}>
              Kasus tidak ditemukan
            </h1>
            <div className="h-px mb-6" style={{ background: rule }} />
            <p className="text-sm leading-relaxed mb-8" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
              Data kasus yang Anda cari tidak tersedia. Silakan kembali ke daftar kasus untuk memilih studi kasus lainnya.
            </p>
            <OrangeButtonArrow buttonText="Kembali ke Daftar Kasus" to="/case" />
          </div>
        </section>
      );
    }

    const totalArticlePages = segments.length;

    return (
      <div className="bg-white">
        <SEO
          title={caseItem.title}
          description={caseItem.summary || `Studi kasus: ${caseItem.title}. Baca analisis lengkap dan rekomendasi dari tim ahli struktural SA.PA.`}
          canonical={`/case/${caseItem.slug}`}
          ogImage={caseItem.cover_image_url}
        />

        {/* ── Header: solid navy background ── */}
        <div
          className="relative w-full overflow-hidden pt-28 pb-10 sm:pb-12 px-4 sm:px-6 md:px-8"
          style={{
            background: blue,
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1.5px, transparent 1.5px)",
            backgroundSize: "28px 28px",
          }}
        >
          <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: orange }} />

          <div style={{ maxWidth: 1120, margin: "0 auto", position: "relative" }}>
            {/* Breadcrumb */}
            <motion.div
              className="flex items-center gap-2 mb-6"
              {...(prefersReduced ? {} : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, ease: EASE } })}
            >
              <Link
                to="/case"
                className="text-[11px] font-bold tracking-[0.18em] uppercase transition-colors duration-200"
                style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Manrope', sans-serif", textDecoration: "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = orange)}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
              >
                Catatan Kasus
              </Link>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.25 }}>
                <path d="M4 2l4 4-4 4" stroke={orange} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span
                className="text-[11px] font-bold tracking-[0.18em] uppercase line-clamp-1"
                style={{ color: orange, fontFamily: "'Manrope', sans-serif" }}
              >
                Studi Kasus
              </span>
            </motion.div>

            {/* Category badge */}
            {caseItem.category && (
              <motion.span
                className="mb-5 inline-flex items-center gap-2 px-3 py-1"
                style={{
                  background: "rgba(217,119,6,0.15)",
                  border: "1px solid rgba(217,119,6,0.35)",
                  fontFamily: "'Manrope', sans-serif",
                }}
                {...(prefersReduced ? {} : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, ease: EASE, delay: 0.08 } })}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: orange }} />
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: orange }}>
                  {caseItem.category}
                </span>
              </motion.span>
            )}

            {/* Title */}
            <motion.h1
              className="font-bold-hero leading-[1.06] tracking-[-0.03em] text-white text-center"
              style={{ fontSize: "clamp(1.8rem, 4vw, 3.2rem)", maxWidth: 900, margin: "0 auto" }}
              {...(prefersReduced ? {} : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, ease: EASE, delay: 0.14 } })}
            >
              {caseItem.title}
            </motion.h1>
          </div>
        </div>

        {/* ── Article body ── */}
        <section className="px-4 sm:px-6 md:px-8 py-12">
          <div style={{ maxWidth: 780, margin: "0 auto" }}>
            <EditorContent editor={editor} className="case-prose" />

            {/* Article pagination — only shown when article has multiple pages */}
            {totalArticlePages > 1 && (
              <div style={{ marginTop: 12 }}>
                <p style={{ textAlign: 'center', fontSize: 12, color: muted, fontFamily: "'Manrope', sans-serif", marginBottom: 4 }}>
                  Halaman {currentArticlePage} dari {totalArticlePages}
                </p>
                <Pagination
                  totalCount={totalArticlePages}
                  pageSize={1}
                  currentPage={currentArticlePage}
                  onPageChange={handleArticlePageChange}
                />
              </div>
            )}
          </div>
        </section>

        {/* ── CTA strip ── */}
        <section className="px-4 sm:px-6 md:px-8 pb-14">
          <div style={{ maxWidth: 780, margin: "0 auto" }}>
            <div className="h-px mb-10" style={{ background: rule }} />
            <motion.div
              className="flex flex-col gap-3"
              {...(prefersReduced ? {} : { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6, ease: EASE } })}
            >
              <p className="text-xs font-semibold tracking-[0.14em] uppercase" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
                Punya masalah serupa?
              </p>
              <OrangeButtonArrow buttonText="Konsultasi Sekarang" to="/layanan" large />
              <Link
                to="/case"
                className="mt-2 inline-flex items-center gap-2 text-sm font-semibold transition-colors"
                style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = blue)}
                onMouseLeave={(e) => (e.currentTarget.style.color = muted)}
              >
                ← Kembali ke Daftar Kasus
              </Link>
            </motion.div>
          </div>
        </section>

      </div>
    );
  }

  export default CaseDetail;
  ```

- [ ] **Step 6.2: Verify in browser**

  Open a case that has no `pageBreak` nodes. Check:
  - Article renders exactly as before (no pagination bar)
  - URL has no `?p=` param

  If a case with `pageBreak` exists, open it and check:
  - Pagination bar appears below article
  - "Halaman X dari Y" counter shows correctly
  - Clicking page numbers changes `?p=` in URL and shows that segment
  - Scroll goes to top on page change

- [ ] **Step 6.3: Commit**

  ```
  git add frontend/src/pages/CaseDetail.jsx
  git commit -m "feat: CaseDetail artikel pagination via PageBreak node dan ?p= param"
  ```

---

## Task 7: `ToolLink` Tiptap Mark

**Files:**
- Create: `frontend/src/lib/tiptap/ToolLink.js`

- [ ] **Step 7.1: Create the ToolLink mark extension**

  ```js
  // frontend/src/lib/tiptap/ToolLink.js
  import { Mark, mergeAttributes } from '@tiptap/core';

  export const ToolLink = Mark.create({
    name: 'toolLink',
    keepOnSplit: false,
    exitable: true,

    addAttributes() {
      return {
        toolSlug: {
          default: null,
          parseHTML: (el) => el.getAttribute('data-tool-slug'),
          renderHTML: (attrs) => ({ 'data-tool-slug': attrs.toolSlug }),
        },
        toolName: {
          default: null,
          parseHTML: (el) => el.getAttribute('data-tool-name'),
          renderHTML: (attrs) => attrs.toolName ? { 'data-tool-name': attrs.toolName } : {},
        },
      };
    },

    parseHTML() {
      return [{ tag: 'a[data-tool-slug]' }];
    },

    renderHTML({ HTMLAttributes }) {
      const { toolSlug, toolName, ...rest } = HTMLAttributes;
      return [
        'a',
        mergeAttributes(rest, {
          href: `/tool/${toolSlug}`,
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'tool-link',
          'data-tool-slug': toolSlug,
          ...(toolName ? { 'data-tool-name': toolName } : {}),
        }),
        0,
      ];
    },

    addCommands() {
      return {
        setToolLink:
          (attrs) =>
          ({ commands }) =>
            commands.setMark('toolLink', attrs),
        unsetToolLink:
          () =>
          ({ commands }) =>
            commands.unsetMark('toolLink'),
      };
    },
  });
  ```

- [ ] **Step 7.2: Add `.tool-link` CSS to `index.css`**

  Open `frontend/src/index.css`. Append after the existing case-editor styles (or at the end of the utilities section):

  ```css
  /* ToolLink — public CaseDetail rendering */
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

  /* ToolLink — admin editor preview */
  .case-editor a.tool-link {
    color: #D97706;
    text-decoration: underline;
    text-decoration-style: dotted;
    font-weight: 600;
    cursor: default;
  }
  ```

- [ ] **Step 7.3: Commit**

  ```
  git add frontend/src/lib/tiptap/ToolLink.js frontend/src/index.css
  git commit -m "feat: tambah Tiptap ToolLink mark dan CSS tool-link"
  ```

---

## Task 8: `ToolLinkBubbleMenu` Admin Component

**Files:**
- Create: `frontend/src/components/admin/ToolLinkBubbleMenu.jsx`

This component:
- Shows when text is selected (and not an image)
- Shows "🔧 Tautkan Alat" button; clicking it opens a search dropdown of tools
- When a tool link is already active on the selection, shows "✕ Hapus Tautan Alat" instead

- [ ] **Step 8.1: Create `ToolLinkBubbleMenu.jsx`**

  ```jsx
  // frontend/src/components/admin/ToolLinkBubbleMenu.jsx
  import { useState, useEffect, useRef } from 'react';
  import { BubbleMenu } from '@tiptap/react/menus';
  import { useEditorState } from '@tiptap/react';
  import { useTools } from '../../hooks/useTools';

  export default function ToolLinkBubbleMenu({ editor }) {
    const { data: tools } = useTools();
    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState('');
    const inputRef = useRef(null);

    const { isToolLink } = useEditorState({
      editor,
      selector: (ctx) => ({
        isToolLink: ctx.editor?.isActive('toolLink') ?? false,
      }),
    });

    // Focus search input when dropdown opens
    useEffect(() => {
      if (searchOpen) {
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }, [searchOpen]);

    const filtered = (tools || []).filter((t) =>
      !query || t.name.toLowerCase().includes(query.toLowerCase())
    );

    const handleSelect = (tool) => {
      editor.chain().focus().setToolLink({ toolSlug: tool.slug, toolName: tool.name }).run();
      setSearchOpen(false);
      setQuery('');
    };

    const handleUnset = () => {
      editor.chain().focus().unsetToolLink().run();
    };

    if (!editor) return null;

    return (
      <BubbleMenu
        editor={editor}
        shouldShow={({ editor: ed, state }) => {
          // Don't show if image is active
          if (ed.isActive('image')) return false;
          // Show only when there is an actual text selection
          const { from, to } = state.selection;
          return from !== to;
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            borderRadius: 12,
            border: '1px solid rgba(0,61,107,0.12)',
            background: 'white',
            padding: 4,
            boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
          }}
        >
          {isToolLink ? (
            <button
              type="button"
              onClick={handleUnset}
              style={{
                height: 28,
                padding: '0 10px',
                borderRadius: 8,
                border: 'none',
                background: 'rgba(239,68,68,0.1)',
                color: '#dc2626',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              ✕ Hapus Tautan Alat
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              style={{
                height: 28,
                padding: '0 10px',
                borderRadius: 8,
                border: 'none',
                background: 'rgba(217,119,6,0.1)',
                color: '#D97706',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              🔧 Tautkan Alat
            </button>
          )}

          {/* Search dropdown */}
          {searchOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: 6,
                width: 240,
                borderRadius: 10,
                border: '1px solid rgba(0,61,107,0.12)',
                background: 'white',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                overflow: 'hidden',
                zIndex: 100,
              }}
            >
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari alat..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  borderBottom: '1px solid rgba(0,61,107,0.08)',
                  fontSize: 13,
                  fontFamily: "'Manrope', sans-serif",
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                {filtered.length === 0 && (
                  <p style={{ padding: '8px 12px', fontSize: 12, color: 'rgba(0,61,107,0.4)', fontFamily: "'Manrope', sans-serif" }}>
                    Tidak ada alat ditemukan
                  </p>
                )}
                {filtered.map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleSelect(tool); }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '7px 12px',
                      border: 'none',
                      background: 'none',
                      fontSize: 13,
                      fontFamily: "'Manrope', sans-serif",
                      color: '#003D6B',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,61,107,0.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    {tool.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </BubbleMenu>
    );
  }
  ```

- [ ] **Step 8.2: Commit**

  ```
  git add frontend/src/components/admin/ToolLinkBubbleMenu.jsx
  git commit -m "feat: ToolLinkBubbleMenu admin component untuk tautkan nama alat"
  ```

---

## Task 9: Integrate `ToolLink` + `ToolLinkBubbleMenu` into Admin Editor

**Files:**
- Modify: `frontend/src/pages/admin/AdminCaseEditor.jsx`

- [ ] **Step 9.1: Add imports at top of AdminCaseEditor.jsx**

  After the PageBreak import (added in Task 5), add:
  ```js
  import { ToolLink } from '../../lib/tiptap/ToolLink';
  import ToolLinkBubbleMenu from '../../components/admin/ToolLinkBubbleMenu';
  ```

- [ ] **Step 9.2: Add `ToolLink` to the `extensions` array in `useEditor`**

  Find:
  ```js
    extensions: [
      StarterKit,
      CustomImage,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Mulai menulis konten kasus...' }),
      PageBreak,
    ],
  ```
  Replace with:
  ```js
    extensions: [
      StarterKit,
      CustomImage,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Mulai menulis konten kasus...' }),
      PageBreak,
      ToolLink,
    ],
  ```

- [ ] **Step 9.3: Add `<ToolLinkBubbleMenu />` after the image alignment BubbleMenu**

  Find:
  ```jsx
          {/* Image alignment bubble menu */}
          {editor && (
            <BubbleMenu
              editor={editor}
              shouldShow={({ editor: ed }) => ed.isActive('image')}
            >
              ...
            </BubbleMenu>
          )}
  ```

  Add immediately after the closing `)}` of that block:
  ```jsx
          {/* Tool link bubble menu */}
          {editor && <ToolLinkBubbleMenu editor={editor} />}
  ```

- [ ] **Step 9.4: Verify in browser**

  Open an admin case editor. Check:
  - Select (highlight) some text → bubble menu appears with "🔧 Tautkan Alat"
  - Click "🔧 Tautkan Alat" → search dropdown opens with tool list
  - Type to filter tools
  - Click a tool → selected text turns orange with dotted underline
  - Click the orange text again → bubble menu shows "✕ Hapus Tautan Alat"
  - Click "✕ Hapus Tautan Alat" → formatting removed
  - Save article → tool link persisted in Tiptap JSON

- [ ] **Step 9.5: Commit**

  ```
  git add frontend/src/pages/admin/AdminCaseEditor.jsx
  git commit -m "feat: integrasikan ToolLink dan ToolLinkBubbleMenu ke AdminCaseEditor"
  ```

---

## Task 10: Final Verification & Regression Check

- [ ] **Step 10.1: Verify Case listing pagination end-to-end**

  - Navigate to `/case` → first 9 cases shown
  - If DB has <9 cases, no pagination bar (this is correct)
  - If DB has >9, pagination bar shows correct total pages
  - URL updates to `?page=2` on click; browser back restores `?page=1`

- [ ] **Step 10.2: Verify article pagination end-to-end**

  - Open an article WITHOUT page breaks → no pagination bar shown ✓
  - Open an article WITH 1+ page breaks → pagination bar shows; navigate between pages; scroll resets ✓
  - `?p=` param coexists with `?page=` without conflict (e.g., `/case/slug?page=2&p=1` would not cause issues)

- [ ] **Step 10.3: Verify tool links public rendering**

  - Open an article with a ToolLink in the content
  - Link renders in orange with dotted underline
  - Clicking opens `/tool/:slug` in a new tab
  - Hover changes underline to solid

- [ ] **Step 10.4: Verify backward compatibility**

  - Old articles with no `pageBreak` or `toolLink` nodes → render exactly as before ✓
  - `normalizeContent()` handles plain-string descriptions from before migration ✓

- [ ] **Step 10.5: Final commit**

  ```
  git add -A
  git commit -m "feat: case pagination, artikel page break, dan tool link — selesai"
  ```

---

## Constraints Reminder

- Tidak ada perubahan skema database — konten Tiptap JSON sudah fleksibel
- Backward compatible — artikel lama tanpa `pageBreak` tetap tampil normal
- Artikel lama tanpa `toolLink` tetap tampil normal
- `?page=` (listing) dan `?p=` (artikel) tidak konflik
