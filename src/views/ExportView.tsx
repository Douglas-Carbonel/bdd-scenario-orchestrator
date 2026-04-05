import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Download, FileSpreadsheet, FileText, Filter, FlaskConical,
  Play, Bug, Users, ChevronRight, CheckCircle2, Table2,
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

const exportTypeIcons: Record<ExportType, React.ElementType> = {
  scenarios: FlaskConical,
  runs:      Play,
  defects:   Bug,
  team:      Users,
};

const exportTypeColor: Record<ExportType, string> = {
  scenarios: "text-primary",
  runs:      "text-emerald-400",
  defects:   "text-destructive",
  team:      "text-purple-400",
};

const columnsByType: Record<ExportType, string[]> = {
  scenarios: ["ID","Empresa","Produto","Sprint","Feature","Cenário","Prioridade","Status","Tipo","Tags","Responsável","Duração Est.","Duração Real","Given","When","Then","Criado em","Atualizado em"],
  runs:      ["ID","Cenário","Feature","Empresa","Sprint","Status","Executor","Iniciado em","Concluído em","Duração (min)","Erro"],
  defects:   ["ID","Título","Descrição","Severidade","Status","Cenário","Empresa","Sprint","Relatado por","Nota de correção","Criado em","Atualizado em"],
  team:      ["ID","Nome","Email","Função","Equipe","Empresa"],
};

export function ExportView({
  companies, products, sprints, scenarios, testRuns, defects, teamMembers, teams,
}: ExportViewProps) {
  const { t } = useTranslation();
  const [exportType, setExportType] = useState<ExportType>("scenarios");
  const [fmt,        setFmt]        = useState<ExportFmt>("xlsx");
  const [companyId,  setCompanyId]  = useState<string>(ANY);
  const [sprintId,   setSprintId]   = useState<string>(ANY);
  const [status,     setStatus]     = useState<string>(ANY);
  const [severity,   setSeverity]   = useState<string>(ANY);
  const [execType,   setExecType]   = useState<string>(ANY);

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
  }, [exportType, scenarios, testRuns, defects, teamMembers, effectiveCompany, effectiveSprint, effectiveStatus, effectiveSeverity, effectiveExecType]);

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

  const Icon  = exportTypeIcons[exportType];
  const color = exportTypeColor[exportType];

  const exportTypeList: { id: ExportType }[] = [
    { id: "scenarios" }, { id: "runs" }, { id: "defects" }, { id: "team" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6 text-primary" />
          {t("export.title")}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{t("export.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Type selector */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("export.whatToExport")}
          </p>
          {exportTypeList.map(({ id }) => {
            const TIcon  = exportTypeIcons[id];
            const TColor = exportTypeColor[id];
            const active = exportType === id;
            return (
              <button
                key={id}
                onClick={() => { setExportType(id); setStatus(ANY); setSeverity(ANY); setExecType(ANY); }}
                className={cn(
                  "w-full text-left rounded-xl border p-4 transition-all",
                  active
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                    : "border-border bg-card hover:border-primary/40 hover:bg-secondary/40"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <TIcon className={cn("h-5 w-5 shrink-0", TColor)} />
                    <span className="font-medium text-foreground text-sm">{t(`export.${id}_label`)}</span>
                  </div>
                  {active && <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 pl-8">{t(`export.${id}_desc`)}</p>
              </button>
            );
          })}
        </div>

        {/* Filters + preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card rounded-xl p-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5" />{t("export.filters")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">{t("export.companyFilter")}</label>
                <Select value={companyId} onValueChange={v => { setCompanyId(v); setSprintId(ANY); }}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>{t("export.allCompanies")}</SelectItem>
                    {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {exportType !== "team" && (
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">{t("export.sprintFilter")}</label>
                  <Select value={sprintId} onValueChange={setSprintId}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ANY}>{t("export.allSprints")}</SelectItem>
                      {filteredSprints.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {exportType !== "team" && (
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">{t("export.statusFilter")}</label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
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

              {exportType === "defects" && (
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">{t("export.severityFilter")}</label>
                  <Select value={severity} onValueChange={setSeverity}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
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

              {exportType === "scenarios" && (
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">{t("export.execTypeFilter")}</label>
                  <Select value={execType} onValueChange={setExecType}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ANY}>{t("export.allTypes")}</SelectItem>
                      <SelectItem value="manual">{t("executionType.manual")}</SelectItem>
                      <SelectItem value="automated">{t("executionType.automated")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="glass-card rounded-xl p-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Table2 className="h-3.5 w-3.5" />{t("export.preview")}
            </p>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 border border-border">
              <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Icon className={cn("h-6 w-6", color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">{t(`export.${exportType}_label`)}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{t(`export.${exportType}_desc`)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold font-mono text-foreground">{previewCount}</p>
                <p className="text-xs text-muted-foreground">{t("export.lines")}</p>
              </div>
            </div>
            {previewCount === 0 && (
              <p className="text-sm text-muted-foreground/70 italic px-1">{t("export.noDataFilter")}</p>
            )}

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">{t("export.format")}</label>
              <div className="flex gap-2">
                {(["xlsx", "csv"] as ExportFmt[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setFmt(f)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                      fmt === f
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    {f === "xlsx" ? <FileSpreadsheet className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    .{f.toUpperCase()}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground/60">
                {fmt === "xlsx" ? t("export.xlsxDesc") : t("export.csvDesc")}
              </p>
            </div>

            <Button className="w-full gap-2 h-11" disabled={previewCount === 0} onClick={handleExport}>
              <Download className="h-4 w-4" />
              {t("export.exportButton", {
                count: previewCount,
                unit: previewCount === 1 ? t("common.row") : t("common.rows"),
                fmt: fmt.toUpperCase(),
              })}
            </Button>

            {previewCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                {t("export.privacyNote")}
              </div>
            )}
          </div>

          <div className="glass-card rounded-xl p-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("export.columns")}</p>
            <div className="flex flex-wrap gap-1.5">
              {columnsByType[exportType].map(col => (
                <Badge key={col} variant="secondary" className="text-xs font-mono">{col}</Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
