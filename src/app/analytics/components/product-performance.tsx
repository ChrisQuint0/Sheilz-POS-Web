"use client";

import { Bar, Doughnut } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { defaultChartOptions, chartColors } from "./chart-setup";

export function ProductPerformance() {
  const barData = {
    labels: [
      "Spanish Latte",
      "Matcha Latte",
      "Caramel Macchiato",
      "Cafe Latte",
      "Americano",
      "Mocha",
      "Vanilla Latte",
      "Iced Tea",
      "Croissant",
      "Brownie"
    ],
    datasets: [
      {
        label: "Quantity Sold",
        data: [530, 480, 425, 380, 310, 290, 250, 180, 150, 120],
        backgroundColor: chartColors.primary,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const barOptions = {
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

  const doughnutData = {
    labels: ["Spanish Latte", "Matcha Latte", "Cafe Latte", "Others"],
    datasets: [
      {
        data: [25, 20, 15, 40],
        backgroundColor: [
          chartColors.primary,
          chartColors.secondary,
          chartColors.chart3,
          chartColors.chart4,
        ],
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };

  const doughnutOptions = {
    ...defaultChartOptions,
    cutout: "72%",
    scales: {
      x: { display: false },
      y: { display: false },
    },
    plugins: {
      ...defaultChartOptions.plugins,
      tooltip: {
        ...defaultChartOptions.plugins.tooltip,
        callbacks: {
          label: (ctx: any) => ` ${ctx.parsed}%`,
        },
      },
    },
  };

  return (
    <>
      <Card className="shadow-sm col-span-full lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Best-Selling Products
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Top 10 by quantity sold
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[340px] w-full">
            <Bar data={barData} options={barOptions as any} />
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm col-span-full lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Revenue Contribution
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Product share of total revenue
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[340px] w-full flex items-center justify-center">
            <Doughnut data={doughnutData} options={doughnutOptions as any} />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
