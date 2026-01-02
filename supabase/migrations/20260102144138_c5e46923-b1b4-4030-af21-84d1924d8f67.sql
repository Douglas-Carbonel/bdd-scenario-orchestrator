-- Create priority enum
CREATE TYPE public.priority AS ENUM ('critical', 'high', 'medium', 'low');

-- Create scenario status enum
CREATE TYPE public.scenario_status AS ENUM ('draft', 'ready', 'running', 'passed', 'failed');

-- Create sprint status enum
CREATE TYPE public.sprint_status AS ENUM ('planned', 'active', 'completed');

-- Create test run status enum
CREATE TYPE public.test_run_status AS ENUM ('running', 'passed', 'failed');

-- Companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sprints table
CREATE TABLE public.sprints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status public.sprint_status NOT NULL DEFAULT 'planned',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Test Suites table (hierarchical)
CREATE TABLE public.test_suites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.test_suites(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Team Members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar TEXT,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Scenarios table
CREATE TABLE public.scenarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sprint_id UUID REFERENCES public.sprints(id) ON DELETE SET NULL,
  suite_id UUID REFERENCES public.test_suites(id) ON DELETE SET NULL,
  feature TEXT NOT NULL,
  given_steps JSONB NOT NULL DEFAULT '[]',
  when_steps JSONB NOT NULL DEFAULT '[]',
  then_steps JSONB NOT NULL DEFAULT '[]',
  tags JSONB NOT NULL DEFAULT '[]',
  priority public.priority NOT NULL DEFAULT 'medium',
  assignee_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  estimated_duration INTEGER NOT NULL DEFAULT 0,
  actual_duration INTEGER,
  status public.scenario_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Test Runs table
CREATE TABLE public.test_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scenario_id UUID NOT NULL REFERENCES public.scenarios(id) ON DELETE CASCADE,
  executed_by TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER,
  status public.test_run_status NOT NULL DEFAULT 'running',
  error_message TEXT,
  logs JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_suites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_runs ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (for now, no auth required - can be restricted later)
CREATE POLICY "Allow all operations on companies" ON public.companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on sprints" ON public.sprints FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on test_suites" ON public.test_suites FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on team_members" ON public.team_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on scenarios" ON public.scenarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on test_runs" ON public.test_runs FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_sprints_company ON public.sprints(company_id);
CREATE INDEX idx_test_suites_company ON public.test_suites(company_id);
CREATE INDEX idx_test_suites_parent ON public.test_suites(parent_id);
CREATE INDEX idx_team_members_company ON public.team_members(company_id);
CREATE INDEX idx_scenarios_company ON public.scenarios(company_id);
CREATE INDEX idx_scenarios_sprint ON public.scenarios(sprint_id);
CREATE INDEX idx_scenarios_suite ON public.scenarios(suite_id);
CREATE INDEX idx_test_runs_scenario ON public.test_runs(scenario_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for scenarios updated_at
CREATE TRIGGER update_scenarios_updated_at
  BEFORE UPDATE ON public.scenarios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();