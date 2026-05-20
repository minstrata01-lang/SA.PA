# Case Study Rich Text Editor — Design Spec

**Date:** 2026-04-28  
**Status:** Approved

---

## Goal

Replace the plain `<textarea>` for `full_description` in AdminCases with a full-featured Tiptap WYSIWYG editor on a dedicated full-page editing screen. The public `CaseDetail` page renders the same JSON content read-only, so what the admin sees while editing matches what visitors see.

## Architecture

**Editor library:** Tiptap v2 (ProseMirror-based)  
**Storage format:** `full_description` column changed from `text` → `jsonb` (Tiptap document JSON)  
**Image storage:** Supabase bucket `cases` (already exists)  
**Rendering:** Tiptap `EditorContent` in read-only mode on the public page — identical output to the editor

### Data flow

```
Admin types in Tiptap editor
  → editor.getJSON() on save
  → supabase.from('cases').update({ full_description: json })

Public page loads
  → fetch full_description from Supabase (jsonb)
  → <EditorContent editor={readOnlyEditor} /> renders it
```

---

## Database Migration

Run once in Supabase SQL Editor:

```sql
ALTER TABLE cases
  ALTER COLUMN full_description TYPE jsonb
  USING CASE
    WHEN full_description IS NULL THEN NULL
    WHEN full_description = '' THEN NULL
    ELSE jsonb_build_object('type','doc','content',
      jsonb_build_array(
        jsonb_build_object('type','paragraph','content',
          jsonb_build_array(
            jsonb_build_object('type','text','text', full_description)
          )
        )
      )
    )
  END;
```

Existing plain-text `full_description` values are wrapped in a Tiptap paragraph node — no data loss.

---

## Admin Side

### Route

`/admin/cases/edit/:id` — new dedicated page, inside `AdminLayout` (auth-gated).

### Page: `AdminCaseEditor.jsx`

**Layout — two-panel:**

```
┌─────────────────────────────────────────────────────────────┐
│ ← Kembali   [Judul Case...]              [Draft ▾] [Simpan] │  ← sticky top bar
├──────────────────────────────┬──────────────────────────────┤
│  TOOLBAR (sticky)            │  PANEL KANAN (scrollable)    │
│  B I H1 H2 H3 — ≡ ⁃ 🖼      │  Cover Image [Upload]        │
│ ───────────────────────────  │  Slug                        │
│  TIPTAP EDITOR AREA          │  Kategori                    │
│  (full height, scrollable)   │  Tags (koma)                 │
│                              │  Summary                     │
│                              │  Urutan                      │
└──────────────────────────────┴──────────────────────────────┘
```

- Left panel: **65% width** — Tiptap editor with sticky toolbar
- Right panel: **35% width** — metadata fields (cover image, slug, category, tags, summary, sort_order)
- Top bar: sticky, contains back button, title `<input>`, status dropdown, Save button

**State loaded on mount:** fetch case by `:id` from Supabase, populate all fields including `full_description` JSON into Tiptap.

**Save behaviour:**
- "Simpan" button calls `supabase.from('cases').update(payload).eq('id', id)`
- Payload includes `title`, `slug`, `summary`, `full_description: editor.getJSON()`, `cover_image_url`, `category`, `tags`, `status`, `sort_order`
- Show toast on success/error
- Status dropdown: `draft` / `published`

### Tiptap Extensions

| Extension | Purpose |
|-----------|---------|
| `StarterKit` | Bold, italic, H1–H3, paragraph, bullet list, ordered list, blockquote, horizontal rule |
| `Image` (extended) | Insert images with `src`, `alt`, `data-align` attribute |
| `TextAlign` | Paragraph/heading alignment |
| `Placeholder` | "Mulai menulis konten kasus..." hint text |

### Image Insert & Positioning

Clicking the image button in the toolbar:
1. Opens a hidden `<input type="file" accept="image/*">`
2. On file select → upload to Supabase `cases` bucket (reuse `AdminImageUpload` logic)
3. On upload success → `editor.chain().focus().setImage({ src: publicUrl }).run()`

After insertion, clicking the image shows a **bubble menu** with 4 alignment buttons:

| Button | `data-align` value | CSS effect |
|--------|--------------------|------------|
| ◧ Kiri | `left` | `float: left; margin-right: 1.5rem` |
| ◈ Tengah | `center` | `display: block; margin: 0 auto` |
| ◨ Kanan | `right` | `float: right; margin-left: 1.5rem` |
| ▬ Full | `full` | `width: 100%; display: block` |

Default alignment when inserted: `center`.

### Changes to `AdminCases.jsx`

