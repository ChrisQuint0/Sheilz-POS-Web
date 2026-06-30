"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingBag,
  CreditCard,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Coffee,
  Download,
  RefreshCw,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { createClient } from "@/app/lib/supabase/client";
import { useProfile } from "@/components/profile-provider";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardKpis {
  today_revenue: number;
  today_orders: number;
  today_avg_order: number;
  yesterday_revenue: number;
  yesterday_orders: number;
  yesterday_avg_order: number;
  revenue_change: number;
  orders_change: number;
  aov_change: number;
}

interface RevenueTrendDay {
  day_label: string;
  day_date: string;
  total_revenue: number;
}

interface LowStockItem {
  item_id: string;
  item_name: string;
  category_name: string;
  current_stock: number;
  low_stock_threshold: number;
  unit: string;
}

interface AuditLogEntry {
  id: string;
  user_name: string;
  user_role: string;
  category: string;
  action: string;
  target_name: string | null;
  target_type: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

// ─── Chart Options ────────────────────────────────────────────────────────────

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#3a2b27",
      titleColor: "#f5ede8",
      bodyColor: "#f5ede8",
      padding: 10,
      cornerRadius: 8,
      callbacks: {
        label: (ctx: any) =>
          ` ₱${ctx.parsed.y.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: "rgba(194,69,106,0.06)" },
      border: { display: false },
      ticks: {
        callback: (value: any) => `₱${(value / 1000).toFixed(0)}k`,
        color: "#826f69",
        font: { size: 11 },
      },
    },
    x: {
      grid: { display: false },
      ticks: { color: "#826f69", font: { size: 11 } },
    },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stockSeverity(stock: number, threshold: number) {
  const ratio = stock / threshold;
  if (ratio <= 0.25) return "critical";
  if (ratio <= 0.5) return "low";
  return "ok";
}

const severityBar: Record<string, string> = {
  critical: "bg-destructive",
  low: "bg-amber-400",
  ok: "bg-chart-3",
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getTodayLabel() {
  return new Date().toLocaleDateString("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;

  return date.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const categoryColors: Record<string, string> = {
  Sales: "bg-[#fbe4ea] text-[#C2456A]",
  Inventory: "bg-[#fce5d2] text-[#e08a4f]",
  Products: "bg-[#e8f4e8] text-[#4f9a5c]",
  Authentication: "bg-[#e0e7ff] text-[#6366f1]",
  "Team Management": "bg-[#dbeafe] text-[#3b82f6]",
  Analytics: "bg-[#fef3c7] text-[#d97706]",
  System: "bg-[#f1f5f9] text-[#64748b]",
};

function formatCurrency(value: number): { whole: string; decimal: string } {
  const formatted = value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const parts = formatted.split(".");
  return { whole: parts[0], decimal: `.${parts[1]}` };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { profile } = useProfile();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrendDay[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [stockAlertCount, setStockAlertCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState<AuditLogEntry[]>([]);
  const [exporting, setExporting] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      const [kpisRes, trendRes, lowStockRes, alertCountRes, activityRes] =
        await Promise.all([
          supabase.rpc("get_dashboard_kpis"),
          supabase.rpc("get_dashboard_revenue_trend"),
          supabase.rpc("get_low_stock_items", { p_limit: 3 }),
          supabase.rpc("get_stock_alert_count"),
          supabase
            .from("audit_logs")
            .select(
              "id, user_name, user_role, category, action, target_name, target_type, details, created_at",
            )
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

      if (kpisRes.data) setKpis(kpisRes.data as DashboardKpis);
      if (trendRes.data) setRevenueTrend(trendRes.data as RevenueTrendDay[]);
      if (lowStockRes.data) setLowStockItems(lowStockRes.data as LowStockItem[]);
      if (alertCountRes.data !== null && alertCountRes.data !== undefined)
        setStockAlertCount(alertCountRes.data as number);
      if (activityRes.data) setRecentActivity(activityRes.data as AuditLogEntry[]);

      // Log errors for debugging
      if (kpisRes.error) console.error("KPIs error:", kpisRes.error);
      if (trendRes.error) console.error("Revenue trend error:", trendRes.error);
      if (lowStockRes.error) console.error("Low stock error:", lowStockRes.error);
      if (alertCountRes.error) console.error("Alert count error:", alertCountRes.error);
      if (activityRes.error) console.error("Activity error:", activityRes.error);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Build chart data from revenue trend
  const chartData = {
    labels: revenueTrend.map((d) => d.day_label),
    datasets: [
      {
        fill: true,
        label: "Revenue",
        data: revenueTrend.map((d) => Number(d.total_revenue)),
        borderColor: "#C2456A",
        backgroundColor: "rgba(194, 69, 106, 0.12)",
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: "#C2456A",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
      },
    ],
  };

  // Find peak day
  const peakDay = revenueTrend.reduce<RevenueTrendDay | null>(
    (max, d) => (!max || Number(d.total_revenue) > Number(max.total_revenue) ? d : max),
    null,
  );

  const handleRestrictedLinkClick = (e: React.MouseEvent, path: string) => {
    if (profile?.role === "Cashier") {
      e.preventDefault();
      toast.error("Insufficient Privileges: Your account does not have access to this section.");
      return;
    }
    if (profile?.role === "Manager" && path === "/audit") {
      e.preventDefault();
      toast.error("Insufficient Privileges: Your account does not have access to this section.");
    }
  };

  // Export handler
  const handleExport = async () => {
    setExporting(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(
        `/api/export-sales?startDate=${today}&endDate=${today}&preset=Today`,
      );
      if (!res.ok) {
        // If no data found or error, show alert
        const msg = await res.json().catch(() => ({}));
        toast.error(msg.message || msg.error || "Export failed");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Dashboard_Export_${today}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // Display name
  const displayName = profile?.display_name
    ? profile.display_name.split(" ")[0]
    : "there";

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-6 border-b border-[#C2456A]/10">
        <div>
          <p className="text-xs font-medium text-[#C2456A] uppercase tracking-widest mb-1">
            {getTodayLabel()}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            {getGreeting()}, {displayName}{" "}
            <Coffee className="h-7 w-7 text-[#C2456A]" />
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here&apos;s how the store is doing today.
          </p>
        </div>
        <div className="flex gap-2 shrink-0 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            disabled={loading}
            className="bg-background"
          >
            <RefreshCw
              className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            variant="outline"
            className="bg-background"
            onClick={handleExport}
            disabled={exporting}
          >
            <Download className={`h-4 w-4 mr-1.5 ${exporting ? "animate-pulse" : ""}`} />
            {exporting ? "Exporting..." : "Export Data"}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {/* Total Revenue */}
        <Card className="shadow-sm lg:col-span-1 bg-[#C2456A] border-[#C2456A] text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-white/70">
              Total Revenue
            </CardTitle>
            <div className="bg-white/15 p-1.5 rounded-md">
              <span className="text-white text-sm font-bold">₱</span>
            </div>
          </CardHeader>
          <CardContent className="pt-1">
            {loading ? (
              <>
                <Skeleton className="h-10 w-36 mb-2 bg-white/20" />
                <Skeleton className="h-5 w-28 bg-white/20" />
              </>
            ) : (
              <>
                <div className="text-4xl font-bold tracking-tight leading-none mb-2">
                  {formatCurrency(kpis?.today_revenue ?? 0).whole}
                  <span className="text-xl font-normal opacity-70">
                    {formatCurrency(kpis?.today_revenue ?? 0).decimal}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="flex items-center text-xs font-semibold bg-white/20 text-white rounded-full px-2 py-0.5">
                    {(kpis?.revenue_change ?? 0) >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 mr-0.5" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 mr-0.5" />
                    )}
                    {(kpis?.revenue_change ?? 0) >= 0 ? "+" : ""}
                    {kpis?.revenue_change ?? 0}%
                  </span>
                  <span className="text-xs text-white/60">vs. yesterday</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Orders Today */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Orders Today
            </CardTitle>
            <div className="bg-muted p-1.5 rounded-md">
              <ShoppingBag className="h-4 w-4 text-foreground/70" />
            </div>
          </CardHeader>
          <CardContent className="pt-1">
            {loading ? (
              <>
                <Skeleton className="h-10 w-20 mb-2" />
                <Skeleton className="h-5 w-32" />
              </>
            ) : (
              <>
                <div className="text-4xl font-bold tracking-tight leading-none mb-2">
                  {kpis?.today_orders ?? 0}
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`flex items-center text-xs font-semibold rounded-full px-2 py-0.5 ${(kpis?.orders_change ?? 0) >= 0
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-600"
                      }`}
                  >
                    {(kpis?.orders_change ?? 0) >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 mr-0.5" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 mr-0.5" />
                    )}
                    {(kpis?.orders_change ?? 0) >= 0 ? "+" : ""}
                    {kpis?.orders_change ?? 0}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    vs. {kpis?.yesterday_orders ?? 0} yesterday
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Avg. Order Value */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Avg. Order Value
            </CardTitle>
            <div className="bg-muted p-1.5 rounded-md">
              <CreditCard className="h-4 w-4 text-foreground/70" />
            </div>
          </CardHeader>
          <CardContent className="pt-1">
            {loading ? (
              <>
                <Skeleton className="h-10 w-28 mb-2" />
                <Skeleton className="h-5 w-36" />
              </>
            ) : (
              <>
                <div className="text-4xl font-bold tracking-tight leading-none mb-2">
                  {formatCurrency(kpis?.today_avg_order ?? 0).whole}
                  <span className="text-xl font-normal text-muted-foreground">
                    {formatCurrency(kpis?.today_avg_order ?? 0).decimal}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`flex items-center text-xs font-semibold rounded-full px-2 py-0.5 ${(kpis?.aov_change ?? 0) >= 0
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-600"
                      }`}
                  >
                    {(kpis?.aov_change ?? 0) >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 mr-0.5" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 mr-0.5" />
                    )}
                    {(kpis?.aov_change ?? 0) >= 0 ? "+" : ""}
                    {kpis?.aov_change ?? 0}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    vs. ₱
                    {(kpis?.yesterday_avg_order ?? 0).toLocaleString("en-PH", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}{" "}
                    yesterday
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Stock Alerts */}
        <Card className="shadow-sm border-amber-200 bg-amber-50/60 dark:bg-amber-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Stock Alerts
            </CardTitle>
            <div className="bg-amber-100 dark:bg-amber-900/40 p-1.5 rounded-md">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-1">
            {loading ? (
              <>
                <Skeleton className="h-10 w-12 mb-2 bg-amber-200/50" />
                <Skeleton className="h-4 w-28 bg-amber-200/50" />
              </>
            ) : (
              <>
                <div className="text-4xl font-bold tracking-tight leading-none text-amber-800 dark:text-amber-300 mb-2">
                  {stockAlertCount}
                </div>
                <Link
                  href="/inventory"
                  onClick={(e) => handleRestrictedLinkClick(e, "/inventory")}
                  className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:text-amber-900 underline underline-offset-2 bg-transparent border-none p-0 cursor-pointer"
                >
                  View affected items →
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Revenue Chart */}
        <Card className="shadow-sm lg:col-span-2 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold">
                Revenue Trend
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                This week · PHP
              </p>
            </div>
            {!loading && peakDay && Number(peakDay.total_revenue) > 0 && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Peak day</p>
                <p className="text-sm font-semibold text-foreground">
                  {peakDay.day_label} · ₱
                  {Number(peakDay.total_revenue).toLocaleString("en-PH", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            )}
          </CardHeader>
          <CardContent className="flex-1 min-h-[280px]">
            {loading ? (
              <div className="flex flex-col justify-end h-full gap-2 pb-6">
                <div className="flex items-end gap-3 h-full">
                  {[40, 55, 70, 60, 80, 90, 75].map((h, i) => (
                    <Skeleton
                      key={i}
                      className="flex-1 rounded-t-sm"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="flex gap-3">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} className="flex-1 h-3" />
                  ))}
                </div>
              </div>
            ) : revenueTrend.length > 0 ? (
              <Line data={chartData} options={chartOptions as any} />
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                No revenue data for this week yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Recent Activity */}
          <Card className="shadow-sm flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((entry) => {
                    const colorClass =
                      categoryColors[entry.category] || categoryColors.System;
                    return (
                      <div key={entry.id} className="flex items-start gap-3">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-semibold text-xs ${colorClass}`}
                        >
                          {getInitials(entry.user_name)}
                        </div>
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <p className="text-sm font-medium leading-snug">
                            {entry.user_name}{" "}
                            <span className="font-normal text-muted-foreground">
                              {entry.action}
                            </span>
                          </p>
                          {entry.target_name && (
                            <p className="text-xs text-muted-foreground truncate">
                              {entry.target_type
                                ? `${entry.target_type}: `
                                : ""}
                              {entry.target_name}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground/50">
                            {timeAgo(entry.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activity yet.
                </p>
              )}
              <div className="mt-5 pt-4 border-t border-border">
                <Button
                  variant="link"
                  className="text-sm text-primary hover:text-primary/80 p-0 h-auto w-full justify-center"
                  render={<Link href="/audit" onClick={(e) => handleRestrictedLinkClick(e, "/audit")} />}
                >
                  View all activity
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Items */}
          <Card id="low-stock" className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                Low Stock
              </CardTitle>
              <Button
                variant="link"
                className="text-xs text-primary p-0 h-auto"
                render={<Link href="/inventory" onClick={(e) => handleRestrictedLinkClick(e, "/inventory")} />}
              >
                Manage →
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                      <Skeleton className="h-2 w-full rounded-full" />
                    </div>
                  ))}
                </div>
              ) : lowStockItems.length > 0 ? (
                <div className="space-y-4">
                  {lowStockItems.map((item) => {
                    const severity = stockSeverity(
                      item.current_stock,
                      item.low_stock_threshold,
                    );
                    const pct = Math.round(
                      (item.current_stock / item.low_stock_threshold) * 100,
                    );

                    return (
                      <div key={item.item_id}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">{item.item_name}</p>
                          <span className="text-sm font-bold tabular-nums">
                            {item.current_stock}
                            <span className="text-xs font-normal text-muted-foreground">
                              /{item.low_stock_threshold} {item.unit}
                            </span>
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${severityBar[severity]}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  All items are well-stocked! 🎉
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
