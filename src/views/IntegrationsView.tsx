import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Copy, Check, Terminal, Key, Building2,
  Code2, GitBranch, FileJson, Zap, ArrowRight, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Company, Product } from "@/types/bdd";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface IntegrationsViewProps {
  companies: Company[];
  products: Product[];
}

const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

/* ─── Helpers ──────────────────────────────────────────────── */

function CodeBlock({
  code, copyKey, copiedKey, onCopy,
}: {
  code: string; copyKey: string; copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
}) {
  return (
    <div className="relative group">
      <Button
        variant="ghost" size="sm"
        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onCopy(code, copyKey)}
      >
        {copiedKey === copyKey
          ? <Check className="h-3 w-3 text-primary" />
          : <Copy className="h-3 w-3" />}
      </Button>
      <pre className="p-4 rounded-lg bg-black/40 border border-border/60 text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre leading-relaxed">
        {code}
      </pre>
    </div>
  );
}

/* ─── Integration definitions ──────────────────────────────── */

type IntegrationStatus = "active" | "coming_soon";
type IntegrationCategory = "ci_cd" | "project" | "notification" | "testing";

interface Integration {
  id: string;
  name: string;
  category: IntegrationCategory;
  description: string;
  status: IntegrationStatus;
  iconBg: string;
  iconColor: string;
  iconEmoji: string;
  docsUrl?: string;
}

const INTEGRATIONS: Integration[] = [
  {
    id: "cypress",
    name: "Cypress",
    category: "ci_cd",
    description: "Sync cenários e reporte resultados automaticamente via GitHub Actions.",
    status: "active",
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-400",
    iconEmoji: "🌲",
    docsUrl: "https://docs.cypress.io",
  },
  {
    id: "playwright",
    name: "Playwright",
    category: "testing",
    description: "Integração nativa com Playwright + CI para reporte de resultados.",
    status: "coming_soon",
    iconBg: "bg-violet-500/15",
    iconColor: "text-violet-400",
    iconEmoji: "🎭",
    docsUrl: "https://playwright.dev",
  },
  {
    id: "github",
    name: "GitHub",
    category: "ci_cd",
    description: "Vincule PRs a cenários BDD e visualize status direto no 4QA.",
    status: "coming_soon",
    iconBg: "bg-slate-500/15",
    iconColor: "text-slate-300",
    iconEmoji: "🐙",
  },
  {
    id: "jira",
    name: "Jira",
    category: "project",
    description: "Crie tickets automaticamente quando um cenário falhar em produção.",
    status: "coming_soon",
    iconBg: "bg-blue-500/15",
    iconColor: "text-blue-400",
    iconEmoji: "📋",
  },
  {
    id: "slack",
    name: "Slack",
    category: "notification",
    description: "Notificações em tempo real de falhas e execuções no canal do time.",
    status: "coming_soon",
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-400",
    iconEmoji: "💬",
  },
  {
    id: "notion",
    name: "Notion",
    category: "project",
    description: "Exporte cenários e resultados para páginas Notion automaticamente.",
    status: "coming_soon",
    iconBg: "bg-zinc-500/15",
    iconColor: "text-zinc-300",
    iconEmoji: "📝",
  },
];

const CATEGORY_LABELS: Record<IntegrationCategory, string> = {
  ci_cd: "CI/CD",
  project: "Gestão",
  notification: "Notificações",
  testing: "Testes",
};

/* ─── Integration Card ─────────────────────────────────────── */

function IntegrationCard({
  integration,
  onConfigure,
}: {
  integration: Integration;
  onConfigure: (id: string) => void;
}) {
  const isActive = integration.status === "active";

  return (
    <div
      className={cn(
        "glass-card rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200",
        isActive
          ? "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 cursor-pointer"
          : "opacity-60"
      )}
      onClick={isActive ? () => onConfigure(integration.id) : undefined}
    >
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center text-2xl", integration.iconBg)}>
          {integration.iconEmoji}
        </div>
        <Badge
          variant={isActive ? "default" : "outline"}
          className={cn(
            "text-xs font-medium",
            isActive
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
              : "text-muted-foreground border-border"
          )}
        >
          {isActive ? "Ativo" : "Em breve"}
        </Badge>
      </div>

      {/* Info */}
      <div className="space-y-1 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">{integration.name}</h3>
          <span className="text-xs text-muted-foreground/60 bg-secondary/40 px-1.5 py-0.5 rounded">
            {CATEGORY_LABELS[integration.category]}
          </span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {integration.description}
        </p>
      </div>

      {/* Action */}
      <div>
        {isActive ? (
          <Button size="sm" variant="outline" className="w-full gap-1.5 group/btn">
            Configurar
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
          </Button>
        ) : (
          <Button size="sm" variant="ghost" disabled className="w-full text-muted-foreground">
            Em desenvolvimento
          </Button>
        )}
      </div>
    </div>
  );
}

