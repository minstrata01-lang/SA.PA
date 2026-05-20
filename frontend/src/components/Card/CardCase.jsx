import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import OptimizedImage from "../OptimizedImage";
import ArrowRight from "../../assets/arrowRight.svg?react";

const blue   = "#003D6B";
const orange = "#D97706";
const muted  = "rgba(0,61,107,0.5)";
const EASE   = [0.22, 1, 0.36, 1];

export default function CardCase({ img, title, description, to, index = 0 }) {
    const [hovered, setHovered] = useState(false);

    return (
        <motion.div
            className="relative flex flex-col w-full bg-white overflow-hidden"
            style={{
                border: `1px solid ${hovered ? "rgba(0,61,107,0.2)" : "rgba(0,61,107,0.1)"}`,
                transition: "border-color 0.25s ease, box-shadow 0.25s ease",
                boxShadow: hovered
                    ? "0 12px 40px rgba(0,61,107,0.1)"
                    : "0 2px 12px rgba(0,61,107,0.04)",
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Orange accent bar on top — animates in on hover */}
            <motion.div
                className="absolute top-0 left-0 right-0 h-[3px] z-10"
                style={{ background: orange, transformOrigin: "left" }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: hovered ? 1 : 0 }}
                transition={{ duration: 0.3, ease: EASE }}
            />

            {/* Image */}
            <div className="relative w-full overflow-hidden" style={{ height: 240 }}>
                <motion.div
                    className="w-full h-full"
                    animate={{ scale: hovered ? 1.04 : 1 }}
                    transition={{ duration: 0.55, ease: EASE }}
                >
                    <OptimizedImage
                        src={img}
                        alt={title}
                        className="w-full h-full object-cover object-center"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 384px"
                    />
                </motion.div>

                {/* Case Study badge */}
                <div
                    className="absolute left-4 bottom-4 inline-flex items-center gap-1.5 px-3 py-1"
                    style={{
                        background: "rgba(255,255,255,0.92)",
                        border: "1px solid rgba(0,61,107,0.12)",
                    }}
                >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: orange }} />
                    <span
                        className="text-[10px] font-bold uppercase tracking-[0.2em]"
                        style={{ color: blue, fontFamily: "'Manrope', sans-serif" }}
                    >
                        Case Study
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-3 px-5 pt-5 pb-6">
                {/* Index number */}
                <span
                    className="text-[10px] font-bold tracking-[0.2em] uppercase"
                    style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}
                >
                    {String(index + 1).padStart(2, "0")}
                </span>

                <h3
                    className="font-bold leading-snug tracking-[-0.02em]"
                    style={{
                        fontSize: "clamp(1rem, 1.4vw, 1.15rem)",
                        color: blue,
                        fontFamily: "'Manrope', sans-serif",
                    }}
                >
                    {title}
                </h3>

                {/* Separator */}
                <div className="flex items-center gap-2">
                    <div className="h-px w-8" style={{ background: orange }} />
                    <div className="w-1 h-1 rounded-full" style={{ background: "rgba(0,61,107,0.25)" }} />
                </div>

                <p
                    className="text-sm leading-relaxed"
                    style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}
                >
                    {description}
                </p>

                {/* CTA link */}
                <Link
                    to={to}
                    className="inline-flex items-center gap-2 mt-1 group"
                    style={{ width: "fit-content" }}
                >
                    <span
                        className="text-sm font-semibold"
                        style={{
                            color: hovered ? orange : blue,
                            fontFamily: "'Manrope', sans-serif",
                            transition: "color 0.2s ease",
                        }}
                    >
                        Baca Selengkapnya
                    </span>
                    <motion.span
                        animate={{ x: hovered ? 4 : 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="flex items-center"
                    >
                        <ArrowRight
                            className="w-3 h-3"
                            style={{ fill: hovered ? orange : blue, transition: "fill 0.2s ease" }}
                        />
                    </motion.span>
                </Link>
            </div>
        </motion.div>
    );
}
