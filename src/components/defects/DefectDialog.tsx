import { useState } from "react";
import { Bug, AlertTriangle, CheckCircle2, RotateCcw, Wrench } from "lucide-react";
import { Defect, DefectSeverity, DefectStatus, Sprint } from "@/types/bdd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface DefectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenarioId: string;
  scenarioTitle?: string;
  testRunId?: string;
  prefilledTitle?: string;
  prefilledSprintId?: string;
  defect?: Defect;
  sprints?: Sprint[];
  onAdd: (defect: Omit<Defect, "id" | "createdAt" | "updatedAt">) => void;
  onUpdate: (id: string, updates: Partial<Defect>) => void;
}

const severityConfig: Record<DefectSeverity, { label: string; className: string }> = {
  critical: { label: "Crítico",  className: "border-destructive/40 text-destructive bg-destructive/10" },
  high:     { label: "Alto",     className: "border-orange-500/40 text-orange-400 bg-orange-500/10" },
  medium:   { label: "Médio",    className: "border-primary/40 text-primary bg-primary/10" },
  low:      { label: "Baixo",    className: "border-border text-muted-foreground bg-secondary/40" },
};

const statusConfig: Record<DefectStatus, { label: string; className: string; icon: typeof Bug }> = {
  open:     { label: "Aberto",     className: "border-destructive/40 text-destructive bg-destructive/10",  icon: Bug },
  reopened: { label: "Reaberto",   className: "border-orange-500/40 text-orange-400 bg-orange-500/10",     icon: RotateCcw },
  fixed:    { label: "Corrigido",  className: "border-primary/40 text-primary bg-primary/10",              icon: Wrench },
  verified: { label: "Verificado", className: "border-success/40 text-success bg-success/10",              icon: CheckCircle2 },
};

