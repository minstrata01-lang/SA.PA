import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect, useState, useCallback, useRef } from "react";
import OrangeButtonArrow from "./Button/OrangeButtonArrow";

import gambar1 from "../assets/heroImage/hero1.png";
import gambar2 from "../assets/heroImage/hero2.png";
import gambar3 from "../assets/heroImage/hero3.png";
import gambar4 from "../assets/heroImage/hero4.png";
import gambar5 from "../assets/heroImage/hero5.png";
import gambar6 from "../assets/heroImage/hero6.png";
import gambar7 from "../assets/heroImage/hero7.png";
import gambar8 from "../assets/heroImage/hero8.png";
import gambar9 from "../assets/heroImage/hero9.png";
import gambar10 from "../assets/heroImage/hero10.png";
import gambar11 from "../assets/heroImage/hero11.png";
import gambar12 from "../assets/heroImage/hero12.png";
import gambar13 from "../assets/heroImage/hero13.png";

const SLIDES = [
  gambar1,
  gambar2,
  gambar3,
  gambar4,
  gambar5,
  gambar6,
  gambar7,
  gambar8,
  gambar9,
  gambar10,
  gambar11,
  gambar12,
  gambar13
];

const blue   = "#003D6B";
const orange = "#E8920A";
const muted  = "rgba(0,61,107,0.5)";

const issues = ["Penurunan Lantai", "Keretakan Dinding", "Masalah Pondasi"];
const trust  = ["Respon cepat", "Tim bersertifikat", "Sesuai Standar dan Peraturan yang Berlaku"];

const EASE    = [0.22, 1, 0.36, 1];
const AUTO_MS = 20000;

const fadeUp = (delay) => ({
    hidden:  { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE, delay } },
});

