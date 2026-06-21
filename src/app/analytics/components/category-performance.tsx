"use client";

import { Bar } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { defaultChartOptions, chartColors } from "./chart-setup";

export function CategoryPerformance() {
  const data = {
    labels: ["Coffee", "Non-Coffee", "Tea", "Pastries"],
    datasets: [
      {
        label: "Revenue (₱)",
        data: [72000, 38000, 12000, 8000],
        backgroundColor: [
          chartColors.primary,
          chartColors.secondary,
          chartColors.chart3,
          chartColors.chart4,
        ],
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
          <Bar data={data} options={options as any} />
        </div>
      </CardContent>
    </Card>
  );
}
