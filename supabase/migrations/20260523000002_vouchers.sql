-- supabase/migrations/20260523000002_vouchers.sql

-- ── Tabel vouchers ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vouchers (
  id                uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  code              text    NOT NULL,
  description       text,
  discount_percent  integer NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
  max_uses          integer NOT NULL DEFAULT 1,
  used_count        integer NOT NULL DEFAULT 0,
  expires_at        timestamptz,
  is_active         boolean NOT NULL DEFAULT true,
  created_at        timestamptz DEFAULT now()
);

-- Case-insensitive unique index agar kode 'PROMO50' = 'promo50'
CREATE UNIQUE INDEX IF NOT EXISTS vouchers_code_ci_unique
  ON vouchers (lower(code));

-- ── RLS ──────────────────────────────────────────────────────────────────
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;

-- Public tidak bisa SELECT (hanya via edge function service role)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'vouchers' AND policyname = 'Admin full access vouchers'
  ) THEN
    CREATE POLICY "Admin full access vouchers"
      ON vouchers FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ── Kolom baru di consultations ──────────────────────────────────────────
ALTER TABLE consultations
  ADD COLUMN IF NOT EXISTS voucher_code     text,
  ADD COLUMN IF NOT EXISTS discount_percent integer,
  ADD COLUMN IF NOT EXISTS discount_amount  numeric;
