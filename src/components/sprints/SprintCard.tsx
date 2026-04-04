import { useState } from "react";
import { Calendar, FlaskConical, CheckCircle2, AlertCircle, Zap, Pencil } from "lucide-react";
import { Sprint, Product } from "@/types/bdd";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SprintCardProps {
  sprint: Sprint;
  scenarioCount: number;
  passedCount: number;
  failedCount: number;
  companyName: string;
  productName?: string;
  products: Product[];
  onActivate?: (sprintId: string, companyId: string) => void;
  onUpdate?: (id: string, updates: Partial<Sprint>) => void;
}

const statusConfig = {
  planned: { label: "Planejada", className: "bg-muted text-muted-foreground" },
  active: { label: "Ativa", className: "bg-primary/20 text-primary" },
  completed: { label: "Concluída", className: "bg-success/20 text-success" },
};

export function SprintCard({
  sprint,
  scenarioCount,
  passedCount,
  failedCount,
  companyName,
  productName,
  products,
  onActivate,
  onUpdate,
}: SprintCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(sprint.name);
  const [editProductId, setEditProductId] = useState(sprint.productId ?? "__none__");
  const [editStartDate, setEditStartDate] = useState(
    sprint.startDate.toISOString().split("T")[0],
  );
  const [editEndDate, setEditEndDate] = useState(sprint.endDate.toISOString().split("T")[0]);

  const status = statusConfig[sprint.status];
  const progress = scenarioCount > 0 ? ((passedCount + failedCount) / scenarioCount) * 100 : 0;
  const passRate =
    passedCount + failedCount > 0
      ? Math.round((passedCount / (passedCount + failedCount)) * 100)
      : null;

  const companyProducts = products.filter((p) => p.companyId === sprint.companyId);

  const openEdit = () => {
    setEditName(sprint.name);
    setEditProductId(sprint.productId ?? "__none__");
    setEditStartDate(sprint.startDate.toISOString().split("T")[0]);
    setEditEndDate(sprint.endDate.toISOString().split("T")[0]);
    setEditOpen(true);
  };

  const handleSave = () => {
    if (!editName.trim() || !editStartDate || !editEndDate) return;
    onUpdate?.(sprint.id, {
      name: editName,
      productId: editProductId === "__none__" ? undefined : editProductId,
      startDate: new Date(editStartDate),
      endDate: new Date(editEndDate),
    });
    setEditOpen(false);
  };

  return (
    <>
      <div
        className={cn(
          "glass-card rounded-xl p-6 hover:border-primary/50 transition-all duration-200",
          sprint.status === "active" && "border-primary/40 shadow-lg shadow-primary/5",
        )}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground mb-1">
              {companyName}
              {productName ? ` · ${productName}` : ""}
            </p>
            <h3 className="text-lg font-semibold text-foreground">{sprint.name}</h3>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={openEdit}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Badge className={cn(status.className)}>{status.label}</Badge>
            {sprint.status === "active" && (
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Calendar className="h-4 w-4" />
          <span>
            {format(sprint.startDate, "dd MMM", { locale: ptBR })} -{" "}
            {format(sprint.endDate, "dd MMM", { locale: ptBR })}
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
              <span
                className={cn(
                  "text-xs font-medium",
                  passRate >= 80
                    ? "text-success"
                    : passRate >= 50
                      ? "text-yellow-400"
                      : "text-destructive",
                )}
              >
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

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Sprint</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome da Sprint</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Ex: Sprint 2024.01"
              />
            </div>

            <div className="space-y-2">
              <Label>
                Empresa
              </Label>
              <Input value={companyName} disabled className="text-muted-foreground" />
            </div>

            <div className="space-y-2">
              <Label>
                Produto{" "}
                <span className="text-muted-foreground text-xs">(opcional)</span>
              </Label>
              {companyProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum produto cadastrado nesta empresa.
                </p>
              ) : (
                <Select value={editProductId} onValueChange={setEditProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sem produto</SelectItem>
                    {companyProducts.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
