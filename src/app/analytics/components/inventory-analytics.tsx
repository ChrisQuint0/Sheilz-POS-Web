"use client";

import { Bar } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { defaultChartOptions, chartColors } from "./chart-setup";
import { Droplets, PackageSearch, Loader2 } from "lucide-react";
import { useAnalytics } from "../analytics-context";

export function InventoryAnalytics() {
  const { data, loading } = useAnalytics();

  if (loading) {
    return (
      <>
        <Card className="shadow-sm col-span-full lg:col-span-2 h-[350px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
        </Card>
        <Card className="shadow-sm col-span-full lg:col-span-1 h-[350px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
        </Card>
      </>
    );
  }

  const { mostConsumed, leastConsumed } = data;

  const mostConsumedData = {
    labels: mostConsumed.map(i => `${i.item_name} (${i.unit})`),
    datasets: [
      {
        label: "Consumption",
        data: mostConsumed.map(i => Number(i.total_consumed)),
        backgroundColor: chartColors.primary,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const leastConsumedData = {
    labels: leastConsumed.map(i => `${i.item_name} (${i.unit})`),
    datasets: [
      {
        label: "Consumption",
        data: leastConsumed.map(i => Number(i.total_consumed)),
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
            {mostConsumed.length > 0 ? (
              <Bar data={mostConsumedData} options={horizontalOptions as any} />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
                No consumption data available.
              </div>
            )}
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
            {leastConsumed.length > 0 ? (
              <Bar data={leastConsumedData} options={horizontalOptions as any} />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
                No consumption data available.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
