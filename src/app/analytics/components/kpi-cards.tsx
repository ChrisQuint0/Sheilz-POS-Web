"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, CreditCard, PackageMinus, TrendingUp, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { useAnalytics } from "../analytics-context";

export function KpiCards() {
  const { data, loading, filters } = useAnalytics();
  const kpis = data.kpis;
  const isAllTime = !filters.dateFrom || !filters.dateTo;

  const renderTrend = (change: number) => {
    if (change === 0) {
      return (
        <span className="flex items-center text-xs font-semibold rounded-full px-2 py-0.5 bg-gray-100 text-gray-600">
          0%
        </span>
      );
    }
    const isPositive = change > 0;
    const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
    const colorClass = isPositive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700";
    const whiteColorClass = isPositive ? "bg-white/20 text-white" : "bg-white/20 text-white";

    return (
      <span className={`flex items-center text-xs font-semibold rounded-full px-2 py-0.5 ${colorClass}`}>
        <Icon className="h-3 w-3 mr-0.5" />
        {isPositive ? "+" : ""}{change}%
      </span>
    );
  };

  const renderWhiteTrend = (change: number) => {
    if (change === 0) {
      return (
        <span className="flex items-center text-xs font-semibold bg-white/20 text-white rounded-full px-2 py-0.5">
          0%
        </span>
      );
    }
    const isPositive = change > 0;
    const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
    
    return (
      <span className="flex items-center text-xs font-semibold bg-white/20 text-white rounded-full px-2 py-0.5">
        <Icon className="h-3 w-3 mr-0.5" />
        {isPositive ? "+" : ""}{change}%
      </span>
    );
  };

  const formatCurrency = (value: number) => {
    const parts = value.toFixed(2).split(".");
    return {
      whole: Number(parts[0]).toLocaleString("en-US"),
      fraction: `.${parts[1]}`
    };
  };

  if (loading || !kpis) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="shadow-sm h-[120px] flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/50" />
          </Card>
        ))}
      </div>
    );
  }

  const revenueFmt = formatCurrency(kpis.total_revenue);
  const aovFmt = formatCurrency(kpis.avg_order_value);
  const expensesFmt = formatCurrency(kpis.inventory_expenses);
  const netRevenueFmt = formatCurrency(kpis.net_revenue);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {/* Hero card — Total Revenue with brand treatment */}
      <Card className="shadow-sm bg-[#C2456A] border-[#C2456A] text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="text-xs font-medium text-white/70">
            Total Revenue
          </CardTitle>
          <div className="bg-white/15 w-7 h-7 rounded-md flex items-center justify-center">
            <span className="text-white text-sm font-bold leading-none">₱</span>
          </div>
        </CardHeader>
        <CardContent className="pt-1">
          <div className="text-3xl font-bold tracking-tight leading-none mb-2">
            {revenueFmt.whole}
            <span className="text-lg font-normal opacity-70">{revenueFmt.fraction}</span>
          </div>
          {!isAllTime && (
            <div className="flex items-center gap-1.5 mt-1">
              {renderWhiteTrend(kpis.revenue_change)}
              <span className="text-xs text-white/60">vs. previous</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total Orders */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Total Orders
          </CardTitle>
          <div className="bg-muted w-7 h-7 rounded-md flex items-center justify-center">
            <ShoppingBag className="h-4 w-4 text-foreground/70" />
          </div>
        </CardHeader>
        <CardContent className="pt-1">
          <div className="text-3xl font-bold tracking-tight leading-none mb-2">
            {kpis.total_orders.toLocaleString("en-US")}
          </div>
          {!isAllTime && (
            <div className="flex items-center gap-1.5 mt-1">
              {renderTrend(kpis.orders_change)}
              <span className="text-xs text-muted-foreground">vs. previous</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Average Order Value */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Avg. Order Value
          </CardTitle>
          <div className="bg-muted w-7 h-7 rounded-md flex items-center justify-center">
            <CreditCard className="h-4 w-4 text-foreground/70" />
          </div>
        </CardHeader>
        <CardContent className="pt-1">
          <div className="text-3xl font-bold tracking-tight leading-none mb-2">
            {aovFmt.whole}
            <span className="text-lg font-normal text-muted-foreground">{aovFmt.fraction}</span>
          </div>
          {!isAllTime && (
            <div className="flex items-center gap-1.5 mt-1">
              {renderTrend(kpis.aov_change)}
              <span className="text-xs text-muted-foreground">vs. previous</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inventory Expenses */}
      <Card className="shadow-sm border-amber-200 bg-amber-50/60">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="text-xs font-medium text-amber-700">
            Inventory Delivery Expenses
          </CardTitle>
          <div className="bg-amber-100 w-7 h-7 rounded-md flex items-center justify-center">
            <PackageMinus className="h-4 w-4 text-amber-600" />
          </div>
        </CardHeader>
        <CardContent className="pt-1">
          <div className="text-3xl font-bold tracking-tight leading-none text-amber-800 mb-2">
            {expensesFmt.whole}
            <span className="text-lg font-normal opacity-60">{expensesFmt.fraction}</span>
          </div>
          <p className="text-xs text-amber-600/80 font-medium mt-1">
            For selected period
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
