import OptimizedImage from "../OptimizedImage";

export default function CardWhyUs({ img, title, description }) {
    return (
        <div
            className="relative flex flex-col items-center w-full max-w-xs sm:max-w-sm md:max-w-70 rounded-2xl overflow-hidden border border-white/40 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,61,107,0.12),0_1.5px_0_0_rgba(255,255,255,0.18)_inset] p-6 gap-4 transition-[transform,box-shadow] duration-300 hover:scale-[1.03] hover:shadow-[0_16px_48px_0_rgba(245,130,32,0.18),0_1.5px_0_0_rgba(255,255,255,0.22)_inset]"
            style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%)",
            }}
        >
            {/* Top glare streak */}
            <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl"
                style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)" }}
            />

            {/* Glass glare overlay */}
            <div
                className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 55%, transparent 100%)",
                }}
            />

            {/* Subtle orange tint at bottom */}
            <div
                className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{
                    background: "radial-gradient(ellipse at 50% 120%, rgba(245,130,32,0.10) 0%, transparent 70%)",
                }}
            />

            {/* Image */}
            <div className="relative z-10 flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#F58220]/10 border border-[#F58220]/30 shrink-0">
                <OptimizedImage
                    src={img}
                    alt={title}
                    className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
                />
            </div>

            {/* Title */}
            <h3 className="relative z-10 text-center text-base sm:text-lg font-semibold text-[#004E89] leading-snug tracking-wide">
                {title}
            </h3>

            {/* Divider */}
            <div className="relative z-10 w-10 h-0.5 rounded-full bg-[#F58220]" />

            {/* Description */}
            <p className="relative z-10 text-center text-xs sm:text-sm text-[#004E89] leading-relaxed">
                {description}
            </p>
        </div>
    );
}
