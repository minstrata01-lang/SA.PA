import { useState } from "react";
import { motion } from "framer-motion";
import { blue, orange, darkNav, ruleWhite, EASE, fadeUp, white } from "./tokens";
import iconPrecision  from "../../assets/whyUsImage/icon-precision.svg";
import iconStandard   from "../../assets/whyUsImage/icon-standard.svg";
import iconEfficiency from "../../assets/whyUsImage/icon-efficiency.svg";
import iconTeam       from "../../assets/whyUsImage/icon-team.svg";

const cardBg     = "rgba(255,255,255,0.04)";
const cardBorder = "rgba(255,255,255,0.09)";
const cardBorderHover = "rgba(255,255,255,0.18)";

const items = [
  {
    num: "01",
    icon: iconPrecision,
    title: "Identifikasi Kondisi Bangunan secara Terarah",
    body: "Kondisi bangunan diidentifikasi secara tepat berdasarkan data, foto, video, atau peninjauan ke lokasi (jika diperlukan)",
  },
  {
    num: "02",
    icon: iconTeam,
    title: "Konsultasi dengan Tenaga Ahli",
    body: "Konsultasi bersama tenaga ahli berpengalaman, sehingga proses diskusi terarah, tepat, dan akurat (bukan berdasarkan asumsi)",
  },
  {
    num: "03",
    icon: iconPrecision,
    title: "Pengecekan Menyeluruh",
    body: "Setiap bagian penting bangunan diidentifikasi secara detail untuk memastikan tidak ada hal yang terlewat",
  },
  {
    num: "04",
    icon: iconEfficiency,
    title: "Lebih Hemat dalam Jangka Panjang",
    body: "Menghindari kesalahan perbaikan berulang yang dapat meningkatkan biaya di kemudian hari.",
  },
  {
    num: "05",
    icon: iconStandard,
    title: "Laporan Hasil Sesuai Standar Teknis",
    body: "Laporan disusun secara sistematis dan mengacu pada standar teknis yang berlaku, mencakup kondisi bangunan, temuan, prioritas penanganan, serta rekomendasi yang dapat Anda jadikan acuan perbaikan",
  },
  {
    num: "06",
    icon: iconEfficiency,
    title: "Proses Cepat dan Efisien",
    body: "Proses berjalan praktis dan terarah. Hasil yang dapat Anda terima dalam waktu singkat",
  },
];

function BenefitCard({ num, icon, title, body, index }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      className="relative flex flex-col gap-4 p-6 cursor-default overflow-hidden"
      style={{
        background: cardBg,
        border: `1px solid ${hovered ? cardBorderHover : cardBorder}`,
        boxShadow: hovered
          ? "0 12px 32px rgba(0,0,0,0.3)"
          : "0 2px 8px rgba(0,0,0,0.12)",
        transition: "border-color 0.25s ease, box-shadow 0.25s ease",
      }}
      {...fadeUp(index * 0.07)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Orange top accent bar — original style */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ background: orange, originX: 0 }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: hovered ? 1 : 0 }}
        transition={{ duration: 0.35, ease: EASE }}
      />

      {/* Number label + Icon — current style */}
      <div className="flex items-center justify-between">
        <span
          style={{
            fontSize: "0.65rem",
            fontWeight: 700,
            letterSpacing: "0.22em",
            color: "rgba(255,255,255,0.28)",
            fontFamily: "'Manrope', sans-serif",
          }}
        >
          {num}
        </span>
        <motion.div
          className="w-10 h-10 flex items-center justify-center"
          style={{ borderRadius: 10 }}
          animate={{
            background: hovered ? "rgba(217,119,6,0.2)" : "rgba(255,255,255,0.07)",
            scale: hovered ? 1.06 : 1,
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <img
            src={icon}
            alt=""
            className="w-5 h-5"
            style={{
              filter: "brightness(0) invert(1)",
              opacity: hovered ? 1 : 0.55,
              transition: "opacity 0.3s",
            }}
          />
        </motion.div>
      </div>

      {/* Title */}
      <h3
        className="font-bold leading-snug"
        style={{
          fontSize: "0.9rem",
          color: hovered ? "white" : "rgba(255,255,255,0.85)",
          fontFamily: "'Manrope', sans-serif",
          transition: "color 0.25s",
        }}
      >
        {title}
      </h3>

      {/* Orange separator — original style */}
      <div className="flex items-center gap-2">
        <div style={{ height: 1, width: 24, background: orange }} />
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,0.15)" }} />
      </div>

      {/* Body — always visible */}
      <p
        style={{
          fontSize: "0.78rem",
          lineHeight: 1.7,
          color: hovered ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.38)",
          fontFamily: "'Manrope', sans-serif",
          transition: "color 0.25s",
        }}
      >
        {body}
      </p>
    </motion.div>
  );
}

export default function BenefitSection() {
  return (
    <div style={{ background: darkNav }}>

      {/* Section header */}
      <div style={{ borderBottom: `1px solid ${ruleWhite}` }}>
        <motion.div
          className="px-4 sm:px-6 md:px-8 py-6"
          style={{ maxWidth: 1120, margin: "0 auto" }}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <h2
            className="font-bold-hero leading-[1.08] tracking-[-0.03em] whitespace-nowrap"
            style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.4rem)", color: white }}
          >
            Apa Yang Anda <span style={{ color: orange }}>Dapatkan</span>?
          </h2>
        </motion.div>
      </div>

      {/* 3×2 card grid with proper gap and side padding */}
      <div className="px-4 sm:px-6 md:px-8 py-10">
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          style={{ gap: "1.25rem" }}
        >
          {items.map((item, i) => (
            <BenefitCard key={item.num} {...item} index={i} />
          ))}
        </div>
      </div>

    </div>
  );
}
