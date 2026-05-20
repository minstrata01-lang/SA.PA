// frontend/src/hooks/useTools.js
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export function useTools() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: rows, error: err } = await supabase
      .from('tools')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });
    if (err) setError(err.message);
    else setData(rows || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
