import { useState } from "react";
import {
  Plus, X, Trash2, User, Bot,
  Settings, Code2, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Scenario, Company, Product, Sprint, TestSuite, TeamMember, Priority, ExecutionType,
} from "@/types/bdd";
import { cn } from "@/lib/utils";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

/* ─── Props ──────────────────────────────────────────────── */

interface ScenarioFormProps {
  companies:       Company[];
  products:        Product[];
  sprints:         Sprint[];
  suites:          TestSuite[];
  teamMembers:     TeamMember[];
  onSave:          (scenario: Omit<Scenario, "id" | "createdAt" | "updatedAt">) => void;
  onCancel:        () => void;
  initialData?:    Scenario;
  defaultSuiteId?:    string;
  defaultCompanyId?:  string;
}

/* ─── Config ─────────────────────────────────────────────── */

const PRIORITY_OPTIONS: { value: Priority; label: string; dot: string; text: string }[] = [
  { value: "critical", label: "Crítico",  dot: "bg-destructive", text: "text-destructive" },
  { value: "high",     label: "Alto",     dot: "bg-warning",     text: "text-warning" },
  { value: "medium",   label: "Médio",    dot: "bg-primary",     text: "text-primary" },
  { value: "low",      label: "Baixo",    dot: "bg-muted-foreground", text: "text-muted-foreground" },
];

/* ─── Step editor ────────────────────────────────────────── */

