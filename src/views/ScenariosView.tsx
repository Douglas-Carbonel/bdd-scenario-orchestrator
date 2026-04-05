import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search, Filter, PanelLeftClose, PanelLeft, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScenarioCard } from "@/components/scenarios/ScenarioCard";
import { ScenarioForm } from "@/components/scenarios/ScenarioForm";
import { ManualExecutionDialog } from "@/components/scenarios/ManualExecutionDialog";
import { SuiteTree } from "@/components/suites/SuiteTree";
import { Company, Product, Sprint, Scenario, TestSuite, SuiteTreeNode, TeamMember, TestRun, Defect } from "@/types/bdd";
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
  clearScenarioRuns: (scenarioId: string) => void;
  onAddTestRun: (run: Omit<TestRun, "id">) => void;
  getScenarioDefects: (scenarioId: string) => Defect[];
  onAddDefect: (defect: Omit<Defect, "id" | "createdAt" | "updatedAt">) => void;
  onUpdateDefect: (id: string, updates: Partial<Defect>) => void;
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
  clearScenarioRuns,
  onAddTestRun,
  getScenarioDefects,
  onAddDefect,
  onUpdateDefect,
}: ScenariosViewProps) {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);
  const [runningScenario, setRunningScenario] = useState<Scenario | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCompany, setFilterCompany] = useState<string>(companies[0]?.id || "all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterExecType, setFilterExecType] = useState<"all" | "manual" | "automated">("all");
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
      const matchesExecType = filterExecType === "all" || scenario.executionType === filterExecType;
      const matchesSuite = selectedSuiteId === null 
        ? !scenario.suiteId 
        : scenario.suiteId === selectedSuiteId || isInSuiteTree(selectedSuiteId, scenario.suiteId, suites);
      
      return matchesSearch && matchesCompany && matchesStatus && matchesExecType && matchesSuite;
    });
  }, [scenarios, searchQuery, filterCompany, filterStatus, filterExecType, selectedSuiteId, suites]);

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

  const handleRunScenario = (scenario: Scenario) => {
    setRunningScenario(scenario);
  };

  const handleExecutionSubmit = (run: Omit<TestRun, "id">, scenarioStatus: "passed" | "failed") => {
    onAddTestRun(run);
    onUpdateScenario(run.scenarioId, { status: scenarioStatus });
  };

  // Get current suite name for header
  const currentSuiteName = useMemo(() => {
    if (selectedSuiteId === null) return t("scenarios.noFolder");
    const suite = suites.find((s) => s.id === selectedSuiteId);
    return suite?.name || t("common.all");
  }, [selectedSuiteId, suites, t]);

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
                  {filteredScenarios.length !== 1
                    ? t("scenarios.countPlural", { count: filteredScenarios.length })
                    : t("scenarios.count",       { count: filteredScenarios.length })}
                </p>
              </div>
            </div>
            <Button onClick={openCreateDialog} className="shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              {t("scenarios.newScenario")}
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("scenarios.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCompany} onValueChange={(v) => { setFilterCompany(v); setSelectedSuiteId(null); }}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={t("common.company")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("scenarios.allCompanies")}</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder={t("common.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                <SelectItem value="draft">{t("scenarioStatus.draft")}</SelectItem>
                <SelectItem value="ready">{t("scenarioStatus.ready")}</SelectItem>
                <SelectItem value="running">{t("scenarioStatus.running")}</SelectItem>
                <SelectItem value="passed">{t("scenarioStatus.passed")}</SelectItem>
                <SelectItem value="failed">{t("scenarioStatus.failed")}</SelectItem>
              </SelectContent>
            </Select>

            {/* Execution type filter */}
            <div className="flex rounded-md border border-border overflow-hidden shrink-0">
              {(["all", "automated", "manual"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterExecType(type)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-r border-border last:border-r-0",
                    filterExecType === type
                      ? type === "manual"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : type === "automated"
                          ? "bg-primary/15 text-primary"
                          : "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  {type === "all" && <Filter className="h-3 w-3" />}
                  {type === "automated" && <Bot className="h-3 w-3" />}
                  {type === "manual" && <User className="h-3 w-3" />}
                  {type === "all" ? t("common.all") : type === "automated" ? "E2E" : t("executionType.manual")}
                </button>
              ))}
            </div>
          </div>

          {/* Scenarios Grid */}
          {filteredScenarios.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Filter className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {scenarios.length === 0
                  ? t("scenarios.noScenarios")
                  : t("scenarios.noScenariosFolder")}
              </h3>
              <p className="text-muted-foreground mb-6">
                {scenarios.length === 0
                  ? t("scenarios.noScenariosHint")
                  : t("scenarios.noScenariosFolderHint")}
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                {t("scenarios.newScenario")}
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
                    defects={getScenarioDefects(scenario.id)}
                    onEdit={openEditDialog}
                    onRun={handleRunScenario}
                    onClearRuns={clearScenarioRuns}
                    onAddDefect={onAddDefect}
                    onUpdateDefect={onUpdateDefect}
                    getSprintName={(id) => sprints.find(s => s.id === id)?.name}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Manual Execution Dialog */}
      <ManualExecutionDialog
        scenario={runningScenario}
        sprints={sprints}
        open={!!runningScenario}
        onOpenChange={(open) => { if (!open) setRunningScenario(null); }}
        onSubmit={handleExecutionSubmit}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingScenario ? t("scenarios.editScenario") : t("scenarios.newScenarioBDD")}
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
