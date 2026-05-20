import { useState, useEffect } from 'react';

/**
 * Generic data-fetching hook
 * @param {Function} fetchFn - Async function that returns data
 * @param {Array} deps - Dependency array for re-fetching
 */
export function useFetch(fetchFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchFn();
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, deps);

  return { data, loading, error };
}

export default useFetch;
