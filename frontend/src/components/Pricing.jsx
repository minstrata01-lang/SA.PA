import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const blue   = "#003D6B";
const orange = "#D97706";
const muted  = "rgba(0,61,107,0.5)";
const faint  = "rgba(0,61,107,0.06)";
const border = "rgba(0,61,107,0.1)";

const tiers = [
    {
        name: "Basic",
        price: "Rp 1.500.000",
        desc: "Cocok untuk kerusakan ringan yang belum mempengaruhi struktur utama bangunan.",
        list: ["Analisis sederhana", "Identifikasi penyebab", "Rekomendasi awal"],
        highlight: false,
    },
    {
        name: "Intermediate",
        price: "Rp 3.500.000",
        desc: "Untuk beberapa elemen struktur yang saling berkaitan dan perlu pemodelan lebih lanjut.",
        list: ["Analisis lebih lanjut", "Pemodelan software", "Perhitungan teknis dasar"],
        highlight: true,
        badge: "Direkomendasikan",
    },
    {
        name: "Advance",
        price: "Rp 7.000.000+",
        desc: "Analisis menyeluruh untuk struktur kompleks, risiko tinggi, dan kebutuhan kajian penuh.",
        list: ["Simulasi & DED", "Kajian risiko lengkap", "Remaining life assessment"],
        highlight: false,
    },
];

function CheckIcon({ highlighted }) {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <circle
                cx="7" cy="7" r="6"
                stroke={highlighted ? "rgba(255,255,255,0.3)" : "rgba(0,61,107,0.2)"}
                strokeWidth="1"
            />
            <polyline
                points="3.5,7 5.5,9.5 10.5,4.5"
                stroke={highlighted ? "#fff" : orange}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
        </svg>
    );
}

function PriceCard({ name, price, desc, list, highlight, badge, index }) {
    return (
        <motion.div
            className="flex flex-col rounded-2xl p-6 xl:p-8"
            style={{
                background: highlight ? blue : "#fff",
                border: `1px solid ${highlight ? "transparent" : border}`,
            }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: index * 0.1 }}
            whileHover={{
                y: -4,
                boxShadow: highlight
                    ? "0 16px 48px rgba(0,61,107,0.3)"
                    : "0 12px 32px rgba(0,61,107,0.1)",
            }}
        >
            {badge && (
                <span
                    className="inline-block self-start mb-4 px-3 py-1 rounded-full text-[11px] font-bold tracking-[0.12em] uppercase"
                    style={{
                        background: "rgba(255,255,255,0.15)",
                        color: "rgba(255,255,255,0.8)",
                    }}
                >
                    {badge}
                </span>
            )}

            <div
                className="text-[11px] font-bold tracking-[0.15em] uppercase mb-3"
                style={{ color: highlight ? "rgba(255,255,255,0.5)" : muted }}
            >
                {name}
            </div>

            <div
                className="font-bold-hero tracking-[-0.02em] leading-none mb-3"
                style={{
                    fontSize: "clamp(1.6rem,2.5vw,2.2rem)",
                    color: highlight ? "#fff" : blue,
                }}
            >
                {price}
            </div>

            <p
                className="text-sm leading-relaxed mb-6 pb-5"
                style={{
                    color: highlight ? "rgba(255,255,255,0.65)" : muted,
                    borderBottom: `1px solid ${highlight ? "rgba(255,255,255,0.12)" : border}`,
                }}
            >
                {desc}
            </p>

            <ul className="flex flex-col gap-3 mb-8">
                {list.map((l, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm"
                        style={{ color: highlight ? "rgba(255,255,255,0.85)" : blue }}>
                        <CheckIcon highlighted={highlight} />
                        {l}
                    </li>
                ))}
            </ul>

            <div className="mt-auto">
                <Link
                    to="/layanan"
                    className="block w-full py-3 rounded-xl text-center text-sm font-bold transition-all duration-200"
                    style={{
                        background: highlight ? "rgba(255,255,255,0.12)" : "transparent",
                        border: `1px solid ${highlight ? "rgba(255,255,255,0.2)" : border}`,
                        color: highlight ? "#fff" : blue,
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = highlight ? "rgba(255,255,255,0.2)" : faint;
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = highlight ? "rgba(255,255,255,0.12)" : "transparent";
                    }}
                >
                    Pilih {name}
                </Link>
            </div>
        </motion.div>
    );
}

export default function Pricing() {
    return (
        <section className="py-14 sm:py-16 md:py-20 xl:py-24 px-4 sm:px-6 md:px-8 bg-[#f8fafc]">
            <div style={{ maxWidth: 1120, margin: "0 auto" }}>

                {/* Section header */}
                <motion.div
                    className="mb-14 max-w-xl"
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                    <p className="text-xs font-bold tracking-[0.22em] uppercase mb-4" style={{ color: muted }}>
                        Layanan Kami
                    </p>
                    <h2
                        className="font-bold-hero text-shadow-bold leading-[1.1] tracking-[-0.025em] mb-4"
                        style={{ fontSize: "clamp(1.8rem,3.2vw,3rem)", color: blue }}
                    >
                        Tiga tingkat{" "}
                        <span style={{ color: orange }}>analisis</span>,
                        <br />satu tujuan.
                    </h2>

                    {/* Tri-line divider */}
                    <div className="flex items-center gap-3 mt-5">
                        <div className="h-px rounded-full w-12" style={{ background: "rgba(0,61,107,0.2)" }} />
                        <div className="h-[3px] rounded-full w-6" style={{ background: orange }} />
                        <div className="h-px rounded-full w-12" style={{ background: "rgba(0,61,107,0.2)" }} />
                    </div>
                </motion.div>

                {/* Cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tiers.map((t, i) => (
                        <PriceCard key={i} {...t} index={i} />
                    ))}
                </div>

                {/* Pre-assessment note */}
                <motion.p
                    className="mt-8 text-sm text-center"
                    style={{ color: muted }}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    Mulai dari{" "}
                    <strong style={{ color: blue }}>Rp500.000,-</strong>
                    {" "}untuk Pre-Assessment · Lebih hemat dibandingkan perbaikan yang tidak tepat
                </motion.p>
            </div>
        </section>
    );
}
