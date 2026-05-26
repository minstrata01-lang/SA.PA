import { useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";

const blue   = "#003D6B";
const orange = "#D97706";
const muted  = "rgba(0,61,107,0.72)";
const rule   = "rgba(0,61,107,0.1)";
const EASE   = [0.22, 1, 0.36, 1];

const reasons = [
  "Saldo tidak mencukupi",
  "Koneksi terputus saat pembayaran",
  "Batas waktu pembayaran habis",
  "Kartu/rekening ditolak",
];

function PaymentFailedPage() {
  const navigate      = useNavigate();
  const [searchParams] = useSearchParams();

  const orderId       = searchParams.get("order_id");
  const reasonFromQuery = searchParams.get("message");
  const adminWaNumber = import.meta.env.VITE_ADMIN_WA_NUMBER;

  const displayReason = reasonFromQuery || "Pembayaran dibatalkan atau terjadi kesalahan pada proses transaksi.";
  const waUrl = useMemo(() => adminWaNumber ? `https://wa.me/${adminWaNumber}` : "", [adminWaNumber]);

  return (
    <section className="bg-white pt-28 pb-14 px-4 sm:px-6 md:px-8" style={{ minHeight: "100svh" }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>

          {/* Status badge */}
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ef4444" }} />
            <span className="text-xs font-bold tracking-[0.12em] uppercase" style={{ color: "#ef4444", fontFamily: "'Manrope', sans-serif" }}>
              Pembayaran Gagal
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-bold-hero leading-[1.08] tracking-[-0.03em] mb-3" style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: blue }}>
            Transaksi tidak dapat diproses.
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
            Kamu dapat mencoba kembali atau menghubungi admin jika masalah berlanjut.
          </p>

          <div className="mt-8 h-px" style={{ background: rule }} />

          {/* Reason */}
          <div className="mt-6 py-4" style={{ borderBottom: `1px solid ${rule}` }}>
            <p className="text-[10px] font-bold tracking-[0.16em] uppercase mb-2" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>Alasan</p>
            <p className="text-sm font-medium leading-relaxed" style={{ color: "#ef4444", fontFamily: "'Manrope', sans-serif" }}>{displayReason}</p>
          </div>

          {/* Order ID */}
          {orderId && (
            <div className="py-4" style={{ borderBottom: `1px solid ${rule}` }}>
              <p className="text-[10px] font-bold tracking-[0.16em] uppercase mb-2" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>Order ID</p>
              <p className="text-sm font-mono font-semibold" style={{ color: blue }}>{orderId}</p>
            </div>
          )}

          {/* Possible causes */}
          <div className="mt-6">
            <p className="text-xs font-bold tracking-[0.12em] uppercase mb-4" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>Kemungkinan Penyebab</p>
            <ul className="flex flex-col gap-0">
              {reasons.map((r, i) => (
                <li key={i} className="flex items-center gap-3 py-3" style={{ borderBottom: i < reasons.length - 1 ? `1px solid ${rule}` : "none" }}>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: muted }} />
                  <span className="text-sm" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 h-px" style={{ background: rule }} />

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => navigate("/layanan")}
              className="w-full rounded-full font-semibold text-white cursor-pointer"
              style={{ height: 46, background: orange, border: "none", fontSize: 14, fontFamily: "'Manrope', sans-serif" }}
            >
              Coba Lagi
            </button>
            <button
              type="button"
              onClick={() => waUrl ? (window.location.href = waUrl) : navigate("/layanan")}
              className="w-full rounded-full font-semibold cursor-pointer"
              style={{ height: 46, border: `1px solid ${rule}`, background: "white", color: blue, fontSize: 14, fontFamily: "'Manrope', sans-serif" }}
            >
              Hubungi Admin via WhatsApp
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default PaymentFailedPage;
