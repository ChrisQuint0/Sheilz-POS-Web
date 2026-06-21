"use client";

import { Line } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { defaultChartOptions, chartColors } from "./chart-setup";
import { TrendingUp } from "lucide-react";

export function RevenueChart() {
  const data = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Sales (₱)",
        data: [85000, 91000, 104000, 97000, 121000, 138000],
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
            Monthly · PHP
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Peak month</p>
          <p className="text-sm font-semibold text-foreground flex items-center gap-1 justify-end">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            Jun · ₱138,000
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-[300px]">
        <div className="h-[300px] w-full">
          <Line data={data} options={options as any} />
        </div>
      </CardContent>
    </Card>
  );
}
