CREATE TABLE IF NOT EXISTS defects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  test_run_id uuid REFERENCES test_runs(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'fixed', 'verified', 'reopened')),
  reported_by text NOT NULL,
  fix_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE defects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage defects"
  ON defects FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
