import { saveAs } from "file-saver";
import { AuditLog } from "./data";
import { formatIpAddress, formatDevice } from "./utils";

function escapeCSV(val: string | null | undefined): string {
  if (val == null) return "";
  const str = String(val);
  // If string contains comma, quote, or newline, escape it
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatDateCSV(dateString: string): string {
  const d = new Date(dateString);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).replace(",", "");
}

export function exportAuditToCSV(logs: AuditLog[]) {
  // Columns: Timestamp, User, Category, Action, Target, Severity, IP Address, Device
  const headers = [
    "Timestamp",
    "User",
    "Category",
    "Action",
    "Target",
    "Severity",
    "IP Address",
    "Device"
  ];

  const rows = logs.map(log => {
    const targetDisplay = log.target_name ? `${log.target_type}: ${log.target_name}` : "-";
    return [
      formatDateCSV(log.created_at),
      log.user_name,
      log.category,
      log.action,
      targetDisplay,
      log.severity,
      formatIpAddress(log.ip_address),
      formatDevice(log.device),
    ];
  });

  const csvContent = [
    headers.map(escapeCSV).join(","),
    ...rows.map(row => row.map(escapeCSV).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  
  const isoDate = new Date().toISOString().split("T")[0];
  const fileName = `Audit_Logs_${isoDate}.csv`;

  saveAs(blob, fileName);
}
