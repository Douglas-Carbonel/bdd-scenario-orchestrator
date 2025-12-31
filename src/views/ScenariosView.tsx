import { useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScenarioCard } from "@/components/scenarios/ScenarioCard";
import { ScenarioForm } from "@/components/scenarios/ScenarioForm";
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

interface ScenariosViewProps {
  companies: Company[];
  sprints: Sprint[];
  scenarios: Scenario[];
  onAddScenario: (scenario: Omit<Scenario, "id" | "createdAt" | "updatedAt">) => void;
  onUpdateScenario: (id: string, updates: Partial<Scenario>) => void;
}

export function ScenariosView({
  companies,
  sprints,
  scenarios,
  onAddScenario,
  onUpdateScenario,
}: ScenariosViewProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCompany, setFilterCompany] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredScenarios = scenarios.filter((scenario) => {
    const matchesSearch =
      scenario.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scenario.feature.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scenario.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCompany = filterCompany === "all" || scenario.companyId === filterCompany;
    const matchesStatus = filterStatus === "all" || scenario.status === filterStatus;
    return matchesSearch && matchesCompany && matchesStatus;
  });

  const openCreateDialog = () => {
    setEditingScenario(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (scenario: Scenario) => {
    setEditingScenario(scenario);
    setIsDialogOpen(true);
  };

  const handleSave = (data: Omit<Scenario, "id" | "createdAt" | "updatedAt">) => {
    if (editingScenario) {
      onUpdateScenario(editingScenario.id, data);
    } else {
      onAddScenario(data);
    }
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Cenários BDD</h1>
          <p className="text-muted-foreground">
            Crie e gerencie seus cenários de teste
          </p>
        </div>
        <Button onClick={openCreateDialog} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Novo Cenário
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, feature ou tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCompany} onValueChange={setFilterCompany}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as empresas</SelectItem>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="ready">Pronto</SelectItem>
            <SelectItem value="running">Executando</SelectItem>
            <SelectItem value="passed">Passou</SelectItem>
            <SelectItem value="failed">Falhou</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Scenarios Grid */}
      {filteredScenarios.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Filter className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {scenarios.length === 0
              ? "Nenhum cenário criado"
              : "Nenhum resultado encontrado"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {scenarios.length === 0
              ? "Comece criando seu primeiro cenário BDD."
              : "Tente ajustar os filtros de busca."}
          </p>
          {scenarios.length === 0 && (
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Cenário
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredScenarios.map((scenario, index) => (
            <div
              key={scenario.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <ScenarioCard scenario={scenario} onEdit={openEditDialog} />
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingScenario ? "Editar Cenário" : "Novo Cenário BDD"}
            </DialogTitle>
          </DialogHeader>
          <ScenarioForm
            companies={companies}
            sprints={sprints}
            onSave={handleSave}
            onCancel={() => setIsDialogOpen(false)}
            initialData={editingScenario || undefined}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
