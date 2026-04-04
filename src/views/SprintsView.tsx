import { useState } from "react";
import { Plus, Calendar, LayoutGrid, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SprintCard } from "@/components/sprints/SprintCard";
import { SprintComparison } from "@/components/sprints/SprintComparison";
import { Company, Product, Sprint, Scenario } from "@/types/bdd";
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
import { cn } from "@/lib/utils";

interface SprintsViewProps {
  companies: Company[];
  products: Product[];
  sprints: Sprint[];
  scenarios: Scenario[];
  onAddSprint: (sprint: Omit<Sprint, "id">) => void;
  onActivateSprint: (sprintId: string, companyId: string) => void;
  getSprintStats: (sprintId: string) => {
    scenarioCount: number;
    passedCount: number;
    failedCount: number;
  };
  getSprintComparison: (companyId: string, productId?: string) => any[];
}

type Tab = "sprints" | "comparativo";

export function SprintsView({
  companies,
  products,
  sprints,
  scenarios,
  onAddSprint,
  onActivateSprint,
  getSprintStats,
  getSprintComparison,
}: SprintsViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("sprints");
  const [filterCompanyId, setFilterCompanyId] = useState<string>("all");
  const [filterProductId, setFilterProductId] = useState<string>("all");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [dialogCompanyId, setDialogCompanyId] = useState("");
  const [dialogProductId, setDialogProductId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filterProducts =
    filterCompanyId === "all"
      ? products
      : products.filter((p) => p.companyId === filterCompanyId);

  const dialogProducts = products.filter((p) => p.companyId === dialogCompanyId);

  const filteredSprints = sprints.filter((s) => {
    if (filterCompanyId !== "all" && s.companyId !== filterCompanyId) return false;
    if (filterProductId !== "all" && s.productId !== filterProductId) return false;
    return true;
  });

  const activeSprints = filteredSprints.filter((s) => s.status === "active");
  const plannedSprints = filteredSprints.filter((s) => s.status === "planned");
  const completedSprints = filteredSprints.filter((s) => s.status === "completed");

  const getProductName = (id?: string) =>
    id ? (products.find((p) => p.id === id)?.name ?? "") : "";
  const getCompanyName = (id: string) => companies.find((c) => c.id === id)?.name ?? "";

  const handleCompanyFilterChange = (val: string) => {
    setFilterCompanyId(val);
    setFilterProductId("all");
  };

  const handleDialogCompanyChange = (val: string) => {
    setDialogCompanyId(val);
    setDialogProductId("");
  };

  const handleSave = () => {
    if (!name.trim() || !dialogCompanyId || !startDate || !endDate) return;
    onAddSprint({
      name,
      companyId: dialogCompanyId,
      productId: dialogProductId || undefined,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: "planned",
    });
    setIsDialogOpen(false);
    setName("");
    setDialogCompanyId("");
    setDialogProductId("");
    setStartDate("");
    setEndDate("");
  };

  const comparisonCompanyId =
    filterCompanyId !== "all" ? filterCompanyId : (companies[0]?.id ?? "");
  const comparisonProductId =
    filterProductId !== "all" ? filterProductId : undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Sprints</h1>
          <p className="text-muted-foreground">
            Organize seus testes por ciclos de desenvolvimento
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Sprint
        </Button>
      </div>

      {/* Filters + Tabs Row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Filters */}
        <div className="flex items-center gap-2 flex-1">
          {companies.length > 1 && (
            <Select value={filterCompanyId} onValueChange={handleCompanyFilterChange}>
              <SelectTrigger className="w-44 h-9 text-sm">
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as empresas</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {filterProducts.length > 0 && (
            <Select value={filterProductId} onValueChange={setFilterProductId}>
              <SelectTrigger className="w-44 h-9 text-sm">
                <SelectValue placeholder="Produto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os produtos</SelectItem>
                {filterProducts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("sprints")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              activeTab === "sprints"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Sprints
          </button>
          <button
            onClick={() => setActiveTab("comparativo")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              activeTab === "comparativo"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Comparativo
          </button>
        </div>
      </div>

      {/* ── TAB: Sprints ── */}
      {activeTab === "sprints" && (
        <div className="space-y-8">
          {/* Active */}
          {activeSprints.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Sprints Ativas
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeSprints.map((sprint) => (
                  <SprintCard
                    key={sprint.id}
                    sprint={sprint}
                    {...getSprintStats(sprint.id)}
                    companyName={getCompanyName(sprint.companyId)}
                    productName={getProductName(sprint.productId)}
                    onActivate={onActivateSprint}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Planned */}
          {plannedSprints.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Sprints Planejadas
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {plannedSprints.map((sprint) => (
                  <SprintCard
                    key={sprint.id}
                    sprint={sprint}
                    {...getSprintStats(sprint.id)}
                    companyName={getCompanyName(sprint.companyId)}
                    productName={getProductName(sprint.productId)}
                    onActivate={onActivateSprint}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {completedSprints.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Sprints Concluídas
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {completedSprints.map((sprint) => (
                  <SprintCard
                    key={sprint.id}
                    sprint={sprint}
                    {...getSprintStats(sprint.id)}
                    companyName={getCompanyName(sprint.companyId)}
                    productName={getProductName(sprint.productId)}
                    onActivate={onActivateSprint}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty */}
          {filteredSprints.length === 0 && (
            <div className="glass-card rounded-xl p-12 text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhuma sprint encontrada
              </h3>
              <p className="text-muted-foreground mb-6">
                {filterProductId !== "all" || filterCompanyId !== "all"
                  ? "Ajuste os filtros ou crie uma nova sprint para este produto."
                  : "Organize seus cenários de teste em sprints para melhor acompanhamento."}
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Sprint
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Comparativo ── */}
      {activeTab === "comparativo" && comparisonCompanyId && (
        <SprintComparison
          companyId={comparisonCompanyId}
          productId={comparisonProductId}
          getSprintComparison={getSprintComparison}
        />
      )}

      {activeTab === "comparativo" && !comparisonCompanyId && (
        <div className="glass-card rounded-xl p-12 text-center text-muted-foreground">
          Selecione uma empresa no filtro para ver o comparativo.
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
              <Label>Nome da Sprint</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Sprint 2024.01"
              />
            </div>
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Select value={dialogCompanyId} onValueChange={handleDialogCompanyChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {dialogProducts.length > 0 && (
              <div className="space-y-2">
                <Label>Produto <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                <Select value={dialogProductId} onValueChange={setDialogProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {dialogProducts.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
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
