import { DiagnosticStatus } from "./components/ui/status-badge";

// ---- System Health ----

export interface SystemHealthData {
  posConnection: DiagnosticStatus;
  database: DiagnosticStatus;
  auth: DiagnosticStatus;
  storage: DiagnosticStatus;
  lastSync: string;
  apiResponse: string;
  serverClock: string;
}

// ---- Error Logs ----

export interface ErrorLogEntry {
  id: string;
  timestamp: string;
  module: string;
  severity: string;
  message: string;
  status?: string;
}

// ---- Database Health ----

export interface DatabaseEvent {
  id: string;
  name: string;
  timestamp: string;
}

export interface SessionMetrics {
  active: number;
  idle: number;
  waiting: number;
  total: number;
}

export interface DatabaseHealthMetrics {
  connectionPool: {
    active: number;
    max: number;
  };
  uptime: {
    days: number;
    hours: number;
  };
  sessions: SessionMetrics;
  slowQueriesCount: number;
  cacheHitRatio: number;
  storage: {
    usedGB: number;
    totalGB: number;
  };
  recentEvents: DatabaseEvent[];
  overallStatus: DiagnosticStatus;
}

// ---- Database Performance ----

export interface PerformanceRecommendation {
  id: string;
  type: "Success" | "Warning" | "Critical";
  message: string;
}

export interface DatabasePerformanceMetrics {
  averageQueryTimeMs: number;
  slowestQueryMs: number;
  slowestQueryName: string;
  fastestQueryMs: number;
  averageInsertTimeMs: number;
  averageUpdateTimeMs: number;
  averageReadTimeMs: number;
  transactionsPerMinute: number;
  tpmHistory: number[];
  querySuccessRate: number;
  failedQueriesCount: number;
  responseTrend: { timestamp: string; ms: number }[];
  recommendations: PerformanceRecommendation[];
}

// ---- PDF Export ----

export interface DiagnosticsPDFData {
  systemHealth: SystemHealthData;
  warnings: string[];
  errorLogs: ErrorLogEntry[];
  appDetails: Record<string, string>;
  dbHealth: DatabaseHealthMetrics | null;
  dbPerformance: DatabasePerformanceMetrics | null;
}
