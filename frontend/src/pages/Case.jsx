// frontend/src/pages/Case.jsx
import { useSearchParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import CardCase from "../components/Card/CardCase";
import Pagination from "../components/ui/Pagination";
import { useCases } from "../hooks/useCases";
import SEO from "../components/SEO";

const blue   = "#003D6B";
const orange = "#D97706";
const muted  = "rgba(0,61,107,0.72)";
const rule   = "rgba(0,61,107,0.1)";
const PAGE_SIZE = 9;

const EASE = [0.22, 1, 0.36, 1];

function Case() {
    const prefersReduced = useReducedMotion();
    const [searchParams, setSearchParams] = useSearchParams();
    const rawPage = parseInt(searchParams.get('page') ?? '1', 10);
    const currentPage = Number.isNaN(rawPage) ? 1 : Math.max(1, rawPage);

    const { data: cases, totalCount, loading, error } = useCases({ page: currentPage, pageSize: PAGE_SIZE });

    const handlePageChange = (page) => {
        setSearchParams({ page: String(page) });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading) {
        return (
            <section className="bg-white pt-28 pb-14 px-4 sm:px-6 md:px-8 flex items-center justify-center" style={{ minHeight: '60vh' }}>
                <div className="w-8 h-8 border-4 border-slate-200 border-t-[#F58220] rounded-full animate-spin" />
            </section>
        );
    }

    if (error) {
        return (
            <section className="bg-white pt-28 pb-14 px-4 sm:px-6 md:px-8 flex items-center justify-center" style={{ minHeight: '60vh' }}>
                <p className="text-sm" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
                    Gagal memuat data. Silakan coba lagi.
                </p>
            </section>
        );
    }

    return (
        <section className="bg-white pt-28 pb-14 px-4 sm:px-6 md:px-8">
            <SEO
                title="Studi Kasus Struktural"
                description="Pelajari berbagai kasus kerusakan dan masalah struktural bangunan yang pernah ditangani tim SA.PA. Temukan solusi berbasis data akurat untuk masalah bangunan Anda."
                canonical="/case"
            />
            <div style={{ maxWidth: 1120, margin: "0 auto" }}>

                {/* Header */}
                <motion.div
                    className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-0"
                    initial={{ opacity: 0, y: prefersReduced ? 0 : 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: EASE }}
                >
                    <div className="max-w-lg">
                        <p
                            className="text-[11px] font-bold tracking-[0.26em] uppercase mb-5"
                            style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}
                        >
                            Catatan Kasus
                        </p>
                        <h1
                            className="font-bold-hero leading-[1.08] tracking-[-0.03em]"
                            style={{ fontSize: "clamp(2rem, 3.5vw, 3.2rem)", color: blue }}
                        >
                            Kenali Masalahnya,{" "}
                            <span style={{ color: orange }}>Temukan</span> Solusinya.
                        </h1>
                    </div>

                    <p
                        className="text-base leading-relaxed max-w-xs pb-1"
                        style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}
                    >
                        Pelajari berbagai kasus kebocoran dan kerusakan bangunan yang sering muncul,
                        agar Anda bisa mengambil keputusan perbaikan secara tepat dan terukur.
                    </p>
                </motion.div>

                {/* Rule */}
                <div className="mt-8 mb-8 h-px" style={{ background: rule }} />

                {/* Cards grid */}
                <div className="grid gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                    {cases.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: prefersReduced ? 0 : 28 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.15 }}
                            transition={{ duration: 0.6, delay: index * 0.07, ease: EASE }}
                        >
                            <CardCase
                                img={item.cover_image_url}
                                title={item.title}
                                description={item.summary}
                                to={`/case/${item.slug}`}
                                index={index}
                            />
                        </motion.div>
                    ))}
                </div>

                {/* Pagination */}
                <Pagination
                    totalCount={totalCount}
                    pageSize={PAGE_SIZE}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                />
            </div>
        </section>
    );
}

export default Case;
