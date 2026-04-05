import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Building2, FlaskConical, CheckCircle2, XCircle, Clock, TrendingUp, BarChart3 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
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
  companies, sprints, scenarios, teamMembers, getDailyStats, getTeamMember,
}: DashboardViewProps) {
  const { t, i18n } = useTranslation();

  const totalScenarios   = scenarios.length;
  const passedScenarios  = scenarios.filter(s => s.status === "passed").length;
  const failedScenarios  = scenarios.filter(s => s.status === "failed").length;
  const activeSprints    = sprints.filter(s => s.status === "active").length;
  const totalDuration    = scenarios.reduce((acc, s) => acc + s.estimatedDuration, 0);
  const passRate         = totalScenarios > 0 ? Math.round((passedScenarios / totalScenarios) * 100) : 0;
  const criticalScenarios = scenarios.filter(s => s.priority === "critical").length;

  const recentScenarios = [...scenarios]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 4);

  const chartData = useMemo(() => {
    const allStats: DailyStats[] = [];
    companies.forEach(company => {
      const stats = getDailyStats(company.id, 7);
      stats.forEach((stat, i) => {
        if (!allStats[i]) allStats[i] = { ...stat };
        else { allStats[i].passed += stat.passed; allStats[i].failed += stat.failed; allStats[i].total += stat.total; }
      });
    });
    return allStats.map(stat => ({
      ...stat,
      date: new Date(stat.date).toLocaleDateString(i18n.language, { weekday: "short", day: "numeric" }),
    }));
  }, [companies, getDailyStats, i18n.language]);

  const priorityData = useMemo(() => [
    { name: t("priority.critical"), value: scenarios.filter(s => s.priority === "critical").length, fill: "hsl(var(--destructive))" },
    { name: t("priority.high"),     value: scenarios.filter(s => s.priority === "high").length,     fill: "hsl(var(--warning))" },
    { name: t("priority.medium"),   value: scenarios.filter(s => s.priority === "medium").length,   fill: "hsl(var(--primary))" },
    { name: t("priority.low"),      value: scenarios.filter(s => s.priority === "low").length,      fill: "hsl(var(--muted-foreground))" },
  ], [scenarios, t]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">{t("dashboard.title")}</h1>
        <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title={t("dashboard.totalScenarios")}
          value={totalScenarios}
          icon={FlaskConical}
          variant="primary"
          description={t("dashboard.criticalCount", { count: criticalScenarios })}
        />
        <StatsCard
          title={t("dashboard.successRate")}
          value={`${passRate}%`}
          description={t("dashboard.successRateDesc", { passed: passedScenarios, total: totalScenarios })}
          icon={CheckCircle2}
          variant="success"
        />
        <StatsCard
          title={t("dashboard.failures")}
          value={failedScenarios}
          description={t("dashboard.failuresDesc")}
          icon={XCircle}
          variant={failedScenarios > 0 ? "warning" : "default"}
        />
        <StatsCard
          title={t("dashboard.totalTime")}
          value={`${totalDuration} min`}
          description={t("dashboard.activeSprints", { count: activeSprints })}
          icon={Clock}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{t("dashboard.execTrend")}</h2>
              <p className="text-sm text-muted-foreground">{t("dashboard.last7days")}</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPassed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="hsl(var(--success))"     stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--success))"     stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                <Area type="monotone" dataKey="passed" name={t("dashboard.chartPassed")} stroke="hsl(var(--success))"     fillOpacity={1} fill="url(#colorPassed)" />
                <Area type="monotone" dataKey="failed" name={t("dashboard.chartFailed")} stroke="hsl(var(--destructive))" fillOpacity={1} fill="url(#colorFailed)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{t("dashboard.priorityDist")}</h2>
              <p className="text-sm text-muted-foreground">{t("dashboard.allScenarios")}</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={60} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                <Bar dataKey="value" name={t("dashboard.chartScenarios")} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{t("dashboard.companiesTitle")}</h2>
              <p className="text-sm text-muted-foreground">{t("dashboard.companiesDesc", { count: companies.length })}</p>
            </div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companies.map(company => {
            const companyScenarios = scenarios.filter(s => s.companyId === company.id);
            const passed = companyScenarios.filter(s => s.status === "passed").length;
            const total  = companyScenarios.length;
            const rate   = total > 0 ? Math.round((passed / total) * 100) : 0;
            return (
              <div key={company.id} className="p-4 rounded-lg bg-secondary/50 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-foreground">{company.name}</h3>
                  <span className="text-xs text-success font-medium">{rate}%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-success transition-all" style={{ width: `${rate}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{t("dashboard.scenariosCount", { count: total })}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">{t("dashboard.recentScenarios")}</h2>
          <span className="text-sm text-muted-foreground">{t("dashboard.lastUpdated")}</span>
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
