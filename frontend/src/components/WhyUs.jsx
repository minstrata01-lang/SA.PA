import { motion } from "framer-motion";
import { useState } from "react";
import iconPrecision from "../assets/whyUsImage/icon-precision.svg";
import iconStandard from "../assets/whyUsImage/icon-standard.svg";
import iconEfficiency from "../assets/whyUsImage/icon-efficiency.svg";
import iconTeam from "../assets/whyUsImage/icon-team.svg";

const blue   = "#003D6B";
const orange = "#D97706";
const muted  = "rgba(0,61,107,0.5)";
const rule   = "rgba(0,61,107,0.1)";
const EASE   = [0.22, 1, 0.36, 1];

const items = [
    {
        icon: iconPrecision,
        num: "01",
        title: "Analisa Presisi Tinggi",
        body: "Kami menggunakan teknologi pemindaian dan pemodelan terbaru untuk memastikan setiap dimensi proyek dihitung dengan akurasi maksimal, meminimalisir risiko kesalahan struktur di lapangan.",
    },
    {
        icon: iconStandard,
        num: "02",
        title: "Sesuai Standar dan Peraturan yang Berlaku",
        body: "Seluruh material dan metodologi kerja kami telah tersertifikasi dan memenuhi standar nasional Indonesia, menjamin keamanan jangka panjang serta kepatuhan hukum bagi aset properti Anda.",
    },
    {
        icon: iconEfficiency,
        num: "03",
        title: "Efisiensi Biaya Tanpa Kompromi",
        body: "Mendapatkan hasil maksimal tidak selalu harus menguras anggaran. Kami percaya bahwa efisiensi biaya dimulai dari pengerjaan yang benar sejak awal.",
    },
    {
        icon: iconTeam,
        num: "04",
        title: "Tim Ahli Bersertifikat",
        body: "Proyek Anda ditangani oleh tenaga profesional dengan lisensi resmi dan pengalaman bertahun-tahun di bidangnya, memastikan pengerjaan efisien dan berkualitas tinggi.",
    },
];

function WhyCard({ icon, num, title, body, index }) {
    const [hovered, setHovered] = useState(false);

    return (
        <motion.div
            className="relative flex flex-col gap-5 px-6 py-7 cursor-default overflow-hidden"
            style={{
                border: `1px solid ${hovered ? "rgba(0,61,107,0.18)" : rule}`,
                transition: "border-color 0.25s ease, box-shadow 0.25s ease",
                boxShadow: hovered
                    ? "0 8px 32px rgba(0,61,107,0.08)"
                    : "0 2px 8px rgba(0,61,107,0.03)",
            }}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: EASE, delay: index * 0.08 }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Hover background fill */}
            <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "rgba(0,61,107,0.025)", originY: 1 }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: hovered ? 1 : 0 }}
                transition={{ duration: 0.35, ease: EASE }}
            />

            {/* Top orange accent bar */}
            <motion.div
                className="absolute top-0 left-0 right-0 h-[3px]"
                style={{ background: orange, transformOrigin: "left" }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: hovered ? 1 : 0 }}
                transition={{ duration: 0.3, ease: EASE }}
            />

            {/* Number */}
            <span
                className="text-[10px] font-bold tracking-[0.22em] uppercase"
                style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}
            >
                {num}
            </span>

            {/* Icon */}
            <motion.div
                className="w-10 h-10 flex items-center justify-center shrink-0"
                style={{ borderRadius: 10 }}
                animate={{
                    background: hovered ? "rgba(217,119,6,0.12)" : "rgba(0,61,107,0.06)",
                    scale: hovered ? 1.06 : 1,
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
            >
                <img src={icon} alt="" className="w-5 h-5 opacity-90" />
            </motion.div>

            {/* Title + separator + body */}
            <div className="flex flex-col gap-3">
                <h3
                    className="font-bold leading-snug tracking-[-0.01em]"
                    style={{
                        fontSize: "clamp(0.9rem, 1.1vw, 1rem)",
                        color: blue,
                        fontFamily: "'Manrope', sans-serif",
                    }}
                >
                    {title}
                </h3>

                <div className="flex items-center gap-2">
                    <div className="h-px w-6" style={{ background: orange }} />
                    <div className="w-1 h-1 rounded-full" style={{ background: "rgba(0,61,107,0.2)" }} />
                </div>

                <motion.p
                    className="text-sm leading-relaxed"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                    animate={{ color: hovered ? "rgba(0,61,107,0.7)" : muted }}
                    transition={{ duration: 0.25 }}
                >
                    {body}
                </motion.p>
            </div>
        </motion.div>
    );
}

export default function WhyUs() {
    return (
        <section className="py-12 sm:py-14 md:py-16 xl:py-20 px-4 sm:px-6 md:px-8 bg-white">
            <div style={{ maxWidth: 1120, margin: "0 auto" }}>

                {/* Header */}
                <motion.div
                    className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-0"
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7, ease: EASE }}
                >
                    <div className="max-w-lg">
                        <p
                            className="text-[11px] font-bold tracking-[0.26em] uppercase mb-5"
                            style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}
                        >
                            Mengapa Kami
                        </p>
                        <h2
                            className="font-bold-hero text-shadow-bold leading-[1.08] tracking-[-0.03em]"
                            style={{ fontSize: "clamp(2rem, 3.5vw, 3.2rem)", color: blue }}
                        >
                            Kepercayaan Anda adalah{" "}
                            <span style={{ color: orange }}>fondasi</span> kami.
                        </h2>
                    </div>
                    <p
                        className="text-base leading-relaxed max-w-xs pb-1"
                        style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}
                    >
                        Empat prinsip yang memandu setiap proyek dari diagnosis awal hingga laporan akhir.
                    </p>
                </motion.div>

                <div className="mt-8 h-px" style={{ background: rule }} />

                {/* Cards grid */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                    {items.map((it, i) => (
                        <WhyCard key={i} {...it} index={i} />
                    ))}
                </div>
            </div>
        </section>
    );
}
