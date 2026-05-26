import { useEffect, useState } from 'react';
import { usePageLoader } from '../context/PageLoaderContext';

const blue   = '#003D6B';
const orange = '#D97706';

const GRACE_MS = 200;  // tidak tampil jika halaman selesai dalam 200ms
const FADE_MS  = 400;  // durasi fade-out

// phase: 'hidden' | 'showing' | 'fading-out'
export default function FullscreenLoader() {
  const { progress, isReady } = usePageLoader();
  const [phase, setPhase] = useState('hidden');

  // Grace period: tampil hanya jika loading > GRACE_MS
  useEffect(() => {
    if (isReady) return; // sudah selesai, tidak perlu grace timer
    const t = setTimeout(() => setPhase('showing'), GRACE_MS);
    return () => clearTimeout(t); // batalkan jika isReady sebelum GRACE_MS
  }, [isReady]);

  // Fade out saat ready
  useEffect(() => {
    if (!isReady || phase !== 'showing') return;
    setPhase('fading-out');
    const t = setTimeout(() => setPhase('hidden'), FADE_MS);
    return () => clearTimeout(t);
  }, [isReady, phase]);

  if (phase === 'hidden') return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
        overflow: 'hidden',
        opacity: phase === 'fading-out' ? 0 : 1,
        transition: phase === 'fading-out' ? `opacity ${FADE_MS}ms ease` : 'none',
        pointerEvents: phase === 'fading-out' ? 'none' : 'auto',
      }}
    >
      {/* Blueprint grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            `linear-gradient(rgba(0,61,107,0.035) 1px, transparent 1px),
             linear-gradient(90deg, rgba(0,61,107,0.035) 1px, transparent 1px)`,
          backgroundSize: '44px 44px',
        }}
      />

      {/* Konten */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2rem',
          width: '100%',
          maxWidth: 240,
          padding: '0 1rem',
        }}
      >
        {/* Logo */}
        <img
          src="/LOGO_SAPA_2.png"
          alt="SA.PA"
          style={{
            width: '100%',
            maxWidth: 160,
            height: 'auto',
            objectFit: 'contain',
            opacity: 0.9,
            display: 'block',
          }}
          onError={e => { e.currentTarget.style.display = 'none'; }}
        />

        {/* Progress bar */}
        <div style={{ width: '100%', position: 'relative' }}>
          <div
            style={{
              width: '100%',
              height: 2,
              background: 'rgba(0,61,107,0.1)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: `${progress}%`,
                background: orange,
                transition: 'width 0.15s ease-out',
              }}
            />
          </div>

          {/* Shimmer dot di ujung progress */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: `${progress}%`,
              transform: 'translate(-50%, -50%)',
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: orange,
              boxShadow: '0 0 8px 2px rgba(217,119,6,0.45)',
              transition: 'left 0.15s ease-out',
            }}
          />
        </div>

        {/* Label */}
        <p
          style={{
            fontSize: '0.62rem',
            fontWeight: 700,
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            color: 'rgba(0,61,107,0.38)',
            fontFamily: "'Manrope', sans-serif",
            marginTop: '-0.5rem',
          }}
        >
          Memuat&hellip;
        </p>
      </div>
    </div>
  );
}
