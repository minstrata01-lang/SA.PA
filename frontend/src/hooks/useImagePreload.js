import { useEffect } from 'react';
import { usePageLoader } from '../context/PageLoaderContext';

/**
 * Preload sebuah URL gambar dan daftarkan ke PageLoaderContext.
 * @param {string}       key   – identifier unik untuk gambar ini
 * @param {string|null}  url   – URL gambar. Jika null/undefined, tidak mendaftar.
 * @param {boolean}      ready – true jika data sudah selesai dimuat (untuk gambar dinamis)
 */
export function useImagePreload(key, url, ready = true) {
  const { register, resolve } = usePageLoader();

  useEffect(() => {
    // Belum siap (data masih loading) → jangan daftar dulu
    if (!ready) return;

    // Siap tapi tidak ada URL (item tidak punya gambar) → tidak perlu daftar
    if (!url) return;

    register(key);
    const img = new Image();
    img.onload  = () => resolve(key);
    img.onerror = () => resolve(key); // gambar gagal pun tidak memblokir
    img.src = url;

    return () => resolve(key); // cleanup saat unmount
  }, [ready, url]); // eslint-disable-line react-hooks/exhaustive-deps
}
