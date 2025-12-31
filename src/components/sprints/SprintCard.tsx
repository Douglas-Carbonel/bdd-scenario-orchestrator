import { Calendar, FlaskConical, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Sprint } from "@/types/bdd";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SprintCardProps {
  sprint: Sprint;
  scenarioCount: number;
  passedCount: number;
  failedCount: number;
  companyName: string;
}

const statusConfig = {
  planned: { label: "Planejada", className: "bg-muted text-muted-foreground" },
  active: { label: "Ativa", className: "bg-primary/20 text-primary" },
  completed: { label: "Concluída", className: "bg-success/20 text-success" },
};

export function SprintCard({ sprint, scenarioCount, passedCount, failedCount, companyName }: SprintCardProps) {
  const status = statusConfig[sprint.status];
  const progress = scenarioCount > 0 ? ((passedCount + failedCount) / scenarioCount) * 100 : 0;

  return (
    <div className="glass-card rounded-xl p-6 hover:border-primary/50 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">{companyName}</p>
          <h3 className="text-lg font-semibold text-foreground">{sprint.name}</h3>
        </div>
        <Badge className={cn(status.className)}>{status.label}</Badge>
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

      <div className="flex items-center gap-4 pt-4 border-t border-border text-sm">
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
      </div>
    </div>
  );
}
