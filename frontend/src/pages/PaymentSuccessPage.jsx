import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";

const blue   = "#003D6B";
const orange = "#D97706";
const muted  = "rgba(0,61,107,0.5)";
const rule   = "rgba(0,61,107,0.1)";
const EASE   = [0.22, 1, 0.36, 1];

const nextSteps = [
  { done: true,  num: "1", title: "Pembayaran diterima",              desc: "Pembayaran kamu sudah tercatat di sistem kami." },
  { done: false, num: "2", title: "Admin memverifikasi pesanan",       desc: "Proses verifikasi berlangsung maksimal 1x24 jam kerja." },
  { done: false, num: "3", title: "Undangan grup konsultasi dikirim",  desc: "Link grup WhatsApp akan dikirim ke nomor yang kamu daftarkan." },
];

function PaymentSuccessPage() {
  const navigate      = useNavigate();
  const [searchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);

  const orderId      = searchParams.get("order_id") || "-";
  const adminWaNumber = import.meta.env.VITE_ADMIN_WA_NUMBER;
  const waUrl         = adminWaNumber ? `https://wa.me/${adminWaNumber}` : null;

  const handleCopy = async () => {
    if (orderId === "-") return;
    try { await navigator.clipboard.writeText(orderId); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { alert("Gagal menyalin Order ID."); }
  };

  return (
    <section className="bg-white pt-28 pb-14 px-4 sm:px-6 md:px-8" style={{ minHeight: "100svh" }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>

          {/* Status badge */}
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#22c55e" }} />
            <span className="text-xs font-bold tracking-[0.12em] uppercase" style={{ color: "#16a34a", fontFamily: "'Manrope', sans-serif" }}>
              Pembayaran Dikonfirmasi
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-bold-hero leading-[1.08] tracking-[-0.03em] mb-3" style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: blue }}>
            Terima kasih!{" "}
            <span style={{ color: orange }}>Pembayaran berhasil</span> diterima.
          </h1>

          <p className="text-sm leading-relaxed" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
            Admin kami akan segera memverifikasi dan mengundang kamu ke dalam{" "}
            <strong style={{ color: blue }}>grup konsultasi</strong> via WhatsApp.
          </p>

          <div className="mt-8 h-px" style={{ background: rule }} />

          {/* Order ID */}
          <div className="mt-6 flex items-center justify-between py-4" style={{ borderBottom: `1px solid ${rule}` }}>
            <div>
              <p className="text-[10px] font-bold tracking-[0.16em] uppercase mb-1" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>Order ID</p>
              <p className="text-sm font-mono font-semibold" style={{ color: blue }}>{orderId}</p>
            </div>
            <button
              onClick={handleCopy}
              disabled={orderId === "-"}
              className="rounded-full text-xs font-bold cursor-pointer"
              style={{ height: 32, paddingLeft: 14, paddingRight: 14, border: `1px solid ${rule}`, background: "white", color: blue, fontFamily: "'Manrope', sans-serif" }}
            >
              {copied ? "✓ Tersalin" : "Salin"}
            </button>
          </div>

          <p className="mt-3 text-xs leading-relaxed" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
            Simpan Order ID ini untuk referensi. Kamu tidak perlu melakukan pembayaran ulang.
          </p>

          {/* Next steps */}
          <div className="mt-8">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-4" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>Proses selanjutnya</p>
            {nextSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-4 py-4" style={{ borderBottom: i < 2 ? `1px solid ${rule}` : "none" }}>
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                  style={{
                    background: step.done ? "#22c55e" : "transparent",
                    border: `1px solid ${step.done ? "#22c55e" : rule}`,
                    color: step.done ? "white" : muted,
                  }}
                >
                  {step.done ? "✓" : step.num}
                </span>
                <div>
                  <p className="text-sm font-bold mb-0.5" style={{ color: step.done ? "#16a34a" : blue, fontFamily: "'Manrope', sans-serif" }}>{step.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 h-px" style={{ background: rule }} />

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => waUrl && window.open(waUrl, "_blank")}
              disabled={!waUrl}
              className="w-full rounded-full font-semibold text-white cursor-pointer"
              style={{ height: 46, background: orange, border: "none", fontSize: 14, fontFamily: "'Manrope', sans-serif" }}
            >
              Hubungi Admin via WhatsApp
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full rounded-full font-semibold cursor-pointer"
              style={{ height: 46, border: `1px solid ${rule}`, background: "white", color: blue, fontSize: 14, fontFamily: "'Manrope', sans-serif" }}
            >
              Kembali ke Beranda
            </button>
          </div>

          <p className="mt-6 text-center text-xs" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
            Ada pertanyaan? Admin siap membantu kapan saja.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export default PaymentSuccessPage;
