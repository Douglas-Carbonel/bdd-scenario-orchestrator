import { useState } from "react";
import {
  Clock, Tag, Play, CheckCircle2, XCircle, FileEdit, AlertTriangle,
  User, Copy, Check, History, Bot, ImageIcon, Trash2, Layers,
  Bug, Plus, RotateCcw, Wrench, ChevronDown, ChevronUp, X,
} from "lucide-react";
import { Scenario, Priority, TestRun, Defect, DefectStatus } from "@/types/bdd";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DefectDialog } from "@/components/defects/DefectDialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

/* ─── Types ──────────────────────────────────────────────── */

interface DefectDialogState {
  open: boolean;
  defect?: Defect;
  testRunId?: string;
  prefilledTitle?: string;
}

interface ScenarioCardProps {
  scenario: Scenario;
  assigneeName?: string;
  runs?: TestRun[];
  defects?: Defect[];
  onEdit?: (scenario: Scenario) => void;
  onRun?: (scenario: Scenario) => void;
  onClearRuns?: (scenarioId: string) => void;
  onAddDefect?: (defect: Omit<Defect, "id" | "createdAt" | "updatedAt">) => void;
  onUpdateDefect?: (id: string, updates: Partial<Defect>) => void;
  getSprintName?: (sprintId: string) => string | undefined;
}

/* ─── Config maps ────────────────────────────────────────── */

const statusConfig = {
  draft:   { label: "Rascunho",   icon: FileEdit,     className: "bg-muted/80 text-muted-foreground border-muted-foreground/20" },
  ready:   { label: "Pronto",     icon: Play,         className: "bg-info/15 text-info border-info/20" },
  running: { label: "Executando", icon: Play,         className: "bg-warning/15 text-warning border-warning/20 animate-pulse" },
  passed:  { label: "Passou",     icon: CheckCircle2, className: "bg-success/15 text-success border-success/20" },
  failed:  { label: "Falhou",     icon: XCircle,      className: "bg-destructive/15 text-destructive border-destructive/20" },
};

const priorityConfig: Record<Priority, { label: string; dot: string; bar: string }> = {
  critical: { label: "Crítico", dot: "bg-destructive", bar: "bg-destructive" },
  high:     { label: "Alto",    dot: "bg-warning",     bar: "bg-warning" },
  medium:   { label: "Médio",   dot: "bg-primary",     bar: "bg-primary" },
  low:      { label: "Baixo",   dot: "bg-muted-foreground", bar: "bg-muted-foreground/40" },
};

const defectStatusColors: Record<DefectStatus, string> = {
  open:     "bg-destructive",
  reopened: "bg-orange-400",
  fixed:    "bg-primary",
  verified: "bg-success",
};

const defectStatusIcons: Record<DefectStatus, typeof Bug> = {
  open:     Bug,
  reopened: RotateCcw,
  fixed:    Wrench,
  verified: CheckCircle2,
};

/* ─── Helpers ────────────────────────────────────────────── */

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return "agora";
  if (m < 60) return `${m}min`;
  if (h < 24) return `${h}h`;
  return `${d}d`;
}

/* ─── History Sheet ──────────────────────────────────────── */

