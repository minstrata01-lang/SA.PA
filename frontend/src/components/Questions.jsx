import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useState } from "react";
import OptimizedImage from "./OptimizedImage";
import { useCases } from "../hooks/useCases";

const blue   = "#003D6B";
const orange = "#D97706";
const muted  = "rgba(0,61,107,0.5)";

const MotionLink = motion(Link);

function CaseCard({ to, img, title, description, featured = false }) {
    const [hovered, setHovered] = useState(false);

    return (
        <Link
            to={to}
            className="relative block overflow-hidden w-full h-full"
            style={{
                minHeight: featured ? 420 : 280,
                borderRadius: 4,
                textDecoration: "none",
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Photo */}
            <OptimizedImage
                src={img}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                    transform: hovered ? "scale(1.05)" : "scale(1)",
                    transition: "transform 0.7s cubic-bezier(0.22,1,0.36,1)",
                }}
                sizes={featured ? "(max-width: 768px) 100vw, 65vw" : "(max-width: 768px) 100vw, 35vw"}
            />

            {/* Dark overlay */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: hovered
                        ? "linear-gradient(to top, rgba(0,8,22,0.92) 0%, rgba(0,8,22,0.55) 45%, rgba(0,8,22,0.15) 100%)"
                        : "linear-gradient(to top, rgba(0,8,22,0.82) 0%, rgba(0,8,22,0.3) 50%, rgba(0,8,22,0.05) 100%)",
                    transition: "background 0.4s ease",
                }}
            />

            {/* Category badge */}
            <div className="absolute top-4 left-4">
                <span
                    className="inline-block px-3 py-1 text-[10px] font-bold tracking-[0.18em] uppercase rounded-full"
                    style={{
                        background: "rgba(0,0,0,0.5)",
                        backdropFilter: "blur(6px)",
                        border: `1px solid rgba(217,119,6,0.4)`,
                        color: orange,
                        fontFamily: "'Manrope', sans-serif",
                    }}
                >
                    Catatan Kasus
                </span>
            </div>

            {/* Arrow — visible on hover */}
            <motion.div
                className="absolute top-4 right-4 flex items-center justify-center rounded-full"
                style={{
                    width: 36, height: 36,
                    background: "rgba(255,255,255,0.15)",
                    backdropFilter: "blur(6px)",
                    border: "1px solid rgba(255,255,255,0.3)",
                }}
                animate={{ opacity: hovered ? 1 : 0, scale: hovered ? 1 : 0.8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
            >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 11L11 3M11 3H5M11 3V9" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </motion.div>

            {/* Bottom text */}
            <div className="absolute inset-x-0 bottom-0 p-5">
                <h3
                    className="font-bold-hero text-white leading-snug"
                    style={{ fontSize: featured ? "clamp(1.1rem, 2vw, 1.5rem)" : "1rem" }}
                >
                    {title}
                </h3>
                {featured && description && (
                    <p
                        className="mt-2 text-sm leading-relaxed line-clamp-2"
                        style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'Manrope', sans-serif" }}
                    >
                        {description}
                    </p>
                )}
            </div>

            {/* Bottom accent line on hover */}
            <motion.div
                className="absolute bottom-0 left-0 h-[3px]"
                style={{ background: orange }}
                animate={{ width: hovered ? "100%" : "0%" }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            />
        </Link>
    );
}

export default function Questions() {
    const { data: cases } = useCases();
    const featured = cases.slice(0, 4);

    return (
        <section className="py-12 sm:py-14 md:py-16 xl:py-20 px-4 sm:px-6 md:px-8 bg-white">
            <div style={{ maxWidth: 1120, margin: "0 auto" }}>

                {/* Header — two-column split (Arup style) */}
                <motion.div
                    className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8"
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                    <div className="max-w-lg">
                        <p
                            className="text-[11px] font-bold tracking-[0.26em] uppercase mb-4"
                            style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}
                        >
                            Catatan Kasus
                        </p>
                        <h2
                            className="font-bold-hero text-shadow-bold leading-[1.3] tracking-[-0.03em]"
                            style={{ fontSize: "clamp(2rem, 3.5vw, 3.2rem)" }}
                        >
                            <span style={{ color: blue }}>Jejak  </span>
                            <span style={{ background: orange, color: "#fff", padding: "0.05em 0.3em", display: "inline", lineHeight: 1.3 }}>Kami.</span>
                        </h2>
                    </div>
                    <MotionLink
                        to="/case"
                        className="relative inline-flex items-center gap-2 text-sm font-semibold shrink-0 whitespace-nowrap"
                        style={{ color: muted, fontFamily: "'Manrope', sans-serif", textDecoration: "none" }}
                        whileHover="hover"
                        initial="rest"
                        onMouseEnter={e => e.currentTarget.style.color = blue}
                        onMouseLeave={e => e.currentTarget.style.color = muted}
                    >
                        <span>Lihat Semua Kasus</span>
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

                {/* Full-width rule */}
                <div className="mb-8 h-px" style={{ background: "rgba(0,61,107,0.1)" }} />

                {/* Arup-style asymmetric grid */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-3"
                    style={{ gridTemplateRows: "auto auto" }}
                    initial={{ opacity: 0, y: 32 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                >
                    {/* Card 1 — featured large (spans 2 cols, 2 rows) */}
                    {featured[0] && (
                        <div className="md:col-span-2 md:row-span-2" style={{ minHeight: 360 }}>
                            <CaseCard img={featured[0].cover_image_url} title={featured[0].title} description={featured[0].summary} to={`/case/${featured[0].slug}`} featured />
                        </div>
                    )}

                    {/* Card 2 — top right */}
                    {featured[1] && (
                        <div style={{ minHeight: 190 }}>
                            <CaseCard img={featured[1].cover_image_url} title={featured[1].title} description={featured[1].summary} to={`/case/${featured[1].slug}`} />
                        </div>
                    )}

                    {/* Card 3 — bottom right */}
                    {featured[2] && (
                        <div style={{ minHeight: 190 }}>
                            <CaseCard img={featured[2].cover_image_url} title={featured[2].title} description={featured[2].summary} to={`/case/${featured[2].slug}`} />
                        </div>
                    )}

                    {/* Card 4 — full width bottom row */}
                    {featured[3] && (
                        <div className="md:col-span-3" style={{ minHeight: 190 }}>
                            <CaseCard img={featured[3].cover_image_url} title={featured[3].title} description={featured[3].summary} to={`/case/${featured[3].slug}`} />
                        </div>
                    )}
                </motion.div>
            </div>
        </section>
    );
}
