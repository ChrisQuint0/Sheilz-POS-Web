"use client";

import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { defaultChartOptions, chartColors } from "./chart-setup";
import { RefreshCw, Info, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import { useAnalytics } from "../analytics-context";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ----------------------------------------------------------------------
// TYPES (Frontend Only)
// ----------------------------------------------------------------------
// MOCK DATA INTERFACE - To be replaced by actual backend schema
export interface InventoryTurnoverData {
  turnoverRate: number;
  inventoryDays: number;
  cogs: number;
  averageInventory: number;
  previousTurnoverRate: number;
  trend: "up" | "down" | "flat";
  status: "Healthy" | "Moderate" | "Low Turnover";
  insight: string;
  historicalData: {
    period: string;
    rate: number;
  }[];
}

// ----------------------------------------------------------------------
// MOCK DATA (To be replaced when backend is ready)
// ----------------------------------------------------------------------
const MOCK_TURNOVER_DATA: InventoryTurnoverData = {
  turnoverRate: 4.2,
  inventoryDays: 8.6,
  cogs: 45250,
  averageInventory: 10773,
  previousTurnoverRate: 3.73, // giving an ~12.5% increase
  trend: "up",
  status: "Healthy",
  insight: "Inventory is moving efficiently during the selected period.",
  historicalData: [
    { period: "Week 1", rate: 3.2 },
    { period: "Week 2", rate: 3.5 },
    { period: "Week 3", rate: 3.9 },
    { period: "Week 4", rate: 4.2 },
  ],
};

export function InventoryTurnover() {
  const { filters, loading } = useAnalytics();
  const [data, setData] = useState<InventoryTurnoverData | null>(null);
  const [isLocalLoading, setIsLocalLoading] = useState(true);

  // Simulate fetching data based on filters
  useEffect(() => {
    setIsLocalLoading(true);
    // Simulate network delay
    const timer = setTimeout(() => {
      // TODO: Replace this mock implementation with an actual API call or Supabase query
      // using the provided filters (e.g., dateRange, category) when the backend is ready.
      setData(MOCK_TURNOVER_DATA);
      setIsLocalLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters]);

  if (loading || isLocalLoading) {
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
  const trendPercent = Math.abs(((data.turnoverRate - data.previousTurnoverRate) / data.previousTurnoverRate) * 100).toFixed(1);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Healthy": return "text-emerald-600 bg-emerald-50 border-emerald-200";
      case "Moderate": return "text-orange-600 bg-orange-50 border-orange-200";
      case "Low Turnover": return "text-red-600 bg-red-50 border-red-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  // Chart configuration
  const chartData = {
    labels: data.historicalData.map(d => d.period),
    datasets: [
      {
        label: "Turnover Rate",
        data: data.historicalData.map(d => d.rate),
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
                  <p className="mb-2"><strong>Inventory turnover</strong> shows how many times inventory is sold and replenished during the selected period. A higher turnover generally indicates faster inventory movement, while a lower turnover may indicate slower-moving stock.</p>
                  <p><strong>Inventory days</strong> estimates how long inventory remains in stock before being sold.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusColor(data.status)}`}>
            {data.status}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          How efficiently inventory is being sold and replenished
        </p>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col justify-between pt-2 pb-5">
        <div>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Turnover Rate</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{data.turnoverRate.toFixed(1)}×</span>
              </div>
              <p className={`text-xs font-medium flex items-center mt-1 ${data.trend === "up" ? "text-emerald-600" : data.trend === "down" ? "text-red-600" : "text-muted-foreground"}`}>
                {data.trend === "up" && <TrendingUp className="h-3 w-3 mr-1" />}
                {data.trend === "down" && <TrendingDown className="h-3 w-3 mr-1" />}
                {data.trend === "flat" && <Minus className="h-3 w-3 mr-1" />}
                {data.trend === "up" ? "↑" : data.trend === "down" ? "↓" : ""} {trendPercent}% vs. previous period
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Days in Inventory</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{data.inventoryDays.toFixed(1)}</span>
                <span className="text-sm font-normal text-muted-foreground">days</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs mb-4 p-3 bg-muted/30 rounded-md border border-muted/50">
            <div className="flex-1">
              <span className="text-muted-foreground block mb-0.5">COGS</span>
              <span className="font-semibold text-sm">{formatCurrency(data.cogs)}</span>
            </div>
            <div className="flex-1 border-l border-border pl-4">
              <span className="text-muted-foreground block mb-0.5">Avg Inventory</span>
              <span className="font-semibold text-sm">{formatCurrency(data.averageInventory)}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-[140px] w-full mt-2">
          <Line data={chartData} options={chartOptions as any} />
        </div>

        <div className="mt-4 pt-3 border-t border-border/50">
          <p className="text-[13px] text-muted-foreground/90 italic">
            "{data.insight}"
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
