import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import CardConsultant from "./Card/CardConsultant";
import { useConsultants } from "../hooks/useConsultants";

const navy   = "#001C38";
const orange = "#D97706";
const muted  = "rgba(255,255,255,0.5)";
const rule   = "rgba(255,255,255,0.1)";

const CYCLE_MS = 2600;

export default function Team() {
    const { data: consultants, loading } = useConsultants();
    const [autoIdx,      setAutoIdx]      = useState(0);
    const [userPaused,   setUserPaused]   = useState(false);
    const intervalRef = useRef(null);

    /* ── Auto-cycle through cards ── */
    useEffect(() => {
        if (userPaused || loading || consultants.length === 0) {
            clearInterval(intervalRef.current);
            return;
        }
        intervalRef.current = setInterval(() => {
            setAutoIdx(i => (i + 1) % consultants.length);
        }, CYCLE_MS);
        return () => clearInterval(intervalRef.current);
    }, [userPaused, loading, consultants.length]);

    return (
        <section
            className="overflow-hidden relative"
            style={{
                background: navy,
                /* Grid lines */
                backgroundImage: `
                    linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)
                `,
                backgroundSize: "52px 52px",
            }}
        >
            {/* Radial vignette over the grid so edges fade to solid navy */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: `radial-gradient(ellipse 80% 60% at 50% 0%, transparent 40%, ${navy} 100%)`,
                    zIndex: 0,
                }}
            />

            {/* Content sits above the vignette */}
            <div className="relative" style={{ zIndex: 1 }}>

                {/* ── Header band ── */}
                <div className="px-4 sm:px-6 md:px-8 pt-14 sm:pt-16 pb-8 sm:pb-10">
                    <div style={{ maxWidth: 1120, margin: "0 auto" }}>
                        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">

                            <motion.div
                                className="max-w-xl"
                                initial={{ opacity: 0, y: 28 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.3 }}
                                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                            >
                                <p
                                    className="text-[11px] font-bold tracking-[0.26em] uppercase mb-5"
                                    style={{ color: orange, fontFamily: "'Manrope', sans-serif" }}
                                >
                                    Our People
                                </p>
                                <h2
                                    className="font-bold-hero leading-[1.08] tracking-[-0.03em] text-white"
                                    style={{ fontSize: "clamp(2rem, 3.8vw, 3.6rem)" }}
                                >
                                    Tim ahli yang<br />
                                    <span style={{ color: orange }}>mendorong</span> solusi.
                                </h2>
                            </motion.div>

                            <motion.p
                                className="text-base leading-relaxed max-w-xs md:max-w-sm md:text-right pb-1"
                                style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.3 }}
                                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                            >
                                Dipercaya oleh para ahli teknik sipil berpengalaman dan bersertifikat, setiap proyek didukung keahlian mendalam.
                            </motion.p>
                        </div>

                        <div className="mt-8 h-px" style={{ background: rule }} />
                    </div>
                </div>

                {/* ── Cards — full-width, edge-to-edge ── */}
                <div
                    className="w-full pb-0"
                    onMouseEnter={() => setUserPaused(true)}
                    onMouseLeave={() => setUserPaused(false)}
                >
                    <div
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
                        style={{ gap: "1px", background: rule }}
                    >
                        {loading ? (
                            <div className="col-span-5 flex items-center justify-center py-20">
                                <div className="w-8 h-8 border-4 border-white/20 border-t-white/60 rounded-full animate-spin" />
                            </div>
                        ) : consultants.map((consultant, i) => (
                            <motion.div
                                key={consultant.id}
                                style={{ background: navy }}
                                initial={{ opacity: 0, y: 28 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.1 }}
                                transition={{
                                    duration: 0.65,
                                    ease: [0.22, 1, 0.36, 1],
                                    delay: i * 0.09,
                                }}
                            >
                                <CardConsultant
                                    name={consultant.name}
                                    title={consultant.title}
                                    description={consultant.description}
                                    photo_url={consultant.photo_url}
                                    isAutoHovered={!userPaused && autoIdx === i}
                                />
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Bottom rule */}
                <div className="h-px" style={{ background: rule }} />
            </div>
        </section>
    );
}
