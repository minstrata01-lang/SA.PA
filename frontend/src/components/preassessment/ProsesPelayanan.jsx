import { useState } from "react";
import { motion } from "framer-motion";
import { blue, orange, muted, rule, EASE, fadeUp } from "./tokens";

const steps = [
  {
    num: "01",
    title: "Pemesanan",
    desc: "Isi formulir singkat dan konfirmasi pembayaran. Proses Anda dimulai dalam hitungan jam.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "Diskusi Awal",
    desc: "Tim kami akan menghubungi Anda, memahami kondisi lapangan, dan menetapkan arah konsultasi yang tepat.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 4h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H7l-4 3V5a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M7 8h6M7 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Konsultasi Ahli",
    desc: "Pemeriksaan menyeluruh bersama para ahli berpengalaman dengan berbasis data, foto, video, atau tinjauan langsung.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="7.5" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="13.5" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2 16c0-2.761 2.462-5 5.5-5s5.5 2.239 5.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M13.5 11c1.657 0 3 1.343 3 3v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    num: "04",
    title: "Temuan & Rekomendasi",
    desc: "Presentasi temuan teknis disertai rekomendasi solusi terukur yang siap untuk ditindaklanjuti.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 14l4-4 3 3 4-5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    num: "05",
    title: "Laporan Final",
    desc: "Dokumen teknis lengkap sesuai dengan standar dan peraturan yang berlaku, siap menjadi panduan penanganan bangunan Anda.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

function StepCard({ num, title, desc, icon, index, isLast }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      className="relative flex flex-col"
      {...fadeUp(index * 0.09)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Number badge + connector line */}
      <div className="flex items-center mb-5">
        <motion.div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            border: `2px solid ${hovered ? orange : "rgba(0,61,107,0.2)"}`,
            background: hovered ? orange : "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            zIndex: 1,
            position: "relative",
            boxShadow: hovered ? `0 0 0 6px rgba(217,119,6,0.12)` : "none",
            transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          <span
            style={{
              fontSize: "0.68rem",
              fontWeight: 800,
              letterSpacing: "0.1em",
              color: hovered ? "white" : blue,
              fontFamily: "'Manrope', sans-serif",
              transition: "color 0.3s",
            }}
          >
            {num}
          </span>
        </motion.div>

        {!isLast && (
          <div
            style={{
              flex: 1,
              height: 1,
              background: `repeating-linear-gradient(to right, ${orange} 0px, ${orange} 5px, transparent 5px, transparent 11px)`,
              opacity: 0.45,
            }}
          />
        )}
      </div>

      {/* Card */}
      <div
        style={{
          flex: 1,
          border: `1px solid ${hovered ? orange : rule}`,
          padding: "1.25rem",
          background: "white",
          boxShadow: hovered ? "0 8px 28px rgba(0,61,107,0.09)" : "0 2px 8px rgba(0,61,107,0.03)",
          transition: "border-color 0.3s, box-shadow 0.3s",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Orange top line on hover */}
        <motion.div
          style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: orange, originX: 0 }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: hovered ? 1 : 0 }}
          transition={{ duration: 0.35, ease: EASE }}
        />

        {/* Icon */}
        <motion.div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "0.875rem",
            color: hovered ? orange : blue,
            transition: "color 0.3s",
          }}
          animate={{
            background: hovered ? "rgba(217,119,6,0.1)" : "rgba(0,61,107,0.05)",
          }}
          transition={{ duration: 0.3 }}
        >
          {icon}
        </motion.div>

        <h3
          style={{
            fontSize: "0.88rem",
            fontWeight: 700,
            color: blue,
            fontFamily: "'Manrope', sans-serif",
            lineHeight: 1.4,
            marginBottom: "0.5rem",
          }}
        >
          {title}
        </h3>

        <div className="flex items-center gap-2 mb-3">
          <div style={{ height: 1, width: 20, background: orange }} />
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(0,61,107,0.15)" }} />
        </div>

        <p
          style={{
            fontSize: "0.75rem",
            lineHeight: 1.68,
            color: muted,
            fontFamily: "'Manrope', sans-serif",
          }}
        >
          {desc}
        </p>
      </div>
    </motion.div>
  );
}

export default function ProsesPelayanan() {
  return (
    <div style={{ background: "#F4F7FA", padding: "3.5rem 0" }}>
      <div className="px-4 sm:px-6 md:px-8" style={{ maxWidth: 1120, margin: "0 auto" }}>

        {/* Section header */}
        <motion.div
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <div>
            <p
              className="text-[11px] font-bold tracking-[0.26em] uppercase mb-4"
              style={{ color: orange, fontFamily: "'Manrope', sans-serif" }}
            >
              Proses Kami
            </p>
            <h2
              className="font-bold-hero leading-[1.08] tracking-[-0.03em]"
              style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.4rem)", color: blue }}
            >
              Lima langkah.{" "}
              <span style={{ color: orange }}>Satu tujuan</span>
              <br />— solusi yang tepat.
            </h2>
          </div>
          <p
            className="max-w-xs text-sm leading-relaxed pb-1"
            style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}
          >
            Setiap langkah dirancang dengan presisi dari pemesanan pertama hingga laporan akhir yang dapat Anda pegang.
          </p>
        </motion.div>

        {/* Desktop: 5-column flow */}
        <div className="hidden lg:grid grid-cols-5 gap-5">
          {steps.map((step, i) => (
            <StepCard key={step.num} {...step} index={i} isLast={i === steps.length - 1} />
          ))}
        </div>

        {/* Mobile: vertical timeline */}
        <div className="flex flex-col gap-0 lg:hidden">
          {steps.map((step, i) => {
            const isLast = i === steps.length - 1;
            return (
              <motion.div
                key={step.num}
                className="relative flex gap-5 pb-8"
                {...fadeUp(i * 0.08)}
              >
                {/* Vertical connector */}
                <div className="flex flex-col items-center shrink-0">
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      border: `2px solid rgba(0,61,107,0.2)`,
                      background: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: "0.65rem", fontWeight: 800, color: blue, fontFamily: "'Manrope', sans-serif" }}>
                      {step.num}
                    </span>
                  </div>
                  {!isLast && (
                    <div
                      style={{
                        flex: 1,
                        width: 1,
                        marginTop: 8,
                        background: `repeating-linear-gradient(to bottom, ${orange} 0px, ${orange} 5px, transparent 5px, transparent 11px)`,
                        opacity: 0.4,
                      }}
                    />
                  )}
                </div>

                {/* Content */}
                <div
                  style={{
                    flex: 1,
                    border: `1px solid ${rule}`,
                    padding: "1.125rem",
                    background: "white",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: "rgba(0,61,107,0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "0.75rem",
                      color: blue,
                    }}
                  >
                    {step.icon}
                  </div>
                  <h3 style={{ fontSize: "0.88rem", fontWeight: 700, color: blue, fontFamily: "'Manrope', sans-serif", marginBottom: "0.4rem" }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: "0.75rem", lineHeight: 1.65, color: muted, fontFamily: "'Manrope', sans-serif" }}>
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
