"use client"

import React, { useMemo, useRef, useCallback } from "react"
import { AgGridReact } from "ag-grid-react"
import { ColDef, ModuleRegistry, RowClickedEvent, CellValueChangedEvent, AllCommunityModule } from "ag-grid-community"
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'
import { User, Role, Status } from "../data"
import Image from "next/image"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

ModuleRegistry.registerModules([AllCommunityModule])

interface TeamDesktopGridProps {
  users: User[]
  onRowClick: (user: User) => void
  onUpdateUser: (user: User) => void
}

export function TeamDesktopGrid({ users, onRowClick, onUpdateUser }: TeamDesktopGridProps) {
  const gridRef = useRef<AgGridReact>(null)

  const defaultColDef = useMemo<ColDef>(() => {
    return {
      flex: 1,
      minWidth: 150,
      filter: true,
      sortable: true,
      resizable: true,
    }
  }, [])

  const handleCellValueChanged = useCallback((event: CellValueChangedEvent) => {
    onUpdateUser(event.data as User)
  }, [onUpdateUser])

  const columnDefs = useMemo<ColDef[]>(() => [
    {
      field: "displayName",
      headerName: "Team Member",
      editable: true,
      cellRenderer: (params: any) => {
        const user = params.data as User
        return (
          <div className="flex items-center gap-3 h-full">
            <div className="relative h-8 w-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
              {user.avatar ? (
                <Image src={user.avatar} alt={user.displayName} fill sizes="32px" className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-medium text-muted-foreground bg-primary/10">
                  {user.displayName.charAt(0)}
                </div>
              )}
            </div>
            <span className="font-medium">{params.value}</span>
          </div>
        )
      }
    },
    {
      field: "email",
      headerName: "Email",
      editable: true,
    },
    {
      field: "role",
      headerName: "Role",
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['Administrator', 'Manager', 'Cashier'],
      },
      cellRenderer: (params: any) => {
        const role = params.value as Role
        const colors = {
          Administrator: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
          Manager: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
          Cashier: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
        }
        return (
          <div className="flex items-center h-full">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[role] || "bg-gray-100 text-gray-800"}`}>
              {role}
            </span>
          </div>
        )
      }
    },
    {
      field: "status",
      headerName: "Status",
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['Active', 'Inactive'],
      },
      cellRenderer: (params: any) => {
        const status = params.value as Status
        return (
          <div className="flex items-center h-full">
             <Badge variant={status === "Active" ? "default" : "secondary"}>{status}</Badge>
          </div>
        )
      }
    },
    {
      field: "lastLogin",
      headerName: "Last Login",
      editable: false,
      valueFormatter: (params) => {
        if (!params.value) return "Never"
        return format(new Date(params.value), "MMM d, yyyy • h:mm a")
      }
    }
  ], [])

  return (
    <div className="ag-theme-quartz w-full h-full">
      <AgGridReact
        ref={gridRef}
        theme="legacy"
        modules={[AllCommunityModule]}
        rowData={users}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        rowSelection="multiple"
        onRowClicked={(e: RowClickedEvent) => onRowClick(e.data as User)}
        onCellValueChanged={handleCellValueChanged}
        pagination={true}
        paginationPageSize={20}
        paginationPageSizeSelector={[10, 20, 50, 100]}
        domLayout="normal"
      />
    </div>
  )
}
