import { Calendar, FlaskConical, CheckCircle2, AlertCircle, Zap } from "lucide-react";
import { Sprint } from "@/types/bdd";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SprintCardProps {
  sprint: Sprint;
  scenarioCount: number;
  passedCount: number;
  failedCount: number;
  companyName: string;
  productName?: string;
  onActivate?: (sprintId: string, companyId: string) => void;
}

const statusConfig = {
  planned: { label: "Planejada", className: "bg-muted text-muted-foreground" },
  active: { label: "Ativa", className: "bg-primary/20 text-primary" },
  completed: { label: "Concluída", className: "bg-success/20 text-success" },
};

export function SprintCard({ sprint, scenarioCount, passedCount, failedCount, companyName, productName, onActivate }: SprintCardProps) {
  const status = statusConfig[sprint.status];
  const progress = scenarioCount > 0 ? ((passedCount + failedCount) / scenarioCount) * 100 : 0;
  const passRate = passedCount + failedCount > 0 ? Math.round((passedCount / (passedCount + failedCount)) * 100) : null;

  return (
    <div className={cn(
      "glass-card rounded-xl p-6 hover:border-primary/50 transition-all duration-200",
      sprint.status === "active" && "border-primary/40 shadow-lg shadow-primary/5",
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground mb-1">
            {companyName}{productName ? ` · ${productName}` : ""}
          </p>
          <h3 className="text-lg font-semibold text-foreground">{sprint.name}</h3>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <Badge className={cn(status.className)}>{status.label}</Badge>
          {sprint.status === "active" && (
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Calendar className="h-4 w-4" />
        <span>
          {format(sprint.startDate, "dd MMM", { locale: ptBR })} - {format(sprint.endDate, "dd MMM", { locale: ptBR })}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-medium text-foreground">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <FlaskConical className="h-4 w-4" />
            <span>{scenarioCount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-success">
            <CheckCircle2 className="h-4 w-4" />
            <span>{passedCount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{failedCount}</span>
          </div>
          {passRate !== null && (
            <span className={cn(
              "text-xs font-medium",
              passRate >= 80 ? "text-success" : passRate >= 50 ? "text-yellow-400" : "text-destructive",
            )}>
              {passRate}% pass
            </span>
          )}
        </div>

        {sprint.status !== "active" && onActivate && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => onActivate(sprint.id, sprint.companyId)}
          >
            <Zap className="h-3 w-3" />
            Ativar
          </Button>
        )}
      </div>
    </div>
  );
}
