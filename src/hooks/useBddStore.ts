import { useCallback } from "react";
import { Company, Sprint, Scenario, TestSuite, SuiteTreeNode, TeamMember, TestRun, DailyStats } from "@/types/bdd";
import { useLocalStorage } from "./useLocalStorage";

// Initial mock data
const initialCompanies: Company[] = [
  {
    id: "1",
    name: "TechCorp Brasil",
    description: "Plataforma de e-commerce B2B",
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    name: "FinanceApp",
    description: "Aplicativo de gestão financeira pessoal",
    createdAt: new Date("2024-02-01"),
  },
];

const initialSprints: Sprint[] = [
  {
    id: "1",
    name: "Sprint 2024.01",
    companyId: "1",
    startDate: new Date("2024-12-01"),
    endDate: new Date("2024-12-15"),
    status: "active",
  },
  {
    id: "2",
    name: "Sprint 2024.02",
    companyId: "1",
    startDate: new Date("2024-12-16"),
    endDate: new Date("2024-12-31"),
    status: "planned",
  },
  {
    id: "3",
    name: "Sprint Alpha",
    companyId: "2",
    startDate: new Date("2024-11-15"),
    endDate: new Date("2024-11-30"),
    status: "completed",
  },
];

const initialSuites: TestSuite[] = [
  { id: "suite-1", name: "Autenticação", companyId: "1", parentId: null, order: 0, createdAt: new Date("2024-12-01") },
  { id: "suite-2", name: "Login Sucesso", companyId: "1", parentId: "suite-1", order: 0, createdAt: new Date("2024-12-01") },
  { id: "suite-3", name: "Login Falha", companyId: "1", parentId: "suite-1", order: 1, createdAt: new Date("2024-12-01") },
  { id: "suite-4", name: "E-commerce", companyId: "1", parentId: null, order: 1, createdAt: new Date("2024-12-01") },
  { id: "suite-5", name: "Carrinho", companyId: "1", parentId: "suite-4", order: 0, createdAt: new Date("2024-12-01") },
  { id: "suite-6", name: "Transações", companyId: "2", parentId: null, order: 0, createdAt: new Date("2024-12-01") },
];

const initialTeamMembers: TeamMember[] = [
  { id: "user-1", name: "Ana Silva", email: "ana@techcorp.com", companyId: "1" },
  { id: "user-2", name: "Carlos Santos", email: "carlos@techcorp.com", companyId: "1" },
  { id: "user-3", name: "Maria Oliveira", email: "maria@techcorp.com", companyId: "1" },
  { id: "user-4", name: "João Lima", email: "joao@financeapp.com", companyId: "2" },
];

const initialScenarios: Scenario[] = [
  {
    id: "1",
    title: "Login com credenciais válidas",
    companyId: "1",
    sprintId: "1",
    suiteId: "suite-2",
    feature: "Autenticação",
    given: ["o usuário está na página de login", "possui uma conta válida"],
    when: ["ele preenche email e senha corretamente", "clica no botão entrar"],
    then: ["deve ser redirecionado para o dashboard", "deve ver uma mensagem de boas-vindas"],
    tags: ["smoke", "auth", "critical"],
    priority: "critical",
    assigneeId: "user-1",
    estimatedDuration: 5,
    status: "passed",
    createdAt: new Date("2024-12-01"),
    updatedAt: new Date("2024-12-10"),
  },
  {
    id: "2",
    title: "Adicionar produto ao carrinho",
    companyId: "1",
    sprintId: "1",
    suiteId: "suite-5",
    feature: "Carrinho de Compras",
    given: ["o usuário está logado", "existe um produto disponível"],
    when: ["ele clica no botão adicionar ao carrinho"],
    then: ["o produto deve aparecer no carrinho", "o contador do carrinho deve atualizar"],
    tags: ["e-commerce", "cart"],
    priority: "high",
    assigneeId: "user-2",
    estimatedDuration: 8,
    status: "ready",
    createdAt: new Date("2024-12-02"),
    updatedAt: new Date("2024-12-02"),
  },
  {
    id: "3",
    title: "Transferência entre contas",
    companyId: "2",
    sprintId: "3",
    suiteId: "suite-6",
    feature: "Transações",
    given: ["o usuário possui saldo suficiente", "a conta destino é válida"],
    when: ["ele realiza uma transferência"],
    then: ["o saldo deve ser atualizado", "um comprovante deve ser gerado"],
    tags: ["finance", "transaction", "critical"],
    priority: "critical",
    assigneeId: "user-4",
    estimatedDuration: 10,
    status: "failed",
    createdAt: new Date("2024-11-20"),
    updatedAt: new Date("2024-11-25"),
  },
  {
    id: "4",
    title: "Login com senha incorreta",
    companyId: "1",
    sprintId: "1",
    suiteId: "suite-3",
    feature: "Autenticação",
    given: ["o usuário está na página de login"],
    when: ["ele preenche email correto e senha incorreta", "clica no botão entrar"],
    then: ["deve ver uma mensagem de erro", "deve permanecer na página de login"],
    tags: ["auth", "negative"],
    priority: "medium",
    assigneeId: "user-1",
    estimatedDuration: 3,
    status: "passed",
    createdAt: new Date("2024-12-05"),
    updatedAt: new Date("2024-12-05"),
  },
];

