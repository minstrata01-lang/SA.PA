import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { blue, orange, muted, rule, darkNav, EASE } from "./tokens";

const ruleWhite = "rgba(255,255,255,0.1)";

const sections = [
  {
    label: "A",
    title: "Layanan",
    items: [
      "Layanan konsultasi online dilakukan melalui Whatsapp. Video Call/Zoom dapat dilakukan jika diperlukan.",
      "Layanan konsultasi online tetap dilakukan secara optimal, dengan kualitas pembahasan yang setara dengan konsultasi langsung di lokasi.",
      "Layanan konsultasi tersedia secara offline (peninjauan langsung ke lokasi) jika diperlukan, dengan biaya tambahan sesuai lokasi.",
      {
        text: "Layanan Pre-Assessment sudah termasuk:",
        sub: [
          "Peninjauan langsung ke lokasi 1×/pemesanan",
          "Pemeriksaan dilakukan melalui pengecekan visual",
          {
            text: "Pengecekan visual meliputi:",
            sub: [
              "Struktur utama (kolom, balok, plat lantai)",
              "Dinding",
              "Atap dan rangka",
              "Pondasi (visual eksternal)",
            ],
          },
          "Laporan hasil Pre-Assessment",
        ],
      },
      {
        text: "Layanan Pre-Assessment tidak termasuk:",
        sub: [
          "Pengecekan pada akses area tertutup yang memerlukan pembongkaran finishing/plafon, pondasi, dan akses area berbahaya tanpa scaffolding",
          "Analisis perhitungan teknis",
          "Gambar teknis (as built drawing / shop drawing perbaikan)",
          "Jasa tambahan seperti land investigation/surveyor (pengukuran, sondir, boring, dll)",
          "RAB",
        ],
      },
    ],
  },
  {
    label: "B",
    title: "Cakupan Wilayah",
    table: [
      { area: "Jakarta", note: "Rp 500.000 sudah termasuk peninjauan langsung ke lokasi." },
      { area: "Luar Jakarta", note: "Jika ingin peninjauan langsung ke lokasi akan dihubungkan ke admin untuk proses diskusi dan ketentuan harga lebih lanjut." },
    ],
  },
  {
    label: "C",
    title: "Proses & Timeline",
    items: [
      "Pemesanan dilakukan dengan mengisi form dan pembayaran melalui website.",
      "Jika memerlukan peninjauan langsung ke lokasi, Anda akan dihubungkan dengan admin untuk proses diskusi dan penyesuaian biaya lebih lanjut.",
      "Layanan yang telah dibayar tidak dapat dikembalikan (non-refundable).",
      "Layanan akan dimulai setelah admin melakukan konfirmasi pemesanan dan pembayaran (maksimal 1×24 jam).",
      "Akses komunikasi (chat) akan ditutup maksimal 3 hari setelah proses konsultasi selesai.",
      "Proses konsultasi dinyatakan selesai jika sudah laporan akhir diterima dan dikonfirmasi.",
      "Laporan dikirim maksimal 3 hari kerja setelah seluruh proses identifikasi/peninjauan selesai.",
      "Penjadwalan kunjungan ke lokasi menyesuaikan ketersediaan tim ahli (hari kerja maupun akhir pekan).",
    ],
  },
  {
    label: "D",
    title: "Ketentuan Lainnya",
    items: [
      "Kami berhak melakukan dokumentasi kegiatan. Dengan menggunakan layanan ini, Anda menyetujui penggunaan dokumentasi untuk keperluan branding dan publikasi.",
      "Laporan akhir Pre-Assessment hanya digunakan untuk keperluan pribadi dan tidak diperkenankan untuk tujuan komersial.",
    ],
  },
];

