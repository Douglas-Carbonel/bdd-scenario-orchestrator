import { useState } from "react";
import { Download, FileCode, Settings2, Copy, Check, FileText, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scenario, Company, Sprint } from "@/types/bdd";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  generateFeatureFile,
  generateStepDefinitions,
  generateCypressConfig,
  downloadFile,
  generateCypressZip,
} from "@/utils/cypressExport";
import { toast } from "sonner";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenarios: Scenario[];
  companies: Company[];
  sprints: Sprint[];
}

export function ExportDialog({ open, onOpenChange, scenarios, companies, sprints }: ExportDialogProps) {
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>(scenarios.map(s => s.id));
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);

  const getCompanyName = (id: string) => companies.find(c => c.id === id)?.name;
  const getSprintName = (id: string) => sprints.find(s => s.id === id)?.name;

  const toggleScenario = (id: string) => {
    setSelectedScenarios(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedScenarios.length === scenarios.length) {
      setSelectedScenarios([]);
    } else {
      setSelectedScenarios(scenarios.map(s => s.id));
    }
  };

  const selectedScenariosList = scenarios.filter(s => selectedScenarios.includes(s.id));

  const featurePreview = selectedScenariosList.length > 0
    ? generateFeatureFile(
        selectedScenariosList[0],
        getCompanyName(selectedScenariosList[0].companyId),
        selectedScenariosList[0].sprintId ? getSprintName(selectedScenariosList[0].sprintId) : undefined
      )
    : "Selecione pelo menos um cenário";

  const stepsPreview = generateStepDefinitions(selectedScenariosList);
  const configPreview = generateCypressConfig();

  const copyToClipboard = (content: string, tab: string) => {
    navigator.clipboard.writeText(content);
    setCopiedTab(tab);
    setTimeout(() => setCopiedTab(null), 2000);
    toast.success("Copiado para a área de transferência!");
  };

  const handleExportFeatures = () => {
    selectedScenariosList.forEach(scenario => {
      const content = generateFeatureFile(
        scenario,
        getCompanyName(scenario.companyId),
        scenario.sprintId ? getSprintName(scenario.sprintId) : undefined
      );
      const filename = `${scenario.feature.toLowerCase().replace(/\s+/g, "-")}-${scenario.title.toLowerCase().replace(/\s+/g, "-")}.feature`;
      downloadFile(content, filename);
    });
    toast.success(`${selectedScenariosList.length} arquivo(s) .feature exportado(s)!`);
  };

  const handleExportZip = async () => {
    if (selectedScenariosList.length === 0) return;
    setIsGeneratingZip(true);
    try {
      const blob = await generateCypressZip(selectedScenariosList, companies, sprints);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "cypress-bdd-tests.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("ZIP exportado com estrutura completa do Cypress!");
    } catch (error) {
      toast.error("Erro ao gerar o ZIP");
    } finally {
      setIsGeneratingZip(false);
    }
  };

  const handleExportSteps = () => {
    downloadFile(stepsPreview, "step-definitions.ts");
    toast.success("Step definitions exportado!");
  };

  const handleExportConfig = () => {
    downloadFile(configPreview, "cypress.config.ts");
    toast.success("Configuração do Cypress exportada!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-primary" />
            Exportar para Cypress
          </DialogTitle>
          <DialogDescription>
            Gere arquivos .feature e step definitions para usar no Cypress
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="features" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="features" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Features
            </TabsTrigger>
            <TabsTrigger value="steps" className="flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              Steps
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Config
            </TabsTrigger>
          </TabsList>

          <TabsContent value="features" className="flex-1 overflow-hidden flex flex-col gap-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={selectedScenarios.length === scenarios.length}
                  onCheckedChange={toggleAll}
                />
                <Label htmlFor="select-all" className="text-sm">
                  Selecionar todos ({selectedScenarios.length}/{scenarios.length})
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleExportZip}
                  disabled={selectedScenarios.length === 0 || isGeneratingZip}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  {isGeneratingZip ? "Gerando..." : "Baixar ZIP"}
                </Button>
                <Button onClick={handleExportFeatures} disabled={selectedScenarios.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar .feature
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
              {/* Scenario List */}
              <div className="border border-border rounded-lg p-3 overflow-y-auto space-y-2">
                {scenarios.map(scenario => (
                  <label
                    key={scenario.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedScenarios.includes(scenario.id)}
                      onCheckedChange={() => toggleScenario(scenario.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {scenario.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {scenario.feature} • {getCompanyName(scenario.companyId)}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Preview */}
              <div className="border border-border rounded-lg overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-3 py-2 bg-secondary/50 border-b border-border">
                  <span className="text-xs font-medium text-muted-foreground">Preview</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(featurePreview, "features")}
                  >
                    {copiedTab === "features" ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <pre className="flex-1 overflow-auto p-3 text-xs font-mono text-muted-foreground bg-background/50">
                  {featurePreview}
                </pre>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="steps" className="flex-1 overflow-hidden flex flex-col gap-4 mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Step definitions gerados a partir dos {selectedScenariosList.length} cenário(s) selecionados
              </p>
              <Button onClick={handleExportSteps}>
                <Download className="h-4 w-4 mr-2" />
                Baixar steps.ts
              </Button>
            </div>

            <div className="border border-border rounded-lg overflow-hidden flex-1 flex flex-col">
              <div className="flex items-center justify-between px-3 py-2 bg-secondary/50 border-b border-border">
                <span className="text-xs font-medium text-muted-foreground">step-definitions.ts</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(stepsPreview, "steps")}
                >
                  {copiedTab === "steps" ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <pre className="flex-1 overflow-auto p-3 text-xs font-mono text-muted-foreground bg-background/50">
                {stepsPreview}
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="config" className="flex-1 overflow-hidden flex flex-col gap-4 mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Configuração para usar Cucumber com Cypress
              </p>
              <Button onClick={handleExportConfig}>
                <Download className="h-4 w-4 mr-2" />
                Baixar cypress.config.ts
              </Button>
            </div>

            <div className="border border-border rounded-lg overflow-hidden flex-1 flex flex-col">
              <div className="flex items-center justify-between px-3 py-2 bg-secondary/50 border-b border-border">
                <span className="text-xs font-medium text-muted-foreground">cypress.config.ts</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(configPreview, "config")}
                >
                  {copiedTab === "config" ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <pre className="flex-1 overflow-auto p-3 text-xs font-mono text-muted-foreground bg-background/50">
                {configPreview}
              </pre>
            </div>

            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <h4 className="text-sm font-medium text-foreground mb-2">📦 Dependências necessárias</h4>
              <code className="text-xs text-muted-foreground block bg-secondary/50 p-2 rounded">
                npm install -D @badeball/cypress-cucumber-preprocessor @bahmutov/cypress-esbuild-preprocessor esbuild
              </code>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
