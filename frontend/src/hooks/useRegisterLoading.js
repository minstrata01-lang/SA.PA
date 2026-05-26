import { useEffect } from 'react';
import { usePageLoader } from '../context/PageLoaderContext';

/**
 * Daftarkan sebuah loading key ke PageLoaderContext.
 * @param {string}  key       – identifier unik untuk sumber loading ini
 * @param {boolean} isLoading – nilai loading dari data hook
 */
export function useRegisterLoading(key, isLoading) {
  const { register, resolve } = usePageLoader();

  // Daftarkan saat mount; bersihkan saat unmount (idempotent)
  useEffect(() => {
    register(key);
    return () => resolve(key);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Resolve segera saat loading selesai
  useEffect(() => {
    if (!isLoading) resolve(key);
  }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps
}
