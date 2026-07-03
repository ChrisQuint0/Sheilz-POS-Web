"use client"

import React, { useMemo } from "react"
import { AgGridReact } from "ag-grid-react"
import type { ColDef, GridOptions } from "ag-grid-community"
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community"

ModuleRegistry.registerModules([AllCommunityModule])
import { format } from "date-fns"
import { AuditLog } from "../data"
import { Badge } from "@/components/ui/badge"
import { UAParser } from "ua-parser-js"
import { formatIpAddress, formatDevice } from "../utils"

// AG Grid styles
import "ag-grid-community/styles/ag-grid.css"
import "ag-grid-community/styles/ag-theme-quartz.css"

interface AuditDesktopGridProps {
  logs: AuditLog[]
  onRowClick: (log: AuditLog) => void
}

const SeverityBadge = (props: { value: string }) => {
  switch (props.value) {
    case "Critical":
      return <Badge variant="destructive">{props.value}</Badge>
    case "High":
      return <Badge variant="default">{props.value}</Badge>
    case "Medium":
      return <Badge variant="secondary">{props.value}</Badge>
    case "Low":
    default:
      return <Badge variant="outline">{props.value}</Badge>
  }
}

const CategoryBadge = (props: { value: string }) => {
  // Use a generic secondary badge for categories to keep it clean, or map specific ones.
  return <Badge variant="secondary" className="bg-muted text-muted-foreground font-normal border-transparent">{props.value}</Badge>
}

export function AuditDesktopGrid({ logs, onRowClick }: AuditDesktopGridProps) {
  const columnDefs = useMemo<ColDef<AuditLog>[]>(() => [
    {
      field: "created_at",
      headerName: "Timestamp",
      valueFormatter: (params) => format(new Date(params.value), "MMM dd, yyyy • hh:mm a"),
      minWidth: 180,
      flex: 1
    },
    {
      field: "user_name",
      headerName: "User",
      minWidth: 150,
      flex: 1
    },
    {
      field: "category",
      headerName: "Category",
      cellRenderer: CategoryBadge,
      minWidth: 140,
      flex: 1
    },
    {
      field: "action",
      headerName: "Action",
      minWidth: 180,
      flex: 1.5
    },
    {
      headerName: "Target",
      valueGetter: (params) => {
        if (!params.data?.target_name) return "-"
        return `${params.data.target_type}: ${params.data.target_name}`
      },
      minWidth: 180,
      flex: 1.5
    },
    {
      field: "severity",
      headerName: "Severity",
      cellRenderer: SeverityBadge,
      minWidth: 120,
      flex: 0.8
    },
    {
      field: "ip_address",
      headerName: "IP Address",
      valueFormatter: (params) => formatIpAddress(params.value),
      minWidth: 130,
      flex: 1
    },
    {
      field: "device",
      headerName: "Device",
      valueFormatter: (params) => formatDevice(params.value),
      minWidth: 150,
      flex: 1
    }
  ], [])

  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    suppressMovable: true,
  }), [])

  const gridOptions: GridOptions = {
    rowSelection: {
      mode: "singleRow",
      checkboxes: false,
    },
    onRowClicked: (event) => {
      if (event.data) {
        onRowClick(event.data as AuditLog)
      }
    },
    pagination: true,
    paginationPageSize: 20,
    paginationPageSizeSelector: [20, 50, 100],
    domLayout: "normal",
    rowHeight: 52,
    headerHeight: 48,
    overlayNoRowsTemplate: '<div class="flex flex-col items-center justify-center p-8 text-center space-y-3"><h3 class="font-semibold text-lg">No audit records found</h3><p class="text-sm text-muted-foreground">Try adjusting your filters.</p></div>'
  }

  return (
    <div className="ag-theme-quartz" style={{ height: "100%", width: "100%" }}>
      <AgGridReact
        theme="legacy"
        rowData={logs}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        gridOptions={gridOptions}
        animateRows={false}
      />
    </div>
  )
}
