import { useState } from "react";
import { Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SprintCard } from "@/components/sprints/SprintCard";
import { Company, Sprint, Scenario } from "@/types/bdd";
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

interface SprintsViewProps {
  companies: Company[];
  sprints: Sprint[];
  scenarios: Scenario[];
  onAddSprint: (sprint: Omit<Sprint, "id">) => void;
  onActivateSprint: (sprintId: string, companyId: string) => void;
  getSprintStats: (sprintId: string) => {
    scenarioCount: number;
    passedCount: number;
    failedCount: number;
  };
}

export function SprintsView({
  companies,
  sprints,
  scenarios,
  onAddSprint,
  onActivateSprint,
  getSprintStats,
}: SprintsViewProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSave = () => {
    if (!name.trim() || !companyId || !startDate || !endDate) return;

    onAddSprint({
      name,
      companyId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: "planned",
    });
    setIsDialogOpen(false);
    setName("");
    setCompanyId("");
    setStartDate("");
    setEndDate("");
  };

  const activeSprints = sprints.filter((s) => s.status === "active");
  const plannedSprints = sprints.filter((s) => s.status === "planned");
  const completedSprints = sprints.filter((s) => s.status === "completed");

  const getCompanyName = (id: string) => companies.find((c) => c.id === id)?.name || "";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Sprints</h1>
          <p className="text-muted-foreground">Organize seus testes por ciclos de desenvolvimento</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Sprint
        </Button>
      </div>

      {/* Active Sprints */}
      {activeSprints.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Sprints Ativas
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeSprints.map((sprint) => {
              const stats = getSprintStats(sprint.id);
              return (
                <SprintCard
                  key={sprint.id}
                  sprint={sprint}
                  {...stats}
                  companyName={getCompanyName(sprint.companyId)}
                  onActivate={onActivateSprint}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Planned Sprints */}
      {plannedSprints.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Sprints Planejadas</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plannedSprints.map((sprint) => {
              const stats = getSprintStats(sprint.id);
              return (
                <SprintCard
                  key={sprint.id}
                  sprint={sprint}
                  {...stats}
                  companyName={getCompanyName(sprint.companyId)}
                  onActivate={onActivateSprint}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Sprints */}
      {completedSprints.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Sprints Concluídas</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completedSprints.map((sprint) => {
              const stats = getSprintStats(sprint.id);
              return (
                <SprintCard
                  key={sprint.id}
                  sprint={sprint}
                  {...stats}
                  companyName={getCompanyName(sprint.companyId)}
                  onActivate={onActivateSprint}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {sprints.length === 0 && (
        <div className="glass-card rounded-xl p-12 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhuma sprint cadastrada
          </h3>
          <p className="text-muted-foreground mb-6">
            Organize seus cenários de teste em sprints para melhor acompanhamento.
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeira Sprint
          </Button>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Sprint</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sprint-name">Nome da Sprint</Label>
              <Input
                id="sprint-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Sprint 2024.01"
              />
            </div>
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Data Início</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">Data Fim</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Criar Sprint</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
