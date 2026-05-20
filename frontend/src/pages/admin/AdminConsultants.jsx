// frontend/src/pages/admin/AdminConsultants.jsx
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import AdminTable from '../../components/admin/AdminTable';
import AdminModal from '../../components/admin/AdminModal';
import AdminImageUpload from '../../components/admin/AdminImageUpload';

const EMPTY_FORM = {
  name: '', title: '', description: '', photo_url: '',
  phone_number: '', is_active: true, sort_order: 0,
};

const COLUMNS = [
  { key: 'name',  label: 'Nama' },
  { key: 'title', label: 'Jabatan' },
  { key: 'phone_number', label: 'No. HP' },
  {
    key: 'is_active', label: 'Status',
    render: (v) => (
      <span
        className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold"
        style={v
          ? { background: 'rgba(5,150,105,0.1)', color: '#065f46', border: '1px solid rgba(5,150,105,0.25)' }
          : { background: 'rgba(0,61,107,0.06)', color: 'rgba(0,61,107,0.5)', border: '1px solid rgba(0,61,107,0.15)' }
        }
      >
        {v ? 'Aktif' : 'Nonaktif'}
      </span>
    ),
  },
  { key: 'sort_order', label: 'Urutan' },
];

export default function AdminConsultants() {
  const [data, setData]             = useState([]);
  const [loading, setLoading]       = useState(false);
  const [toast, setToast]           = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [modalOpen, setModalOpen]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await supabase.from('consultants').select('*').order('sort_order', { ascending: true });
    if (!error) setData(rows || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd  = () => { setEditingId(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (row) => { setEditingId(row.id); setForm({ ...EMPTY_FORM, ...row }); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingId(null); setForm(EMPTY_FORM); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = { ...form, sort_order: Number(form.sort_order) || 0 };
    delete payload.id;
    delete payload.created_at;

    const { error } = editingId
      ? await supabase.from('consultants').update(payload).eq('id', editingId)
      : await supabase.from('consultants').insert([payload]);

    if (error) { showToast(`Gagal: ${error.message}`); }
    else { showToast(editingId ? 'Konsultan diperbarui!' : 'Konsultan ditambahkan!'); closeModal(); fetchData(); }
    setSubmitting(false);
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Hapus konsultan "${row.name}"?`)) return;
    setDeletingId(row.id);
    const { error } = await supabase.from('consultants').delete().eq('id', row.id);
    if (error) { showToast('Gagal menghapus.'); }
    else { setData((prev) => prev.filter((c) => c.id !== row.id)); showToast('Konsultan dihapus.'); }
    setDeletingId(null);
  };

  const fc = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));
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
            Konsultan
          </h1>
          <p className="text-sm mt-1" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
            Kelola profil tim konsultan yang tampil di halaman Tim.
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
          Tambah Konsultan
        </button>
      </div>

      {/* Table */}
      <div
        className="overflow-hidden rounded-2xl bg-white"
        style={{ border: `1px solid ${border}`, boxShadow: '0 2px 16px rgba(0,61,107,0.06)' }}
      >
        <AdminTable columns={COLUMNS} data={data} onEdit={openEdit} onDelete={handleDelete} loading={loading} deletingId={deletingId} />
      </div>

      {/* Modal */}
      <AdminModal isOpen={modalOpen} onClose={closeModal} title={editingId ? 'Edit Konsultan' : 'Tambah Konsultan'} onSubmit={handleSubmit} isSubmitting={submitting}>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={labelStyle}>Nama *</label>
          <input value={form.name} onChange={fc('name')} required className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={labelStyle}>Jabatan / Spesialisasi</label>
          <input value={form.title} onChange={fc('title')} className={inputCls} style={inputStyle} placeholder="Senior Structural Engineer" />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={labelStyle}>Bio Singkat</label>
          <textarea value={form.description} onChange={fc('description')} rows={3} className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none resize-none" style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={labelStyle}>No. HP</label>
          <input value={form.phone_number} onChange={fc('phone_number')} className={inputCls} style={inputStyle} placeholder="08xx-xxxx-xxxx" />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={labelStyle}>Foto Profil</label>
          <AdminImageUpload bucket="consultants" currentUrl={form.photo_url} onUpload={(url) => setForm((prev) => ({ ...prev, photo_url: url }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={labelStyle}>Urutan tampil</label>
            <input type="number" value={form.sort_order} onChange={fc('sort_order')} min="0" className={inputCls} style={inputStyle} />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={fc('is_active')} className="w-4 h-4 rounded accent-orange-500" />
              <span className="text-sm font-semibold" style={{ color: blue, fontFamily: "'Manrope', sans-serif" }}>Aktif</span>
            </label>
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
