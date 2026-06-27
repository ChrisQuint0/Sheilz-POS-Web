"use client";

import { Line } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { defaultChartOptions, chartColors } from "./chart-setup";
import { TrendingUp, Loader2 } from "lucide-react";
import { useAnalytics } from "../analytics-context";

export function RevenueChart() {
  const { data, loading } = useAnalytics();
  
  if (loading) {
    return (
      <Card className="shadow-sm col-span-full lg:col-span-2 flex flex-col h-[380px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
      </Card>
    );
  }

  const revenueData = data.revenue;
  const labels = revenueData.map(d => d.period_label);
  const values = revenueData.map(d => d.total_sales);

  const peakMonthValue = Math.max(...(values.length > 0 ? values : [0]));
  const peakMonthLabel = revenueData.find(d => d.total_sales === peakMonthValue)?.period_label || "";

  const chartData = {
    labels,
    datasets: [
      {
        label: "Sales (₱)",
        data: values,
        borderColor: chartColors.primary,
        backgroundColor: chartColors.primaryLight,
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: chartColors.primary,
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
      },
    ],
  };

  const options = {
    ...defaultChartOptions,
    plugins: {
      ...defaultChartOptions.plugins,
      legend: { display: false },
      tooltip: {
        ...defaultChartOptions.plugins.tooltip,
        callbacks: {
          label: (ctx: any) =>
            ` ₱${ctx.parsed.y.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
        },
      },
    },
    scales: {
      ...defaultChartOptions.scales,
      y: {
        ...defaultChartOptions.scales.y,
        ticks: {
          ...defaultChartOptions.scales.y.ticks,
          callback: (value: any) => `₱${(value / 1000).toFixed(0)}k`,
        },
      },
    },
  };

  return (
    <Card className="shadow-sm col-span-full lg:col-span-2 flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-semibold">
            Sales Overview
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            By Period · PHP
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Peak period</p>
          <p className="text-sm font-semibold text-foreground flex items-center gap-1 justify-end">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            {peakMonthLabel} · ₱{peakMonthValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-[300px]">
        <div className="h-[300px] w-full">
          {revenueData.length > 0 ? (
            <Line data={chartData} options={options as any} />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
              No sales data for selected period.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
