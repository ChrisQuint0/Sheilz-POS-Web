"use client";

import { useState, useEffect, useCallback } from "react";
import { Line } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { defaultChartOptions, chartColors } from "./chart-setup";
import {
  RefreshCw,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  AlertCircle,
  Filter,
} from "lucide-react";
import { useAnalytics } from "../analytics-context";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { createClient } from "@/app/lib/supabase/client";
import type { InventoryTurnoverData } from "../analytics-context";

interface IngredientOption {
  id: string;
  name: string;
}

export function InventoryTurnover() {
  const { data: analyticsData, loading, filters } = useAnalytics();
  const contextData = analyticsData.inventoryTurnover;

  // ─────────────────────────────────────────────
  // Ingredient filter state (local to this widget)
  // ─────────────────────────────────────────────
  const [ingredients, setIngredients] = useState<IngredientOption[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<string>("all");
  const [filteredData, setFilteredData] = useState<InventoryTurnoverData | null>(null);
  const [ingredientLoading, setIngredientLoading] = useState(false);

  // Load ingredient list once
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("inventory_items")
      .select("id, name")
      .order("name")
      .then(({ data }) => {
        if (data) setIngredients(data as IngredientOption[]);
      });
  }, []);

  // When a specific ingredient is selected, fetch ingredient-scoped turnover
  const fetchIngredientTurnover = useCallback(async (ingredientId: string) => {
    if (ingredientId === "all") {
      setFilteredData(null);
      return;
    }
    setIngredientLoading(true);
    const supabase = createClient();

    const dateFrom = filters.dateFrom ? `${filters.dateFrom}T00:00:00.000+08:00` : null;
    let dateTo: string | null = null;
    if (filters.dateTo) {
      const d = new Date(filters.dateTo);
      d.setDate(d.getDate() + 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      dateTo = `${y}-${m}-${day}T00:00:00.000+08:00`;
    }

    const { data } = await supabase.rpc("get_inventory_turnover", {
      p_date_from: dateFrom,
      p_date_to: dateTo,
      p_ingredient_id: ingredientId,
    });
    setFilteredData(data ?? null);
    setIngredientLoading(false);
  }, [filters.dateFrom, filters.dateTo]);

  // Re-fetch when ingredient selection or date range changes
  useEffect(() => {
    fetchIngredientTurnover(selectedIngredient);
  }, [selectedIngredient, fetchIngredientTurnover]);


  // The active data: ingredient-scoped if selected, otherwise from context
  const data = selectedIngredient === "all" ? contextData : filteredData;

  // ─────────────────────────────────────────────
  // Loading states
  // ─────────────────────────────────────────────
  if (loading) {
    return (
      <Card className="shadow-sm col-span-full lg:col-span-2 h-[420px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
      </Card>
    );
  }

  if (!data && !ingredientLoading) {
    return (
      <Card className="shadow-sm col-span-full lg:col-span-2 h-[420px] flex flex-col items-center justify-center p-6 text-center">
        <RefreshCw className="h-10 w-10 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium text-foreground">Inventory turnover unavailable</h3>
        <p className="text-sm text-muted-foreground max-w-sm mt-2">
          Inventory valuation and product cost data are required to calculate inventory turnover.
        </p>
      </Card>
    );
  }

  // ─────────────────────────────────────────────
  // Formatting helpers
  // ─────────────────────────────────────────────
  const formatCurrency = (val: number) => {
    if (val >= 1_000_000) return `₱${(val / 1_000_000).toFixed(2)}M`;
    if (val >= 1_000) return `₱${val.toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
    return `₱${val.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const changePercent =
    data && data.previousPeriodTurnover && data.turnoverRate !== null
      ? ((data.turnoverRate - data.previousPeriodTurnover) / data.previousPeriodTurnover) * 100
      : null;

  const trendDirection =
    changePercent !== null
      ? changePercent > 0
        ? "up"
        : changePercent < 0
        ? "down"
        : "flat"
      : null;

  // ─────────────────────────────────────────────
  // Chart configuration
  // ─────────────────────────────────────────────
  const safeTrend = data && Array.isArray(data.trend) ? data.trend : [];

  const chartData = {
    labels: safeTrend.map((d) => d.label),
    datasets: [
      {
        label: "Turnover Rate",
        data: safeTrend.map((d) => d.value),
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
          label: (context: any) => ` Turnover: ${context.parsed.y}×`,
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
          autoSkip: true,
          maxRotation: 0,
          color: "#826f69",
          font: { size: 10 },
        },
      },
      y: {
        grid: { color: "rgba(194,69,106,0.06)" },
        border: { display: false },
        ticks: { color: "#826f69", font: { size: 10 }, stepSize: 1 },
      },
    },
  };

  const selectedIngredientName =
    ingredients.find((i) => i.id === selectedIngredient)?.name ?? "All Ingredients";

  return (
    <Card className="shadow-sm col-span-full lg:col-span-2 h-[460px] flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-4">
          {/* Title + info tooltip */}
          <CardTitle className="text-base font-semibold flex items-center gap-2 shrink-0">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
            Inventory Turnover
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs text-xs">
                  <p className="text-justify">How many times the average inventory value was consumed during the selected period. Calculated as Estimated COGS ÷ Average Inventory Value.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>

          {/* Ingredient filter dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            <Select
              value={selectedIngredient}
              onValueChange={(val) => setSelectedIngredient(val)}
            >
              <SelectTrigger size="sm" className="h-7 min-w-[150px] max-w-[200px] text-xs">
                <span className="truncate">
                  {selectedIngredient === "all"
                    ? "All Ingredients"
                    : (ingredients.find((i) => i.id === selectedIngredient)?.name ?? "All Ingredients")}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ingredients</SelectItem>
                {ingredients.map((ing) => (
                  <SelectItem key={ing.id} value={ing.id}>
                    {ing.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {selectedIngredient === "all"
            ? "How efficiently overall inventory is being consumed and replenished"
            : `Turnover analysis for ${selectedIngredientName}`}
        </p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between pt-2 pb-5">
        {/* Missing cost warning */}
        {data && data.missingCostCount > 0 && (
          <div className="mb-3 flex items-start gap-2 p-3 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 rounded-md text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              {data.missingCostCount} ingredient(s) missing unit cost — estimated COGS and
              inventory values are incomplete.
            </p>
          </div>
        )}

        {/* Ingredient loading overlay for chart area */}
        {ingredientLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
          </div>
        ) : data ? (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-4 gap-4 mb-4">
              {/* Turnover Rate */}
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  Turnover Rate
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs">
                        <p className="text-justify">How many times the average inventory was fully consumed and replaced. Higher is generally better, but very high values may indicate stock shortages.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">
                    {data.turnoverRate !== null ? `${data.turnoverRate.toFixed(1)}×` : "—"}
                  </span>
                </div>
                {changePercent !== null && trendDirection !== null && data.turnoverRate !== null && (
                  <p
                    className={`text-xs font-medium flex items-center mt-1 ${
                      trendDirection === "up"
                        ? "text-emerald-600"
                        : trendDirection === "down"
                        ? "text-red-500"
                        : "text-muted-foreground"
                    }`}
                  >
                    {trendDirection === "up" && <TrendingUp className="h-3 w-3 mr-1" />}
                    {trendDirection === "down" && <TrendingDown className="h-3 w-3 mr-1" />}
                    {trendDirection === "flat" && <Minus className="h-3 w-3 mr-1" />}
                    {trendDirection === "up" ? "↑" : trendDirection === "down" ? "↓" : ""}{" "}
                    {Math.abs(changePercent).toFixed(1)}% vs. previous period
                  </p>
                )}
              </div>

              {/* Days in Inventory */}
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  Days in Inventory
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs">
                        <p className="text-justify">The average number of days it takes to consume one full cycle of inventory. Calculated as Selected Period Days ÷ Turnover Rate.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">
                    {data.daysInInventory !== null ? data.daysInInventory.toFixed(1) : "—"}
                  </span>
                  {data.daysInInventory !== null && (
                    <span className="text-sm font-normal text-muted-foreground">days</span>
                  )}
                </div>
              </div>

              {/* Estimated COGS */}
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  Estimated COGS
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs">
                        <p className="text-justify">Total ingredient consumption cost from POS deductions, valued at each ingredient's current unit cost. Labeled "Estimated" because historical costs are not tracked.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </span>
                <span className="text-2xl font-bold">{formatCurrency(data.estimatedCogs)}</span>
              </div>

              {/* Average Inventory */}
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  Avg. Inventory
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs">
                        <p className="text-justify">(Beginning + Ending inventory value) ÷ 2 for the selected period. Beginning: {formatCurrency(data.beginningInventory)} · Ending: {formatCurrency(data.endingInventory)}.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </span>
                <span className="text-2xl font-bold">{formatCurrency(data.averageInventory)}</span>
              </div>
            </div>

            {/* Trend chart */}
            <div className="flex-1 min-h-[150px] w-full">
              <Line data={chartData} options={chartOptions as any} />
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
