import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Download, FileSpreadsheet, FileText, Filter, FlaskConical,
  Play, Bug, Users, CheckCircle2, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  Company, Product, Sprint, Scenario, TestRun, Defect, TeamMember, Team,
} from "@/types/bdd";
import {
  exportScenarios, exportTestRuns, exportDefects, exportTeam,
  ScenarioExportFilters, RunExportFilters, DefectExportFilters,
} from "@/utils/spreadsheetExport";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ExportType = "scenarios" | "runs" | "defects" | "team";
type ExportFmt  = "xlsx" | "csv";

interface ExportViewProps {
  companies:   Company[];
  products:    Product[];
  sprints:     Sprint[];
  scenarios:   Scenario[];
  testRuns:    TestRun[];
  defects:     Defect[];
  teamMembers: TeamMember[];
  teams:       Team[];
}

const ANY = "__any__";

const TYPE_META: {
  id: ExportType;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}[] = [
  { id: "scenarios", icon: FlaskConical, iconBg: "bg-primary/10",     iconColor: "text-primary" },
  { id: "runs",      icon: Play,         iconBg: "bg-emerald-500/10",  iconColor: "text-emerald-400" },
  { id: "defects",   icon: Bug,          iconBg: "bg-destructive/10",  iconColor: "text-destructive" },
  { id: "team",      icon: Users,        iconBg: "bg-violet-500/10",   iconColor: "text-violet-400" },
];

const COLUMNS: Record<ExportType, string[]> = {
  scenarios: ["ID","Empresa","Produto","Sprint","Feature","Cenário","Prioridade","Status","Tipo","Tags","Responsável","Duração Est.","Duração Real","Given","When","Then","Criado em","Atualizado em"],
  runs:      ["ID","Cenário","Feature","Empresa","Sprint","Status","Executor","Iniciado em","Concluído em","Duração (min)","Erro"],
  defects:   ["ID","Título","Descrição","Severidade","Status","Cenário","Empresa","Sprint","Relatado por","Nota de correção","Criado em","Atualizado em"],
  team:      ["ID","Nome","Email","Função","Equipe","Empresa"],
};

/* ─── Step label ─────────────────────────────────────────── */
function StepLabel({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="h-5 w-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-primary">{n}</span>
      </div>
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="h-px flex-1 bg-border/60" />
    </div>
  );
}

