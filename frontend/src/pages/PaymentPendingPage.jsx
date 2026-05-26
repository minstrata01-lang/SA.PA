import { Navigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const blue   = "#003D6B";
const orange = "#D97706";
const muted  = "rgba(0,61,107,0.72)";
const rule   = "rgba(0,61,107,0.1)";
const EASE   = [0.22, 1, 0.36, 1];

function PaymentPendingPage() {
  const location = useLocation();
  const { reviewData } = location.state || {};

  if (!reviewData) return <Navigate to="/" replace />;

  const email = reviewData.email || "email Anda";
  const adminWaNumber = import.meta.env.VITE_ADMIN_WA_NUMBER;
  const waUrl = adminWaNumber ? `https://wa.me/${adminWaNumber}` : null;

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
          {/* Icon */}
          <div
            className="mb-8 flex items-center justify-center"
            style={{ width: 56, height: 56, background: "rgba(217,119,6,0.1)", borderRadius: "50%" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke={orange} strokeWidth="1.5" />
              <path d="M12 6v6l4 2" stroke={orange} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>

          {/* Header */}
          <p className="text-[11px] font-bold tracking-[0.26em] uppercase mb-4" style={{ color: orange, fontFamily: "'Manrope', sans-serif" }}>
            Dalam Proses
          </p>
          <h1 className="font-bold-hero leading-[1.08] tracking-[-0.03em] mb-3" style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)", color: blue }}>
            Bukti Transfer Diterima
          </h1>
          <p className="text-sm leading-relaxed mb-8" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
            Bukti transfer Anda sedang diverifikasi oleh admin kami. Konfirmasi akan dikirimkan ke{" "}
            <span style={{ color: blue, fontWeight: 600 }}>{email}</span>{" "}
            setelah pembayaran terverifikasi.
          </p>

          <div className="h-px mb-8" style={{ background: rule }} />

          {/* Info list */}
          <div className="flex flex-col gap-4 mb-8">
            {[
              "Proses verifikasi biasanya 1×24 jam di hari kerja",
              "Cek folder spam jika email konfirmasi tidak masuk",
              "Jika ada pertanyaan, hubungi admin via WhatsApp",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: orange, flexShrink: 0, marginTop: 6 }} />
                <p className="text-sm leading-relaxed" style={{ color: blue, fontFamily: "'Manrope', sans-serif" }}>{item}</p>
              </div>
            ))}
          </div>

          <div className="h-px mb-8" style={{ background: rule }} />

          {/* CTA */}
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-3 rounded-full font-semibold text-white w-full"
              style={{
                height: 50,
                background: orange,
                fontSize: 14,
                fontFamily: "'Manrope', sans-serif",
                textDecoration: "none",
              }}
            >
              Hubungi Admin via WhatsApp
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          )}
        </motion.div>
      </div>
    </section>
  );
}

export default PaymentPendingPage;
