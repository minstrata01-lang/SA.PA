-- supabase/migrations/20260523000001_clients_email_unique.sql
-- Tambah UNIQUE constraint pada clients.email
-- untuk mencegah duplikat yang menyebabkan .maybeSingle() error

-- PRASYARAT: Pastikan tidak ada email duplikat sebelum menjalankan migrasi ini.
-- Cek duplikat:
--   SELECT email, COUNT(*) FROM clients GROUP BY email HAVING COUNT(*) > 1;
-- Jika ada duplikat, resolve dulu dengan:
--   DELETE FROM clients WHERE id NOT IN (
--     SELECT DISTINCT ON (email) id FROM clients ORDER BY email, created_at DESC
--   );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'clients'::regclass
      AND conname  = 'clients_email_unique'
  ) THEN
    ALTER TABLE clients
      ADD CONSTRAINT clients_email_unique UNIQUE (email);
  END IF;
END $$;
