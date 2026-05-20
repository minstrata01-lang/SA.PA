import { Helmet } from 'react-helmet-async';

const BASE_URL = 'https://sapa.stratalift.co.id';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.jpg`;
const DEFAULT_DESC = 'SA.PA menyediakan layanan pre-assessment, diagnosis struktural, dan investigasi geoteknik bangunan secara profesional. Tim bersertifikat, respon cepat, mulai Rp500.000.';

/**
 * Komponen SEO — pasang di tiap halaman untuk title & meta unik per-route.
 *
 * Props:
 *   title       — judul halaman (tanpa suffix). Suffix "| SA.PA" ditambah otomatis.
 *   description — meta description (maks ~160 karakter)
 *   canonical   — path relatif, mis. "/case/retaining-wall-jakarta"
 *   ogImage     — URL gambar absolut untuk og:image (opsional)
 *   noindex     — set true untuk halaman admin/payment agar tidak diindex
 */
export default function SEO({ title, description, canonical, ogImage, noindex = false }) {
  const fullTitle = title
    ? `${title} | SA.PA`
    : 'SA.PA — Konsultasi Struktural & Geoteknik Profesional | Stratalift Solutions';
  const desc  = description || DEFAULT_DESC;
  const image = ogImage || DEFAULT_IMAGE;
  const url   = canonical ? `${BASE_URL}${canonical}` : BASE_URL;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {noindex
        ? <meta name="robots" content="noindex, nofollow" />
        : <meta name="robots" content="index, follow" />
      }
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type"        content="website" />
      <meta property="og:url"         content={url} />
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image"       content={image} />
      <meta property="og:locale"      content="id_ID" />

      {/* Twitter Card */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image"       content={image} />
    </Helmet>
  );
}
