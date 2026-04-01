import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Company, Sprint, Scenario, TestSuite, SuiteTreeNode,
  TeamMember, TestRun, DailyStats,
} from "@/types/bdd";
import { Database } from "@/integrations/supabase/types";

// ─── DB row types ──────────────────────────────────────────────────────────────
type DbCompany    = Database["public"]["Tables"]["companies"]["Row"];
type DbSprint     = Database["public"]["Tables"]["sprints"]["Row"];
type DbScenario   = Database["public"]["Tables"]["scenarios"]["Row"];
type DbTestSuite  = Database["public"]["Tables"]["test_suites"]["Row"];
type DbTeamMember = Database["public"]["Tables"]["team_members"]["Row"];
type DbTestRun    = Database["public"]["Tables"]["test_runs"]["Row"];

// ─── Mappers (DB → App) ────────────────────────────────────────────────────────
function mapCompany(row: DbCompany): Company {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    apiKey: row.api_key ?? "",
    createdAt: new Date(row.created_at),
  };
}

function mapSprint(row: DbSprint): Sprint {
  return {
    id: row.id,
    name: row.name,
    companyId: row.company_id,
    startDate: new Date(row.start_date),
    endDate: new Date(row.end_date),
    status: row.status,
  };
}

function mapScenario(row: DbScenario): Scenario {
  return {
    id: row.id,
    title: row.title,
    companyId: row.company_id,
    sprintId: row.sprint_id ?? undefined,
    suiteId: row.suite_id ?? undefined,
    feature: row.feature,
    given: (row.given_steps as string[]) ?? [],
    when: (row.when_steps as string[]) ?? [],
    then: (row.then_steps as string[]) ?? [],
    tags: (row.tags as string[]) ?? [],
    priority: row.priority,
    assigneeId: row.assignee_id ?? undefined,
    estimatedDuration: row.estimated_duration,
    actualDuration: row.actual_duration ?? undefined,
    status: row.status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapSuite(row: DbTestSuite): TestSuite {
  return {
    id: row.id,
    name: row.name,
    companyId: row.company_id,
    parentId: row.parent_id,
    order: row.order,
    createdAt: new Date(row.created_at),
  };
}

function mapTeamMember(row: DbTeamMember): TeamMember {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatar: row.avatar ?? undefined,
    companyId: row.company_id,
  };
}

function mapTestRun(row: DbTestRun): TestRun {
  return {
    id: row.id,
    scenarioId: row.scenario_id,
    executedBy: row.executed_by,
    startedAt: new Date(row.started_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    duration: row.duration ?? undefined,
    status: row.status,
    errorMessage: row.error_message ?? undefined,
    logs: (row.logs as string[] | null) ?? undefined,
  };
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
export function useBddStore() {
  const queryClient = useQueryClient();

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("*").order("created_at");
      if (error) throw error;
      return data.map(mapCompany);
    },
  });

  const { data: sprints = [] } = useQuery({
    queryKey: ["sprints"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sprints").select("*").order("created_at");
      if (error) throw error;
      return data.map(mapSprint);
    },
  });

  const { data: scenarios = [] } = useQuery({
    queryKey: ["scenarios"],
    queryFn: async () => {
      const { data, error } = await supabase.from("scenarios").select("*").order("created_at");
      if (error) throw error;
      return data.map(mapScenario);
    },
  });

  const { data: suites = [] } = useQuery({
    queryKey: ["suites"],
    queryFn: async () => {
      const { data, error } = await supabase.from("test_suites").select("*").order("order");
      if (error) throw error;
      return data.map(mapSuite);
    },
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team_members"],
    queryFn: async () => {
      const { data, error } = await supabase.from("team_members").select("*").order("created_at");
      if (error) throw error;
      return data.map(mapTeamMember);
    },
  });

  const { data: testRuns = [] } = useQuery({
    queryKey: ["test_runs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_runs")
        .select("*")
        .order("started_at", { ascending: false });
      if (error) throw error;
      return data.map(mapTestRun);
    },
  });

  // ── Company mutations ────────────────────────────────────────────────────────
  const addCompanyMutation = useMutation({
    mutationFn: async (company: Omit<Company, "id" | "createdAt" | "apiKey">) => {
      const { data, error } = await supabase
        .from("companies")
        .insert({ name: company.name, description: company.description ?? null })
        .select()
        .single();
      if (error) throw error;
      return mapCompany(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["companies"] }),
  });

  const updateCompanyMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Company> }) => {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      const { error } = await supabase.from("companies").update(dbUpdates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["companies"] }),
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: async (id: string) => {
      const companyScenarioIds = scenarios
        .filter((s) => s.companyId === id)
        .map((s) => s.id);

      if (companyScenarioIds.length > 0) {
        await supabase.from("test_runs").delete().in("scenario_id", companyScenarioIds);
        await supabase.from("scenarios").delete().eq("company_id", id);
      }
      await supabase.from("test_suites").delete().eq("company_id", id);
      await supabase.from("sprints").delete().eq("company_id", id);
      await supabase.from("team_members").delete().eq("company_id", id);
      const { error } = await supabase.from("companies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
      queryClient.invalidateQueries({ queryKey: ["suites"] });
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      queryClient.invalidateQueries({ queryKey: ["test_runs"] });
    },
  });

  // ── Sprint mutations ─────────────────────────────────────────────────────────
  const addSprintMutation = useMutation({
    mutationFn: async (sprint: Omit<Sprint, "id">) => {
      const { data, error } = await supabase
        .from("sprints")
        .insert({
          name: sprint.name,
          company_id: sprint.companyId,
          start_date: sprint.startDate.toISOString().split("T")[0],
          end_date: sprint.endDate.toISOString().split("T")[0],
          status: sprint.status,
        })
        .select()
        .single();
      if (error) throw error;
      return mapSprint(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sprints"] }),
  });

  const updateSprintMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Sprint> }) => {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate.toISOString().split("T")[0];
      if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate.toISOString().split("T")[0];
      const { error } = await supabase.from("sprints").update(dbUpdates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sprints"] }),
  });

  const deleteSprintMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sprints").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sprints"] }),
  });

  // ── Suite mutations ──────────────────────────────────────────────────────────
  const addSuiteMutation = useMutation({
    mutationFn: async (suite: Omit<TestSuite, "id" | "createdAt" | "order">) => {
      const siblingCount = suites.filter(
        (s) => s.companyId === suite.companyId && s.parentId === suite.parentId,
      ).length;
      const { data, error } = await supabase
        .from("test_suites")
        .insert({
          name: suite.name,
          company_id: suite.companyId,
          parent_id: suite.parentId,
          order: siblingCount,
        })
        .select()
        .single();
      if (error) throw error;
      return mapSuite(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["suites"] }),
  });

  const updateSuiteMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TestSuite> }) => {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.parentId !== undefined) dbUpdates.parent_id = updates.parentId;
      if (updates.order !== undefined) dbUpdates.order = updates.order;
      const { error } = await supabase.from("test_suites").update(dbUpdates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["suites"] }),
  });

  const deleteSuiteMutation = useMutation({
    mutationFn: async (id: string) => {
      const getDescendantIds = (parentId: string): string[] => {
        const children = suites.filter((s) => s.parentId === parentId);
        return children.flatMap((c) => [c.id, ...getDescendantIds(c.id)]);
      };
      const idsToDelete = [id, ...getDescendantIds(id)];
      await supabase.from("scenarios").update({ suite_id: null }).in("suite_id", idsToDelete);
      for (const suiteId of [...idsToDelete].reverse()) {
        await supabase.from("test_suites").delete().eq("id", suiteId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suites"] });
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
    },
  });

  const moveSuiteMutation = useMutation({
    mutationFn: async ({
      suiteId, newParentId, newOrder,
    }: { suiteId: string; newParentId: string | null; newOrder: number }) => {
      const { error } = await supabase
        .from("test_suites")
        .update({ parent_id: newParentId, order: newOrder })
        .eq("id", suiteId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["suites"] }),
  });

  // ── Scenario mutations ───────────────────────────────────────────────────────
  const addScenarioMutation = useMutation({
    mutationFn: async (scenario: Omit<Scenario, "id" | "createdAt" | "updatedAt">) => {
      const { data, error } = await supabase
        .from("scenarios")
        .insert({
          title: scenario.title,
          company_id: scenario.companyId,
          sprint_id: scenario.sprintId ?? null,
          suite_id: scenario.suiteId ?? null,
          feature: scenario.feature,
          given_steps: scenario.given,
          when_steps: scenario.when,
          then_steps: scenario.then,
          tags: scenario.tags,
          priority: scenario.priority,
          assignee_id: scenario.assigneeId ?? null,
          estimated_duration: scenario.estimatedDuration,
          actual_duration: scenario.actualDuration ?? null,
          status: scenario.status,
        })
        .select()
        .single();
      if (error) throw error;
      return mapScenario(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["scenarios"] }),
  });

  const updateScenarioMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Scenario> }) => {
      const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.feature !== undefined) dbUpdates.feature = updates.feature;
      if (updates.given !== undefined) dbUpdates.given_steps = updates.given;
      if (updates.when !== undefined) dbUpdates.when_steps = updates.when;
      if (updates.then !== undefined) dbUpdates.then_steps = updates.then;
      if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.sprintId !== undefined) dbUpdates.sprint_id = updates.sprintId ?? null;
      if (updates.suiteId !== undefined) dbUpdates.suite_id = updates.suiteId ?? null;
      if (updates.assigneeId !== undefined) dbUpdates.assignee_id = updates.assigneeId ?? null;
      if (updates.estimatedDuration !== undefined) dbUpdates.estimated_duration = updates.estimatedDuration;
      if (updates.actualDuration !== undefined) dbUpdates.actual_duration = updates.actualDuration ?? null;
      const { error } = await supabase.from("scenarios").update(dbUpdates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["scenarios"] }),
  });

  const deleteScenarioMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("test_runs").delete().eq("scenario_id", id);
      const { error } = await supabase.from("scenarios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
      queryClient.invalidateQueries({ queryKey: ["test_runs"] });
    },
  });

  const moveScenarioToSuiteMutation = useMutation({
    mutationFn: async ({ scenarioId, suiteId }: { scenarioId: string; suiteId: string | undefined }) => {
      const { error } = await supabase
        .from("scenarios")
        .update({ suite_id: suiteId ?? null, updated_at: new Date().toISOString() })
        .eq("id", scenarioId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["scenarios"] }),
  });

  // ── Test run mutations ───────────────────────────────────────────────────────
  const addTestRunMutation = useMutation({
    mutationFn: async (run: Omit<TestRun, "id">) => {
      const { data, error } = await supabase
        .from("test_runs")
        .insert({
          scenario_id: run.scenarioId,
          executed_by: run.executedBy,
          started_at: run.startedAt.toISOString(),
          completed_at: run.completedAt?.toISOString() ?? null,
          duration: run.duration ?? null,
          status: run.status,
          error_message: run.errorMessage ?? null,
          logs: run.logs ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return mapTestRun(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["test_runs"] }),
  });

  // ── Computed functions (same interface as before) ────────────────────────────
  const getSuiteTree = useCallback(
    (companyId: string): SuiteTreeNode[] => {
      const companySuites = suites
        .filter((s) => s.companyId === companyId)
        .sort((a, b) => a.order - b.order);
      const companyScenarios = scenarios.filter((s) => s.companyId === companyId);
      const buildTree = (parentId: string | null): SuiteTreeNode[] =>
        companySuites
          .filter((s) => s.parentId === parentId)
          .map((suite) => ({
            ...suite,
            children: buildTree(suite.id),
            scenarios: companyScenarios.filter((sc) => sc.suiteId === suite.id),
          }));
      return buildTree(null);
    },
    [suites, scenarios],
  );

  const getScenarioRuns = useCallback(
    (scenarioId: string) =>
      testRuns
        .filter((r) => r.scenarioId === scenarioId)
        .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime()),
    [testRuns],
  );

  const getCompanyStats = useCallback(
    (companyId: string) => {
      const companyScenarios = scenarios.filter((s) => s.companyId === companyId);
      const companySprints = sprints.filter((s) => s.companyId === companyId);
      return {
        scenarioCount: companyScenarios.length,
        sprintCount: companySprints.length,
        passedCount: companyScenarios.filter((s) => s.status === "passed").length,
        failedCount: companyScenarios.filter((s) => s.status === "failed").length,
      };
    },
    [scenarios, sprints],
  );

  const getSprintStats = useCallback(
    (sprintId: string) => {
      const sprintScenarios = scenarios.filter((s) => s.sprintId === sprintId);
      return {
        scenarioCount: sprintScenarios.length,
        passedCount: sprintScenarios.filter((s) => s.status === "passed").length,
        failedCount: sprintScenarios.filter((s) => s.status === "failed").length,
      };
    },
    [scenarios],
  );

  const getUnsortedScenarios = useCallback(
    (companyId: string) => scenarios.filter((s) => s.companyId === companyId && !s.suiteId),
    [scenarios],
  );

  const getDailyStats = useCallback(
    (companyId: string, days = 7): DailyStats[] => {
      const companyRuns = testRuns.filter((r) => {
        const scenario = scenarios.find((s) => s.id === r.scenarioId);
        return scenario?.companyId === companyId;
      });
      const stats: DailyStats[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        const dayRuns = companyRuns.filter(
          (r) => r.startedAt.toISOString().split("T")[0] === dateStr,
        );
        stats.push({
          date: dateStr,
          passed: dayRuns.filter((r) => r.status === "passed").length,
          failed: dayRuns.filter((r) => r.status === "failed").length,
          total: dayRuns.length,
        });
      }
      return stats;
    },
    [testRuns, scenarios],
  );

  const getTeamMember = useCallback(
    (id: string) => teamMembers.find((m) => m.id === id),
    [teamMembers],
  );

  const getCompanyTeamMembers = useCallback(
    (companyId: string) => teamMembers.filter((m) => m.companyId === companyId),
    [teamMembers],
  );

  // ── Public interface (same as original hook) ─────────────────────────────────
  const addCompany = useCallback(
    (company: Omit<Company, "id" | "createdAt" | "apiKey">) => addCompanyMutation.mutate(company),
    [addCompanyMutation],
  );
  const updateCompany = useCallback(
    (id: string, updates: Partial<Company>) => updateCompanyMutation.mutate({ id, updates }),
    [updateCompanyMutation],
  );
  const deleteCompany = useCallback(
    (id: string) => deleteCompanyMutation.mutate(id),
    [deleteCompanyMutation],
  );
  const addSprint = useCallback(
    (sprint: Omit<Sprint, "id">) => addSprintMutation.mutate(sprint),
    [addSprintMutation],
  );
  const updateSprint = useCallback(
    (id: string, updates: Partial<Sprint>) => updateSprintMutation.mutate({ id, updates }),
    [updateSprintMutation],
  );
  const deleteSprint = useCallback(
    (id: string) => deleteSprintMutation.mutate(id),
    [deleteSprintMutation],
  );
  const addSuite = useCallback(
    (suite: Omit<TestSuite, "id" | "createdAt" | "order">) => addSuiteMutation.mutate(suite),
    [addSuiteMutation],
  );
  const updateSuite = useCallback(
    (id: string, updates: Partial<TestSuite>) => updateSuiteMutation.mutate({ id, updates }),
    [updateSuiteMutation],
  );
  const deleteSuite = useCallback(
    (id: string) => deleteSuiteMutation.mutate(id),
    [deleteSuiteMutation],
  );
  const moveSuite = useCallback(
    (suiteId: string, newParentId: string | null, newOrder: number) =>
      moveSuiteMutation.mutate({ suiteId, newParentId, newOrder }),
    [moveSuiteMutation],
  );
  const addScenario = useCallback(
    (scenario: Omit<Scenario, "id" | "createdAt" | "updatedAt">) =>
      addScenarioMutation.mutate(scenario),
    [addScenarioMutation],
  );
  const updateScenario = useCallback(
    (id: string, updates: Partial<Scenario>) => updateScenarioMutation.mutate({ id, updates }),
    [updateScenarioMutation],
  );
  const deleteScenario = useCallback(
    (id: string) => deleteScenarioMutation.mutate(id),
    [deleteScenarioMutation],
  );
  const addTestRun = useCallback(
    (run: Omit<TestRun, "id">) => addTestRunMutation.mutate(run),
    [addTestRunMutation],
  );
  const moveScenarioToSuite = useCallback(
    (scenarioId: string, suiteId: string | undefined) =>
      moveScenarioToSuiteMutation.mutate({ scenarioId, suiteId }),
    [moveScenarioToSuiteMutation],
  );

  return {
    companies,
    sprints,
    scenarios,
    suites,
    teamMembers,
    testRuns,
    addCompany,
    updateCompany,
    deleteCompany,
    addSprint,
    updateSprint,
    deleteSprint,
    addSuite,
    updateSuite,
    deleteSuite,
    moveSuite,
    moveScenarioToSuite,
    getSuiteTree,
    getUnsortedScenarios,
    addScenario,
    updateScenario,
    deleteScenario,
    addTestRun,
    getScenarioRuns,
    getCompanyStats,
    getSprintStats,
    getDailyStats,
    getTeamMember,
    getCompanyTeamMembers,
  };
}
