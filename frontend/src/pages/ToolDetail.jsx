import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "../supabaseClient";
import OptimizedImage from "../components/OptimizedImage";

const blue   = "#003D6B";
const navy   = "#001C38";
const orange = "#D97706";
const muted  = "rgba(0,61,107,0.5)";
const rule   = "rgba(0,61,107,0.1)";

const MotionLink = motion(Link);
const EASE = [0.22, 1, 0.36, 1];

const fadeUp = (delay = 0) => ({
    hidden:  { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE, delay } },
});

export default function ToolDetail() {
    const { slug } = useParams();
    const [tool, setTool]       = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase
            .from('tools')
            .select('*')
            .eq('slug', slug)
            .eq('is_active', true)
            .maybeSingle()
            .then(({ data }) => { setTool(data); setLoading(false); });
    }, [slug]);

    if (loading) {
        return (
            <div className="bg-white flex items-center justify-center" style={{ minHeight: '60vh', paddingTop: '7rem' }}>
                <div className="w-8 h-8 border-4 border-slate-200 border-t-[#F58220] rounded-full animate-spin" />
            </div>
        );
    }

    /* ── Not found ── */
    if (!tool) {
        return (
            <div className="bg-white flex items-center justify-center" style={{ minHeight: "60vh", paddingTop: "7rem" }}>
                <div className="text-center px-4 max-w-md">
                    <p
                        className="text-[11px] font-bold tracking-[0.28em] uppercase mb-4"
                        style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}
                    >
                        404
                    </p>
                    <h1
                        className="font-bold-hero tracking-[-0.03em] mb-4"
                        style={{ fontSize: "clamp(1.8rem, 3vw, 2.8rem)", lineHeight: 1.2, color: blue }}
                    >
                        Peralatan tidak ditemukan
                    </h1>
                    <p className="text-sm leading-relaxed mb-8" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
                        Data peralatan yang Anda cari tidak tersedia.
                    </p>
                    <MotionLink
                        to="/tool"
                        className="relative inline-flex items-center gap-2 text-sm font-semibold"
                        style={{ color: blue, fontFamily: "'Manrope', sans-serif", textDecoration: "none" }}
                        whileHover="hover"
                        initial="rest"
                    >
                        <motion.span variants={{ rest: { x: 0 }, hover: { x: -4 } }} transition={{ duration: 0.22 }}>←</motion.span>
                        <span>Kembali ke Daftar Peralatan</span>
                        <motion.span
                            className="absolute left-5 right-0 h-[1.5px]"
                            style={{ bottom: "-3px", background: blue, transformOrigin: "left center" }}
                            variants={{ rest: { scaleX: 0 }, hover: { scaleX: 1 } }}
                            transition={{ duration: 0.3, ease: EASE }}
                        />
                    </MotionLink>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white">

            {/* ── Hero band — dark navy ── */}
            <div
                className="relative overflow-hidden"
                style={{ background: navy, paddingTop: "5.5rem", paddingBottom: "2.5rem" }}
            >
                {/* Subtle grid texture */}
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
                {/* Orange top accent */}
                <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: orange }} />

                <div className="relative z-10 px-4 sm:px-6 md:px-8">
                    <div style={{ maxWidth: 1120, margin: "0 auto" }}>

                        {/* Breadcrumb */}
                        <motion.div
                            className="flex items-center gap-2 mb-8"
                            variants={fadeUp(0)}
                            initial="hidden"
                            animate="visible"
                        >
                            <Link
                                to="/tool"
                                className="text-xs font-semibold tracking-[0.1em] uppercase transition-colors duration-200"
                                style={{ color: "rgba(255,255,255,0.45)", fontFamily: "'Manrope', sans-serif", textDecoration: "none" }}
                                onMouseEnter={e => e.currentTarget.style.color = orange}
                                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.45)"}
                            >
                                Peralatan
                            </Link>
                            <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.75rem" }}>/</span>
                            <span
                                className="text-xs font-semibold tracking-[0.1em] uppercase"
                                style={{ color: orange, fontFamily: "'Manrope', sans-serif" }}
                            >
                                {tool.tags[0]}
                            </span>
                        </motion.div>

                        {/* Title */}
                        <motion.div
                            variants={fadeUp(0.1)}
                            initial="hidden"
                            animate="visible"
                        >
                            <h1
                                className="font-bold-hero tracking-[-0.03em] text-white"
                                style={{ fontSize: "clamp(1.8rem, 3.8vw, 4rem)", lineHeight: 1.12, maxWidth: 800 }}
                            >
                                {tool.name}
                            </h1>
                        </motion.div>

                        {/* Tags row */}
                        {tool.tags.length > 0 && (
                            <motion.div
                                className="flex flex-wrap gap-2 mt-6"
                                variants={fadeUp(0.2)}
                                initial="hidden"
                                animate="visible"
                            >
                                {tool.tags.map(tag => (
                                    <span
                                        key={tag}
                                        className="inline-flex items-center px-3 py-1 text-[10px] font-bold tracking-[0.18em] uppercase rounded-full"
                                        style={{
                                            background: "rgba(255,255,255,0.08)",
                                            border: "1px solid rgba(255,255,255,0.15)",
                                            color: "rgba(255,255,255,0.7)",
                                            fontFamily: "'Manrope', sans-serif",
                                        }}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Content ── */}
            <div className="px-4 sm:px-6 md:px-8 py-10 sm:py-14 xl:py-20">
                <div style={{ maxWidth: 1120, margin: "0 auto" }}>

                    {/* Two-column: description + image */}
                    <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-start">

                        {/* Left — description */}
                        <motion.div
                            variants={fadeUp(0.05)}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.3 }}
                        >
                            <p
                                className="text-[11px] font-bold tracking-[0.26em] uppercase mb-5"
                                style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}
                            >
                                Tentang Instrumen
                            </p>

                            {/* Rule */}
                            <div className="h-px mb-8" style={{ background: rule }} />

                            <p
                                className="text-base sm:text-lg leading-relaxed"
                                style={{ color: "rgba(0,61,107,0.8)", fontFamily: "'Manrope', sans-serif" }}
                            >
                                {tool.description}
                            </p>

                            {/* Capabilities */}
                            {tool.tags.length > 1 && (
                                <div className="mt-10">
                                    <p
                                        className="text-[11px] font-bold tracking-[0.26em] uppercase mb-5"
                                        style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}
                                    >
                                        Kapabilitas
                                    </p>
                                    <div className="h-px mb-6" style={{ background: rule }} />
                                    <div className="flex flex-col gap-0">
                                        {tool.tags.map((tag, i) => (
                                            <motion.div
                                                key={tag}
                                                className="flex items-center gap-4 py-4"
                                                style={{ borderBottom: `1px solid ${rule}` }}
                                                initial={{ opacity: 0, x: -12 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.45, ease: EASE, delay: i * 0.07 }}
                                            >
                                                <span
                                                    className="font-bold-hero tabular-nums shrink-0"
                                                    style={{ fontSize: "0.8rem", color: "rgba(0,61,107,0.2)", letterSpacing: "0.05em" }}
                                                >
                                                    {String(i + 1).padStart(2, "0")}
                                                </span>
                                                <span
                                                    className="text-sm font-semibold"
                                                    style={{ color: blue, fontFamily: "'Manrope', sans-serif" }}
                                                >
                                                    {tag}
                                                </span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Back link */}
                            <div className="mt-12">
                                <MotionLink
                                    to="/tool"
                                    className="relative inline-flex items-center gap-2 text-sm font-semibold"
                                    style={{ color: muted, fontFamily: "'Manrope', sans-serif", textDecoration: "none" }}
                                    whileHover="hover"
                                    initial="rest"
                                    onMouseEnter={e => e.currentTarget.style.color = blue}
                                    onMouseLeave={e => e.currentTarget.style.color = muted}
                                >
                                    <motion.span
                                        variants={{ rest: { x: 0 }, hover: { x: -4 } }}
                                        transition={{ duration: 0.22, ease: "easeOut" }}
                                    >←</motion.span>
                                    <span>Semua Instrumen</span>
                                    <motion.span
                                        className="absolute h-[1.5px]"
                                        style={{ left: "1.5rem", right: 0, bottom: "-3px", background: blue, transformOrigin: "left center" }}
                                        variants={{ rest: { scaleX: 0 }, hover: { scaleX: 1 } }}
                                        transition={{ duration: 0.3, ease: EASE }}
                                    />
                                </MotionLink>
                            </div>
                        </motion.div>

                        {/* Right — image */}
                        <motion.div
                            variants={fadeUp(0.15)}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.2 }}
                            className="lg:sticky lg:top-32"
                        >
                            <div
                                className="relative overflow-hidden"
                                style={{ background: "rgba(0,61,107,0.03)", aspectRatio: "4/3" }}
                            >
                                {tool.thumbnail_url ? (
                                    <OptimizedImage
                                        src={tool.thumbnail_url}
                                        alt={tool.name}
                                        className="w-full h-full"
                                        style={{ objectFit: "contain", padding: "2rem" }}
                                        sizes="(max-width: 1024px) 100vw, 45vw"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <p className="text-sm" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
                                            Gambar belum tersedia
                                        </p>
                                    </div>
                                )}

                                {/* Orange bottom accent */}
                                <div
                                    className="absolute bottom-0 left-0 right-0 h-[3px]"
                                    style={{ background: orange }}
                                />
                            </div>

                            {/* Tool name below image */}
                            <div className="pt-4">
                                <p
                                    className="text-[10px] font-bold tracking-[0.2em] uppercase"
                                    style={{ color: orange, fontFamily: "'Manrope', sans-serif" }}
                                >
                                    {tool.tags[0]}
                                </p>
                                <p
                                    className="text-sm font-semibold mt-1"
                                    style={{ color: blue, fontFamily: "'Manrope', sans-serif" }}
                                >
                                    {tool.name}
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* ── CTA strip ── */}
            <div
                className="px-4 sm:px-6 md:px-8 py-12"
                style={{ borderTop: `1px solid ${rule}` }}
            >
                <div
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6"
                    style={{ maxWidth: 1120, margin: "0 auto" }}
                >
                    <div>
                        <p
                            className="text-[11px] font-bold tracking-[0.26em] uppercase mb-2"
                            style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}
                        >
                            Butuh asesmen?
                        </p>
                        <h2
                            className="font-bold-hero tracking-[-0.02em]"
                            style={{ fontSize: "clamp(1.2rem, 2vw, 1.8rem)", color: blue, lineHeight: 1.2 }}
                        >
                            Konsultasikan kebutuhan Anda bersama tim ahli kami.
                        </h2>
                    </div>

                    <MotionLink
                        to="/layanan"
                        className="inline-flex items-center gap-3 px-6 py-4 text-sm font-semibold text-white rounded-full shrink-0"
                        style={{ background: orange, fontFamily: "'Manrope', sans-serif", textDecoration: "none" }}
                        whileHover={{ scale: 1.04, boxShadow: "0 8px 32px rgba(217,119,6,0.4)" }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ duration: 0.22 }}
                    >
                        Mulai Pre-Assessment
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </MotionLink>
                </div>
            </div>
        </div>
    );
}
