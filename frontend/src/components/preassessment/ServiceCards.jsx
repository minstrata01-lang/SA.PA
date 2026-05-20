import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { blue, orange, muted, rule, EASE, fadeUp } from "./tokens";

const preFeatures = [
  "Evaluasi kondisi umum bangunan",
  "Identifikasi kerusakan visual & struktural",
  "Rekomendasi tindak lanjut awal",
  "Estimasi risiko kerusakan",
  "Laporan ringkas hasil survei",
  "Konsultasi via grup WhatsApp",
  "Respon cepat oleh tim ahli",
];

const assessFeatures = [
  "Semua fitur Pre-Assessment",
  "Pemeriksaan detail & mendalam",
  "Pengujian material & struktur",
  "Analisis beban & kapasitas",
  "Dokumentasi teknis lengkap",
  "Laporan formal seuai dengan standar dan peraturan yang berlaku",
  "Rekomendasi perbaikan terperinci",
  "Pendampingan oleh ahli bersertifikat",
];

function FeatureList({ items, accent }) {
  return (
    <ul className="flex flex-col gap-3 mb-6">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="shrink-0 mt-0.5 text-xs font-bold" style={{ color: accent }}>✓</span>
          <span className="text-sm leading-snug" style={{ color: blue, fontFamily: "'Manrope', sans-serif" }}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function ServiceCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">

      {/* Pre-Assessment — highlighted */}
      <motion.div className="flex flex-col" style={{ border: `1px solid ${orange}`, overflow: "hidden" }} {...fadeUp(0)}>
        <div style={{ height: 3, background: orange }} />
        <div className="flex flex-col flex-1 px-7 pt-6 pb-7">
          <span
            className="self-start text-[10px] font-bold tracking-[0.16em] uppercase mb-5 px-3 py-1"
            style={{ background: orange, color: "white", fontFamily: "'Manrope', sans-serif" }}
          >
            Paling Direkomendasikan
          </span>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>Layanan</p>
          <h3
            className="font-bold-hero leading-[1.1] tracking-[-0.02em] mb-6"
            style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)", color: blue }}
          >
            Pre-Assessment
          </h3>
          <FeatureList items={preFeatures} accent={orange} />
          <div className="mt-auto">
            <div className="h-px mb-5" style={{ background: rule }} />
            <p className="text-[10px] font-bold tracking-[0.16em] uppercase mb-1" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>Mulai dari</p>
            <p className="font-bold-hero tracking-[-0.02em] mb-6" style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", color: blue }}>Rp 500.000</p>

            <motion.div whileHover={{ scale: 1.025 }} whileTap={{ scale: 0.968 }} transition={{ duration: 0.22, ease: EASE }}>
              <Link
                to="/preassessment"
                className="w-full rounded-full font-semibold text-white relative overflow-hidden"
                style={{
                  height: 46,
                  background: orange,
                  border: "none",
                  fontSize: 14,
                  fontFamily: "'Manrope', sans-serif",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  textDecoration: "none",
                }}
              >
                <motion.span
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.18) 50%, transparent 65%)",
                    backgroundSize: "200% 100%",
                  }}
                  initial={{ backgroundPosition: "200% center" }}
                  whileHover={{ backgroundPosition: "-200% center" }}
                  transition={{ duration: 0.7, ease: "easeInOut" }}
                />
                <span style={{ position: "relative", zIndex: 1 }}>Mulai Pre-Assessment Sekarang</span>
                <motion.span
                  style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center" }}
                  whileHover={{ x: 3 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.span>
              </Link>
            </motion.div>

            <p className="text-[11px] mt-3 text-center" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
              S&amp;K berlaku · Baca sebelum memulai
            </p>
          </div>
        </div>
      </motion.div>

      {/* Assessment — plain */}
      <motion.div className="flex flex-col" style={{ border: `1px solid ${rule}` }} {...fadeUp(0.08)}>
        <div style={{ height: 3, background: rule }} />
        <div className="flex flex-col flex-1 px-7 pt-6 pb-7">
          <span
            className="self-start text-[10px] font-bold tracking-[0.16em] uppercase mb-5 px-3 py-1"
            style={{ border: `1px solid ${rule}`, color: muted, fontFamily: "'Manrope', sans-serif" }}
          >
            Layanan Lanjutan
          </span>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>Layanan</p>
          <h3
            className="font-bold-hero leading-[1.1] tracking-[-0.02em] mb-6"
            style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)", color: blue }}
          >
            Assessment
          </h3>
          <FeatureList items={assessFeatures} accent={muted} />
          <div className="mt-auto">
            <div className="h-px mb-5" style={{ background: rule }} />
            <p className="text-[10px] font-bold tracking-[0.16em] uppercase mb-1" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>Mulai dari</p>
            <p className="font-bold-hero tracking-[-0.02em] mb-6" style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", color: blue }}>Rp 5.700.000</p>
            <motion.a
              href="/pricing"
              whileHover={{ scale: 1.018 }}
              whileTap={{ scale: 0.975 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="w-full flex items-center justify-center rounded-full font-semibold"
              style={{ height: 46, border: `1px solid ${rule}`, background: "white", color: blue, fontSize: 14, fontFamily: "'Manrope', sans-serif", textDecoration: "none" }}
            >
              Pelajari Lebih Lanjut
            </motion.a>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
