import { useEffect, useRef, useState } from "react";

const blue   = "#003D6B";
const orange = "#D97706";

export default function FullscreenLoader() {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    startRef.current = performance.now();

    function tick(now) {
      const elapsed = now - startRef.current;
      // Ease out — fast at first then slows toward ~88%
      const p = 88 * (1 - Math.exp(-elapsed / 1800));
      setProgress(p);
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
        overflow: "hidden",
      }}
    >
      {/* Subtle blueprint grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            `linear-gradient(rgba(0,61,107,0.035) 1px, transparent 1px),
             linear-gradient(90deg, rgba(0,61,107,0.035) 1px, transparent 1px)`,
          backgroundSize: "44px 44px",
        }}
      />

      {/* Centered content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2rem",
          width: "100%",
          maxWidth: 240,
          padding: "0 1rem",
        }}
      >
        {/* Logo — constrained by width, height is auto so it never stretches */}
        <img
          src="/LOGO_SAPA_2.png"
          alt="SA.PA"
          style={{
            width: "100%",
            maxWidth: 160,
            height: "auto",
            objectFit: "contain",
            opacity: 0.9,
            display: "block",
          }}
          onError={e => { e.currentTarget.style.display = "none"; }}
        />

        {/* Progress bar track */}
        <div style={{ width: "100%", position: "relative" }}>
          {/* Track */}
          <div
            style={{
              width: "100%",
              height: 2,
              background: `rgba(0,61,107,0.1)`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Fill */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                height: "100%",
                width: `${progress}%`,
                background: orange,
                transition: "width 0.08s linear",
              }}
            />
          </div>

          {/* Shimmer dot at progress tip */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: `${progress}%`,
              transform: "translate(-50%, -50%)",
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: orange,
              boxShadow: `0 0 8px 2px rgba(217,119,6,0.45)`,
              transition: "left 0.08s linear",
            }}
          />
        </div>

        {/* Label */}
        <p
          style={{
            fontSize: "0.62rem",
            fontWeight: 700,
            letterSpacing: "0.26em",
            textTransform: "uppercase",
            color: `rgba(0,61,107,0.38)`,
            fontFamily: "'Manrope', sans-serif",
            marginTop: "-0.5rem",
          }}
        >
          Memuat&hellip;
        </p>
      </div>
    </div>
  );
}
