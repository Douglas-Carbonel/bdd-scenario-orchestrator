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
// Sem qa4-scenarios.json — busca o mapa direto da API a cada run.
const { defineConfig } = require('cypress')
const https = require('https')
const fs    = require('fs')
const path  = require('path')

const SYNC_ENDPOINT    = '${syncEndpoint}'
const RESULTS_ENDPOINT = '${resultsEndpoint}'
const SUPABASE_URL     = 'https://${SUPABASE_PROJECT_ID}.supabase.co'

// Compatível com Node 14, 16 e 18+
function httpRequest(method, url, headers, body) {
  return new Promise((resolve) => {
    const u   = new URL(url)
    const buf = body ? (Buffer.isBuffer(body) ? body : Buffer.from(JSON.stringify(body))) : null
    const req = https.request(
      { hostname: u.hostname, path: u.pathname + u.search, method,
        headers: { ...headers, ...(buf ? { 'Content-Length': buf.length } : {}) } },
      (res) => {
        let data = ''
        res.on('data', c => data += c)
        res.on('end', () => resolve({ ok: res.statusCode < 300, status: res.statusCode, body: data }))
      }
    )
    req.on('error', (e) => { console.warn('[4QA] erro de rede:', e.message); resolve({ ok: false, body: e.message }) })
    if (buf) req.write(buf)
    req.end()
  })
}

// Normaliza texto: remove acentos, lowercase, espaços extras
function normalize(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim()
}

// Cache: folder → titleMap { titulo → scenarioId }
const cache = {}

