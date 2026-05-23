-- supabase/migrations/20260523000001_clients_email_unique.sql
-- Tambah UNIQUE constraint pada clients.email
-- untuk mencegah duplikat yang menyebabkan .maybeSingle() error

ALTER TABLE clients
  ADD CONSTRAINT clients_email_unique UNIQUE (email);
