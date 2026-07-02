"use client"

import React, { useState, useCallback, useEffect, useRef } from "react"
import { AuditLog, AUDIT_CATEGORIES, AUDIT_ACTIONS, AUDIT_SEVERITIES } from "./data"
import { fetchAuditLogs, fetchAuditUsers, type AuditFilters } from "./actions"
import { AuditDesktopGrid } from "./components/audit-desktop-grid"
import { AuditMobileList } from "./components/audit-mobile-list"
import { AuditDetailsDrawer } from "./components/audit-details-drawer"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Download, RefreshCw, Filter, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import * as XLSX from "xlsx"

type DatePreset = "All" | "Today" | "Yesterday" | "Last 7 Days" | "Last 30 Days" | "This Month" | "Custom"

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
  const [userFilter, setUserFilter] = useState<string>("All")
  const [categoryFilter, setCategoryFilter] = useState<string>("All")
  const [actionFilter, setActionFilter] = useState<string>("All")
  const [severityFilter, setSeverityFilter] = useState<string>("All")

  // User list for filter dropdown
  const [userOptions, setUserOptions] = useState<{ id: string; name: string }[]>([])

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
      category: categoryFilter !== "All" ? categoryFilter : undefined,
      action: actionFilter !== "All" ? actionFilter : undefined,
      severity: severityFilter !== "All" ? severityFilter : undefined,
      userId: userFilter !== "All" ? userFilter : undefined,
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

  const handleExport = (format: "csv" | "xlsx") => {
    const dataToExport = logs.map(log => ({
      Timestamp: new Date(log.created_at).toLocaleString(),
      User: log.user_name,
      Role: log.user_role,
      Category: log.category,
      Action: log.action,
      Target: log.target_name ? `${log.target_type}: ${log.target_name}` : "-",
      "Target ID": log.target_id ?? "-",
      Severity: log.severity,
      "IP Address": log.ip_address ?? "-",
      Device: log.device ?? "-",
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Logs")

    XLSX.writeFile(workbook, `audit_logs_${new Date().toISOString().split('T')[0]}.${format}`)
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Audit Logs</h1>
          <p className="text-sm text-muted-foreground">Review historical system activity, security events, and business-critical changes.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Logs
          </Button>
          <div className="flex gap-2 flex-1 md:flex-none">
            <Button variant="outline" className="flex-1 md:flex-none" onClick={() => handleExport("csv")} disabled={logs.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button className="flex-1 md:flex-none" onClick={() => handleExport("xlsx")} disabled={logs.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
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

            <Select value={userFilter} onValueChange={(val) => setUserFilter(val ?? 'All')}>
              <SelectTrigger className="w-auto h-8 text-xs">
                <SelectValue placeholder="User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Users</SelectItem>
                {userOptions.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val ?? 'All')}>
              <SelectTrigger className="w-auto h-8 text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {AUDIT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={actionFilter} onValueChange={(val) => setActionFilter(val ?? 'All')}>
              <SelectTrigger className="w-auto h-8 text-xs">
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Actions</SelectItem>
                {AUDIT_ACTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={severityFilter} onValueChange={(val) => setSeverityFilter(val ?? 'All')}>
              <SelectTrigger className="w-auto h-8 text-xs">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Severities</SelectItem>
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
    </div>
  )
}
