-- supabase/migrations/20260515000001_add_location_to_consultations.sql
-- Tambah kolom location pada tabel consultations
-- untuk menyimpan lokasi proyek klien (Jakarta / Luar Jakarta)

ALTER TABLE consultations
  ADD COLUMN IF NOT EXISTS location text;
