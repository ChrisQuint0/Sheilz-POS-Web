import { DiagnosticStatus } from "./components/ui/status-badge";

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
  cacheHitRatio: number; // percentage (0-100)
  storage: {
    usedGB: number;
    totalGB: number;
  };
  recentEvents: DatabaseEvent[];
  overallStatus: DiagnosticStatus;
}

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
  tpmHistory: number[]; // For sparkline
  querySuccessRate: number; // percentage
  failedQueriesCount: number;
  responseTrend: { timestamp: string; ms: number }[]; // For small chart
  recommendations: PerformanceRecommendation[];
}
