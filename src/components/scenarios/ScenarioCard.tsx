import { useState } from "react";
import { Clock, Tag, Play, CheckCircle2, XCircle, FileEdit, AlertTriangle, User, Copy, Check, History, ChevronDown, ChevronUp, Bot, ImageIcon, X, Trash2, Layers, Bug, Plus, RotateCcw, Wrench } from "lucide-react";
import { Scenario, Priority, TestRun, Defect, DefectStatus } from "@/types/bdd";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DefectDialog } from "@/components/defects/DefectDialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

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

const statusConfig = {
  draft: { label: "Rascunho", icon: FileEdit, className: "bg-muted text-muted-foreground" },
  ready: { label: "Pronto", icon: Play, className: "bg-info/20 text-info" },
  running: { label: "Executando", icon: Play, className: "bg-warning/20 text-warning animate-pulse" },
  passed: { label: "Passou", icon: CheckCircle2, className: "bg-success/20 text-success" },
  failed: { label: "Falhou", icon: XCircle, className: "bg-destructive/20 text-destructive" },
};

const priorityConfig: Record<Priority, { label: string; className: string; icon: typeof AlertTriangle }> = {
  critical: { label: "Crítico", className: "text-destructive", icon: AlertTriangle },
  high: { label: "Alto", className: "text-warning", icon: AlertTriangle },
  medium: { label: "Médio", className: "text-primary", icon: AlertTriangle },
  low: { label: "Baixo", className: "text-muted-foreground", icon: AlertTriangle },
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes}min atrás`;
  if (hours < 24) return `${hours}h atrás`;
  return `${days}d atrás`;
}

const defectStatusColors: Record<DefectStatus, string> = {
  open:     "bg-destructive",
  reopened: "bg-orange-400",
  fixed:    "bg-primary",
  verified: "bg-success",
};

const defectStatusLabels: Record<DefectStatus, string> = {
  open:     "Aberto",
  reopened: "Reaberto",
  fixed:    "Corrigido",
  verified: "Verificado",
};

const defectStatusIcons: Record<DefectStatus, typeof Bug> = {
  open:     Bug,
  reopened: RotateCcw,
  fixed:    Wrench,
  verified: CheckCircle2,
};

export function ScenarioCard({ scenario, assigneeName, runs = [], defects = [], onEdit, onRun, onClearRuns, onAddDefect, onUpdateDefect, getSprintName }: ScenarioCardProps) {
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAllRuns, setShowAllRuns] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDefects, setShowDefects] = useState(false);
  const [defectDialog, setDefectDialog] = useState<DefectDialogState>({ open: false });
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const openDefects = defects.filter((d) => d.status === "open" || d.status === "reopened");
  const status = statusConfig[scenario.status];
  const StatusIcon = status.icon;
  const priority = priorityConfig[scenario.priority];

  const sortedRuns = [...runs].sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  const displayRuns = showAllRuns ? sortedRuns : sortedRuns.slice(0, 5);
  const lastRun = sortedRuns[0];
  const passCount = sortedRuns.filter(r => r.status === "passed").length;
  const passRate = sortedRuns.length > 0 ? Math.round((passCount / sortedRuns.length) * 100) : null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(scenario.id);
    setCopied(true);
    toast.success("Scenario ID copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-200 group">
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <priority.icon className={cn("h-4 w-4 shrink-0", priority.className)} />
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {scenario.title}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground font-mono">{scenario.feature}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {openDefects.length > 0 && (
              <Badge
                variant="outline"
                className="border-destructive/40 text-destructive bg-destructive/5 text-xs px-2 py-0.5 cursor-pointer"
                onClick={() => setShowDefects(true)}
              >
                <Bug className="h-3 w-3 mr-1" />
                {openDefects.length}
              </Badge>
            )}
            {scenario.executionType === "manual" ? (
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/5 text-xs px-2 py-0.5">
                <User className="h-3 w-3 mr-1" />
                Manual
              </Badge>
            ) : (
              <Badge variant="outline" className="border-primary/40 text-primary/70 bg-primary/5 text-xs px-2 py-0.5">
                <Bot className="h-3 w-3 mr-1" />
                E2E
              </Badge>
            )}
            <Badge className={cn("shrink-0", status.className)}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          </div>
        </div>

        {/* BDD Steps */}
        <div className="space-y-2">
          {scenario.given.length > 0 && (
            <div className="bdd-given rounded-md px-3 py-2">
              <span className="font-mono text-xs">
                <span className="font-bold">Given</span> {scenario.given[0]}
              </span>
            </div>
          )}
          {scenario.when.length > 0 && (
            <div className="bdd-when rounded-md px-3 py-2">
              <span className="font-mono text-xs">
                <span className="font-bold">When</span> {scenario.when[0]}
              </span>
            </div>
          )}
          {scenario.then.length > 0 && (
            <div className="bdd-then rounded-md px-3 py-2">
              <span className="font-mono text-xs">
                <span className="font-bold">Then</span> {scenario.then[0]}
              </span>
            </div>
          )}
        </div>

        {/* Tags & Assignee */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {scenario.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Tag className="h-3 w-3 text-muted-foreground" />
              {scenario.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
                >
                  @{tag}
                </span>
              ))}
              {scenario.tags.length > 3 && (
                <span className="text-xs text-muted-foreground">+{scenario.tags.length - 3}</span>
              )}
            </div>
          )}
          {assigneeName && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span>{assigneeName}</span>
            </div>
          )}
        </div>

        {/* Scenario ID */}
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-secondary/40 border border-border">
          <code className="text-xs text-muted-foreground font-mono truncate flex-1">
            ID: {scenario.id}
          </code>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 shrink-0"
            onClick={handleCopyId}
            title="Copiar Scenario ID"
            data-testid={`button-copy-id-${scenario.id}`}
          >
            {copied ? (
              <Check className="h-3 w-3 text-primary" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>

        {/* Run History Summary */}
        {sortedRuns.length > 0 && (
          <div className="space-y-2">
            <button
              className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowHistory(!showHistory)}
              data-testid={`button-history-${scenario.id}`}
            >
              <div className="flex items-center gap-2">
                <History className="h-3 w-3" />
                <span>{sortedRuns.length} execuç{sortedRuns.length === 1 ? "ão" : "ões"}</span>
                {passRate !== null && (
                  <span className={cn("font-medium", passRate >= 80 ? "text-success" : passRate >= 50 ? "text-yellow-400" : "text-destructive")}>
                    {passRate}% aprovação
                  </span>
                )}
                <div className="flex items-center gap-0.5">
                  {sortedRuns.slice(0, 10).map((run) => (
                    <div
                      key={run.id}
                      className={cn("h-2 w-2 rounded-full", run.status === "passed" ? "bg-success" : "bg-destructive")}
                      title={`${run.status} - ${formatRelativeTime(run.startedAt)}`}
                    />
                  ))}
                </div>
              </div>
              {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {showHistory && (
              <div className="space-y-1.5 border-t border-border pt-2">
                {displayRuns.map((run) => (
                  <div key={run.id} className="space-y-1.5" data-testid={`run-item-${run.id}`}>
                    <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded-md bg-secondary/30">
                      <div className="flex items-center gap-2">
                        {run.status === "passed" ? (
                          <CheckCircle2 className="h-3 w-3 text-success shrink-0" />
                        ) : (
                          <XCircle className="h-3 w-3 text-destructive shrink-0" />
                        )}
                        <div className="flex items-center gap-1 text-muted-foreground">
                          {scenario.executionType === "manual"
                            ? <User className="h-3 w-3" />
                            : <Bot className="h-3 w-3" />}
                          <span className="font-mono">{run.executedBy}</span>
                        </div>
                        {run.sprintId && getSprintName?.(run.sprintId) && (
                          <div className="flex items-center gap-0.5 text-primary/70">
                            <Layers className="h-3 w-3" />
                            <span className="truncate max-w-[80px]">{getSprintName(run.sprintId)}</span>
                          </div>
                        )}
                        {run.errorMessage && (
                          <span className="text-destructive truncate max-w-[120px]" title={run.errorMessage}>
                            {run.errorMessage}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                        {run.status === "failed" && onAddDefect && (
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDefectDialog({
                                      open: true,
                                      testRunId: run.id,
                                      prefilledTitle: run.errorMessage
                                        ? `Falha: ${run.errorMessage.substring(0, 80)}`
                                        : `Falha em: ${scenario.title}`,
                                    });
                                  }}
                                  className="text-destructive/40 hover:text-destructive transition-colors"
                                >
                                  <Bug className="h-3 w-3" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p className="text-xs">Registrar defeito</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {run.evidenceUrls && run.evidenceUrls.length > 0 && (
                          <div className="flex items-center gap-0.5 text-primary">
                            <ImageIcon className="h-3 w-3" />
                            <span>{run.evidenceUrls.length}</span>
                          </div>
                        )}
                        {run.duration && <span>{run.duration}ms</span>}
                        <span>{formatRelativeTime(run.startedAt)}</span>
                      </div>
                    </div>
                    {run.evidenceUrls && run.evidenceUrls.length > 0 && (
                      <div className="flex gap-1.5 px-2 flex-wrap">
                        {run.evidenceUrls.map((url, i) => (
                          <button
                            key={i}
                            onClick={() => setLightboxUrl(url)}
                            className="h-12 w-20 rounded-md overflow-hidden border border-border hover:border-primary transition-colors shrink-0"
                            title="Ver evidência"
                          >
                            <img src={url} alt={`Evidência ${i + 1}`} className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Ver mais / Ver menos + Limpar */}
                <div className="flex items-center justify-between pt-1">
                  {sortedRuns.length > 5 && (
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowAllRuns(!showAllRuns)}
                    >
                      {showAllRuns ? `Ver menos` : `Ver todas (${sortedRuns.length})`}
                    </button>
                  )}
                  {onClearRuns && (
                    <button
                      className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                      onClick={() => setShowClearConfirm(true)}
                    >
                      <Trash2 className="h-3 w-3" />
                      Limpar histórico
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* No runs yet */}
        {sortedRuns.length === 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground/60 italic">
            <History className="h-3 w-3" />
            <span>Nenhuma execução registrada</span>
          </div>
        )}

        {/* Defects Section */}
        {(defects.length > 0 || onAddDefect) && (
          <div className="space-y-1.5">
            <button
              className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowDefects(!showDefects)}
            >
              <div className="flex items-center gap-2">
                <Bug className="h-3 w-3" />
                <span>
                  {defects.length === 0
                    ? "Nenhum defeito"
                    : `${defects.length} defeito${defects.length !== 1 ? "s" : ""}`}
                </span>
                {openDefects.length > 0 && (
                  <span className="text-destructive font-medium">
                    · {openDefects.length} aberto{openDefects.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {showDefects ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {showDefects && (
              <div className="space-y-1.5 border-t border-border pt-2">
                {defects.map((defect) => {
                  const DIcon = defectStatusIcons[defect.status];
                  return (
                    <button
                      key={defect.id}
                      className="w-full flex items-center justify-between text-xs px-2 py-1.5 rounded-md bg-secondary/30 hover:bg-secondary/50 transition-colors text-left"
                      onClick={() => setDefectDialog({ open: true, defect })}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={cn("h-2 w-2 rounded-full shrink-0", defectStatusColors[defect.status])} />
                        <span className="truncate text-foreground/80">{defect.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2 text-muted-foreground">
                        <span className="text-xs">{
                          defect.severity === "critical" ? "Crítico" :
                          defect.severity === "high" ? "Alto" :
                          defect.severity === "medium" ? "Médio" : "Baixo"
                        }</span>
                        <DIcon className={cn("h-3 w-3",
                          defect.status === "open" || defect.status === "reopened" ? "text-destructive" :
                          defect.status === "verified" ? "text-success" : "text-primary"
                        )} />
                      </div>
                    </button>
                  );
                })}
                {onAddDefect && (
                  <button
                    className="w-full flex items-center justify-center gap-1.5 text-xs px-2 py-1.5 rounded-md border border-dashed border-destructive/30 text-destructive/60 hover:border-destructive/60 hover:text-destructive transition-colors"
                    onClick={() => setDefectDialog({ open: true })}
                  >
                    <Plus className="h-3 w-3" />
                    Registrar Defeito
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs">{scenario.estimatedDuration} min</span>
            </div>
            <span className={cn("text-xs font-medium", priority.className)}>
              {priority.label}
            </span>
            {lastRun && (
              <span className="text-xs text-muted-foreground/70">
                Último: {formatRelativeTime(lastRun.startedAt)}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit?.(scenario)} data-testid={`button-edit-${scenario.id}`}>
              <FileEdit className="h-4 w-4" />
            </Button>
            {scenario.executionType === "manual" ? (
              <Button variant="default" size="sm" onClick={() => onRun?.(scenario)} data-testid={`button-run-${scenario.id}`}>
                <Play className="h-4 w-4" />
                Executar
              </Button>
            ) : (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/5 border border-primary/20 text-primary/60 text-xs font-medium cursor-default select-none">
                      <Bot className="h-3.5 w-3.5" />
                      CI
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">Executado automaticamente via Cypress CI</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </div>

      {/* Defect Dialog */}
      <DefectDialog
        open={defectDialog.open}
        onOpenChange={(open) => setDefectDialog((s) => ({ ...s, open }))}
        scenarioId={scenario.id}
        scenarioTitle={scenario.title}
        testRunId={defectDialog.testRunId}
        prefilledTitle={defectDialog.prefilledTitle}
        defect={defectDialog.defect}
        onAdd={(d) => onAddDefect?.(d)}
        onUpdate={(id, updates) => onUpdateDefect?.(id, updates)}
      />

      {/* Evidence Lightbox */}
      <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
        <DialogContent className="max-w-4xl p-2 bg-black/90 border-border">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
            onClick={() => setLightboxUrl(null)}
          >
            <X className="h-4 w-4" />
          </Button>
          {lightboxUrl && (
            <img
              src={lightboxUrl}
              alt="Evidência"
              className="w-full h-auto max-h-[85vh] object-contain rounded-md"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Clear history confirmation */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Limpar histórico de execuções?</DialogTitle>
            <DialogDescription>
              Todas as {sortedRuns.length} execuç{sortedRuns.length === 1 ? "ão" : "ões"} deste cenário serão removidas permanentemente. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearConfirm(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => {
                onClearRuns?.(scenario.id);
                setShowClearConfirm(false);
                setShowHistory(false);
                setShowAllRuns(false);
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Limpar histórico
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
