ALTER TABLE defects
  ADD COLUMN IF NOT EXISTS sprint_id uuid REFERENCES sprints(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS defects_sprint_id_idx ON defects(sprint_id);
