import { useState, useMemo } from "react";
import { Plus, Search, Filter, PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScenarioCard } from "@/components/scenarios/ScenarioCard";
import { ScenarioForm } from "@/components/scenarios/ScenarioForm";
import { SuiteTree } from "@/components/suites/SuiteTree";
import { Company, Product, Sprint, Scenario, TestSuite, SuiteTreeNode, TeamMember, TestRun } from "@/types/bdd";
import { cn } from "@/lib/utils";
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
  products: Product[];
  sprints: Sprint[];
  scenarios: Scenario[];
  suites: TestSuite[];
  teamMembers: TeamMember[];
  onAddScenario: (scenario: Omit<Scenario, "id" | "createdAt" | "updatedAt">) => void;
  onUpdateScenario: (id: string, updates: Partial<Scenario>) => void;
  onAddSuite: (suite: Omit<TestSuite, "id" | "createdAt" | "order">) => void;
  onUpdateSuite: (id: string, updates: Partial<TestSuite>) => void;
  onDeleteSuite: (id: string) => void;
  onMoveSuite: (suiteId: string, newParentId: string | null, newOrder: number) => void;
  getSuiteTree: (companyId: string) => SuiteTreeNode[];
  getUnsortedScenarios: (companyId: string) => Scenario[];
  getScenarioRuns: (scenarioId: string) => TestRun[];
}

export function ScenariosView({
  companies,
  products,
  sprints,
  scenarios,
  suites,
  teamMembers,
  onAddScenario,
  onUpdateScenario,
  onAddSuite,
  onUpdateSuite,
  onDeleteSuite,
  onMoveSuite,
  getSuiteTree,
  getUnsortedScenarios,
  getScenarioRuns,
}: ScenariosViewProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCompany, setFilterCompany] = useState<string>(companies[0]?.id || "all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedSuiteId, setSelectedSuiteId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Get tree for selected company
  const suiteTree = useMemo(() => {
    if (filterCompany === "all") return [];
    return getSuiteTree(filterCompany);
  }, [filterCompany, getSuiteTree]);

  const unsortedScenarios = useMemo(() => {
    if (filterCompany === "all") return scenarios.filter((s) => !s.suiteId);
    return getUnsortedScenarios(filterCompany);
  }, [filterCompany, scenarios, getUnsortedScenarios]);

  // Filter scenarios
  const filteredScenarios = useMemo(() => {
    return scenarios.filter((scenario) => {
      const matchesSearch =
        scenario.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scenario.feature.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scenario.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCompany = filterCompany === "all" || scenario.companyId === filterCompany;
      const matchesStatus = filterStatus === "all" || scenario.status === filterStatus;
      const matchesSuite = selectedSuiteId === null 
        ? !scenario.suiteId 
        : scenario.suiteId === selectedSuiteId || isInSuiteTree(selectedSuiteId, scenario.suiteId, suites);
      
      return matchesSearch && matchesCompany && matchesStatus && matchesSuite;
    });
  }, [scenarios, searchQuery, filterCompany, filterStatus, selectedSuiteId, suites]);

  const openCreateDialog = () => {
    setEditingScenario(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (scenario: Scenario) => {
    setEditingScenario(scenario);
    setIsDialogOpen(true);
  };

  const handleSave = (data: Omit<Scenario, "id" | "createdAt" | "updatedAt">) => {
    // Add suiteId from current selection if creating new
    const dataWithSuite = {
      ...data,
      suiteId: editingScenario ? data.suiteId : (selectedSuiteId || undefined),
    };
    
    if (editingScenario) {
      onUpdateScenario(editingScenario.id, dataWithSuite);
    } else {
      onAddScenario(dataWithSuite);
    }
    setIsDialogOpen(false);
  };

  const handleAddSuite = (name: string, parentId: string | null) => {
    if (filterCompany === "all") return;
    onAddSuite({ name, companyId: filterCompany, parentId });
  };

  // Get current suite name for header
  const currentSuiteName = useMemo(() => {
    if (selectedSuiteId === null) return "Sem Pasta";
    const suite = suites.find((s) => s.id === selectedSuiteId);
    return suite?.name || "Todos";
  }, [selectedSuiteId, suites]);

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-8">
      {/* Sidebar */}
      <div
        className={cn(
          "h-full bg-card border-r border-border transition-all duration-300 flex flex-col",
          isSidebarOpen ? "w-64" : "w-0 overflow-hidden"
        )}
      >
        {filterCompany !== "all" && (
          <SuiteTree
            tree={suiteTree}
            selectedSuiteId={selectedSuiteId}
            onSelect={setSelectedSuiteId}
            onAddSuite={handleAddSuite}
            onUpdateSuite={onUpdateSuite}
            onDeleteSuite={onDeleteSuite}
            onMoveSuite={onMoveSuite}
            unsortedCount={unsortedScenarios.length}
          />
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="shrink-0"
              >
                {isSidebarOpen ? (
                  <PanelLeftClose className="h-5 w-5" />
                ) : (
                  <PanelLeft className="h-5 w-5" />
                )}
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {currentSuiteName}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {filteredScenarios.length} cenário{filteredScenarios.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <Button onClick={openCreateDialog} className="shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              Novo Cenário
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, feature ou tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCompany} onValueChange={(v) => { setFilterCompany(v); setSelectedSuiteId(null); }}>
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
              <SelectTrigger className="w-full sm:w-36">
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
                  : "Nenhum cenário nesta pasta"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {scenarios.length === 0
                  ? "Comece criando seu primeiro cenário BDD."
                  : "Crie um novo cenário ou selecione outra pasta."}
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Cenário
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredScenarios.map((scenario, index) => (
                <div
                  key={scenario.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ScenarioCard
                    scenario={scenario}
                    runs={getScenarioRuns(scenario.id)}
                    onEdit={openEditDialog}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
            products={products}
            sprints={sprints}
            suites={suites}
            teamMembers={teamMembers}
            onSave={handleSave}
            onCancel={() => setIsDialogOpen(false)}
            initialData={editingScenario || undefined}
            defaultSuiteId={selectedSuiteId || undefined}
            defaultCompanyId={filterCompany !== "all" ? filterCompany : companies[0]?.id}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper to check if a scenario's suite is a descendant of the selected suite
function isInSuiteTree(selectedId: string, scenarioSuiteId: string | undefined, suites: TestSuite[]): boolean {
  if (!scenarioSuiteId) return false;
  
  let currentId: string | null = scenarioSuiteId;
  while (currentId) {
    if (currentId === selectedId) return true;
    const suite = suites.find((s) => s.id === currentId);
    currentId = suite?.parentId || null;
  }
  return false;
}