module.exports = defineConfig({
  e2e: {
    screenshotOnRunFailure: true,

    setupNodeEvents(on, config) {
      // Lê QA4_COMPANIES do ambiente: { "pasta": "api-key" }
      let folderToApiKey = {}
      try {
        folderToApiKey = JSON.parse(process.env.QA4_COMPANIES || '{}')
        console.log('[4QA] pastas configuradas:', Object.keys(folderToApiKey).join(', ') || '(nenhuma)')
      } catch (e) {
        console.warn('[4QA] QA4_COMPANIES inválido ou ausente:', e.message)
      }

      on('after:spec', async (spec, results) => {
        const specParts   = (spec.relative || '').split(/[\\\\/]/)
        const folder      = specParts.length >= 3 ? specParts[2] : specParts[0]
        const apiKey      = folderToApiKey[folder]
        const supabaseKey = process.env.SUPABASE_ANON_KEY
        const allShots    = results.screenshots || []

        console.log(\`[4QA] \${spec.relative} → pasta: "\${folder}", screenshots: \${allShots.length}\`)

        if (!apiKey) {
          console.warn(\`[4QA] Pasta "\${folder}" não encontrada em QA4_COMPANIES — resultado não enviado.\`)
          return
        }

        // Busca titleMap da API (com cache por pasta)
        if (!cache[folder]) {
          const res = await httpRequest('GET', \`\${SYNC_ENDPOINT}?api_key=\${apiKey}\`, {}, null)
          if (!res.ok) {
            console.warn('[4QA] falha ao buscar cenários:', res.status, res.body)
            return
          }
          const data = JSON.parse(res.body)
          cache[folder] = data.titleMap || {}
          console.log(\`[4QA] \${Object.keys(cache[folder]).length} cenários para "\${folder}"\`)
        }

        const titleMap = cache[folder]
        const payload  = []

        for (const test of (results.tests || [])) {
          const title      = test.title[test.title.length - 1]
          const scenarioId = titleMap[title]

          if (!scenarioId) {
            console.log(\`[4QA] sem mapeamento: "\${title}" — verifique o título no 4QA\`)
            continue
          }

          const lastAttempt = (test.attempts || []).slice(-1)[0] || {}
          const status      = lastAttempt.state === 'passed' ? 'passed' : 'failed'
          const duration    = lastAttempt.duration || 0
          const errorMsg    = lastAttempt.error?.message || null

          const shots = allShots.filter(s =>
            (test.testId && s.testId === test.testId) ||
            normalize(path.basename(s.path)).includes(normalize(title).substring(0, 30))
          )
          console.log(\`[4QA] "\${title}": \${status}, \${shots.length} screenshot(s)\`)

          const evidenceUrls = []
          if (supabaseKey) {
            for (const ss of shots) {
              try {
                const file        = fs.readFileSync(ss.path)
                const ext         = path.extname(ss.path) || '.png'
                const safeName    = path.basename(ss.path, ext)
                  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                  .replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-')
                  .replace(/^-|-$/g, '').substring(0, 60)
                const fileName    = \`\${scenarioId}/\${Date.now()}-\${safeName}\${ext}\`
                const up = await httpRequest(
                  'POST',
                  \`\${SUPABASE_URL}/storage/v1/object/evidence/\${fileName}\`,
                  { 'Authorization': \`Bearer \${supabaseKey}\`, 'Content-Type': 'image/png' },
                  file
                )
                if (up.ok) {
                  const url = \`\${SUPABASE_URL}/storage/v1/object/public/evidence/\${fileName}\`
                  evidenceUrls.push(url)
                  console.log('[4QA] evidência enviada:', url)
                } else {
                  console.warn('[4QA] upload falhou:', up.status, up.body)
                }
              } catch (e) {
                console.warn('[4QA] erro ao processar screenshot:', e.message)
              }
            }
          }

          payload.push({
            scenario_id:   scenarioId,
            status, duration,
            error_message: errorMsg,
            executed_by:   'cypress-ci',
            evidence_urls: evidenceUrls.length ? evidenceUrls : undefined,
          })
        }

        if (payload.length === 0) return

        const r = await httpRequest(
          'POST',
          \`\${RESULTS_ENDPOINT}?api_key=\${apiKey}\`,
          { 'Content-Type': 'application/json' },
          { results: payload }
        )
        console.log('[4QA] resultados enviados:', r.status, r.ok ? 'OK' : r.body)
      })

      return config
    },
  },
})`;

  const testSnippet = `// cypress/e2e/saucedemo/login.cy.js
// Nenhuma importação extra necessária — o cypress.config.js cuida de tudo.
// Screenshots de falha são capturadas e enviadas automaticamente.

describe('SauceDemo Login', () => {

  beforeEach(() => {
    cy.visit('https://www.saucedemo.com/')
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

      - name: Rodar testes Cypress
        env:
          QA4_COMPANIES: \${{ secrets.QA4_COMPANIES }}
          SUPABASE_ANON_KEY: \${{ secrets.SUPABASE_ANON_KEY }}
        run: npx cypress run`;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações e integrações do 4QA</p>
      </div>

      {/* API Keys dos Produtos */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-yellow-400/10 flex items-center justify-center shrink-0">
            <Key className="h-5 w-5 text-yellow-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Secret do GitHub — <code className="text-xs font-mono bg-secondary/50 px-1 rounded">QA4_COMPANIES</code></h3>
            <p className="text-sm text-muted-foreground">
              Um único secret com todos os produtos. O reporter detecta automaticamente o produto pelo caminho da pasta do arquivo de teste.
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-secondary/30 border border-border overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/20">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Valor do secret</span>
              <Badge className="bg-primary/20 text-primary text-xs">QA4_COMPANIES</Badge>
            </div>
          </div>
          <pre className="p-4 text-xs font-mono text-muted-foreground overflow-x-auto leading-relaxed">
            {companiesJson}
          </pre>
        </div>

        <Button
          size="lg"
          className="w-full gap-2 text-sm font-semibold"
          onClick={() => copyToClipboard(companiesJson, "companies-json")}
        >
          {copiedKey === "companies-json" ? (
            <>
              <Check className="h-4 w-4" />
              Copiado! Cole no GitHub Secrets como QA4_COMPANIES
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copiar valor do secret QA4_COMPANIES
            </>
          )}
        </Button>

        <div className="rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 text-xs text-green-400 flex items-start gap-2">
          <Check className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            As API Keys já estão incluídas e atualizadas — geradas direto do banco de dados.
            Basta copiar e colar no GitHub sem editar nada.
          </span>
        </div>

        {products.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Mapeamento pasta → produto:</p>
            {products.map((product) => {
              const folder = product.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
              const company = companies.find((c) => c.id === product.companyId)
              return (
                <div key={product.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3 shrink-0" />
                  <code className="bg-secondary/50 px-1 rounded">cypress/e2e/{folder}/</code>
                  <span>→</span>
                  <span className="text-foreground font-medium">{product.name}</span>
                  {company && (
                    <span className="text-muted-foreground/60">({company.name})</span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <p className="text-xs text-muted-foreground border-t border-border pt-3">
          No GitHub: <span className="text-foreground">Settings → Secrets and variables → Actions → New repository secret</span> → nome: <code className="bg-secondary/50 px-1 rounded">QA4_COMPANIES</code> → cole o valor copiado acima
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
            { n: "3", color: "text-green-400", bg: "bg-green-400/10", title: "Cypress executa", desc: "O cypress.config.js carrega o mapa e reporta resultados + screenshots via after:spec." },
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
              <p className="text-sm text-muted-foreground">Use a API Key do produto (seção Empresas → Produtos)</p>
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

        {/* Step 2 - cypress.config.js */}
        <div className="glass-card rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-yellow-400/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-yellow-400">2</span>
            </div>
            <div>
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <FileJson className="h-4 w-4" />
                Atualizar — <code className="text-xs font-mono bg-secondary/50 px-1 rounded">cypress.config.js</code>
              </h4>
              <p className="text-sm text-muted-foreground">
                O hook <code className="text-xs bg-secondary/50 px-1 rounded">after:spec</code> reporta resultados e faz upload de screenshots automaticamente.
                Adicione <code className="text-xs bg-secondary/50 px-1 rounded">SUPABASE_ANON_KEY</code> como secret no GitHub para habilitar evidências.
              </p>
            </div>
          </div>
          <CodeBlock code={configSnippet} copyKey="config" copiedKey={copiedKey} onCopy={copyToClipboard} />
          <div className="rounded-lg bg-green-400/5 border border-green-400/20 px-3 py-2 text-xs text-green-300">
            Arquivo <code>cypress/support/qa4-reporter.js</code> não é mais necessário — pode removê-lo.
          </div>
        </div>

        {/* Step 3 - test change */}
        <div className="glass-card rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-primary">3</span>
            </div>
            <div>
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <FlaskConical className="h-4 w-4" />
                Seu teste — mudança mínima
              </h4>
              <p className="text-sm text-muted-foreground">
                Seus testes ficam limpos — sem imports de reporter, sem <code className="text-xs bg-secondary/50 px-1 rounded">afterEach</code>. O título do <code className="text-xs bg-secondary/50 px-1 rounded">it()</code> precisa ser igual ao título cadastrado no 4QA.
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