function HistorySheet({
  open, onClose, scenario, runs, defects, onAddDefect, onUpdateDefect,
  onClearRuns, getSprintName,
}: {
  open: boolean;
  onClose: () => void;
  scenario: Scenario;
  runs: TestRun[];
  defects: Defect[];
  onAddDefect?: ScenarioCardProps["onAddDefect"];
  onUpdateDefect?: ScenarioCardProps["onUpdateDefect"];
  onClearRuns?: ScenarioCardProps["onClearRuns"];
  getSprintName?: ScenarioCardProps["getSprintName"];
}) {
  const [showAllRuns, setShowAllRuns]       = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [defectDialog, setDefectDialog]     = useState<DefectDialogState>({ open: false });
  const [lightboxUrl, setLightboxUrl]       = useState<string | null>(null);

  const sorted      = [...runs].sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  const displayed   = showAllRuns ? sorted : sorted.slice(0, 8);
  const passCount   = sorted.filter(r => r.status === "passed").length;
  const passRate    = sorted.length > 0 ? Math.round((passCount / sorted.length) * 100) : null;
  const openDefects = defects.filter(d => d.status === "open" || d.status === "reopened");
  const status      = statusConfig[scenario.status];
  const StatusIcon  = status.icon;
  const priority    = priorityConfig[scenario.priority];

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col gap-0 p-0 overflow-hidden">

          {/* Header */}
          <div className="p-5 border-b border-border shrink-0 space-y-3">
            <div className="flex items-start gap-3">
              <div className={cn("mt-0.5 h-2.5 w-2.5 rounded-full shrink-0", priority.dot)} />
              <SheetTitle className="text-base leading-snug flex-1">{scenario.title}</SheetTitle>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={cn("text-xs", status.className)}>
                <StatusIcon className="h-3 w-3 mr-1" />{status.label}
              </Badge>
              {scenario.executionType === "manual" ? (
                <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400 bg-emerald-500/5">
                  <User className="h-3 w-3 mr-1" />Manual
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs border-primary/30 text-primary/70 bg-primary/5">
                  <Bot className="h-3 w-3 mr-1" />E2E / CI
                </Badge>
              )}
              <span className="text-xs text-muted-foreground font-mono ml-auto">{scenario.feature}</span>
            </div>

            {/* BDD steps */}
            <div className="space-y-1.5">
              {scenario.given.length > 0 && (
                <div className="bdd-given rounded-md px-3 py-1.5 text-xs font-mono">
                  <span className="font-bold">Given </span>
                  {scenario.given[0]}
                  {scenario.given.length > 1 && <span className="text-muted-foreground"> +{scenario.given.length - 1}</span>}
                </div>
              )}
              {scenario.when.length > 0 && (
                <div className="bdd-when rounded-md px-3 py-1.5 text-xs font-mono">
                  <span className="font-bold">When </span>
                  {scenario.when[0]}
                  {scenario.when.length > 1 && <span className="text-muted-foreground"> +{scenario.when.length - 1}</span>}
                </div>
              )}
              {scenario.then.length > 0 && (
                <div className="bdd-then rounded-md px-3 py-1.5 text-xs font-mono">
                  <span className="font-bold">Then </span>
                  {scenario.then[0]}
                  {scenario.then.length > 1 && <span className="text-muted-foreground"> +{scenario.then.length - 1}</span>}
                </div>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">

            {/* Run summary */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-semibold text-foreground">Histórico de execuções</h4>
                  {sorted.length > 0 && (
                    <span className="text-xs text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded-full">
                      {sorted.length}
                    </span>
                  )}
                </div>
                {passRate !== null && (
                  <span className={cn("text-sm font-bold",
                    passRate >= 80 ? "text-success" : passRate >= 50 ? "text-yellow-400" : "text-destructive"
                  )}>{passRate}%</span>
                )}
              </div>

              {/* Sparkline */}
              {sorted.length > 0 && (
                <div className="flex items-center gap-0.5">
                  {sorted.slice(0, 20).map(run => (
                    <div
                      key={run.id}
                      className={cn("h-4 flex-1 max-w-5 rounded-sm", run.status === "passed" ? "bg-success/70" : "bg-destructive/70")}
                      title={`${run.status} — ${formatRelativeTime(run.startedAt)}`}
                    />
                  ))}
                </div>
              )}

              {sorted.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground/60 italic py-4 justify-center">
                  <History className="h-4 w-4" />
                  Nenhuma execução registrada
                </div>
              ) : (
                <div className="space-y-1.5">
                  {displayed.map(run => (
                    <div key={run.id}>
                      <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-secondary/30 border border-border/60">
                        <div className="flex items-center gap-2 min-w-0">
                          {run.status === "passed"
                            ? <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                            : <XCircle      className="h-3.5 w-3.5 text-destructive shrink-0" />}
                          <span className={cn("font-medium", run.status === "passed" ? "text-success" : "text-destructive")}>
                            {run.status === "passed" ? "Passou" : "Falhou"}
                          </span>
                          {run.sprintId && getSprintName?.(run.sprintId) && (
                            <div className="flex items-center gap-1 text-primary/70">
                              <Layers className="h-3 w-3" />
                              <span className="truncate max-w-[80px]">{getSprintName(run.sprintId)}</span>
                            </div>
                          )}
                          {run.errorMessage && (
                            <span className="text-destructive/80 truncate max-w-[120px]" title={run.errorMessage}>
                              {run.errorMessage}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 text-muted-foreground">
                          {run.status === "failed" && onAddDefect && (
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    className="text-destructive/40 hover:text-destructive transition-colors"
                                    onClick={() => setDefectDialog({
                                      open: true, testRunId: run.id,
                                      prefilledTitle: run.errorMessage
                                        ? `Falha: ${run.errorMessage.substring(0, 80)}`
                                        : `Falha em: ${scenario.title}`,
                                    })}
                                  >
                                    <Bug className="h-3 w-3" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent><p className="text-xs">Registrar defeito</p></TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {run.evidenceUrls && run.evidenceUrls.length > 0 && (
                            <span className="flex items-center gap-0.5 text-primary">
                              <ImageIcon className="h-3 w-3" />{run.evidenceUrls.length}
                            </span>
                          )}
                          {run.duration && <span>{run.duration}ms</span>}
                          <span>{formatRelativeTime(run.startedAt)}</span>
                        </div>
                      </div>
                      {run.evidenceUrls && run.evidenceUrls.length > 0 && (
                        <div className="flex gap-1.5 px-2 mt-1.5 flex-wrap">
                          {run.evidenceUrls.map((url, i) => (
                            <button
                              key={i}
                              onClick={() => setLightboxUrl(url)}
                              className="h-10 w-16 rounded-md overflow-hidden border border-border hover:border-primary transition-colors"
                            >
                              <img src={url} alt={`Evidência ${i + 1}`} className="h-full w-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-1">
                    {sorted.length > 8 && (
                      <button
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowAllRuns(!showAllRuns)}
                      >
                        {showAllRuns ? "Ver menos" : `Ver todas (${sorted.length})`}
                      </button>
                    )}
                    {onClearRuns && (
                      <button
                        className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => setShowClearConfirm(true)}
                      >
                        <Trash2 className="h-3 w-3" />Limpar histórico
                      </button>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Defects */}
            <section className="space-y-3 border-t border-border pt-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bug className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-semibold text-foreground">Defeitos</h4>
                  {defects.length > 0 && (
                    <span className="text-xs text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded-full">
                      {defects.length}
                    </span>
                  )}
                  {openDefects.length > 0 && (
                    <span className="text-xs text-destructive font-medium">
                      · {openDefects.length} aberto{openDefects.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                {onAddDefect && (
                  <Button size="sm" variant="outline" className="h-7 gap-1 text-xs"
                    onClick={() => setDefectDialog({ open: true })}>
                    <Plus className="h-3 w-3" />Novo
                  </Button>
                )}
              </div>

              {defects.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 italic py-2">Nenhum defeito registrado.</p>
              ) : (
                <div className="space-y-1.5">
                  {defects.map(defect => {
                    const DIcon = defectStatusIcons[defect.status];
                    return (
                      <button
                        key={defect.id}
                        className="w-full flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-secondary/30 border border-border/60 hover:bg-secondary/50 transition-colors text-left"
                        onClick={() => setDefectDialog({ open: true, defect })}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={cn("h-2 w-2 rounded-full shrink-0", defectStatusColors[defect.status])} />
                          <span className="truncate text-foreground/80">{defect.title}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2 text-muted-foreground">
                          <DIcon className="h-3 w-3" />
                          <span>{
                            defect.severity === "critical" ? "Crítico" :
                            defect.severity === "high"     ? "Alto"    :
                            defect.severity === "medium"   ? "Médio"   : "Baixo"
                          }</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </SheetContent>
      </Sheet>

      {/* Clear confirm */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Limpar histórico</DialogTitle>
            <DialogDescription>
              Isso removerá todas as {sorted.length} execuções de "{scenario.title}". Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearConfirm(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => { onClearRuns?.(scenario.id); setShowClearConfirm(false); onClose(); }}>
              Limpar tudo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button className="absolute top-4 right-4 text-white/60 hover:text-white" onClick={() => setLightboxUrl(null)}>
            <X className="h-6 w-6" />
          </button>
          <img src={lightboxUrl} alt="Evidência" className="max-h-full max-w-full rounded-lg shadow-2xl" />
        </div>
      )}

      {/* Defect dialog */}
      <DefectDialog
        open={defectDialog.open}
        defect={defectDialog.defect}
        scenarioId={scenario.id}
        testRunId={defectDialog.testRunId}
        prefilledTitle={defectDialog.prefilledTitle}
        onSave={(data) => {
          if (defectDialog.defect) {
            onUpdateDefect?.(defectDialog.defect.id, data);
          } else {
            onAddDefect?.(data as Omit<Defect, "id" | "createdAt" | "updatedAt">);
          }
          setDefectDialog({ open: false });
        }}
        onClose={() => setDefectDialog({ open: false })}
      />
    </>
  );
}

/* ─── Main Card ──────────────────────────────────────────── */

export function ScenarioCard({
  scenario, assigneeName, runs = [], defects = [],
  onEdit, onRun, onClearRuns, onAddDefect, onUpdateDefect, getSprintName,
}: ScenarioCardProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const status      = statusConfig[scenario.status];
  const StatusIcon  = status.icon;
  const priority    = priorityConfig[scenario.priority];
  const sorted      = [...runs].sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  const lastRun     = sorted[0];
  const passCount   = sorted.filter(r => r.status === "passed").length;
  const passRate    = sorted.length > 0 ? Math.round((passCount / sorted.length) * 100) : null;
  const openDefects = defects.filter(d => d.status === "open" || d.status === "reopened");

  return (
    <>
      <div className="glass-card rounded-xl overflow-hidden group hover:border-primary/20 transition-all duration-200 flex flex-col">

        {/* Priority bar */}
        <div className={cn("h-0.5 w-full", priority.bar)} />

        <div className="p-4 flex flex-col gap-3 flex-1">

          {/* Title row */}
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm leading-snug group-hover:text-primary transition-colors">
                {scenario.title}
              </h3>
              <p className="text-xs text-muted-foreground/70 font-mono mt-0.5 truncate">{scenario.feature}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
              {openDefects.length > 0 && (
                <button onClick={() => setSheetOpen(true)}>
                  <Badge variant="outline" className="border-destructive/30 text-destructive bg-destructive/5 text-xs cursor-pointer hover:bg-destructive/10 transition-colors">
                    <Bug className="h-3 w-3 mr-1" />{openDefects.length}
                  </Badge>
                </button>
              )}
              <Badge variant="outline" className={cn("text-xs", status.className)}>
                <StatusIcon className="h-3 w-3 mr-1" />{status.label}
              </Badge>
            </div>
          </div>

          {/* BDD steps — compact */}
          <div className="space-y-1">
            {scenario.given.length > 0 && (
              <div className="bdd-given rounded px-2.5 py-1 text-xs font-mono leading-relaxed">
                <span className="font-bold">Given </span>
                <span className="text-foreground/80">{scenario.given[0]}</span>
                {scenario.given.length > 1 && (
                  <span className="text-muted-foreground"> +{scenario.given.length - 1}</span>
                )}
              </div>
            )}
            {scenario.when.length > 0 && (
              <div className="bdd-when rounded px-2.5 py-1 text-xs font-mono leading-relaxed">
                <span className="font-bold">When </span>
                <span className="text-foreground/80">{scenario.when[0]}</span>
                {scenario.when.length > 1 && (
                  <span className="text-muted-foreground"> +{scenario.when.length - 1}</span>
                )}
              </div>
            )}
            {scenario.then.length > 0 && (
              <div className="bdd-then rounded px-2.5 py-1 text-xs font-mono leading-relaxed">
                <span className="font-bold">Then </span>
                <span className="text-foreground/80">{scenario.then[0]}</span>
                {scenario.then.length > 1 && (
                  <span className="text-muted-foreground"> +{scenario.then.length - 1}</span>
                )}
              </div>
            )}
          </div>

          {/* Meta row: tags, assignee */}
          {(scenario.tags.length > 0 || assigneeName) && (
            <div className="flex items-center justify-between gap-2 flex-wrap">
              {scenario.tags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
                  {scenario.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-xs px-1.5 py-0.5 rounded-full bg-secondary/60 text-secondary-foreground">
                      @{tag}
                    </span>
                  ))}
                  {scenario.tags.length > 2 && (
                    <span className="text-xs text-muted-foreground">+{scenario.tags.length - 2}</span>
                  )}
                </div>
              )}
              {assigneeName && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                  <User className="h-3 w-3" />{assigneeName}
                </div>
              )}
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Stats bar */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{scenario.estimatedDuration}min</span>
            </div>
            <span className={cn("font-medium text-xs px-1.5 py-0.5 rounded", {
              "text-destructive bg-destructive/10": scenario.priority === "critical",
              "text-warning bg-warning/10":         scenario.priority === "high",
              "text-primary bg-primary/10":         scenario.priority === "medium",
              "text-muted-foreground":              scenario.priority === "low",
            })}>
              {priority.label}
            </span>
            {scenario.executionType === "manual" ? (
              <span className="flex items-center gap-1 text-emerald-400"><User className="h-3 w-3" />Manual</span>
            ) : (
              <span className="flex items-center gap-1 text-primary/70"><Bot className="h-3 w-3" />E2E</span>
            )}
            {/* Sparkline */}
            {sorted.length > 0 && (
              <div className="ml-auto flex items-center gap-1.5">
                {passRate !== null && (
                  <span className={cn("font-semibold",
                    passRate >= 80 ? "text-success" : passRate >= 50 ? "text-yellow-400" : "text-destructive"
                  )}>{passRate}%</span>
                )}
                <div className="flex items-center gap-0.5">
                  {sorted.slice(0, 6).map(run => (
                    <div
                      key={run.id}
                      className={cn("h-2.5 w-2.5 rounded-sm",
                        run.status === "passed" ? "bg-success/70" : "bg-destructive/70"
                      )}
                      title={formatRelativeTime(run.startedAt)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action bar */}
          <div className="flex items-center justify-between pt-2.5 border-t border-border/60 gap-2">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onEdit?.(scenario)}>
                <FileEdit className="h-4 w-4" />
              </Button>
              {scenario.executionType === "manual" ? (
                <Button size="sm" className="h-8 gap-1.5" onClick={() => onRun?.(scenario)}>
                  <Play className="h-3.5 w-3.5" />Executar
                </Button>
              ) : (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-primary/5 border border-primary/20 text-primary/60 text-xs font-medium cursor-default select-none h-8">
                        <Bot className="h-3.5 w-3.5" />CI
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top"><p className="text-xs">Executado via Cypress CI</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            <Button
              variant="ghost" size="sm"
              className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5"
              onClick={() => setSheetOpen(true)}
            >
              <History className="h-3.5 w-3.5" />
              Histórico
              {sorted.length > 0 && (
                <span className="bg-secondary/60 px-1.5 py-0.5 rounded-full text-xs font-medium">
                  {sorted.length}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* History + Defects Sheet */}
      <HistorySheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        scenario={scenario}
        runs={runs}
        defects={defects}
        onAddDefect={onAddDefect}
        onUpdateDefect={onUpdateDefect}
        onClearRuns={onClearRuns}
        getSprintName={getSprintName}
      />
    </>
  );
}
