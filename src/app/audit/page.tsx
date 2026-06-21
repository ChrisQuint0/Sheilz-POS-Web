"use client"

import React, { useState, useMemo, useEffect } from "react"
import { MOCK_AUDIT_LOGS, AuditLog, AuditSeverity, AuditCategory } from "./data"
import { AuditDesktopGrid } from "./components/audit-desktop-grid"
import { AuditMobileList } from "./components/audit-mobile-list"
import { AuditDetailsDrawer } from "./components/audit-details-drawer"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Download, RefreshCw, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import * as XLSX from "xlsx"

type DatePreset = "All" | "Today" | "Yesterday" | "Last 7 Days" | "Last 30 Days" | "This Month" | "Custom"

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>(MOCK_AUDIT_LOGS)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [datePreset, setDatePreset] = useState<DatePreset>("All")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [userFilter, setUserFilter] = useState<string>("All")
  const [categoryFilter, setCategoryFilter] = useState<string>("All")
  const [actionFilter, setActionFilter] = useState<string>("All")
  const [severityFilter, setSeverityFilter] = useState<string>("All")
  
  // Drawer State
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const handleLogSelect = (log: AuditLog) => {
    setSelectedLog(log)
    setIsDrawerOpen(true)
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    // Simulate network delay
    setTimeout(() => {
      setLogs([...MOCK_AUDIT_LOGS]) // Re-trigger render
      setIsRefreshing(false)
    }, 500)
  }

  const handleExport = (format: "csv" | "xlsx") => {
    const dataToExport = filteredLogs.map(log => ({
      Timestamp: new Date(log.timestamp).toLocaleString(),
      User: log.user.name,
      Category: log.category,
      Action: log.action,
      Target: log.target ? `${log.target.type}: ${log.target.name} (${log.target.id})` : "-",
      Severity: log.severity
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Logs")
    
    XLSX.writeFile(workbook, `audit_logs_${new Date().toISOString().split('T')[0]}.${format}`)
  }

  // Derived options for filters
  const uniqueUsers = useMemo(() => Array.from(new Set(logs.map(l => l.user.name))), [logs])
  const uniqueCategories = useMemo(() => Array.from(new Set(logs.map(l => l.category))), [logs])
  const uniqueActions = useMemo(() => Array.from(new Set(logs.map(l => l.action))), [logs])
  const uniqueSeverities = useMemo(() => Array.from(new Set(logs.map(l => l.severity))), [logs])

  // Filtering Logic
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // 1. Search Query
      const q = searchQuery.toLowerCase()
      const matchesSearch = !q || (
        log.user.name.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.category.toLowerCase().includes(q) ||
        (log.target && (log.target.name.toLowerCase().includes(q) || log.target.id.toLowerCase().includes(q)))
      )

      // 2. Exact Filters
      const matchesUser = userFilter === "All" || log.user.name === userFilter
      const matchesCategory = categoryFilter === "All" || log.category === categoryFilter
      const matchesAction = actionFilter === "All" || log.action === actionFilter
      const matchesSeverity = severityFilter === "All" || log.severity === severityFilter

      // 3. Date Filters
      let matchesDate = true
      const logDate = new Date(log.timestamp)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      if (datePreset === "Today") {
        matchesDate = logDate >= today
      } else if (datePreset === "Yesterday") {
        matchesDate = logDate >= yesterday && logDate < today
      } else if (datePreset === "Last 7 Days") {
        const last7 = new Date(today)
        last7.setDate(last7.getDate() - 7)
        matchesDate = logDate >= last7
      } else if (datePreset === "Last 30 Days") {
        const last30 = new Date(today)
        last30.setDate(last30.getDate() - 30)
        matchesDate = logDate >= last30
      } else if (datePreset === "This Month") {
        matchesDate = logDate.getMonth() === today.getMonth() && logDate.getFullYear() === today.getFullYear()
      } else if (datePreset === "Custom") {
        if (customStartDate) {
          matchesDate = matchesDate && logDate >= new Date(customStartDate)
        }
        if (customEndDate) {
          const end = new Date(customEndDate)
          end.setHours(23, 59, 59, 999)
          matchesDate = matchesDate && logDate <= end
        }
      }

      return matchesSearch && matchesUser && matchesCategory && matchesAction && matchesSeverity && matchesDate
    })
  }, [logs, searchQuery, userFilter, categoryFilter, actionFilter, severityFilter, datePreset, customStartDate, customEndDate])

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
            <Button variant="outline" className="flex-1 md:flex-none" onClick={() => handleExport("csv")}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button className="flex-1 md:flex-none" onClick={() => handleExport("xlsx")}>
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
                placeholder="Search user, action, target, or record ID..."
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
            
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-auto h-8 text-xs">
                <SelectValue placeholder="User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Users</SelectItem>
                {uniqueUsers.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-auto h-8 text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {uniqueCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-auto h-8 text-xs">
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Actions</SelectItem>
                {uniqueActions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-auto h-8 text-xs">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Severities</SelectItem>
                {uniqueSeverities.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 pt-2 overflow-hidden flex flex-col">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center border rounded-lg bg-card shadow-sm p-8">
            <h3 className="text-lg font-medium text-foreground">No audit records found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              System activity will appear here once users begin interacting with the platform. Try adjusting your filters if you're looking for specific events.
            </p>
          </div>
        ) : (
        <>
          {/* Desktop Grid (AG Grid) */}
          <div className="hidden lg:block flex-1 min-h-[500px] w-full border rounded-lg overflow-hidden shadow-sm">
            <AuditDesktopGrid 
              logs={filteredLogs} 
              onRowClick={handleLogSelect}
            />
          </div>
          
          {/* Mobile Cards List */}
          <div className="block lg:hidden flex-1 overflow-y-auto pb-6">
            <div className="text-sm text-muted-foreground mb-4">
              Showing {filteredLogs.length} audit logs
            </div>
            <AuditMobileList 
              logs={filteredLogs} 
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