function renderItems(items, level = 0) {
  const alphabets = "abcdefghijklmnopqrstuvwxyz";
  const textColor = blue;
  return (
    <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: level === 0 ? "0.6rem" : "0.35rem" }}>
      {items.map((item, i) => {
        const prefix = level === 0 ? `${i + 1}.` : `${alphabets[i]}.`;
        const isObj = typeof item === "object" && item.text;
        return (
          <li key={i} style={{ display: "flex", gap: "0.5rem", paddingLeft: level * 16 }}>
            <span style={{ flexShrink: 0, fontSize: "0.75rem", fontWeight: 600, color: textColor, fontFamily: "'Manrope', sans-serif", minWidth: level === 0 ? 18 : 14 }}>
              {prefix}
            </span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "0.75rem", lineHeight: 1.65, color: textColor, fontFamily: "'Manrope', sans-serif", margin: 0 }}>
                {isObj ? item.text : item}
              </p>
              {isObj && item.sub && (
                <div style={{ marginTop: "0.3rem" }}>
                  {renderItems(item.sub, level + 1)}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default function TermsModal({ onAccept, onClose }) {
  const [agreed, setAgreed] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleScroll = (e) => {
    const el = e.currentTarget;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 32;
    if (atBottom) setScrolled(true);
  };

  return (
    <AnimatePresence>
      {/* Full-screen overlay — handles backdrop + flex centering */}
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 60,
          background: "rgba(0,18,37,0.72)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          overflowY: "auto",
        }}
      >
      {/* Modal card — Framer Motion only animates scale/y, no transform conflict */}
      <motion.div
        key="modal"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.32, ease: EASE }}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 600,
          maxHeight: "calc(100svh - 2rem)",
          display: "flex",
          flexDirection: "column",
          background: "white",
          boxShadow: "0 32px 80px rgba(0,18,37,0.32)",
          overflow: "hidden",
          margin: "auto",
        }}
      >
        {/* Orange top bar */}
        <div style={{ height: 3, background: orange, flexShrink: 0 }} />

        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem 1rem",
            borderBottom: `1px solid ${rule}`,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "1rem",
            flexShrink: 0,
          }}
        >
          <div>
            <p style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: orange, fontFamily: "'Manrope', sans-serif", marginBottom: "0.35rem" }}>
              Sebelum memulai
            </p>
            <h2 style={{ fontSize: "clamp(1rem, 2vw, 1.25rem)", fontWeight: 800, color: blue, fontFamily: "'Manrope', sans-serif", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              Syarat dan Ketentuan Berlaku
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              flexShrink: 0,
              width: 32, height: 32,
              border: `1px solid ${rule}`,
              background: "white",
              borderRadius: "50%",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: muted,
              marginTop: 2,
            }}
            aria-label="Tutup"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.25rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          {sections.map((sec) => (
            <div key={sec.label}>
              {/* Section label + title */}
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem", marginBottom: "0.65rem" }}>
                <span style={{
                  fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.18em",
                  textTransform: "uppercase", color: "white",
                  background: blue, padding: "2px 7px",
                  fontFamily: "'Manrope', sans-serif",
                }}>
                  {sec.label}
                </span>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: blue, fontFamily: "'Manrope', sans-serif" }}>
                  {sec.title}
                </span>
              </div>

              {/* Items */}
              {sec.items && renderItems(sec.items)}

              {/* Table (Cakupan Wilayah) */}
              {sec.table && (
                <div style={{ border: `1px solid ${rule}`, overflow: "hidden" }}>
                  {sec.table.map((row, i) => (
                    <div
                      key={i}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "120px 1fr",
                        borderTop: i !== 0 ? `1px solid ${rule}` : "none",
                      }}
                    >
                      <div style={{ padding: "0.5rem 0.75rem", background: "rgba(0,61,107,0.04)", borderRight: `1px solid ${rule}` }}>
                        <p style={{ fontSize: "0.72rem", fontWeight: 700, color: blue, fontFamily: "'Manrope', sans-serif", margin: 0 }}>{row.area}</p>
                      </div>
                      <div style={{ padding: "0.5rem 0.75rem" }}>
                        <p style={{ fontSize: "0.72rem", lineHeight: 1.6, color: blue, fontFamily: "'Manrope', sans-serif", margin: 0 }}>{row.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Scroll hint */}
          {!scrolled && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              style={{ textAlign: "center", paddingBottom: "0.25rem" }}
            >
              <p style={{ fontSize: "0.65rem", color: muted, fontFamily: "'Manrope', sans-serif" }}>
                ↓ Gulir untuk membaca seluruh ketentuan
              </p>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "1rem 1.5rem 1.25rem",
            borderTop: `1px solid ${rule}`,
            background: "rgba(0,61,107,0.02)",
            flexShrink: 0,
          }}
        >
          {/* Checkbox */}
          <label
            style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", cursor: "pointer", marginBottom: "1rem" }}
          >
            <div
              onClick={() => setAgreed((a) => !a)}
              style={{
                flexShrink: 0,
                width: 18, height: 18,
                border: `1.5px solid ${agreed ? orange : rule}`,
                background: agreed ? orange : "white",
                borderRadius: 3,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginTop: 1,
                transition: "all 0.2s ease",
                cursor: "pointer",
              }}
            >
              {agreed && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span
              onClick={() => setAgreed((a) => !a)}
              style={{ fontSize: "0.78rem", lineHeight: 1.6, color: blue, fontFamily: "'Manrope', sans-serif", userSelect: "none" }}
            >
              Saya memahami dan menyetujui syarat dan ketentuan yang berlaku
            </span>
          </label>

          {/* CTA button */}
          <motion.button
            type="button"
            onClick={() => { if (agreed) onAccept(); }}
            disabled={!agreed}
            whileHover={agreed ? { scale: 1.018 } : {}}
            whileTap={agreed ? { scale: 0.975 } : {}}
            transition={{ duration: 0.2, ease: EASE }}
            style={{
              width: "100%",
              height: 48,
              background: agreed ? orange : "rgba(0,61,107,0.08)",
              border: "none",
              borderRadius: 9999,
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "'Manrope', sans-serif",
              color: agreed ? "white" : muted,
              cursor: agreed ? "pointer" : "not-allowed",
              transition: "background 0.25s ease, color 0.25s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.625rem",
            }}
          >
            Mulai Pre-Assessment
            <motion.span
              animate={{ x: agreed ? 0 : -4, opacity: agreed ? 1 : 0.3 }}
              transition={{ duration: 0.25 }}
              style={{ display: "flex", alignItems: "center" }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.span>
          </motion.button>
        </div>
      </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
