import { Mail, MapPin, Phone } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import logoSrc from "/LOGO_SAPA_1.png";

/* ── Instagram SVG ── */
function InstagramIcon({ size = 16 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
    );
}

/* ── TikTok SVG ── */
function TikTokIcon({ size = 16 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.75a8.17 8.17 0 0 0 4.78 1.52V6.83a4.85 4.85 0 0 1-1.01-.14z"/>
        </svg>
    );
}

/* ── LinkedIn SVG ── */
function LinkedInIcon({ size = 16 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.05-1.86-3.05-1.86 0-2.14 1.45-2.14 2.95v5.67H9.33V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z"/>
        </svg>
    );
}

/* ── Data ── */
const SOCIAL_LINKS = [
    { label: "Instagram", href: "https://www.instagram.com/stratalift?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==", icon: <InstagramIcon />, hoverBg: "#E1306C" },
    { label: "TikTok",    href: "https://www.tiktok.com/@stratalift?is_from_webapp=1&sender_device=pc",   icon: <TikTokIcon />,   hoverBg: "#010101" },
    { label: "LinkedIn",  href: "https://www.linkedin.com/company/pt-stratalift-solusi-indonesia/posts/?feedView=all", icon: <LinkedInIcon />, hoverBg: "#0A66C2" },
];

const CONTACT_ITEMS = [
    { Icon: Mail,   text: "contact@stratalift.co.id", href: "mailto:contact@stratalift.co.id" },
    { Icon: MapPin, text: "Jakarta Timur, Indonesia",  href: "https://maps.app.goo.gl/me7SiBxTbuyrM3Hg9" },
    { Icon: Phone,  text: "+62 881-0105-12829",   href: "https://wa.me/62881010512829" },
];

/* ── Animation variants ── */
const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.15, delayChildren: 0.05 } },
};
const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function Footer() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, amount: 0.15 });

    return (
        <footer
            ref={ref}
            className="w-full bg-slate-50 border-t border-gray-200"
            style={{ fontFamily: "'Inter', 'Geist', sans-serif" }}
        >
            {/* ── Main content ── */}
            <motion.div
                className="w-full px-6 sm:px-10 lg:px-16 pt-10 pb-8 md:pt-12 flex flex-col md:flex-row items-center md:items-start justify-center gap-8 md:gap-16 lg:gap-24"
                variants={container}
                initial="hidden"
                animate={inView ? "show" : "hidden"}
            >
                {/* ── Left: Brand ── */}
                <motion.div variants={fadeUp} className="flex flex-col items-center md:items-start gap-5 text-center md:text-left w-full max-w-xs">
                    <motion.img
                        src={logoSrc}
                        alt="Stratalift Solutions"
                        className="w-44 sm:w-52 h-auto object-contain"
                        whileHover={{ scale: 1.03 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    />

                    <p className="text-sm text-gray-500 leading-relaxed">
                        Seasoned expertise meets a new standar of service. Providing precise consulting and reliable oversight for Indonesia’s infrastructure.
                    </p>

                    {/* Social icons */}
                    <div className="flex items-center justify-center md:justify-start gap-2 pt-1">
                        {SOCIAL_LINKS.map((s) => (
                            <motion.a
                                key={s.label}
                                href={s.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={s.label}
                                className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 text-gray-500"
                                whileHover={{ scale: 1.1, backgroundColor: s.hoverBg, color: "#fff" }}
                                whileTap={{ scale: 0.93 }}
                                transition={{ type: "spring", stiffness: 340, damping: 20 }}
                            >
                                {s.icon}
                            </motion.a>
                        ))}
                    </div>
                </motion.div>

                {/* ── Right: Contact ── */}
                <motion.div variants={fadeUp} className="flex flex-col items-center md:items-start gap-5 text-center md:text-left">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                        Contact Us
                    </h3>
                    <ul className="flex flex-col gap-3">
                        {CONTACT_ITEMS.map(({ Icon, text, href }) => (
                            <li key={text}>
                                <a
                                    href={href}
                                    className="flex items-center gap-3 group"
                                >
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-500 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                                        <Icon size={15} />
                                    </span>
                                    <span className="text-sm text-gray-600 group-hover:text-blue-700 transition-colors duration-150">
                                        {text}
                                    </span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </motion.div>
            </motion.div>

            {/* ── Bottom bar ── */}
            <div className="border-t border-gray-200">
                <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p className="text-xs text-gray-400">
                        © {new Date().getFullYear()} SA.PA powered by Stratalift Solutions. v.1.0.0
                    </p>
                    <p className="text-xs text-gray-300">
                        made with ❤️ in Indonesia
                    </p>
                </div>
            </div>
        </footer>
    );
}

