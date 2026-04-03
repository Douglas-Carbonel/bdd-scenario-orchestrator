import { useState } from "react";
import { Settings, Code2, GitBranch, Database, Zap, Copy, Check, Terminal, Puzzle, FileJson, FlaskConical, Key, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExportDialog } from "@/components/export/ExportDialog";
import { Company, Product, Sprint, Scenario } from "@/types/bdd";
import { toast } from "sonner";

interface SettingsViewProps {
  companies: Company[];
  products: Product[];
  sprints: Sprint[];
  scenarios: Scenario[];
}

const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

function CodeBlock({
  code,
  copyKey,
  copiedKey,
  onCopy,
}: {
  code: string;
  copyKey: string;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
}) {
  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 z-10"
        onClick={() => onCopy(code, copyKey)}
      >
        {copiedKey === copyKey ? (
          <Check className="h-3 w-3 text-primary" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>
      <pre className="p-4 rounded-lg bg-background/80 border border-border text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre leading-relaxed">
        {code}
      </pre>
    </div>
  );
}

export function SettingsView({ companies, products, sprints, scenarios }: SettingsViewProps) {
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

  // ─── Snippets ────────────────────────────────────────────────────────────────

  const companiesJson = products.length > 0
    ? JSON.stringify(
        Object.fromEntries(
          products.map(p => [
            p.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            p.apiKey
          ])
        ),
        null, 2
      )
    : `{\n  "saucedemo": "API_KEY_DO_PRODUTO_A",\n  "carhub": "API_KEY_DO_PRODUTO_B"\n}`;

  const ciSyncSnippet = `# Adicione este step ANTES do step que roda o Cypress
- name: Sync cenários do 4QA
  env:
    QA4_COMPANIES: \${{ secrets.QA4_COMPANIES }}
  run: node scripts/qa4-sync.js`;

  const reporterSnippet = `// cypress/support/qa4-reporter.js
//
// Detecta automaticamente a empresa pelo caminho do arquivo de teste
// (pasta dentro de cypress/e2e/) e reporta o resultado no 4QA.

const RESULTS_ENDPOINT = '${resultsEndpoint}'

/**
 * @param {string} testTitle  - this.currentTest.title
 * @param {string} state      - this.currentTest.state ('passed' | 'failed')
 * @param {number} duration   - this.currentTest.duration
 * @param {string|null} errorMessage - this.currentTest.err?.message
 */
function reportToQA4(testTitle, state, duration, errorMessage) {
  const scenarioMap = Cypress.env('QA4_SCENARIO_MAP') || {}

  // Detecta a pasta do produto pelo caminho do spec
  // ex: "cypress/e2e/saucedemo/login.cy.js" → "saucedemo"
  const specParts = (Cypress.spec.relative || '').split('/')
  const folder    = specParts.length >= 3 ? specParts[2] : 'default'

  const entry = scenarioMap[\`\${folder}:\${testTitle}\`]

  if (!entry) {
    Cypress.log({ name: '4QA', message: \`cenário "\${folder}:\${testTitle}" não encontrado\` })
    return
  }

  const { scenarioId, apiKey } = entry

  cy.request({
    method: 'POST',
    url: \`\${RESULTS_ENDPOINT}?api_key=\${apiKey}\`,
    body: {
      results: [{
        scenario_id:   scenarioId,
        status:        state === 'passed' ? 'passed' : 'failed',
        duration:      duration,
        error_message: errorMessage || null,
        executed_by:   'cypress-ci',
      }],
    },
    failOnStatusCode: false,
  }).then(() => {
    Cypress.log({ name: '4QA', message: \`reportado: \${folder} / \${testTitle} → \${state}\` })
  })
}

module.exports = { reportToQA4 }`;

  const configSnippet = `// cypress.config.js
const { defineConfig } = require('cypress')
const fs = require('fs')

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Carrega o mapa gerado pelo qa4-sync.js e injeta no env
      try {
        const map = JSON.parse(fs.readFileSync('qa4-scenarios.json', 'utf-8'))
        config.env.QA4_SCENARIO_MAP = map
      } catch (e) {
        console.warn('4QA: qa4-scenarios.json não encontrado — rode o sync primeiro')
      }
      return config
    },
  },
})`;

  const testSnippet = `// cypress/e2e/saucedemo/login.cy.js
// A pasta "saucedemo" é usada pelo reporter para identificar a empresa.
const { reportToQA4 } = require('../../../support/qa4-reporter')

describe('SauceDemo Login', () => {

  beforeEach(() => {
    cy.visit('https://www.saucedemo.com/')
  })

  afterEach(function () {
    reportToQA4(
      this.currentTest.title,
      this.currentTest.state,
      this.currentTest.duration,
      this.currentTest.err ? this.currentTest.err.message : null,
    )
  })

  it('Login com sucesso', () => {
    cy.get('#user-name').type('standard_user')
    cy.get('#password').type('secret_sauce')
    cy.get('#login-button').click()
    cy.url().should('include', 'inventory')
  })

  it('Login inválido deve exibir erro', () => {
    cy.get('#user-name').type('usuario_errado')
    cy.get('#password').type('senha_errada')
    cy.get('#login-button').click()
    cy.get('[data-test="error"]').should('be.visible')
  })

})`;

  const fullWorkflowSnippet = `# .github/workflows/cypress.yml
name: Cypress BDD Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  cypress:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Sync cenários do 4QA
        env:
          QA4_COMPANIES: \${{ secrets.QA4_COMPANIES }}
        run: node scripts/qa4-sync.js

      - name: Rodar testes Cypress
        run: npx cypress run`;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações e integrações do 4QA</p>
      </div>

      {/* API Keys das Empresas */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-yellow-400/10 flex items-center justify-center shrink-0">
            <Key className="h-5 w-5 text-yellow-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Secret do GitHub — <code className="text-xs font-mono bg-secondary/50 px-1 rounded">QA4_COMPANIES</code></h3>
            <p className="text-sm text-muted-foreground">
              Um único secret com todas as empresas. O reporter detecta automaticamente a empresa pelo caminho do arquivo de teste.
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-secondary/30 border border-border overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/20">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Valor do secret</span>
              <Badge className="bg-primary/20 text-primary text-xs">QA4_COMPANIES</Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs h-7"
              onClick={() => copyToClipboard(companiesJson, "companies-json")}
            >
              {copiedKey === "companies-json" ? (
                <>
                  <Check className="h-3 w-3 text-primary" />
                  <span className="text-primary">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copiar tudo</span>
                </>
              )}
            </Button>
          </div>
          <pre className="p-4 text-xs font-mono text-muted-foreground overflow-x-auto leading-relaxed">
            {companiesJson}
          </pre>
        </div>

        {companies.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Mapeamento pasta → empresa:</p>
            {companies.map((company) => {
              const folder = company.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
              return (
                <div key={company.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3 shrink-0" />
                  <code className="bg-secondary/50 px-1 rounded">cypress/e2e/{folder}/</code>
                  <span>→</span>
                  <span className="text-foreground font-medium">{company.name}</span>
                </div>
              )
            })}
          </div>
        )}

        <p className="text-xs text-muted-foreground border-t border-border pt-3">
          No GitHub: <span className="text-foreground">Settings → Secrets and variables → Actions → New repository secret</span> → nome: <code className="bg-secondary/50 px-1 rounded">QA4_COMPANIES</code> → cole o JSON acima
        </p>
      </div>

      {/* How it works */}
      <div className="glass-card rounded-xl p-6 border-primary/20 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Como funciona — Cypress puro (sem Cucumber)</h3>
            <p className="text-sm text-muted-foreground">Zero manutenção de IDs. O mapa é gerado automaticamente a cada sync.</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          {[
            { n: "1", color: "text-primary", bg: "bg-primary/10", title: "Cria o cenário no 4QA", desc: "Dê um título que bata exatamente com o it() do seu teste." },
            { n: "2", color: "text-accent", bg: "bg-accent/10", title: "CI roda o sync", desc: "Gera o qa4-scenarios.json com o mapa título → ID automaticamente." },
            { n: "3", color: "text-green-400", bg: "bg-green-400/10", title: "Cypress executa", desc: "O cypress.config.js carrega o mapa. O reporter usa para encontrar o ID." },
            { n: "4", color: "text-yellow-400", bg: "bg-yellow-400/10", title: "Dashboard atualiza", desc: "Cada teste reporta passed/failed sem você tocar em nenhum ID." },
          ].map((s) => (
            <div key={s.n} className="rounded-lg bg-secondary/30 border border-border p-4 space-y-2">
              <div className={`h-7 w-7 rounded-full ${s.bg} flex items-center justify-center`}>
                <span className={`text-xs font-bold ${s.color}`}>{s.n}</span>
              </div>
              <p className="text-sm font-medium text-foreground">{s.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Regra de ouro: </span>
          O título do <code className="bg-secondary/50 px-1 rounded text-xs">it()</code> no Cypress deve ser
          igual ao <strong>título do cenário</strong> cadastrado no 4QA. É assim que o reporter sabe que
          o teste X corresponde ao cenário X — sem nenhum ID hardcoded.
        </div>
      </div>

      {/* Endpoints */}
      <div className="glass-card rounded-xl p-6 glow-border space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Code2 className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Endpoints da API</h3>
              <p className="text-sm text-muted-foreground">Use a API Key da sua empresa (seção Empresas)</p>
            </div>
          </div>
          <Badge className="bg-primary/20 text-primary">Ativo</Badge>
        </div>

        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-secondary/30 border border-border">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">GET — Sincronizar cenários (retorna titleMap + features)</span>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(syncEndpoint, "sync")}>
                {copiedKey === "sync" ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
            <code className="text-xs text-foreground break-all">{syncEndpoint}?api_key=YOUR_API_KEY</code>
          </div>
          <div className="p-3 rounded-lg bg-secondary/30 border border-border">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">POST — Receber resultados (chamado automaticamente pelo reporter)</span>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(resultsEndpoint, "results")}>
                {copiedKey === "results" ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
            <code className="text-xs text-foreground break-all">{resultsEndpoint}?api_key=YOUR_API_KEY</code>
          </div>
        </div>
      </div>

      {/* Step-by-step setup */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Configuração passo a passo</h2>

        {/* Step 1 - CI sync */}
        <div className="glass-card rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-accent">1</span>
            </div>
            <div>
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                Passo de sync no CI — <code className="text-xs font-mono bg-secondary/50 px-1 rounded">.github/workflows/cypress.yml</code>
              </h4>
              <p className="text-sm text-muted-foreground">Adicione este step antes do step que roda o Cypress. Ele gera o <code className="text-xs bg-secondary/50 px-1 rounded">qa4-scenarios.json</code>.</p>
            </div>
          </div>
          <CodeBlock code={ciSyncSnippet} copyKey="ci" copiedKey={copiedKey} onCopy={copyToClipboard} />
        </div>

        {/* Step 2 - reporter */}
        <div className="glass-card rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-green-400/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-green-400">2</span>
            </div>
            <div>
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Puzzle className="h-4 w-4" />
                Arquivo reporter — <code className="text-xs font-mono bg-secondary/50 px-1 rounded">cypress/support/qa4-reporter.js</code>
              </h4>
              <p className="text-sm text-muted-foreground">Substitua o seu arquivo atual por este. Ele resolve o ID pelo título automaticamente.</p>
            </div>
          </div>
          <CodeBlock code={reporterSnippet} copyKey="reporter" copiedKey={copiedKey} onCopy={copyToClipboard} />
        </div>

        {/* Step 3 - cypress.config.js */}
        <div className="glass-card rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-yellow-400/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-yellow-400">3</span>
            </div>
            <div>
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <FileJson className="h-4 w-4" />
                Atualizar — <code className="text-xs font-mono bg-secondary/50 px-1 rounded">cypress.config.js</code>
              </h4>
              <p className="text-sm text-muted-foreground">Adicione o bloco <code className="text-xs bg-secondary/50 px-1 rounded">setupNodeEvents</code> para carregar o mapa no env do Cypress.</p>
            </div>
          </div>
          <CodeBlock code={configSnippet} copyKey="config" copiedKey={copiedKey} onCopy={copyToClipboard} />
        </div>

        {/* Step 4 - test change */}
        <div className="glass-card rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-primary">4</span>
            </div>
            <div>
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <FlaskConical className="h-4 w-4" />
                Seu teste — mudança mínima
              </h4>
              <p className="text-sm text-muted-foreground">
                Remova o objeto <code className="text-xs bg-secondary/50 px-1 rounded">SCENARIOS</code> hardcoded e passe <code className="text-xs bg-secondary/50 px-1 rounded">this.currentTest.title</code> diretamente. Só isso.
              </p>
            </div>
          </div>
          <CodeBlock code={testSnippet} copyKey="test" copiedKey={copiedKey} onCopy={copyToClipboard} />
        </div>

        {/* Full workflow */}
        <div className="glass-card rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Terminal className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Workflow completo — <code className="text-xs font-mono bg-secondary/50 px-1 rounded">.github/workflows/cypress.yml</code></h4>
              <p className="text-sm text-muted-foreground">Workflow do zero, com sync + execução do Cypress em um só arquivo.</p>
            </div>
          </div>
          <CodeBlock code={fullWorkflowSnippet} copyKey="workflow" copiedKey={copiedKey} onCopy={copyToClipboard} />
        </div>
      </div>

      {/* Other cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
              <GitBranch className="h-6 w-6 text-muted-foreground" />
            </div>
            <Badge variant="outline" className="text-muted-foreground border-muted">Planejado</Badge>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Integração Git</h3>
          <p className="text-sm text-muted-foreground mb-4">Versione seus cenários BDD diretamente no repositório do projeto.</p>
          <Button variant="outline" disabled className="w-full">Em desenvolvimento</Button>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
              <Database className="h-6 w-6 text-muted-foreground" />
            </div>
            <Badge variant="outline" className="text-muted-foreground border-muted">Planejado</Badge>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Notificações</h3>
          <p className="text-sm text-muted-foreground mb-4">Receba alertas no Slack ou e-mail quando cenários críticos falharem.</p>
          <Button variant="outline" disabled className="w-full">Em desenvolvimento</Button>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <Badge className="bg-primary/20 text-primary">Disponível</Badge>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Exportar Cenários</h3>
          <p className="text-sm text-muted-foreground mb-4">Exporte em .feature (Gherkin) ou baixe tudo como ZIP com estrutura Cypress.</p>
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
