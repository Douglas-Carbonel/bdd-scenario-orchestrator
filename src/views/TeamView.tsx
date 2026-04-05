import { useState, useMemo } from "react";
import {
  Users, User, Plus, Pencil, Trash2, FlaskConical,
  CheckCircle2, XCircle, Briefcase, Mail, Package,
} from "lucide-react";
import { Company, Product, Scenario, TeamMember, Team, MemberRole, Defect } from "@/types/bdd";
import { TeamMemberDialog } from "@/components/team/TeamMemberDialog";
import { TeamDialog } from "@/components/team/TeamDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface TeamViewProps {
  companies: Company[];
  products: Product[];
  scenarios: Scenario[];
  defects: Defect[];
  teamMembers: TeamMember[];
  teams: Team[];
  onAddTeamMember: (m: Omit<TeamMember, "id">) => void;
  onUpdateTeamMember: (id: string, updates: Partial<TeamMember>) => void;
  onDeleteTeamMember: (id: string) => void;
  onAddTeam: (t: Omit<Team, "id" | "createdAt">) => void;
  onUpdateTeam: (id: string, updates: Partial<Team>) => void;
  onDeleteTeam: (id: string) => void;
  getCompanyTeamMembers: (companyId: string) => TeamMember[];
  getCompanyTeams: (companyId: string) => Team[];
}

type ActiveTab = "members" | "teams";

const roleConfig: Record<MemberRole, { label: string; color: string; bg: string }> = {
  qa:      { label: "QA",       color: "text-primary",       bg: "bg-primary/10 border-primary/30" },
  dev:     { label: "Dev",      color: "text-emerald-400",   bg: "bg-emerald-500/10 border-emerald-500/30" },
  po:      { label: "PO",       color: "text-warning",       bg: "bg-warning/10 border-warning/30" },
  lead:    { label: "Lead",     color: "text-purple-400",    bg: "bg-purple-500/10 border-purple-500/30" },
  analyst: { label: "Analista", color: "text-muted-foreground", bg: "bg-secondary/50 border-border" },
};

interface DeleteConfirm { type: "member" | "team"; id: string; name: string }

