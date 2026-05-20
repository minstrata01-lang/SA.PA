const FALLBACK_IMAGE = 'https://via.placeholder.com/400x500?text=Foto+Tidak+Tersedia';
import OptimizedImage from "../OptimizedImage";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const navy   = "#001225";
const orange = "#D97706";

export default function CardConsultant({
    name          = "Consultant",
    title         = "",
    description   = "",
    photo_url     = null,
    isAutoHovered = false,
}) {
    const [hovered, setHovered] = useState(false);
    const isActive = hovered || isAutoHovered;

    return (
        <div
            className="flex flex-col w-full"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* ── Photo ── */}
            <div className="relative overflow-hidden w-full" style={{ aspectRatio: "4/5" }}>
                <OptimizedImage
                    src={photo_url || FALLBACK_IMAGE}
                    alt={name}
                    className="absolute inset-0 w-full h-full object-cover object-top"
                    style={{
                        transform: isActive ? "scale(1.18)" : "scale(1)",
                        transition: "transform 0.85s cubic-bezier(0.22,1,0.36,1)",
                    }}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />

                {/* Subtle top fade to navy so header bar blends in */}
                <div
                    className="absolute inset-x-0 top-0 h-16 pointer-events-none"
                    style={{ background: "linear-gradient(to bottom, rgba(0,18,37,0.35), transparent)" }}
                />

                {/* Bottom gradient overlay on hover */}
                <motion.div
                    className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none"
                    animate={{ opacity: isActive ? 1 : 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    style={{ background: "linear-gradient(to top, rgba(0,18,37,0.7), transparent)" }}
                />

                {/* Orange top accent bar — slides in on hover */}
                <motion.div
                    className="absolute top-0 left-0 h-[3px]"
                    style={{ background: orange, originX: 0 }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: isActive ? 1 : 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                />

                {/* Left accent edge */}
                <motion.div
                    className="absolute top-0 left-0 w-[3px]"
                    style={{ background: orange, originY: 0 }}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: isActive ? 1 : 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
                />
            </div>

            {/* ── Info panel — fixed height, description slides UP as overlay ── */}
            <div
                className="relative w-full overflow-hidden"
                style={{ background: navy, height: 160 }}
            >
                {/* Static content: role + name + divider */}
                <div className="px-5 pt-5">
                    <p
                        className="text-[10px] font-bold tracking-[0.2em] uppercase mb-2"
                        style={{ color: orange, fontFamily: "'Manrope', sans-serif", minHeight: "2.8em", lineHeight: 1.4 }}
                    >
                        {title}
                    </p>
                    <h3
                        className="font-bold-hero text-white leading-snug"
                        style={{ fontSize: "clamp(0.9rem, 1.2vw, 1.05rem)", minHeight: "2.6rem" }}
                    >
                        {name}
                    </h3>
                </div>

                {/* Thin rule */}
                <div
                    className="mx-5 h-px"
                    style={{ background: "rgba(255,255,255,0.1)" }}
                />

                {/* Description — slides UP from bottom, no layout shift */}
                <AnimatePresence initial={false}>
                    {isActive && description && (
                        <motion.div
                            key="desc"
                            className="absolute inset-x-0 bottom-0 px-5 pb-5 pt-4"
                            style={{ background: navy }}
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <div className="h-px mb-3" style={{ background: "rgba(255,255,255,0.15)" }} />
                            <p
                                className="text-[12px] leading-relaxed"
                                style={{
                                    color: "rgba(255,255,255,0.65)",
                                    fontFamily: "'Manrope', sans-serif",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 4,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                }}
                            >
                                {description}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