/* ─── Cypress Sheet content ────────────────────────────────── */

function CypressSheetContent({
  companies, products, copiedKey, onCopy,
}: {
  companies: Company[];
  products: Product[];
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
}) {
  const syncEndpoint    = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/cypress-sync`;
  const resultsEndpoint = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/cypress-results`;

  const companiesJson = products.length > 0
    ? JSON.stringify(
        Object.fromEntries(
          products.map(p => [
            p.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            p.apiKey,
          ])
        ), null, 2
      )
    : `{\n  "saucedemo": "API_KEY_PRODUTO_A",\n  "carhub": "API_KEY_PRODUTO_B"\n}`;

  const ciSyncSnippet = `- name: Sync cenários do 4QA
  env:
    QA4_COMPANIES: \${{ secrets.QA4_COMPANIES }}
  run: node scripts/qa4-sync.js`;

  const configSnippet = `// cypress.config.js  (trecho — after:spec)
on('after:spec', async (spec, results) => {
  const folder = spec.relative.split('/')[2]
  const apiKey = folderToApiKey[folder]
  if (!apiKey) return

  // Sincroniza titleMap via GET /cypress-sync
  // Envia resultados via POST /cypress-results
  // Screenshots são enviados automaticamente
})`;

  const workflowSnippet = `# .github/workflows/cypress.yml
- name: Rodar testes Cypress
  env:
    QA4_COMPANIES: \${{ secrets.QA4_COMPANIES }}
    SUPABASE_ANON_KEY: \${{ secrets.SUPABASE_ANON_KEY }}
  run: npx cypress run`;

  return (
    <div className="space-y-8 overflow-y-auto h-full pb-8">

      {/* How it works */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h4 className="font-semibold text-foreground">Como funciona</h4>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { n: "1", color: "text-primary",      bg: "bg-primary/10",      title: "Crie o cenário no 4QA",    desc: "Título = it() do seu teste" },
            { n: "2", color: "text-blue-400",      bg: "bg-blue-400/10",     title: "CI sincroniza",            desc: "Gera mapa título → ID" },
            { n: "3", color: "text-emerald-400",   bg: "bg-emerald-400/10",  title: "Cypress roda",             desc: "Reporta resultados + prints" },
            { n: "4", color: "text-yellow-400",    bg: "bg-yellow-400/10",   title: "Dashboard atualiza",       desc: "Sem IDs hardcoded" },
          ].map(s => (
            <div key={s.n} className="rounded-xl bg-secondary/30 border border-border/60 p-3 space-y-2">
              <div className={cn("h-6 w-6 rounded-full flex items-center justify-center", s.bg)}>
                <span className={cn("text-xs font-bold", s.color)}>{s.n}</span>
              </div>
              <p className="text-xs font-semibold text-foreground">{s.title}</p>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Regra de ouro: </span>
          O título do <code className="bg-secondary/50 px-1 rounded">it()</code> no Cypress deve ser
          idêntico ao <strong className="text-foreground">título do cenário</strong> no 4QA.
        </div>
      </section>

      {/* API Keys */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-yellow-400" />
          <h4 className="font-semibold text-foreground">
            Secret <code className="text-xs font-mono bg-secondary/50 px-1.5 rounded ml-1">QA4_COMPANIES</code>
          </h4>
        </div>

        <div className="rounded-xl bg-secondary/20 border border-border overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-secondary/30">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Valor do secret</span>
              <Badge className="bg-primary/20 text-primary text-xs border-0">QA4_COMPANIES</Badge>
            </div>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs"
              onClick={() => onCopy(companiesJson, "companies-json")}>
              {copiedKey === "companies-json"
                ? <><Check className="h-3 w-3 text-primary" /> Copiado!</>
                : <><Copy className="h-3 w-3" /> Copiar</>}
            </Button>
          </div>
          <pre className="p-4 text-xs font-mono text-muted-foreground overflow-x-auto leading-relaxed">
            {companiesJson}
          </pre>
        </div>

        {products.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground font-medium">Pasta → Produto:</p>
            {products.map(product => {
              const folder  = product.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
              const company = companies.find(c => c.id === product.companyId);
              return (
                <div key={product.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3 shrink-0" />
                  <code className="bg-secondary/50 px-1 rounded">cypress/e2e/{folder}/</code>
                  <span>→</span>
                  <span className="text-foreground font-medium">{product.name}</span>
                  {company && <span className="opacity-50">({company.name})</span>}
                </div>
              );
            })}
          </div>
        )}

        <p className="text-xs text-muted-foreground rounded-lg bg-secondary/20 border border-border p-3">
          No GitHub: <span className="text-foreground font-medium">Settings → Secrets → Actions → New secret</span>
          {" "}→ nome: <code className="bg-secondary/50 px-1 rounded">QA4_COMPANIES</code>
        </p>
      </section>

      {/* Endpoints */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-accent" />
          <h4 className="font-semibold text-foreground">Endpoints</h4>
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20 text-xs">Ativos</Badge>
        </div>
        <div className="space-y-2">
          {[
            { label: "GET — Sync cenários", key: "sync",    url: `${syncEndpoint}?api_key=YOUR_KEY` },
            { label: "POST — Resultados",   key: "results", url: `${resultsEndpoint}?api_key=YOUR_KEY` },
          ].map(ep => (
            <div key={ep.key} className="rounded-lg bg-secondary/20 border border-border p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-muted-foreground">{ep.label}</span>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0"
                  onClick={() => onCopy(ep.url.replace('?api_key=YOUR_KEY', ''), ep.key)}>
                  {copiedKey === ep.key
                    ? <Check className="h-3 w-3 text-primary" />
                    : <Copy className="h-3 w-3" />}
                </Button>
              </div>
              <code className="text-xs text-foreground/80 break-all">{ep.url}</code>
            </div>
          ))}
        </div>
      </section>

      {/* Setup steps */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-foreground" />
          <h4 className="font-semibold text-foreground">Configuração passo a passo</h4>
        </div>

        {/* Step 1 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-blue-400/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-blue-400">1</span>
            </div>
            <p className="text-sm font-medium text-foreground">
              Step no CI <code className="text-xs font-mono bg-secondary/50 px-1 rounded ml-1">.github/workflows/cypress.yml</code>
            </p>
          </div>
          <CodeBlock code={ciSyncSnippet} copyKey="ci" copiedKey={copiedKey} onCopy={onCopy} />
        </div>

        {/* Step 2 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-yellow-400/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-yellow-400">2</span>
            </div>
            <p className="text-sm font-medium text-foreground">
              <FileJson className="h-3.5 w-3.5 inline mr-1" />
              <code className="text-xs font-mono bg-secondary/50 px-1 rounded">cypress.config.js</code>
            </p>
          </div>
          <CodeBlock code={configSnippet} copyKey="config" copiedKey={copiedKey} onCopy={onCopy} />
        </div>

        {/* Step 3 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-emerald-400/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-emerald-400">3</span>
            </div>
            <p className="text-sm font-medium text-foreground">
              Workflow completo
            </p>
          </div>
          <CodeBlock code={workflowSnippet} copyKey="workflow" copiedKey={copiedKey} onCopy={onCopy} />
        </div>
      </section>

      {/* Docs link */}
      <a
        href="https://docs.cypress.io"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Documentação oficial do Cypress
      </a>
    </div>
  );
}

/* ─── Main View ────────────────────────────────────────────── */

export function IntegrationsView({ companies, products }: IntegrationsViewProps) {
  const { t } = useTranslation();
  const [openSheet, setOpenSheet] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    toast.success(t("settings.copied"));
  };

  const active   = INTEGRATIONS.filter(i => i.status === "active");
  const upcoming = INTEGRATIONS.filter(i => i.status === "coming_soon");

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">{t("integrations.title")}</h1>
          <p className="text-muted-foreground">{t("integrations.subtitle")}</p>
        </div>

        {/* Active integrations */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Disponíveis
            </h2>
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">{active.length}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((integration, i) => (
              <div key={integration.id} className="animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                <IntegrationCard
                  integration={integration}
                  onConfigure={setOpenSheet}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Upcoming integrations */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Em breve
            </h2>
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">{upcoming.length}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((integration, i) => (
              <div key={integration.id} className="animate-slide-up" style={{ animationDelay: `${(active.length + i) * 60}ms` }}>
                <IntegrationCard
                  integration={integration}
                  onConfigure={setOpenSheet}
                />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── Cypress Sheet ── */}
      <Sheet open={openSheet === "cypress"} onOpenChange={(o) => !o && setOpenSheet(null)}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl flex flex-col gap-0 p-0 overflow-hidden"
        >
          {/* Sheet header */}
          <div className="flex items-center gap-4 p-6 border-b border-border shrink-0">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/15 flex items-center justify-center text-2xl shrink-0">
              🌲
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg">Cypress + GitHub Actions</SheetTitle>
              <SheetDescription className="text-xs">
                Sincronização automática de cenários BDD via CI/CD
              </SheetDescription>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20 shrink-0">
              Ativo
            </Badge>
          </div>

          {/* Sheet body */}
          <div className="flex-1 overflow-y-auto p-6">
            <CypressSheetContent
              companies={companies}
              products={products}
              copiedKey={copiedKey}
              onCopy={copyToClipboard}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
