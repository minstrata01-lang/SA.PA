import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const blue    = "#003D6B";
const orange  = "#D97706";
const muted   = "rgba(0,61,107,0.5)";
const rule    = "rgba(0,61,107,0.1)";
const darkNav = "#001225";
const EASE    = [0.22, 1, 0.36, 1];

const fadeUp = (delay = 0) => ({
  initial:     { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport:    { once: true, amount: 0.15 },
  transition:  { duration: 0.65, ease: EASE, delay },
});

const assessFeatures = [
  { cat: "Evaluasi",    items: ["Pemeriksaan visual & struktural menyeluruh", "Penilaian kondisi pondasi dan beban", "Analisis material bangunan eksisting"] },
  { cat: "Pengujian",   items: ["Pengujian kekuatan material (SNI)", "Pengujian kapasitas struktur", "Pemodelan kondisi aktual"] },
  { cat: "Dokumentasi", items: ["Dokumentasi teknis lengkap & terstruktur", "Laporan formal sesuai standar dan peraturan yang berlaku", "Foto & data lapangan terarsip"] },
  { cat: "Rekomendasi", items: ["Rekomendasi perbaikan terperinci & bertahap", "Estimasi biaya penanganan", "Pendampingan oleh ahli bersertifikat"] },
];

const compareItems = [
  { label: "Evaluasi kondisi umum",           pre: true,  assess: true  },
  { label: "Identifikasi kerusakan visual",    pre: true,  assess: true  },
  { label: "Laporan ringkas",                  pre: true,  assess: true  },
  { label: "Konsultasi via WhatsApp",          pre: true,  assess: true  },
  { label: "Pemeriksaan detail & mendalam",    pre: false, assess: true  },
  { label: "Pengujian material & struktur",    pre: false, assess: true  },
  { label: "Laporan formal sesuai standar dan peraturan yang berlaku",    pre: false, assess: true  },
  { label: "Pendampingan ahli bersertifikat", pre: false, assess: true },
];

const tierData = [
  {
    id: "basic",
    name: "Basic",
    tag_label: "Basic",
    description: "Permasalahan pada bangunan dengan tingkat kerusakan tingan dan belum mempengaruhi keseluruhan sttruktur",
    price: null,
    features: [
      "Analisis sederhanan terhadap kondisi bangunan",
      "Mengidentifikasi indikasi penyebab",
      "Penilaian kondisi struktur bagunan terbatas",
      "Pemodelan dengan software hanya pada bagian struktur yang mengalami kerusakan",
      "Rekomendasi penanganan awal yang dapat dilakukan",
    ],
    is_featured: false,
  },
  {
    id: "intermediate",
    name: "Intermediate",
    tag_label: "Popular",
    description: "Permasalahan dengan tingkat kerusakan yang melibatkan beberapa elemen struktur yang saling berkaitan",
    price: null,
    features: [
      "Analisis lebih lanjut terhadap kondisi bangunan",
      "Penentuan penyebab utama permasalahan",
      "Penilaian kondisi struktur bagunan lebih menyeluruh baik dari sisi kekuatan dan kestabilan",
      "Pemodelan dengan pada bagian struktur yang saling berkaitan",
      "Perhitungan teknis dasar untuk memahami perilaku struktur",
      "Rekomendasi penanganan yang tepat dan terarah",
    ],
    is_featured: true,
  },
  {
    id: "advance",
    name: "Advance",
    tag_label: "Premium",
    description: "Permasalahan dengan tingkat kerusakan serius dan berdampak pada kestabilan bangunan secara keseluruhan",
    price: null,
    features: [
      "Analisis mendalam terhadap kondisi bangunan",
      "Penilaian menyeluruh terhadapa struktur bangunan termasuk pada bagian fondasi",
      "Pemodelan dengan software pada struktur secara detail dan menyeluruh",
      "Perhituungan teknis lanjutan untuk memastikan keamanan struktur",
      "Kajian risiko dan portensi kegagalan",
      "Perbandingan beberapa metode penanganan",
      "Memperkirakan umur dan kinerja bangunan ke depan (Remaining Life Assessment)",
      "Rekomendasi solusi secara menyeluruh",
    ],
    is_featured: false,
  },
];

function CheckIcon({ active }) {
  if (!active) return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3 7h8" stroke="rgba(0,61,107,0.25)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2.5 7l3 3 6-6" stroke={orange} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Pricing() {
  const [hoveredRow, setHoveredRow] = useState(null);

  const preAssessmentPrice  = "Rp 500.000";
  const assessmentBasePrice = "Rp 5.700.000";

  return (
    <div className="bg-white overflow-x-hidden">

      {/* ── Hero ── */}
      <section className="pt-28 pb-0 px-4 sm:px-6 md:px-8">
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
          >
            <div className="flex items-center gap-4 mb-6">
              <Link
                to="/layanan"
                className="flex items-center gap-2 text-sm font-semibold"
                style={{ color: muted, fontFamily: "'Manrope', sans-serif", textDecoration: "none" }}
              >
                <motion.span whileHover={{ x: -3 }} transition={{ duration: 0.2 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.span>
                Kembali ke Layanan
              </Link>
            </div>

            <p className="text-[11px] font-bold tracking-[0.28em] uppercase mb-5" style={{ color: orange, fontFamily: "'Manrope', sans-serif" }}>
              Layanan Lanjutan
            </p>
            <h1
              className="font-bold-hero leading-[1.06] tracking-[-0.03em]"
              style={{ fontSize: "clamp(2.4rem, 5vw, 4.2rem)", color: blue }}
            >
              Assessment<br />
              <span style={{ color: orange }}>Mendalam.</span>
            </h1>
          </motion.div>

          {/* Rule */}
          <motion.div
            className="mt-8 h-px"
            style={{ background: rule }}
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.3 }}
          />

          {/* Price + intro row */}
          <motion.div
            className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start"
            {...fadeUp(0.2)}
          >
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-2" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
                Investasi
              </p>
              
              <p className="text-sm" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
                Mulai dari
              </p>
              <p
                className="font-bold-hero tracking-[-0.03em] leading-none mb-2"
                style={{ fontSize: "clamp(2.4rem, 5vw, 3.6rem)", color: blue }}
              >
                {assessmentBasePrice}
              </p>
              <p className="text-sm" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
                Sesuai lingkup pekerjaan
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <a
                  href="https://wa.me/628118850500"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full font-semibold"
                  style={{
                    height: 50,
                    paddingLeft: 24,
                    paddingRight: 24,
                    border: `1px solid ${rule}`,
                    background: "white",
                    color: blue,
                    fontSize: 14,
                    fontFamily: "'Manrope', sans-serif",
                    textDecoration: "none",
                    width: "fit-content",
                  }}
                >
                  Konsultasi Dulu
                </a>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <p className="text-base leading-relaxed" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
                Assessment adalah layanan pemeriksaan teknis menyeluruh untuk bangunan yang membutuhkan analisis mendalam — melampaui evaluasi visual dengan pengujian material dan pemodelan struktural.
              </p>
              <div className="flex flex-col gap-3">
                {["Laporan formal sesuai standar dan peraturan yang berlaku", "Didukung ahli bersertifikat", "Pengujian material terverifikasi"].map((tag, i) => (
                  <motion.div key={i} className="flex items-center gap-3" {...fadeUp(0.3 + i * 0.07)}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: orange, flexShrink: 0 }} />
                    <span className="text-sm font-semibold" style={{ color: blue, fontFamily: "'Manrope', sans-serif" }}>{tag}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Features Grid (dark) ── */}
      <section className="mt-14" style={{ background: darkNav }}>
        <div className="px-4 sm:px-6 md:px-8 py-12" style={{ maxWidth: 1120, margin: "0 auto" }}>
          <motion.div className="flex items-center gap-4 mb-12" {...fadeUp(0)}>
            <div style={{ width: 24, height: 1, background: orange }} />
            <p className="text-[11px] font-bold tracking-[0.26em] uppercase" style={{ color: orange, fontFamily: "'Manrope', sans-serif" }}>
              Yang Anda Dapatkan
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: "rgba(255,255,255,0.08)" }}>
            {assessFeatures.map((group, gi) => (
              <motion.div
                key={gi}
                className="flex flex-col gap-5 p-6"
                style={{ background: darkNav }}
                {...fadeUp(gi * 0.1)}
              >
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: orange, fontFamily: "'Manrope', sans-serif" }}>
                  {group.cat}
                </p>
                <div className="h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
                <ul className="flex flex-col gap-4">
                  {group.items.map((item, ii) => (
                    <li key={ii} className="flex items-start gap-3">
                      <div style={{ width: 4, height: 4, borderRadius: "50%", background: orange, flexShrink: 0, marginTop: 7 }} />
                      <span style={{ fontSize: "0.82rem", lineHeight: 1.6, color: "rgba(255,255,255,0.7)", fontFamily: "'Manrope', sans-serif" }}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tier Levels ── */}
      <section style={{ background: "#F4F7FA" }}>
        <div className="px-4 sm:px-6 md:px-8 py-14" style={{ maxWidth: 1120, margin: "0 auto" }}>

          {/* Header */}
          <motion.div className="mb-8" {...fadeUp(0)}>
            <div className="flex items-center gap-4 mb-5">
              <div style={{ width: 24, height: 1, background: orange }} />
              <p className="text-[11px] font-bold tracking-[0.26em] uppercase" style={{ color: orange, fontFamily: "'Manrope', sans-serif" }}>
                Lingkup Assessment
              </p>
            </div>
            <h2 className="font-bold-hero leading-[1.08] tracking-[-0.03em]" style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.4rem)", color: blue }}>
              Disesuaikan dengan{" "}
              <span style={{ color: orange }}>tingkat kerusakan.</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed max-w-lg" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
              Berdasarkan hasil Pre-Assessment, kami menentukan kedalaman analisis yang paling sesuai untuk kondisi bangunan Anda.
            </p>
          </motion.div>

          {/* 3-column tier grid */}
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ border: `1px solid ${rule}` }}>
            {tierData.map((tier, i) => (
              <motion.div
                key={tier.id}
                className="flex flex-col p-7 relative overflow-hidden"
                style={{
                  background: tier.is_featured ? darkNav : "white",
                  borderRight: i < 2 ? `1px solid ${rule}` : "none",
                  borderBottom: "none",
                }}
                {...fadeUp(i * 0.1)}
              >
                {/* Orange top bar for featured */}
                {tier.is_featured && (
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: orange }} />
                )}

                {/* Tag */}
                <span
                  className="self-start text-[9px] font-bold tracking-[0.18em] uppercase mb-5 px-2.5 py-1"
                  style={{
                    background: tier.is_featured ? "rgba(217,119,6,0.18)" : "rgba(0,61,107,0.06)",
                    color: tier.is_featured ? orange : muted,
                    fontFamily: "'Manrope', sans-serif",
                  }}
                >
                  {tier.tag_label}
                </span>

                {/* Title */}
                <h3
                  className="font-bold-hero leading-none tracking-[-0.02em] mb-3"
                  style={{ fontSize: "clamp(1.5rem, 2.2vw, 2rem)", color: tier.is_featured ? "white" : blue }}
                >
                  {tier.name}
                </h3>

                {/* Separator */}
                <div className="flex items-center gap-2 mb-4">
                  <div style={{ height: 1, width: 20, background: orange }} />
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: tier.is_featured ? "rgba(255,255,255,0.15)" : "rgba(0,61,107,0.12)" }} />
                </div>

                {/* Description */}
                <p className="text-sm leading-relaxed mb-6" style={{ color: tier.is_featured ? "rgba(255,255,255,0.55)" : muted, fontFamily: "'Manrope', sans-serif" }}>
                  {tier.description}
                </p>

                {/* Feature list */}
                <ul className="flex flex-col gap-3 mt-0">
                  {(tier.features || []).map((item, ii) => (
                    <li key={ii} className="flex items-start gap-3">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                        <path d="M2.5 7l3 3 6-6" stroke={orange} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span style={{ fontSize: "0.8rem", lineHeight: 1.6, color: tier.is_featured ? "rgba(255,255,255,0.7)" : blue, fontFamily: "'Manrope', sans-serif" }}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <motion.p className="mt-6 text-xs text-center" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }} {...fadeUp(0.3)}>
            * Lingkup Assessment ditentukan berdasarkan hasil Pre-Assessment · Harga mulai dari Rp 5.700.000
          </motion.p>

        </div>
      </section>

      {/* ── Comparison Table ── */}
      <section className="px-4 sm:px-6 md:px-8 py-14">
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <motion.div className="mb-8" {...fadeUp(0)}>
            <p className="text-[11px] font-bold tracking-[0.26em] uppercase mb-4" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
              Perbandingan Layanan
            </p>
            <h2 className="font-bold-hero leading-[1.08] tracking-[-0.03em]" style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.4rem)", color: blue }}>
              Pre-Assessment vs.{" "}
              <span style={{ color: orange }}>Assessment</span>
            </h2>
          </motion.div>

          {/* Table header */}
          <div className="hidden sm:grid grid-cols-3 gap-0 mb-2">
            <div />
            {["Pre-Assessment", "Assessment"].map((label, i) => (
              <div key={label} className="px-6 pb-3 text-center">
                <span
                  className="text-[11px] font-bold tracking-[0.2em] uppercase"
                  style={{ color: i === 1 ? orange : muted, fontFamily: "'Manrope', sans-serif" }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          <div className="h-px mb-0" style={{ background: rule }} />

          {/* Table rows */}
          <div className="flex flex-col">
            {compareItems.map((row, i) => (
              <motion.div
                key={i}
                className="grid grid-cols-1 sm:grid-cols-3 items-center py-4 px-0 sm:px-0 cursor-default"
                style={{
                  borderBottom: `1px solid ${rule}`,
                  background: hoveredRow === i ? "rgba(0,61,107,0.025)" : "transparent",
                  transition: "background 0.2s",
                }}
                onMouseEnter={() => setHoveredRow(i)}
                onMouseLeave={() => setHoveredRow(null)}
                {...fadeUp(i * 0.04)}
              >
                <span className="text-sm font-medium mb-1 sm:mb-0" style={{ color: blue, fontFamily: "'Manrope', sans-serif" }}>
                  {row.label}
                </span>
                <div className="hidden sm:flex justify-center">
                  <CheckIcon active={row.pre} />
                </div>
                <div className="hidden sm:flex justify-center">
                  <CheckIcon active={row.assess} />
                </div>
                {/* Mobile inline */}
                <div className="flex sm:hidden gap-6 mt-1">
                  <span className="text-xs flex items-center gap-1.5" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
                    <CheckIcon active={row.pre} /> Pre
                  </span>
                  <span className="text-xs flex items-center gap-1.5" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
                    <CheckIcon active={row.assess} /> Assessment
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section style={{ background: "#F4F7FA" }}>
        <div className="px-4 sm:px-6 md:px-8 py-14" style={{ maxWidth: 1120, margin: "0 auto" }}>
          <motion.div
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-8"
            {...fadeUp(0)}
          >
            <div>
              <p className="text-[11px] font-bold tracking-[0.26em] uppercase mb-4" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
                Siap untuk melangkah lebih jauh?
              </p>
              <h2 className="font-bold-hero leading-[1.08] tracking-[-0.03em]" style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.4rem)", color: blue }}>
                Mulai dengan{" "}
                <span style={{ color: orange }}>Pre-Assessment</span>
                <br />terlebih dahulu.
              </h2>
              <p className="text-sm leading-relaxed mt-4 max-w-md" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
                Tidak yakin perlu Assessment atau cukup Pre-Assessment? Mulai dari Pre-Assessment — lebih terjangkau, lebih cepat, dan memberi gambaran awal yang jelas.
              </p>
            </div>

            <div className="flex flex-col gap-4 pb-1">
              <a
                href="/layanan"
                className="inline-flex items-center gap-3 rounded-full font-semibold text-white"
                style={{
                  height: 54,
                  paddingLeft: 26,
                  paddingRight: 16,
                  background: orange,
                  fontSize: 15,
                  fontFamily: "'Manrope', sans-serif",
                  textDecoration: "none",
                  width: "fit-content",
                  whiteSpace: "nowrap",
                }}
              >
                Coba Pre-Assessment — {preAssessmentPrice}
                <span style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.3)", flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </a>
              <p className="text-xs" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
                Data aman &amp; terjaga · Proses cepat · Konsultan berpengalaman
              </p>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
