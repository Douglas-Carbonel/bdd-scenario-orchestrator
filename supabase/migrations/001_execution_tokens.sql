-- ============================================================
-- 4QA: Nova arquitetura de integração via execution token
-- Execute este arquivo no SQL Editor do Supabase Dashboard
-- ============================================================

-- Tabela de spec files descobertos pelo bootstrap.js
CREATE TABLE IF NOT EXISTS spec_files (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  spec_path text NOT NULL,
  describe_title text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, spec_path)
);

-- Tabela de mapeamento cenário ↔ spec file (1:1)
CREATE TABLE IF NOT EXISTS scenario_mappings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  scenario_id uuid NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE UNIQUE,
  spec_file_id uuid NOT NULL REFERENCES spec_files(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Tabela de execuções com token único
CREATE TABLE IF NOT EXISTS executions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  scenario_id uuid NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  execution_token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'passed', 'failed')),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE spec_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE executions ENABLE ROW LEVEL SECURITY;

-- Service role acesso total (usado pelos Edge Functions)
CREATE POLICY "service_role_spec_files" ON spec_files
  FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_scenario_mappings" ON scenario_mappings
  FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_executions" ON executions
  FOR ALL TO service_role USING (true);

-- Usuários autenticados acessam dados da própria empresa
CREATE POLICY "auth_spec_files" ON spec_files
  FOR ALL TO authenticated
  USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "auth_scenario_mappings" ON scenario_mappings
  FOR ALL TO authenticated
  USING (scenario_id IN (
    SELECT id FROM scenarios WHERE company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "auth_executions" ON executions
  FOR ALL TO authenticated
  USING (scenario_id IN (
    SELECT id FROM scenarios WHERE company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  ));
