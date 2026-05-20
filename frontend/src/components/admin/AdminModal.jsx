import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const blue   = '#003D6B';
const orange = '#E8920A';

export default function AdminModal({ isOpen, onClose, title, onSubmit, isSubmitting, children }) {
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handler);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ background: 'rgba(0,20,40,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl overflow-hidden"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: 'white',
              boxShadow: '0 32px 80px rgba(0,20,40,0.22), 0 8px 24px rgba(0,20,40,0.12)',
              border: '1px solid rgba(0,61,107,0.1)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 shrink-0"
              style={{ borderBottom: '1px solid rgba(0,61,107,0.08)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-1 h-5 rounded-full"
                  style={{ background: orange }}
                />
                <h2
                  className="text-base font-bold"
                  style={{ color: blue, fontFamily: "'Poppins', sans-serif" }}
                >
                  {title}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors duration-150"
                style={{ color: 'rgba(0,61,107,0.4)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,61,107,0.07)'; e.currentTarget.style.color = blue; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(0,61,107,0.4)'; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                {children}
              </div>

              {/* Footer */}
              <div
                className="flex items-center justify-end gap-3 px-6 py-4 shrink-0"
                style={{ borderTop: '1px solid rgba(0,61,107,0.08)' }}
              >
                <button
                  type="button"
                  onClick={onClose}
                  className="h-9 px-4 rounded-xl text-sm font-semibold transition-all duration-150"
                  style={{
                    color: blue,
                    background: 'rgba(0,61,107,0.07)',
                    border: '1px solid rgba(0,61,107,0.15)',
                    fontFamily: "'Manrope', sans-serif",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,61,107,0.13)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,61,107,0.07)'}
                >
                  Batal
                </button>
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-9 px-5 rounded-xl text-sm font-bold text-white transition-opacity duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                  style={{
                    background: orange,
                    boxShadow: '0 4px 16px rgba(232,146,10,0.35)',
                    fontFamily: "'Manrope', sans-serif",
                  }}
                  whileHover={!isSubmitting ? { y: -1, boxShadow: '0 8px 20px rgba(232,146,10,0.45)' } : {}}
                  whileTap={!isSubmitting ? { scale: 0.97 } : {}}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      Menyimpan…
                    </>
                  ) : (
                    'Simpan'
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
