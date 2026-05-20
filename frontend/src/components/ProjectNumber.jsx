import { useEffect, useRef, useState } from "react";
import NumberFlow from "@number-flow/react";
import { motion } from "framer-motion";

const navy   = "#001C38";
const orange = "#D97706";
const muted  = "rgba(255,255,255,0.45)";
const rule   = "rgba(255,255,255,0.1)";

const stats = [
    { end: 10,   suffix: "+", label: "Tahun pengalaman" },
    { end: 1500, suffix: "+", label: "Proyek selesai"   },
    { end: 25,   suffix: "+", label: "Klien puas"       },
    { end: null, suffix: "",  label: "Dukungan klien", static: "24/7" },
];

function StatCell({ end, suffix, label, static: staticVal, index, triggered, isLast }) {
    const value = triggered ? (end ?? 0) : 0;
    return (
        <motion.div
            className="flex flex-col items-center justify-center py-12 px-6"
            style={{ borderRight: isLast ? "none" : `1px solid ${rule}` }}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: index * 0.08 }}
        >
            <div
                className="font-bold-hero leading-none tracking-tighter mb-2"
                style={{ fontSize: "clamp(2.2rem, 3.2vw, 3rem)", color: orange }}
            >
                {staticVal ? (
                    <span>{staticVal}</span>
                ) : (
                    <NumberFlow
                        value={value}
                        suffix={suffix}
                        trend={1}
                        transformTiming={{ duration: 3000 + index * 400, easing: "cubic-bezier(0.16,1,0.3,1)" }}
                        spinTiming={{ duration: 3000 + index * 400, easing: "cubic-bezier(0.16,1,0.3,1)" }}
                        opacityTiming={{ duration: 600, easing: "ease-out" }}
                    />
                )}
            </div>
            <div
                className="text-sm tracking-wide"
                style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}
            >
                {label}
            </div>
        </motion.div>
    );
}

export default function ProjectNumber() {
    const sectionRef = useRef(null);
    const [triggered, setTriggered] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setTriggered(true); observer.disconnect(); } },
            { threshold: 0.4 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={sectionRef} style={{ background: navy }}>
            {/* Top rule */}
            <div className="h-px" style={{ background: rule }} />
            <div
                className="mx-auto grid grid-cols-2 lg:grid-cols-4"
                style={{ maxWidth: 1120 }}
            >
                {stats.map((s, i) => (
                    <StatCell key={i} {...s} index={i} triggered={triggered} isLast={i === stats.length - 1} />
                ))}
            </div>
            {/* Bottom rule */}
            <div className="h-px" style={{ background: rule }} />
        </div>
    );
}
