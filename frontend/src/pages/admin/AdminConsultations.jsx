import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabaseClient';

const blue   = '#003D6B';
const orange = '#E8920A';
const muted  = 'rgba(0,61,107,0.5)';
const border = 'rgba(0,61,107,0.1)';

const FILTER_TABS = [
  { key: 'all',             label: 'Semua' },
  { key: 'pending_payment', label: 'Menunggu Verifikasi' },
  { key: 'unassigned',      label: 'Belum Diassign' },
  { key: 'assigned',        label: 'Sudah Diassign' },
  { key: 'active',          label: 'Sesi Aktif' },
  { key: 'used',            label: 'Selesai' },
];

const SESSION_STATUSES = [
  { value: 'active',   label: 'Aktif' },
  { value: 'inactive', label: 'Inaktif' },
];

const JAKARTA_AREAS = ['Jakarta', 'Jakarta Pusat', 'Jakarta Barat', 'Jakarta Timur', 'Jakarta Utara', 'Jakarta Selatan'];

function getLokasiLabel(location) {
  if (!location) return '-';
  return JAKARTA_AREAS.some(area => location.toLowerCase().includes(area.toLowerCase()))
    ? 'Jakarta'
    : 'Luar Jakarta';
}

function getLokasiStyle(location) {
  const label = getLokasiLabel(location);
  if (label === 'Jakarta') return { background: 'rgba(0,61,107,0.08)', color: '#003D6B', border: '1px solid rgba(0,61,107,0.2)' };
  if (label === 'Luar Jakarta') return { background: 'rgba(232,146,10,0.1)', color: '#92400e', border: '1px solid rgba(232,146,10,0.25)' };
  return { background: 'rgba(0,61,107,0.04)', color: 'rgba(0,61,107,0.5)', border: '1px solid rgba(0,61,107,0.1)' };
}

function getStatusStyle(status) {
  if (status === 'active')  return { background: 'rgba(5,150,105,0.1)',  color: '#065f46', border: '1px solid rgba(5,150,105,0.25)' };
  if (status === 'used')    return { background: 'rgba(2,132,199,0.1)',   color: '#0c4a6e', border: '1px solid rgba(2,132,199,0.25)' };
  if (status === 'expired') return { background: 'rgba(190,18,60,0.08)', color: '#9f1239', border: '1px solid rgba(190,18,60,0.2)' };
  return { background: 'rgba(0,61,107,0.06)', color: muted, border: `1px solid ${border}` };
}

function getPaymentStatusStyle(status) {
  if (status === 'confirmed')            return { background: 'rgba(5,150,105,0.1)',  color: '#065f46', border: '1px solid rgba(5,150,105,0.25)' };
  if (status === 'rejected')             return { background: 'rgba(190,18,60,0.08)', color: '#9f1239', border: '1px solid rgba(190,18,60,0.2)' };
  if (status === 'pending_verification') return { background: 'rgba(232,146,10,0.1)', color: '#92400e', border: '1px solid rgba(232,146,10,0.25)' };
  return { background: 'rgba(0,61,107,0.06)', color: muted, border: `1px solid ${border}` };
}

