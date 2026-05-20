import { motion, useMotionValue, animate } from "framer-motion";
import { Link } from "react-router-dom";
import { useRef, useState, useEffect, useCallback } from "react";

const MotionLink = motion(Link);
import OptimizedImage from "./OptimizedImage";

import imgHilti1000    from "../assets/toolsImage/scanning pembesian 3D, Hilti PS1000.webp";
import imgWaterPass    from "../assets/toolsImage/Digital Water Pass.webp";
import imgCoating      from "../assets/toolsImage/Coating Thickness Gauge.webp";
import imgHilti200     from "../assets/toolsImage/Peralatan scan tulangan Hilti PS200.webp";
import imgUltrasonic   from "../assets/toolsImage/Ultrasonic Thickness Gauge.webp";
import imgHammer       from "../assets/toolsImage/Rebound Hammer (Schmidt Hammer).webp";
import imgCanin        from "../assets/toolsImage/Proceq Canin.webp";
import imgCoreDrill    from "../assets/toolsImage/Diamond Core Drill Machine (mesin bor coring beton).webp";
import imgHardness     from "../assets/toolsImage/Hardness Brinell Test.webp";
import imgLaser        from "../assets/toolsImage/Laser Particle Sizer ANALYSETTE 22 NeXT.webp";
import imgUPV          from "../assets/toolsImage/Pengujian UPV Proceq PL200].webp";
import imgTotalStation from "../assets/toolsImage/Total-Station-Nikon-Nivo-5C-Reflectorless-removebg-preview.webp";

const blue   = "#003D6B";
const orange = "#D97706";
const muted  = "rgba(0,61,107,0.5)";
const GAP    = 12; // px gap between slides

const tools = [
    { image: imgHilti1000,    category: "Corrosion & Mapping",      name: "Scanning Pembesian 3D (Hilti PS1000)",  description: "Pemindai 3D untuk memetakan jaringan tulangan secara menyeluruh tanpa pembongkaran." },
    { image: imgCanin,        category: "Corrosion & Mapping",      name: "Proceq Canin+",                         description: "Alat half-cell untuk pemetaan potensi korosi tulangan beton secara presisi." },
    { image: imgHilti200,     category: "Corrosion & Mapping",      name: "Scan Tulangan Hilti PS200",             description: "Covermeter portabel untuk menentukan posisi dan kedalaman tulangan tanpa merusak beton." },
    { image: imgHammer,       category: "Strength & Integrity",     name: "Rebound Hammer (Schmidt Hammer)",       description: "Pengujian non-destruktif untuk estimasi kuat tekan beton di lapangan." },
    { image: imgUPV,          category: "Strength & Integrity",     name: "Pengujian UPV Proceq PL200",            description: "Pulse velocity untuk menilai integritas beton dan mendeteksi retak internal." },
    { image: imgUltrasonic,   category: "Strength & Integrity",     name: "Ultrasonic Thickness Gauge",           description: "Pengukuran ketebalan elemen struktur secara akurat dari satu sisi permukaan." },
    { image: imgCoating,      category: "Strength & Integrity",     name: "Coating Thickness Gauge",               description: "Mengukur ketebalan lapisan pelindung pada permukaan logam dan beton." },
    { image: imgCoreDrill,    category: "Strength & Integrity",     name: "Diamond Core Drill Machine",            description: "Mesin bor coring untuk mengambil sampel inti beton uji laboratorium." },
    { image: imgHardness,     category: "Strength & Integrity",     name: "Hardness Brinell Test",                 description: "Pengujian kekerasan material baja dan logam struktural secara presisi." },
    { image: imgWaterPass,    category: "Monitoring & Deformation", name: "Digital Water Pass",                    description: "Pemantauan kemiringan dan level struktur secara digital dengan akurasi tinggi." },
    { image: imgLaser,        category: "Monitoring & Deformation", name: "Laser Particle Sizer ANALYSETTE 22",   description: "Analisis distribusi ukuran partikel tanah untuk investigasi geoteknik mendalam." },
    { image: imgTotalStation, category: "Monitoring & Deformation", name: "Total Station Nikon Nivo 5C",           description: "Pengukuran koordinat dan deformasi struktur dengan akurasi submilimeter." },
];

