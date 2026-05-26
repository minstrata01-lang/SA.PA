import { motion } from "framer-motion";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import CardConsultant from "./Card/CardConsultant";
import { useConsultants } from "../hooks/useConsultants";

const navy    = "#001C38";
const orange  = "#D97706";
const muted   = "rgba(255,255,255,0.5)";
const rule    = "rgba(255,255,255,0.1)";
const CYCLE_MS = 3200;

export default function Team() {
    const { data: consultants, loading } = useConsultants();
    const n = consultants.length;

    // Render cards 3× so we can silently jump within the middle set
    const tripled = useMemo(
        () => [...consultants, ...consultants, ...consultants],
        [consultants]
    );

    const [activeIdx,  setActiveIdx]  = useState(0);
    const [userPaused, setUserPaused] = useState(false);
    const trackRef    = useRef(null);
    const intervalRef = useRef(null);
    const isJumping   = useRef(false);

    /* ── scroll helpers ── */
    const scrollToCard = useCallback((domIdx, smooth = true) => {
        const track = trackRef.current;
        if (!track) return;
        const card = track.children[domIdx];
        if (!card) return;
        if (smooth) {
            track.scrollTo({ left: card.offsetLeft, behavior: "smooth" });
        } else {
            isJumping.current = true;
            track.scrollLeft  = card.offsetLeft;
            isJumping.current = false;
        }
    }, []);

    /* ── Init: jump to start of middle set (no animation) ── */
    useEffect(() => {
        if (!loading && n > 0) {
            requestAnimationFrame(() => scrollToCard(n, false));
        }
    }, [loading, n, scrollToCard]);

    /* ── Infinite loop: silently teleport when entering clone zones ── */
    useEffect(() => {
        const track = trackRef.current;
        if (!track || n === 0) return;

        const onScroll = () => {
            if (isJumping.current) return;

            const midStart = track.children[n]?.offsetLeft;
            const endStart = track.children[2 * n]?.offsetLeft;
            if (midStart == null || endStart == null) return;

            const setWidth = endStart - midStart;

            // Entered the end-clone zone → jump back to middle set
            if (track.scrollLeft >= endStart) {
                isJumping.current = true;
                track.scrollLeft -= setWidth;
                isJumping.current = false;
            // Entered the beginning-clone zone → jump forward to middle set
            } else if (track.scrollLeft < midStart) {
                isJumping.current = true;
                track.scrollLeft += setWidth;
                isJumping.current = false;
            }

            // Sync dot indicator with visible card
            const step = track.children[1]
                ? track.children[1].offsetLeft - track.children[0].offsetLeft
                : 1;
            const relative = track.scrollLeft - midStart;
            const idx = Math.round(relative / step);
            setActiveIdx(((idx % n) + n) % n);
        };

        track.addEventListener("scroll", onScroll, { passive: true });
        return () => track.removeEventListener("scroll", onScroll);
    }, [n]);

    /* ── Auto-cycle: always scrolls right (infinite forward) ── */
    useEffect(() => {
        if (userPaused || loading || n === 0) {
            clearInterval(intervalRef.current);
            return;
        }
        intervalRef.current = setInterval(() => {
            setActiveIdx(prev => {
                const next = (prev + 1) % n;
                if (prev === n - 1) {
                    // Scroll into first card of end-clone; onScroll handler jumps back seamlessly
                    scrollToCard(2 * n, true);
                } else {
                    scrollToCard(n + next, true);
                }
                return next;
            });
        }, CYCLE_MS);
        return () => clearInterval(intervalRef.current);
    }, [userPaused, loading, n, scrollToCard]);

    /* ── Arrow navigation ── */
    const go = useCallback((dir) => {
        if (!n) return;
        setUserPaused(true);
        setActiveIdx(prev => {
            const next = (prev + dir + n) % n;
            if (dir > 0 && prev === n - 1) {
                scrollToCard(2 * n, true);       // forward wrap via end-clone (smooth)
            } else if (dir < 0 && prev === 0) {
                scrollToCard(2 * n - 1, false);  // backward wrap: instant jump to last
            } else {
                scrollToCard(n + next, true);
            }
            return next;
        });
    }, [n, scrollToCard]);

    /* ── Dot jump ── */
    const goTo = useCallback((idx) => {
        setUserPaused(true);
        setActiveIdx(idx);
        scrollToCard(n + idx, true);
    }, [n, scrollToCard]);

    return (
        <section
            className="overflow-hidden relative"
            style={{
                background: navy,
                backgroundImage: `
                    linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)
                `,
                backgroundSize: "52px 52px",
            }}
        >
            <style>{`.__team_track::-webkit-scrollbar { display: none; }`}</style>

            {/* Radial vignette */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: `radial-gradient(ellipse 80% 60% at 50% 0%, transparent 40%, ${navy} 100%)`,
                    zIndex: 0,
                }}
            />

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

                            <motion.div
                                className="flex flex-col md:items-end gap-5 pb-1"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.3 }}
                                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                            >
                                <p
                                    className="text-base leading-relaxed max-w-xs md:max-w-sm md:text-right"
                                    style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}
                                >
                                    Dipercaya oleh para ahli teknik sipil berpengalaman dan bersertifikat, setiap proyek didukung keahlian mendalam.
                                </p>

                                {/* Arrow nav + counter */}
                                <div className="flex items-center gap-3">
                                    <motion.button
                                        onClick={() => go(-1)}
                                        className="flex items-center justify-center w-11 h-11 rounded-full shrink-0"
                                        style={{
                                            borderWidth: "1px",
                                            borderStyle: "solid",
                                            borderColor: "rgba(255,255,255,0.18)",
                                            background: "rgba(255,255,255,0.05)",
                                            color: "rgba(255,255,255,0.65)",
                                        }}
                                        whileHover={{ background: orange, borderColor: orange, color: "#fff" }}
                                        whileTap={{ scale: 0.92 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                                            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </motion.button>

                                    {!loading && (
                                        <span
                                            className="text-xs font-bold tabular-nums"
                                            style={{ color: muted, fontFamily: "'Manrope', sans-serif", minWidth: 48, textAlign: "center" }}
                                        >
                                            {String(activeIdx + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
                                        </span>
                                    )}

                                    <motion.button
                                        onClick={() => go(1)}
                                        className="flex items-center justify-center w-11 h-11 rounded-full shrink-0"
                                        style={{
                                            borderWidth: "1px",
                                            borderStyle: "solid",
                                            borderColor: "rgba(255,255,255,0.18)",
                                            background: "rgba(255,255,255,0.05)",
                                            color: "rgba(255,255,255,0.65)",
                                        }}
                                        whileHover={{ background: orange, borderColor: orange, color: "#fff" }}
                                        whileTap={{ scale: 0.92 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                                            <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </motion.button>
                                </div>
                            </motion.div>
                        </div>

                        <div className="mt-8 h-px" style={{ background: rule }} />
                    </div>
                </div>

                {/* ── Infinite slider track ── */}
                <div
                    ref={trackRef}
                    className="__team_track flex"
                    style={{
                        overflowX: "auto",
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                        gap: "1px",
                        background: rule,
                        position: "relative",
                    }}
                    onMouseEnter={() => setUserPaused(true)}
                    onMouseLeave={() => setUserPaused(false)}
                >
                    {loading ? (
                        <div
                            className="flex items-center justify-center py-20"
                            style={{ minWidth: "100%", background: navy }}
                        >
                            <div className="w-8 h-8 border-4 border-white/20 border-t-white/60 rounded-full animate-spin" />
                        </div>
                    ) : tripled.map((consultant, i) => (
                        <div
                            key={i}
                            style={{
                                background: navy,
                                flexShrink: 0,
                                width: "clamp(260px, 28vw, 310px)",
                            }}
                        >
                            <CardConsultant
                                name={consultant.name}
                                title={consultant.title}
                                description={consultant.description}
                                photo_url={consultant.photo_url}
                                isAutoHovered={!userPaused && (i % n) === activeIdx}
                            />
                        </div>
                    ))}
                </div>

                {/* ── Progress bar + dot indicators ── */}
                <div className="px-4 sm:px-6 md:px-8 py-5">
                    <div style={{ maxWidth: 1120, margin: "0 auto" }} className="flex items-center gap-5">

                        {/* Auto-play progress bar */}
                        <div className="flex-1 h-px relative overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                            {!loading && !userPaused && (
                                <motion.div
                                    key={`${activeIdx}-play`}
                                    className="absolute inset-y-0 left-0 w-full"
                                    style={{ background: orange, transformOrigin: "left" }}
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ duration: CYCLE_MS / 1000, ease: "linear" }}
                                />
                            )}
                        </div>

                        {/* Dots */}
                        {!loading && (
                            <div className="flex items-center gap-1.5 shrink-0">
                                {consultants.map((c, i) => (
                                    <button
                                        key={i}
                                        onClick={() => goTo(i)}
                                        aria-label={`Tampilkan konsultan ${c.name || i + 1}`}
                                        style={{
                                            width: activeIdx === i ? 20 : 5,
                                            height: 5,
                                            borderRadius: 3,
                                            background: activeIdx === i ? orange : "rgba(255,255,255,0.2)",
                                            transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
                                            border: "none",
                                            cursor: "pointer",
                                            padding: 0,
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom rule */}
                <div className="h-px" style={{ background: rule }} />
            </div>
        </section>
    );
}
