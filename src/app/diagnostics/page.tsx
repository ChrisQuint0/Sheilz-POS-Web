"use client";

import { useState } from "react";
import { DiagnosticsHeader } from "./components/diagnostics-header";
import { SystemHealthOverview } from "./components/system-health-overview";
import { WarningCenter } from "./components/warning-center";
import { ErrorLogPreview } from "./components/error-log-preview";
import { ApplicationDiagnostics } from "./components/application-diagnostics";
import { DatabaseHealthMonitor } from "./components/database-health-monitor";
import { QueryPerformanceInsights } from "./components/query-performance-insights";

export default function DiagnosticsPage() {
  const [loading, setLoading] = useState(false);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col flex-1 w-full max-w-7xl mx-auto pb-10">
      <DiagnosticsHeader onRefresh={handleRefresh} loading={loading} />

      <div
        className={`transition-opacity duration-300 ${loading ? "opacity-50 pointer-events-none" : "opacity-100"}`}
      >
        <SystemHealthOverview />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
          {/* Main Column */}
          <div className="md:col-span-8 flex flex-col gap-4">
            <WarningCenter />
          </div>

          {/* Sidebar Column */}
          <div className="md:col-span-4 flex flex-col gap-4">
            <ApplicationDiagnostics />
          </div>

        <div className="md:col-span-12 mb-4">
          <ErrorLogPreview />
        </div>

        <div className="md:col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DatabaseHealthMonitor />
          <QueryPerformanceInsights />
        </div>
        </div>
      </div>
    </div>
  );
}