const EASE     = [0.22, 1, 0.36, 1];
const DURATION = 0.62;
const AUTO_MS  = 3500; // auto-advance interval

export default function Tools() {
    const [activeIdx, setActiveIdx] = useState(0);
    const [containerW, setContainerW] = useState(0);
    const [paused, setPaused]         = useState(false);
    const containerRef = useRef(null);
    const trackX       = useMotionValue(0);
    const autoRef      = useRef(null);

    /* ── Measure container width responsively ── */
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(([entry]) => setContainerW(entry.contentRect.width));
        ro.observe(el);
        setContainerW(el.offsetWidth);
        return () => ro.disconnect();
    }, []);

    /* ── Derived widths ── */
    const activeW   = containerW > 0 ? containerW * 0.50 : 560;
    const inactiveW = containerW > 0 ? Math.max(220, containerW * 0.22) : 260;

    /* ── Offset so active slide is CENTERED in viewport ── */
    const calcX = useCallback((idx) => {
        const center = (containerW - activeW) / 2;
        let x = 0;
        for (let i = 0; i < idx; i++) x += inactiveW + GAP;
        return center - x;
    }, [inactiveW, activeW, containerW]);

    /* ── Animate track + widths together ── */
    useEffect(() => {
        if (containerW === 0) return;
        animate(trackX, calcX(activeIdx), { duration: DURATION, ease: EASE });
    }, [activeIdx, calcX, trackX, containerW]);

    /* ── Auto-scroll: advance every AUTO_MS, pause on hover ── */
    const startAuto = useCallback(() => {
        clearInterval(autoRef.current);
        autoRef.current = setInterval(() => {
            setActiveIdx(i => (i + 1) % tools.length);
        }, AUTO_MS);
    }, []);

    useEffect(() => {
        if (paused) { clearInterval(autoRef.current); return; }
        startAuto();
        return () => clearInterval(autoRef.current);
    }, [paused, startAuto]);

    /* ── Manual nav resets auto timer ── */
    const prev = () => {
        setActiveIdx(i => Math.max(0, i - 1));
        if (!paused) startAuto();
    };
    const next = () => {
        setActiveIdx(i => Math.min(tools.length - 1, i + 1));
        if (!paused) startAuto();
    };
    const pad  = n => String(n).padStart(2, "0");

    return (
        <section className="py-14 sm:py-16 md:py-20 bg-white overflow-hidden">

            {/* ── Header ── */}
            <div className="px-4 sm:px-6 md:px-8 mb-6">
                <div style={{ maxWidth: 1120, margin: "0 auto" }}>
                    <motion.div
                        className="flex flex-col md:flex-row md:items-end md:justify-between gap-6"
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.7, ease: EASE }}
                    >
                        <div>
                            <div className="mb-4">
                                <h2
                                    className="font-bold-hero text-shadow-bold leading-[1.3] tracking-[-0.03em]"
                                    style={{ fontSize: "clamp(2rem, 3.5vw, 3.2rem)" }}
                                >
                                    <span style={{ color: blue }}>Peralatan  </span>
                                    <span style={{ background: orange, color: "#fff", padding: "0.05em 0.3em", display: "inline", lineHeight: 1.3 }}>Kami.</span>
                                </h2>
                            </div>
                            <p className="text-base leading-relaxed max-w-xl" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
                                Instrumen terukur yang mendukung setiap tahap assessment dari pemetaan korosi hingga monitoring deformasi struktur.
                            </p>
                        </div>

                        <MotionLink
                            to="/tool"
                            className="relative inline-flex items-center gap-2 text-sm font-semibold shrink-0 whitespace-nowrap"
                            style={{ color: blue, fontFamily: "'Manrope', sans-serif", textDecoration: "none" }}
                            whileHover="hover"
                            initial="rest"
                        >
                            <span>Lihat Semua Instrumen</span>
                            <motion.span
                                variants={{ rest: { x: 0 }, hover: { x: 5 } }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                            >→</motion.span>
                            <motion.span
                                className="absolute left-0 h-[1.5px]"
                                style={{ bottom: "-3px", background: blue, transformOrigin: "left center" }}
                                variants={{ rest: { scaleX: 0 }, hover: { scaleX: 1 } }}
                                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            />
                        </MotionLink>
                    </motion.div>

                    {/* Counter + arrows */}
                    <div className="flex items-center justify-between mt-5 pt-4" style={{ borderTop: "1px solid rgba(0,61,107,0.1)" }}>
                        <span className="font-bold-hero tabular-nums" style={{ fontSize: "1.05rem", color: "rgba(0,61,107,0.35)", letterSpacing: "0.05em" }}>
                            {pad(activeIdx + 1)}&thinsp;
                        </span>
                        <div className="flex items-center gap-2">
                            {[{ fn: prev, dir: "left", d: "M10 3L5 8l5 5" }, { fn: next, dir: "right", d: "M6 3l5 5-5 5" }].map(({ fn, dir, d }) => (
                                <button
                                    key={dir}
                                    onClick={fn}
                                    className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200"
                                    style={{ border: "1.5px solid rgba(0,61,107,0.2)", color: blue }}
                                    onMouseEnter={e => { e.currentTarget.style.background = blue; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = blue; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = blue; e.currentTarget.style.borderColor = "rgba(0,61,107,0.2)"; }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path d={d} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Full-width slider — fixed height prevents any layout shift ── */}
            <div
                ref={containerRef}
                className="w-full overflow-hidden relative"
                style={{ height: "calc(clamp(200px, 26vw, 360px) + 134px)" }}
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
            >
                {/* Left fade gradient — wide smooth easing, clears before active card */}
                <div
                    className="absolute left-0 top-0 h-full pointer-events-none z-10"
                    style={{
                        width: "32%",
                        background: `linear-gradient(to right,
                            rgba(255,255,255,1.000)  0%,
                            rgba(255,255,255,0.990)  4%,
                            rgba(255,255,255,0.960)  8%,
                            rgba(255,255,255,0.910) 13%,
                            rgba(255,255,255,0.845) 18%,
                            rgba(255,255,255,0.770) 23%,
                            rgba(255,255,255,0.685) 28%,
                            rgba(255,255,255,0.595) 33%,
                            rgba(255,255,255,0.500) 38%,
                            rgba(255,255,255,0.405) 43%,
                            rgba(255,255,255,0.315) 48%,
                            rgba(255,255,255,0.230) 53%,
                            rgba(255,255,255,0.155) 58%,
                            rgba(255,255,255,0.090) 63%,
                            rgba(255,255,255,0.040) 68%,
                            rgba(255,255,255,0.010) 73%,
                            rgba(255,255,255,0.000) 78%,
                            rgba(255,255,255,0.000) 100%)`,
                    }}
                />
                {/* Right fade gradient — wide smooth easing, clears before active card */}
                <div
                    className="absolute right-0 top-0 h-full pointer-events-none z-10"
                    style={{
                        width: "32%",
                        background: `linear-gradient(to left,
                            rgba(255,255,255,1.000)  0%,
                            rgba(255,255,255,0.990)  4%,
                            rgba(255,255,255,0.960)  8%,
                            rgba(255,255,255,0.910) 13%,
                            rgba(255,255,255,0.845) 18%,
                            rgba(255,255,255,0.770) 23%,
                            rgba(255,255,255,0.685) 28%,
                            rgba(255,255,255,0.595) 33%,
                            rgba(255,255,255,0.500) 38%,
                            rgba(255,255,255,0.405) 43%,
                            rgba(255,255,255,0.315) 48%,
                            rgba(255,255,255,0.230) 53%,
                            rgba(255,255,255,0.155) 58%,
                            rgba(255,255,255,0.090) 63%,
                            rgba(255,255,255,0.040) 68%,
                            rgba(255,255,255,0.010) 73%,
                            rgba(255,255,255,0.000) 78%,
                            rgba(255,255,255,0.000) 100%)`,
                    }}
                />
                <motion.div className="flex h-full" style={{ x: trackX, gap: GAP }}>
                    {tools.map((tool, i) => {
                        const isActive = i === activeIdx;
                        return (
                            <motion.div
                                key={i}
                                animate={{ width: isActive ? activeW : inactiveW }}
                                transition={{ duration: DURATION, ease: EASE }}
                                style={{ flexShrink: 0, overflow: "hidden" }}
                            >
                                <Link to="/tool" style={{ textDecoration: "none", display: "block" }} className="group">

                                    {/* Image */}
                                    <div className="relative overflow-hidden w-full" style={{ height: "clamp(200px, 26vw, 360px)" }}>
                                        <OptimizedImage
                                            src={tool.image}
                                            alt={tool.name}
                                            className="absolute inset-0 w-full h-full object-cover"
                                            style={{
                                                transition: `transform ${DURATION}s cubic-bezier(0.22,1,0.36,1), filter ${DURATION}s ease`,
                                                transform: isActive ? "scale(1)" : "scale(1.06)",
                                                filter:    isActive ? "brightness(1)" : "brightness(0.55) blur(3px)",
                                            }}
                                            sizes="(max-width: 768px) 100vw, 50vw"
                                        />
                                        {/* Hover tint */}
                                        <div
                                            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                            style={{ background: "rgba(0,61,107,0.1)" }}
                                        />
                                        {/* Active orange bottom line */}
                                        <motion.div
                                            className="absolute bottom-0 left-0 h-[3px]"
                                            style={{ background: orange }}
                                            animate={{ width: isActive ? "100%" : "0%" }}
                                            transition={{ duration: DURATION, ease: EASE }}
                                        />
                                    </div>

                                    {/* Info — fixed height so the section below never shifts */}
                                    <div className="relative overflow-hidden" style={{ height: 132 }}>
                                        <div className="pt-4 pr-3">
                                            <motion.p
                                                className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1.5 whitespace-nowrap"
                                                animate={{ color: isActive ? orange : "rgba(0,61,107,0.3)" }}
                                                transition={{ duration: 0.35 }}
                                                style={{ fontFamily: "'Manrope', sans-serif" }}
                                            >
                                                {tool.category}
                                            </motion.p>
                                            <motion.h3
                                                className="font-bold leading-snug"
                                                animate={{ color: isActive ? blue : "rgba(0,61,107,0.35)" }}
                                                transition={{ duration: 0.35 }}
                                                style={{
                                                    fontSize: "0.9rem",
                                                    fontFamily: "'Manrope', sans-serif",
                                                    whiteSpace: isActive ? "normal" : "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                }}
                                            >
                                                {tool.name}
                                            </motion.h3>
                                        </div>

                                        {/* Description — slides UP from bottom, zero layout shift */}
                                        <motion.div
                                            className="absolute inset-x-0 bottom-0 pr-3 pb-3 pt-3"
                                            style={{ background: "#fff" }}
                                            animate={{ y: isActive ? 0 : "110%", opacity: isActive ? 1 : 0 }}
                                            transition={{ duration: DURATION, ease: EASE }}
                                        >
                                            <p className="text-sm leading-relaxed" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
                                                {tool.description}
                                            </p>
                                        </motion.div>
                                    </div>

                                    {/* Bottom rule */}
                                    <div className="relative h-px" style={{ background: "rgba(0,61,107,0.1)" }}>
                                        <div
                                            className="absolute left-0 top-0 h-full w-0 group-hover:w-full transition-all duration-500"
                                            style={{ background: orange }}
                                        />
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
}
