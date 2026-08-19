import { DiagnosticCard } from "./ui/diagnostic-card";
import { DatabaseHealthMetrics } from "../types";
import { Database } from "lucide-react";
import { StatusBadge } from "./ui/status-badge";
import { ProgressMetric, StatusMetric, TimelineItem } from "./ui/metric-items";
import { Separator } from "@/components/ui/separator";

interface DatabaseHealthMonitorProps {
  data: DatabaseHealthMetrics | null;
  loading: boolean;
}

export function DatabaseHealthMonitor({ data, loading }: DatabaseHealthMonitorProps) {
  if (loading || !data) {
    return (
      <DiagnosticCard
        title="Database Health Monitor"
        icon={<Database className="w-4 h-4 text-[#C2456A]" />}
        description="Real-time overview of PostgreSQL and Supabase database health."
      >
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </DiagnosticCard>
    );
  }

  const {
    connectionPool,
    uptime,
    sessions,
    slowQueriesCount,
    cacheHitRatio,
    storage,
    recentEvents,
    overallStatus,
  } = data;

  const cacheStatus =
    cacheHitRatio > 95
      ? "Excellent"
      : cacheHitRatio > 80
        ? "Good"
        : "Poor";
  const cacheColor =
    cacheHitRatio > 95
      ? "bg-emerald-500"
      : cacheHitRatio > 80
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <DiagnosticCard
      title="Database Health Monitor"
      icon={<Database className="w-4 h-4 text-[#C2456A]" />}
      description="Real-time overview of PostgreSQL and Supabase database health."
      action={<StatusBadge status={overallStatus} />}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ProgressMetric
            label="Connection Pool"
            value={connectionPool.active}
            max={connectionPool.max}
            valueLabel={`${connectionPool.active} / ${connectionPool.max} Active`}
            colorClass={
              connectionPool.active / connectionPool.max > 0.8
                ? "bg-red-500"
                : "bg-blue-500"
            }
          />

          <ProgressMetric
            label="Database Size"
            value={storage.usedGB}
            max={storage.totalGB}
            valueLabel={`${storage.usedGB} GB / ${storage.totalGB} GB`}
            colorClass="bg-purple-500"
          />
        </div>

        <Separator className="bg-[#C2456A]/10" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1 p-3 rounded-lg border bg-card shadow-sm justify-center items-center">
            <span className="text-xs font-medium text-muted-foreground">
              Database Uptime
            </span>
            <span className="text-lg font-bold tracking-tight">
              {uptime.days}d {uptime.hours}h
            </span>
            <span className="text-[10px] text-muted-foreground text-center">
              Since last restart
            </span>
          </div>

          <StatusMetric
            label="Active Sessions"
            value={`${sessions.total}`}
            status={sessions.waiting > 5 ? "Warning" : "Normal"}
            subtitle={`${sessions.idle} Idle • ${sessions.active} Active • ${sessions.waiting} Waiting`}
          />

          <StatusMetric
            label="Slow Queries"
            value={slowQueriesCount}
            status={
              slowQueriesCount === 0
                ? "Normal"
                : slowQueriesCount < 5
                  ? "Warning"
                  : "Critical"
            }
            subtitle={slowQueriesCount > 0 ? "Detected" : "None"}
          />
        </div>

        <div className="pt-2">
          <ProgressMetric
            label="Cache Hit Ratio"
            value={cacheHitRatio}
            max={100}
            valueLabel={`${cacheHitRatio}% (${cacheStatus})`}
            colorClass={cacheColor}
          />
        </div>

        <div className="space-y-3 pt-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Recent Database Events
          </span>
          <div className="pl-2 border-l border-transparent mt-3">
            {recentEvents.map((event) => (
              <TimelineItem
                key={event.id}
                name={event.name}
                timestamp={event.timestamp}
              />
            ))}
          </div>
        </div>
      </div>
    </DiagnosticCard>
  );
}