// Mock test runs for history
const initialTestRuns: TestRun[] = [
  { id: "run-1", scenarioId: "1", executedBy: "user-1", startedAt: new Date("2024-12-10T10:00:00"), completedAt: new Date("2024-12-10T10:05:00"), duration: 5, status: "passed" },
  { id: "run-2", scenarioId: "1", executedBy: "user-1", startedAt: new Date("2024-12-09T14:00:00"), completedAt: new Date("2024-12-09T14:04:00"), duration: 4, status: "passed" },
  { id: "run-3", scenarioId: "1", executedBy: "user-2", startedAt: new Date("2024-12-08T09:00:00"), completedAt: new Date("2024-12-08T09:06:00"), duration: 6, status: "failed", errorMessage: "Timeout ao aguardar dashboard" },
  { id: "run-4", scenarioId: "2", executedBy: "user-2", startedAt: new Date("2024-12-10T11:00:00"), completedAt: new Date("2024-12-10T11:08:00"), duration: 8, status: "passed" },
  { id: "run-5", scenarioId: "3", executedBy: "user-4", startedAt: new Date("2024-11-25T15:00:00"), completedAt: new Date("2024-11-25T15:12:00"), duration: 12, status: "failed", errorMessage: "Saldo insuficiente não tratado" },
  { id: "run-6", scenarioId: "4", executedBy: "user-1", startedAt: new Date("2024-12-05T16:00:00"), completedAt: new Date("2024-12-05T16:03:00"), duration: 3, status: "passed" },
  { id: "run-7", scenarioId: "1", executedBy: "user-1", startedAt: new Date("2024-12-07T10:00:00"), completedAt: new Date("2024-12-07T10:05:00"), duration: 5, status: "passed" },
  { id: "run-8", scenarioId: "3", executedBy: "user-4", startedAt: new Date("2024-11-24T10:00:00"), completedAt: new Date("2024-11-24T10:11:00"), duration: 11, status: "passed" },
];

