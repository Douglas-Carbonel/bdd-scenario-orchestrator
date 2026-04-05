-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  description text,
  company_id  uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id  uuid        REFERENCES products(id) ON DELETE SET NULL,
  member_ids  jsonb       NOT NULL DEFAULT '[]',
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage teams"
  ON teams FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Add role column to team_members
ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'qa'
    CHECK (role IN ('qa','dev','po','lead','analyst'));

CREATE INDEX IF NOT EXISTS teams_company_id_idx ON teams(company_id);
