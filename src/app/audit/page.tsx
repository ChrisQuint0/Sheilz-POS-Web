"use client"

import React, { useState, useCallback, useEffect, useRef } from "react"
import { AuditLog, AUDIT_CATEGORIES, AUDIT_ACTIONS, AUDIT_SEVERITIES } from "./data"
import { fetchAuditLogs, fetchAuditUsers, logAppEvent, type AuditFilters } from "./actions"
import { toast } from "sonner"
import { AuditDesktopGrid } from "./components/audit-desktop-grid"
import { AuditMobileList } from "./components/audit-mobile-list"
import { AuditDetailsDrawer } from "./components/audit-details-drawer"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Download, RefreshCw, Filter, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ExportModal, type ExportDatePreset } from "./components/export-modal"
import { exportAuditToExcel } from "./export-excel"
import { exportAuditToCSV } from "./export-csv"

type DatePreset = "All" | "Today" | "Yesterday" | "Last 7 Days" | "Last 30 Days" | "Last 90 Days" | "This Month" | "Custom"

export default function AuditPage() {
  // Data state
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [datePreset, setDatePreset] = useState<DatePreset>("All")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [userFilter, setUserFilter] = useState<string>("All Users")
  const [categoryFilter, setCategoryFilter] = useState<string>("All Categories")
  const [actionFilter, setActionFilter] = useState<string>("All Actions")
  const [severityFilter, setSeverityFilter] = useState<string>("All Severities")

  // User list for filter dropdown
  const [userOptions, setUserOptions] = useState<{ id: string; name: string }[]>([])

  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<"csv" | "xlsx" | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  // Drawer State
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Debounce timer for search
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [debouncedSearch, setDebouncedSearch] = useState("")

  // Debounce search input
  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current)
    }
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 400)
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    }
  }, [searchQuery])

  // Build filters object
  const buildFilters = useCallback((): AuditFilters => {
    return {
      search: debouncedSearch || undefined,
      category: categoryFilter !== "All Categories" ? categoryFilter : undefined,
      action: actionFilter !== "All Actions" ? actionFilter : undefined,
      severity: severityFilter !== "All Severities" ? severityFilter : undefined,
      userId: userFilter !== "All Users" ? userFilter : undefined,
      datePreset: datePreset !== "All" ? datePreset : undefined,
      customStartDate: datePreset === "Custom" ? customStartDate : undefined,
      customEndDate: datePreset === "Custom" ? customEndDate : undefined,
      page: 1,
      pageSize: 500, // AG Grid handles client-side pagination from this set
    }
  }, [debouncedSearch, categoryFilter, actionFilter, severityFilter, userFilter, datePreset, customStartDate, customEndDate])

  // Fetch data
  const loadLogs = useCallback(async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    setError(null)

    try {
      const result = await fetchAuditLogs(buildFilters())
      if (result.success && result.data) {
        setLogs(result.data.logs)
        setTotalCount(result.data.totalCount)
      } else {
        setError(result.error ?? "Failed to load audit logs.")
      }
    } catch {
      setError("An unexpected error occurred.")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [buildFilters])

  // Fetch users for dropdown
  useEffect(() => {
    async function loadUsers() {
      const result = await fetchAuditUsers()
      if (result.success && result.data) {
        setUserOptions(result.data)
      }
    }
    loadUsers()
  }, [])

  // Load logs on mount and when filters change
  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const handleLogSelect = (log: AuditLog) => {
    setSelectedLog(log)
    setIsDrawerOpen(true)
  }

  const handleRefresh = () => {
    loadLogs(true)
  }

  const handleExportClick = (format: "csv" | "xlsx") => {
    setExportFormat(format)
    setIsExportModalOpen(true)
  }

  const handleExportExecute = async (startDate: string, endDate: string, preset: ExportDatePreset) => {
    setIsExporting(true)
    
    // Create new filters for export overriding the date preset
    const exportFilters: AuditFilters = {
      ...buildFilters(),
      page: 1,
      pageSize: 100000, // fetch as many as possible for export
    }
    
    if (preset === "All Time") {
      exportFilters.datePreset = undefined;
      exportFilters.customStartDate = undefined;
      exportFilters.customEndDate = undefined;
    } else if (preset === "Custom Range") {
      exportFilters.datePreset = "Custom";
      exportFilters.customStartDate = startDate;
      exportFilters.customEndDate = endDate;
    } else {
      // Must map correctly if it's identical strings
      exportFilters.datePreset = preset;
      exportFilters.customStartDate = undefined;
      exportFilters.customEndDate = undefined;
    }

    try {
      const result = await fetchAuditLogs(exportFilters)
      if (result.success && result.data) {
        const isoDate = new Date().toISOString().split("T")[0];
        let filename = `Audit_Logs_${isoDate}.${exportFormat === "xlsx" ? "xlsx" : "csv"}`;
        if (exportFormat === "xlsx") {
          if (exportFilters.category && exportFilters.category !== "All") {
            filename = `Audit_Logs_${exportFilters.category.replace(/\s+/g, "_")}.xlsx`;
          } else if (exportFilters.severity && exportFilters.severity !== "All") {
            filename = `Audit_Logs_${exportFilters.severity}_Severity.xlsx`;
          }
          await exportAuditToExcel(result.data.logs, exportFilters, new Date(), userOptions);
        } else {
          exportAuditToCSV(result.data.logs);
        }

        await logAppEvent('Audit Logs Exported', 'Low', 'Report', filename, {
          metadata: {
            format: exportFormat,
            preset,
            startDate: startDate || null,
            endDate: endDate || null,
            rowCount: result.data.logs.length,
          }
        });

        loadLogs(true);
        toast.success(`Audit logs exported successfully.`);
      } else {
        console.error("Export failed", result.error);
        toast.error("Failed to export audit logs.");
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred during export.");
    } finally {
      setIsExporting(false)
      setIsExportModalOpen(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background">
      {/* Header */}
      <div className="flex flex-col gap-6 p-6 pb-4">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-6 border-b border-[#C2456A]/10">
          <div>
            <p className="text-xs font-medium text-[#C2456A] uppercase tracking-widest mb-1">
              System Monitoring
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Audit Logs
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Review historical system activity, security events, and business-critical changes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button variant="outline" className="bg-background" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Logs
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" className="bg-background" onClick={() => handleExportClick("csv")} disabled={logs.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button onClick={() => handleExportClick("xlsx")} disabled={logs.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="px-6 pb-2">
        <div className="flex flex-col gap-3 bg-card p-3 rounded-lg border shadow-sm">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search user, target, email, or record ID..."
                className="pl-9 h-9 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={datePreset} onValueChange={(val) => setDatePreset(val as DatePreset)}>
              <SelectTrigger className="w-full sm:w-[160px] h-9">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Time</SelectItem>
                <SelectItem value="Today">Today</SelectItem>
                <SelectItem value="Yesterday">Yesterday</SelectItem>
                <SelectItem value="Last 7 Days">Last 7 Days</SelectItem>
                <SelectItem value="Last 30 Days">Last 30 Days</SelectItem>
                <SelectItem value="Last 90 Days">Last 90 Days</SelectItem>
                <SelectItem value="This Month">This Month</SelectItem>
                <SelectItem value="Custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {datePreset === "Custom" && (
              <div className="flex gap-2">
                <Input
                  type="date"
                  className="h-9 w-[130px]"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
                <Input
                  type="date"
                  className="h-9 w-[130px]"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
              <Filter className="h-3 w-3" /> Filters:
            </div>

            <Select value={userFilter} onValueChange={(val) => setUserFilter(val ?? 'All Users')}>
              <SelectTrigger className="w-auto h-8 text-xs">
                <SelectValue placeholder="User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Users">All Users</SelectItem>
                {userOptions.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val ?? 'All Categories')}>
              <SelectTrigger className="w-auto h-8 text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Categories">All Categories</SelectItem>
                {AUDIT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={actionFilter} onValueChange={(val) => setActionFilter(val ?? 'All Actions')}>
              <SelectTrigger className="w-auto h-8 text-xs">
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Actions">All Actions</SelectItem>
                {AUDIT_ACTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={severityFilter} onValueChange={(val) => setSeverityFilter(val ?? 'All Severities')}>
              <SelectTrigger className="w-auto h-8 text-xs">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Severities">All Severities</SelectItem>
                {AUDIT_SEVERITIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 pt-2 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center border rounded-lg bg-card shadow-sm p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Loading audit logs...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center border rounded-lg bg-card shadow-sm p-8">
            <h3 className="text-lg font-medium text-destructive">Error loading logs</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">{error}</p>
            <Button variant="outline" className="mt-4" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center border rounded-lg bg-card shadow-sm p-8">
            <h3 className="text-lg font-medium text-foreground">No audit records found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              System activity will appear here once users begin interacting with the platform. Try adjusting your filters if you&apos;re looking for specific events.
            </p>
          </div>
        ) : (
        <>
          {/* Desktop Grid (AG Grid) */}
          <div className="hidden lg:block flex-1 min-h-[500px] w-full border rounded-lg overflow-hidden shadow-sm">
            <AuditDesktopGrid
              logs={logs}
              onRowClick={handleLogSelect}
            />
          </div>

          {/* Mobile Cards List */}
          <div className="block lg:hidden flex-1 overflow-y-auto pb-6">
            <div className="text-sm text-muted-foreground mb-4">
              Showing {logs.length} of {totalCount} audit logs
            </div>
            <AuditMobileList
              logs={logs}
              onCardClick={handleLogSelect}
            />
          </div>
        </>
      )}
    </div>

      {/* Drawers & Modals */}
      <AuditDetailsDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        log={selectedLog}
      />

      <ExportModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExportExecute}
        isLoading={isExporting}
      />
    </div>
  )
}
