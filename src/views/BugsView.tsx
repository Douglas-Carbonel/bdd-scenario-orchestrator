import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Bug, Plus, Search, Filter, ChevronDown,
  CheckCircle2, RotateCcw, Wrench, AlertTriangle,
  Calendar, FlaskConical, User, ArrowUpDown,
} from "lucide-react";
import { Defect, DefectStatus, DefectSeverity, Scenario, Sprint, Company, Product } from "@/types/bdd";
import { DefectDialog } from "@/components/defects/DefectDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface BugsViewProps {
  companies: Company[];
  products: Product[];
  sprints: Sprint[];
  scenarios: Scenario[];
  defects: Defect[];
  onAddDefect: (defect: Omit<Defect, "id" | "createdAt" | "updatedAt">) => void;
  onUpdateDefect: (id: string, updates: Partial<Defect>) => void;
  getCompanyDefects: (companyId: string) => Defect[];
}

type SortField = "createdAt" | "severity" | "status" | "title";
type SortDir   = "asc" | "desc";

const statusIcons: Record<DefectStatus, typeof Bug> = {
  open:     Bug,
  reopened: RotateCcw,
  fixed:    Wrench,
  verified: CheckCircle2,
};

const statusColor: Record<DefectStatus, string> = {
  open:     "text-destructive",
  reopened: "text-orange-400",
  fixed:    "text-primary",
  verified: "text-success",
};

const statusBg: Record<DefectStatus, string> = {
  open:     "bg-destructive/10 border-destructive/30",
  reopened: "bg-orange-500/10 border-orange-500/30",
  fixed:    "bg-primary/10 border-primary/30",
  verified: "bg-success/10 border-success/30",
};

const severityColor: Record<DefectSeverity, string> = {
  critical: "text-destructive",
  high:     "text-orange-400",
  medium:   "text-primary",
  low:      "text-muted-foreground",
};

const severityOrder: DefectSeverity[] = ["critical", "high", "medium", "low"];

interface DefectDialogState { open: boolean; defect?: Defect; scenarioId?: string }

