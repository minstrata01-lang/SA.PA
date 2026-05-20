import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function ReadMoreButton({ to = "#", children = "Baca Lebih Lanjut" }) {
    return (
        <motion.button
			whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
			className="relative inline-flex items-center justify-center min-w-40 px-6 sm:px-7 py-2.5 sm:py-3 rounded-full bg-amber-600 text-white text-sm sm:text-base font-semibold hover:bg-amber-700 transition-colors duration-200 overflow-hidden"
        >
            {/* subtle inner glow */}
            <span className="pointer-events-none absolute inset-0 bg-white/10 opacity-0" />
            <Link to={to} className="relative z-10 whitespace-nowrap">
                {children}
            </Link>
        </motion.button>
    );
}
