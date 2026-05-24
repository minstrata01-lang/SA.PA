import CardFeatures from "./Card/CardFeatures";
import { motion } from "framer-motion";

const featureData = [
    {
        title: "Basic",
        description: "Permasalahan pada bangunan dengan tingkat kerusakan ringan dan belum mempengaruhi keseluruhan struktur",
        items: [
            "Analisis sederhana terhadap kondisi bangunan",
            "Mengidentifikasi indikasi penyebab",
            "Penilaian kondisi struktur bangunan terbatas",
            "Pemodelan dengan software hanya pada bagian struktur yang mengalami kerusakan.",
            "Rekomendasi penanganan awal yang dapatdilakukan"
        ],
    },
    {
        title: "Intermediate",
        description: "Permasalahan dengan tingkat kerusakan yang melibatkan beberapa elemen strukur yang saling berkaitan",
        items: [
            "Analisis lebih lanjut terhadap kondisi bangunan",
            "Penentuan penyebab utama permasalahan",
            "Penilaian kondisi struktur bangunan lebih menyeluruh baik dari sisi kekuatan dan kestabilan",
            "Pemodelan dengan software pada bagian struktur yang saling berkaitan",
            "Perhitungan teknis dasar untuk memahami perilaku struktur ",
            "Rekomendasi penanganan yang tepat dan terarah ",
        ],
    },
    {
        title: "Advance",
        description: "Permasalahan dengan tingkat kerusakan serius dan berdampak pada kestabilan bangunan secara keseluruhan",
        items: [
            "Analisis mendalam terhadap kondisi bangunan",
            "Penilaian menyeluruh terhadap struktur bangunan termasuk pada pada bagian fondasi.",
            "Pemodelan dengan software pada struktur secara detail dan menyeluruh",
            "Perhitungan teknis lanjutan untuk memastikan keamanan struktur",
            "Kajian risiko dan potensi kegagalan ",
            "Perbandingan beberapa metode penanganan ",
            "Memperkiraan umur dan kinerja bangunan ke depan (Remaining life assessment) ",
            "Rekomendasi solusi secara menyeluruh ",
        ],
    },
];

const headingGroup = {
    hidden:   { opacity: 0 },
    visible:  { opacity: 1, transition: { staggerChildren: 0.14, delayChildren: 0.1 } },
};
const headingItem = {
    hidden:  { opacity: 0, y: 35 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: "easeOut" } },
};
const containerVariants = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.18, delayChildren: 0.15 } },
};
const cardVariants = {
    hidden:  { opacity: 0, y: 50, scale: 0.93 },
    visible: { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

export default function Features({ embedded = false }) {
    return (
        <section className={`relative w-full overflow-hidden ${embedded ? "py-2 sm:py-4" : "py-14 sm:py-16 md:py-20"} font-[Inter,Montserrat,sans-serif]`}>
            <div className={`relative z-10 ${embedded ? "px-0" : "px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24"}`}>

                {/* Section header */}
                <motion.div
                    className="mb-8 sm:mb-10"
                    variants={headingGroup}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                >
                    <motion.h2
                        className="text-2xl sm:text-3xl md:text-4xl xl:text-5xl font-extrabold text-center text-[#003D6B] mb-4"
                        variants={headingItem}
                    >
                        Rekomendasi Layanan Sesuai Hasil Diagnosa
                    </motion.h2>
                    <motion.p
                        className="text-center text-base sm:text-lg text-[#003D6B]/70 max-w-2xl mx-auto leading-relaxed"
                        variants={headingItem}
                    >
                        Berdasarkan hasil Pre-Assessment, kami akan membantu menentukan layanan yang paling sesuai untuk memastikan penanganan yang tepat. Tingkat analisis yang dibutuhkan dapat berbeda pada tergantung tingkat kerumitan permasalahan,
                    </motion.p>
                    <motion.div
                        className="mx-auto mt-6 flex items-center gap-3 w-fit"
                        variants={headingItem}
                    >
                        <div className="w-12 h-0.5 rounded-full bg-[#003D6B]/20" />
                        <div className="w-6 h-0.75 rounded-full bg-[#B8860B]" />
                        <div className="w-12 h-0.5 rounded-full bg-[#003D6B]/20" />
                    </motion.div>
                </motion.div>

                {/* Cards grid */}
                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                >
                    {featureData.map((feature, i) => (
                        <motion.div key={i} variants={cardVariants} className="h-full">
                            <CardFeatures
                                title={feature.title}
                                description={feature.description}
                                items={feature.items}
                            />
                        </motion.div>
                    ))}
                </motion.div>
                <p className="mt-6 text-center text-xs sm:text-sm md:text-base leading-relaxed text-gray-600 px-2 sm:px-4 md:px-0">
                    * Assessment tersedia mulai dari Rp 1.500.000 (menyesuaikan tingkat kerusakan berdasarkan hasil Pre-Assessment)
                </p>
            </div>
        </section>
    );
}

