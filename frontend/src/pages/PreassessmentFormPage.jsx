import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ConsultationForm from "../components/preassessment/ConsultationForm";
import { blue, muted, rule, EASE } from "../components/preassessment/tokens";

export default function PreassessmentFormPage() {
  const navigate = useNavigate();

  return (
    <section className="bg-white pt-28 pb-14 px-4 sm:px-6 md:px-8">
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <motion.button
          type="button"
          onClick={() => navigate("/preassessment")}
          className="flex items-center gap-2 mb-8 text-sm font-semibold"
          style={{ color: muted, fontFamily: "'Manrope', sans-serif", background: "none", border: "none", cursor: "pointer" }}
          whileHover={{ x: -3 }}
          transition={{ duration: 0.2 }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Kembali
        </motion.button>
        <p className="text-[11px] font-bold tracking-[0.26em] uppercase mb-5" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
          Pre-Assessment
        </p>
        <h1
          className="font-bold-hero leading-[1.08] tracking-[-0.03em] mb-3"
          style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: blue }}
        >
          Isi Data Konsultasi
        </h1>
        <div className="h-px mb-10" style={{ background: rule }} />
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <ConsultationForm onBackToIntro={() => navigate("/preassessment")} />
        </motion.div>
      </div>
    </section>
  );
}
