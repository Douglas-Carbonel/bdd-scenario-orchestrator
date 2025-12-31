import { Clock, Tag, Play, CheckCircle2, XCircle, FileEdit, AlertTriangle, User } from "lucide-react";
import { Scenario, Priority } from "@/types/bdd";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ScenarioCardProps {
  scenario: Scenario;
  assigneeName?: string;
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

export function ScenarioCard({ scenario, assigneeName, onEdit, onRun }: ScenarioCardProps) {
  const status = statusConfig[scenario.status];
  const StatusIcon = status.icon;
  const priority = priorityConfig[scenario.priority];

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
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit?.(scenario)}>
              <FileEdit className="h-4 w-4" />
            </Button>
            <Button variant="default" size="sm" onClick={() => onRun?.(scenario)}>
              <Play className="h-4 w-4" />
              Executar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
