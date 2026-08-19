import { useMemo } from "react";
import { DiagnosticCard } from "./ui/diagnostic-card";
import { ErrorLogEntry } from "../types";
import { FileWarning } from "lucide-react";
import { StatusBadge } from "./ui/status-badge";
import { Badge } from "@/components/ui/badge";

import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

ModuleRegistry.registerModules([AllCommunityModule]);

interface ErrorLogPreviewProps {
  logs: ErrorLogEntry[];
}

export function ErrorLogPreview({ logs }: ErrorLogPreviewProps) {
  const colDefs = useMemo<ColDef[]>(
    () => [
      {
        field: "timestamp",
        headerName: "Timestamp",
        valueFormatter: (params) => {
          try {
            return new Date(params.value).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
          } catch {
            return params.value;
          }
        },
        minWidth: 120,
      },
      { field: "module", headerName: "Module", minWidth: 150 },
      {
        field: "severity",
        headerName: "Severity",
        cellRenderer: (params: any) => {
          return (
            <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
              <StatusBadge status={params.value} showIcon={false} />
            </div>
          );
        },
        minWidth: 120,
      },
      {
        field: "message",
        headerName: "Message",
        flex: 1,
        minWidth: 250,
        tooltipValueGetter: (params) => params.value,
      },
    ],
    []
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
    }),
    []
  );

  return (
    <DiagnosticCard
      title="Application Error Logs"
      icon={<FileWarning className="w-4 h-4 text-[#C2456A]" />}
      description="Frontend preview of recent application errors"
    >
      <div className="ag-theme-quartz w-full" style={{ height: "400px" }}>
        <AgGridReact
          theme="legacy"
          rowData={logs}
          columnDefs={colDefs}
          defaultColDef={defaultColDef}
          rowSelection="single"
          animateRows={true}
          tooltipShowDelay={0}
          onGridReady={(params) => params.api.sizeColumnsToFit()}
        />
      </div>
    </DiagnosticCard>
  );
}
