// frontend/src/pages/admin/AdminCaseEditor.jsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEditor, EditorContent, useEditorState } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { supabase } from '../../supabaseClient';
import { CustomImage } from '../../lib/tiptap/CustomImage';
import AdminImageUpload from '../../components/admin/AdminImageUpload';
import { PageBreak } from '../../lib/tiptap/PageBreak';
import { ToolLink } from '../../lib/tiptap/ToolLink';
import ToolLinkBubbleMenu from '../../components/admin/ToolLinkBubbleMenu';

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
  const [slugAutoMode, setSlugAutoMode] = useState(false);
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
      PageBreak,
      ToolLink,
    ],
    editorProps: {
      attributes: { class: 'outline-none' },
    },
  });

  // Track active formatting states for toolbar — useEditorState is the correct
  // Tiptap v3 API (shouldRerenderOnTransaction causes infinite loops in v3)
  const activeStates = useEditorState({
    editor,
    selector: (ctx) => ({
      bold:        ctx.editor?.isActive('bold')                   ?? false,
      italic:      ctx.editor?.isActive('italic')                 ?? false,
      h1:          ctx.editor?.isActive('heading', { level: 1 }) ?? false,
      h2:          ctx.editor?.isActive('heading', { level: 2 }) ?? false,
      h3:          ctx.editor?.isActive('heading', { level: 3 }) ?? false,
      bulletList:  ctx.editor?.isActive('bulletList')             ?? false,
      orderedList: ctx.editor?.isActive('orderedList')            ?? false,
      blockquote:  ctx.editor?.isActive('blockquote')             ?? false,
    }),
  });

  // Load case by id on mount (wait for editor to be ready)
  useEffect(() => {
    if (!id || !editor) return;
    let cancelled = false;
    supabase
      .from('cases')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) { navigate('/admin/cases'); return; }
        const title = data.title || '';
        const slug  = data.slug  || '';
        setForm({
          title,
          slug,
          summary:         data.summary         || '',
          cover_image_url: data.cover_image_url || '',
          category:        data.category        || '',
          tags:            (data.tags || []).join(', '),
          status:          data.status          || 'draft',
          sort_order:      data.sort_order      || 0,
        });
        setSlugAutoMode(!slug || slug === slugify(title));
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
    return () => { cancelled = true; };
  }, [id, editor, navigate]);

  const toastTimerRef = useRef(null);
  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(''), 2500);
  }, []);

  useEffect(() => () => clearTimeout(toastTimerRef.current), []);

  const fc = (field) => (e) => {
    const val = e.target.value;
    setForm((prev) => ({
      ...prev,
      [field]: val,
      ...(field === 'title' && slugAutoMode ? { slug: slugify(val) } : {}),
    }));
  };

  const handleSlugChange = (e) => {
    setSlugAutoMode(false);
    setForm((prev) => ({ ...prev, slug: e.target.value }));
  };

  const resetSlugFromTitle = () => {
    setSlugAutoMode(true);
    setForm((prev) => ({ ...prev, slug: slugify(prev.title) }));
  };

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
    delete payload.updated_at;

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
    <div className="bg-slate-50">

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
      {/*
        Layout strategy: no nested overflow containers.
        The page scrolls via AdminLayout's <main overflow-auto>.
        Sticky elements use top-[53px] (height of top bar) to stay below it.
        Right panel is sticky + fixed height so metadata stays visible while content scrolls.
      */}
      <div className="flex items-start">

        {/* Left: toolbar (sticky) + editor content (natural height) */}
        <div className="flex-1 min-w-0">

          {/* Sticky toolbar — sticks just below the top bar */}
          {editor && (
            <div className="sticky top-[53px] z-20 flex flex-wrap items-center gap-1 border-b border-slate-200 bg-white px-4 py-2">
              {[
                { label: 'B',   fn: () => editor.chain().focus().toggleBold().run(),                active: activeStates?.bold },
                { label: 'I',   fn: () => editor.chain().focus().toggleItalic().run(),              active: activeStates?.italic },
                { label: 'H1',  fn: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: activeStates?.h1 },
                { label: 'H2',  fn: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: activeStates?.h2 },
                { label: 'H3',  fn: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: activeStates?.h3 },
              ].map(({ label, fn, active }) => (
                <button key={label} type="button" onClick={fn}
                  className={`h-7 min-w-[28px] rounded px-2 text-xs font-bold transition-colors ${active ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  {label}
                </button>
              ))}

              <div className="mx-1 h-5 w-px bg-slate-200" />

              {[
                { label: '≡',  fn: () => editor.chain().focus().toggleBulletList().run(),  active: activeStates?.bulletList },
                { label: '1.', fn: () => editor.chain().focus().toggleOrderedList().run(), active: activeStates?.orderedList },
                { label: '❝',  fn: () => editor.chain().focus().toggleBlockquote().run(),  active: activeStates?.blockquote },
                { label: '—',  fn: () => editor.chain().focus().setHorizontalRule().run(), active: false },
              ].map(({ label, fn, active }) => (
                <button key={label} type="button" onClick={fn}
                  className={`h-7 min-w-[28px] rounded px-2 text-xs font-bold transition-colors ${active ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  {label}
                </button>
              ))}

              <div className="mx-1 h-5 w-px bg-slate-200" />

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
          )}

          {/* Image alignment bubble menu */}
          {editor && (
            <BubbleMenu
              editor={editor}
              shouldShow={({ editor: ed }) => ed.isActive('image')}
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

          {/* Tool link bubble menu */}
          {editor && <ToolLinkBubbleMenu editor={editor} />}

          {/* Editor content — natural height, no overflow clipping */}
          <div className="p-6 lg:p-10">
            <div className="mx-auto max-w-[780px]">
              <EditorContent editor={editor} className="case-editor" />
            </div>
          </div>
        </div>

        {/* Right: metadata panel — sticky, scrolls independently */}
        <div className="sticky top-[53px] w-80 shrink-0 h-[calc(100vh-53px)] overflow-y-auto border-l border-slate-200 bg-white p-5 space-y-5">
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
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-600">
                Slug *{' '}
                {slugAutoMode && (
                  <span className="ml-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">auto</span>
                )}
              </label>
              {!slugAutoMode && (
                <button
                  type="button"
                  onClick={resetSlugFromTitle}
                  className="text-[10px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
                  title="Generate ulang dari judul"
                >
                  ↻ Reset dari judul
                </button>
              )}
            </div>
            <input
              value={form.slug}
              onChange={handleSlugChange}
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
            <label className="mb-1 block text-xs font-semibold text-slate-600">Summary</label>
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
