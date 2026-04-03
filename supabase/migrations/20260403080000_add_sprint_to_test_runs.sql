-- Add sprint_id to test_runs to track which sprint was active when the run occurred
ALTER TABLE public.test_runs ADD COLUMN IF NOT EXISTS sprint_id uuid REFERENCES public.sprints(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_test_runs_sprint ON public.test_runs(sprint_id);
