ALTER TABLE consultations
  ADD COLUMN IF NOT EXISTS project_details text;
