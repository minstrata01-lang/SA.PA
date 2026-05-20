-- supabase/migrations/20260501000001_add_amount_to_consultations.sql

ALTER TABLE consultations
  ADD COLUMN IF NOT EXISTS amount numeric DEFAULT 500000;
