import { motion } from "framer-motion";
import { blue, orange, muted, EASE } from "./tokens";
import alurPelayananImage from "../../assets/preassesmentImage/img alur pelayanan.png";

export default function AlurPelayanan() {
  return (
    <section style={{ background: "#ffffff", padding: "3.5rem 0" }}>
      <div className="px-4 sm:px-6 md:px-8" style={{ maxWidth: 1320, margin: "0 auto" }} >
        <motion.div
          className="flex flex-col items-center text-center gap-5 mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <p
            className="text-[11px] font-bold tracking-[0.26em] uppercase"
            style={{ color: orange, fontFamily: "'Manrope', sans-serif" }}
          >
            Alur Pelayanan
          </p>
          <h2
            className="font-bold-hero leading-[1.08] tracking-[-0.03em]"
            style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.4rem)", color: blue }}
          >
            Dari pertanyaan pertama<br />
            <span style={{ color: orange }}>hingga laporan akhir.</span>
          </h2>
          <p
            className="max-w-2xl text-sm leading-relaxed"
            style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}
          >
            Setiap tahap dirancang untuk memberi Anda kejelasan dan keyakinan penuh sebelum mengambil tindakan terhadap bangunan Anda.
          </p>
        </motion.div>

        <motion.div
          className="w-full flex justify-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.05 }}
        >
          <img
            src={alurPelayananImage}
            alt="Alur pelayanan pre-assessment"
            className="w-full"
            style={{ maxWidth: 1320, height: "auto" }}
          />
        </motion.div>
      </div>
    </section>
  );
}
