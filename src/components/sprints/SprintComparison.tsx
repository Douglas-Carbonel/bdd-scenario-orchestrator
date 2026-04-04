import { useState } from "react";
import { TrendingUp, TrendingDown, Minus, BarChart3, FlaskConical, CheckCircle2, XCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Company, Sprint } from "@/types/bdd";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SprintStat {
  sprint: Sprint;
  totalRuns: number;
  passedRuns: number;
  failedRuns: number;
  passRate: number | null;
  delta: number | null;
  dataSource: "runs" | "scenarios";
}

interface SprintComparisonProps {
  companies: Company[];
  getSprintComparison: (companyId: string) => SprintStat[];
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="text-muted-foreground text-xs">—</span>;
  if (delta > 0) return (
    <span className="flex items-center gap-0.5 text-success text-xs font-medium">
      <TrendingUp className="h-3 w-3" />+{delta}%
    </span>
  );
  if (delta < 0) return (
    <span className="flex items-center gap-0.5 text-destructive text-xs font-medium">
      <TrendingDown className="h-3 w-3" />{delta}%
    </span>
  );
  return <span className="flex items-center gap-0.5 text-muted-foreground text-xs"><Minus className="h-3 w-3" />0%</span>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="glass-card rounded-lg p-3 text-xs space-y-1 border border-border shadow-lg">
      <p className="font-semibold text-foreground">{label}</p>
      <p className="text-success">{d.passed} passaram</p>
      <p className="text-destructive">{d.failed} falharam</p>
      <p className="text-muted-foreground">{d.total} execuções</p>
    </div>
  );
};

export function SprintComparison({ companies, getSprintComparison }: SprintComparisonProps) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(companies[0]?.id ?? "");

  const data = getSprintComparison(selectedCompanyId);
  const hasData = data.some((d) => d.passRate !== null);

  const chartData = data.map((d) => ({
    name: d.sprint.name,
    passRate: d.passRate ?? 0,
    passed: d.passedRuns,
    failed: d.failedRuns,
    total: d.totalRuns,
    hasData: d.passRate !== null,
  }));

  const avgPassRate =
    hasData
      ? Math.round(
          data.filter((d) => d.passRate !== null).reduce((s, d) => s + (d.passRate ?? 0), 0) /
            data.filter((d) => d.passRate !== null).length,
        )
      : null;

  if (companies.length === 0) return null;

  return (
    <div className="glass-card rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Comparativo entre Sprints</h2>
        </div>
        {companies.length > 1 && (
          <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
            <SelectTrigger className="w-48 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {!hasData ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Nenhum dado de execução disponível. Rode o CI com uma sprint ativa para ver os comparativos.
        </div>
      ) : (
        <>
          {/* Chart */}
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                {avgPassRate !== null && (
                  <ReferenceLine
                    y={avgPassRate}
                    stroke="hsl(var(--primary))"
                    strokeDasharray="4 4"
                    label={{ value: `Média ${avgPassRate}%`, fill: "hsl(var(--primary))", fontSize: 10, position: "insideTopRight" }}
                  />
                )}
                <Bar
                  dataKey="passRate"
                  radius={[4, 4, 0, 0]}
                  fill="hsl(var(--primary))"
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="text-left py-2 pr-4 font-medium">Sprint</th>
                  <th className="text-left py-2 pr-4 font-medium">Período</th>
                  <th className="text-center py-2 pr-4 font-medium">
                    <div className="flex items-center justify-center gap-1">
                      <FlaskConical className="h-3 w-3" />Execuções
                    </div>
                  </th>
                  <th className="text-center py-2 pr-4 font-medium">
                    <div className="flex items-center justify-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-success" />Pass
                    </div>
                  </th>
                  <th className="text-center py-2 pr-4 font-medium">
                    <div className="flex items-center justify-center gap-1">
                      <XCircle className="h-3 w-3 text-destructive" />Fail
                    </div>
                  </th>
                  <th className="text-center py-2 pr-4 font-medium">Taxa</th>
                  <th className="text-center py-2 font-medium">Delta</th>
                </tr>
              </thead>
              <tbody>
                {data.map((d) => (
                  <tr key={d.sprint.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        {d.sprint.status === "active" && (
                          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shrink-0" />
                        )}
                        <span className="font-medium text-foreground">{d.sprint.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground text-xs">
                      {format(d.sprint.startDate, "dd MMM", { locale: ptBR })} – {format(d.sprint.endDate, "dd MMM yy", { locale: ptBR })}
                    </td>
                    <td className="py-2.5 pr-4 text-center text-muted-foreground">{d.totalRuns}</td>
                    <td className="py-2.5 pr-4 text-center text-success">{d.passedRuns}</td>
                    <td className="py-2.5 pr-4 text-center text-destructive">{d.failedRuns}</td>
                    <td className="py-2.5 pr-4 text-center">
                      {d.passRate !== null ? (
                        <span className={cn(
                          "font-semibold",
                          d.passRate >= 80 ? "text-success" : d.passRate >= 50 ? "text-yellow-400" : "text-destructive",
                        )}>
                          {d.passRate}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-2.5 text-center">
                      <DeltaBadge delta={d.delta} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.some((d) => d.dataSource === "scenarios") && (
            <p className="text-xs text-muted-foreground/60 italic">
              * Sprints sem execuções de CI usam o status atual dos cenários como aproximação.
            </p>
          )}
        </>
      )}
    </div>
  );
}