export function BugsView({
  companies, products, sprints, scenarios, defects,
  onAddDefect, onUpdateDefect, getCompanyDefects,
}: BugsViewProps) {
  const { t, i18n } = useTranslation();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(companies[0]?.id ?? "");
  const [filterStatus,    setFilterStatus]    = useState<DefectStatus | "all">("all");
  const [filterSeverity,  setFilterSeverity]  = useState<DefectSeverity | "all">("all");
  const [filterSprintId,  setFilterSprintId]  = useState<string>("all");
  const [filterProductId, setFilterProductId] = useState<string>("all");
  const [search,          setSearch]          = useState("");
  const [sortField,       setSortField]       = useState<SortField>("createdAt");
  const [sortDir,         setSortDir]         = useState<SortDir>("desc");
  const [dialogState,     setDialogState]     = useState<DefectDialogState>({ open: false });

  const companyProducts = products.filter(p => p.companyId === selectedCompanyId);
  const companySprints  = sprints.filter(s => s.companyId === selectedCompanyId);
  const companyDefects  = useMemo(
    () => getCompanyDefects(selectedCompanyId),
    [getCompanyDefects, selectedCompanyId],
  );

  const filteredDefects = useMemo(() => {
    let list = companyDefects;
    if (filterStatus   !== "all") list = list.filter(d => d.status   === filterStatus);
    if (filterSeverity !== "all") list = list.filter(d => d.severity === filterSeverity);
    if (filterSprintId !== "all") list = list.filter(d => d.sprintId === filterSprintId);
    if (filterProductId !== "all") {
      const ids = new Set(scenarios.filter(s => s.productId === filterProductId).map(s => s.id));
      list = list.filter(d => ids.has(d.scenarioId));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.reportedBy.toLowerCase().includes(q) ||
        (d.description ?? "").toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortField === "createdAt") cmp = a.createdAt.getTime() - b.createdAt.getTime();
      else if (sortField === "severity") cmp = severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity);
      else if (sortField === "status")   cmp = a.status.localeCompare(b.status);
      else if (sortField === "title")    cmp = a.title.localeCompare(b.title);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [companyDefects, filterStatus, filterSeverity, filterSprintId, filterProductId, search, sortField, sortDir, scenarios]);

  const stats = useMemo(() => ({
    open:     companyDefects.filter(d => d.status === "open").length,
    reopened: companyDefects.filter(d => d.status === "reopened").length,
    fixed:    companyDefects.filter(d => d.status === "fixed").length,
    verified: companyDefects.filter(d => d.status === "verified").length,
    critical: companyDefects.filter(d => d.severity === "critical" && (d.status === "open" || d.status === "reopened")).length,
  }), [companyDefects]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const fmtDate = (d: Date) =>
    d.toLocaleDateString(i18n.language === "en" ? "en-US" : "pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  const getScenario = (id: string) => scenarios.find(s => s.id === id);
  const getSprint   = (id?: string) => sprints.find(s => s.id === id);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Bug className="h-6 w-6 text-destructive" />
            {t("bugs.title")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t("bugs.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          {companies.length > 1 && (
            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder={t("common.company")} />
              </SelectTrigger>
              <SelectContent>
                {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Button
            onClick={() => setDialogState({ open: true })}
            className="gap-2"
            disabled={!selectedCompanyId || scenarios.filter(s => s.companyId === selectedCompanyId).length === 0}
          >
            <Plus className="h-4 w-4" />
            {t("bugs.register")}
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(["open","reopened","fixed","verified"] as DefectStatus[]).map(st => {
          const Icon  = statusIcons[st];
          const color = statusColor[st];
          const count = stats[st];
          return (
            <button
              key={st}
              className={cn(
                "glass-card rounded-xl p-4 flex flex-col gap-1 border transition-all hover:border-primary/30 text-left",
                filterStatus === st ? "border-primary/50 bg-primary/5" : "border-border/50"
              )}
              onClick={() => setFilterStatus(filterStatus === st ? "all" : st)}
            >
              <div className="flex items-center justify-between">
                <Icon className={cn("h-4 w-4", color)} />
                <span className={cn("text-2xl font-bold", color)}>{count}</span>
              </div>
              <span className="text-xs text-muted-foreground">{t(`defectStatus.${st}`)}</span>
            </button>
          );
        })}
        <div className="glass-card rounded-xl p-4 flex flex-col gap-1 border border-border/50">
          <div className="flex items-center justify-between">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-2xl font-bold text-destructive">{stats.critical}</span>
          </div>
          <span className="text-xs text-muted-foreground">{t("bugs.criticalOpen")}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t("bugs.searchPlaceholder")}
              className="pl-9 bg-background/50"
            />
          </div>
          {companyProducts.length > 0 && (
            <Select value={filterProductId} onValueChange={setFilterProductId}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("bugs.allProducts")}</SelectItem>
                {companyProducts.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {companySprints.length > 0 && (
            <Select value={filterSprintId} onValueChange={setFilterSprintId}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("bugs.allSprints")}</SelectItem>
                {companySprints.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Filter className="h-3 w-3" />{t("bugs.severity")}
          </span>
          <button
            onClick={() => setFilterSeverity("all")}
            className={cn(
              "text-xs px-2.5 py-1 rounded-full border transition-colors",
              filterSeverity === "all"
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/40"
            )}
          >
            {t("bugs.allSeverities")}
          </button>
          {severityOrder.map(sv => (
            <button
              key={sv}
              onClick={() => setFilterSeverity(filterSeverity === sv ? "all" : sv)}
              className={cn(
                "text-xs px-2.5 py-1 rounded-full border transition-colors",
                filterSeverity === sv
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              {t(`defectSeverity.${sv}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        {filteredDefects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <Bug className="h-10 w-10 opacity-20" />
            <p className="text-sm font-medium">
              {companyDefects.length === 0 ? t("bugs.noDefects") : t("bugs.noDefectsFilter")}
            </p>
            {companyDefects.length === 0 && (
              <p className="text-xs opacity-60">{t("bugs.noDefectsHint")}</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/20">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("title")}>
                      {t("bugs.tableTitle")} <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("severity")}>
                      {t("bugs.tableSeverity")} <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("status")}>
                      {t("bugs.tableStatus")} <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{t("bugs.tableSprint")}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{t("bugs.tableScenario")}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{t("bugs.tableReporter")}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("createdAt")}>
                      {t("bugs.tableDate")} <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDefects.map((defect, i) => {
                  const stColor  = statusColor[defect.status];
                  const stBg     = statusBg[defect.status];
                  const StIcon   = statusIcons[defect.status];
                  const svColor  = severityColor[defect.severity];
                  const scenario = getScenario(defect.scenarioId);
                  const sprint   = getSprint(defect.sprintId);
                  return (
                    <tr
                      key={defect.id}
                      className={cn(
                        "border-b border-border/50 hover:bg-secondary/20 transition-colors cursor-pointer",
                        i % 2 === 0 ? "bg-transparent" : "bg-secondary/5"
                      )}
                      onClick={() => setDialogState({ open: true, defect, scenarioId: defect.scenarioId })}
                    >
                      <td className="px-4 py-3">
                        <div className="max-w-xs">
                          <p className="font-medium text-foreground truncate">{defect.title}</p>
                          {defect.description && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{defect.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs font-semibold", svColor)}>{t(`defectSeverity.${defect.severity}`)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={cn("text-xs gap-1", stBg, stColor)}>
                          <StIcon className="h-3 w-3" />
                          {t(`defectStatus.${defect.status}`)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {sprint ? (
                          <div className="flex items-center gap-1 text-xs text-primary/70">
                            <Calendar className="h-3 w-3" />
                            <span className="truncate max-w-[100px]">{sprint.name}</span>
                          </div>
                        ) : <span className="text-xs text-muted-foreground/40">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {scenario ? (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <FlaskConical className="h-3 w-3 shrink-0" />
                            <span className="truncate max-w-[120px]">{scenario.title}</span>
                          </div>
                        ) : <span className="text-xs text-muted-foreground/40">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3 shrink-0" />
                          {defect.reportedBy}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">{fmtDate(defect.createdAt)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-4 py-2 border-t border-border bg-secondary/10 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {companyDefects.length !== 1
                  ? t("bugs.countLabelPlural", { filtered: filteredDefects.length, total: companyDefects.length })
                  : t("bugs.countLabel",       { filtered: filteredDefects.length, total: companyDefects.length })
                }
              </span>
              {(filterStatus !== "all" || filterSeverity !== "all" || filterSprintId !== "all" || search) && (
                <button
                  className="hover:text-foreground transition-colors"
                  onClick={() => { setFilterStatus("all"); setFilterSeverity("all"); setFilterSprintId("all"); setSearch(""); }}
                >
                  {t("common.clearFilters")}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {dialogState.open && (
        <DefectDialog
          open={dialogState.open}
          onOpenChange={open => setDialogState(s => ({ ...s, open }))}
          scenarioId={dialogState.scenarioId ?? scenarios.find(s => s.companyId === selectedCompanyId)?.id ?? ""}
          scenarioTitle={scenarios.find(s => s.id === dialogState.scenarioId)?.title}
          defect={dialogState.defect}
          sprints={companySprints}
          onAdd={onAddDefect}
          onUpdate={onUpdateDefect}
        />
      )}
    </div>
  );
}
