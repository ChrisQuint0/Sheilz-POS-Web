import { Button } from "@/components/ui/button";
import { Download, RefreshCw, Activity, Loader2 } from "lucide-react";
import { StatusBadge, DiagnosticStatus } from "./ui/status-badge";
import { useState } from "react";

interface DiagnosticsHeaderProps {
  onRefresh: () => void;
  loading?: boolean;
  overallStatus: DiagnosticStatus;
  lastChecked: Date | null;
  onExport: () => void;
}

export function DiagnosticsHeader({
  onRefresh,
  loading = false,
  overallStatus,
  lastChecked,
  onExport,
}: DiagnosticsHeaderProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Small delay to allow UI to update to loading state
      await new Promise((resolve) => setTimeout(resolve, 100));
      onExport();
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const getLastCheckedText = () => {
    if (!lastChecked) return "Never";
    const diffMs = Date.now() - lastChecked.getTime();
    if (diffMs < 5000) return "Just now";
    if (diffMs < 60000) return `${Math.floor(diffMs / 1000)}s ago`;
    return `${Math.floor(diffMs / 60000)}m ago`;
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#C2456A]/10">
      <div>
        <p className="text-xs font-medium text-[#C2456A] uppercase tracking-widest mb-1">
          System Monitoring
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          Diagnostics Analytics{" "}
          <Activity className="h-7 w-7 text-[#C2456A]" />
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Monitor system health, loyalty integrity, inventory diagnostics,
          synchronization status, and operational issues.
        </p>
      </div>
      <div className="flex flex-col items-end gap-3 self-start sm:self-auto">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="bg-background shadow-sm"
            disabled={loading || isExporting}
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export Report
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="bg-background shadow-sm"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>System Status:</span>
          <StatusBadge status={overallStatus} showIcon={false} />
          <span className="mx-1">•</span>
          <span>Last checked: {getLastCheckedText()}</span>
        </div>
      </div>
    </div>
  );
}
