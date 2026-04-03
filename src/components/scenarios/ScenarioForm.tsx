import { useState } from "react";
import { Plus, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scenario, Company, Product, Sprint, TestSuite, TeamMember, Priority } from "@/types/bdd";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ScenarioFormProps {
  companies: Company[];
  products: Product[];
  sprints: Sprint[];
  suites: TestSuite[];
  teamMembers: TeamMember[];
  onSave: (scenario: Omit<Scenario, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
  initialData?: Scenario;
  defaultSuiteId?: string;
  defaultCompanyId?: string;
}

const priorityOptions: { value: Priority; label: string; color: string }[] = [
  { value: "critical", label: "Crítico", color: "text-destructive" },
  { value: "high", label: "Alto", color: "text-warning" },
  { value: "medium", label: "Médio", color: "text-primary" },
  { value: "low", label: "Baixo", color: "text-muted-foreground" },
];

export function ScenarioForm({ 
  companies, 
  products,
  sprints, 
  suites,
  teamMembers,
  onSave, 
  onCancel, 
  initialData,
  defaultSuiteId,
  defaultCompanyId,
}: ScenarioFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [feature, setFeature] = useState(initialData?.feature || "");
  const [companyId, setCompanyId] = useState(
    initialData?.companyId || defaultCompanyId || companies[0]?.id || ""
  );
  const [productId, setProductId] = useState(initialData?.productId || "");
  const [sprintId, setSprintId] = useState(initialData?.sprintId || "");
  const [suiteId, setSuiteId] = useState(initialData?.suiteId || defaultSuiteId || "");
  const [priority, setPriority] = useState<Priority>(initialData?.priority || "medium");
  const [assigneeId, setAssigneeId] = useState(initialData?.assigneeId || "");
  const [given, setGiven] = useState<string[]>(initialData?.given || [""]);
  const [when, setWhen] = useState<string[]>(initialData?.when || [""]);
  const [then, setThen] = useState<string[]>(initialData?.then || [""]);
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState(initialData?.estimatedDuration || 5);

  const addStep = (type: "given" | "when" | "then") => {
    if (type === "given") setGiven([...given, ""]);
    if (type === "when") setWhen([...when, ""]);
    if (type === "then") setThen([...then, ""]);
  };

  const updateStep = (type: "given" | "when" | "then", index: number, value: string) => {
    if (type === "given") {
      const newGiven = [...given];
      newGiven[index] = value;
      setGiven(newGiven);
    }
    if (type === "when") {
      const newWhen = [...when];
      newWhen[index] = value;
      setWhen(newWhen);
    }
    if (type === "then") {
      const newThen = [...then];
      newThen[index] = value;
      setThen(newThen);
    }
  };

  const removeStep = (type: "given" | "when" | "then", index: number) => {
    if (type === "given" && given.length > 1) setGiven(given.filter((_, i) => i !== index));
    if (type === "when" && when.length > 1) setWhen(when.filter((_, i) => i !== index));
    if (type === "then" && then.length > 1) setThen(then.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleCompanyChange = (id: string) => {
    setCompanyId(id);
    setProductId("");
    setSprintId("");
  };

  const handleSubmit = () => {
    onSave({
      title,
      feature,
      companyId,
      productId: productId || undefined,
      sprintId: sprintId || undefined,
      suiteId: suiteId || undefined,
      priority,
      assigneeId: assigneeId || undefined,
      given: given.filter((g) => g.trim()),
      when: when.filter((w) => w.trim()),
      then: then.filter((t) => t.trim()),
      tags,
      estimatedDuration,
      status: initialData?.status || "draft",
    });
  };

  const filteredProducts = products.filter((p) => p.companyId === companyId);
  const filteredSprints = sprints.filter((s) => s.companyId === companyId);
  const filteredSuites = suites.filter((s) => s.companyId === companyId);
  const filteredTeamMembers = teamMembers.filter((m) => m.companyId === companyId);

  const getSuitePath = (suite: TestSuite): string => {
    const path: string[] = [suite.name];
    let current = suite;
    while (current.parentId) {
      const parent = suites.find((s) => s.id === current.parentId);
      if (parent) {
        path.unshift(parent.name);
        current = parent;
      } else break;
    }
    return path.join(" / ");
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Título do Cenário</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Login com credenciais válidas"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="feature">Feature</Label>
          <Input
            id="feature"
            value={feature}
            onChange={(e) => setFeature(e.target.value)}
            placeholder="Ex: Autenticação de Usuário"
            className="font-mono"
          />
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label>Empresa</Label>
          <Select value={companyId} onValueChange={handleCompanyChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a empresa" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Produto</Label>
          <Select
            value={productId || "none"}
            onValueChange={(v) => setProductId(v === "none" ? "" : v)}
            disabled={!companyId || filteredProducts.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sem produto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem produto</SelectItem>
              {filteredProducts.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Test Suite</Label>
          <Select value={suiteId || "none"} onValueChange={(v) => setSuiteId(v === "none" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Sem pasta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem pasta</SelectItem>
              {filteredSuites.map((suite) => (
                <SelectItem key={suite.id} value={suite.id}>
                  {getSuitePath(suite)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Sprint</Label>
          <Select value={sprintId || "none"} onValueChange={(v) => setSprintId(v === "none" ? "" : v)} disabled={!companyId}>
            <SelectTrigger>
              <SelectValue placeholder="Nenhuma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma</SelectItem>
              {filteredSprints.map((sprint) => (
                <SelectItem key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Priority and Assignee */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label>Prioridade</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className={opt.color}>{opt.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Responsável</Label>
          <Select value={assigneeId || "none"} onValueChange={(v) => setAssigneeId(v === "none" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Não atribuído" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Não atribuído</SelectItem>
              {filteredTeamMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 col-span-2 lg:col-span-2">
          <Label htmlFor="duration">Duração Estimada (min)</Label>
          <Input
            id="duration"
            type="number"
            value={estimatedDuration}
            onChange={(e) => setEstimatedDuration(Number(e.target.value))}
            min={1}
          />
        </div>
      </div>

      {/* BDD Steps */}
      <div className="space-y-4">
        {/* Given */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-given font-semibold">Given (Dado que)</Label>
            <Button type="button" variant="ghost" size="sm" onClick={() => addStep("given")}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>
          {given.map((step, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={step}
                onChange={(e) => updateStep("given", index, e.target.value)}
                placeholder="o usuário está na página de login"
                className="bdd-given font-mono text-sm"
              />
              {given.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => removeStep("given", index)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* When */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-when font-semibold">When (Quando)</Label>
            <Button type="button" variant="ghost" size="sm" onClick={() => addStep("when")}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>
          {when.map((step, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={step}
                onChange={(e) => updateStep("when", index, e.target.value)}
                placeholder="ele preenche o formulário com dados válidos"
                className="bdd-when font-mono text-sm"
              />
              {when.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => removeStep("when", index)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Then */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-then font-semibold">Then (Então)</Label>
            <Button type="button" variant="ghost" size="sm" onClick={() => addStep("then")}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>
          {then.map((step, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={step}
                onChange={(e) => updateStep("then", index, e.target.value)}
                placeholder="ele deve ser redirecionado para o dashboard"
                className="bdd-then font-mono text-sm"
              />
              {then.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => removeStep("then", index)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            placeholder="Ex: smoke, regression"
          />
          <Button type="button" variant="secondary" onClick={addTag}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm"
              >
                @{tag}
                <button onClick={() => removeTag(tag)} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit}>
          {initialData ? "Salvar Alterações" : "Criar Cenário"}
        </Button>
      </div>
    </div>
  );
}
