import { DiagnosticStatus } from "./components/ui/status-badge";

export const systemHealth = {
  posConnection: "Healthy" as DiagnosticStatus,
  database: "Healthy" as DiagnosticStatus,
  auth: "Healthy" as DiagnosticStatus,
  storage: "Healthy" as DiagnosticStatus,
  lastSync: "2 minutes ago",
  apiResponse: "145 ms",
  serverClock: new Date().toISOString(),
};

export const databaseDiagnostics = {
  latency: "42 ms",
  connectionStatus: "Healthy" as DiagnosticStatus,
  lastSuccessfulQuery: "Just now",
  pendingTransactions: 12,
  failedRequests: 0,
  storageUsage: "45% (2.1GB / 5GB)",
};





export const warningCenter = [
  "3 ingredients are critically low (Milk, Vanilla Syrup, Caramel Sauce).",
  "Audit log storage nearing capacity (85%).",
  "Database CPU utilization exceeded 85% for 5 minutes.",
  "High memory usage detected on main Node.js process.",
  "API rate limit reached for endpoint /api/inventory.",
  "Storage bucket 'receipts' is nearing 90% capacity.",
  "Unusual spike in error rates from payment gateway provider.",
  "Background job 'sync-offline-sales' failed 3 times in a row.",
  "Slow database queries detected in the 'transactions' table.",
  "WebSocket connection dropped for Terminal 4 multiple times.",
  "SSL Certificate for main domain will expire in 14 days.",
];

export const errorLogs = [
  {
    id: 1,
    timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    module: "Inventory",
    severity: "Warning" as DiagnosticStatus,
    message: "Supplier API timeout during sync.",
    status: "Resolved",
  },
  {
    id: 2,
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    module: "Customer Management",
    severity: "Error" as DiagnosticStatus,
    message: "Failed to generate QR code for Card #11054.",
    status: "Open",
  },
  {
    id: 3,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    module: "Authentication",
    severity: "Warning" as DiagnosticStatus,
    message: "Rate limit exceeded for endpoint /api/auth.",
    status: "Resolved",
  },
  {
    id: 4,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    module: "POS",
    severity: "Information" as DiagnosticStatus,
    message: "Offline receipt sync queue reached 50 items.",
    status: "Open",
  },
];



export const applicationDiagnostics = {
  framework: "Next.js 14 (App Router)",
  database: "Supabase PostgreSQL 15.1",
  authentication: "Supabase Auth (GoTrue)",
  storage: "Supabase Storage",
  environment: "Production",
  buildVersion: "v1.2.4-beta",
  deploymentDate: "2026-08-01 14:00 UTC",
  lastBuild: "2026-08-01 13:45 UTC",
  nodeVersion: "v20.11.0",
  timezone: "Asia/Manila (UTC+8)",
};

export const performanceMetrics = {
  averageApiResponse: 145, // ms
  slowestRequest: 1250, // ms
  fastestRequest: 25, // ms
  databaseResponseTime: 42, // ms
  pageRenderTime: 320, // ms
};

import { DatabaseHealthMetrics, DatabasePerformanceMetrics } from "./types";

export const databaseHealthData: DatabaseHealthMetrics = {
  connectionPool: {
    active: 18,
    max: 100,
  },
  uptime: {
    days: 12,
    hours: 18,
  },
  sessions: {
    active: 4,
    idle: 18,
    waiting: 2,
    total: 24,
  },
  slowQueriesCount: 3,
  cacheHitRatio: 98.7,
  storage: {
    usedGB: 2.3,
    totalGB: 8,
  },
  recentEvents: [
    {
      id: "evt_1",
      name: "Connection Established",
      timestamp: "2 minutes ago",
    },
    {
      id: "evt_2",
      name: "Automatic Vacuum Completed",
      timestamp: "15 minutes ago",
    },
    {
      id: "evt_3",
      name: "Index Updated",
      timestamp: "1 hour ago",
    },
    {
      id: "evt_4",
      name: "Backup Completed",
      timestamp: "Today 2:00 AM",
    },
  ],
  overallStatus: "Healthy",
};

export const databasePerformanceData: DatabasePerformanceMetrics = {
  averageQueryTimeMs: 18,
  slowestQueryMs: 245,
  slowestQueryName: "SELECT loyalty_transactions",
  fastestQueryMs: 3,
  averageInsertTimeMs: 12,
  averageUpdateTimeMs: 15,
  averageReadTimeMs: 9,
  transactionsPerMinute: 186,
  tpmHistory: [120, 140, 160, 150, 170, 186, 175, 180, 186],
  querySuccessRate: 99.94,
  failedQueriesCount: 2,
  responseTrend: [
    { timestamp: "10:00", ms: 22 },
    { timestamp: "10:05", ms: 25 },
    { timestamp: "10:10", ms: 18 },
    { timestamp: "10:15", ms: 20 },
    { timestamp: "10:20", ms: 15 },
    { timestamp: "10:25", ms: 18 },
    { timestamp: "10:30", ms: 17 },
  ],
  recommendations: [
    {
      id: "rec_1",
      type: "Success",
      message: "Query performance is within acceptable limits.",
    },
    {
      id: "rec_2",
      type: "Success",
      message: "Cache hit ratio is excellent.",
    },
    {
      id: "rec_3",
      type: "Warning",
      message: "Consider indexing loyalty_transactions.card_number.",
    },
    {
      id: "rec_4",
      type: "Warning",
      message: "Inventory table has increased read frequency.",
    },
  ],
};
