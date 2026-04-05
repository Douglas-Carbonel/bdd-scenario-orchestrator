import * as XLSX from "xlsx";
import {
  Company, Product, Sprint, Scenario, TestRun, Defect,
  TeamMember, Team, MemberRole,
} from "@/types/bdd";

/* ── helpers ──────────────────────────────────────────────────────────────── */

const fmtDate = (d: Date | string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("pt-BR") : "";

const fmtDateTime = (d: Date | string | null | undefined) =>
  d ? new Date(d).toLocaleString("pt-BR") : "";

const roleLabel: Record<MemberRole, string> = {
  qa: "QA Engineer", dev: "Desenvolvedor", po: "Product Owner",
  lead: "Tech Lead", analyst: "Analista",
};

function download(wb: XLSX.WorkBook, filename: string, fmt: "xlsx" | "csv") {
  if (fmt === "csv") {
    const ws = wb.Sheets[wb.SheetNames[0]];
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${filename}.csv`; a.click();
    URL.revokeObjectURL(url);
  } else {
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }
}

function makeBook(rows: Record<string, unknown>[], sheetName: string) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return wb;
}

/* ── scenarios ────────────────────────────────────────────────────────────── */

export interface ScenarioExportFilters {
  companyId?: string;
  sprintId?: string;
  status?: string;
  executionType?: string;
}

export function exportScenarios(
  scenarios: Scenario[],
  companies: Company[],
  products: Product[],
  sprints: Sprint[],
  teamMembers: TeamMember[],
  filters: ScenarioExportFilters,
  fmt: "xlsx" | "csv",
) {
  let data = scenarios;
  if (filters.companyId)     data = data.filter(s => s.companyId === filters.companyId);
  if (filters.sprintId)      data = data.filter(s => s.sprintId  === filters.sprintId);
  if (filters.status)        data = data.filter(s => s.status    === filters.status);
  if (filters.executionType) data = data.filter(s => s.executionType === filters.executionType);

  const companyMap  = Object.fromEntries(companies.map(c => [c.id, c.name]));
  const productMap  = Object.fromEntries(products.map(p => [p.id, p.name]));
  const sprintMap   = Object.fromEntries(sprints.map(s => [s.id, s.name]));
  const memberMap   = Object.fromEntries(teamMembers.map(m => [m.id, m.name]));

  const statusLabel: Record<string, string> = {
    draft: "Rascunho", ready: "Pronto", running: "Executando",
    passed: "Passou", failed: "Falhou",
  };
  const priorityLabel: Record<string, string> = {
    critical: "Crítico", high: "Alto", medium: "Médio", low: "Baixo",
  };

  const rows = data.map(s => ({
    ID:              s.id,
    Empresa:         companyMap[s.companyId]  ?? "",
    Produto:         productMap[s.productId ?? ""] ?? "",
    Sprint:          sprintMap[s.sprintId   ?? ""] ?? "",
    Feature:         s.feature,
    Cenário:         s.title,
    Prioridade:      priorityLabel[s.priority] ?? s.priority,
    Status:          statusLabel[s.status]     ?? s.status,
    Tipo:            s.executionType === "automated" ? "Automatizado" : "Manual",
    Tags:            s.tags.join(", "),
    Responsável:     memberMap[s.assigneeId ?? ""] ?? "",
    "Duração Est.(min)": s.estimatedDuration,
    "Duração Real(min)": s.actualDuration ?? "",
    Given:           s.given.join(" | "),
    When:            s.when.join(" | "),
    Then:            s.then.join(" | "),
    "Criado em":     fmtDate(s.createdAt),
    "Atualizado em": fmtDate(s.updatedAt),
  }));

  const wb = makeBook(rows, "Cenários");
  download(wb, `4qa-cenarios-${Date.now()}`, fmt);
  return rows.length;
}

/* ── test runs ────────────────────────────────────────────────────────────── */

export interface RunExportFilters {
  companyId?: string;
  sprintId?: string;
  status?: string;
}

export function exportTestRuns(
  testRuns: TestRun[],
  scenarios: Scenario[],
  companies: Company[],
  sprints: Sprint[],
  filters: RunExportFilters,
  fmt: "xlsx" | "csv",
) {
  const scenarioMap = Object.fromEntries(scenarios.map(s => [s.id, s]));
  const companyMap  = Object.fromEntries(companies.map(c => [c.id, c.name]));
  const sprintMap   = Object.fromEntries(sprints.map(s => [s.id, s.name]));

  let data = testRuns;
  if (filters.companyId) {
    const companyScenarioIds = new Set(
      scenarios.filter(s => s.companyId === filters.companyId).map(s => s.id)
    );
    data = data.filter(r => companyScenarioIds.has(r.scenarioId));
  }
  if (filters.sprintId) data = data.filter(r => r.sprintId === filters.sprintId);
  if (filters.status)   data = data.filter(r => r.status   === filters.status);

  const statusLabel: Record<string, string> = {
    running: "Executando", passed: "Passou", failed: "Falhou",
  };

  const rows = data.map(r => {
    const sc = scenarioMap[r.scenarioId];
    return {
      ID:          r.id,
      Cenário:     sc?.title ?? r.scenarioId,
      Feature:     sc?.feature ?? "",
      Empresa:     companyMap[sc?.companyId ?? ""] ?? "",
      Sprint:      sprintMap[r.sprintId ?? ""] ?? "",
      Status:      statusLabel[r.status] ?? r.status,
      Executor:    r.executedBy,
      "Iniciado em":   fmtDateTime(r.startedAt),
      "Concluído em":  fmtDateTime(r.completedAt),
      "Duração (min)": r.duration ?? "",
      Erro:            r.errorMessage ?? "",
    };
  });

  const wb = makeBook(rows, "Execuções");
  download(wb, `4qa-execucoes-${Date.now()}`, fmt);
  return rows.length;
}

/* ── defects ──────────────────────────────────────────────────────────────── */

export interface DefectExportFilters {
  companyId?: string;
  sprintId?: string;
  status?: string;
  severity?: string;
}

export function exportDefects(
  defects: Defect[],
  scenarios: Scenario[],
  companies: Company[],
  sprints: Sprint[],
  filters: DefectExportFilters,
  fmt: "xlsx" | "csv",
) {
  const scenarioMap = Object.fromEntries(scenarios.map(s => [s.id, s]));
  const companyMap  = Object.fromEntries(companies.map(c => [c.id, c.name]));
  const sprintMap   = Object.fromEntries(sprints.map(s => [s.id, s.name]));

  let data = defects;
  if (filters.companyId) {
    const companyScenarioIds = new Set(
      scenarios.filter(s => s.companyId === filters.companyId).map(s => s.id)
    );
    data = data.filter(d => companyScenarioIds.has(d.scenarioId));
  }
  if (filters.sprintId) data = data.filter(d => d.sprintId === filters.sprintId);
  if (filters.status)   data = data.filter(d => d.status   === filters.status);
  if (filters.severity) data = data.filter(d => d.severity === filters.severity);

  const statusLabel: Record<string, string> = {
    open: "Aberto", fixed: "Corrigido", verified: "Verificado", reopened: "Reaberto",
  };
  const severityLabel: Record<string, string> = {
    critical: "Crítico", high: "Alto", medium: "Médio", low: "Baixo",
  };

  const rows = data.map(d => {
    const sc = scenarioMap[d.scenarioId];
    return {
      ID:          d.id,
      Título:      d.title,
      Descrição:   d.description ?? "",
      Severidade:  severityLabel[d.severity] ?? d.severity,
      Status:      statusLabel[d.status]     ?? d.status,
      Cenário:     sc?.title ?? d.scenarioId,
      Empresa:     companyMap[sc?.companyId ?? ""] ?? "",
      Sprint:      sprintMap[d.sprintId ?? ""] ?? "",
      "Relatado por":   d.reportedBy,
      "Nota de correção": d.fixNote ?? "",
      "Criado em":      fmtDate(d.createdAt),
      "Atualizado em":  fmtDate(d.updatedAt),
    };
  });

  const wb = makeBook(rows, "Bugs");
  download(wb, `4qa-bugs-${Date.now()}`, fmt);
  return rows.length;
}

/* ── team ─────────────────────────────────────────────────────────────────── */

export function exportTeam(
  teamMembers: TeamMember[],
  teams: Team[],
  companies: Company[],
  companyId: string | undefined,
  fmt: "xlsx" | "csv",
) {
  const companyMap = Object.fromEntries(companies.map(c => [c.id, c.name]));

  const members = companyId
    ? teamMembers.filter(m => m.companyId === companyId)
    : teamMembers;

  const memberTeam = (memberId: string) =>
    teams.find(t => t.memberIds.includes(memberId))?.name ?? "";

  const rows = members.map(m => ({
    ID:        m.id,
    Nome:      m.name,
    Email:     m.email,
    Função:    roleLabel[m.role ?? "qa"] ?? m.role ?? "",
    Equipe:    memberTeam(m.id),
    Empresa:   companyMap[m.companyId] ?? "",
  }));

  const wb = makeBook(rows, "Time");
  download(wb, `4qa-time-${Date.now()}`, fmt);
  return rows.length;
}