export default function Hero() {
    const prefersReduced = useReducedMotion();

    const slidesCount = SLIDES.length;

    const [slideIdx, setSlideIdx] = useState(0);
    const [wordIdx,  setWordIdx]  = useState(0);
    const [wordKey,  setWordKey]  = useState(0);
    const [paused,   setPaused]   = useState(false);
    const autoRef = useRef(null);

    useEffect(() => {
        if (prefersReduced) return;
        const t = setInterval(() => {
            setWordIdx(i => (i + 1) % issues.length);
            setWordKey(k => k + 1);
        }, 2800);
        return () => clearInterval(t);
    }, [prefersReduced]);

    const startAuto = useCallback(() => {
        clearInterval(autoRef.current);
        if (slidesCount < 2) return;
        autoRef.current = setInterval(
            () => setSlideIdx(i => (i + 1) % slidesCount),
            AUTO_MS,
        );
    }, [slidesCount]);

    useEffect(() => {
        if (prefersReduced || paused || slidesCount < 2) { clearInterval(autoRef.current); return; }
        startAuto();
        return () => clearInterval(autoRef.current);
    }, [prefersReduced, paused, startAuto, slidesCount]);

    const goTo = (i) => { setSlideIdx(i); startAuto(); };
    const prev  = ()  => { setSlideIdx(i => (i - 1 + slidesCount) % slidesCount); startAuto(); };
    const next  = ()  => { setSlideIdx(i => (i + 1) % slidesCount); startAuto(); };

    return (
        <section
            className="relative bg-white flex flex-col"
            style={{ height: "100svh", minHeight: 520, overflow: "hidden" }}
        >
            {/* IMAGE SLIDER — z-index: 1 */}
            <div
                className="absolute top-0 bottom-0 hidden lg:block"
                style={{ right: 0, width: "52%", zIndex: 1, borderRadius: "20px 0 0 20px", overflow: "hidden" }}
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
            >
                <div
                    className="absolute inset-y-0 left-0 pointer-events-none"
                    style={{
                        width: "50%", zIndex: 2,
                        background: "linear-gradient(to right, #fff 0%, rgba(255,255,255,0.9) 18%, rgba(255,255,255,0.45) 52%, transparent 100%)",
                    }}
                />
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={slideIdx}
                        className="absolute inset-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.9, ease: EASE }}
                    >
                        {/\.(mp4|webm)$/i.test(SLIDES[slideIdx]) ? (
                            <video
                                src={SLIDES[slideIdx]}
                                className="w-full h-full object-cover"
                                autoPlay
                                muted
                                loop
                                playsInline
                                draggable={false}
                            />
                        ) : (
                            <img
                                src={SLIDES[slideIdx]}
                                alt=""
                                className="w-full h-full object-cover"
                                draggable={false}
                            />
                        )}
                        <div className="absolute inset-0" style={{ background: "rgba(0,15,40,0.08)" }} />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* NAV CONTROLS — z-index: 20 */}
            {slidesCount > 1 && (
            <div
                className="absolute hidden lg:flex items-center gap-5"
                style={{ bottom: 72, right: 32, zIndex: 20 }}
            >
                <span
                    className="font-bold-hero tabular-nums select-none"
                    style={{ fontSize: "0.68rem", letterSpacing: "0.12em" }}
                >
                    <span style={{ color: "rgba(255,255,255,0.95)", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
                        {String(slideIdx + 1).padStart(2, "0")}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.4)", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
                        {" / "}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.4)", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
                        {String(SLIDES.length).padStart(2, "0")}
                    </span>
                </span>

                <div className="flex items-center gap-1.5">
                    {SLIDES.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goTo(i)}
                            aria-label={`Slide ${i + 1}`}
                            style={{
                                width: i === slideIdx ? 22 : 6,
                                height: 3,
                                background: i === slideIdx ? orange : "rgba(255,255,255,0.45)",
                                border: "none", cursor: "pointer", padding: 0, borderRadius: 2,
                                transition: "width 0.35s ease, background 0.3s ease",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                            }}
                        />
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    {[
                        { fn: prev, label: "Previous", path: "M6 2L2 6L6 10" },
                        { fn: next, label: "Next",     path: "M2 2L6 6L2 10" },
                    ].map(({ fn, label, path }) => (
                        <button
                            key={label}
                            onClick={fn}
                            aria-label={label}
                            style={{
                                width: 36, height: 36,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                background: "rgba(255,255,255,0.15)",
                                border: "1px solid rgba(255,255,255,0.35)",
                                backdropFilter: "blur(8px)",
                                borderRadius: "50%",
                                color: "white",
                                cursor: "pointer",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                                transition: "background 0.2s, transform 0.15s",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.28)"; e.currentTarget.style.transform = "scale(1.08)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; e.currentTarget.style.transform = "scale(1)"; }}
                        >
                            <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
                                <path d={path} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    ))}
                </div>
            </div>
            )}

            {/* TEXT CONTENT — z-index: 10 */}
            <div
                className="flex-1 flex flex-col justify-center px-4 sm:px-6 md:px-8 pt-[88px] sm:pt-[96px] xl:pt-[104px] pb-1 sm:pb-2 xl:pb-4"
                style={{ position: "relative", zIndex: 10, minHeight: 0 }}
            >
                <div style={{ maxWidth: 1120, margin: "0 auto", width: "100%" }}>

                    <motion.p
                        variants={fadeUp(0.05)} initial="hidden" animate="visible"
                        className="text-[10px] font-bold tracking-[0.28em] uppercase mb-2 sm:mb-3 xl:mb-5"
                        style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}
                    >
                        Structural & Geothecnical
                    </motion.p>

                    <motion.div
                        variants={fadeUp(0.12)} initial="hidden" animate="visible"
                        className="mb-2 sm:mb-3 xl:mb-5"
                    >
                        <h1
                            className="font-bold-hero tracking-[-0.03em] m-0 p-0"
                            style={{ fontSize: "clamp(1.5rem, 4.2vw, 4.4rem)", lineHeight: 1.12, color: blue }}
                        >
                            Diagnosis tepat untuk
                        </h1>

                        <div className="overflow-hidden" style={{ padding: "0.1em 0" }} aria-live="polite">
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.p
                                    key={wordKey}
                                    className="font-bold-hero tracking-[-0.03em] m-0"
                                    style={{ fontSize: "clamp(1.5rem, 4.2vw, 4.4rem)", lineHeight: 1.12, color: orange }}
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -14 }}
                                    transition={{ duration: 0.28, ease: EASE }}
                                >
                                    {issues[wordIdx]}
                                </motion.p>
                            </AnimatePresence>
                        </div>

                        <p
                            className="font-bold-hero tracking-[-0.03em] m-0"
                            style={{ fontSize: "clamp(1.5rem, 4.2vw, 4.4rem)", lineHeight: 1.12, color: blue }}
                        >
                            bangunan Anda.
                        </p>
                    </motion.div>

                    <motion.p
                        variants={fadeUp(0.22)} initial="hidden" animate="visible"
                        className="text-sm leading-relaxed mb-2 sm:mb-3 xl:mb-5"
                        style={{ color: muted, fontFamily: "'Manrope', sans-serif", maxWidth: 460 }}
                    >
                        Kami membantu Anda memastikan penyebab masalah struktural dan memberikan
                        solusi berbasis data akurat dari pemeriksaan awal hingga kajian risiko penuh.
                    </motion.p>

                    <motion.div
                        variants={fadeUp(0.3)} initial="hidden" animate="visible"
                        className="mb-3 sm:mb-4 xl:mb-6"
                        style={{ borderTop: "1px solid rgba(0,61,107,0.1)", paddingTop: "0.65rem" }}
                    >
                        <p
                            className="text-[10px] font-semibold tracking-[0.18em] uppercase mb-1"
                            style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}
                        >
                            mulai dari
                        </p>
                        <div className="flex items-baseline gap-3 mb-1">
                            <span
                                className="font-bold-hero leading-none"
                                style={{ fontSize: "clamp(1.4rem, 4.5vw, 3rem)", color: orange, letterSpacing: "-0.03em" }}
                            >
                                Rp500.000,-
                            </span>
                            <span
                                className="text-xs font-semibold"
                                style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}
                            >
                                / pre-assessment
                            </span>
                        </div>
                        <p
                            className="text-xs leading-relaxed"
                            style={{ color: muted, fontFamily: "'Manrope', sans-serif", maxWidth: 380 }}
                        >
                            Lebih hemat dibandingkan rekomendasi assessment dengan biaya yang mahal.
                        </p>
                    </motion.div>

                    <motion.div
                        variants={fadeUp(0.38)} initial="hidden" animate="visible"
                        className="flex flex-wrap gap-3"
                    >
                        <OrangeButtonArrow buttonText="Mulai Pre-Assessment" to="/layanan" large />                        
                    </motion.div>
                </div>
            </div>

            {/* Trust strip */}
            <motion.div
                variants={fadeUp(0.5)} initial="hidden" animate="visible"
                className="border-t px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 xl:py-4"
                style={{ borderColor: "rgba(0,61,107,0.1)", position: "relative", zIndex: 10, flexShrink: 0 }}
            >
                <div
                    className="flex flex-wrap items-center gap-x-6 sm:gap-x-8 gap-y-1"
                    style={{ maxWidth: 1120, margin: "0 auto" }}
                >
                    {trust.map((t, i) => (
                        <span
                            key={i}
                            className="flex items-center gap-2 text-xs font-semibold"
                            style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}
                        >
                            {i > 0 && <span className="inline-block w-1 h-1 rounded-full" style={{ background: "rgba(0,61,107,0.2)" }} />}
                            {t}
                        </span>
                    ))}
                </div>
            </motion.div>
        </section>
    );
}
