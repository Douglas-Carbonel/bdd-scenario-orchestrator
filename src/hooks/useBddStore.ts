import { useState, useCallback } from "react";
import { Company, Sprint, Scenario } from "@/types/bdd";

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

const initialScenarios: Scenario[] = [
  {
    id: "1",
    title: "Login com credenciais válidas",
    companyId: "1",
    sprintId: "1",
    feature: "Autenticação",
    given: ["o usuário está na página de login", "possui uma conta válida"],
    when: ["ele preenche email e senha corretamente", "clica no botão entrar"],
    then: ["deve ser redirecionado para o dashboard", "deve ver uma mensagem de boas-vindas"],
    tags: ["smoke", "auth", "critical"],
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
    feature: "Carrinho de Compras",
    given: ["o usuário está logado", "existe um produto disponível"],
    when: ["ele clica no botão adicionar ao carrinho"],
    then: ["o produto deve aparecer no carrinho", "o contador do carrinho deve atualizar"],
    tags: ["e-commerce", "cart"],
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
    feature: "Transações",
    given: ["o usuário possui saldo suficiente", "a conta destino é válida"],
    when: ["ele realiza uma transferência"],
    then: ["o saldo deve ser atualizado", "um comprovante deve ser gerado"],
    tags: ["finance", "transaction", "critical"],
    estimatedDuration: 10,
    status: "failed",
    createdAt: new Date("2024-11-20"),
    updatedAt: new Date("2024-11-25"),
  },
];

export function useBddStore() {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [sprints, setSprints] = useState<Sprint[]>(initialSprints);
  const [scenarios, setScenarios] = useState<Scenario[]>(initialScenarios);

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
    setCompanies((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  }, []);

  const deleteCompany = useCallback((id: string) => {
    setCompanies((prev) => prev.filter((c) => c.id !== id));
    setSprints((prev) => prev.filter((s) => s.companyId !== id));
    setScenarios((prev) => prev.filter((s) => s.companyId !== id));
  }, []);

  // Sprint operations
  const addSprint = useCallback((sprint: Omit<Sprint, "id">) => {
    const newSprint: Sprint = {
      ...sprint,
      id: Date.now().toString(),
    };
    setSprints((prev) => [...prev, newSprint]);
    return newSprint;
  }, []);

  const updateSprint = useCallback((id: string, updates: Partial<Sprint>) => {
    setSprints((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  }, []);

  const deleteSprint = useCallback((id: string) => {
    setSprints((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // Scenario operations
  const addScenario = useCallback((scenario: Omit<Scenario, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date();
    const newScenario: Scenario = {
      ...scenario,
      id: Date.now().toString(),
      createdAt: now,
      updatedAt: now,
    };
    setScenarios((prev) => [...prev, newScenario]);
    return newScenario;
  }, []);

  const updateScenario = useCallback((id: string, updates: Partial<Scenario>) => {
    setScenarios((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, ...updates, updatedAt: new Date() } : s
      )
    );
  }, []);

  const deleteScenario = useCallback((id: string) => {
    setScenarios((prev) => prev.filter((s) => s.id !== id));
  }, []);

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

  return {
    companies,
    sprints,
    scenarios,
    addCompany,
    updateCompany,
    deleteCompany,
    addSprint,
    updateSprint,
    deleteSprint,
    addScenario,
    updateScenario,
    deleteScenario,
    getCompanyStats,
    getSprintStats,
  };
}
