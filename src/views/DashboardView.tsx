import { Building2, FlaskConical, CheckCircle2, XCircle, Clock, TrendingUp } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ScenarioCard } from "@/components/scenarios/ScenarioCard";
import { Company, Sprint, Scenario } from "@/types/bdd";

interface DashboardViewProps {
  companies: Company[];
  sprints: Sprint[];
  scenarios: Scenario[];
}

export function DashboardView({ companies, sprints, scenarios }: DashboardViewProps) {
  const totalScenarios = scenarios.length;
  const passedScenarios = scenarios.filter((s) => s.status === "passed").length;
  const failedScenarios = scenarios.filter((s) => s.status === "failed").length;
  const activeSprints = sprints.filter((s) => s.status === "active").length;
  const totalDuration = scenarios.reduce((acc, s) => acc + s.estimatedDuration, 0);
  const passRate = totalScenarios > 0 ? Math.round((passedScenarios / totalScenarios) * 100) : 0;

  const recentScenarios = [...scenarios]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral dos seus cenários de teste BDD</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Cenários"
          value={totalScenarios}
          icon={FlaskConical}
          variant="primary"
          trend={{ value: 12, positive: true }}
        />
        <StatsCard
          title="Taxa de Sucesso"
          value={`${passRate}%`}
          description={`${passedScenarios} de ${totalScenarios} passaram`}
          icon={CheckCircle2}
          variant="success"
        />
        <StatsCard
          title="Falhas"
          value={failedScenarios}
          description="Cenários que falharam"
          icon={XCircle}
          variant={failedScenarios > 0 ? "warning" : "default"}
        />
        <StatsCard
          title="Tempo Total"
          value={`${totalDuration} min`}
          description={`${activeSprints} sprints ativas`}
          icon={Clock}
        />
      </div>

      {/* Companies Overview */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Empresas</h2>
              <p className="text-sm text-muted-foreground">{companies.length} empresas cadastradas</p>
            </div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => {
            const companyScenarios = scenarios.filter((s) => s.companyId === company.id);
            const passed = companyScenarios.filter((s) => s.status === "passed").length;
            const total = companyScenarios.length;
            const rate = total > 0 ? Math.round((passed / total) * 100) : 0;

            return (
              <div key={company.id} className="p-4 rounded-lg bg-secondary/50 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-foreground">{company.name}</h3>
                  <span className="text-xs text-success font-medium">{rate}%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-success transition-all" style={{ width: `${rate}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{total} cenários</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Scenarios */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Cenários Recentes</h2>
          <span className="text-sm text-muted-foreground">Últimos atualizados</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {recentScenarios.map((scenario, index) => (
            <div key={scenario.id} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
              <ScenarioCard scenario={scenario} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
