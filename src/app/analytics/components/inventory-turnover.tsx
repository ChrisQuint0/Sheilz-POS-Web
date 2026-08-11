"use client";

import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { defaultChartOptions, chartColors } from "./chart-setup";
import { RefreshCw, Info, TrendingUp, TrendingDown, Minus, Loader2, AlertCircle } from "lucide-react";
import { useAnalytics } from "../analytics-context";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function InventoryTurnover() {
  const { data: analyticsData, loading } = useAnalytics();
  const data = analyticsData.inventoryTurnover;

  if (loading) {
    return (
      <Card className="shadow-sm col-span-full lg:col-span-1 h-[420px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
      </Card>
    );
  }

  // Handle Unavailable state (e.g., if backend returns null/error)
  if (!data) {
    return (
      <Card className="shadow-sm col-span-full lg:col-span-1 h-[420px] flex flex-col items-center justify-center p-6 text-center">
        <RefreshCw className="h-10 w-10 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium text-foreground">Inventory turnover unavailable</h3>
        <p className="text-sm text-muted-foreground max-w-sm mt-2">
          Inventory valuation and product cost data are required to calculate inventory turnover.
        </p>
      </Card>
    );
  }

  // Format currency
  const formatCurrency = (val: number) => `₱${val.toLocaleString()}`;

  // Trend calculations
  const changePercent = data.previousPeriodTurnover && data.turnoverRate !== null
    ? ((data.turnoverRate - data.previousPeriodTurnover) / data.previousPeriodTurnover) * 100 
    : null;
    
  const trendDirection = changePercent !== null 
    ? (changePercent > 0 ? "up" : changePercent < 0 ? "down" : "flat") 
    : null;

  // Chart configuration
  const safeTrend = Array.isArray(data.trend) ? data.trend : [];

  const chartData = {
    labels: safeTrend.map(d => d.label),
    datasets: [
      {
        label: "Turnover Rate",
        data: safeTrend.map(d => d.value),
        borderColor: chartColors.primary,
        backgroundColor: chartColors.primaryLight,
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        pointBackgroundColor: chartColors.primary,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  };

  const chartOptions = {
    ...defaultChartOptions,
    maintainAspectRatio: false,
    layout: {
      padding: { top: 5, bottom: 5, left: 5, right: 5 },
    },
    plugins: {
      ...defaultChartOptions.plugins,
      legend: { display: false },
      tooltip: {
        ...defaultChartOptions.plugins.tooltip,
        callbacks: {
          label: (context: any) => ` Rate: ${context.parsed.y}×`,
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: { display: false },
        border: { display: false },
        ticks: { 
          display: true,
          autoSkip: false,
          color: "#826f69", 
          font: { size: 10 } 
        },
      },
      y: {
        grid: { color: "rgba(194,69,106,0.06)" },
        border: { display: false },
        ticks: { color: "#826f69", font: { size: 10 }, stepSize: 1 },
      },
    },
  };

  return (
    <Card className="shadow-sm col-span-full lg:col-span-1 h-[460px] flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
            Inventory Turnover
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs text-xs">
                  <p>Inventory turnover measures how efficiently inventory is being consumed during the selected period. Higher turnover generally means inventory is being used more frequently.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          How efficiently inventory is being sold and replenished
        </p>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col justify-between pt-2 pb-5">
        {data.missingCostCount > 0 && (
          <div className="mb-4 flex items-start gap-2 p-3 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 rounded-md text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              {data.missingCostCount} ingredient(s) missing unit cost. The estimated COGS and inventory values below are incomplete.
            </p>
          </div>
        )}
        <div>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Turnover Rate</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{data.turnoverRate !== null ? `${data.turnoverRate.toFixed(1)}×` : '—'}</span>
              </div>
              {changePercent !== null && trendDirection !== null && data.turnoverRate !== null && (
                <p className={`text-xs font-medium flex items-center mt-1 ${trendDirection === "up" ? "text-emerald-600" : trendDirection === "down" ? "text-red-600" : "text-muted-foreground"}`}>
                  {trendDirection === "up" && <TrendingUp className="h-3 w-3 mr-1" />}
                  {trendDirection === "down" && <TrendingDown className="h-3 w-3 mr-1" />}
                  {trendDirection === "flat" && <Minus className="h-3 w-3 mr-1" />}
                  {trendDirection === "up" ? "↑" : trendDirection === "down" ? "↓" : ""} {Math.abs(changePercent).toFixed(1)}% vs. previous period
                </p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Days in Inventory</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{data.daysInInventory !== null ? data.daysInInventory.toFixed(1) : '—'}</span>
                {data.daysInInventory !== null && <span className="text-sm font-normal text-muted-foreground">days</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs mb-4 p-3 bg-muted/30 rounded-md border border-muted/50">
            <div className="flex-1">
              <span className="text-muted-foreground flex items-center gap-1 mb-0.5">
                Estimated COGS
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs">
                      <p>Estimated inventory consumption cost based on POS inventory deductions and current ingredient unit costs.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </span>
              <span className="font-semibold text-sm">{formatCurrency(data.estimatedCogs)}</span>
            </div>
            <div className="flex-1 border-l border-border pl-4">
              <span className="text-muted-foreground block mb-0.5">Average Inventory</span>
              <span className="font-semibold text-sm">{formatCurrency(data.averageInventory)}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-[140px] w-full mt-2">
          <Line data={chartData} options={chartOptions as any} />
        </div>
      </CardContent>
    </Card>
  );
}
