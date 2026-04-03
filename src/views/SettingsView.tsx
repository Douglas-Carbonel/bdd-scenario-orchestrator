import { useState } from "react";
import { Settings, Code2, GitBranch, Database, Zap, Copy, Check, Terminal, Puzzle, FileJson } from "lucide-react";
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
  env:
    QA4_API_KEY: \${{ secrets.QA4_API_KEY }}
  run: |
    node -e "
      const https = require('https')
      const fs   = require('fs')
      const path = require('path')

      const url = '${syncEndpoint}?api_key=' + process.env.QA4_API_KEY
      https.get(url, res => {
        let data = ''
        res.on('data', d => data += d)
        res.on('end', () => {
          const { features, map } = JSON.parse(data)

          // Write each .feature file
          features.forEach(f => {
            fs.mkdirSync(path.dirname(f.path), { recursive: true })
            fs.writeFileSync(f.path, f.content, 'utf-8')
          })

          // Write the map file used by the plugin
          fs.writeFileSync('.qa4map.json', JSON.stringify(map, null, 2), 'utf-8')

          console.log('4QA: synced ' + features.length + ' scenarios')
        })
      })
    "`;

  const pluginSnippet = `// cypress/support/qa4.plugin.js
const fs   = require('fs')
const path = require('path')

let qa4Map = {}
try {
  qa4Map = JSON.parse(fs.readFileSync('.qa4map.json', 'utf-8'))
} catch (e) {
  console.warn('4QA: .qa4map.json not found — run the sync step first')
}

const RESULTS_ENDPOINT = '${resultsEndpoint}'

module.exports = (on, config) => {
  on('after:spec', (_spec, results) => {
    const scenarioId = qa4Map[_spec.relative]
    const apiKey     = config.env.QA4_API_KEY

    if (!scenarioId || !apiKey) return

    const status   = results.stats.failures > 0 ? 'failed' : 'passed'
    const duration = results.stats.duration

    const body = JSON.stringify({
      results: [{ scenario_id: scenarioId, status, duration, executed_by: 'cypress-ci' }]
    })

    const url      = new URL(RESULTS_ENDPOINT + '?api_key=' + apiKey)
    const options  = {
      hostname: url.hostname,
      path:     url.pathname + url.search,
      method:   'POST',
      headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }

    return new Promise(resolve => {
      const req = require('https').request(options, res => {
        res.on('data', () => {})
        res.on('end', () => {
          console.log(\`4QA: reported \${status} for scenario \${scenarioId}\`)
          resolve()
        })
      })
      req.on('error', e => { console.warn('4QA reporter error:', e.message); resolve() })
      req.write(body)
      req.end()
    })
  })
}`;

  const cypressConfigSnippet = `// cypress.config.js
const { defineConfig } = require('cypress')
const qa4Plugin         = require('./cypress/support/qa4.plugin')

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      qa4Plugin(on, config)   // <-- única linha necessária
      return config
    },
  },
  env: {
    // Defina QA4_API_KEY como variável de ambiente no CI
    // ou adicione aqui apenas para testes locais (não commite!)
    QA4_API_KEY: process.env.QA4_API_KEY,
  },
})`;

  const steps = [
    {
      number: "1",
      title: "Obtenha sua API Key",
      description: "Acesse a página de Empresas, selecione sua empresa e copie a API Key gerada automaticamente.",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      number: "2",
      title: "Adicione a key como secret no CI",
      description: "No GitHub: Settings → Secrets → New repository secret → Nome: QA4_API_KEY.",
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      number: "3",
      title: "Adicione o passo de sync no workflow",
      description: "O script baixa os .feature files e gera o .qa4map.json com o mapeamento automático de IDs.",
      color: "text-green-400",
      bg: "bg-green-400/10",
    },
    {
      number: "4",
      title: "Adicione o plugin ao seu projeto Cypress",
      description: "Copie o qa4.plugin.js e registre-o no cypress.config.js. Pronto — nenhum ID manual necessário.",
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações e integrações do 4QA</p>
      </div>

      {/* How it works */}
      <div className="glass-card rounded-xl p-6 border-primary/20 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Como funciona a integração</h3>
            <p className="text-sm text-muted-foreground">O ID do cenário viaja dentro do próprio arquivo .feature — sem configuração manual</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div key={step.number} className="rounded-lg bg-secondary/30 border border-border p-4 space-y-2">
              <div className={`h-8 w-8 rounded-full ${step.bg} flex items-center justify-center`}>
                <span className={`text-sm font-bold ${step.color}`}>{step.number}</span>
              </div>
              <p className="text-sm font-medium text-foreground">{step.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 text-sm text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Como o ID é rastreado automaticamente</p>
          <p>O <code className="bg-secondary/50 px-1 rounded text-xs">cypress-sync</code> embute a tag <code className="bg-secondary/50 px-1 rounded text-xs">@qa4:uuid</code> em cada <code className="bg-secondary/50 px-1 rounded text-xs">.feature</code> gerado e cria um arquivo <code className="bg-secondary/50 px-1 rounded text-xs">.qa4map.json</code> mapeando cada arquivo ao seu cenário. O plugin lê esse mapa após cada spec e reporta o resultado automaticamente — sem IDs manuais.</p>
        </div>
      </div>

      {/* Cypress Integration */}
      <div className="glass-card rounded-xl p-6 glow-border space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Code2 className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Integração Cypress</h3>
              <p className="text-sm text-muted-foreground">API REST para sincronizar cenários e receber resultados automaticamente</p>
            </div>
          </div>
          <Badge className="bg-primary/20 text-primary">Ativo</Badge>
        </div>

        {/* Endpoints */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            Endpoints da API
          </h4>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-secondary/30 border border-border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground">GET — Sincronizar cenários + gerar mapa</span>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(syncEndpoint, "sync")}>
                  {copiedKey === "sync" ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
              <code className="text-xs text-foreground break-all">{syncEndpoint}?api_key=YOUR_API_KEY</code>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30 border border-border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground">POST — Receber resultados (chamado pelo plugin)</span>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(resultsEndpoint, "results")}>
                  {copiedKey === "results" ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
              <code className="text-xs text-foreground break-all">{resultsEndpoint}?api_key=YOUR_API_KEY</code>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            A <code className="bg-secondary/50 px-1 rounded">api_key</code> identifica sua empresa. Cada projeto Cypress usa a key da empresa correspondente.
          </p>
        </div>

        {/* CI/CD Snippet */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Passo de Sync — GitHub Actions
            </h4>
            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(ciCdSnippet, "cicd")}>
              {copiedKey === "cicd" ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Adicione este passo <strong>antes</strong> do seu passo de execução do Cypress. Ele baixa os cenários e gera o <code className="bg-secondary/50 px-1 rounded">.qa4map.json</code>.</p>
          <pre className="p-3 rounded-lg bg-background/80 border border-border text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre">
            {ciCdSnippet}
          </pre>
        </div>

        {/* Plugin Snippet */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Puzzle className="h-4 w-4" />
              Plugin — cypress/support/qa4.plugin.js
            </h4>
            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(pluginSnippet, "plugin")}>
              {copiedKey === "plugin" ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Crie este arquivo no seu projeto Cypress. Ele lê o <code className="bg-secondary/50 px-1 rounded">.qa4map.json</code> e reporta os resultados automaticamente após cada spec.</p>
          <pre className="p-3 rounded-lg bg-background/80 border border-border text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre">
            {pluginSnippet}
          </pre>
        </div>

        {/* cypress.config.js Snippet */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileJson className="h-4 w-4" />
              Configuração — cypress.config.js
            </h4>
            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(cypressConfigSnippet, "config")}>
              {copiedKey === "config" ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Registre o plugin no seu <code className="bg-secondary/50 px-1 rounded">cypress.config.js</code>. Apenas uma linha extra — o resto funciona automaticamente.</p>
          <pre className="p-3 rounded-lg bg-background/80 border border-border text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre">
            {cypressConfigSnippet}
          </pre>
        </div>
      </div>

      {/* Other Integration Cards */}
      <div className="grid gap-6 md:grid-cols-2">
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

        <div className="glass-card rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
              <Database className="h-6 w-6 text-muted-foreground" />
            </div>
            <Badge variant="outline" className="text-muted-foreground border-muted">
              Planejado
            </Badge>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Notificações</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Receba alertas no Slack ou e-mail quando cenários críticos falharem.
          </p>
          <Button variant="outline" disabled className="w-full">
            Em desenvolvimento
          </Button>
        </div>

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
