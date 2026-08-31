"use client";

import { DiagnosticsHeader } from "./components/diagnostics-header";
import { SystemHealthOverview } from "./components/system-health-overview";
import { WarningCenter } from "./components/warning-center";
import { ErrorLogPreview } from "./components/error-log-preview";
import { ApplicationDiagnostics } from "./components/application-diagnostics";
import { DatabaseHealthMonitor } from "./components/database-health-monitor";
import { QueryPerformanceInsights } from "./components/query-performance-insights";
import { useDiagnostics } from "./hooks/use-diagnostics";
import { generateDiagnosticsPDF } from "./utils/generate-pdf";
import { DiagnosticStatus } from "./components/ui/status-badge";

const isProd = process.env.NODE_ENV === "production";
const APP_DETAILS: Record<string, string> = {
  framework: "Next.js 14 (App Router)",
  database: "Supabase PostgreSQL 15.1",
  authentication: "Supabase Auth (GoTrue)",
  storage: "Supabase Storage",
  environment: isProd ? "Production" : "Development",
  buildVersion: "v1.2.4-beta",
  deploymentDate: isProd ? "2026-08-01 14:00 UTC" : "N/A (Development)",
  lastBuild: isProd ? "2026-08-01 13:45 UTC" : "N/A (Development)",
  nodeVersion: "v20.11.0",
  timezone: "Asia/Manila (UTC+8)",
};

export default function DiagnosticsPage() {
  const {
    systemHealth,
    dbHealth,
    dbPerformance,
    warnings,
    errorLogs,
    loading,
    lastChecked,
    refetch,
  } = useDiagnostics();

  const statuses = [
    systemHealth.posConnection,
    systemHealth.database,
    systemHealth.auth,
    systemHealth.storage,
  ] as DiagnosticStatus[];

  const overallStatus: DiagnosticStatus = statuses.some(
    (s) => s === "Critical"
  )
    ? "Critical"
    : statuses.some((s) => s === "Warning")
      ? "Warning"
      : "Healthy";

  const handleExport = () => {
    generateDiagnosticsPDF({
      systemHealth,
      warnings,
      errorLogs,
      appDetails: APP_DETAILS,
      dbHealth,
      dbPerformance,
    });
    
    import('@/app/audit/actions').then(({ logAppEvent }) => {
      logAppEvent('Diagnostic Exported', 'Low', 'Report', 'Sheilz_Diagnostics_Report.pdf', null)
        .catch(console.error);
    });
  };

  return (
    <div className="flex flex-col flex-1 w-full max-w-7xl mx-auto pb-10">
      <DiagnosticsHeader
        onRefresh={refetch}
        loading={loading}
        overallStatus={overallStatus}
        lastChecked={lastChecked}
        onExport={handleExport}
      />

      <div
        className={`transition-opacity duration-300 ${loading ? "opacity-50 pointer-events-none" : "opacity-100"}`}
      >
        <SystemHealthOverview data={systemHealth} />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
          {/* Main Column */}
          <div className="md:col-span-8 flex flex-col gap-4">
            <WarningCenter warnings={warnings} />
          </div>

          {/* Sidebar Column */}
          <div className="md:col-span-4 flex flex-col gap-4">
            <ApplicationDiagnostics details={APP_DETAILS} />
          </div>

          <div className="md:col-span-12 mb-4">
            <ErrorLogPreview logs={errorLogs} />
          </div>

          <div className="md:col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DatabaseHealthMonitor data={dbHealth} loading={loading} />
            <QueryPerformanceInsights data={dbPerformance} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}
