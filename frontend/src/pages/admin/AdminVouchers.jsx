import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import AdminTable from '../../components/admin/AdminTable';
import AdminModal from '../../components/admin/AdminModal';

const blue   = '#003D6B';
const orange = '#E8920A';
const muted  = 'rgba(0,61,107,0.5)';
const border = 'rgba(0,61,107,0.1)';

const EMPTY_FORM = {
  code: '', description: '', discount_percent: '', max_uses: 1,
  expires_at: '', is_active: true,
};

const COLUMNS = [
  {
    key: 'code', label: 'Kode',
    render: (v) => (
      <span className="font-mono font-bold text-sm" style={{ color: blue }}>{v}</span>
    ),
  },
  { key: 'description', label: 'Deskripsi', render: (v) => v || '-' },
  { key: 'discount_percent', label: 'Diskon', render: (v) => `${v}%` },
  {
    key: 'used_count', label: 'Dipakai',
    render: (v, row) => `${v} / ${row.max_uses}`,
  },
  {
    key: 'expires_at', label: 'Kadaluarsa',
    render: (v) => v
      ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Tidak ada',
  },
  {
    key: 'is_active', label: 'Status',
    render: (v) => (
      <span
        className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold"
        style={v
          ? { background: 'rgba(5,150,105,0.1)', color: '#065f46', border: '1px solid rgba(5,150,105,0.25)' }
          : { background: 'rgba(0,61,107,0.06)', color: muted, border: `1px solid ${border}` }}
      >
        {v ? 'Aktif' : 'Nonaktif'}
      </span>
    ),
  },
];

export default function AdminVouchers() {
  const [data,       setData]       = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [toast,      setToast]      = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId,  setEditingId]  = useState(null);
  const [form,       setForm]       = useState(EMPTY_FORM);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from('vouchers').select('*').order('created_at', { ascending: false });
    if (!error) setData(rows || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd  = () => { setEditingId(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      code:             row.code,
      description:      row.description || '',
      discount_percent: row.discount_percent,
      max_uses:         row.max_uses,
      expires_at:       row.expires_at ? row.expires_at.slice(0, 10) : '',
      is_active:        row.is_active,
    });
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditingId(null); setForm(EMPTY_FORM); };

  const fc = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      code:             form.code.toUpperCase().trim(),
      description:      form.description || null,
      discount_percent: Number(form.discount_percent),
      max_uses:         Number(form.max_uses) || 1,
      expires_at:       form.expires_at ? new Date(form.expires_at).toISOString() : null,
      is_active:        form.is_active,
    };
    const { error } = editingId
      ? await supabase.from('vouchers').update(payload).eq('id', editingId)
      : await supabase.from('vouchers').insert([payload]);

    if (error) { showToast(`Gagal: ${error.message}`); }
    else { showToast(editingId ? 'Voucher diperbarui!' : 'Voucher dibuat!'); closeModal(); fetchData(); }
    setSubmitting(false);
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Hapus voucher "${row.code}"?`)) return;
    setDeletingId(row.id);
    const { error } = await supabase.from('vouchers').delete().eq('id', row.id);
    if (error) { showToast('Gagal menghapus.'); }
    else { setData((prev) => prev.filter((v) => v.id !== row.id)); showToast('Voucher dihapus.'); }
    setDeletingId(null);
  };

  const inputCls   = 'w-full h-9 rounded-xl px-3 text-sm focus:outline-none transition-colors';
  const inputStyle = { border: `1px solid ${border}`, color: blue, fontFamily: "'Manrope', sans-serif", background: 'rgba(0,61,107,0.03)' };
  const labelStyle = { color: muted, fontFamily: "'Manrope', sans-serif" };

  return (
    <section className="px-5 py-8 sm:px-8 lg:px-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold"
              style={{ color: blue, fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.02em' }}>
            Voucher
          </h1>
          <p className="text-sm mt-1" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
            Kelola kode voucher dan diskon pembayaran konsultasi.
          </p>
        </div>
        <button
          type="button" onClick={openAdd}
          className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-bold text-white self-start sm:self-auto transition-all duration-150"
          style={{ background: orange, boxShadow: '0 4px 14px rgba(232,146,10,0.3)', fontFamily: "'Manrope', sans-serif" }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 20px rgba(232,146,10,0.42)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(232,146,10,0.3)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Buat Voucher
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-white"
           style={{ border: `1px solid ${border}`, boxShadow: '0 2px 16px rgba(0,61,107,0.06)' }}>
        <AdminTable
          columns={COLUMNS} data={data} onEdit={openEdit} onDelete={handleDelete}
          loading={loading} deletingId={deletingId}
        />
      </div>

      {/* Modal */}
      <AdminModal
        isOpen={modalOpen} onClose={closeModal}
        title={editingId ? 'Edit Voucher' : 'Buat Voucher'}
        onSubmit={handleSubmit} isSubmitting={submitting}
      >
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={labelStyle}>
            Kode Voucher *
          </label>
          <input
            value={form.code} onChange={fc('code')} required
            className={inputCls} style={inputStyle}
            placeholder="PROMO50" disabled={!!editingId}
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={labelStyle}>
            Deskripsi (untuk admin)
          </label>
          <input
            value={form.description} onChange={fc('description')}
            className={inputCls} style={inputStyle}
            placeholder="Voucher untuk klien referral"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={labelStyle}>
              Diskon (%) *
            </label>
            <input
              type="number" value={form.discount_percent} onChange={fc('discount_percent')}
              required min="1" max="100"
              className={inputCls} style={inputStyle} placeholder="50"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={labelStyle}>
              Maks Penggunaan *
            </label>
            <input
              type="number" value={form.max_uses} onChange={fc('max_uses')}
              required min="1"
              className={inputCls} style={inputStyle} placeholder="1"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={labelStyle}>
            Kadaluarsa (opsional)
          </label>
          <input
            type="date" value={form.expires_at} onChange={fc('expires_at')}
            className={inputCls} style={inputStyle}
          />
        </div>
        <div className="flex items-center gap-2.5">
          <input
            type="checkbox" id="voucherActive"
            checked={form.is_active} onChange={fc('is_active')}
            className="w-4 h-4" style={{ accentColor: orange }}
          />
          <label htmlFor="voucherActive" className="text-sm font-semibold cursor-pointer"
                 style={{ color: blue, fontFamily: "'Manrope', sans-serif" }}>
            Voucher aktif
          </label>
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