export function DefectDialog({
  open,
  onOpenChange,
  scenarioId,
  scenarioTitle,
  testRunId,
  prefilledTitle = "",
  prefilledSprintId,
  defect,
  sprints = [],
  onAdd,
  onUpdate,
}: DefectDialogProps) {
  const isUpdate = !!defect;

  const [title,       setTitle]       = useState(defect?.title ?? prefilledTitle);
  const [severity,    setSeverity]    = useState<DefectSeverity>(defect?.severity ?? "medium");
  const [reportedBy,  setReportedBy]  = useState(defect?.reportedBy ?? "");
  const [description, setDescription] = useState(defect?.description ?? "");
  const [sprintId,    setSprintId]    = useState<string | undefined>(defect?.sprintId ?? prefilledSprintId);
  const [fixNote,     setFixNote]     = useState(defect?.fixNote ?? "");
  const [showFixNote, setShowFixNote] = useState(false);

  const handleCreate = () => {
    if (!title.trim() || !reportedBy.trim()) return;
    onAdd({
      scenarioId,
      sprintId: sprintId || undefined,
      testRunId,
      title: title.trim(),
      description: description.trim() || undefined,
      severity,
      status: "open",
      reportedBy: reportedBy.trim(),
    });
    onOpenChange(false);
  };

  const handleTransition = (newStatus: DefectStatus, note?: string) => {
    if (!defect) return;
    onUpdate(defect.id, {
      status: newStatus,
      ...(note !== undefined ? { fixNote: note } : {}),
    });
    onOpenChange(false);
  };

  const SprintSelect = ({ value, onChange }: { value?: string; onChange: (v?: string) => void }) => (
    sprints.length > 0 ? (
      <div className="space-y-2">
        <Label>Sprint</Label>
        <Select
          value={value ?? "none"}
          onValueChange={(v) => onChange(v === "none" ? undefined : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sem sprint" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem sprint</SelectItem>
            {sprints.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    ) : null
  );

  if (!isUpdate) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-destructive" />
              Registrar Defeito
            </DialogTitle>
            {scenarioTitle && (
              <DialogDescription className="font-mono text-xs">{scenarioTitle}</DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defect-title">Título do Defeito</Label>
              <Input
                id="defect-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Botão de login não responde após 3 tentativas"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Severidade</Label>
                <Select value={severity} onValueChange={(v) => setSeverity(v as DefectSeverity)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(severityConfig) as DefectSeverity[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        <span className={severityConfig[s].className.split(" ")[1]}>
                          {severityConfig[s].label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="defect-reporter">Reportado por</Label>
                <Input
                  id="defect-reporter"
                  value={reportedBy}
                  onChange={(e) => setReportedBy(e.target.value)}
                  placeholder="Seu nome"
                />
              </div>
            </div>

            <SprintSelect value={sprintId} onChange={setSprintId} />

            <div className="space-y-2">
              <Label htmlFor="defect-desc">Descrição / Passos para reproduzir</Label>
              <Textarea
                id="defect-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o comportamento incorreto e como reproduzi-lo..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button
                onClick={handleCreate}
                disabled={!title.trim() || !reportedBy.trim()}
                className="bg-destructive hover:bg-destructive/90"
              >
                <Bug className="h-4 w-4 mr-2" />
                Registrar Defeito
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const st = statusConfig[defect.status];
  const sv = severityConfig[defect.severity];
  const StatusIcon = st.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-destructive" />
            Defeito
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 flex-1 min-w-0">
              <p className="font-medium text-foreground">{defect.title}</p>
              <p className="text-xs text-muted-foreground">
                Reportado por <span className="font-medium">{defect.reportedBy}</span> em{" "}
                {defect.createdAt.toLocaleDateString("pt-BR")}
              </p>
              {defect.sprintId && sprints.length > 0 && (
                <p className="text-xs text-primary/70">
                  Sprint: {sprints.find(s => s.id === defect.sprintId)?.name ?? defect.sprintId}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className={cn("text-xs", sv.className)}>
                {sv.label}
              </Badge>
              <Badge variant="outline" className={cn("text-xs", st.className)}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {st.label}
              </Badge>
            </div>
          </div>

          {defect.description && (
            <div className="px-3 py-2 rounded-md bg-secondary/40 border border-border text-sm text-muted-foreground">
              {defect.description}
            </div>
          )}

          {defect.fixNote && (
            <div className="px-3 py-2 rounded-md bg-primary/5 border border-primary/20 text-sm text-primary/80">
              <p className="text-xs font-medium text-primary mb-1">Nota de correção:</p>
              {defect.fixNote}
            </div>
          )}

          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Atualizar status</p>

            {(defect.status === "open" || defect.status === "reopened") && (
              <>
                {!showFixNote ? (
                  <Button
                    variant="outline"
                    className="w-full border-primary/40 text-primary hover:bg-primary/10"
                    onClick={() => setShowFixNote(true)}
                  >
                    <Wrench className="h-4 w-4 mr-2" />
                    Marcar como Corrigido
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="fix-note">Nota de correção (opcional)</Label>
                    <Textarea
                      id="fix-note"
                      value={fixNote}
                      onChange={(e) => setFixNote(e.target.value)}
                      placeholder="Descreva o que foi corrigido, PR, commit..."
                      rows={2}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setShowFixNote(false)}>
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                        onClick={() => handleTransition("fixed", fixNote.trim() || undefined)}
                      >
                        <Wrench className="h-3.5 w-3.5 mr-1.5" />
                        Confirmar Correção
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {defect.status === "fixed" && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-success/40 text-success hover:bg-success/10"
                  onClick={() => handleTransition("verified")}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Verificar (Passou)
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-orange-500/40 text-orange-400 hover:bg-orange-500/10"
                  onClick={() => handleTransition("reopened")}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reabrir
                </Button>
              </div>
            )}

            {defect.status === "verified" && (
              <Button
                variant="outline"
                className="w-full border-orange-500/40 text-orange-400 hover:bg-orange-500/10"
                onClick={() => handleTransition("reopened")}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reabrir Defeito
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
