import { useState } from "react";
import ArrowRight from "../../assets/arrowRight.svg?react";
import { Link } from "react-router-dom";

export default function ButtonArrow({ buttonText, to = "/" }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <Link
            to={to}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="flex items-center gap-2.5 cursor-pointer focus:outline-none rounded-full transition-all duration-200"
            style={{
                height: 40,
                paddingLeft: 16,
                paddingRight: 10,
                background: isHovered ? "#b45309" : "#D97706",
                boxShadow: isHovered ? "0 4px 16px rgba(217,119,6,0.4)" : "none",
            }}
        >
            <span
                className="whitespace-nowrap font-semibold text-white"
                style={{ fontSize: 13, fontFamily: "'Manrope', sans-serif" }}
            >
                {buttonText}
            </span>
            <div
                className="flex items-center justify-center rounded-full flex-shrink-0 transition-transform duration-200"
                style={{
                    width: 26,
                    height: 26,
                    background: "rgba(255,255,255,0.2)",
                    border: "1px solid rgba(255,255,255,0.35)",
                    transform: isHovered ? "translateX(3px)" : "translateX(0)",
                }}
            >
                <ArrowRight className="w-3 h-3 fill-white" />
            </div>
        </Link>
    );
}
