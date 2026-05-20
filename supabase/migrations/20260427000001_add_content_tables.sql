-- supabase/migrations/20260427000001_add_content_tables.sql

-- ── 1. Modifikasi tabel consultants (tambah kolom baru) ──────────────────
ALTER TABLE consultants
  ADD COLUMN IF NOT EXISTS title        text,
  ADD COLUMN IF NOT EXISTS description  text,
  ADD COLUMN IF NOT EXISTS photo_url    text,
  ADD COLUMN IF NOT EXISTS sort_order   integer DEFAULT 0;

-- ── 2. Tabel tools ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tools (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  slug          text NOT NULL UNIQUE,
  description   text,
  thumbnail_url text,
  tags          text[] DEFAULT '{}',
  video_url     text,
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

-- ── 3. Tabel cases ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cases (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text NOT NULL,
  slug             text NOT NULL UNIQUE,
  summary          text,
  full_description text,
  cover_image_url  text,
  category         text,
  tags             text[] DEFAULT '{}',
  status           text DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  sort_order       integer DEFAULT 0,
  created_at       timestamptz DEFAULT now()
);

-- ── 4. Tabel pricing_plans ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pricing_plans (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  tag_label   text,
  description text,
  price       numeric,                    -- NULL = harga ditentukan via konsultasi
  features    text[] DEFAULT '{}',
  is_featured boolean DEFAULT false,
  sort_order  integer DEFAULT 0,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- ── 5. Indexes untuk kolom filter yang sering dipakai ─────────────────────
CREATE INDEX IF NOT EXISTS idx_tools_is_active   ON tools (is_active);
CREATE INDEX IF NOT EXISTS idx_cases_status      ON cases (status);
CREATE INDEX IF NOT EXISTS idx_pricing_is_active ON pricing_plans (is_active);
