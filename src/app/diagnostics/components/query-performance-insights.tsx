import { DiagnosticCard } from "./ui/diagnostic-card";
import { useDatabasePerformance } from "../hooks/use-database-performance";
import { Activity, Gauge, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function QueryPerformanceInsights() {
  const { data, loading } = useDatabasePerformance();

  if (loading || !data) {
    return (
      <DiagnosticCard
        title="Query & Performance Insights"
        icon={<Activity className="w-4 h-4 text-[#C2456A]" />}
        description="Database performance metrics and application response diagnostics."
      >
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </DiagnosticCard>
    );
  }

  const {
    averageQueryTimeMs,
    slowestQueryMs,
    slowestQueryName,
    fastestQueryMs,
    averageInsertTimeMs,
    averageUpdateTimeMs,
    averageReadTimeMs,
    transactionsPerMinute,
    tpmHistory,
    querySuccessRate,
    failedQueriesCount,
    responseTrend,
    recommendations,
  } = data;

  const sparklineMin = Math.min(...tpmHistory);
  const sparklineMax = Math.max(...tpmHistory);
  const sparklineRange = sparklineMax - sparklineMin || 1;

  return (
    <DiagnosticCard
      title="Query & Performance Insights"
      icon={<Activity className="w-4 h-4 text-[#C2456A]" />}
      description="Database performance metrics and application response diagnostics."
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col p-3 rounded-lg border bg-muted/20">
            <span className="text-xs text-muted-foreground font-medium mb-1">
              Avg Query Time
            </span>
            <span className="text-xl font-bold">{averageQueryTimeMs} ms</span>
          </div>
          <div className="flex flex-col p-3 rounded-lg border bg-muted/20">
            <span className="text-xs text-muted-foreground font-medium mb-1">
              Fastest Query
            </span>
            <span className="text-xl font-bold text-emerald-600">
              {fastestQueryMs} ms
            </span>
          </div>
          <div className="flex flex-col p-3 rounded-lg border bg-red-50/50 border-red-100 col-span-1 sm:col-span-2">
            <span className="text-xs text-red-600/80 font-medium mb-1">
              Slowest Query
            </span>
            <div className="flex flex-wrap justify-between items-end gap-1">
              <span className="text-xl font-bold text-red-700">
                {slowestQueryMs} ms
              </span>
              <span className="text-[10px] text-red-600/70 font-mono truncate max-w-[150px]" title={slowestQueryName}>
                {slowestQueryName}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Avg Read
            </p>
            <p className="text-sm font-semibold">{averageReadTimeMs} ms</p>
          </div>
          <div className="text-center space-y-1 border-x border-border">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Avg Insert
            </p>
            <p className="text-sm font-semibold">{averageInsertTimeMs} ms</p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Avg Update
            </p>
            <p className="text-sm font-semibold">{averageUpdateTimeMs} ms</p>
          </div>
        </div>

        <Separator className="bg-[#C2456A]/10" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div className="col-span-1 flex flex-col gap-1 p-3 rounded-lg border bg-card shadow-sm">
            <span className="text-xs font-medium text-muted-foreground">
              Transactions
            </span>
            <div className="flex flex-wrap items-end justify-between gap-2 mt-auto">
              <span className="text-lg font-bold">{transactionsPerMinute} <span className="text-xs font-normal text-muted-foreground">TPM</span></span>
              <div className="flex items-end h-6 gap-0.5">
                {tpmHistory.map((val, i) => {
                  const heightPct = Math.max(10, ((val - sparklineMin) / sparklineRange) * 100);
                  return (
                    <div
                      key={i}
                      className="w-1.5 bg-blue-400/80 rounded-t-sm"
                      style={{ height: `${heightPct}%` }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <div className="col-span-1 flex flex-col gap-1 p-3 rounded-lg border bg-emerald-50/50 shadow-sm border-emerald-100">
            <span className="text-xs font-medium text-emerald-700/80">
              Query Success
            </span>
            <span className="text-lg font-bold text-emerald-700">
              {querySuccessRate}%
            </span>
            <div className="h-1.5 w-full bg-emerald-200 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${querySuccessRate}%` }}
              />
            </div>
          </div>

          <div className="col-span-1 flex flex-col gap-1 p-3 rounded-lg border bg-card shadow-sm items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
            <span className="text-xs font-medium text-muted-foreground">
              Failed Queries
            </span>
            <span className="text-2xl font-bold text-red-600">
              {failedQueriesCount}
            </span>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Response Trend (Last 30m)
          </span>
          <div className="h-16 flex items-end gap-1 px-1">
            {responseTrend.map((point, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                <div
                  className="w-full max-w-[12px] bg-[#C2456A]/40 rounded-t hover:bg-[#C2456A] transition-colors"
                  style={{ height: `${(point.ms / 30) * 100}%`, minHeight: '4px' }}
                />
                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-popover text-popover-foreground text-[10px] py-0.5 px-1.5 rounded shadow whitespace-nowrap z-10 pointer-events-none transition-opacity">
                  {point.ms}ms at {point.timestamp}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-[#C2456A]/10">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Recommendations
          </span>
          <div className="grid grid-cols-1 gap-2">
            {recommendations.map((rec) => {
              let Icon = CheckCircle2;
              let iconColor = "text-emerald-500";
              let bg = "bg-emerald-50/50";
              
              if (rec.type === "Warning") {
                Icon = AlertTriangle;
                iconColor = "text-amber-500";
                bg = "bg-amber-50/50";
              } else if (rec.type === "Critical") {
                Icon = XCircle;
                iconColor = "text-red-500";
                bg = "bg-red-50/50";
              }

              return (
                <div key={rec.id} className={`flex items-start gap-2 p-2 rounded border ${bg}`}>
                  <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${iconColor}`} />
                  <span className="text-xs font-medium text-foreground">
                    {rec.message}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DiagnosticCard>
  );
}
