"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShoppingBag,
  CreditCard,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Coffee,
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
);

// ─── Data ─────────────────────────────────────────────────────────────────────

const chartData = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  datasets: [
    {
      fill: true,
      label: "Revenue",
      data: [8200, 9400, 11000, 10500, 12450, 14200, 13100],
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

const recentActivity = [
  {
    id: 1,
    initials: "JT",
    user: "Joshua T.",
    action: "completed 5 orders",
    time: "2 minutes ago",
    detail: "ORD-2026-00480 → 00484",
    count: 5,
    color: "bg-[#fbe4ea] text-[#C2456A]",
  },
  {
    id: 2,
    initials: "MR",
    user: "Maria R.",
    action: "updated inventory",
    time: "14 minutes ago",
    detail: "Caramel Syrup · +48 units",
    count: 1,
    color: "bg-[#fce5d2] text-[#e08a4f]",
  },
  {
    id: 3,
    initials: "AL",
    user: "Admin",
    action: "added a new menu item",
    time: "31 minutes ago",
    detail: "Iced Brown Sugar Latte · ₱185.00",
    count: 1,
    color: "bg-[#e8f4e8] text-[#4f9a5c]",
  },
  {
    id: 4,
    initials: "JT",
    user: "Joshua T.",
    action: "voided an order",
    time: "52 minutes ago",
    detail: "ORD-2026-00471 · ₱340.00",
    count: 1,
    color: "bg-[#fbe4ea] text-[#C2456A]",
  },
];

const lowStockItems = [
  { id: 1, name: "Oat Milk (1L)", sku: "MLK-OAT-1L", stock: 4, threshold: 10 },
  {
    id: 2,
    name: "Brown Sugar Syrup",
    sku: "SYR-BRN-500",
    stock: 2,
    threshold: 8,
  },
  {
    id: 3,
    name: "Cold Brew Concentrate",
    sku: "BRW-CLD-1L",
    stock: 6,
    threshold: 12,
  },
];

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

// ─── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  return (
    <div className="flex flex-col flex-1 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-6 border-b border-[#C2456A]/10">
        <div>
          <p className="text-xs font-medium text-[#C2456A] uppercase tracking-widest mb-1">
            {getTodayLabel()}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            {getGreeting()}, Sheilz <Coffee className="h-7 w-7 text-[#C2456A]" />
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here's how the store is doing today.
          </p>
        </div>
        <Button
          variant="outline"
          className="shrink-0 bg-background self-start sm:self-auto"
        >
          Export Data
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {/* Hero card — Total Revenue gets the brand treatment */}
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
            <div className="text-4xl font-bold tracking-tight leading-none mb-2">
              12,450
              <span className="text-xl font-normal opacity-70">.00</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="flex items-center text-xs font-semibold bg-white/20 text-white rounded-full px-2 py-0.5">
                <ArrowUpRight className="h-3 w-3 mr-0.5" />
                +14.5%
              </span>
              <span className="text-xs text-white/60">vs. yesterday</span>
            </div>
          </CardContent>
        </Card>

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
            <div className="text-4xl font-bold tracking-tight leading-none mb-2">
              142
            </div>
            <div className="flex items-center gap-1.5">
              <span className="flex items-center text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">
                <ArrowUpRight className="h-3 w-3 mr-0.5" />
                +5.2%
              </span>
              <span className="text-xs text-muted-foreground">
                vs. 135 yesterday
              </span>
            </div>
          </CardContent>
        </Card>

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
            <div className="text-4xl font-bold tracking-tight leading-none mb-2">
              340
              <span className="text-xl font-normal text-muted-foreground">
                .00
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="flex items-center text-xs font-semibold bg-red-100 text-red-600 rounded-full px-2 py-0.5">
                <ArrowDownRight className="h-3 w-3 mr-0.5" />
                -2.1%
              </span>
              <span className="text-xs text-muted-foreground">
                vs. ₱347 yesterday
              </span>
            </div>
          </CardContent>
        </Card>

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
            <div className="text-4xl font-bold tracking-tight leading-none text-amber-800 dark:text-amber-300 mb-2">
              3
            </div>
            <button
              className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:text-amber-900 underline underline-offset-2 bg-transparent border-none p-0 cursor-pointer"
              onClick={() =>
                document
                  .getElementById("low-stock")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              View affected items →
            </button>
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
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Peak day</p>
              <p className="text-sm font-semibold text-foreground">
                Saturday · ₱14,200
              </p>
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-[280px]">
            <Line data={chartData} options={chartOptions as any} />
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
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-semibold text-xs ${activity.color}`}
                    >
                      {activity.initials}
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug">
                        {activity.user}{" "}
                        <span className="font-normal text-muted-foreground">
                          {activity.action}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {activity.detail}
                      </p>
                      <p className="text-xs text-muted-foreground/50">
                        {activity.time}
                      </p>
                    </div>
                    {activity.count > 1 && (
                      <span className="shrink-0 text-xs font-semibold px-1.5 py-0.5 rounded-md bg-[#fbe4ea] text-[#C2456A]">
                        ×{activity.count}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-border">
                <Button
                  variant="link"
                  className="text-sm text-primary hover:text-primary/80 p-0 h-auto w-full justify-center"
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
              >
                Manage →
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lowStockItems.map((item) => {
                  const severity = stockSeverity(item.stock, item.threshold);
                  const pct = Math.round((item.stock / item.threshold) * 100);

                  return (
                    <div key={item.id}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">{item.name}</p>
                        <span className="text-sm font-bold tabular-nums">
                          {item.stock}
                          <span className="text-xs font-normal text-muted-foreground">
                            /{item.threshold}
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
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-5 text-xs border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-900 font-medium"
              >
                Reorder all low-stock items
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
