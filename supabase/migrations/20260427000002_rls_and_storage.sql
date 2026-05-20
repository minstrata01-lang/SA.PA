-- supabase/migrations/20260427000002_rls_and_storage.sql

-- ── Enable RLS ────────────────────────────────────────────────────────────
ALTER TABLE tools          ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases          ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_plans  ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultants    ENABLE ROW LEVEL SECURITY;

-- ── tools: publik bisa SELECT aktif, authenticated bisa semua ────────────
CREATE POLICY "Public read active tools"
  ON tools FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin full access tools"
  ON tools FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── cases: publik bisa SELECT published, authenticated bisa semua ─────────
CREATE POLICY "Public read published cases"
  ON cases FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admin full access cases"
  ON cases FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── pricing_plans: publik bisa SELECT aktif, authenticated bisa semua ────
CREATE POLICY "Public read active pricing"
  ON pricing_plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin full access pricing"
  ON pricing_plans FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── consultants: publik bisa SELECT aktif ─────────────────────────────────
CREATE POLICY "Public read active consultants"
  ON consultants FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin full access consultants"
  ON consultants FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── Storage Buckets (idempotent) ──────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('tools',        'tools',        true),
  ('cases',        'cases',        true),
  ('consultants',  'consultants',  true)
ON CONFLICT (id) DO NOTHING;

-- ── Storage Object Policies (upload & delete untuk admin) ─────────────────
CREATE POLICY "Authenticated upload tools"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'tools');

CREATE POLICY "Authenticated delete tools"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'tools');

CREATE POLICY "Authenticated upload cases"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'cases');

CREATE POLICY "Authenticated delete cases"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'cases');

CREATE POLICY "Authenticated upload consultants"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'consultants');

CREATE POLICY "Authenticated delete consultants"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'consultants');

-- ── payment-proofs bucket: public user (anon) bisa upload bukti transfer ──
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public upload payment proofs"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'payment-proofs');

CREATE POLICY "Public update payment proofs"
  ON storage.objects FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'payment-proofs');

-- ── consultations: public user bisa update proof_url & payment_status ────
CREATE POLICY "Public update payment proof"
  ON consultations FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);
