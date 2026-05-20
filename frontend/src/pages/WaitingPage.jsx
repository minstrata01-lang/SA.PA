import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const blue   = "#003D6B";
const orange = "#D97706";
const muted  = "rgba(0,61,107,0.5)";
const rule   = "rgba(0,61,107,0.1)";
const EASE   = [0.22, 1, 0.36, 1];

const POLL_INTERVAL_MS = 4000;
const MAX_WAIT_MS      = 10 * 60 * 1000;
const SUCCESS_STATUSES = ["paid", "success", "settlement", "capture", "confirmed"];
const FAILED_STATUSES  = ["failed", "failure", "cancel", "deny", "expire", "refund"];

function useElapsed() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
}

function DotLoader() {
  return (
    <span className="inline-flex gap-1 items-end h-4">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block w-1.5 h-1.5 rounded-full"
          style={{ background: muted }}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

function WaitingPage() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId        = searchParams.get("order_id");
  const adminWaLink    = `https://wa.me/${import.meta.env.VITE_ADMIN_WA_NUMBER}`;

  const [status, setStatus]         = useState("checking");
  const [lastChecked, setLastChecked] = useState(null);
  const [pollCount, setPollCount]   = useState(0);
  const elapsed    = useElapsed();
  const startedAt  = useRef(Date.now());
  const channelRef = useRef(null);

  const activeStep = pollCount === 0 ? 0 : pollCount < 3 ? 1 : 2;
  const isTimeout  = status === "timeout";
  const isError    = status === "error";
  const isWaiting  = !isTimeout && !isError;

  const checkStatus = async () => {
    if (!orderId) return;
    try {
      const { data, error } = await supabase.from("consultations").select("payment_status").eq("order_id", orderId).maybeSingle();
      if (error) throw error;
      setLastChecked(new Date());
      setPollCount((c) => c + 1);
      const ps = (data?.payment_status || "").toLowerCase();
      if (SUCCESS_STATUSES.includes(ps)) { navigate(`/payment/success?order_id=${orderId}`); return; }
      if (FAILED_STATUSES.includes(ps))  { navigate(`/payment/failed?order_id=${orderId}&message=${encodeURIComponent("Pembayaran tidak berhasil diproses.")}`); return; }
      if (Date.now() - startedAt.current > MAX_WAIT_MS) { setStatus("timeout"); return; }
      setStatus("waiting");
    } catch { setStatus("error"); }
  };

  useEffect(() => {
    if (!orderId) return;
    checkStatus();
    const channel = supabase.channel(`consultation-${orderId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "consultations", filter: `order_id=eq.${orderId}` }, (payload) => {
        const ps = (payload.new?.payment_status || "").toLowerCase();
        if (SUCCESS_STATUSES.includes(ps)) navigate(`/payment/success?order_id=${orderId}`);
        else if (FAILED_STATUSES.includes(ps)) navigate(`/payment/failed?order_id=${orderId}&message=${encodeURIComponent("Pembayaran tidak berhasil diproses.")}`);
      }).subscribe();
    channelRef.current = channel;
    const pollId = setInterval(() => {
      if (Date.now() - startedAt.current > MAX_WAIT_MS) { setStatus("timeout"); clearInterval(pollId); return; }
      checkStatus();
    }, POLL_INTERVAL_MS);
    return () => { clearInterval(pollId); supabase.removeChannel(channel); };
  }, [orderId]);

  const steps = [
    { label: "Menghubungi server pembayaran",       done: pollCount > 0,  active: activeStep === 0 },
    { label: "Memverifikasi status transaksi",       done: pollCount >= 3, active: activeStep === 1 },
    { label: "Mengkonfirmasi & mengirim link ke WA", done: false,          active: activeStep === 2 },
  ];

  return (
    <section className="bg-white pt-28 pb-14 px-4 sm:px-6 md:px-8" style={{ minHeight: "100svh" }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>

          {/* Eyebrow */}
          <p className="text-[11px] font-bold tracking-[0.26em] uppercase mb-5" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
            Status Pembayaran
          </p>

          {/* Status indicator */}
          <div className="flex items-center gap-3 mb-6">
            {isWaiting && (
              <motion.span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: blue }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              />
            )}
            {isTimeout && <span className="w-2.5 h-2.5 rounded-full" style={{ background: orange }} />}
            {isError   && <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ef4444" }} />}
            <span className="text-xs font-bold tracking-[0.12em] uppercase" style={{ color: isError ? "#ef4444" : isTimeout ? orange : blue, fontFamily: "'Manrope', sans-serif" }}>
              {isTimeout ? "Waktu Habis" : isError ? "Terjadi Kesalahan" : "Menunggu Konfirmasi"}
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-bold-hero leading-[1.08] tracking-[-0.03em] mb-3" style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: blue }}>
            {isTimeout ? "Pembayaran Belum Terkonfirmasi" : isError ? "Gagal Mengecek Status" : "Memverifikasi Pembayaran"}
          </h1>

          <p className="text-sm leading-relaxed" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
            {isTimeout
              ? "Proses verifikasi membutuhkan waktu lebih lama dari biasanya. Hubungi admin jika Anda sudah membayar."
              : isError
              ? "Gagal menghubungi server. Pastikan koneksi internet Anda stabil."
              : <>{`Sedang memverifikasi pembayaran secara otomatis`} <DotLoader /></>}
          </p>

          <div className="mt-8 h-px" style={{ background: rule }} />

          {/* Order ID */}
          {orderId && (
            <div className="mt-6 grid grid-cols-2 gap-4 py-4" style={{ borderBottom: `1px solid ${rule}` }}>
              <div>
                <p className="text-[10px] font-bold tracking-[0.16em] uppercase mb-1" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>Order ID</p>
                <p className="text-sm font-semibold truncate" style={{ color: blue, fontFamily: "'Manrope', sans-serif" }}>{orderId}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold tracking-[0.16em] uppercase mb-1" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>Durasi</p>
                <p className="text-sm font-mono font-semibold" style={{ color: blue }}>{elapsed}</p>
              </div>
            </div>
          )}

          {/* Progress steps */}
          {isWaiting && (
            <div className="mt-6 flex flex-col gap-0">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-4 py-3" style={{ borderBottom: i < 2 ? `1px solid ${rule}` : "none" }}>
                  <span
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                    style={{
                      background: step.done ? "#22c55e" : step.active ? blue : "transparent",
                      border: `1px solid ${step.done ? "#22c55e" : step.active ? blue : rule}`,
                      color: step.done || step.active ? "white" : muted,
                      transition: "all 0.4s ease",
                    }}
                  >
                    {step.done ? "✓" : i + 1}
                  </span>
                  <span className="text-sm leading-snug" style={{ color: step.done ? "#16a34a" : step.active ? blue : muted, fontFamily: "'Manrope', sans-serif", fontWeight: step.active || step.done ? 600 : 400, transition: "color 0.4s ease" }}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {lastChecked && isWaiting && (
            <p className="mt-3 text-xs" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
              Terakhir dicek: {lastChecked.toLocaleTimeString("id-ID")} · Percobaan ke-{pollCount}
            </p>
          )}

          {isWaiting && (
            <p className="mt-4 text-xs leading-relaxed px-4 py-3" style={{ color: muted, fontFamily: "'Manrope', sans-serif", border: `1px solid ${rule}` }}>
              Halaman ini otomatis memeriksa status pembayaran setiap beberapa detik. Jangan tutup tab ini.
            </p>
          )}

          <div className="mt-8 h-px" style={{ background: rule }} />

          {/* CTA */}
          <div className="mt-6 flex flex-col gap-3">
            {(isTimeout || isError) && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full rounded-full font-semibold text-white cursor-pointer"
                style={{ height: 46, background: blue, border: "none", fontSize: 14, fontFamily: "'Manrope', sans-serif" }}
              >
                Cek Ulang Status
              </button>
            )}
            <a
              href={adminWaLink}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center rounded-full font-semibold cursor-pointer"
              style={{ height: 46, border: `1px solid ${rule}`, background: "white", color: blue, fontSize: 14, fontFamily: "'Manrope', sans-serif", textDecoration: "none" }}
            >
              Butuh Bantuan? Hubungi Admin
            </a>
          </div>

          <p className="mt-6 text-center text-xs" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
            Terima kasih sudah menggunakan layanan konsultasi SAPA
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export default WaitingPage;
