import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { DiagnosticsPDFData, DatabaseHealthMetrics, DatabasePerformanceMetrics } from "../types";
import { DiagnosticStatus } from "../components/ui/status-badge";

// Branding & Colors
const BRAND_COLOR: [number, number, number] = [194, 69, 106]; // #C2456A
const SUCCESS_COLOR: [number, number, number] = [16, 185, 129]; // emerald-500
const WARNING_COLOR: [number, number, number] = [245, 158, 11]; // amber-500
const ERROR_COLOR: [number, number, number] = [239, 68, 68]; // red-500
const INFO_COLOR: [number, number, number] = [59, 130, 246]; // blue-500
const TEXT_DARK: [number, number, number] = [15, 23, 42]; // slate-900
const TEXT_MUTED: [number, number, number] = [100, 116, 139]; // slate-500
const BORDER_COLOR: [number, number, number] = [226, 232, 240]; // slate-200
const BG_LIGHT: [number, number, number] = [248, 250, 252]; // slate-50

function getStatusColorArray(status: string) {
  const s = status.toLowerCase();
  if (s === "healthy" || s === "success" || s === "excellent" || s === "normal") return SUCCESS_COLOR;
  if (s === "warning" || s === "poor") return WARNING_COLOR;
  if (s === "error" || s === "critical") return ERROR_COLOR;
  if (s === "information" || s === "open") return INFO_COLOR;
  return TEXT_MUTED;
}

