import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Users } from "lucide-react";
import { Team, TeamMember, Product } from "@/types/bdd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface TeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  team?: Team;
  members: TeamMember[];
  products: Product[];
  onAdd: (team: Omit<Team, "id" | "createdAt">) => void;
  onUpdate: (id: string, updates: Partial<Team>) => void;
}

export function TeamDialog({
  open, onOpenChange, companyId, team, members, products, onAdd, onUpdate,
}: TeamDialogProps) {
  const { t } = useTranslation();
  const isEdit = !!team;
  const [name,        setName]        = useState(team?.name        ?? "");
  const [description, setDescription] = useState(team?.description ?? "");
  const [productId,   setProductId]   = useState<string | undefined>(team?.productId);
  const [memberIds,   setMemberIds]   = useState<string[]>(team?.memberIds ?? []);

  const toggleMember = (id: string) =>
    setMemberIds(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    if (isEdit) onUpdate(team.id, { name: name.trim(), description: description.trim() || undefined, productId, memberIds });
    else onAdd({ name: name.trim(), description: description.trim() || undefined, companyId, productId, memberIds });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {isEdit ? t("team.editTeam") : t("team.newTeam")}
          </DialogTitle>
          <DialogDescription>{t("team.teamGroupDesc")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team-name">{t("team.teamName")}</Label>
            <Input
              id="team-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t("team.teamNamePlaceholder")}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="team-desc">{t("team.teamDesc")}</Label>
            <Textarea
              id="team-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t("team.teamDescPlaceholder")}
              rows={2}
            />
          </div>
          {products.length > 0 && (
            <div className="space-y-2">
              <Label>{t("team.teamProduct")}</Label>
              <Select value={productId ?? "none"} onValueChange={v => setProductId(v === "none" ? undefined : v)}>
                <SelectTrigger><SelectValue placeholder={t("team.noProduct")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("team.noProduct")}</SelectItem>
                  {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {members.length > 0 && (
            <div className="space-y-2">
              <Label>{t("team.teamMembers", { count: memberIds.length })}</Label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto border border-border rounded-lg p-3">
                {members.map(m => (
                  <label key={m.id} className="flex items-center gap-3 cursor-pointer p-1.5 rounded-md hover:bg-secondary/40 transition-colors">
                    <Checkbox checked={memberIds.includes(m.id)} onCheckedChange={() => toggleMember(m.id)} />
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-primary">{m.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{m.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleSubmit} disabled={!name.trim()}>
              {isEdit ? t("team.saveChanges") : t("team.createTeam")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
