ALTER TABLE scenarios
  ADD COLUMN IF NOT EXISTS execution_type text NOT NULL DEFAULT 'automated'
    CHECK (execution_type IN ('manual', 'automated'));
