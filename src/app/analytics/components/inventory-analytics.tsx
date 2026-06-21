"use client";

import { Bar } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { defaultChartOptions, chartColors } from "./chart-setup";
import { Droplets, PackageSearch } from "lucide-react";

export function InventoryAnalytics() {
  const mostConsumedData = {
    labels: ["Milk (L)", "Coffee Beans (kg)", "Ice (kg)", "Condensed Milk (kg)"],
    datasets: [
      {
        label: "Consumption",
        data: [120, 75, 60, 25],
        backgroundColor: chartColors.primary,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const leastConsumedData = {
    labels: ["Cinnamon Powder", "Yuzu Syrup", "Blueberry Jam", "Hazelnut Syrup"],
    datasets: [
      {
        label: "Consumption",
        data: [0.5, 1.2, 1.5, 2.0],
        backgroundColor: chartColors.chart4,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const horizontalOptions = {
    ...defaultChartOptions,
    indexAxis: "y" as const,
    plugins: {
      ...defaultChartOptions.plugins,
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { color: "rgba(194,69,106,0.06)" },
        border: { display: false },
        ticks: { color: "#826f69", font: { size: 11 } },
      },
      y: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: "#3a2b27", font: { size: 11, weight: 500 as const } },
      },
    },
  };

  return (
    <>
      <Card className="shadow-sm col-span-full lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Droplets className="h-4 w-4 text-muted-foreground" />
            Most Consumed Ingredients
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Items requiring frequent replenishment
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full">
            <Bar data={mostConsumedData} options={horizontalOptions as any} />
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm col-span-full lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <PackageSearch className="h-4 w-4 text-muted-foreground" />
            Least Consumed
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Slow-moving inventory items
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full">
            <Bar data={leastConsumedData} options={horizontalOptions as any} />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
