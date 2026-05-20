// frontend/src/hooks/useCases.js
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export function useCases({ page = 1, pageSize = 9 } = {}) {
  const [data, setData]               = useState([]);
  const [totalCount, setTotalCount]   = useState(0);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const from = (page - 1) * pageSize;
      const to   = from + pageSize - 1;
      const { data: rows, count, error: err } = await supabase
        .from('cases')
        .select('*', { count: 'exact' })
        .eq('status', 'published')
        .order('sort_order', { ascending: true })
        .range(from, to);
      if (err) {
        setError(err.message);
      } else {
        setData(rows || []);
        setTotalCount(count ?? 0);
      }
    } catch (e) {
      setError(e?.message ?? 'Unexpected error');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, totalCount, loading, error, refetch: fetchData };
}
