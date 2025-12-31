import { useMemo } from "react";
import { Building2, FlaskConical, CheckCircle2, XCircle, Clock, TrendingUp, BarChart3 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ScenarioCard } from "@/components/scenarios/ScenarioCard";
import { Company, Sprint, Scenario, TeamMember, DailyStats } from "@/types/bdd";

interface DashboardViewProps {
  companies: Company[];
  sprints: Sprint[];
  scenarios: Scenario[];
  teamMembers: TeamMember[];
  getDailyStats: (companyId: string, days?: number) => DailyStats[];
  getTeamMember: (id: string) => TeamMember | undefined;
}

export function DashboardView({ 
  companies, 
  sprints, 
  scenarios, 
  teamMembers,
  getDailyStats,
  getTeamMember,
}: DashboardViewProps) {
  const totalScenarios = scenarios.length;
  const passedScenarios = scenarios.filter((s) => s.status === "passed").length;
  const failedScenarios = scenarios.filter((s) => s.status === "failed").length;
  const activeSprints = sprints.filter((s) => s.status === "active").length;
  const totalDuration = scenarios.reduce((acc, s) => acc + s.estimatedDuration, 0);
  const passRate = totalScenarios > 0 ? Math.round((passedScenarios / totalScenarios) * 100) : 0;

  const criticalScenarios = scenarios.filter((s) => s.priority === "critical").length;

  const recentScenarios = [...scenarios]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 4);

  // Aggregate stats for all companies
  const chartData = useMemo(() => {
    const allStats: DailyStats[] = [];
    companies.forEach((company) => {
      const stats = getDailyStats(company.id, 7);
      stats.forEach((stat, i) => {
        if (!allStats[i]) {
          allStats[i] = { ...stat };
        } else {
          allStats[i].passed += stat.passed;
          allStats[i].failed += stat.failed;
          allStats[i].total += stat.total;
        }
      });
    });
    return allStats.map((stat) => ({
      ...stat,
      date: new Date(stat.date).toLocaleDateString("pt-BR", { weekday: "short", day: "numeric" }),
    }));
  }, [companies, getDailyStats]);

  // Priority distribution
  const priorityData = useMemo(() => [
    { name: "Crítico", value: scenarios.filter((s) => s.priority === "critical").length, fill: "hsl(var(--destructive))" },
    { name: "Alto", value: scenarios.filter((s) => s.priority === "high").length, fill: "hsl(var(--warning))" },
    { name: "Médio", value: scenarios.filter((s) => s.priority === "medium").length, fill: "hsl(var(--primary))" },
    { name: "Baixo", value: scenarios.filter((s) => s.priority === "low").length, fill: "hsl(var(--muted-foreground))" },
  ], [scenarios]);

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
          description={`${criticalScenarios} críticos`}
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

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Execution Trend */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Tendência de Execuções</h2>
              <p className="text-sm text-muted-foreground">Últimos 7 dias</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPassed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="passed"
                  name="Passou"
                  stroke="hsl(var(--success))"
                  fillOpacity={1}
                  fill="url(#colorPassed)"
                />
                <Area
                  type="monotone"
                  dataKey="failed"
                  name="Falhou"
                  stroke="hsl(var(--destructive))"
                  fillOpacity={1}
                  fill="url(#colorFailed)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Distribuição por Prioridade</h2>
              <p className="text-sm text-muted-foreground">Todos os cenários</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={60} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" name="Cenários" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
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
              <ScenarioCard 
                scenario={scenario} 
                assigneeName={scenario.assigneeId ? getTeamMember(scenario.assigneeId)?.name : undefined}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
