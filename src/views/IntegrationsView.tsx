import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Code2, GitBranch, Zap, Copy, Check, Terminal,
  FileJson, Key, Building2, Puzzle, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Company, Product } from "@/types/bdd";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface IntegrationsViewProps {
  companies: Company[];
  products: Product[];
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

interface IntegrationCardProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}

function IntegrationCard({
  id,
  icon,
  title,
  description,
  badge,
  badgeColor = "bg-primary/20 text-primary",
  children,
  defaultOpen = false,
}: IntegrationCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-secondary/10 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="h-11 w-11 rounded-xl bg-secondary/40 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground">{title}</h3>
            {badge && (
              <Badge className={cn("text-xs", badgeColor)}>{badge}</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">{description}</p>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && children && (
        <div className="border-t border-border p-5 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

export function IntegrationsView({ companies, products }: IntegrationsViewProps) {
  const { t } = useTranslation();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    toast.success(t("settings.copied"));
  };

  const syncEndpoint = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/cypress-sync`;
  const resultsEndpoint = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/cypress-results`;

  const companiesJson = products.length > 0
    ? JSON.stringify(
        Object.fromEntries(
          products.map(p => [
            p.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            p.apiKey,
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
const RESULTS_ENDPOINT = '${resultsEndpoint}'

function reportToQA4(testTitle, state, duration, errorMessage) {
  const scenarioMap = Cypress.env('QA4_SCENARIO_MAP') || {}
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
        duration, error_message: errorMessage || null,
        executed_by: 'cypress-ci',
      }],
    },
    failOnStatusCode: false,
  })
}

module.exports = { reportToQA4 }`;

  const configSnippet = `// cypress.config.js
const { defineConfig } = require('cypress')
const https = require('https')
const fs    = require('fs')
const path  = require('path')

const SYNC_ENDPOINT    = '${syncEndpoint}'
const RESULTS_ENDPOINT = '${resultsEndpoint}'
const SUPABASE_URL     = 'https://${SUPABASE_PROJECT_ID}.supabase.co'

function httpRequest(method, url, headers, body) {
  return new Promise((resolve) => {
    const u   = new URL(url)
    const buf = body ? Buffer.from(JSON.stringify(body)) : null
    const req = https.request(
      { hostname: u.hostname, path: u.pathname + u.search, method,
        headers: { ...headers, ...(buf ? { 'Content-Length': buf.length } : {}) } },
      (res) => {
        let data = ''
        res.on('data', c => data += c)
        res.on('end', () => resolve({ ok: res.statusCode < 300, status: res.statusCode, body: data }))
      }
    )
    req.on('error', (e) => resolve({ ok: false, body: e.message }))
    if (buf) req.write(buf)
    req.end()
  })
}

const cache = {}

module.exports = defineConfig({
  e2e: {
    screenshotOnRunFailure: true,
    setupNodeEvents(on, config) {
      let folderToApiKey = {}
      try { folderToApiKey = JSON.parse(process.env.QA4_COMPANIES || '{}') } catch (e) {}

      on('after:spec', async (spec, results) => {
        const specParts = (spec.relative || '').split(/[\\\\/]/)
        const folder    = specParts.length >= 3 ? specParts[2] : specParts[0]
        const apiKey    = folderToApiKey[folder]
        if (!apiKey) return

        if (!cache[folder]) {
          const res = await httpRequest('GET', \`\${SYNC_ENDPOINT}?api_key=\${apiKey}\`, {}, null)
          if (!res.ok) return
          cache[folder] = JSON.parse(res.body).titleMap || {}
        }

        const titleMap = cache[folder]
        const payload  = []

        for (const test of (results.tests || [])) {
          const title      = test.title[test.title.length - 1]
          const scenarioId = titleMap[title]
          if (!scenarioId) continue
          const last = (test.attempts || []).slice(-1)[0] || {}
          payload.push({
            scenario_id: scenarioId,
            status: last.state === 'passed' ? 'passed' : 'failed',
            duration: last.duration || 0,
            error_message: last.error?.message || null,
            executed_by: 'cypress-ci',
          })
        }

        if (payload.length === 0) return
        await httpRequest('POST', \`\${RESULTS_ENDPOINT}?api_key=\${apiKey}\`,
          { 'Content-Type': 'application/json' }, { results: payload })
      })
      return config
    },
  },
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
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - name: Rodar testes Cypress
        env:
          QA4_COMPANIES: \${{ secrets.QA4_COMPANIES }}
          SUPABASE_ANON_KEY: \${{ secrets.SUPABASE_ANON_KEY }}
        run: npx cypress run`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">{t("integrations.title")}</h1>
        <p className="text-muted-foreground">{t("integrations.subtitle")}</p>
      </div>

      {/* ── Cypress / GitHub Actions ── */}
      <IntegrationCard
        id="cypress"
        icon={<Terminal className="h-5 w-5 text-emerald-400" />}
        title="Cypress + GitHub Actions"
        description={t("integrations.cypressDesc")}
        badge={t("settings.statusActive")}
        badgeColor="bg-emerald-500/20 text-emerald-400"
        defaultOpen={true}
      >
        {/* Secret QA4_COMPANIES */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-yellow-400" />
            <h4 className="font-semibold text-foreground text-sm">
              Secret do GitHub — <code className="text-xs font-mono bg-secondary/50 px-1 rounded">QA4_COMPANIES</code>
            </h4>
          </div>
          <p className="text-xs text-muted-foreground">
            Um único secret com todos os produtos. O reporter detecta o produto pelo caminho da pasta do arquivo de teste.
          </p>

          <div className="rounded-lg bg-secondary/30 border border-border overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-secondary/20">
              <span className="text-xs text-muted-foreground">Valor do secret</span>
              <Badge className="bg-primary/20 text-primary text-xs">QA4_COMPANIES</Badge>
            </div>
            <pre className="p-4 text-xs font-mono text-muted-foreground overflow-x-auto leading-relaxed">
              {companiesJson}
            </pre>
          </div>

          <Button
            className="w-full gap-2"
            onClick={() => copyToClipboard(companiesJson, "companies-json")}
          >
            {copiedKey === "companies-json" ? (
              <><Check className="h-4 w-4" />{t("settings.copiedSecret")}</>
            ) : (
              <><Copy className="h-4 w-4" />{t("settings.copySecret")}</>
            )}
          </Button>

          {products.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Mapeamento pasta → produto:</p>
              {products.map((product) => {
                const folder = product.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                const company = companies.find((c) => c.id === product.companyId);
                return (
                  <div key={product.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3 shrink-0" />
                    <code className="bg-secondary/50 px-1 rounded">cypress/e2e/{folder}/</code>
                    <span>→</span>
                    <span className="text-foreground font-medium">{product.name}</span>
                    {company && <span className="text-muted-foreground/60">({company.name})</span>}
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-xs text-muted-foreground border-t border-border pt-3">
            No GitHub: <span className="text-foreground">Settings → Secrets and variables → Actions → New repository secret</span> → nome: <code className="bg-secondary/50 px-1 rounded">QA4_COMPANIES</code>
          </p>
        </div>

        {/* How it works */}
        <div className="space-y-3 pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <h4 className="font-semibold text-foreground text-sm">Como funciona</h4>
          </div>
          <div className="grid gap-2 md:grid-cols-4">
            {[
              { n: "1", color: "text-primary", bg: "bg-primary/10", title: "Cria cenário no 4QA", desc: "Título igual ao it() do teste." },
              { n: "2", color: "text-accent", bg: "bg-accent/10", title: "CI roda sync", desc: "Gera o mapa título → ID." },
              { n: "3", color: "text-emerald-400", bg: "bg-emerald-400/10", title: "Cypress executa", desc: "Reporta resultados + screenshots." },
              { n: "4", color: "text-yellow-400", bg: "bg-yellow-400/10", title: "Dashboard atualiza", desc: "Sem IDs hardcoded." },
            ].map((s) => (
              <div key={s.n} className="rounded-lg bg-secondary/30 border border-border p-3 space-y-1.5">
                <div className={`h-6 w-6 rounded-full ${s.bg} flex items-center justify-center`}>
                  <span className={`text-xs font-bold ${s.color}`}>{s.n}</span>
                </div>
                <p className="text-xs font-medium text-foreground">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Endpoints */}
        <div className="space-y-3 pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-accent" />
            <h4 className="font-semibold text-foreground text-sm">Endpoints da API</h4>
          </div>
          <div className="space-y-2">
            {[
              { label: "GET — Sync cenários", key: "sync", url: `${syncEndpoint}?api_key=YOUR_API_KEY` },
              { label: "POST — Resultados", key: "results", url: `${resultsEndpoint}?api_key=YOUR_API_KEY` },
            ].map((ep) => (
              <div key={ep.key} className="p-3 rounded-lg bg-secondary/30 border border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-muted-foreground">{ep.label}</span>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(ep.url, ep.key)}>
                    {copiedKey === ep.key ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
                <code className="text-xs text-foreground break-all">{ep.url}</code>
              </div>
            ))}
          </div>
        </div>

        {/* Step by step */}
        <div className="space-y-3 pt-2 border-t border-border">
          <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            {t("settings.stepByStep")}
          </h4>

          {/* Step 1 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-accent">1</span>
              </div>
              <p className="text-sm font-medium text-foreground">
                CI sync — <code className="text-xs font-mono bg-secondary/50 px-1 rounded">.github/workflows/cypress.yml</code>
              </p>
            </div>
            <CodeBlock code={ciSyncSnippet} copyKey="ci" copiedKey={copiedKey} onCopy={copyToClipboard} />
          </div>

          {/* Step 2 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-yellow-400/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-yellow-400">2</span>
              </div>
              <p className="text-sm font-medium text-foreground">
                <FileJson className="h-3.5 w-3.5 inline mr-1" />
                <code className="text-xs font-mono bg-secondary/50 px-1 rounded">cypress.config.js</code>
              </p>
            </div>
            <CodeBlock code={configSnippet} copyKey="config" copiedKey={copiedKey} onCopy={copyToClipboard} />
          </div>

          {/* Step 3 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-emerald-400/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-emerald-400">3</span>
              </div>
              <p className="text-sm font-medium text-foreground">
                <FileJson className="h-3.5 w-3.5 inline mr-1" />
                <code className="text-xs font-mono bg-secondary/50 px-1 rounded">cypress/support/qa4-reporter.js</code>
              </p>
            </div>
            <CodeBlock code={reporterSnippet} copyKey="reporter" copiedKey={copiedKey} onCopy={copyToClipboard} />
          </div>

          {/* Step 4 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">4</span>
              </div>
              <p className="text-sm font-medium text-foreground">
                Workflow completo — <code className="text-xs font-mono bg-secondary/50 px-1 rounded">.github/workflows/cypress.yml</code>
              </p>
            </div>
            <CodeBlock code={fullWorkflowSnippet} copyKey="workflow" copiedKey={copiedKey} onCopy={copyToClipboard} />
          </div>
        </div>
      </IntegrationCard>

      {/* ── Playwright ── planned */}
      <IntegrationCard
        id="playwright"
        icon={<Terminal className="h-5 w-5 text-violet-400" />}
        title="Playwright"
        description={t("integrations.playwrightDesc")}
        badge={t("settings.statusPlanned")}
        badgeColor="text-muted-foreground border-muted"
      >
        <p className="text-sm text-muted-foreground">{t("integrations.comingSoon")}</p>
      </IntegrationCard>

      {/* ── Jira ── planned */}
      <IntegrationCard
        id="jira"
        icon={<Puzzle className="h-5 w-5 text-blue-400" />}
        title="Jira"
        description={t("integrations.jiraDesc")}
        badge={t("settings.statusPlanned")}
        badgeColor="text-muted-foreground border-muted"
      >
        <p className="text-sm text-muted-foreground">{t("integrations.comingSoon")}</p>
      </IntegrationCard>

      {/* ── Slack ── planned */}
      <IntegrationCard
        id="slack"
        icon={<Puzzle className="h-5 w-5 text-amber-400" />}
        title="Slack"
        description={t("integrations.slackDesc")}
        badge={t("settings.statusPlanned")}
        badgeColor="text-muted-foreground border-muted"
      >
        <p className="text-sm text-muted-foreground">{t("integrations.comingSoon")}</p>
      </IntegrationCard>
    </div>
  );
}
