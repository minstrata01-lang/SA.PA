import { motion } from "framer-motion";

function SessionPendingPage() {
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
          <div className="text-6xl">⏳</div>

          <p className="mt-4 inline-flex rounded-full border border-[#003D6B]/20 bg-[#003D6B]/8 px-3 py-1 text-xs sm:text-sm font-semibold text-[#003D6B]">
            Menunggu Konfirmasi
          </p>

          <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight text-[#003D6B]">
            Konsultan Sedang Disiapkan
          </h1>

          <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#003D6B]/80">
            Admin sedang memproses dan menentukan konsultan terbaik untuk sesi konsultasi kamu. Silakan coba klik link kembali beberapa saat lagi.
          </p>

          <div className="mt-6 rounded-2xl border border-[#003D6B]/15 bg-[#EBF4FF] p-4 text-sm sm:text-base leading-relaxed text-[#003D6B]">
            <p>
              💡 Proses assign konsultan biasanya memakan waktu kurang dari 1 jam pada hari kerja.
            </p>
          </div>

          <div className="mt-5 rounded-2xl border border-[#003D6B]/12 bg-[#F8FBFF] px-4 py-4 sm:px-5">
            <p className="text-sm sm:text-base font-semibold text-[#003D6B]">Tahapan selanjutnya:</p>
            <ul className="mt-3 space-y-2 text-sm sm:text-base leading-relaxed text-[#003D6B]/85">
              <li>⏳ Admin menerima notifikasi pembayaran kamu</li>
              <li>👤 Admin menentukan konsultan yang sesuai</li>
              <li>📱 Klik link konsultasi kembali untuk mulai</li>
            </ul>
          </div>

          <p className="mt-5 text-xs sm:text-sm text-[#003D6B]/60">
            ⚠️ Jangan klik link lebih dari sekali setelah konsultan sudah diassign agar sesi tidak terpakai.
          </p>

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="cursor-pointer rounded-xl bg-[#F58220] px-6 py-3 text-base font-bold text-white shadow-[0_12px_26px_rgba(245,130,32,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(245,130,32,0.42)]"
            >
              Coba Lagi
            </button>

            <a
              href={adminWaLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-[#003D6B]/20 bg-white px-6 py-3 text-base font-semibold text-[#003D6B] transition-colors hover:bg-[#003D6B]/5"
            >
              Hubungi Admin via WhatsApp
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default SessionPendingPage;