function StepEditor({
  steps, kind, colorClass, placeholder, onChange,
}: {
  steps: string[];
  kind: "given" | "when" | "then";
  colorClass: string;
  placeholder: string;
  onChange: (steps: string[]) => void;
}) {
  const add    = () => onChange([...steps, ""]);
  const remove = (i: number) => onChange(steps.filter((_, idx) => idx !== i));
  const update = (i: number, val: string) => {
    const next = [...steps]; next[i] = val; onChange(next);
  };

  const keywordLabel = kind === "given" ? "Given" : kind === "when" ? "When" : "Then";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className={cn("text-xs font-bold uppercase tracking-widest", colorClass)}>
          {keywordLabel}
        </span>
        <button
          type="button"
          onClick={add}
          className={cn(
            "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-colors",
            colorClass,
            "border-current/30 hover:bg-current/10"
          )}
        >
          <Plus className="h-3 w-3" />
          Adicionar
        </button>
      </div>
      <div className="space-y-1.5">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input
              value={step}
              onChange={e => update(i, e.target.value)}
              placeholder={placeholder}
              className={cn(
                "font-mono text-sm",
                kind === "given" && "bdd-given",
                kind === "when"  && "bdd-when",
                kind === "then"  && "bdd-then",
              )}
            />
            {steps.length > 1 && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Completion dot ─────────────────────────────────────── */

function TabDot({ filled }: { filled: boolean }) {
  return (
    <span className={cn(
      "ml-1.5 h-1.5 w-1.5 rounded-full inline-block transition-colors",
      filled ? "bg-primary" : "bg-muted-foreground/30"
    )} />
  );
}

/* ─── Main form ──────────────────────────────────────────── */

export function ScenarioForm({
  companies, products, sprints, suites, teamMembers,
  onSave, onCancel, initialData, defaultSuiteId, defaultCompanyId,
}: ScenarioFormProps) {

  /* ── State ── */
  const [tab,               setTab]           = useState<"general" | "bdd">("general");
  const [title,             setTitle]         = useState(initialData?.title ?? "");
  const [feature,           setFeature]       = useState(initialData?.feature ?? "");
  const [companyId,         setCompanyId]     = useState(
    initialData?.companyId ?? defaultCompanyId ?? companies[0]?.id ?? ""
  );
  const [productId,         setProductId]     = useState(initialData?.productId ?? "");
  const [sprintId,          setSprintId]      = useState(initialData?.sprintId  ?? "");
  const [suiteId,           setSuiteId]       = useState(
    initialData?.suiteId ?? defaultSuiteId ?? ""
  );
  const [priority,          setPriority]      = useState<Priority>(initialData?.priority ?? "medium");
  const [assigneeId,        setAssigneeId]    = useState(initialData?.assigneeId ?? "");
  const [estimatedDuration, setDuration]      = useState(initialData?.estimatedDuration ?? 5);
  const [executionType,     setExecutionType] = useState<ExecutionType>(
    initialData?.executionType ?? "automated"
  );
  const [given, setGiven] = useState<string[]>(initialData?.given ?? [""]);
  const [when,  setWhen]  = useState<string[]>(initialData?.when  ?? [""]);
  const [then,  setThen]  = useState<string[]>(initialData?.then  ?? [""]);
  const [tags,        setTags]      = useState<string[]>(initialData?.tags ?? []);
  const [tagInput,    setTagInput]  = useState("");

  /* ── Derived ── */
  const filteredProducts    = products.filter(p => p.companyId === companyId);
  const filteredSprints     = sprints.filter(s => s.companyId === companyId);
  const filteredSuites      = suites.filter(s => s.companyId === companyId);
  const filteredTeamMembers = teamMembers.filter(m => m.companyId === companyId);

  const getSuitePath = (suite: TestSuite): string => {
    const path: string[] = [suite.name];
    let cur = suite;
    while (cur.parentId) {
      const parent = suites.find(s => s.id === cur.parentId);
      if (!parent) break;
      path.unshift(parent.name);
      cur = parent;
    }
    return path.join(" / ");
  };

  /* ── Handlers ── */
  const handleCompanyChange = (id: string) => {
    setCompanyId(id); setProductId(""); setSprintId("");
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) { setTags([...tags, t]); setTagInput(""); }
  };

  const handleSubmit = () => {
    onSave({
      title, feature, companyId,
      productId:  productId  || undefined,
      sprintId:   sprintId   || undefined,
      suiteId:    suiteId    || undefined,
      assigneeId: assigneeId || undefined,
      priority, executionType, estimatedDuration,
      given: given.filter(g => g.trim()),
      when:  when.filter(w => w.trim()),
      then:  then.filter(t => t.trim()),
      tags,
      status: initialData?.status ?? "draft",
    });
  };

  /* ── Completion indicators ── */
  const generalFilled = !!(title && feature && companyId);
  const bddFilled     = given.some(g => g.trim()) && when.some(w => w.trim()) && then.some(t => t.trim());
  const canSave       = generalFilled && bddFilled;

  const activePriority = PRIORITY_OPTIONS.find(p => p.value === priority)!;

  return (
    <div className="flex flex-col gap-0">
      <Tabs value={tab} onValueChange={v => setTab(v as "general" | "bdd")}>

        {/* Tab list */}
        <TabsList className="w-full grid grid-cols-2 mb-6 h-10">
          <TabsTrigger value="general" className="gap-1.5 text-sm">
            <Settings className="h-3.5 w-3.5" />
            Geral
            <TabDot filled={generalFilled} />
          </TabsTrigger>
          <TabsTrigger value="bdd" className="gap-1.5 text-sm">
            <Code2 className="h-3.5 w-3.5" />
            Cenário BDD
            <TabDot filled={bddFilled} />
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Geral ──────────────────────────────── */}
        <TabsContent value="general" className="space-y-6 mt-0">

          {/* Identificação */}
          <section className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              Identificação
              <div className="h-px flex-1 bg-border/60" />
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-sm">
                  Título <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Login com credenciais válidas"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="feature" className="text-sm">
                  Feature <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="feature"
                  value={feature}
                  onChange={e => setFeature(e.target.value)}
                  placeholder="Ex: Autenticação de Usuário"
                  className="font-mono"
                />
              </div>
            </div>
          </section>

          {/* Contexto */}
          <section className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              Contexto
              <div className="h-px flex-1 bg-border/60" />
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Empresa <span className="text-destructive">*</span></Label>
                <Select value={companyId} onValueChange={handleCompanyChange}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Produto</Label>
                <Select
                  value={productId || "none"}
                  onValueChange={v => setProductId(v === "none" ? "" : v)}
                  disabled={!companyId || filteredProducts.length === 0}
                >
                  <SelectTrigger><SelectValue placeholder="Sem produto" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem produto</SelectItem>
                    {filteredProducts.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Test Suite</Label>
                <Select value={suiteId || "none"} onValueChange={v => setSuiteId(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Sem pasta" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem pasta</SelectItem>
                    {filteredSuites.map(s => (
                      <SelectItem key={s.id} value={s.id}>{getSuitePath(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Sprint</Label>
                <Select
                  value={sprintId || "none"}
                  onValueChange={v => setSprintId(v === "none" ? "" : v)}
                  disabled={!companyId}
                >
                  <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {filteredSprints.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Configurações */}
          <section className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              Configurações
              <div className="h-px flex-1 bg-border/60" />
            </h4>

            {/* Tipo de execução */}
            <div className="space-y-1.5">
              <Label className="text-sm">Tipo de Execução</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setExecutionType("automated")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all",
                    executionType === "automated"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30 hover:bg-secondary/30"
                  )}
                >
                  <Bot className="h-4 w-4" />
                  E2E / Automatizado
                </button>
                <button
                  type="button"
                  onClick={() => setExecutionType("manual")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all",
                    executionType === "manual"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                      : "border-border text-muted-foreground hover:border-emerald-500/30 hover:bg-secondary/30"
                  )}
                >
                  <User className="h-4 w-4" />
                  Manual
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {executionType === "automated"
                  ? "Executado via Cypress CI — resultados chegam automaticamente."
                  : "Executado manualmente pelo time de QA."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Prioridade */}
              <div className="space-y-1.5">
                <Label className="text-sm">Prioridade</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {PRIORITY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPriority(opt.value)}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all",
                        priority === opt.value
                          ? cn("border-current/40 bg-current/10", opt.text)
                          : "border-border text-muted-foreground hover:border-border/80 hover:bg-secondary/30"
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", opt.dot)} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Responsável + Duração */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Responsável</Label>
                  <Select
                    value={assigneeId || "none"}
                    onValueChange={v => setAssigneeId(v === "none" ? "" : v)}
                  >
                    <SelectTrigger className="h-9"><SelectValue placeholder="Não atribuído" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não atribuído</SelectItem>
                      {filteredTeamMembers.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="duration" className="text-sm">Duração estimada (min)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={estimatedDuration}
                    onChange={e => setDuration(Number(e.target.value))}
                    min={1}
                    className="h-9"
                  />
                </div>
              </div>
            </div>
          </section>
        </TabsContent>

        {/* ── Tab 2: BDD ────────────────────────────────── */}
        <TabsContent value="bdd" className="space-y-5 mt-0">

          <div className="rounded-xl border border-border/60 bg-secondary/10 p-4 space-y-4">
            <StepEditor
              steps={given}
              kind="given"
              colorClass="text-given"
              placeholder="o usuário está na página de login"
              onChange={setGiven}
            />
            <div className="border-t border-border/40" />
            <StepEditor
              steps={when}
              kind="when"
              colorClass="text-when"
              placeholder="ele preenche com credenciais válidas"
              onChange={setWhen}
            />
            <div className="border-t border-border/40" />
            <StepEditor
              steps={then}
              kind="then"
              colorClass="text-then"
              placeholder="ele deve ser redirecionado para o dashboard"
              onChange={setThen}
            />
          </div>

          {/* Tags */}
          <section className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              Tags
              <div className="h-px flex-1 bg-border/60" />
            </h4>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="Ex: smoke, regression, login"
                className="h-9"
              />
              <Button type="button" variant="secondary" size="sm" className="h-9" onClick={addTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs"
                  >
                    @{tag}
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter(t => t !== tag))}
                      className="hover:text-destructive transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* BDD hint */}
          {!bddFilled && (
            <div className="flex items-start gap-2 rounded-lg bg-warning/5 border border-warning/20 px-3 py-2.5 text-xs text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
              Preencha pelo menos um passo em cada seção (Given, When, Then).
            </div>
          )}
          {bddFilled && (
            <div className="flex items-center gap-2 rounded-lg bg-success/5 border border-success/20 px-3 py-2 text-xs text-success">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              Cenário BDD completo!
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Actions — sempre visíveis ──────────────────── */}
      <div className="flex items-center justify-between pt-5 mt-2 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {generalFilled && bddFilled ? (
            <><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Pronto para salvar</>
          ) : (
            <><AlertTriangle className="h-3.5 w-3.5 text-warning" />
              Preencha as abas: {!generalFilled && "Geral"}{!generalFilled && !bddFilled && " · "}{!bddFilled && "BDD"}</>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!canSave}>
            {initialData ? "Salvar Alterações" : "Criar Cenário"}
          </Button>
        </div>
      </div>
    </div>
  );
}
