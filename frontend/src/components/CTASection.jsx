import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import EmailIcon from "../assets/Email.svg?react";
import ConsultIcon from "../assets/Consult.svg?react";
import { Link } from "react-router-dom";

const navy   = "#001C38";
const orange = "#D97706";

const MotionLink = motion(Link);

const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const itemVariants = {
    hidden:  { opacity: 0, y: 22 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

export default function CTASection() {
    const sectionRef = useRef(null);
    const inView = useInView(sectionRef, { once: true, amount: 0.2 });

    return (
        <section
            ref={sectionRef}
            className="relative overflow-hidden py-14 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8"
            style={{ background: navy }}
        >
            {/* Subtle large-scale texture — diagonal grid lines */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.04]"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)
                    `,
                    backgroundSize: "72px 72px",
                }}
            />

            {/* Orange accent line at top */}
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: orange }} />

            <motion.div
                className="relative z-10 max-w-3xl mx-auto flex flex-col items-center text-center gap-5"
                variants={containerVariants}
                initial="hidden"
                animate={inView ? "visible" : "hidden"}
            >
                {/* Eyebrow */}
                <motion.p
                    variants={itemVariants}
                    className="text-[11px] font-bold tracking-[0.28em] uppercase"
                    style={{ color: orange, fontFamily: "'Manrope', sans-serif" }}
                >
                    Hubungi Kami
                </motion.p>

                {/* Full-width rule */}
                <motion.div
                    className="w-full h-px"
                    style={{ background: "rgba(255,255,255,0.1)" }}
                    variants={itemVariants}
                />

                {/* Heading */}
                <motion.h2
                    variants={itemVariants}
                    className="font-bold-hero leading-[1.08] tracking-[-0.03em] text-white"
                    style={{ fontSize: "clamp(2.2rem, 4.5vw, 4rem)" }}
                >
                    Masih ragu? Kami siap{" "}
                    <br className="hidden sm:block" />
                    <span style={{ color: orange }}>membantu</span> Anda.
                </motion.h2>

                {/* Sub-text */}
                <motion.p
                    variants={itemVariants}
                    className="text-base leading-relaxed max-w-md"
                    style={{ color: "rgba(255,255,255,0.55)", fontFamily: "'Manrope', sans-serif" }}
                >
                    Tim ahli kami siap membantu Anda menentukan langkah terbaik. Konsultasi awal gratis, tanpa komitmen.
                </motion.p>

                {/* Buttons */}
                <motion.div
                    variants={itemVariants}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full pt-2"
                >

                    {/* Pre-assessment */}
                    <MotionLink
                        to="/layanan"
                        className="relative flex items-center gap-3 px-7 py-4 rounded-full overflow-hidden font-semibold text-white text-sm"
                        style={{
                            background: orange,
                            minWidth: 220,
                            fontFamily: "'Manrope', sans-serif",
                        }}
                        whileHover={{ scale: 1.04, boxShadow: "0 8px 32px rgba(217,119,6,0.45)" }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ duration: 0.22 }}
                    >
                        <span className="flex items-center justify-center w-7 h-7 rounded-full shrink-0" style={{ background: "rgba(255,255,255,0.2)" }}>
                            <ConsultIcon className="w-3.5 h-3.5 text-white" />
                        </span>
                        Konsultasi Sekarang
                    </MotionLink>
                </motion.div>

                {/* Trust note */}
                <motion.p
                    variants={itemVariants}
                    className="text-xs tracking-wide"
                    style={{ color: "rgba(255,255,255,0.25)", fontFamily: "'Manrope', sans-serif" }}
                >
                    Respon cepat · Tim bersertifikat · Sesuai Standar dan Peraturan yang Berlaku
                </motion.p>
            </motion.div>
        </section>
    );
}