function getPaymentStatusLabel(status) {
  if (status === 'confirmed')            return 'Dikonfirmasi';
  if (status === 'rejected')             return 'Ditolak';
  if (status === 'pending_verification') return 'Menunggu';
  return status || '-';
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const pageVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const cardVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

function AdminCard({ children, style = {}, className = '' }) {
  return (
    <motion.div
      variants={cardVariants}
      className={`rounded-2xl bg-white ${className}`}
      style={{ border: `1px solid ${border}`, boxShadow: '0 2px 16px rgba(0,61,107,0.06)', ...style }}
    >
      {children}
    </motion.div>
  );
}

function PageHeader({ title, subtitle, action }) {
  return (
    <motion.header variants={cardVariants}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: blue, fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.02em' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm mt-1" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
    </motion.header>
  );
}

export default function AdminConsultations() {
  const [consultations, setConsultations] = useState([]);
  const [consultants, setConsultants]     = useState([]);
  const [activeTab, setActiveTab]         = useState('all');
  const [loading, setLoading]             = useState(false);
  const [toast, setToast]                 = useState({ msg: '', type: 'success' });
  const [deletingId, setDeletingId]       = useState(null);
  const [reportFiles, setReportFiles]     = useState([]);
  const [confirmingIds, setConfirmingIds] = useState(new Set());

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 2500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cResult, consultResult] = await Promise.all([
        supabase
          .from('consultations')
          .select('*, clients(full_name, email, phone_number), consultants(name, phone_number)')
          .order('created_at', { ascending: false }),
        supabase.from('consultants').select('*').eq('is_active', true),
      ]);
      if (!cResult.error) setConsultations(cResult.data || []);
      if (!consultResult.error) setConsultants(consultResult.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    const { data, error } = await supabase.storage.from('reports').list('');
    if (!error) setReportFiles(data || []);
  }, []);

  useEffect(() => { fetchData(); fetchReports(); }, [fetchData, fetchReports]);

  const filteredConsultations = useMemo(() => {
    if (activeTab === 'pending_payment') return consultations.filter((c) => c.payment_status === 'pending_verification');
    if (activeTab === 'unassigned')      return consultations.filter((c) => !c.consultant_id);
    if (activeTab === 'assigned')        return consultations.filter((c) => Boolean(c.consultant_id));
    if (activeTab === 'active')          return consultations.filter((c) => c.session_status === 'active');
    if (activeTab === 'used')            return consultations.filter((c) => c.session_status === 'used');
    return consultations;
  }, [activeTab, consultations]);

  const stats = useMemo(() => ({
    total:         consultations.length,
    active:        consultations.filter((c) => c.session_status === 'active').length,
    used:          consultations.filter((c) => c.session_status === 'used').length,
    pending:       consultations.filter((c) => c.payment_status === 'pending_verification').length,
    voucherCount:  consultations.filter((c) => Boolean(c.voucher_code)).length,
    totalDiscount: consultations.reduce((sum, c) => sum + (Number(c.discount_amount) || 0), 0),
  }), [consultations]);

  const updateSessionStatus = async (id, newStatus) => {
    const { error } = await supabase.from('consultations').update({ session_status: newStatus }).eq('id', id);
    if (!error) {
      showToast('Status sesi berhasil diperbarui!');
      setConsultations((prev) => prev.map((c) => c.id === id ? { ...c, session_status: newStatus } : c));
    } else {
      showToast('Gagal memperbarui status.', 'error');
    }
  };

  const assignConsultant = async (consultationId, consultantId) => {
    if (!consultantId) return;
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assign-consultant`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ consultation_id: consultationId, consultant_id: consultantId }),
      }
    );
    if (res.ok) { showToast('Konsultan berhasil diassign!'); fetchData(); }
  };

  const deleteConsultation = async (consultationId, clientName = 'klien ini') => {
    if (!window.confirm(`Hapus ${clientName} dari daftar konsultasi? Data klien juga akan dihapus.`)) return;
    setDeletingId(consultationId);
    try {
      const target = consultations.find((c) => c.id === consultationId);
      const clientId = target?.client_id;

      const { error } = await supabase.from('consultations').delete().eq('id', consultationId);
      if (error) { showToast('Gagal menghapus data.', 'error'); return; }

      if (clientId) {
        await supabase.from('clients').delete().eq('id', clientId);
      }

      setConsultations((prev) => prev.filter((c) => c.id !== consultationId));
      showToast('Data berhasil dihapus.');
    } finally {
      setDeletingId(null);
    }
  };

  const handlePaymentAction = async (consultationId, action) => {
    const label = action === 'confirm' ? 'konfirmasi' : 'tolak';
    if (!window.confirm(`${label.charAt(0).toUpperCase() + label.slice(1)} pembayaran ini?`)) return;
    setConfirmingIds(prev => new Set(prev).add(consultationId));
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirm-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ consultation_id: consultationId, action }),
        }
      );
      if (res.ok) {
        showToast(action === 'confirm' ? 'Pembayaran dikonfirmasi!' : 'Pembayaran ditolak.');
        fetchData();
      } else {
        showToast('Gagal memproses pembayaran.', 'error');
      }
    } catch {
      showToast('Gagal memproses pembayaran.', 'error');
    } finally {
      setConfirmingIds(prev => { const next = new Set(prev); next.delete(consultationId); return next; });
    }
  };

  const downloadReport = async (fileName) => {
    const { data } = await supabase.storage.from('reports').createSignedUrl(fileName, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  const generateReport = async () => {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-report`, {
      headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
    });
    const data = await res.json();
    if (data.success) { showToast('Laporan berhasil dibuat!'); fetchReports(); }
  };

  const STAT_CARDS = [
    {
      label: 'Total Konsultasi',
      value: stats.total,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      accent: blue,
      bg: 'rgba(0,61,107,0.06)',
    },
    {
      label: 'Sesi Aktif',
      value: stats.active,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
      accent: '#059669',
      bg: 'rgba(5,150,105,0.08)',
    },
    {
      label: 'Selesai',
      value: stats.used,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ),
      accent: '#0284c7',
      bg: 'rgba(2,132,199,0.08)',
    },
    {
      label: 'Menunggu Verifikasi',
      value: stats.pending,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
        </svg>
      ),
      accent: '#E8920A',
      bg: 'rgba(232,146,10,0.08)',
    },
    {
      label: 'Voucher Dipakai',
      value: stats.voucherCount,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/>
          <path d="M13 5v2M13 17v2M13 11v2"/>
        </svg>
      ),
      accent: '#7c3aed',
      bg: 'rgba(124,58,237,0.08)',
    },
    {
      label: 'Total Diskon',
      value: `Rp ${stats.totalDiscount.toLocaleString('id-ID')}`,
      small: true,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
      accent: '#065f46',
      bg: 'rgba(5,150,105,0.08)',
    },
  ];

  return (
    <motion.section
      className="px-5 py-8 sm:px-8 lg:px-10 space-y-6"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <PageHeader
        title="Manajemen Konsultasi"
        subtitle="Kelola sesi konsultasi, assign konsultan, dan monitor status."
        action={
          <motion.button
            type="button"
            onClick={fetchData}
            className="inline-flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-semibold self-start lg:self-auto transition-all duration-150"
            style={{
              color: blue,
              background: 'rgba(0,61,107,0.07)',
              border: `1px solid ${border}`,
              fontFamily: "'Manrope', sans-serif",
            }}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,61,107,0.13)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,61,107,0.07)'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Refresh
          </motion.button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STAT_CARDS.map(({ label, value, icon, accent, bg, small }) => (
          <AdminCard key={label}>
            <div className="p-5 flex items-center gap-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: bg, color: accent }}
              >
                {icon}
              </div>
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}
                >
                  {label}
                </p>
                <p
                  className={`${small ? 'text-xl' : 'text-3xl'} font-bold mt-0.5 leading-none`}
                  style={{ color: accent, fontFamily: "'Poppins', sans-serif" }}
                >
                  {value}
                </p>
              </div>
            </div>
          </AdminCard>
        ))}
      </div>

      {/* Filter tabs */}
      <AdminCard className="p-3">
        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className="rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200"
              style={{
                fontFamily: "'Manrope', sans-serif",
                ...(activeTab === tab.key
                  ? { background: blue, color: 'white', boxShadow: '0 4px 12px rgba(0,61,107,0.25)' }
                  : { background: 'transparent', color: muted, border: `1px solid ${border}` }
                ),
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </AdminCard>

      {/* Table */}
      <AdminCard>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex min-h-64 items-center justify-center gap-3">
              <div
                className="h-7 w-7 rounded-full border-[3px] animate-spin"
                style={{ borderColor: 'rgba(0,61,107,0.15)', borderTopColor: blue }}
              />
              <span className="text-sm font-medium" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
                Memuat data…
              </span>
            </div>
          ) : filteredConsultations.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-1" style={{ background: 'rgba(0,61,107,0.06)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={blue} strokeWidth="1.6" strokeLinecap="round">
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                  <rect x="9" y="3" width="6" height="4" rx="1"/>
                </svg>
              </div>
              <p className="text-sm font-semibold" style={{ color: blue, fontFamily: "'Manrope', sans-serif" }}>Tidak ada data</p>
              <p className="text-xs" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>Data akan muncul setelah ada sesi masuk.</p>
            </div>
          ) : (
            <table className="w-full min-w-[1060px] text-left text-sm">
              <thead>
                <tr style={{ background: 'rgba(0,61,107,0.04)', borderBottom: '1px solid rgba(0,61,107,0.08)' }}>
                  {['No', 'Client', 'No. HP', 'Lokasi', 'Tanggal', 'Status Sesi', 'Konsultan', 'Voucher', 'Status Bayar', 'Bukti', 'Aksi Bayar', 'Aksi'].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3.5 text-xs font-bold uppercase tracking-widest"
                      style={{ color: 'rgba(0,61,107,0.45)', fontFamily: "'Manrope', sans-serif" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredConsultations.map((item, index) => {
                  const client = Array.isArray(item.clients) ? item.clients[0] : item.clients;
                  const statusStyle = getStatusStyle(item.session_status);
                  return (
                    <tr
                      key={item.id}
                      style={{ borderBottom: '1px solid rgba(0,61,107,0.06)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,61,107,0.025)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td
                        className="px-5 py-4 font-semibold text-xs tabular-nums"
                        style={{ color: 'rgba(0,61,107,0.35)', fontFamily: "'Manrope', sans-serif" }}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold" style={{ color: blue, fontFamily: "'Manrope', sans-serif" }}>
                          {client?.full_name || '-'}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
                          {client?.email || '-'}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-sm" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
                        {client?.phone_number || '-'}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                          style={getLokasiStyle(item.location)}
                        >
                          {getLokasiLabel(item.location)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={item.session_status || 'inactive'}
                          onChange={(e) => updateSessionStatus(item.id, e.target.value)}
                          className="h-8 rounded-lg px-2.5 text-xs font-semibold focus:outline-none cursor-pointer"
                          style={{ ...statusStyle, fontFamily: "'Manrope', sans-serif" }}
                        >
                          {SESSION_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={item.consultant_id || ''}
                          onChange={(e) => assignConsultant(item.id, e.target.value)}
                          className="h-8 rounded-lg px-2.5 text-sm focus:outline-none cursor-pointer"
                          style={{
                            color: blue,
                            border: `1px solid ${border}`,
                            background: 'rgba(0,61,107,0.04)',
                            fontFamily: "'Manrope', sans-serif",
                          }}
                        >
                          <option value="">Pilih Konsultan</option>
                          {consultants.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </td>
                      {/* Voucher */}
                      <td className="px-5 py-4">
                        {item.voucher_code ? (
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold"
                            style={{ background: 'rgba(124,58,237,0.1)', color: '#6d28d9', border: '1px solid rgba(124,58,237,0.2)' }}
                          >
                            🎟️ {item.voucher_code}
                            {item.discount_percent ? ` (${item.discount_percent}%)` : ''}
                          </span>
                        ) : (
                          <span className="text-xs" style={{ color: muted }}>-</span>
                        )}
                      </td>

                      {/* Status Bayar */}
                      <td className="px-5 py-4">
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                          style={getPaymentStatusStyle(item.payment_status)}
                        >
                          {getPaymentStatusLabel(item.payment_status)}
                        </span>
                      </td>

                      {/* Bukti Transfer */}
                      <td className="px-5 py-4">
                        {item.proof_url ? (
                          <a
                            href={item.proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold"
                            style={{ color: blue, textDecoration: 'none' }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                            </svg>
                            Lihat
                          </a>
                        ) : (
                          <span className="text-xs" style={{ color: muted }}>-</span>
                        )}
                      </td>

                      {/* Aksi Bayar */}
                      <td className="px-5 py-4">
                        {item.payment_status === 'pending_verification' ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handlePaymentAction(item.id, 'confirm')}
                              disabled={confirmingIds.has(item.id)}
                              className="inline-flex h-8 items-center gap-1 rounded-lg px-3 text-xs font-semibold transition-all duration-150 disabled:opacity-50"
                              style={{
                                color: '#065f46',
                                background: 'rgba(5,150,105,0.1)',
                                border: '1px solid rgba(5,150,105,0.25)',
                                fontFamily: "'Manrope', sans-serif",
                                cursor: confirmingIds.has(item.id) ? 'not-allowed' : 'pointer',
                              }}
                              onMouseEnter={e => { if (!confirmingIds.has(item.id)) e.currentTarget.style.background = 'rgba(5,150,105,0.2)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(5,150,105,0.1)'; }}
                            >
                              {confirmingIds.has(item.id) ? 'Memproses…' : '✓ Konfirmasi'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePaymentAction(item.id, 'reject')}
                              disabled={confirmingIds.has(item.id)}
                              className="inline-flex h-8 items-center gap-1 rounded-lg px-3 text-xs font-semibold transition-all duration-150 disabled:opacity-50"
                              style={{
                                color: '#9f1239',
                                background: 'rgba(190,18,60,0.08)',
                                border: '1px solid rgba(190,18,60,0.2)',
                                fontFamily: "'Manrope', sans-serif",
                                cursor: confirmingIds.has(item.id) ? 'not-allowed' : 'pointer',
                              }}
                              onMouseEnter={e => { if (!confirmingIds.has(item.id)) e.currentTarget.style.background = 'rgba(190,18,60,0.15)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(190,18,60,0.08)'; }}
                            >
                              {confirmingIds.has(item.id) ? 'Memproses…' : '✕ Tolak'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>-</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => deleteConsultation(item.id, client?.full_name)}
                          disabled={deletingId === item.id}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-all duration-150 disabled:opacity-50"
                          style={{
                            color: '#be123c',
                            background: 'rgba(190,18,60,0.06)',
                            border: '1px solid rgba(190,18,60,0.2)',
                            fontFamily: "'Manrope', sans-serif",
                          }}
                          onMouseEnter={e => { if (deletingId !== item.id) e.currentTarget.style.background = 'rgba(190,18,60,0.12)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(190,18,60,0.06)'; }}
                        >
                          {deletingId === item.id ? 'Menghapus…' : 'Hapus'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </AdminCard>

      {/* Laporan */}
      <AdminCard>
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(0,61,107,0.08)' }}
        >
          <h3
            className="text-base font-bold"
            style={{ color: blue, fontFamily: "'Poppins', sans-serif" }}
          >
            Laporan Harian
          </h3>
          <motion.button
            type="button"
            onClick={generateReport}
            className="inline-flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-bold text-white"
            style={{
              background: orange,
              boxShadow: '0 4px 14px rgba(232,146,10,0.3)',
              fontFamily: "'Manrope', sans-serif",
            }}
            whileHover={{ y: -1, boxShadow: '0 8px 20px rgba(232,146,10,0.4)' }}
            whileTap={{ scale: 0.97 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            Generate Sekarang
          </motion.button>
        </div>
        {reportFiles.length === 0 ? (
          <div className="flex min-h-36 flex-col items-center justify-center gap-1.5">
            <p className="text-sm font-semibold" style={{ color: blue, fontFamily: "'Manrope', sans-serif" }}>Belum ada laporan</p>
            <p className="text-xs" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>Klik Generate Sekarang untuk membuat laporan terbaru.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr style={{ background: 'rgba(0,61,107,0.04)', borderBottom: '1px solid rgba(0,61,107,0.08)' }}>
                {['File', 'Tanggal', 'Aksi'].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3.5 text-xs font-bold uppercase tracking-widest"
                    style={{ color: 'rgba(0,61,107,0.45)', fontFamily: "'Manrope', sans-serif" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportFiles.map((file) => (
                <tr
                  key={file.name}
                  style={{ borderBottom: '1px solid rgba(0,61,107,0.06)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,61,107,0.025)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td className="px-5 py-4 font-semibold" style={{ color: blue, fontFamily: "'Manrope', sans-serif" }}>{file.name}</td>
                  <td className="px-5 py-4 text-xs" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
                    {file.created_at ? new Date(file.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => downloadReport(file.name)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-all duration-150"
                      style={{
                        color: blue,
                        background: 'rgba(0,61,107,0.07)',
                        border: `1px solid ${border}`,
                        fontFamily: "'Manrope', sans-serif",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,61,107,0.13)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,61,107,0.07)'}
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AdminCard>

      {/* Toast */}
      <AnimatePresence>
        {toast.msg && (
          <motion.div
            key={toast.msg}
            className="fixed right-5 top-5 z-50 rounded-xl px-4 py-3 text-sm font-semibold shadow-xl flex items-center gap-2"
            style={{
              background: toast.type === 'error' ? '#fff1f2' : '#f0fdf4',
              color:      toast.type === 'error' ? '#be123c'  : '#15803d',
              border:     toast.type === 'error' ? '1px solid rgba(190,18,60,0.25)' : '1px solid rgba(21,128,61,0.25)',
              fontFamily: "'Manrope', sans-serif",
            }}
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {toast.type === 'error' ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
