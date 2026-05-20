import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import OptimizedImage from "./OptimizedImage";
import OrangeButtonArrow from "./Button/OrangeButtonArrow";

const blue   = "#003D6B";
const orange = "#D97706";
const muted  = "rgba(0,61,107,0.5)";
const border = "rgba(0,61,107,0.12)";

const navLinks = [
    { name: "Beranda",       href: "/" },
    { name: "Catatan Kasus", href: "/case" },
    { name: "Peralatan",     href: "/tool" },
];

export default function Navbar() {
    const [scrolled, setScrolled]   = useState(false);
    const [menuOpen, setMenuOpen]   = useState(false);
    const [closing, setClosing]     = useState(false);
    const location = useLocation();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        document.body.style.overflow = menuOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [menuOpen]);

    // Close on route change
    useEffect(() => { closeMenu(); }, [location.pathname]);

    function openMenu()  { setMenuOpen(true); }
    function closeMenu() {
        if (!menuOpen) return;
        setClosing(true);
        setTimeout(() => { setMenuOpen(false); setClosing(false); }, 420);
    }

    const isActive = (href) =>
        href === "/" ? location.pathname === "/" : location.pathname.startsWith(href);

    return (
        <>
            {/* ── Mobile overlay ── */}
            {(menuOpen || closing) && (
                <div
                    className={`fixed inset-0 z-60 flex flex-col items-center justify-center gap-5 ${
                        closing ? "animate-close-bounce" : "animate-drop-bounce"
                    }`}
                    style={{ background: "rgba(0,39,71,0.97)", backdropFilter: "blur(12px)" }}
                >
                    {/* Close button */}
                    <button
                        onClick={closeMenu}
                        className="absolute top-5 right-5 w-11 h-11 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
                        aria-label="Tutup menu"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Logo */}
                    <Link to="/" onClick={closeMenu} className="mb-4">
                        <OptimizedImage src="/LOGO_SAPA_1.png" alt="SA.PA" className="h-10 w-auto opacity-90" />
                    </Link>

                    {/* Links */}
                    {[...navLinks, { name: "Hubungi Ahli", href: "/layanan" }].map((item, i) => (
                        <Link
                            key={item.href}
                            to={item.href}
                            onClick={closeMenu}
                            className="text-xl font-semibold transition-all duration-200"
                            style={{
                                color: isActive(item.href) ? "#fff" : "rgba(255,255,255,0.6)",
                                fontFamily: "'Manrope', sans-serif",
                                animationDelay: `${i * 0.05}s`,
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                            onMouseLeave={e => e.currentTarget.style.color = isActive(item.href) ? "#fff" : "rgba(255,255,255,0.6)"}
                        >
                            {item.name}
                        </Link>
                    ))}
                </div>
            )}

            {/* ── Navbar pill ── */}
            <nav
                className="animate-nav-pop fixed top-4 left-0 right-0 mx-auto z-50 transition-all duration-300"
                style={{
                    width: "min(92%, 1100px)",
                    background: scrolled ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.72)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: `1.5px solid ${scrolled ? border : "rgba(0,61,107,0.08)"}`,
                    borderRadius: 9999,
                    boxShadow: scrolled
                        ? "0 4px 24px rgba(0,61,107,0.10)"
                        : "0 2px 12px rgba(0,61,107,0.06)",
                }}
            >
                <div className="flex items-center justify-between px-6 sm:px-8 h-16 sm:h-[72px]">

                    {/* Logo */}
                    <Link to="/" className="flex-shrink-0">
                        <OptimizedImage
                            src="/LOGO_SAPA_1.png"
                            alt="SA.PA"
                            className="h-10 sm:h-11 w-auto"
                            loading="eager"
                        />
                    </Link>

                    {/* Desktop nav links */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map(item => (
                            <Link
                                key={item.href}
                                to={item.href}
                                className="px-5 py-2.5 rounded-full text-base font-semibold transition-all duration-200"
                                style={{
                                    fontFamily: "'Manrope', sans-serif",
                                    color: isActive(item.href) ? blue : muted,
                                    background: isActive(item.href) ? "rgba(0,61,107,0.06)" : "transparent",
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.color = blue;
                                    e.currentTarget.style.background = "rgba(0,61,107,0.05)";
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.color = isActive(item.href) ? blue : muted;
                                    e.currentTarget.style.background = isActive(item.href) ? "rgba(0,61,107,0.06)" : "transparent";
                                }}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </div>

                    {/* Right: CTA + burger */}
                    <div className="flex items-center gap-3">
                        {/* Desktop CTA */}
                        <div className="hidden md:block">
                            <OrangeButtonArrow buttonText="Hubungi Ahli" to="/layanan" large />
                        </div>

                        {/* Burger button (mobile + tablet) */}
                        <button
                            onClick={openMenu}
                            className="md:hidden flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 border"
                            style={{ borderColor: "rgba(0,61,107,0.15)", color: blue }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(0,61,107,0.05)"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            aria-label="Buka menu"
                        >
                            <svg width="20" height="15" viewBox="0 0 20 15" fill="none">
                                <line x1="0" y1="1" x2="20" y2="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <line x1="0" y1="7.5" x2="20" y2="7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <line x1="0" y1="14" x2="20" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </nav>
        </>
    );
}