- "Edit" button in `AdminTable`: change `onEdit(row)` to `navigate(\`/admin/cases/edit/${row.id}\`)`
- Remove `full_description` textarea from the modal (all other fields stay in the modal for quick edits; full_description editing is only in the dedicated editor page)
- Modal still handles: Add new case (creates row with empty `full_description: null`) → on success, `navigate(\`/admin/cases/edit/${newId}\`)` to open the editor immediately
- "Edit" on existing row: skips modal entirely, navigates straight to editor page

### Changes to `App.jsx`

Add inside `<Route path="/admin" element={<AdminLayout />}>`:
```jsx
<Route path="cases/edit/:id" element={<AdminCaseEditor />} />
```

---

## Public Side

### `CaseDetail.jsx` — New Layout

Replace the current 2-column layout (image left / text right) with a **full-width article layout**:

```
┌─────────────────────────────────────────────────────────────┐
│  HERO: cover image full-width (max-height 480px)            │
│  Dark gradient overlay                                      │
│  Breadcrumb + category badge (top-left)                     │
│  JUDUL (bottom-left, over image)                            │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  ARTICLE BODY (max-width 780px, centered, px-4)             │
│  Tiptap EditorContent read-only                             │
│  Prose styling via CSS class `.case-prose`                  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  CTA STRIP                                                  │
│  "Punya masalah serupa? → Konsultasi Sekarang"              │
└─────────────────────────────────────────────────────────────┘
```

**Read-only Tiptap instance:**
```jsx
const editor = useEditor({
  extensions: [StarterKit, Image, TextAlign],
  content: caseItem.full_description,  // jsonb from Supabase
  editable: false,
});
```

**Backward compatibility:** If `full_description` is a plain string (old data before migration), wrap it: `typeof content === 'string' ? { type:'doc', content:[{ type:'paragraph', content:[{ type:'text', text: content }] }] } : content`

### Prose Styling (`.case-prose`)

Applied to the `EditorContent` wrapper. Styles to define:

```css
.case-prose h1 { font-size: 2rem; font-weight: 800; color: #003D6B; margin: 2rem 0 1rem; }
.case-prose h2 { font-size: 1.5rem; font-weight: 700; color: #003D6B; margin: 1.75rem 0 0.75rem; }
.case-prose h3 { font-size: 1.2rem; font-weight: 600; color: #003D6B; margin: 1.5rem 0 0.5rem; }
.case-prose p  { font-size: 0.95rem; line-height: 1.8; color: rgba(0,61,107,0.6); margin-bottom: 1rem; }
.case-prose ul, .case-prose ol { padding-left: 1.5rem; margin-bottom: 1rem; }
.case-prose li { font-size: 0.95rem; line-height: 1.7; color: rgba(0,61,107,0.6); margin-bottom: 0.4rem; }
.case-prose blockquote { border-left: 3px solid #D97706; padding-left: 1rem; color: rgba(0,61,107,0.5); }
.case-prose hr { border-color: rgba(0,61,107,0.1); margin: 2rem 0; }
/* Image alignment */
.case-prose img[data-align="left"]   { float: left; margin: 0.5rem 1.5rem 1rem 0; max-width: 45%; }
.case-prose img[data-align="right"]  { float: right; margin: 0.5rem 0 1rem 1.5rem; max-width: 45%; }
.case-prose img[data-align="center"] { display: block; margin: 1.5rem auto; max-width: 80%; }
.case-prose img[data-align="full"]   { display: block; width: 100%; margin: 1.5rem 0; }
.case-prose img { border-radius: 4px; }
/* Clearfix for floated images */
.case-prose p:has(+ *) { overflow: hidden; }
```

---

## Files Created / Modified

| File | Action |
|------|--------|
| `frontend/src/pages/admin/AdminCaseEditor.jsx` | **Create** — full-page Tiptap editor |
| `frontend/src/pages/admin/AdminCases.jsx` | **Modify** — Edit button navigates to editor, remove full_description textarea |
| `frontend/src/pages/CaseDetail.jsx` | **Modify** — full-width article layout, Tiptap read-only |
| `frontend/src/App.jsx` | **Modify** — add `/admin/cases/edit/:id` route |
| `frontend/src/index.css` | **Modify** — add `.case-prose` styles |
| Supabase SQL | **Run once** — migrate `full_description` text → jsonb |

## npm Packages to Install

```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-text-align @tiptap/extension-placeholder @tiptap/extension-bubble-menu
```

---

## Out of Scope

- Collaborative editing (multiple admins editing simultaneously)
- Version history / undo across sessions
- Tables in editor (not in reference PDF)
- Video embed (not needed now)
- Custom drag-and-drop block reordering (BlockNote feature, not needed with Tiptap)
