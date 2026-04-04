import { useState, useCallback } from "react";
import { CheckCircle2, XCircle, SkipForward, Play, ChevronRight, User, AlertTriangle, RotateCcw } from "lucide-react";
import { Scenario, TestRun, Sprint } from "@/types/bdd";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";

type StepType = "given" | "when" | "then";
type StepResult = "pending" | "passed" | "failed" | "blocked";

interface Step {
  type: StepType;
  index: number;
  text: string;
  result: StepResult;
  note: string;
}

interface ManualExecutionDialogProps {
  scenario: Scenario | null;
  sprints: Sprint[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (run: Omit<TestRun, "id">, scenarioStatus: "passed" | "failed") => void;
}

const stepTypeConfig: Record<StepType, { label: string; keyword: string; color: string; bg: string }> = {
  given: { label: "Dado que", keyword: "Given", color: "text-given", bg: "bdd-given" },
  when:  { label: "Quando",   keyword: "When",  color: "text-when",  bg: "bdd-when"  },
  then:  { label: "Então",    keyword: "Then",  color: "text-then",  bg: "bdd-then"  },
};

function buildSteps(scenario: Scenario): Step[] {
  const steps: Step[] = [];
  const add = (type: StepType, list: string[]) =>
    list.forEach((text, index) => steps.push({ type, index, text, result: "pending", note: "" }));
  add("given", scenario.given);
  add("when",  scenario.when);
  add("then",  scenario.then);
  return steps;
}

export function ManualExecutionDialog({
  scenario,
  sprints,
  open,
  onOpenChange,
  onSubmit,
}: ManualExecutionDialogProps) {
  const [phase, setPhase]           = useState<"setup" | "executing" | "done">("setup");
  const [executor, setExecutor]     = useState("");
  const [sprintId, setSprintId]     = useState<string>("__none__");
  const [steps, setSteps]           = useState<Step[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [startedAt, setStartedAt]   = useState<Date>(new Date());
  const [globalNote, setGlobalNote] = useState("");

  const availableSprints = scenario
    ? sprints.filter((s) => s.companyId === scenario.companyId && s.status === "active")
    : [];

  const reset = useCallback(() => {
    setPhase("setup");
    setExecutor("");
    setSprintId("__none__");
    setSteps([]);
    setCurrentIdx(0);
    setGlobalNote("");
  }, []);

  const handleClose = (val: boolean) => {
    if (!val) reset();
    onOpenChange(val);
  };

  const handleStart = () => {
    if (!scenario) return;
    setSteps(buildSteps(scenario));
    setCurrentIdx(0);
    setStartedAt(new Date());
    setPhase("executing");
  };

  const markStep = (result: StepResult) => {
    const updated = steps.map((s, i) => (i === currentIdx ? { ...s, result } : s));
    setSteps(updated);
    if (result === "failed" || result === "blocked") {
      setPhase("done");
      return;
    }
    if (currentIdx < steps.length - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      setPhase("done");
    }
  };

  const updateNote = (note: string) => {
    setSteps((prev) => prev.map((s, i) => (i === currentIdx ? { ...s, note } : s)));
  };

  const handleSubmit = () => {
    if (!scenario) return;
    const executed = steps.filter((s) => s.result !== "pending");
    const hasFail  = executed.some((s) => s.result === "failed" || s.result === "blocked");
    const finalStatus: "passed" | "failed" = hasFail ? "failed" : "passed";

    const failedStep  = steps.find((s) => s.result === "failed" || s.result === "blocked");
    const errorMsg    = failedStep
      ? `[${stepTypeConfig[failedStep.type].keyword}] ${failedStep.text}${failedStep.note ? ` — ${failedStep.note}` : ""}`
      : undefined;

    const notes = steps
      .filter((s) => s.note.trim())
      .map((s) => `[${s.type.toUpperCase()} ${s.index + 1}] ${s.note}`)
      .concat(globalNote.trim() ? [`[Geral] ${globalNote}`] : []);

    const now = new Date();
    const run: Omit<TestRun, "id"> = {
      scenarioId:   scenario.id,
      sprintId:     sprintId !== "__none__" ? sprintId : undefined,
      executedBy:   executor.trim() || "manual",
      startedAt,
      completedAt:  now,
      duration:     now.getTime() - startedAt.getTime(),
      status:       finalStatus,
      errorMessage: errorMsg,
      logs:         notes.length > 0 ? notes : undefined,
    };

    onSubmit(run, finalStatus);
    reset();
    onOpenChange(false);
  };

  if (!scenario) return null;

  const currentStep   = steps[currentIdx];
  const executedCount = steps.filter((s) => s.result !== "pending").length;
  const progress      = steps.length > 0 ? (executedCount / steps.length) * 100 : 0;
  const finalPassed   = steps.every((s) => s.result === "passed");
  const failedStep    = steps.find((s) => s.result === "failed" || s.result === "blocked");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-4 w-4 text-primary" />
            Execução Manual
          </DialogTitle>
        </DialogHeader>

        {/* Scenario title */}
        <div className="rounded-lg bg-secondary/40 border border-border px-4 py-3">
          <p className="text-xs text-muted-foreground font-mono mb-1">{scenario.feature}</p>
          <p className="font-semibold text-foreground">{scenario.title}</p>
        </div>

        {/* ── FASE: SETUP ── */}
        {phase === "setup" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                Quem está executando
              </Label>
              <Input
                placeholder="Seu nome ou email"
                value={executor}
                onChange={(e) => setExecutor(e.target.value)}
              />
            </div>

            {availableSprints.length > 0 && (
              <div className="space-y-2">
                <Label>Sprint ativa <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                <Select value={sprintId} onValueChange={setSprintId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a sprint" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sem sprint</SelectItem>
                    {availableSprints.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="rounded-lg border border-border divide-y divide-border">
              {steps.length === 0 && buildSteps(scenario).map((step, i) => {
                const cfg = stepTypeConfig[step.type];
                return (
                  <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                    <span className={cn("text-xs font-bold font-mono w-12 shrink-0 pt-0.5", cfg.color)}>
                      {i === 0 || (i > 0 && buildSteps(scenario)[i - 1].type !== step.type)
                        ? cfg.keyword
                        : "And"}
                    </span>
                    <span className="text-sm text-muted-foreground">{step.text}</span>
                  </div>
                );
              })}
            </div>

            <Button className="w-full" onClick={handleStart}>
              <Play className="h-4 w-4 mr-2" />
              Iniciar Execução
            </Button>
          </div>
        )}

        {/* ── FASE: EXECUTING ── */}
        {phase === "executing" && currentStep && (
          <div className="space-y-5">
            {/* Progress */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Passo {currentIdx + 1} de {steps.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Previous steps summary */}
            {currentIdx > 0 && (
              <div className="space-y-1">
                {steps.slice(0, currentIdx).map((s, i) => {
                  const cfg = stepTypeConfig[s.type];
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground/60">
                      {s.result === "passed"
                        ? <CheckCircle2 className="h-3 w-3 text-success shrink-0" />
                        : <XCircle className="h-3 w-3 text-destructive shrink-0" />}
                      <span className={cn("font-mono font-bold w-10 shrink-0", cfg.color)}>
                        {i === 0 || steps[i - 1].type !== s.type ? cfg.keyword : "And"}
                      </span>
                      <span className="truncate">{s.text}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Current step */}
            <div className={cn("rounded-xl border-2 border-primary p-5 space-y-4")}>
              <div className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-primary uppercase tracking-wide">
                  {stepTypeConfig[currentStep.type].label}
                </span>
              </div>
              <p className="text-lg font-medium text-foreground leading-snug">
                {currentStep.text}
              </p>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Nota (opcional)</Label>
                <Textarea
                  placeholder="Observações sobre este passo..."
                  className="h-20 resize-none text-sm"
                  value={currentStep.note}
                  onChange={(e) => updateNote(e.target.value)}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:border-destructive"
                onClick={() => markStep("failed")}
              >
                <XCircle className="h-4 w-4 mr-1.5" />
                Falhou
              </Button>
              <Button
                variant="outline"
                className="border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 hover:border-yellow-500"
                onClick={() => markStep("blocked")}
              >
                <AlertTriangle className="h-4 w-4 mr-1.5" />
                Bloqueado
              </Button>
              <Button
                className="bg-success hover:bg-success/90 text-success-foreground"
                onClick={() => markStep("passed")}
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                {currentIdx < steps.length - 1 ? "Passou →" : "Passou ✓"}
              </Button>
            </div>
          </div>
        )}

        {/* ── FASE: DONE ── */}
        {phase === "done" && (
          <div className="space-y-5">
            {/* Result banner */}
            <div className={cn(
              "rounded-xl p-5 flex items-center gap-4",
              finalPassed
                ? "bg-success/10 border border-success/30"
                : "bg-destructive/10 border border-destructive/30",
            )}>
              {finalPassed
                ? <CheckCircle2 className="h-10 w-10 text-success shrink-0" />
                : <XCircle className="h-10 w-10 text-destructive shrink-0" />}
              <div>
                <p className={cn("text-lg font-bold", finalPassed ? "text-success" : "text-destructive")}>
                  {finalPassed ? "Cenário aprovado!" : failedStep?.result === "blocked" ? "Cenário bloqueado" : "Cenário falhou"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {executedCount} de {steps.length} passo{steps.length !== 1 ? "s" : ""} executado{steps.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Steps summary */}
            <div className="rounded-lg border border-border divide-y divide-border">
              {steps.map((s, i) => {
                const cfg = stepTypeConfig[s.type];
                return (
                  <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                    {s.result === "passed"
                      ? <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                      : s.result === "failed"
                      ? <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      : s.result === "blocked"
                      ? <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                      : <SkipForward className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs font-bold font-mono shrink-0", cfg.color)}>
                          {i === 0 || steps[i - 1].type !== s.type ? cfg.keyword : "And"}
                        </span>
                        <span className={cn("text-sm", s.result === "pending" ? "text-muted-foreground/40" : "text-foreground")}>
                          {s.text}
                        </span>
                      </div>
                      {s.note && (
                        <p className="text-xs text-muted-foreground mt-0.5 ml-14 italic">→ {s.note}</p>
                      )}
                    </div>
                    {s.result !== "pending" && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs shrink-0",
                          s.result === "passed"  ? "border-success/40 text-success" :
                          s.result === "blocked" ? "border-yellow-500/40 text-yellow-500" :
                          "border-destructive/40 text-destructive",
                        )}
                      >
                        {s.result === "passed" ? "Passou" : s.result === "blocked" ? "Bloqueado" : "Falhou"}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Global note */}
            <div className="space-y-1.5">
              <Label className="text-sm">Observação geral <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Textarea
                placeholder="Notas gerais sobre a execução..."
                className="h-20 resize-none"
                value={globalNote}
                onChange={(e) => setGlobalNote(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { reset(); if (scenario) { setSteps(buildSteps(scenario)); setCurrentIdx(0); setStartedAt(new Date()); setPhase("executing"); } }}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Refazer
              </Button>
              <Button
                className={cn("flex-2 flex-1", finalPassed ? "bg-success hover:bg-success/90 text-success-foreground" : "")}
                variant={finalPassed ? "default" : "destructive"}
                onClick={handleSubmit}
              >
                Salvar resultado
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
