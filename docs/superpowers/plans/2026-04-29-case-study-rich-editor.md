# Case Study Rich Text Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the plain textarea for case study `full_description` with a full-featured Tiptap WYSIWYG editor in a dedicated admin page, and render the same content beautifully on the public CaseDetail page.

**Architecture:** Tiptap v2 stores content as JSON (not HTML) in a `jsonb` Supabase column. Admin edits at `/admin/cases/edit/:id` — a split-panel page with editor left, metadata right. The public CaseDetail page renders the same JSON read-only via `useEditor({ editable: false })`, styled with a `.case-prose` CSS class. Images inside the editor upload to the `cases` Supabase bucket and support 4 alignment modes (left/center/right/full) via a bubble menu.

**Tech Stack:** React 18, Tiptap v2 (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-text-align`, `@tiptap/extension-placeholder`, `@tiptap/extension-bubble-menu`), Supabase (postgres jsonb + storage), React Router v6, Tailwind CSS.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `frontend/src/lib/tiptap/CustomImage.js` | **Create** | Tiptap Image extension extended with `align` attribute → `data-align` HTML attribute |
| `frontend/src/pages/admin/AdminCaseEditor.jsx` | **Create** | Full-page editor: sticky top bar, toolbar, Tiptap editor, metadata sidebar |
| `frontend/src/pages/admin/AdminCases.jsx` | **Modify** | Edit row → navigate to editor; Add → create then navigate; remove full_description textarea |
| `frontend/src/App.jsx` | **Modify** | Add lazy import + route for `/admin/cases/edit/:id` |
| `frontend/src/pages/CaseDetail.jsx` | **Modify** | Full-width hero + Tiptap read-only article body + CTA |
| `frontend/src/index.css` | **Modify** | Add `.case-prose` prose styles + `.case-editor` editor styles |

---

## Task 1: Install Tiptap packages + run Supabase migration

**Files:**
- No code files — shell commands + Supabase SQL

- [ ] **Step 1: Install Tiptap packages**

```bash
cd "frontend"
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-text-align @tiptap/extension-placeholder @tiptap/extension-bubble-menu
```

Expected: packages installed, no peer-dep errors. `@tiptap/pm` is ProseMirror — required by all Tiptap extensions.

- [ ] **Step 2: Run Supabase migration**

Open **Supabase Dashboard → SQL Editor → New query**, paste and run:

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

Expected: "Success. No rows returned." — existing text values wrapped in Tiptap paragraph node, no data loss.

- [ ] **Step 3: Verify package.json has Tiptap entries**

```bash
cd "frontend"
node -e "const p=require('./package.json'); ['@tiptap/react','@tiptap/starter-kit','@tiptap/extension-image'].forEach(k => console.log(k, p.dependencies[k]))"
```

Expected: each package prints a version string (e.g. `^2.x.x`).

- [ ] **Step 4: Commit**

```bash
cd "frontend" && git add package.json package-lock.json
git commit -m "feat: install tiptap v2 packages for case editor"
```

---

## Task 2: CustomImage extension with alignment support

**Files:**
- Create: `frontend/src/lib/tiptap/CustomImage.js`

Tiptap's built-in `Image` extension has no `align` attribute. We extend it to store `align` and render it as `data-align` on the `<img>` tag — which the `.case-prose` CSS then styles.

- [ ] **Step 1: Create directory**

```bash
mkdir -p "frontend/src/lib/tiptap"
```

- [ ] **Step 2: Create `CustomImage.js`**

Create `frontend/src/lib/tiptap/CustomImage.js`:

```js
import Image from '@tiptap/extension-image'

/**
 * Extends the default Tiptap Image extension with an `align` attribute.
 * - Stored in the JSON document as `{ align: 'left' | 'center' | 'right' | 'full' }`
 * - Rendered to HTML as `<img data-align="center" ... />`
 * - Parsed back from HTML via the `data-align` attribute
 */
export const CustomImage = Image.extend({
  addAttributes() {
    return {
      // Keep all default Image attributes (src, alt, title)
      ...this.parent?.(),
      // Add our custom align attribute
      align: {
        default: 'center',
        parseHTML: (element) => element.getAttribute('data-align') || 'center',
        renderHTML: (attributes) => ({ 'data-align': attributes.align }),
      },
    }
  },
})
```

- [ ] **Step 3: Verify the file exists**

```bash
cat "frontend/src/lib/tiptap/CustomImage.js"
```

Expected: prints the file contents above.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/tiptap/CustomImage.js
git commit -m "feat: add CustomImage tiptap extension with data-align support"
```

---

## Task 3: Add prose + editor CSS styles

**Files:**
- Modify: `frontend/src/index.css` (append to end of file)

- [ ] **Step 1: Append `.case-prose` and `.case-editor` styles to `frontend/src/index.css`**

Open `frontend/src/index.css` and add at the very end (after the closing `}` of `@layer utilities`):

```css
/* ── Case Study Prose (public CaseDetail read-only renderer) ── */
.case-prose h1 {
  font-family: 'Poppins', sans-serif;
  font-weight: 900;
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  color: #003D6B;
  margin: 2rem 0 1rem;
  line-height: 1.15;
  letter-spacing: -0.02em;
}
.case-prose h2 {
  font-family: 'Poppins', sans-serif;
  font-weight: 800;
  font-size: clamp(1.2rem, 2vw, 1.6rem);
  color: #003D6B;
  margin: 1.75rem 0 0.75rem;
  line-height: 1.2;
}
.case-prose h3 {
  font-family: 'Manrope', sans-serif;
  font-weight: 700;
  font-size: 1.1rem;
  color: #003D6B;
  margin: 1.5rem 0 0.5rem;
}
.case-prose p {
  font-family: 'Manrope', sans-serif;
  font-size: 0.95rem;
  line-height: 1.85;
  color: rgba(0, 61, 107, 0.65);
  margin-bottom: 1rem;
}
.case-prose ul,
.case-prose ol {
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}
.case-prose li {
  font-family: 'Manrope', sans-serif;
  font-size: 0.95rem;
  line-height: 1.75;
  color: rgba(0, 61, 107, 0.65);
  margin-bottom: 0.4rem;
}
.case-prose blockquote {
  border-left: 3px solid #D97706;
  padding-left: 1rem;
  color: rgba(0, 61, 107, 0.5);
  font-style: italic;
  margin: 1.5rem 0;
}
.case-prose hr {
  border: none;
  border-top: 1px solid rgba(0, 61, 107, 0.1);
  margin: 2rem 0;
}
.case-prose strong { color: #003D6B; font-weight: 700; }
.case-prose em     { color: rgba(0, 61, 107, 0.8); }

/* Image alignment */
.case-prose img {
  border-radius: 4px;
  max-width: 100%;
}
.case-prose img[data-align="left"] {
  float: left;
  margin: 0.25rem 1.5rem 1rem 0;
  max-width: 45%;
}
.case-prose img[data-align="right"] {
  float: right;
  margin: 0.25rem 0 1rem 1.5rem;
  max-width: 45%;
}
.case-prose img[data-align="center"] {
  display: block;
  margin: 1.5rem auto;
  max-width: 85%;
}
.case-prose img[data-align="full"] {
  display: block;
  width: 100%;
  margin: 1.5rem 0;
  max-width: 100%;
}
/* Clearfix: paragraph after a floated image should clear it */
.case-prose p { overflow: hidden; }

/* ── Case Editor (admin Tiptap editable area) ── */
.case-editor .ProseMirror {
  outline: none;
  min-height: 420px;
  font-family: 'Manrope', sans-serif;
  font-size: 0.95rem;
  line-height: 1.8;
  color: #1e293b;
}
.case-editor .ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #94a3b8;
  pointer-events: none;
  height: 0;
}
.case-editor .ProseMirror h1 { font-family: 'Poppins', sans-serif; font-weight: 900; font-size: 1.8rem; color: #003D6B; margin: 1.5rem 0 0.75rem; }
.case-editor .ProseMirror h2 { font-family: 'Poppins', sans-serif; font-weight: 800; font-size: 1.4rem; color: #003D6B; margin: 1.25rem 0 0.6rem; }
.case-editor .ProseMirror h3 { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 1.1rem; color: #003D6B; margin: 1rem 0 0.5rem; }
.case-editor .ProseMirror p  { margin-bottom: 0.9rem; }
.case-editor .ProseMirror ul,
.case-editor .ProseMirror ol { padding-left: 1.5rem; margin-bottom: 0.9rem; }
.case-editor .ProseMirror li { margin-bottom: 0.3rem; }
.case-editor .ProseMirror blockquote { border-left: 3px solid #D97706; padding-left: 1rem; color: #64748b; font-style: italic; margin: 1rem 0; }
.case-editor .ProseMirror hr { border: none; border-top: 1px solid #e2e8f0; margin: 1.5rem 0; }
.case-editor .ProseMirror img { border-radius: 4px; max-width: 100%; cursor: pointer; }
.case-editor .ProseMirror img.ProseMirror-selectednode { outline: 2px solid #D97706; outline-offset: 2px; }
.case-editor .ProseMirror img[data-align="left"]   { float: left;  margin: 0.25rem 1.5rem 1rem 0; max-width: 45%; }
.case-editor .ProseMirror img[data-align="right"]  { float: right; margin: 0.25rem 0 1rem 1.5rem; max-width: 45%; }
.case-editor .ProseMirror img[data-align="center"] { display: block; margin: 1rem auto; max-width: 85%; }
.case-editor .ProseMirror img[data-align="full"]   { display: block; width: 100%; margin: 1rem 0; max-width: 100%; }
```

- [ ] **Step 2: Verify styles don't break build**

```bash
cd "frontend" && npm run build 2>&1 | tail -5
```

Expected: `✓ built in ...s` — no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat: add .case-prose and .case-editor tiptap styles"
```

---

## Task 4: Create `AdminCaseEditor.jsx`

**Files:**
- Create: `frontend/src/pages/admin/AdminCaseEditor.jsx`

This is the full-page editor. It fetches the case on mount, renders a sticky top bar, a Tiptap toolbar, the editor area, an image bubble menu, and a metadata sidebar.

- [ ] **Step 1: Create `frontend/src/pages/admin/AdminCaseEditor.jsx`**

```jsx
// frontend/src/pages/admin/AdminCaseEditor.jsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { supabase } from '../../supabaseClient';
import { CustomImage } from '../../lib/tiptap/CustomImage';
import AdminImageUpload from '../../components/admin/AdminImageUpload';

const EMPTY_FORM = {
  title: '', slug: '', summary: '', cover_image_url: '',
  category: '', tags: '', status: 'draft', sort_order: 0,
};

function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export default function AdminCaseEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const imgInputRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      CustomImage,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Mulai menulis konten kasus...' }),
    ],
    editorProps: {
      attributes: { class: 'outline-none' },
    },
  });

  // Load case by id on mount (wait for editor to be ready)
  useEffect(() => {
    if (!id || !editor) return;
    supabase
      .from('cases')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { navigate('/admin/cases'); return; }
        setForm({
          title:           data.title           || '',
          slug:            data.slug            || '',
          summary:         data.summary         || '',
          cover_image_url: data.cover_image_url || '',
          category:        data.category        || '',
          tags:            (data.tags || []).join(', '),
          status:          data.status          || 'draft',
          sort_order:      data.sort_order      || 0,
        });
        if (data.full_description) {
          // Backward-compat: if old plain-text string, wrap in Tiptap doc
          const content =
            typeof data.full_description === 'string'
              ? { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: data.full_description }] }] }
              : data.full_description;
          editor.commands.setContent(content);
        }
        setLoading(false);
      });
  }, [id, editor, navigate]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }, []);

  const fc = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    if (!editor) return;
    setSaving(true);
    const payload = {
      ...form,
      tags:             form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      sort_order:       Number(form.sort_order) || 0,
      full_description: editor.getJSON(),
    };
    delete payload.id;
    delete payload.created_at;

    const { error } = await supabase.from('cases').update(payload).eq('id', id);
    if (error) showToast(`Gagal: ${error.message}`);
    else       showToast('Case berhasil disimpan!');
    setSaving(false);
  };

  // Upload image from toolbar → insert into editor
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('File harus berupa gambar.'); return; }
    if (file.size > 5 * 1024 * 1024)    { showToast('Ukuran gambar maksimal 5MB.'); return; }
    const ext      = file.name.split('.').pop();
    const fileName = `editor-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('cases').upload(fileName, file, { upsert: false });
    if (uploadError) { showToast(`Upload gagal: ${uploadError.message}`); return; }
    const { data } = supabase.storage.from('cases').getPublicUrl(fileName);
    editor.chain().focus().setImage({ src: data.publicUrl, align: 'center' }).run();
    e.target.value = '';
  };

  const setImageAlign = (align) => {
    editor.chain().focus().updateAttributes('image', { align }).run();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-slate-700 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">

      {/* ── Sticky top bar ── */}
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <button
          type="button"
          onClick={() => navigate('/admin/cases')}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          ← Kembali
        </button>

        <input
          value={form.title}
          onChange={fc('title')}
          placeholder="Judul case study..."
          className="h-8 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
        />

        <select
          value={form.status}
          onChange={fc('status')}
          className="h-8 shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 focus:outline-none"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex h-8 shrink-0 items-center rounded-lg bg-slate-800 px-4 text-sm font-semibold text-white hover:bg-slate-700 transition-colors disabled:opacity-60"
        >
          {saving ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>

      {/* ── Two-panel body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: editor + toolbar */}
        <div className="flex flex-1 flex-col overflow-auto">

          {/* Toolbar */}
          {editor && (
            <div className="sticky top-[53px] z-20 flex flex-wrap items-center gap-1 border-b border-slate-200 bg-white px-4 py-2">
              {/* Format buttons */}
              {[
                { label: 'B',   fn: () => editor.chain().focus().toggleBold().run(),                    active: editor.isActive('bold') },
                { label: 'I',   fn: () => editor.chain().focus().toggleItalic().run(),                  active: editor.isActive('italic') },
                { label: 'H1',  fn: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),     active: editor.isActive('heading', { level: 1 }) },
                { label: 'H2',  fn: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),     active: editor.isActive('heading', { level: 2 }) },
                { label: 'H3',  fn: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),     active: editor.isActive('heading', { level: 3 }) },
              ].map(({ label, fn, active }) => (
                <button key={label} type="button" onClick={fn}
                  className={`h-7 min-w-[28px] rounded px-2 text-xs font-bold transition-colors ${active ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  {label}
                </button>
              ))}

              <div className="mx-1 h-5 w-px bg-slate-200" />

              {/* List / block buttons */}
              {[
                { label: '≡',  fn: () => editor.chain().focus().toggleBulletList().run(),   active: editor.isActive('bulletList') },
                { label: '1.', fn: () => editor.chain().focus().toggleOrderedList().run(),  active: editor.isActive('orderedList') },
                { label: '❝',  fn: () => editor.chain().focus().toggleBlockquote().run(),   active: editor.isActive('blockquote') },
                { label: '—',  fn: () => editor.chain().focus().setHorizontalRule().run(),  active: false },
              ].map(({ label, fn, active }) => (
                <button key={label} type="button" onClick={fn}
                  className={`h-7 min-w-[28px] rounded px-2 text-xs font-bold transition-colors ${active ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  {label}
                </button>
              ))}

              <div className="mx-1 h-5 w-px bg-slate-200" />

              {/* Image insert */}
              <button
                type="button"
                onClick={() => imgInputRef.current?.click()}
                className="h-7 rounded px-2 text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                🖼 Gambar
              </button>
              <input
                ref={imgInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageFileChange}
              />
            </div>
          )}

          {/* Image alignment bubble menu */}
          {editor && (
            <BubbleMenu
              editor={editor}
              shouldShow={({ editor: ed }) => ed.isActive('image')}
              tippyOptions={{ duration: 150 }}
            >
              <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                {[
                  { label: '◧', value: 'left',   title: 'Rata Kiri' },
                  { label: '◈', value: 'center', title: 'Tengah' },
                  { label: '◨', value: 'right',  title: 'Rata Kanan' },
                  { label: '▬', value: 'full',   title: 'Full Width' },
                ].map(({ label, value, title }) => (
                  <button
                    key={value}
                    type="button"
                    title={title}
                    onClick={() => setImageAlign(value)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </BubbleMenu>
          )}

          {/* Tiptap editor */}
          <div className="flex-1 p-6 lg:p-10">
            <div className="mx-auto max-w-[780px]">
              <EditorContent editor={editor} className="case-editor" />
            </div>
          </div>
        </div>

        {/* Right: metadata panel */}
        <div className="w-80 shrink-0 space-y-5 overflow-auto border-l border-slate-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Metadata</p>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Cover Image</label>
            <AdminImageUpload
              bucket="cases"
              currentUrl={form.cover_image_url}
              onUpload={(url) => setForm((prev) => ({ ...prev, cover_image_url: url }))}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Slug *</label>
            <input
              value={form.slug}
              onChange={fc('slug')}
              className="h-9 w-full rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Kategori</label>
            <input
              value={form.category}
              onChange={fc('category')}
              className="h-9 w-full rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Tags (pisahkan koma)</label>
            <input
              value={form.tags}
              onChange={fc('tags')}
              className="h-9 w-full rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Summary (ditampilkan di card list)</label>
            <textarea
              value={form.summary}
              onChange={fc('summary')}
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Urutan</label>
            <input
              type="number"
              value={form.sort_order}
              onChange={fc('sort_order')}
              min="0"
              className="h-9 w-full rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify file was created**

```bash
ls "frontend/src/pages/admin/AdminCaseEditor.jsx"
```

Expected: file path printed.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/admin/AdminCaseEditor.jsx
git commit -m "feat: create AdminCaseEditor full-page Tiptap editor"
```

---

## Task 5: Update `AdminCases.jsx` — Edit navigates to editor, Add creates then navigates

**Files:**
- Modify: `frontend/src/pages/admin/AdminCases.jsx`

Three changes:
1. Import `useNavigate`
2. "Edit" row button → `navigate(/admin/cases/edit/:id)` instead of opening modal
3. `handleSubmit` for new cases → insert returns new id → navigate to editor
4. Remove `full_description` textarea from modal

- [ ] **Step 1: Add `useNavigate` import and hook**

In `frontend/src/pages/admin/AdminCases.jsx`, change line 1:

```js
// Before:
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

// After:
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
```

And inside `export default function AdminCases()`, add after the existing `useState` lines:

```js
const navigate = useNavigate();
```

- [ ] **Step 2: Change `onEdit` prop to navigate instead of opening modal**

Find this line:
```jsx
<AdminTable columns={COLUMNS} data={data} onEdit={openEdit} onDelete={handleDelete} loading={loading} deletingId={deletingId} />
```

Replace with:
```jsx
<AdminTable
  columns={COLUMNS}
  data={data}
  onEdit={(row) => navigate(`/admin/cases/edit/${row.id}`)}
  onDelete={handleDelete}
  loading={loading}
  deletingId={deletingId}
/>
```

- [ ] **Step 3: Update `handleSubmit` to navigate to editor after adding new case**

Find:
```js
const { error } = editingId
  ? await supabase.from('cases').update(payload).eq('id', editingId)
  : await supabase.from('cases').insert([payload]);

if (error) { showToast(`Gagal: ${error.message}`); }
else { showToast(editingId ? 'Case berhasil diperbarui!' : 'Case berhasil ditambahkan!'); closeModal(); fetchData(); }
```

Replace with:
```js
if (editingId) {
  const { error } = await supabase.from('cases').update(payload).eq('id', editingId);
  if (error) { showToast(`Gagal: ${error.message}`); }
  else { showToast('Case berhasil diperbarui!'); closeModal(); fetchData(); }
} else {
  const { data: inserted, error } = await supabase
    .from('cases').insert([payload]).select('id').single();
  if (error) { showToast(`Gagal: ${error.message}`); }
  else { closeModal(); navigate(`/admin/cases/edit/${inserted.id}`); }
}
```

- [ ] **Step 4: Remove `full_description` textarea from modal**

Find and delete this block inside `<AdminModal>`:
```jsx
<div>
  <label className="block text-xs font-semibold text-slate-600 mb-1">Deskripsi Lengkap (halaman detail)</label>
  <textarea value={form.full_description} onChange={fc('full_description')} rows={5} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none" />
</div>
```

Also remove `full_description: ''` from `EMPTY_FORM` since it's no longer in the modal:
```js
// Before:
const EMPTY_FORM = {
  title: '', slug: '', summary: '', full_description: '',
  cover_image_url: '', category: '', tags: '',
  status: 'draft', sort_order: 0,
};

// After:
const EMPTY_FORM = {
  title: '', slug: '', summary: '',
  cover_image_url: '', category: '', tags: '',
  status: 'draft', sort_order: 0,
};
```

- [ ] **Step 5: Verify build still passes**

```bash
cd "frontend" && npm run build 2>&1 | tail -5
```

Expected: `✓ built in ...s`

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/admin/AdminCases.jsx
git commit -m "feat: AdminCases edit navigates to editor, add creates then navigates"
```

---

## Task 6: Add `/admin/cases/edit/:id` route to `App.jsx`

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Add lazy import for `AdminCaseEditor`**

In `frontend/src/App.jsx`, find the admin lazy imports block:

```js
// Admin pages
const AdminConsultations = lazy(() => import('./pages/admin/AdminConsultations'));
const AdminTools         = lazy(() => import('./pages/admin/AdminTools'));
const AdminCases         = lazy(() => import('./pages/admin/AdminCases'));
const AdminConsultants   = lazy(() => import('./pages/admin/AdminConsultants'));
```

Add one line after `AdminCases`:

```js
const AdminCaseEditor    = lazy(() => import('./pages/admin/AdminCaseEditor'));
```

- [ ] **Step 2: Add route inside the admin `<Route>` block**

Find:
```jsx
<Route path="cases"         element={<AdminCases />} />
```

Add directly after it:
```jsx
<Route path="cases/edit/:id" element={<AdminCaseEditor />} />
```

- [ ] **Step 3: Verify build passes**

```bash
cd "frontend" && npm run build 2>&1 | tail -5
```

Expected: `✓ built in ...s`

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: add /admin/cases/edit/:id route for AdminCaseEditor"
```

---

## Task 7: Update `CaseDetail.jsx` — full-width article layout with read-only Tiptap

**Files:**
- Modify: `frontend/src/pages/CaseDetail.jsx`

Replace the existing 2-column layout with: full-width hero image + article body (Tiptap read-only) + CTA strip.

- [ ] **Step 1: Replace the entire contents of `frontend/src/pages/CaseDetail.jsx`**

```jsx
import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { supabase } from "../supabaseClient";
import { CustomImage } from "../lib/tiptap/CustomImage";
import OptimizedImage from "../components/OptimizedImage";
import OrangeButtonArrow from "../components/Button/OrangeButtonArrow";
import { useState } from "react";

const blue   = "#003D6B";
const orange = "#D97706";
const muted  = "rgba(0,61,107,0.5)";
const rule   = "rgba(0,61,107,0.1)";
const EASE   = [0.22, 1, 0.36, 1];

/**
 * Normalize full_description — handles:
 *   - null / undefined → empty doc
 *   - plain string (data before migration) → wrapped in paragraph
 *   - Tiptap JSON object → returned as-is
 */
function normalizeContent(raw) {
  if (!raw) return { type: 'doc', content: [] };
  if (typeof raw === 'string') {
    return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: raw }] }] };
  }
  return raw;
}

function CaseDetail() {
  const { slug } = useParams();
  const prefersReduced = useReducedMotion();
  const [caseItem, setCaseItem] = useState(null);
  const [loading, setLoading]   = useState(true);

  const editor = useEditor({
    extensions: [
      StarterKit,
      CustomImage,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: { type: 'doc', content: [] },
    editable: false,
  });

  // Fetch data once when slug changes
  useEffect(() => {
    supabase
      .from('cases')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()
      .then(({ data }) => {
        setCaseItem(data);
        setLoading(false);
      });
  }, [slug]);

  // Set editor content when BOTH editor and data are ready (avoids double-fetch)
  useEffect(() => {
    if (!editor || !caseItem?.full_description) return;
    editor.commands.setContent(normalizeContent(caseItem.full_description));
  }, [editor, caseItem]);

  if (loading) {
    return (
      <section className="bg-white pt-32 pb-24 px-4 flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#F58220] rounded-full animate-spin" />
      </section>
    );
  }

  if (!caseItem) {
    return (
      <section className="bg-white min-h-[60vh] flex items-center justify-center px-4 sm:px-6 md:px-8 py-32">
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

  return (
    <div className="bg-white">

      {/* ── Hero: full-width cover image with title overlay ── */}
      <div className="relative w-full overflow-hidden" style={{ height: "clamp(300px, 45vw, 500px)" }}>
        <OptimizedImage
          src={caseItem.cover_image_url}
          alt={caseItem.title}
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
          sizes="100vw"
        />
        {/* Dark gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(0,8,22,0.88) 0%, rgba(0,8,22,0.4) 50%, rgba(0,8,22,0.1) 100%)" }}
        />

        {/* Content over image */}
        <div className="absolute inset-x-0 bottom-0 px-4 sm:px-6 md:px-8 pb-10">
          <div style={{ maxWidth: 1120, margin: "0 auto" }}>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-4">
              <Link
                to="/case"
                className="text-xs font-semibold tracking-[0.12em] uppercase transition-colors"
                style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Manrope', sans-serif" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = orange)}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
              >
                Catatan Kasus
              </Link>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>›</span>
              <span className="text-xs font-semibold tracking-[0.12em] uppercase line-clamp-1" style={{ color: "rgba(255,255,255,0.75)", fontFamily: "'Manrope', sans-serif" }}>
                {caseItem.title}
              </span>
            </div>

            {/* Category badge */}
            {caseItem.category && (
              <span
                className="mb-3 inline-block px-3 py-1 text-[10px] font-bold tracking-[0.18em] uppercase rounded-full"
                style={{ background: "rgba(217,119,6,0.25)", border: "1px solid rgba(217,119,6,0.4)", color: orange, fontFamily: "'Manrope', sans-serif" }}
              >
                {caseItem.category}
              </span>
            )}

            {/* Title */}
            <motion.h1
              className="font-bold-hero leading-[1.06] tracking-[-0.03em] text-white"
              style={{ fontSize: "clamp(1.6rem, 3.5vw, 3rem)" }}
              {...(prefersReduced ? {} : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, ease: EASE } })}
            >
              {caseItem.title}
            </motion.h1>
          </div>
        </div>
      </div>

      {/* ── Article body ── */}
      <section className="px-4 sm:px-6 md:px-8 py-16">
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <EditorContent editor={editor} className="case-prose" />
        </div>
      </section>

      {/* ── CTA strip ── */}
      <section className="px-4 sm:px-6 md:px-8 pb-24">
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <div className="h-px mb-10" style={{ background: rule }} />
          <motion.div
            className="flex flex-col gap-3"
            {...(prefersReduced ? {} : { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6, ease: EASE } })}
          >
            <p className="text-xs font-semibold tracking-[0.14em] uppercase" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
              Punya masalah serupa?
            </p>
            <OrangeButtonArrow buttonText="Konsultasi Sekarang" to="/preassessment" large />
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

- [ ] **Step 2: Verify build passes**

```bash
cd "frontend" && npm run build 2>&1 | tail -5
```

Expected: `✓ built in ...s` — no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/CaseDetail.jsx
git commit -m "feat: CaseDetail full-width article layout with Tiptap read-only renderer"
```

---

## Task 8: Final verification

- [ ] **Step 1: Clean build**

```bash
cd "frontend" && npm run build 2>&1 | tail -8
```

Expected: `✓ built in ...s`, zero errors, zero warnings about missing modules.

- [ ] **Step 2: Manual smoke test checklist**

Start dev server:
```bash
cd "frontend" && npm run dev
```

Run through each check:

| Check | URL | Expected |
|-------|-----|----------|
| Admin cases list | `/admin/cases` | Table loads, "Edit" button navigates to `/admin/cases/edit/:id` |
| Add new case | `/admin/cases` → "+ Tambah Case" | Modal opens, no `full_description` textarea, saving redirects to editor |
| Editor loads | `/admin/cases/edit/:id` | Two-panel layout, title/status bar at top, toolbar visible, metadata in right panel |
| Typing in editor | Editor area | Text appears, Bold/Italic/H1 toolbar buttons work |
| Image insert | Toolbar "🖼 Gambar" | File picker opens, image uploads and appears in editor |
| Image alignment | Click inserted image | Bubble menu shows ◧◈◨▬, clicking each changes image position |
| Save | "Simpan" button | Toast "Case berhasil disimpan!" appears |
| Public page | `/case/:slug` (published case) | Full-width hero image, article body renders formatted content |
| Image alignment on public | `/case/:slug` with floated images | Images respect data-align CSS (float left/right, centered, full-width) |

- [ ] **Step 3: Commit final state**

```bash
git add -A
git commit -m "feat: case study rich text editor complete"
```

---

## Supabase SQL (run before testing)

If not already done in Task 1 Step 2, run this in Supabase SQL Editor:

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
