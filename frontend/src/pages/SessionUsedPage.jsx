import { motion } from "framer-motion";

function SessionUsedPage() {
  const adminWaLink = `https://wa.me/${import.meta.env.VITE_ADMIN_WA_NUMBER}`;

  return (
    <section className="relative w-full overflow-hidden bg-linear-to-b from-[#F3F7FB] via-white to-[#F6FAFF] pt-20 pb-10 sm:pt-24 sm:pb-12 lg:pt-28 lg:pb-14 page-fade-in">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(rgba(0,61,107,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,61,107,0.05) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 font-[Inter,Montserrat,sans-serif] text-[#003D6B]">
        <motion.div
          className="rounded-4xl border border-[#003D6B]/15 bg-white/95 p-6 sm:p-8 lg:p-10 shadow-[0_20px_55px_rgba(0,61,107,0.14)] backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <div className="text-4xl sm:text-5xl">⚠️</div>

          <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight text-[#003D6B]">
            Link Sudah Digunakan
          </h1>

          <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#003D6B]/80">
            Sesi konsultasi ini sudah pernah diakses. Setiap link hanya bisa digunakan satu kali.
          </p>

          <a
            href={adminWaLink}
            className="mt-7 inline-flex cursor-pointer rounded-xl bg-[#F58220] px-6 py-3 text-base font-bold text-white shadow-[0_12px_26px_rgba(245,130,32,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(245,130,32,0.42)]"
          >
            Hubungi Admin
          </a>
        </motion.div>
      </div>
    </section>
  );
}

export default SessionUsedPage;