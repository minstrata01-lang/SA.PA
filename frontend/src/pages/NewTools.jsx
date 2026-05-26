import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTools } from "../hooks/useTools";
import OptimizedImage from "../components/OptimizedImage";
import SEO from "../components/SEO";

const blue   = "#003D6B";
const orange = "#D97706";
const muted  = "rgba(0,61,107,0.72)";
const rule   = "rgba(0,61,107,0.1)";

const MotionLink = motion(Link);

const EASE = [0.22, 1, 0.36, 1];

const slugify = str => str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

/* ── Tool card — Arup "Our Work" editorial style ── */
function ToolCard({ tool, index }) {
    const [hovered, setHovered] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.6, ease: EASE, delay: (index % 3) * 0.08 }}
        >
            <MotionLink
                to={`/tool/${tool.slug || slugify(tool.name)}`}
                className="relative block overflow-hidden"
                style={{ textDecoration: "none" }}
                whileHover="hover"
                initial="rest"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                {/* Image */}
                <div className="relative overflow-hidden w-full" style={{ aspectRatio: "4/3" }}>
                    <OptimizedImage
                        src={tool.thumbnail_url}
                        alt={tool.name}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{
                            transform: hovered ? "scale(1.06)" : "scale(1)",
                            filter: hovered ? "brightness(1)" : "brightness(0.92)",
                            transition: `transform 0.65s cubic-bezier(0.22,1,0.36,1), filter 0.65s ease`,
                        }}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />

                    {/* Hover tint */}
                    <div
                        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                        style={{ background: "rgba(0,61,107,0.08)", opacity: hovered ? 1 : 0 }}
                    />

                    {/* Orange bottom line — slides in on hover */}
                    <motion.div
                        className="absolute bottom-0 left-0 h-[3px]"
                        style={{ background: orange }}
                        variants={{ rest: { width: "0%" }, hover: { width: "100%" } }}
                        transition={{ duration: 0.4, ease: EASE }}
                    />
                </div>

                {/* Info */}
                <div className="pt-4 pb-5">
                    {/* Tags as category */}
                    <p
                        className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1.5"
                        style={{
                            color: hovered ? orange : "rgba(0,61,107,0.35)",
                            fontFamily: "'Manrope', sans-serif",
                            transition: "color 0.25s",
                        }}
                    >
                        {tool.tags[0]}
                    </p>

                    <h3
                        className="font-bold leading-snug mb-3"
                        style={{
                            fontSize: "clamp(0.9rem, 1.4vw, 1.05rem)",
                            color: hovered ? blue : blue,
                            fontFamily: "'Manrope', sans-serif",
                        }}
                    >
                        {tool.name}
                    </h3>

                    {/* Arup text link */}
                    <div className="relative inline-flex items-center gap-1.5">
                        <span
                            className="text-xs font-semibold"
                            style={{
                                color: hovered ? blue : muted,
                                fontFamily: "'Manrope', sans-serif",
                                transition: "color 0.25s",
                            }}
                        >
                            Lihat Detail
                        </span>
                        <motion.span
                            className="text-xs"
                            style={{ color: hovered ? blue : muted, transition: "color 0.25s" }}
                            variants={{ rest: { x: 0 }, hover: { x: 4 } }}
                            transition={{ duration: 0.22, ease: "easeOut" }}
                        >
                            →
                        </motion.span>
                        <motion.span
                            className="absolute left-0 h-px"
                            style={{ bottom: "-2px", background: blue, transformOrigin: "left center" }}
                            variants={{ rest: { scaleX: 0 }, hover: { scaleX: 1 } }}
                            transition={{ duration: 0.3, ease: EASE }}
                        />
                    </div>
                </div>

                {/* Bottom rule */}
                <div className="h-px" style={{ background: rule }}>
                    <div
                        className="h-full transition-all duration-500"
                        style={{
                            width: hovered ? "100%" : "0%",
                            background: orange,
                        }}
                    />
                </div>
            </MotionLink>
        </motion.div>
    );
}

export default function NewTools() {
    const { data: allTools, loading, error } = useTools();

    if (loading) {
        return (
            <div className="bg-white flex items-center justify-center" style={{ minHeight: '60vh', paddingTop: '5rem' }}>
                <div className="w-8 h-8 border-4 border-slate-200 border-t-[#F58220] rounded-full animate-spin" />
            </div>
        );
    }

    console.log('[DEBUG tools]', allTools.map(t => ({ id: t.id, name: t.name, slug: t.slug, generated: slugify(t.name) })));

    if (error) {
        return (
            <div className="bg-white flex items-center justify-center" style={{ minHeight: '60vh', paddingTop: '5rem' }}>
                <div className="text-center px-4">
                    <p className="text-sm font-semibold text-slate-500">Gagal memuat data. Silakan refresh halaman.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white" style={{ paddingTop: "5.5rem" }}>
            <SEO
                title="Alat & Peralatan Survei Struktural"
                description="Kenali alat-alat profesional yang digunakan tim SA.PA dalam investigasi dan survei struktural bangunan, mulai dari total station hingga GPR."
                canonical="/tool"
            />

            {/* ── Page header ── */}
            <div className="px-4 sm:px-6 md:px-8 pb-8">
                <div style={{ maxWidth: 1120, margin: "0 auto" }}>
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: EASE }}
                    >
                        <p
                            className="text-[11px] font-bold tracking-[0.28em] uppercase mb-6"
                            style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}
                        >
                            Instrumen Teknis
                        </p>

                        <div className="mb-6">
                            <h1
                                className="font-bold-hero tracking-[-0.03em] inline"
                                style={{ fontSize: "clamp(2rem, 4.2vw, 4.4rem)", lineHeight: 1.15, color: blue }}
                            >
                                Peralatan{" "}
                            </h1>
                            <span
                                className="font-bold-hero tracking-[-0.03em] inline"
                                style={{
                                    fontSize: "clamp(2rem, 4.2vw, 4.4rem)",
                                    lineHeight: 1.15,
                                    background: orange,
                                    color: "#fff",
                                    padding: "0.05em 0.3em",
                                }}
                            >
                                Kami
                            </span>
                        </div>

                        <p
                            className="text-base leading-relaxed max-w-xl"
                            style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}
                        >
                            Setiap analisis kami didukung oleh instrumen yang terkalibrasi dan terukur mulai dari pemindaian tulangan hingga monitoring deformasi struktur.
                        </p>
                    </motion.div>

                    {/* Counter + rule */}
                    <motion.div
                        className="flex items-center justify-between mt-6 pt-5"
                        style={{ borderTop: `1px solid ${rule}` }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
                    >
                        <span
                            className="font-bold-hero tabular-nums"
                            style={{ fontSize: "1rem", color: "rgba(0,61,107,0.3)", letterSpacing: "0.05em" }}
                        >
                            {String(allTools.length).padStart(2, "0")} Instrumen
                        </span>
                    </motion.div>
                </div>
            </div>

            {/* ── Tools grid ── */}
            <div className="px-4 sm:px-6 md:px-8 pb-14">
                <div style={{ maxWidth: 1120, margin: "0 auto" }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-0">
                        {allTools.map((tool, i) => (
                            <ToolCard key={tool.id} tool={tool} index={i} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
