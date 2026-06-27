"use client";

import { Bar } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { defaultChartOptions, chartColors } from "./chart-setup";
import { Loader2 } from "lucide-react";
import { useAnalytics } from "../analytics-context";

export function CategoryPerformance() {
  const { data, loading } = useAnalytics();
  
  if (loading) {
    return (
      <Card className="shadow-sm col-span-full lg:col-span-1 h-[380px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
      </Card>
    );
  }

  const categoryRevenue = data.categoryRevenue;
  const labels = categoryRevenue.map(c => c.category_name || "Uncategorized");
  const values = categoryRevenue.map(c => c.revenue);

  const colors = [
    chartColors.primary,
    chartColors.secondary,
    chartColors.chart3,
    chartColors.chart4,
    chartColors.chart5,
  ];

  const chartData = {
    labels,
    datasets: [
      {
        label: "Revenue (₱)",
        data: values,
        backgroundColor: labels.map((_, i) => colors[i % colors.length]),
        borderRadius: 6,
        borderSkipped: false,
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
            ` ₱${ctx.parsed.y.toLocaleString("en-PH")}`,
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
    <Card className="shadow-sm col-span-full lg:col-span-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Revenue by Category
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          Top revenue drivers
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {categoryRevenue.length > 0 ? (
            <Bar data={chartData} options={options as any} />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
              No category data available.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