/* ─── Main view ──────────────────────────────────────────── */
export function ExportView({
  companies, products, sprints, scenarios, testRuns, defects, teamMembers, teams,
}: ExportViewProps) {
  const { t } = useTranslation();
  const [exportType, setExportType] = useState<ExportType>("scenarios");
  const [fmt,        setFmt]        = useState<ExportFmt>("xlsx");
  const [companyId,  setCompanyId]  = useState(ANY);
  const [sprintId,   setSprintId]   = useState(ANY);
  const [status,     setStatus]     = useState(ANY);
  const [severity,   setSeverity]   = useState(ANY);
  const [execType,   setExecType]   = useState(ANY);
  const [showCols,   setShowCols]   = useState(false);

  const effectiveCompany  = companyId === ANY ? undefined : companyId;
  const effectiveSprint   = sprintId  === ANY ? undefined : sprintId;
  const effectiveStatus   = status    === ANY ? undefined : status;
  const effectiveSeverity = severity  === ANY ? undefined : severity;
  const effectiveExecType = execType  === ANY ? undefined : execType;

  const filteredSprints = effectiveCompany
    ? sprints.filter(s => s.companyId === effectiveCompany)
    : sprints;

  const previewCount = useMemo(() => {
    if (exportType === "scenarios") {
      let d = scenarios;
      if (effectiveCompany)  d = d.filter(s => s.companyId     === effectiveCompany);
      if (effectiveSprint)   d = d.filter(s => s.sprintId      === effectiveSprint);
      if (effectiveStatus)   d = d.filter(s => s.status        === effectiveStatus);
      if (effectiveExecType) d = d.filter(s => s.executionType === effectiveExecType);
      return d.length;
    }
    if (exportType === "runs") {
      let d = testRuns;
      if (effectiveCompany) {
        const ids = new Set(scenarios.filter(s => s.companyId === effectiveCompany).map(s => s.id));
        d = d.filter(r => ids.has(r.scenarioId));
      }
      if (effectiveSprint) d = d.filter(r => r.sprintId === effectiveSprint);
      if (effectiveStatus) d = d.filter(r => r.status   === effectiveStatus);
      return d.length;
    }
    if (exportType === "defects") {
      let d = defects;
      if (effectiveCompany) {
        const ids = new Set(scenarios.filter(s => s.companyId === effectiveCompany).map(s => s.id));
        d = d.filter(x => ids.has(x.scenarioId));
      }
      if (effectiveSprint)   d = d.filter(x => x.sprintId === effectiveSprint);
      if (effectiveStatus)   d = d.filter(x => x.status   === effectiveStatus);
      if (effectiveSeverity) d = d.filter(x => x.severity === effectiveSeverity);
      return d.length;
    }
    if (exportType === "team") {
      return effectiveCompany
        ? teamMembers.filter(m => m.companyId === effectiveCompany).length
        : teamMembers.length;
    }
    return 0;
  }, [exportType, scenarios, testRuns, defects, teamMembers,
      effectiveCompany, effectiveSprint, effectiveStatus, effectiveSeverity, effectiveExecType]);

  const handleExport = () => {
    let count = 0;
    if (exportType === "scenarios") {
      const f: ScenarioExportFilters = { companyId: effectiveCompany, sprintId: effectiveSprint, status: effectiveStatus, executionType: effectiveExecType };
      count = exportScenarios(scenarios, companies, products, sprints, teamMembers, f, fmt);
    } else if (exportType === "runs") {
      const f: RunExportFilters = { companyId: effectiveCompany, sprintId: effectiveSprint, status: effectiveStatus };
      count = exportTestRuns(testRuns, scenarios, companies, sprints, f, fmt);
    } else if (exportType === "defects") {
      const f: DefectExportFilters = { companyId: effectiveCompany, sprintId: effectiveSprint, status: effectiveStatus, severity: effectiveSeverity };
      count = exportDefects(defects, scenarios, companies, sprints, f, fmt);
    } else if (exportType === "team") {
      count = exportTeam(teamMembers, teams, companies, effectiveCompany, fmt);
    }
    toast.success(t("export.exportSuccess", { count }));
  };

  const activeMeta = TYPE_META.find(m => m.id === exportType)!;
  const ActiveIcon = activeMeta.icon;

  /* active filters count */
  const filterCount = [effectiveCompany, effectiveSprint, effectiveStatus, effectiveSeverity, effectiveExecType]
    .filter(Boolean).length;

  return (
    <div className="space-y-8 max-w-3xl animate-fade-in">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">{t("export.title")}</h1>
        <p className="text-muted-foreground">{t("export.subtitle")}</p>
      </div>

      {/* ── Step 1 — O que exportar ──────────────────────── */}
      <div>
        <StepLabel n={1} label={t("export.whatToExport")} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TYPE_META.map(({ id, icon: Icon, iconBg, iconColor }) => {
            const active = exportType === id;
            return (
              <button
                key={id}
                onClick={() => {
                  setExportType(id);
                  setStatus(ANY); setSeverity(ANY); setExecType(ANY);
                }}
                className={cn(
                  "relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-center",
                  active
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                    : "border-border bg-card hover:border-primary/30 hover:bg-secondary/30"
                )}
              >
                {active && (
                  <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                    <CheckCircle2 className="h-2.5 w-2.5 text-primary-foreground" />
                  </div>
                )}
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", iconBg)}>
                  <Icon className={cn("h-5 w-5", iconColor)} />
                </div>
                <div>
                  <p className={cn("text-sm font-semibold leading-tight",
                    active ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {t(`export.${id}_label`)}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-0.5 leading-tight">
                    {t(`export.${id}_desc`)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Step 2 — Filtros ─────────────────────────────── */}
      <div>
        <StepLabel n={2} label={t("export.filters")} />
        <div className="glass-card rounded-xl p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Empresa */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t("export.companyFilter")}</label>
              <Select value={companyId} onValueChange={v => { setCompanyId(v); setSprintId(ANY); }}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>{t("export.allCompanies")}</SelectItem>
                  {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Sprint */}
            {exportType !== "team" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{t("export.sprintFilter")}</label>
                <Select value={sprintId} onValueChange={setSprintId}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>{t("export.allSprints")}</SelectItem>
                    {filteredSprints.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Status */}
            {exportType !== "team" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{t("export.statusFilter")}</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>{t("export.allStatus")}</SelectItem>
                    {exportType === "scenarios" && <>
                      <SelectItem value="draft">{t("scenarioStatus.draft")}</SelectItem>
                      <SelectItem value="ready">{t("scenarioStatus.ready")}</SelectItem>
                      <SelectItem value="running">{t("scenarioStatus.running")}</SelectItem>
                      <SelectItem value="passed">{t("scenarioStatus.passed")}</SelectItem>
                      <SelectItem value="failed">{t("scenarioStatus.failed")}</SelectItem>
                    </>}
                    {exportType === "runs" && <>
                      <SelectItem value="running">{t("scenarioStatus.running")}</SelectItem>
                      <SelectItem value="passed">{t("scenarioStatus.passed")}</SelectItem>
                      <SelectItem value="failed">{t("scenarioStatus.failed")}</SelectItem>
                    </>}
                    {exportType === "defects" && <>
                      <SelectItem value="open">{t("defectStatus.open")}</SelectItem>
                      <SelectItem value="fixed">{t("defectStatus.fixed")}</SelectItem>
                      <SelectItem value="verified">{t("defectStatus.verified")}</SelectItem>
                      <SelectItem value="reopened">{t("defectStatus.reopened")}</SelectItem>
                    </>}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Severidade — somente defeitos */}
            {exportType === "defects" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{t("export.severityFilter")}</label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>{t("export.allSeverities")}</SelectItem>
                    <SelectItem value="critical">{t("defectSeverity.critical")}</SelectItem>
                    <SelectItem value="high">{t("defectSeverity.high")}</SelectItem>
                    <SelectItem value="medium">{t("defectSeverity.medium")}</SelectItem>
                    <SelectItem value="low">{t("defectSeverity.low")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Tipo de execução — somente cenários */}
            {exportType === "scenarios" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{t("export.execTypeFilter")}</label>
                <Select value={execType} onValueChange={setExecType}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>{t("export.allTypes")}</SelectItem>
                    <SelectItem value="manual">{t("executionType.manual")}</SelectItem>
                    <SelectItem value="automated">{t("executionType.automated")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Filtros ativos */}
          {filterCount > 0 && (
            <div className="mt-3 pt-3 border-t border-border/60 flex items-center gap-2 text-xs text-muted-foreground">
              <Filter className="h-3 w-3" />
              <span>{filterCount} filtro{filterCount > 1 ? "s" : ""} ativo{filterCount > 1 ? "s" : ""}</span>
              <button
                onClick={() => { setCompanyId(ANY); setSprintId(ANY); setStatus(ANY); setSeverity(ANY); setExecType(ANY); }}
                className="ml-auto text-primary hover:underline"
              >
                {t("common.clearFilters")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Step 3 — Formato e exportação ───────────────── */}
      <div>
        <StepLabel n={3} label={t("export.format")} />
        <div className="glass-card rounded-xl overflow-hidden">

          {/* Summary bar */}
          <div className="flex items-center gap-4 px-5 py-4 border-b border-border/60 bg-secondary/20">
            <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", activeMeta.iconBg)}>
              <ActiveIcon className={cn("h-4.5 w-4.5", activeMeta.iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{t(`export.${exportType}_label`)}</p>
              <p className="text-xs text-muted-foreground">{COLUMNS[exportType].length} colunas</p>
            </div>
            <div className="text-right shrink-0">
              <p className={cn("text-2xl font-bold font-mono",
                previewCount === 0 ? "text-muted-foreground" : "text-foreground"
              )}>
                {previewCount}
              </p>
              <p className="text-xs text-muted-foreground">{t("export.lines")}</p>
            </div>
          </div>

          {/* Columns toggle */}
          <button
            onClick={() => setShowCols(v => !v)}
            className="w-full flex items-center justify-between px-5 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/20 transition-colors border-b border-border/60"
          >
            <span className="font-medium">{t("export.columns")}</span>
            {showCols ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {showCols && (
            <div className="px-5 py-3 border-b border-border/60 flex flex-wrap gap-1.5">
              {COLUMNS[exportType].map(col => (
                <Badge key={col} variant="secondary" className="text-xs font-mono">{col}</Badge>
              ))}
            </div>
          )}

          {/* Format + export */}
          <div className="px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Format selector */}
            <div className="flex items-center gap-2">
              {(["xlsx", "csv"] as ExportFmt[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFmt(f)}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm font-medium transition-all",
                    fmt === f
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {f === "xlsx"
                    ? <FileSpreadsheet className="h-4 w-4" />
                    : <FileText className="h-4 w-4" />}
                  .{f.toUpperCase()}
                </button>
              ))}
              <span className="text-xs text-muted-foreground hidden sm:block">
                {fmt === "xlsx" ? t("export.xlsxDesc") : t("export.csvDesc")}
              </span>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Export button */}
            <Button
              className="gap-2 h-10 w-full sm:w-auto"
              disabled={previewCount === 0}
              onClick={handleExport}
            >
              <Download className="h-4 w-4" />
              {t("export.exportButton", {
                count: previewCount,
                unit:  previewCount === 1 ? t("common.row") : t("common.rows"),
                fmt:   fmt.toUpperCase(),
              })}
            </Button>
          </div>

          {/* Status messages */}
          {previewCount === 0 && (
            <div className="px-5 pb-4">
              <p className="text-xs text-muted-foreground/60 italic">{t("export.noDataFilter")}</p>
            </div>
          )}
          {previewCount > 0 && (
            <div className="px-5 pb-4 flex items-center gap-1.5 text-xs text-muted-foreground/60">
              <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
              {t("export.privacyNote")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