export function TeamView({
  companies, products, scenarios, defects, teamMembers, teams,
  onAddTeamMember, onUpdateTeamMember, onDeleteTeamMember,
  onAddTeam, onUpdateTeam, onDeleteTeam,
  getCompanyTeamMembers, getCompanyTeams,
}: TeamViewProps) {
  const [selectedCompanyId, setSelectedCompanyId] = useState(companies[0]?.id ?? "");
  const [activeTab,         setActiveTab]         = useState<ActiveTab>("members");
  const [memberDialog,      setMemberDialog]      = useState<{ open: boolean; member?: TeamMember }>({ open: false });
  const [teamDialog,        setTeamDialog]        = useState<{ open: boolean; team?: Team }>({ open: false });
  const [deleteConfirm,     setDeleteConfirm]     = useState<DeleteConfirm | null>(null);

  const companyMembers  = getCompanyTeamMembers(selectedCompanyId);
  const companyTeams    = getCompanyTeams(selectedCompanyId);
  const companyProducts = products.filter(p => p.companyId === selectedCompanyId);

  const memberStats = useMemo(() => {
    const map = new Map<string, { assigned: number; passed: number; failed: number }>();
    companyMembers.forEach(m => {
      const assigned = scenarios.filter(s => s.assigneeId === m.id && s.companyId === selectedCompanyId);
      map.set(m.id, {
        assigned: assigned.length,
        passed:   assigned.filter(s => s.status === "passed").length,
        failed:   assigned.filter(s => s.status === "failed").length,
      });
    });
    return map;
  }, [companyMembers, scenarios, selectedCompanyId]);

  const handleDeleteConfirm = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === "member") onDeleteTeamMember(deleteConfirm.id);
    else onDeleteTeam(deleteConfirm.id);
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Time & Equipes
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Colaboradores, funções e agrupamentos por equipe
          </p>
        </div>
        <div className="flex items-center gap-3">
          {companies.length > 1 && (
            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent>
                {companies.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            onClick={() =>
              activeTab === "members"
                ? setMemberDialog({ open: true })
                : setTeamDialog({ open: true })
            }
            className="gap-2"
            disabled={!selectedCompanyId}
          >
            <Plus className="h-4 w-4" />
            {activeTab === "members" ? "Novo Colaborador" : "Nova Equipe"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-secondary/30 rounded-lg w-fit border border-border">
        {([
          { id: "members", label: "Colaboradores", icon: User,  count: companyMembers.length },
          { id: "teams",   label: "Equipes",        icon: Users, count: companyTeams.length },
        ] as const).map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full font-mono",
                activeTab === tab.id ? "bg-primary-foreground/20 text-primary-foreground" : "bg-secondary text-muted-foreground"
              )}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Colaboradores ────────────────────────────────────────────────────── */}
      {activeTab === "members" && (
        <>
          {companyMembers.length === 0 ? (
            <div className="glass-card rounded-xl flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <User className="h-12 w-12 opacity-20" />
              <p className="font-medium">Nenhum colaborador cadastrado</p>
              <p className="text-xs opacity-60">Clique em "Novo Colaborador" para começar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {companyMembers.map(member => {
                const stats  = memberStats.get(member.id) ?? { assigned: 0, passed: 0, failed: 0 };
                const rate   = stats.assigned > 0 ? Math.round((stats.passed / stats.assigned) * 100) : null;
                const roleCfg = roleConfig[member.role ?? "qa"];
                const memberTeam = companyTeams.find(t => t.memberIds.includes(member.id));

                return (
                  <div key={member.id} className="glass-card rounded-xl p-5 space-y-4 group">
                    {/* Avatar + Name */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <span className="text-lg font-bold text-primary">
                            {member.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{member.name}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{member.email}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setMemberDialog({ open: true, member })}
                          className="p-1.5 rounded-md hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ type: "member", id: member.id, name: member.name })}
                          className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Role + Team */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={cn("text-xs gap-1", roleCfg.bg, roleCfg.color)}>
                        <Briefcase className="h-3 w-3" />
                        {roleCfg.label}
                      </Badge>
                      {memberTeam && (
                        <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                          <Users className="h-3 w-3 mr-1" />
                          {memberTeam.name}
                        </Badge>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border">
                      <div className="text-center">
                        <p className="text-lg font-bold text-foreground">{stats.assigned}</p>
                        <p className="text-xs text-muted-foreground">Cenários</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                          <p className="text-lg font-bold text-success">{stats.passed}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">Passou</p>
                      </div>
                      <div className="text-center">
                        <p className={cn("text-lg font-bold", rate === null ? "text-muted-foreground" : rate >= 80 ? "text-success" : rate >= 50 ? "text-yellow-400" : "text-destructive")}>
                          {rate !== null ? `${rate}%` : "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">Taxa</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Equipes ──────────────────────────────────────────────────────────── */}
      {activeTab === "teams" && (
        <>
          {companyTeams.length === 0 ? (
            <div className="glass-card rounded-xl flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Users className="h-12 w-12 opacity-20" />
              <p className="font-medium">Nenhuma equipe criada</p>
              <p className="text-xs opacity-60">Agrupe colaboradores em equipes por produto ou área</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {companyTeams.map(team => {
                const product = products.find(p => p.id === team.productId);
                const members = companyMembers.filter(m => team.memberIds.includes(m.id));
                const teamScenarios = scenarios.filter(s =>
                  s.companyId === selectedCompanyId &&
                  (product ? s.productId === product.id : true) &&
                  members.some(m => s.assigneeId === m.id)
                );
                const passed = teamScenarios.filter(s => s.status === "passed").length;

                return (
                  <div key={team.id} className="glass-card rounded-xl p-5 space-y-4 group">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-foreground truncate">{team.name}</h3>
                        {team.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{team.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => setTeamDialog({ open: true, team })}
                          className="p-1.5 rounded-md hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ type: "team", id: team.id, name: team.name })}
                          className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Product badge */}
                    {product && (
                      <Badge variant="outline" className="text-xs border-primary/30 text-primary/70 gap-1">
                        <Package className="h-3 w-3" />
                        {product.name}
                      </Badge>
                    )}

                    {/* Members */}
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground font-medium">
                        {members.length} colaborador{members.length !== 1 ? "es" : ""}
                      </p>
                      {members.length === 0 ? (
                        <p className="text-xs text-muted-foreground/50 italic">Nenhum membro adicionado</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {members.map(m => {
                            const rc = roleConfig[m.role ?? "qa"];
                            return (
                              <div key={m.id} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary/50 border border-border text-xs">
                                <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-[10px] font-bold text-primary">{m.name.charAt(0)}</span>
                                </div>
                                <span className="text-foreground/80">{m.name.split(" ")[0]}</span>
                                <span className={cn("text-[10px]", rc.color)}>{rc.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <FlaskConical className="h-3.5 w-3.5" />
                        <span>{teamScenarios.length} cenários</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                        <span className="text-success font-medium">{passed} passou</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Dialogs */}
      <TeamMemberDialog
        open={memberDialog.open}
        onOpenChange={open => setMemberDialog(s => ({ ...s, open }))}
        companyId={selectedCompanyId}
        member={memberDialog.member}
        onAdd={onAddTeamMember}
        onUpdate={onUpdateTeamMember}
      />

      <TeamDialog
        open={teamDialog.open}
        onOpenChange={open => setTeamDialog(s => ({ ...s, open }))}
        companyId={selectedCompanyId}
        team={teamDialog.team}
        members={companyMembers}
        products={companyProducts}
        onAdd={onAddTeam}
        onUpdate={onUpdateTeam}
      />

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              {deleteConfirm?.type === "member"
                ? `Remover o colaborador "${deleteConfirm.name}"? Esta ação é permanente.`
                : `Excluir a equipe "${deleteConfirm?.name}"? Os colaboradores não serão removidos.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              <Trash2 className="h-4 w-4 mr-1" />Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
