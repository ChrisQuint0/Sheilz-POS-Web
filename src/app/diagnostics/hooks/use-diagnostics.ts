import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/app/lib/supabase/client";
import { DiagnosticStatus } from "../components/ui/status-badge";
import {
  SystemHealthData,
  DatabaseHealthMetrics,
  DatabasePerformanceMetrics,
  ErrorLogEntry,
} from "../types";

export interface DiagnosticsData {
  systemHealth: SystemHealthData;
  dbHealth: DatabaseHealthMetrics | null;
  dbPerformance: DatabasePerformanceMetrics | null;
  warnings: string[];
  errorLogs: ErrorLogEntry[];
  loading: boolean;
  error: string | null;
  lastChecked: Date | null;
}

const DEFAULT_HEALTH: SystemHealthData = {
  posConnection: "Healthy",
  database: "Healthy",
  auth: "Healthy",
  storage: "Healthy",
  lastSync: "—",
  apiResponse: "— ms",
  serverClock: new Date().toISOString(),
};

export function useDiagnostics() {
  const [data, setData] = useState<DiagnosticsData>({
    systemHealth: DEFAULT_HEALTH,
    dbHealth: null,
    dbPerformance: null,
    warnings: [],
    errorLogs: [],
    loading: true,
    error: null,
    lastChecked: null,
  });

  const tpmHistoryRef = useRef<number[]>([]);
  const responseTrendRef = useRef<{ timestamp: string; ms: number }[]>([]);

  // Load initial history from sessionStorage on mount
  useEffect(() => {
    try {
      const storedTpm = sessionStorage.getItem("diagnostics_tpm_history");
      if (storedTpm) tpmHistoryRef.current = JSON.parse(storedTpm);
      
      const storedTrend = sessionStorage.getItem("diagnostics_response_trend");
      if (storedTrend) responseTrendRef.current = JSON.parse(storedTrend);
    } catch (e) {
      console.error("Failed to load diagnostic history from session storage", e);
    }
  }, []);

  const fetchDiagnostics = useCallback(async () => {
    setData((prev) => ({ ...prev, loading: true, error: null }));
    const supabase = createClient();
    const fetchStart = performance.now();

    try {
      // All RPC calls in parallel
      const [healthRes, dbHealthRes, dbPerfRes, warningsRes, errorLogsRes] =
        await Promise.allSettled([
          supabase.rpc("get_diagnostics_system_health"),
          supabase.rpc("get_diagnostics_db_health"),
          supabase.rpc("get_diagnostics_db_performance"),
          supabase.rpc("get_diagnostics_warnings"),
          supabase.rpc("get_diagnostics_error_logs", { p_limit: 50 }),
        ]);

      const apiResponseMs = Math.round(performance.now() - fetchStart);

      // Auth & Storage health checks
      let authStatus: DiagnosticStatus = "Healthy";
      let storageStatus: DiagnosticStatus = "Healthy";

      try {
        const { error: authErr } = await supabase.auth.getSession();
        if (authErr) authStatus = "Warning";
      } catch {
        authStatus = "Critical";
      }

      try {
        const { error: storageErr } = await supabase.storage.listBuckets();
        if (storageErr) storageStatus = "Warning";
      } catch {
        storageStatus = "Critical";
      }

      // Extract data safely
      const ok = (r: PromiseSettledResult<any>) =>
        r.status === "fulfilled" && !r.value.error ? r.value.data : null;

      const healthData = ok(healthRes);
      const dbHealthData = ok(dbHealthRes);
      const dbPerfData = ok(dbPerfRes);
      const warningsData = ok(warningsRes) ?? [];
      const errorLogsData = ok(errorLogsRes) ?? [];

      // Database status
      let dbStatus: DiagnosticStatus = "Healthy";
      if (!healthData) {
        dbStatus = "Critical";
      } else if (dbHealthData?.overallStatus) {
        dbStatus = dbHealthData.overallStatus as DiagnosticStatus;
      }

      // Format lastSync
      let lastSync = "No sync data";
      if (healthData?.lastSync) {
        const diffMin = Math.floor(
          (Date.now() - new Date(healthData.lastSync).getTime()) / 60000
        );
        if (diffMin < 1) lastSync = "Just now";
        else if (diffMin < 60) lastSync = `${diffMin} minutes ago`;
        else if (diffMin < 1440) lastSync = `${Math.floor(diffMin / 60)} hours ago`;
        else lastSync = `${Math.floor(diffMin / 1440)} days ago`;
      }

      // Accumulate TPM history across refreshes
      if (dbPerfData?.transactionsPerMinute !== undefined) {
        tpmHistoryRef.current = [
          ...tpmHistoryRef.current.slice(-30),
          Number(dbPerfData.transactionsPerMinute),
        ];
        sessionStorage.setItem("diagnostics_tpm_history", JSON.stringify(tpmHistoryRef.current));
      }

      // Accumulate response trend across refreshes
      responseTrendRef.current = [
        ...responseTrendRef.current.slice(-30),
        {
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          ms: apiResponseMs,
        },
      ];
      sessionStorage.setItem("diagnostics_response_trend", JSON.stringify(responseTrendRef.current));

      // System health object
      const systemHealth: SystemHealthData = {
        posConnection: dbStatus,
        database: dbStatus,
        auth: authStatus,
        storage: storageStatus,
        lastSync,
        apiResponse: `${apiResponseMs} ms`,
        serverClock: healthData?.serverTime || new Date().toISOString(),
      };

      // DB health metrics
      let dbHealth: DatabaseHealthMetrics | null = null;
      if (dbHealthData) {
        dbHealth = {
          connectionPool: dbHealthData.connectionPool,
          uptime: dbHealthData.uptime,
          sessions: dbHealthData.sessions,
          slowQueriesCount: dbHealthData.slowQueriesCount,
          cacheHitRatio: Number(dbHealthData.cacheHitRatio),
          storage: dbHealthData.storage,
          recentEvents: dbHealthData.recentEvents || [],
          overallStatus: dbHealthData.overallStatus as DiagnosticStatus,
        };
      }

      // DB performance metrics
      let dbPerformance: DatabasePerformanceMetrics | null = null;
      if (dbPerfData) {
        dbPerformance = {
          averageQueryTimeMs: Number(dbPerfData.averageQueryTimeMs),
          slowestQueryMs: Number(dbPerfData.slowestQueryMs),
          slowestQueryName: dbPerfData.slowestQueryName || "N/A",
          fastestQueryMs: Number(dbPerfData.fastestQueryMs),
          averageInsertTimeMs: Number(dbPerfData.averageInsertTimeMs),
          averageUpdateTimeMs: Number(dbPerfData.averageUpdateTimeMs),
          averageReadTimeMs: Number(dbPerfData.averageReadTimeMs),
          transactionsPerMinute: Number(dbPerfData.transactionsPerMinute),
          tpmHistory: [...tpmHistoryRef.current],
          querySuccessRate: Number(dbPerfData.querySuccessRate),
          failedQueriesCount: Number(dbPerfData.failedQueriesCount),
          responseTrend: [...responseTrendRef.current],
          recommendations: dbPerfData.recommendations || [],
        };
      }

      setData({
        systemHealth,
        dbHealth,
        dbPerformance,
        warnings: Array.isArray(warningsData) ? warningsData : [],
        errorLogs: Array.isArray(errorLogsData) ? errorLogsData : [],
        loading: false,
        error: null,
        lastChecked: new Date(),
      });
    } catch (err: any) {
      setData((prev) => ({
        ...prev,
        loading: false,
        error: err.message || "Failed to fetch diagnostics data",
      }));
    }
  }, []);

  useEffect(() => {
    fetchDiagnostics();
  }, [fetchDiagnostics]);

  return { ...data, refetch: fetchDiagnostics };
}
