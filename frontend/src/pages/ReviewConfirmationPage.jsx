import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const blue   = "#003D6B";
const orange = "#D97706";
const muted  = "rgba(0,61,107,0.5)";
const rule   = "rgba(0,61,107,0.1)";
const EASE   = [0.22, 1, 0.36, 1];

const Lokasi = ["Jakarta"];

const CATEGORY_MAP = {
  low_rise: "Low-rise Building (Bangunan 1-4 Lantai)", mid_rise: "Mid-rise Building (Bangunan 5-10 Lantai)",
  high_rise: "High-rise Building (Bangunan di atas 10 Lantai)", rumah_singgah: "Rumah Tinggal",
  work_shop: "Workshop", jembatan: "Jembatan",
  dermaga: "Dermaga", kawasan_tambang: "Kawasan Tambang",
};

function ReviewConfirmationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isProceeding,        setIsProceeding]        = useState(false)
  const [voucherCode,         setVoucherCode]         = useState('')
  const [voucherResult,       setVoucherResult]       = useState(null)
  const [voucherError,        setVoucherError]        = useState('')
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false)

  const reviewData = location.state?.reviewData;
  if (!reviewData) return <Navigate to="/layanan" replace />;

  const isOutsideLokasi = Boolean(reviewData?.location && !Lokasi.includes(reviewData.location));
  const [showOutsidePopup, setShowOutsidePopup] = useState(isOutsideLokasi);

  const selectedLabels = (reviewData.selectedCategories || [])
    .map((id) => CATEGORY_MAP[id] || id).join(", ");

  const projectDetails =
    reviewData.projectDetails?.trim() ||
    [selectedLabels, reviewData.issueDescription].filter(Boolean).join(" - ").trim() ||
    "Tidak ada detail proyek.";

  const reviewItems = [
    { label: "Nama",                   value: reviewData.name || reviewData.fullName || "-" },
    { label: "Email",                  value: reviewData.email || "-" },
    { label: "No. HP",                 value: reviewData.phone || "-" },
    { label: "Lokasi Proyek",          value: reviewData.location || "-" },
    { label: "Kategori Bangunan",      value: selectedLabels || "-" },
    { label: "Deskripsi Permasalahan", value: reviewData.issueDescription || "-" },
  ];

  const handleContactAdmin = () => {
    const name = encodeURIComponent(reviewData.name || reviewData.fullName || "");
    const city = encodeURIComponent(reviewData.location || "");
    const waUrl = `https://wa.me/62881010512829?text=Hallo+admin%2C+saya+${name}+dari+luar+Jakarta+ingin+melakukan+konsultasi+mengenai+masalah+bangunan+saya`;
    window.open(waUrl, "_blank");
    setShowOutsidePopup(false);
  };

  const handleEditData = () => {
    navigate("/preassessment/form", {
      state: {
        initialFormData: {
          fullName: reviewData.name || reviewData.fullName || "",
          email: reviewData.email || "", phone: reviewData.phone || "",
          location: reviewData.location || "",
          selectedCategories: reviewData.selectedCategories || [],
          issueType: reviewData.issueType || "",
          issueDescription: reviewData.issueDescription || "",
          projectDetails,
        },
      },
    });
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return
    setIsValidatingVoucher(true)
    setVoucherError('')
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-voucher`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ code: voucherCode.trim(), order_id: reviewData.orderId }),
        }
      )
      const data = await res.json()
      if (data.valid) {
        setVoucherResult(data)
        setVoucherError('')
      } else {
        setVoucherError(data.reason || 'Kode voucher tidak valid')
        setVoucherResult(null)
      }
    } catch {
      setVoucherError('Gagal memvalidasi voucher. Coba lagi.')
    } finally {
      setIsValidatingVoucher(false)
    }
  }

  const handleRemoveVoucher = () => {
    fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-voucher`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ code: null, order_id: reviewData.orderId }),
      }
    ).catch(() => {})
    setVoucherResult(null)
    setVoucherCode('')
    setVoucherError('')
  }

  const handleProceedToPayment = async () => {
    if (isProceeding) return   // cegah double-click
    setIsProceeding(true)

    const isFree = voucherResult?.final_amount === 0

    if (isFree) {
      try {
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-admin`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ order_id: reviewData.orderId, voucher_used: true }),
          }
        )
      } catch {}
      navigate('/payment/pending', { state: { orderId: reviewData.orderId, reviewData } })
      return  // navigasi terjadi, setIsProceeding(false) tidak perlu
    }

    const updatedReviewData = voucherResult
      ? {
          ...reviewData,
          voucher_code:     voucherResult.code,
          discount_percent: voucherResult.discount_percent,
          discount_amount:  voucherResult.discount_amount,
          final_amount:     voucherResult.final_amount,
        }
      : reviewData

    navigate('/payment/upload', {
      state: { reviewData: updatedReviewData, orderId: reviewData.orderId },
    })
    // navigasi terjadi, setIsProceeding(false) tidak diperlukan
  }

  return (
    <section className="bg-white pt-28 pb-14 px-4 sm:px-6 md:px-8">
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
          <p className="text-[11px] font-bold tracking-[0.26em] uppercase mb-5" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
            Langkah Terakhir
          </p>
          <h1 className="font-bold-hero leading-[1.08] tracking-[-0.03em]" style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: blue }}>
            Review & Konfirmasi Data
          </h1>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
            Pastikan data Anda sudah benar sebelum melanjutkan ke proses pembayaran.
          </p>
        </motion.div>

        <div className="mt-10 h-px" style={{ background: rule }} />

        {/* Review items */}
        <motion.div
          className="mt-8 flex flex-col gap-0"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
        >
          {reviewItems.map((item, i) => (
            <div
              key={item.label}
              className="grid grid-cols-[140px_1fr] gap-4 py-4"
              style={{ borderBottom: `1px solid ${rule}` }}
            >
              <p className="text-xs font-bold tracking-[0.12em] uppercase pt-0.5" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
                {item.label}
              </p>
              <p className="text-sm font-medium leading-relaxed" style={{ color: blue, fontFamily: "'Manrope', sans-serif" }}>
                {item.value}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Voucher Section */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.15 }}
        >
          <label
            htmlFor="voucher-input"
            className="text-xs font-bold tracking-[0.12em] uppercase mb-3"
            style={{ color: muted, fontFamily: "'Manrope', sans-serif", display: 'block' }}
          >
            Kode Voucher <span style={{ color: orange }}>(Opsional)</span>
          </label>

          {!voucherResult ? (
            <div className="flex gap-2">
              <input
                id="voucher-input"
                type="text"
                value={voucherCode}
                onChange={(e) => { setVoucherCode(e.target.value.toUpperCase()); setVoucherError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyVoucher()}
                placeholder="Masukkan kode voucher"
                style={{
                  flex: 1, height: 44, padding: '0 14px',
                  border: `1px solid ${voucherError ? '#ef4444' : rule}`,
                  outline: 'none', fontSize: 13, color: blue,
                  fontFamily: "'Manrope', sans-serif", background: 'white',
                }}
              />
              <button
                type="button"
                onClick={handleApplyVoucher}
                disabled={!voucherCode.trim() || isValidatingVoucher}
                style={{
                  height: 44, padding: '0 20px',
                  background: !voucherCode.trim() || isValidatingVoucher ? 'rgba(217,119,6,0.4)' : orange,
                  color: 'white', border: 'none', fontSize: 13,
                  fontFamily: "'Manrope', sans-serif",
                  cursor: !voucherCode.trim() || isValidatingVoucher ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                {isValidatingVoucher ? '...' : 'Pakai'}
              </button>
            </div>
          ) : (
            <div className="flex items-start justify-between p-4"
                 style={{ background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.2)' }}>
              <div>
                <p className="text-sm font-bold" style={{ color: '#065f46', fontFamily: "'Manrope', sans-serif" }}>
                  ✓ Voucher {voucherResult.code}
                </p>
                <p className="text-xs mt-1" style={{ color: '#065f46', fontFamily: "'Manrope', sans-serif" }}>
                  Diskon {voucherResult.discount_percent}% = -Rp {voucherResult.discount_amount.toLocaleString('id-ID')}
                </p>
                <p className="text-xs font-bold mt-1" style={{ color: blue, fontFamily: "'Manrope', sans-serif" }}>
                  Total yang dibayar: Rp {voucherResult.final_amount.toLocaleString('id-ID')}
                </p>
              </div>
              <button
                type="button"
                onClick={handleRemoveVoucher}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: muted, fontSize: 18, padding: '2px 6px' }}
                title="Hapus voucher"
              >
                ✕
              </button>
            </div>
          )}

          {voucherError && (
            <p className="mt-2 text-xs font-medium" style={{ color: '#ef4444', fontFamily: "'Manrope', sans-serif" }}>
              ⚠ {voucherError}
            </p>
          )}
        </motion.div>

        {/* Checkbox confirm */}
        <motion.label
          className="mt-8 flex items-start gap-3 cursor-pointer"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.2 }}
        >
          <input
            type="checkbox"
            checked={isConfirmed}
            onChange={(e) => setIsConfirmed(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0"
            style={{ accentColor: orange }}
          />
          <span className="text-sm leading-relaxed" style={{ color: blue, fontFamily: "'Manrope', sans-serif" }}>
            Saya mengonfirmasi bahwa seluruh data di atas sudah benar.
          </span>
        </motion.label>

        <div className="mt-10 h-px" style={{ background: rule }} />

        {/* Actions */}
        <motion.div
          className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.25 }}
        >
          <button
            type="button"
            onClick={handleEditData}
            className="rounded-full font-semibold cursor-pointer"
            style={{
              height: 46, paddingLeft: 20, paddingRight: 20,
              border: `1px solid ${rule}`, background: "white",
              color: blue, fontSize: 14, fontFamily: "'Manrope', sans-serif",
            }}
          >
            ← Ubah Data
          </button>
          <button
            type="button"
            onClick={handleProceedToPayment}
            disabled={!isConfirmed || isProceeding}
            className="rounded-full font-semibold text-white"
            style={{
              height: 46, paddingLeft: 24, paddingRight: 24,
              background: !isConfirmed || isProceeding ? "rgba(217,119,6,0.4)" : orange,
              border: "none", fontSize: 14, fontFamily: "'Manrope', sans-serif",
              cursor: !isConfirmed || isProceeding ? "not-allowed" : "pointer",
              transition: "background 0.2s ease",
            }}
          >
            {isProceeding
              ? 'Memproses...'
              : voucherResult?.final_amount === 0
                ? 'Konfirmasi Tanpa Pembayaran →'
                : 'Lanjut ke Pembayaran →'}
          </button>
        </motion.div>
      </div>

      {/* ── Outside Jakarta popup ── */}
      {showOutsidePopup && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            background: "rgba(0,18,37,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: "white",
              maxWidth: 440, width: "100%",
              padding: "2rem",
              position: "relative",
            }}
          >
            <div style={{ height: 3, background: orange, position: "absolute", top: 0, left: 0, right: 0 }} />

            <p className="text-[11px] font-bold tracking-[0.22em] uppercase mb-4" style={{ color: orange, fontFamily: "'Manrope', sans-serif" }}>
              Perhatian
            </p>
            <h3 className="font-bold-hero leading-snug tracking-[-0.02em] mb-3" style={{ fontSize: "clamp(1.1rem, 2vw, 1.4rem)", color: blue }}>
              Lokasi di Luar Jakarta
            </h3>
            <p className="text-sm leading-relaxed mb-4" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
              Layanan kunjungan langsung kami saat ini hanya tersedia di wilayah Jakarta. Untuk lokasi luar area, silakan hubungi admin kami terlebih dahulu untuk penjadwalan & biaya tambahan.
            </p>
            <div
              className="flex items-start gap-3 mb-6 p-3"
              style={{ background: "rgba(217,119,6,0.07)", border: `1px solid rgba(217,119,6,0.2)` }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM8 5v4M8 11h.01" stroke={orange} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-xs leading-relaxed" style={{ color: blue, fontFamily: "'Manrope', sans-serif" }}>
                <span className="font-bold">Biaya Rp 500.000</span> berlaku untuk konsultasi secara <span className="font-bold">online</span>. Peninjauan langsung ke lokasi akan dikenakan <span className="font-bold">biaya tambahan</span> yang akan dikonfirmasi oleh admin.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleContactAdmin}
                className="flex-1 rounded-full font-semibold text-white"
                style={{ height: 44, background: orange, border: "none", fontSize: 14, fontFamily: "'Manrope', sans-serif", cursor: "pointer" }}
              >
                Hubungi Admin via WA
              </button>
              <button
                type="button"
                onClick={() => setShowOutsidePopup(false)}
                className="flex-1 rounded-full font-semibold"
                style={{ height: 44, border: `1px solid ${rule}`, background: "white", color: blue, fontSize: 14, fontFamily: "'Manrope', sans-serif", cursor: "pointer" }}
              >
                Tetap Lanjutkan
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
}

export default ReviewConfirmationPage;