export const generateDiagnosticsPDF = (data: DiagnosticsPDFData) => {
  // Destructure with aliases matching original variable names used below
  const { systemHealth, appDetails: applicationDiagnostics } = data;
  const warningCenter = data.warnings;
  const errorLogs = data.errorLogs;

  const databaseHealthData: DatabaseHealthMetrics = data.dbHealth || {
    connectionPool: { active: 0, max: 0 },
    uptime: { days: 0, hours: 0 },
    sessions: { active: 0, idle: 0, waiting: 0, total: 0 },
    slowQueriesCount: 0,
    cacheHitRatio: 0,
    storage: { usedGB: 0, totalGB: 0 },
    recentEvents: [],
    overallStatus: "Healthy" as DiagnosticStatus,
  };

  const databasePerformanceData: DatabasePerformanceMetrics = data.dbPerformance || {
    averageQueryTimeMs: 0,
    slowestQueryMs: 0,
    slowestQueryName: "N/A",
    fastestQueryMs: 0,
    averageInsertTimeMs: 0,
    averageUpdateTimeMs: 0,
    averageReadTimeMs: 0,
    transactionsPerMinute: 0,
    tpmHistory: [],
    querySuccessRate: 0,
    failedQueriesCount: 0,
    responseTrend: [],
    recommendations: [],
  };
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  
  let currentY = margin;

  // Header
  doc.setFillColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2]);
  doc.rect(0, 0, pageWidth, 5, "F");

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  currentY += 10;
  doc.text("System Diagnostics & Health Report", margin, currentY);

  currentY += 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
  doc.text("System health, application diagnostics, database performance, and operational status overview.", margin, currentY);

  currentY += 8;
  doc.setFontSize(9);
  doc.setTextColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2]);
  const dateStr = format(new Date(), "PPpp");
  doc.text(`Generated on: ${dateStr}`, margin, currentY);
  
  // Overall Status badge top right
  const statusX = pageWidth - margin - 25;
  const overallLabel = [systemHealth.posConnection, systemHealth.database, systemHealth.auth, systemHealth.storage]
    .some(s => s === "Critical") ? "CRITICAL"
    : [systemHealth.posConnection, systemHealth.database, systemHealth.auth, systemHealth.storage]
    .some(s => s === "Warning") ? "WARNING" : "HEALTHY";
  const badgeColor = overallLabel === "CRITICAL" ? ERROR_COLOR : overallLabel === "WARNING" ? WARNING_COLOR : SUCCESS_COLOR;
  doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  doc.roundedRect(statusX, currentY - 14, 25, 6, 1, 1, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(overallLabel, statusX + 12.5, currentY - 10, { align: "center" });

  currentY += 5;
  doc.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;

  // 1. System Health Overview
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  doc.text("1. System Health Overview", margin, currentY);
  currentY += 5;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [["Metric", "Status / Value", "Description"]],
    body: [
      ["POS Connection", systemHealth.posConnection, "Local network to cloud synchronization"],
      ["Database", systemHealth.database, "Main Supabase PostgreSQL instance"],
      ["Authentication", systemHealth.auth, "User identity and token management"],
      ["Storage", systemHealth.storage, "File and receipt storage bucket"],
      ["Last Sync", systemHealth.lastSync, "Time since last successful background sync"],
      ["API Response", systemHealth.apiResponse, "Average endpoint latency"],
      ["Server Clock", format(new Date(systemHealth.serverClock), "PPpp"), "Current timestamp of the primary server"],
    ],
    theme: "grid",
    headStyles: { fillColor: BG_LIGHT, textColor: TEXT_DARK, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 3, lineColor: BORDER_COLOR, lineWidth: 0.1 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 45 },
      1: { cellWidth: 45 },
      2: { textColor: TEXT_MUTED },
    },
    didParseCell: function (data) {
      if (data.section === "body" && data.column.index === 1) {
        const val = data.cell.raw as string;
        if (["Healthy", "Warning", "Error", "Critical"].includes(val)) {
          data.cell.styles.fontStyle = "bold";
          const c = getStatusColorArray(val);
          data.cell.styles.textColor = [c[0], c[1], c[2]];
        }
      }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // 2. Warning Center
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  doc.text("2. Warning Center", margin, currentY);
  currentY += 5;

  const warningsData = warningCenter.map((w) => {
    let severity = "Warning";
    if (w.toLowerCase().includes("critical") || w.toLowerCase().includes("fail")) severity = "Critical";
    else if (w.toLowerCase().includes("info") || w.toLowerCase().includes("capacity")) severity = "Information";
    return [severity, w, "Active"];
  });

  if (warningsData.length > 0) {
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [["Severity", "Issue / Description", "Status"]],
      body: warningsData,
      theme: "plain",
      headStyles: { fillColor: false, textColor: TEXT_DARK, fontStyle: "bold" },
      styles: { fontSize: 9, cellPadding: 3, lineColor: BORDER_COLOR, lineWidth: { bottom: 0.1 } as any },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 25 },
        2: { cellWidth: 20 },
      },
      didParseCell: function (data) {
        if (data.section === "body" && data.column.index === 0) {
          const val = data.cell.raw as string;
          const c = getStatusColorArray(val);
          data.cell.styles.textColor = [c[0], c[1], c[2]];
        }
      }
    });
    currentY = (doc as any).lastAutoTable.finalY + 12;
  } else {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(SUCCESS_COLOR[0], SUCCESS_COLOR[1], SUCCESS_COLOR[2]);
    doc.text("No active warnings. System is fully healthy.", margin, currentY);
    currentY += 12;
  }

  // Check page break
  if (currentY > pageHeight - 40) {
    doc.addPage();
    currentY = margin;
  }

  // 3. Application Details
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  doc.text("3. Application Details", margin, currentY);
  currentY += 5;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [["Environment Property", "Value"]],
    body: [
      ["Framework", applicationDiagnostics.framework],
      ["Database", applicationDiagnostics.database],
      ["Authentication", applicationDiagnostics.authentication],
      ["Storage", applicationDiagnostics.storage],
      ["Environment", applicationDiagnostics.environment],
      ["Build Version", applicationDiagnostics.buildVersion],
      ["Deployment Date", applicationDiagnostics.deploymentDate],
      ["Last Build", applicationDiagnostics.lastBuild],
      ["Node Version", applicationDiagnostics.nodeVersion],
      ["Timezone", applicationDiagnostics.timezone],
    ],
    theme: "striped",
    headStyles: { fillColor: BRAND_COLOR, textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 70 },
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // 4. Application Error Logs
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = margin;
  }
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  doc.text("4. Application Error Logs", margin, currentY);
  currentY += 5;

  const errorLogsData = errorLogs.map(log => [
    format(new Date(log.timestamp), "MMM dd, HH:mm"),
    log.module,
    log.severity,
    log.message,
    log.status
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [["Timestamp", "Module", "Severity", "Message", "Status"]],
    body: errorLogsData,
    theme: "grid",
    headStyles: { fillColor: BG_LIGHT, textColor: TEXT_DARK, fontStyle: "bold" },
    styles: { fontSize: 8, cellPadding: 2.5, lineColor: BORDER_COLOR, lineWidth: 0.1 },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 35 },
      2: { cellWidth: 20, fontStyle: "bold" },
      3: { cellWidth: "auto" },
      4: { cellWidth: 18 },
    },
    didParseCell: function (data) {
      if (data.section === "body" && data.column.index === 2) {
        const val = data.cell.raw as string;
        const c = getStatusColorArray(val);
        data.cell.styles.textColor = [c[0], c[1], c[2]];
      }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // 5. Database Health Monitor
  if (currentY > pageHeight - 70) {
    doc.addPage();
    currentY = margin;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  doc.text("5. Database Health Monitor", margin, currentY);
  currentY += 5;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [["Metric", "Value", "Metric", "Value"]],
    body: [
      [
        "Status", databaseHealthData.overallStatus,
        "Uptime", `${databaseHealthData.uptime.days}d ${databaseHealthData.uptime.hours}h`
      ],
      [
        "Connection Pool", `${databaseHealthData.connectionPool.active} / ${databaseHealthData.connectionPool.max} Active`,
        "Active Sessions", `${databaseHealthData.sessions.total} (${databaseHealthData.sessions.active} act, ${databaseHealthData.sessions.idle} idl)`
      ],
      [
        "Database Size", `${databaseHealthData.storage.usedGB} GB / ${databaseHealthData.storage.totalGB} GB`,
        "Cache Hit Ratio", `${databaseHealthData.cacheHitRatio}%`
      ],
      [
        "Slow Queries", `${databaseHealthData.slowQueriesCount} Detected`,
        "", ""
      ]
    ],
    theme: "grid",
    headStyles: { fillColor: BG_LIGHT, textColor: TEXT_DARK, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 3, lineColor: BORDER_COLOR, lineWidth: 0.1 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 40 },
      2: { fontStyle: "bold", cellWidth: 40 },
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // Recent DB Events
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  doc.text("Recent Database Events:", margin, currentY);
  currentY += 4;
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  databaseHealthData.recentEvents.forEach(evt => {
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    doc.text(`• ${evt.name}`, margin + 2, currentY);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text(evt.timestamp, margin + 80, currentY);
    currentY += 5;
  });
  
  currentY += 6;

  // 6. Query & Performance Insights
  if (currentY > pageHeight - 80) {
    doc.addPage();
    currentY = margin;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  doc.text("6. Query & Performance Insights", margin, currentY);
  currentY += 5;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [["Performance Metric", "Value"]],
    body: [
      ["Average Query Time", `${databasePerformanceData.averageQueryTimeMs} ms`],
      ["Fastest Query", `${databasePerformanceData.fastestQueryMs} ms`],
      ["Slowest Query", `${databasePerformanceData.slowestQueryMs} ms (${databasePerformanceData.slowestQueryName})`],
      ["Average Read Time", `${databasePerformanceData.averageReadTimeMs} ms`],
      ["Average Insert Time", `${databasePerformanceData.averageInsertTimeMs} ms`],
      ["Average Update Time", `${databasePerformanceData.averageUpdateTimeMs} ms`],
      ["Transactions per min", `${databasePerformanceData.transactionsPerMinute}`],
      ["Query Success Rate", `${databasePerformanceData.querySuccessRate}%`],
      ["Failed Queries", `${databasePerformanceData.failedQueriesCount}`],
    ],
    theme: "striped",
    headStyles: { fillColor: BRAND_COLOR, textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 70 },
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Draw a simple trend line chart
  const trendData = databasePerformanceData.responseTrend;
  if (trendData && trendData.length > 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    doc.text("Response Trend (ms):", margin, currentY);
    currentY += 5;

    const chartWidth = 100;
    const chartHeight = 30;
    const chartX = margin;
    const chartY = currentY;
    
    // Background and axes
    doc.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
    doc.setFillColor(BG_LIGHT[0], BG_LIGHT[1], BG_LIGHT[2]);
    doc.rect(chartX, chartY, chartWidth, chartHeight, "F");
    
    const maxMs = Math.max(...trendData.map(d => d.ms)) * 1.2;
    
    // Draw lines
    doc.setDrawColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2]);
    doc.setLineWidth(0.5);
    let prevPoint: {x: number, y: number} | null = null;
    
    trendData.forEach((d, i) => {
      const x = chartX + (i * (chartWidth / (trendData.length - 1 || 1)));
      const y = chartY + chartHeight - ((d.ms / maxMs) * chartHeight);
      
      if (prevPoint) {
        doc.line(prevPoint.x, prevPoint.y, x, y);
      }
      
      // Draw point
      doc.setFillColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2]);
      doc.circle(x, y, 1, "F");
      
      // Draw label below
      doc.setFontSize(7);
      doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
      doc.text(d.timestamp, x, chartY + chartHeight + 4, { align: "center" });
      
      prevPoint = { x, y };
    });
    
    currentY += chartHeight + 12;
  }

  // 7. Recommendations
  if (currentY > pageHeight - 50) {
    doc.addPage();
    currentY = margin;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  doc.text("7. Recommendations", margin, currentY);
  currentY += 5;

  const recData = databasePerformanceData.recommendations.map(r => [r.type, r.message]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [["Type", "Recommendation"]],
    body: recData,
    theme: "grid",
    headStyles: { fillColor: BG_LIGHT, textColor: TEXT_DARK, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 3, lineColor: BORDER_COLOR, lineWidth: 0.1 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 25 },
    },
    didParseCell: function (data) {
      if (data.section === "body" && data.column.index === 0) {
        const val = data.cell.raw as string;
        const c = getStatusColorArray(val);
        data.cell.styles.textColor = [c[0], c[1], c[2]];
      }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // Report Summary
  if (currentY > pageHeight - 40) {
    doc.addPage();
    currentY = margin;
  }
  
  doc.setFillColor(BG_LIGHT[0], BG_LIGHT[1], BG_LIGHT[2]);
  doc.setDrawColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2]);
  doc.setLineWidth(0.5);
  doc.rect(margin, currentY, contentWidth, 25, "FD");

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  doc.text("Overall Diagnostics Summary", margin + 5, currentY + 7);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Active Warnings: ${warningCenter.length}`, margin + 5, currentY + 13);
  doc.text(`Application Errors: ${errorLogs.filter(e => e.status !== 'Resolved').length} Open`, margin + 5, currentY + 18);
  doc.text(`Database Status: ${databaseHealthData.overallStatus}`, margin + 70, currentY + 13);
  doc.text(`Query Success: ${databasePerformanceData.querySuccessRate}%`, margin + 70, currentY + 18);
  
  // Footer on all pages
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text(
      `Sheilz POS — System Diagnostics & Health Report • Generated: ${dateStr}`,
      margin,
      pageHeight - 10
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - margin,
      pageHeight - 10,
      { align: "right" }
    );
  }

  // Save the PDF
  const filename = `Sheilz_POS_System_Diagnostics_Report_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(filename);
};
