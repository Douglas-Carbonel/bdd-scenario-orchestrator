import { useState } from "react";
import { useTranslation } from "react-i18next";
import { User, Mail, Briefcase } from "lucide-react";
import { TeamMember, MemberRole } from "@/types/bdd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface TeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  member?: TeamMember;
  onAdd: (member: Omit<TeamMember, "id">) => void;
  onUpdate: (id: string, updates: Partial<TeamMember>) => void;
}

const roles: MemberRole[] = ["qa", "dev", "po", "lead", "analyst"];

export function TeamMemberDialog({
  open, onOpenChange, companyId, member, onAdd, onUpdate,
}: TeamMemberDialogProps) {
  const { t } = useTranslation();
  const isEdit = !!member;
  const [name,  setName]  = useState(member?.name  ?? "");
  const [email, setEmail] = useState(member?.email ?? "");
  const [role,  setRole]  = useState<MemberRole>(member?.role ?? "qa");

  const handleSubmit = () => {
    if (!name.trim() || !email.trim()) return;
    if (isEdit) onUpdate(member.id, { name: name.trim(), email: email.trim(), role });
    else onAdd({ name: name.trim(), email: email.trim(), role, companyId });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {isEdit ? t("team.editMember") : t("team.newMember")}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t("team.editMemberDesc") : t("team.addMemberDesc")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="member-name">{t("team.memberName")}</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="member-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t("team.memberNamePlaceholder")}
                className="pl-9"
                autoFocus
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="member-email">{t("team.memberEmail")}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="member-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t("team.memberEmailPlaceholder")}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("team.memberRole")}</Label>
            <Select value={role} onValueChange={v => setRole(v as MemberRole)}>
              <SelectTrigger>
                <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map(r => (
                  <SelectItem key={r} value={r}>{t(`memberRole.${r}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleSubmit} disabled={!name.trim() || !email.trim()}>
              {isEdit ? t("team.saveChanges") : t("team.addMember")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
