import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import BenefitSection  from "../components/preassessment/BenefitSection";
import ProsesPelayanan from "../components/preassessment/ProsesPelayanan";
import TermsModal      from "../components/preassessment/TermsModal";
import { blue, orange, muted, rule, darkNav, EASE } from "../components/preassessment/tokens";
import SEO from "../components/SEO";

/* ── Animation variants ── */
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const itemVariants = {
  hidden:  { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};
const fadeInVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.55, ease: EASE } },
};


export default function PreassessmentPage() {
  const navigate = useNavigate();
  const [showTerms, setShowTerms] = useState(false);

  const handleAcceptTerms = () => {
    setShowTerms(false);
    navigate("/preassessment/form");
  };

  return (
    <>
      <SEO
        title="Pre-Assessment Bangunan"
        description="Kenali kondisi bangunan Anda sebelum terlambat. Pre-assessment oleh tenaga ahli bersertifikat, mencakup identifikasi kerusakan hingga laporan teknis siap pakai. Mulai Rp500.000."
        canonical="/preassessment"
      />
      <div className="bg-white overflow-x-hidden">

        {/* ══════════════════════════════════════════
            HERO
        ══════════════════════════════════════════ */}
        <section className="relative pt-20 sm:pt-24 xl:pt-28 pb-10 xl:pb-14 bg-white overflow-hidden">

          {/* Dot grid texture */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(0,61,107,0.055) 1.5px, transparent 1.5px)",
              backgroundSize: "32px 32px",
            }}
          />
          {/* Bottom fade so grid doesn't bleed into feature strip */}
          <div
            className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
            style={{ background: "linear-gradient(to bottom, transparent, white)" }}
          />

          {/* Decorative: faint orange vertical accent bar (left) */}
          <motion.div
            className="absolute left-0 top-0 bottom-0 w-1"
            style={{ background: `linear-gradient(to bottom, transparent, ${orange}, transparent)`, opacity: 0.25 }}
            initial={{ scaleY: 0, originY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 1.1, ease: EASE, delay: 0.1 }}
          />

          <motion.div
            className="absolute -top-16 -right-16 pointer-events-none"
            style={{
              width: 280,
              height: 280,
              borderRadius: "50%",
              border: `1px solid rgba(217,119,6,0.12)`,
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease: EASE, delay: 0.35 }}
          />

          <div className="px-4 sm:px-6 md:px-8" style={{ maxWidth: 1120, margin: "0 auto" }}>

            {/* Breadcrumb */}
            <motion.div
              className="flex items-center gap-2 mb-7 xl:mb-12"
              variants={fadeInVariants}
              initial="hidden"
              animate="visible"
            >
              <Link
                to="/layanan"
                className="text-[11px] font-bold tracking-[0.18em] uppercase transition-colors duration-200"
                style={{ color: muted, fontFamily: "'Manrope', sans-serif", textDecoration: "none" }}
              >
                Layanan
              </Link>
              <motion.svg
                width="12" height="12" viewBox="0 0 12 12" fill="none"
                style={{ opacity: 0.3 }}
                animate={{ x: [0, 2, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <path d="M4 2l4 4-4 4" stroke={blue} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </motion.svg>
              <span
                className="text-[11px] font-bold tracking-[0.18em] uppercase"
                style={{ color: orange, fontFamily: "'Manrope', sans-serif" }}
              >
                Pre-Assessment
              </span>
            </motion.div>

            {/* Headline + right column — staggered */}
            <motion.div
              className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10 mb-0"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Left: eyebrow + big headline */}
              <div className="flex flex-col">
                <motion.p
                  className="text-[11px] font-bold tracking-[0.28em] uppercase mb-5 flex items-center gap-3"
                  style={{ color: orange, fontFamily: "'Manrope', sans-serif" }}
                  variants={itemVariants}
                >
                  {/* Animated orange dot */}
                  <motion.span
                    style={{
                      display: "inline-block",
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: orange,
                    }}
                    animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  Langkah Pertama yang Tepat
                </motion.p>

                <motion.h1
                  className="font-bold-hero leading-[1.05] tracking-[-0.03em]"
                  style={{ fontSize: "clamp(2rem, 4.2vw, 4.2rem)", color: blue }}
                  variants={itemVariants}
                >
                  Kenali kondisi<br />
                  <motion.span
                    style={{ color: orange, display: "inline-block" }}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, ease: EASE, delay: 0.28 }}
                  >
                    bangunan
                  </motion.span>{" "}Anda<br />
                  sebelum terlambat.
                </motion.h1>

                {/* Info text (below title) */}
                <motion.p
                  className="mt-6 max-w-[34rem] text-sm leading-[1.8]"
                  style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}
                  variants={itemVariants}
                >
                  Evaluasi menyeluruh oleh tenaga ahli bersertifikat dari identifikasi kerusakan hingga laporan teknis siap pakai.
                </motion.p>
              </div>
            </motion.div>

          </div>

        </section>

        {/* ══════════════════════════════════════════
            BENEFITS + PROCESS (external components)
        ══════════════════════════════════════════ */}
        <BenefitSection />
        <ProsesPelayanan />

        {/* ── CTA ── */}
        <section className="relative py-14 sm:py-16 px-4 sm:px-6 md:px-8 overflow-hidden" style={{ background: darkNav }}>

          {/* Large faint background text */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none"
            aria-hidden="true"
          >
            <span
              className="font-bold-hero text-white whitespace-nowrap"
              style={{ fontSize: "clamp(5rem, 16vw, 13rem)", letterSpacing: "-0.05em", opacity: 0.03 }}
            >
              SA.PA
            </span>
          </div>

          {/* Orange radial glow */}
          <div
            className="absolute left-1/2 top-1/2 pointer-events-none"
            style={{
              transform: "translate(-50%, -50%)",
              width: 700,
              height: 320,
              background: "radial-gradient(ellipse, rgba(217,119,6,0.14) 0%, transparent 68%)",
            }}
          />

          <div style={{ maxWidth: 1120, margin: "0 auto", position: "relative" }}>
            <div className="h-px mb-16" style={{ background: "rgba(255,255,255,0.08)" }} />

            <motion.div
              className="flex flex-col items-center text-center gap-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <p
                className="text-[11px] font-bold tracking-[0.26em] uppercase"
                style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Manrope', sans-serif" }}
              >
                Siap memulai?
              </p>

              <h2
                className="font-bold-hero leading-[1.08] tracking-[-0.03em] text-white"
                style={{ fontSize: "clamp(1.7rem, 3.2vw, 2.8rem)" }}
              >
                Mulai perjalanan{" "}
                <span style={{ color: orange }}>perbaikan bangunan</span>
                <br />Anda hari ini.
              </h2>

              {/* Trust checkpoints */}
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
                {["Terpercaya", "Respon dalam 24 jam", "Ahli bersertifikat"].map((pt) => (
                  <div key={pt} className="flex items-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 3" stroke={orange} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Manrope', sans-serif" }}>
                      {pt}
                    </span>
                  </div>
                ))}
              </div>

              <motion.button
                type="button"
                onClick={() => setShowTerms(true)}
                whileHover={{ scale: 1.025 }}
                whileTap={{ scale: 0.968 }}
                transition={{ duration: 0.22, ease: EASE }}
                className="rounded-full font-semibold text-white relative overflow-hidden"
                style={{
                  height: 50,
                  background: orange,
                  border: "none",
                  fontSize: 14,
                  fontFamily: "'Manrope', sans-serif",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  minWidth: 300,
                  padding: "0 2rem",
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
                <span style={{ position: "relative", zIndex: 1 }}>Lanjut ke Formulir Pendaftaran</span>
                <motion.span
                  style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center" }}
                  whileHover={{ x: 3 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.span>
              </motion.button>

              <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)", fontFamily: "'Manrope', sans-serif" }}>
                S&amp;K berlaku · Baca sebelum memulai
              </p>
            </motion.div>
          </div>
        </section>

      </div>

      <AnimatePresence>
        {showTerms && (
          <TermsModal
            onAccept={handleAcceptTerms}
            onClose={() => setShowTerms(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
