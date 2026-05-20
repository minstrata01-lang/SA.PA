-- supabase/migrations/20260514000001_rls_clients_consultations.sql
-- Tambah RLS policies untuk tabel clients dan consultations
-- yang digunakan oleh form pre-assessment publik

-- ── Enable RLS (idempotent) ───────────────────────────────────────────────
ALTER TABLE clients       ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- ── clients: anon boleh INSERT (form publik) dan SELECT (cek duplikat email)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'clients' AND policyname = 'Public insert clients'
  ) THEN
    CREATE POLICY "Public insert clients"
      ON clients FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'clients' AND policyname = 'Public select clients'
  ) THEN
    CREATE POLICY "Public select clients"
      ON clients FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

-- Admin full access clients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'clients' AND policyname = 'Admin full access clients'
  ) THEN
    CREATE POLICY "Admin full access clients"
      ON clients FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ── consultations: anon boleh INSERT (via form) dan SELECT (cek pending) ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'consultations' AND policyname = 'Public insert consultations'
  ) THEN
    CREATE POLICY "Public insert consultations"
      ON consultations FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'consultations' AND policyname = 'Public select consultations'
  ) THEN
    CREATE POLICY "Public select consultations"
      ON consultations FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

-- Admin full access consultations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'consultations' AND policyname = 'Admin full access consultations'
  ) THEN
    CREATE POLICY "Admin full access consultations"
      ON consultations FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
