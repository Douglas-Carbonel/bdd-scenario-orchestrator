import { useState } from "react";
import { Clock, Tag, Play, CheckCircle2, XCircle, FileEdit, AlertTriangle, User, Copy, Check, History, ChevronDown, ChevronUp, Bot } from "lucide-react";
import { Scenario, Priority, TestRun } from "@/types/bdd";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ScenarioCardProps {
  scenario: Scenario;
  assigneeName?: string;
  runs?: TestRun[];
  onEdit?: (scenario: Scenario) => void;
  onRun?: (scenario: Scenario) => void;
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

export function ScenarioCard({ scenario, assigneeName, runs = [], onEdit, onRun }: ScenarioCardProps) {
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const status = statusConfig[scenario.status];
  const StatusIcon = status.icon;
  const priority = priorityConfig[scenario.priority];

  const recentRuns = runs.slice(0, 10);
  const lastRun = recentRuns[0];

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
          <Badge className={cn("shrink-0", status.className)}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
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
        {recentRuns.length > 0 && (
          <div className="space-y-2">
            <button
              className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowHistory(!showHistory)}
              data-testid={`button-history-${scenario.id}`}
            >
              <div className="flex items-center gap-2">
                <History className="h-3 w-3" />
                <span>Histórico ({recentRuns.length} execuções)</span>
                <div className="flex items-center gap-0.5">
                  {recentRuns.slice(0, 8).map((run) => (
                    <div
                      key={run.id}
                      className={cn(
                        "h-2 w-2 rounded-full",
                        run.status === "passed" ? "bg-success" : "bg-destructive"
                      )}
                      title={`${run.status} - ${formatRelativeTime(run.startedAt)}`}
                    />
                  ))}
                </div>
              </div>
              {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {showHistory && (
              <div className="space-y-1.5 border-t border-border pt-2">
                {recentRuns.map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center justify-between text-xs px-2 py-1.5 rounded-md bg-secondary/30"
                    data-testid={`run-item-${run.id}`}
                  >
                    <div className="flex items-center gap-2">
                      {run.status === "passed" ? (
                        <CheckCircle2 className="h-3 w-3 text-success shrink-0" />
                      ) : (
                        <XCircle className="h-3 w-3 text-destructive shrink-0" />
                      )}
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Bot className="h-3 w-3" />
                        <span className="font-mono">{run.executedBy}</span>
                      </div>
                      {run.errorMessage && (
                        <span className="text-destructive truncate max-w-[120px]" title={run.errorMessage}>
                          {run.errorMessage}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                      {run.duration && (
                        <span>{run.duration}ms</span>
                      )}
                      <span>{formatRelativeTime(run.startedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* No runs yet */}
        {recentRuns.length === 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground/60 italic">
            <History className="h-3 w-3" />
            <span>Nenhuma execução registrada</span>
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
            <Button variant="default" size="sm" onClick={() => onRun?.(scenario)} data-testid={`button-run-${scenario.id}`}>
              <Play className="h-4 w-4" />
              Executar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
