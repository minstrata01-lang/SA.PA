import { createContext, useCallback, useContext, useRef, useState } from 'react';

const TIMEOUT_MS = 5000;  // force-ready setelah 5 detik
const NO_DATA_MS = 100;   // jika tidak ada yang register dalam 100ms → halaman tidak punya data

const PageLoaderContext = createContext(null);

export function PageLoaderProvider({ children }) {
  const [pendingKeys, setPendingKeys] = useState(() => new Set());
  const [totalKeys,   setTotalKeys]   = useState(() => new Set());
  const [timedOut,    setTimedOut]    = useState(false);
  const [noDataReady, setNoDataReady] = useState(false);

  const timeoutRef = useRef(null);
  const noDataRef  = useRef(null);

  const register = useCallback((key) => {
    // Ada data → batalkan fast-path "tidak ada data"
    clearTimeout(noDataRef.current);
    setNoDataReady(false);
    setPendingKeys(prev => { const s = new Set(prev); s.add(key);    return s; });
    setTotalKeys  (prev => { const s = new Set(prev); s.add(key);    return s; });
  }, []);

  const resolve = useCallback((key) => {
    setPendingKeys(prev => { const s = new Set(prev); s.delete(key); return s; });
  }, []);

  const reset = useCallback(() => {
    clearTimeout(timeoutRef.current);
    clearTimeout(noDataRef.current);
    setPendingKeys(new Set());
    setTotalKeys  (new Set());
    setTimedOut   (false);
    setNoDataReady(false);
    timeoutRef.current = setTimeout(() => setTimedOut(true),    TIMEOUT_MS);
    noDataRef.current  = setTimeout(() => setNoDataReady(true), NO_DATA_MS);
  }, []);

  const total    = totalKeys.size;
  const pending  = pendingKeys.size;
  const resolved = total - pending;

  const progress = timedOut    ? 100
                 : total === 0 ? 0
                 : (resolved / total) * 100;

  const isReady = timedOut || noDataReady || (total > 0 && pending === 0);

  return (
    <PageLoaderContext.Provider value={{ register, resolve, reset, progress, isReady }}>
      {children}
    </PageLoaderContext.Provider>
  );
}

export function usePageLoader() {
  const ctx = useContext(PageLoaderContext);
  if (!ctx) throw new Error('usePageLoader must be used within PageLoaderProvider');
  return ctx;
}
