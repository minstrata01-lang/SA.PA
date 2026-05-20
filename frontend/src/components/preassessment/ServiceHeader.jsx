import { motion } from "framer-motion";
import { blue, orange, muted, rule, EASE } from "./tokens";

export default function ServiceHeader() {
  return (
    <motion.div
      className="flex flex-col md:flex-row md:items-end md:justify-between gap-8"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE }}
    >
      <div className="max-w-lg">
        <h1
          className="font-bold-hero leading-[1.08] tracking-[-0.03em]"
          style={{ fontSize: "clamp(2rem, 3.5vw, 3.2rem)", color: blue }}
        >
          <span style={{ color: orange }}>Layanan</span> Kami.
        </h1>
        <p
          className="text-base leading-relaxed max-w-sm pb-1 mt-4"
          style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}
        >
          Mulai dari langkah yang tepat sebelum menentukan penanganan
        </p>
      </div>

      <div className="flex flex-col gap-2 md:text-right pb-1">
        <p className="text-xs" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
          Didukung tenaga ahli bersertifikat
        </p>
        <div className="flex md:justify-end items-center gap-3">
          {["Data aman", "Respon cepat", "Sesuai Standar dan Peraturan yang Berlaku"].map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-bold tracking-[0.12em] uppercase px-2 py-1"
              style={{ border: `1px solid ${rule}`, color: muted, fontFamily: "'Manrope', sans-serif" }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
