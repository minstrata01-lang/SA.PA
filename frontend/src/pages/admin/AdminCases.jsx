// frontend/src/pages/admin/AdminCases.jsx
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import AdminTable from '../../components/admin/AdminTable';
import AdminModal from '../../components/admin/AdminModal';
import AdminImageUpload from '../../components/admin/AdminImageUpload';

const EMPTY_FORM = {
  title: '', slug: '', summary: '',
  cover_image_url: '', category: '', tags: '',
  status: 'draft', sort_order: 0,
};

function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

const COLUMNS = [
  { key: 'title', label: 'Judul' },
  { key: 'category', label: 'Kategori' },
  {
    key: 'status', label: 'Status',
    render: (v) => (
      <span
        className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold"
        style={v === 'published'
          ? { background: 'rgba(5,150,105,0.1)', color: '#065f46', border: '1px solid rgba(5,150,105,0.25)' }
          : { background: 'rgba(232,146,10,0.1)', color: '#92400e', border: '1px solid rgba(232,146,10,0.3)' }
        }
      >
        {v === 'published' ? 'Published' : 'Draft'}
      </span>
    ),
  },
  { key: 'sort_order', label: 'Urutan' },
];

export default function AdminCases() {
  const navigate = useNavigate();
  const [data, setData]             = useState([]);
  const [loading, setLoading]       = useState(false);
  const [toast, setToast]           = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [modalOpen, setModalOpen]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await supabase.from('cases').select('*').order('sort_order', { ascending: true });
    if (!error) setData(rows || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd  = () => { setForm(EMPTY_FORM); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setForm(EMPTY_FORM); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      ...form,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      slug: form.slug || slugify(form.title),
      sort_order: Number(form.sort_order) || 0,
    };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;

    const { data: inserted, error } = await supabase
      .from('cases').insert([payload]).select('id').single();
    setSubmitting(false);
    if (error) { showToast(`Gagal: ${error.message}`); }
    else { closeModal(); navigate(`/admin/cases/edit/${inserted.id}`); }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Hapus case "${row.title}"?`)) return;
    setDeletingId(row.id);
    const { error } = await supabase.from('cases').delete().eq('id', row.id);
    if (error) { showToast('Gagal menghapus.'); }
    else { setData((prev) => prev.filter((c) => c.id !== row.id)); showToast('Case dihapus.'); }
    setDeletingId(null);
  };

  const fc = (field) => (e) => {
    const val = e.target.value;
    setForm((prev) => ({
      ...prev,
      [field]: val,
      ...(field === 'title' ? { slug: slugify(val) } : {}),
    }));
  };

  const blue   = '#003D6B';
  const orange = '#E8920A';
  const muted  = 'rgba(0,61,107,0.5)';
  const border = 'rgba(0,61,107,0.1)';
  const inputCls = 'w-full h-9 rounded-xl px-3 text-sm focus:outline-none transition-colors';
  const inputStyle = { border: `1px solid ${border}`, color: blue, fontFamily: "'Manrope', sans-serif", background: 'rgba(0,61,107,0.03)' };
  const labelStyle = { color: muted, fontFamily: "'Manrope', sans-serif" };

  return (
    <section className="px-5 py-8 sm:px-8 lg:px-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: blue, fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.02em' }}
          >
            Case Study
          </h1>
          <p className="text-sm mt-1" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
            Kelola portofolio case study. Status &quot;Draft&quot; tidak tampil di halaman client.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-bold text-white self-start sm:self-auto transition-all duration-150"
          style={{ background: orange, boxShadow: '0 4px 14px rgba(232,146,10,0.3)', fontFamily: "'Manrope', sans-serif" }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 20px rgba(232,146,10,0.42)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(232,146,10,0.3)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Tambah Case
        </button>
      </div>

      {/* Table */}
      <div
        className="overflow-hidden rounded-2xl bg-white"
        style={{ border: `1px solid ${border}`, boxShadow: '0 2px 16px rgba(0,61,107,0.06)' }}
      >
        <AdminTable
          columns={COLUMNS}
          data={data}
          onEdit={(row) => navigate(`/admin/cases/edit/${row.id}`)}
          onDelete={handleDelete}
          loading={loading}
          deletingId={deletingId}
        />
      </div>

      {/* Modal */}
      <AdminModal isOpen={modalOpen} onClose={closeModal} title="Tambah Case" onSubmit={handleSubmit} isSubmitting={submitting}>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={labelStyle}>Judul *</label>
          <input value={form.title} onChange={fc('title')} required className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={labelStyle}>Slug *</label>
          <input value={form.slug} onChange={fc('slug')} required className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={labelStyle}>Kategori</label>
          <input value={form.category} onChange={fc('category')} className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={labelStyle}>Tags (pisahkan koma)</label>
          <input value={form.tags} onChange={fc('tags')} className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={labelStyle}>Summary</label>
          <textarea value={form.summary} onChange={fc('summary')} rows={2} className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none resize-none" style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={labelStyle}>Cover Image</label>
          <AdminImageUpload bucket="cases" currentUrl={form.cover_image_url} onUpload={(url) => setForm((prev) => ({ ...prev, cover_image_url: url }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={labelStyle}>Status</label>
            <select value={form.status} onChange={fc('status')} className="w-full h-9 rounded-xl px-3 text-sm focus:outline-none" style={inputStyle}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={labelStyle}>Urutan</label>
            <input type="number" value={form.sort_order} onChange={fc('sort_order')} min="0" className={inputCls} style={inputStyle} />
          </div>
        </div>
      </AdminModal>

      {/* Toast */}
      {toast && (
        <div
          className="fixed right-5 top-5 z-50 rounded-xl px-4 py-3 text-sm font-semibold shadow-xl flex items-center gap-2"
          style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid rgba(21,128,61,0.25)', fontFamily: "'Manrope', sans-serif" }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {toast}
        </div>
      )}
    </section>
  );
}
