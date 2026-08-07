import { Button } from "@/components/ui/button";
import { Download, RefreshCw, Activity, Loader2 } from "lucide-react";
import { StatusBadge } from "./ui/status-badge";
import { systemHealth } from "../mock-data";
import { useState } from "react";
import { generateDiagnosticsPDF } from "../utils/generate-pdf";

interface DiagnosticsHeaderProps {
  onRefresh: () => void;
  loading?: boolean;
}

export function DiagnosticsHeader({
  onRefresh,
  loading = false,
}: DiagnosticsHeaderProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Small delay to allow UI to update to loading state
      await new Promise(resolve => setTimeout(resolve, 100));
      generateDiagnosticsPDF();
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    } finally {
      setIsExporting(false);
    }
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
          <StatusBadge status="Healthy" showIcon={false} />
          <span className="mx-1">•</span>
          <span>Last checked: Just now</span>
        </div>
      </div>
    </div>
  );
}
