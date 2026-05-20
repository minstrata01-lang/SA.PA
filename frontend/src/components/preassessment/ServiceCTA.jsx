import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { orange, muted, EASE, fadeUp } from "./tokens";

export default function ServiceCTA() {
  return (
    <motion.div className="flex flex-col items-center text-center gap-5" {...fadeUp(0.1)}>
      <p
        className="text-[11px] font-bold tracking-[0.26em] uppercase"
        style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}
      >
        Siap memulai?
      </p>
      <motion.div whileHover={{ scale: 1.025 }} whileTap={{ scale: 0.968 }} transition={{ duration: 0.22, ease: EASE }}>
        <Link
          to="/preassessment"
          className="rounded-full font-semibold text-white relative overflow-hidden"
          style={{
            height: 46,
            background: orange,
            fontSize: 14,
            fontFamily: "'Manrope', sans-serif",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            maxWidth: 420,
            minWidth: 280,
            textDecoration: "none",
            padding: "0 1.5rem",
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
      <p className="text-xs" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
        S&K berlaku · Baca sebelum memulai
      </p>
    </motion.div>
  );
}
