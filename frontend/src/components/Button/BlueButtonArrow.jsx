import ArrowRight from "../../assets/arrowRight.svg?react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";

const MotionLink = motion(Link);

export default function BlueButtonArrow({ buttonText, to = "/", large = false }) {
    const [isHovered, setIsHovered] = useState(false);

    const h        = large ? 54 : 46;
    const pl       = large ? 26 : 20;
    const pr       = large ? 16 : 12;
    const fontSize = large ? 15 : 14;
    const chipSize = large ? 36 : 30;
    const iconSize = large ? "w-4 h-4" : "w-3.5 h-3.5";

    return (
        <MotionLink
            to={to}
            className="relative flex items-center gap-3 cursor-pointer focus:outline-none text-white rounded-full overflow-hidden"
            style={{
                height: h,
                paddingLeft: pl,
                paddingRight: pr,
                background: isHovered ? "#005599" : "#0066B3",
            }}
            animate={{
                scale: isHovered ? 1.03 : 1,
                boxShadow: isHovered
                    ? "0 0 28px rgba(0,102,179,0.5)"
                    : "0 0 0px rgba(0,102,179,0)",
            }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            whileTap={{ scale: 0.97 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Shine sweep */}
            <motion.span
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)",
                    width: "60%",
                }}
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 4.4, ease: "linear" }}
            />

            {/* Label */}
            <span
                className="relative z-10 whitespace-nowrap font-semibold"
                style={{ fontSize, fontFamily: "'Manrope', sans-serif" }}
            >
                {buttonText}
            </span>

            {/* Arrow chip */}
            <motion.div
                className="relative z-10 flex items-center justify-center rounded-full flex-shrink-0"
                style={{
                    width: chipSize,
                    height: chipSize,
                    background: "rgba(255,255,255,0.2)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.35)",
                }}
                animate={{ x: isHovered ? 4 : 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
            >
                <ArrowRight className={`${iconSize} fill-white`} />
            </motion.div>
        </MotionLink>
    );
}