export function useBddStore() {
  const [companies, setCompanies] = useLocalStorage<Company[]>("bdd-companies", initialCompanies);
  const [sprints, setSprints] = useLocalStorage<Sprint[]>("bdd-sprints", initialSprints);
  const [scenarios, setScenarios] = useLocalStorage<Scenario[]>("bdd-scenarios", initialScenarios);
  const [suites, setSuites] = useLocalStorage<TestSuite[]>("bdd-suites", initialSuites);
  const [teamMembers, setTeamMembers] = useLocalStorage<TeamMember[]>("bdd-team-members", initialTeamMembers);
  const [testRuns, setTestRuns] = useLocalStorage<TestRun[]>("bdd-test-runs", initialTestRuns);

  // Company operations
  const addCompany = useCallback((company: Omit<Company, "id" | "createdAt">) => {
    const newCompany: Company = {
      ...company,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setCompanies((prev) => [...prev, newCompany]);
    return newCompany;
  }, []);

  const updateCompany = useCallback((id: string, updates: Partial<Company>) => {
    setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, []);

  const deleteCompany = useCallback((id: string) => {
    setCompanies((prev) => prev.filter((c) => c.id !== id));
    setSprints((prev) => prev.filter((s) => s.companyId !== id));
    setScenarios((prev) => prev.filter((s) => s.companyId !== id));
    setSuites((prev) => prev.filter((s) => s.companyId !== id));
  }, []);

  // Sprint operations
  const addSprint = useCallback((sprint: Omit<Sprint, "id">) => {
    const newSprint: Sprint = { ...sprint, id: Date.now().toString() };
    setSprints((prev) => [...prev, newSprint]);
    return newSprint;
  }, []);

  const updateSprint = useCallback((id: string, updates: Partial<Sprint>) => {
    setSprints((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  }, []);

  const deleteSprint = useCallback((id: string) => {
    setSprints((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // Suite operations
  const addSuite = useCallback((suite: Omit<TestSuite, "id" | "createdAt" | "order">) => {
    const siblingCount = suites.filter((s) => s.companyId === suite.companyId && s.parentId === suite.parentId).length;
    const newSuite: TestSuite = { ...suite, id: `suite-${Date.now()}`, order: siblingCount, createdAt: new Date() };
    setSuites((prev) => [...prev, newSuite]);
    return newSuite;
  }, [suites]);

  const updateSuite = useCallback((id: string, updates: Partial<TestSuite>) => {
    setSuites((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  }, []);

  const deleteSuite = useCallback((id: string) => {
    const getDescendantIds = (parentId: string): string[] => {
      const children = suites.filter((s) => s.parentId === parentId);
      return children.flatMap((c) => [c.id, ...getDescendantIds(c.id)]);
    };
    const idsToDelete = [id, ...getDescendantIds(id)];
    setSuites((prev) => prev.filter((s) => !idsToDelete.includes(s.id)));
    setScenarios((prev) => prev.map((s) => (idsToDelete.includes(s.suiteId || "") ? { ...s, suiteId: undefined } : s)));
  }, [suites]);

  const moveSuite = useCallback((suiteId: string, newParentId: string | null, newOrder: number) => {
    setSuites((prev) => {
      const suite = prev.find((s) => s.id === suiteId);
      if (!suite) return prev;
      const oldSiblings = prev.filter((s) => s.parentId === suite.parentId && s.id !== suiteId);
      const newSiblings = prev.filter((s) => s.parentId === newParentId && s.id !== suiteId);
      return prev.map((s) => {
        if (s.id === suiteId) return { ...s, parentId: newParentId, order: newOrder };
        if (s.parentId === suite.parentId && s.id !== suiteId) {
          const idx = oldSiblings.findIndex((os) => os.id === s.id);
          return { ...s, order: idx };
        }
        if (s.parentId === newParentId && s.id !== suiteId) {
          const idx = newSiblings.findIndex((ns) => ns.id === s.id);
          if (idx >= newOrder) return { ...s, order: idx + 1 };
        }
        return s;
      });
    });
  }, []);

  const moveScenarioToSuite = useCallback((scenarioId: string, suiteId: string | undefined) => {
    setScenarios((prev) => prev.map((s) => (s.id === scenarioId ? { ...s, suiteId, updatedAt: new Date() } : s)));
  }, []);

  const getSuiteTree = useCallback((companyId: string): SuiteTreeNode[] => {
    const companySuites = suites.filter((s) => s.companyId === companyId).sort((a, b) => a.order - b.order);
    const companyScenarios = scenarios.filter((s) => s.companyId === companyId);
    const buildTree = (parentId: string | null): SuiteTreeNode[] => {
      return companySuites
        .filter((s) => s.parentId === parentId)
        .map((suite) => ({ ...suite, children: buildTree(suite.id), scenarios: companyScenarios.filter((sc) => sc.suiteId === suite.id) }));
    };
    return buildTree(null);
  }, [suites, scenarios]);

  // Scenario operations
  const addScenario = useCallback((scenario: Omit<Scenario, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date();
    const newScenario: Scenario = { ...scenario, id: Date.now().toString(), createdAt: now, updatedAt: now };
    setScenarios((prev) => [...prev, newScenario]);
    return newScenario;
  }, []);

  const updateScenario = useCallback((id: string, updates: Partial<Scenario>) => {
    setScenarios((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates, updatedAt: new Date() } : s)));
  }, []);

  const deleteScenario = useCallback((id: string) => {
    setScenarios((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // Test run operations
  const addTestRun = useCallback((run: Omit<TestRun, "id">) => {
    const newRun: TestRun = { ...run, id: `run-${Date.now()}` };
    setTestRuns((prev) => [...prev, newRun]);
    return newRun;
  }, []);

  const getScenarioRuns = useCallback((scenarioId: string) => {
    return testRuns.filter((r) => r.scenarioId === scenarioId).sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }, [testRuns]);

  // Stats helpers
  const getCompanyStats = useCallback((companyId: string) => {
    const companyScenarios = scenarios.filter((s) => s.companyId === companyId);
    const companySprints = sprints.filter((s) => s.companyId === companyId);
    return {
      scenarioCount: companyScenarios.length,
      sprintCount: companySprints.length,
      passedCount: companyScenarios.filter((s) => s.status === "passed").length,
      failedCount: companyScenarios.filter((s) => s.status === "failed").length,
    };
  }, [scenarios, sprints]);

  const getSprintStats = useCallback((sprintId: string) => {
    const sprintScenarios = scenarios.filter((s) => s.sprintId === sprintId);
    return {
      scenarioCount: sprintScenarios.length,
      passedCount: sprintScenarios.filter((s) => s.status === "passed").length,
      failedCount: sprintScenarios.filter((s) => s.status === "failed").length,
    };
  }, [scenarios]);

  const getUnsortedScenarios = useCallback((companyId: string) => {
    return scenarios.filter((s) => s.companyId === companyId && !s.suiteId);
  }, [scenarios]);

  // Daily stats for charts
  const getDailyStats = useCallback((companyId: string, days: number = 7): DailyStats[] => {
    const companyRuns = testRuns.filter((r) => {
      const scenario = scenarios.find((s) => s.id === r.scenarioId);
      return scenario?.companyId === companyId;
    });

    const stats: DailyStats[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      
      const dayRuns = companyRuns.filter((r) => r.startedAt.toISOString().split("T")[0] === dateStr);
      stats.push({
        date: dateStr,
        passed: dayRuns.filter((r) => r.status === "passed").length,
        failed: dayRuns.filter((r) => r.status === "failed").length,
        total: dayRuns.length,
      });
    }
    return stats;
  }, [testRuns, scenarios]);

  // Get team member by ID
  const getTeamMember = useCallback((id: string) => {
    return teamMembers.find((m) => m.id === id);
  }, [teamMembers]);

  const getCompanyTeamMembers = useCallback((companyId: string) => {
    return teamMembers.filter((m) => m.companyId === companyId);
  }, [teamMembers]);

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
