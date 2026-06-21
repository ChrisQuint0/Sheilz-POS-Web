"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, RefreshCw, FileImage, BarChart3, CalendarDays } from "lucide-react";

interface AnalyticsFiltersProps {
  onExportExcel: () => void;
  onExportCharts: () => void;
  onRefresh: () => void;
}

export function AnalyticsFilters({ onExportExcel, onExportCharts, onRefresh }: AnalyticsFiltersProps) {
  return (
    <div className="flex flex-col gap-5 mb-8">
      {/* Header — matches dashboard style */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#C2456A]/10">
        <div>
          <p className="text-xs font-medium text-[#C2456A] uppercase tracking-widest mb-1">
            Business Intelligence
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Analytics <BarChart3 className="h-7 w-7 text-[#C2456A]" />
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor sales performance, customer behavior, inventory trends, and operational insights.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Button variant="outline" size="sm" onClick={onExportExcel} className="bg-background shadow-sm">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
          <Button variant="outline" size="sm" onClick={onExportCharts} className="bg-background shadow-sm">
            <FileImage className="mr-2 h-4 w-4" />
            Export Charts
          </Button>
          <Button variant="outline" size="sm" onClick={onRefresh} className="bg-background shadow-sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-end gap-4 p-4 bg-card rounded-xl border shadow-sm">
        <div className="flex flex-col gap-1.5 flex-[2] min-w-[320px]">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            Date Range
          </label>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">From</span>
              <Input type="date" className="h-9 w-[140px] px-2.5 py-1 text-sm shadow-sm" />
            </div>
            <span className="text-muted-foreground/40">—</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">To</span>
              <Input type="date" className="h-9 w-[140px] px-2.5 py-1 text-sm shadow-sm" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</label>
          <Select defaultValue="all">
            <SelectTrigger className="shadow-sm">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="coffee">Coffee</SelectItem>
              <SelectItem value="non-coffee">Non-Coffee</SelectItem>
              <SelectItem value="tea">Tea</SelectItem>
              <SelectItem value="pastries">Pastries</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment Method</label>
          <Select defaultValue="all">
            <SelectTrigger className="shadow-sm">
              <SelectValue placeholder="Select payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="gcash">GCash</SelectItem>
              <SelectItem value="maya">Maya</SelectItem>
              <SelectItem value="bpi">BPI</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cashier</label>
          <Select defaultValue="all">
            <SelectTrigger className="shadow-sm">
              <SelectValue placeholder="Select cashier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cashiers</SelectItem>
              <SelectItem value="sarah">Sarah</SelectItem>
              <SelectItem value="mike">Mike</SelectItem>
              <SelectItem value="alex">Alex</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
