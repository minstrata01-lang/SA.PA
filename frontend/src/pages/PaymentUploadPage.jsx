import { useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "../supabaseClient";

const blue   = "#003D6B";
const orange = "#D97706";
const muted  = "rgba(0,61,107,0.5)";
const rule   = "rgba(0,61,107,0.1)";
const EASE   = [0.22, 1, 0.36, 1];

const BANK_INFO = {
  bankName: "Bank Syariah Indonesia",
  accountNumber: "7324808455",
  accountHolder: "PT Stratalift Solusi Indonesia",
  amount: 500000,
};

function PaymentUploadPage() {
  const navigate     = useNavigate();
  const location     = useLocation();
  const fileInputRef = useRef(null);

  const { reviewData, orderId } = location.state || {};

  const discountAmount = reviewData?.discount_amount != null
    ? Number(reviewData.discount_amount)
    : null
  const finalAmount    = discountAmount != null
    ? (BANK_INFO.amount - discountAmount)
    : BANK_INFO.amount

  const [selectedFile,  setSelectedFile]  = useState(null);
  const [preview,       setPreview]       = useState(null);
  const [isUploading,   setIsUploading]   = useState(false);
  const [error,         setError]         = useState("");
  const [copied,        setCopied]        = useState(false);

  if (!orderId || !reviewData) return <Navigate to="/layanan" replace />;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(BANK_INFO.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Gagal menyalin. Salin manual.");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!allowed.includes(file.type)) {
      setError("Format tidak didukung. Gunakan JPG, PNG, atau PDF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran file maksimal 5MB.");
      return;
    }
    setError("");
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreview("pdf");
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) { setError("Pilih file bukti transfer terlebih dahulu."); return; }
    setIsUploading(true);
    setError("");

    try {
      const ext      = selectedFile.name.split(".").pop();
      const filePath = `${orderId}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(filePath, selectedFile);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("payment-proofs")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("consultations")
        .update({ proof_url: urlData.publicUrl, payment_status: "pending_verification" })
        .eq("order_id", orderId);
      if (updateError) throw updateError;

      // Notifikasi WA ke admin (fire-and-forget, tidak memblokir navigasi)
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ order_id: orderId }),
      }).catch(() => {});

      navigate("/payment/pending", { state: { orderId, reviewData } });
    } catch (err) {
      setError(err.message || "Gagal mengupload bukti transfer. Coba lagi.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="bg-white pt-28 pb-14 px-4 sm:px-6 md:px-8">
      <div style={{ maxWidth: 560, margin: "0 auto" }}>

        {/* Subtle grid */}
        <div
          className="pointer-events-none fixed inset-0 -z-10"
          style={{
            background:
              "linear-gradient(rgba(0,61,107,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(0,61,107,0.035) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE }}
        >
          {/* Header */}
          <p className="text-[11px] font-bold tracking-[0.26em] uppercase mb-5" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
            Pembayaran
          </p>
          <h1 className="font-bold-hero leading-[1.08] tracking-[-0.03em] mb-3" style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)", color: blue }}>
            Unggah Bukti Transfer
          </h1>
          <p className="text-sm leading-relaxed mb-8" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
            Lakukan transfer ke rekening di bawah, lalu upload screenshot atau foto bukti transfer Anda.
          </p>

          <div className="h-px mb-8" style={{ background: rule }} />

          {/* Bank info */}
          <div className="flex flex-col gap-0 mb-8" style={{ border: `1px solid ${rule}` }}>
            {[
              { label: 'Bank',          value: BANK_INFO.bankName },
              { label: 'No. Rekening',  value: BANK_INFO.accountNumber, copyable: true },
              { label: 'Atas Nama',     value: BANK_INFO.accountHolder },
              ...(discountAmount != null ? [
                { label: 'Harga Normal',   value: `Rp ${BANK_INFO.amount.toLocaleString('id-ID')}` },
                { label: 'Diskon Voucher', value: `-Rp ${discountAmount.toLocaleString('id-ID')}`, highlight: true },
              ] : []),
              { label: 'Total Transfer', value: `Rp ${finalAmount.toLocaleString('id-ID')}`, bold: true },
            ].map((row, i) => (
              <div
                key={row.label}
                className="grid grid-cols-[130px_1fr] items-center"
                style={{ borderTop: i !== 0 ? `1px solid ${rule}` : 'none' }}
              >
                <p className="px-4 py-3 text-xs font-bold tracking-[0.1em] uppercase"
                   style={{ color: muted, fontFamily: "'Manrope', sans-serif", background: 'rgba(0,61,107,0.025)' }}>
                  {row.label}
                </p>
                <div className="px-4 py-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold"
                     style={{
                       color: row.highlight ? '#065f46' : blue,
                       fontFamily: "'Manrope', sans-serif",
                       fontWeight: row.bold ? 700 : 600,
                     }}>
                    {row.value}
                  </p>
                  {row.copyable && (
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="text-xs font-bold rounded-full px-3 py-1 shrink-0"
                      style={{
                        background: copied ? 'rgba(0,61,107,0.08)' : 'rgba(217,119,6,0.1)',
                        color: copied ? blue : orange,
                        border: 'none', cursor: 'pointer', fontFamily: "'Manrope', sans-serif",
                        transition: 'all 0.2s',
                      }}
                    >
                      {copied ? 'Tersalin ✓' : 'Salin'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Upload area */}
          <div className="mb-2">
            <p className="text-xs font-bold tracking-[0.12em] uppercase mb-3" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
              Bukti Transfer
            </p>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `1px dashed ${error ? "#f87171" : selectedFile ? orange : rule}`,
                padding: "2rem 1.5rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.75rem",
                cursor: "pointer",
                transition: "border-color 0.2s ease, background 0.2s ease",
                background: selectedFile ? "rgba(217,119,6,0.03)" : "rgba(0,61,107,0.015)",
                minHeight: 160,
              }}
            >
              {preview && preview !== "pdf" ? (
                <img src={preview} alt="Preview" style={{ maxHeight: 140, objectFit: "contain" }} />
              ) : preview === "pdf" ? (
                <div className="flex flex-col items-center gap-2">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={orange} strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span className="text-sm font-medium" style={{ color: blue, fontFamily: "'Manrope', sans-serif" }}>{selectedFile?.name}</span>
                </div>
              ) : (
                <>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p className="text-sm font-semibold text-center" style={{ color: blue, fontFamily: "'Manrope', sans-serif" }}>
                    Klik untuk pilih file
                  </p>
                  <p className="text-xs text-center" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
                    JPG, PNG, PDF — maks 5MB
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {error && (
            <p className="mb-4 text-xs font-medium" style={{ color: "#ef4444", fontFamily: "'Manrope', sans-serif" }}>
              ⚠ {error}
            </p>
          )}

          <div className="h-px my-6" style={{ background: rule }} />

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedFile || isUploading}
              className="rounded-full font-semibold text-white w-full"
              style={{
                height: 50, background: !selectedFile || isUploading ? "rgba(217,119,6,0.4)" : orange,
                border: "none", fontSize: 14, fontFamily: "'Manrope', sans-serif",
                cursor: !selectedFile || isUploading ? "not-allowed" : "pointer",
                transition: "background 0.2s ease",
              }}
            >
              {isUploading ? "Mengunggah..." : "Kirim Bukti Transfer"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-full font-semibold w-full"
              style={{
                height: 46, border: `1px solid ${rule}`, background: "white",
                color: blue, fontSize: 14, fontFamily: "'Manrope', sans-serif", cursor: "pointer",
              }}
            >
              ← Kembali
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default PaymentUploadPage;
