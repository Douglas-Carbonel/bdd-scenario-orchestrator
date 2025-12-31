import { Clock, Tag, Play, CheckCircle2, XCircle, FileEdit } from "lucide-react";
import { Scenario } from "@/types/bdd";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ScenarioCardProps {
  scenario: Scenario;
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

export function ScenarioCard({ scenario, onEdit, onRun }: ScenarioCardProps) {
  const status = statusConfig[scenario.status];
  const StatusIcon = status.icon;

  return (
    <div className="glass-card rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-200 group">
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {scenario.title}
            </h3>
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

        {/* Tags */}
        {scenario.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="h-3 w-3 text-muted-foreground" />
            {scenario.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
              >
                @{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-xs">{scenario.estimatedDuration} min</span>
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
