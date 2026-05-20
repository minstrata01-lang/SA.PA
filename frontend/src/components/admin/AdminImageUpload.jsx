// frontend/src/components/admin/AdminImageUpload.jsx
import { useState } from 'react';
import { supabase } from '../../supabaseClient';

/**
 * bucket: string — nama Supabase Storage bucket ('tools' | 'cases' | 'consultants')
 * currentUrl: string | null — URL gambar yang sudah ada
 * onUpload: (publicUrl: string) => void — dipanggil setelah upload sukses
 */
export default function AdminImageUpload({ bucket, currentUrl, onUpload }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(''); // bersihkan error sebelumnya di setiap percobaan baru

    // Validasi: hanya gambar, max 5MB
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5MB.');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      if (typeof onUpload === 'function') onUpload(data.publicUrl);
    } catch (err) {
      setError(`Upload gagal: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Preview gambar saat ini */}
      {currentUrl && (
        <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200">
          <img src={currentUrl} alt="Preview" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Input file */}
      <label className="cursor-pointer inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
        {uploading ? 'Mengupload...' : currentUrl ? 'Ganti Gambar' : 'Upload Gambar'}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="sr-only"
        />
      </label>

      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
