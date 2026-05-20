export default function CardFeatures({ title, description, items, highlighted = false, badgeText }) {
    return (
        <div
            className={`relative flex h-full w-full flex-col justify-start rounded-2xl border bg-white p-6 shadow-[0_8px_30px_rgba(0,61,107,0.10)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(0,61,107,0.14)] ${highlighted ? "border-2 border-[#003D6B]" : "border-[#003D6B]/20"}`}
        >
            {highlighted && badgeText && (
                <span className="absolute right-4 top-4 rounded-full border border-[#B8860B]/40 bg-[#B8860B]/10 px-3 py-1 text-xs font-semibold text-[#8A6708]">
                    {badgeText}
                </span>
            )}

            {/* Title */}
            <h3 className="text-lg sm:text-xl font-extrabold leading-snug tracking-wide text-[#003D6B]">
                {title}
            </h3>

            {/* Divider */}
            <div className="mt-1 h-0.5 w-10 rounded-full bg-[#003D6B]/30" />

            {/* Description */}
            <p className="mt-1 text-sm sm:text-base leading-relaxed text-[#003D6B]/78">
                {description}
            </p>

            {/* Checkmark list */}
            <ul className="mt-3 flex flex-col gap-2.5">
                {items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                        {/* Checkmark icon */}
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#003D6B]/30 bg-[#003D6B]/8">
                            <svg
                                viewBox="0 0 12 12"
                                className="w-3 h-3"
                                fill="none"
                                stroke="#003D6B"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polyline points="2,6 5,9 10,3" />
                            </svg>
                        </span>
                        <span className="text-sm leading-relaxed text-[#003D6B]/84">{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
