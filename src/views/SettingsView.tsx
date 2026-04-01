import { useState } from "react";
import { Settings, Code2, GitBranch, Database, Zap, Copy, Check, Terminal, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExportDialog } from "@/components/export/ExportDialog";
import { Company, Sprint, Scenario } from "@/types/bdd";
import { toast } from "sonner";

interface SettingsViewProps {
  companies: Company[];
  sprints: Sprint[];
  scenarios: Scenario[];
}

const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

export function SettingsView({ companies, sprints, scenarios }: SettingsViewProps) {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    toast.success("Copiado!");
  };

  const syncEndpoint = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/cypress-sync`;
  const resultsEndpoint = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/cypress-results`;

  const ciCdSnippet = `# .github/workflows/cypress.yml
- name: Sync BDD scenarios from 4QA
  run: |
    curl -s "${syncEndpoint}?api_key=\${{ secrets.QA4_API_KEY }}" \\
      | jq -r '.features[] | .path + "|||" + .content' \\
      | while IFS='|||' read -r path content; do
          mkdir -p "$(dirname "$path")"
          echo "$content" > "$path"
        done`;

  const reporterSnippet = `// cypress/support/e2e.ts
afterEach(function () {
  const result = {
    scenario_id: Cypress.env("SCENARIO_ID"),
    status: this.currentTest?.state === "passed" ? "passed" : "failed",
    duration: this.currentTest?.duration,
    error_message: this.currentTest?.err?.message,
    executed_by: "cypress-ci"
  };
  
  cy.request({
    method: "POST",
    url: "${resultsEndpoint}?api_key=" + Cypress.env("QA4_API_KEY"),
    body: { results: [result] },
    failOnStatusCode: false,
  });
});`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações e integrações do 4QA</p>
      </div>

      {/* Cypress Integration - Full */}
      <div className="glass-card rounded-xl p-6 glow-border space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Code2 className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Integração Cypress</h3>
              <p className="text-sm text-muted-foreground">API REST para sincronizar cenários e receber resultados</p>
            </div>
          </div>
          <Badge className="bg-primary/20 text-primary">Ativo</Badge>
        </div>

        {/* API Endpoints */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            Endpoints da API
          </h4>

          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-secondary/30 border border-border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground">GET — Sincronizar cenários</span>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(syncEndpoint, "sync")}>
                  {copiedKey === "sync" ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
              <code className="text-xs text-foreground break-all">{syncEndpoint}?api_key=YOUR_API_KEY</code>
            </div>

            <div className="p-3 rounded-lg bg-secondary/30 border border-border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground">POST — Enviar resultados</span>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(resultsEndpoint, "results")}>
                  {copiedKey === "results" ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
              <code className="text-xs text-foreground break-all">{resultsEndpoint}?api_key=YOUR_API_KEY</code>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            A <code className="bg-secondary/50 px-1 rounded">api_key</code> de cada empresa é gerada automaticamente. 
            Consulte a seção de empresas para obter a chave.
          </p>
        </div>

        {/* CI/CD Snippet */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Exemplo CI/CD (GitHub Actions)
            </h4>
            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(ciCdSnippet, "cicd")}>
              {copiedKey === "cicd" ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
          <pre className="p-3 rounded-lg bg-background/80 border border-border text-xs font-mono text-muted-foreground overflow-x-auto">
            {ciCdSnippet}
          </pre>
        </div>

        {/* Reporter Snippet */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Send className="h-4 w-4" />
              Reporter de Resultados (Cypress)
            </h4>
            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(reporterSnippet, "reporter")}>
              {copiedKey === "reporter" ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
          <pre className="p-3 rounded-lg bg-background/80 border border-border text-xs font-mono text-muted-foreground overflow-x-auto">
            {reporterSnippet}
          </pre>
        </div>
      </div>

      {/* Other Integration Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Git Integration */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
              <GitBranch className="h-6 w-6 text-muted-foreground" />
            </div>
            <Badge variant="outline" className="text-muted-foreground border-muted">
              Planejado
            </Badge>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Integração Git</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Versione seus cenários BDD diretamente no repositório do projeto.
          </p>
          <Button variant="outline" disabled className="w-full">
            Em desenvolvimento
          </Button>
        </div>

        {/* Database Sync */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
              <Database className="h-6 w-6 text-muted-foreground" />
            </div>
            <Badge variant="outline" className="text-muted-foreground border-muted">
              Planejado
            </Badge>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Persistência de Dados</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Conecte a um banco de dados para persistir cenários e resultados.
          </p>
          <Button variant="outline" disabled className="w-full">
            Em desenvolvimento
          </Button>
        </div>

        {/* Export Options */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <Badge className="bg-primary/20 text-primary">Disponível</Badge>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Exportar Cenários</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Exporte em .feature (Gherkin) ou baixe tudo como ZIP com estrutura Cypress.
          </p>
          <Button variant="default" className="w-full" onClick={() => setExportDialogOpen(true)}>
            Exportar como .feature / ZIP
          </Button>
        </div>
      </div>

      {/* Info Section */}
      <div className="glass-card rounded-xl p-6 border-primary/30">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">Como funciona a integração</h3>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Obtenha a <strong>API Key</strong> da sua empresa na página de Empresas</li>
              <li>Use o endpoint <strong>cypress-sync</strong> no seu CI/CD para baixar os cenários</li>
              <li>Configure o <strong>reporter</strong> para enviar resultados de volta ao 4QA</li>
              <li>Acompanhe tudo no <strong>Dashboard</strong> em tempo real</li>
            </ol>
          </div>
        </div>
      </div>

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        scenarios={scenarios}
        companies={companies}
        sprints={sprints}
      />
    </div>
  );
}
