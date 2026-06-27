"use client";

import { Bar, Doughnut } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { defaultChartOptions, chartColors } from "./chart-setup";
import { Loader2 } from "lucide-react";
import { useAnalytics } from "../analytics-context";

export function ProductPerformance() {
  const { data, loading } = useAnalytics();
  
  if (loading) {
    return (
      <>
        <Card className="shadow-sm col-span-full lg:col-span-2 h-[420px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
        </Card>
        <Card className="shadow-sm col-span-full lg:col-span-1 h-[420px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
        </Card>
      </>
    );
  }

  const topProducts = data.topProducts;
  const barLabels = topProducts.map(p => p.product_name);
  const barValues = topProducts.map(p => p.qty_sold);

  const totalRevenue = topProducts.reduce((sum, p) => sum + Number(p.revenue), 0);
  
  // Doughnut data: top 3 products, and 'Others'
  let doughnutLabels: string[] = [];
  let doughnutDataValues: number[] = [];
  
  if (topProducts.length <= 4) {
    doughnutLabels = topProducts.map(p => p.product_name);
    doughnutDataValues = topProducts.map(p => totalRevenue > 0 ? (Number(p.revenue) / totalRevenue) * 100 : 0);
  } else {
    doughnutLabels = topProducts.slice(0, 3).map(p => p.product_name);
    doughnutDataValues = topProducts.slice(0, 3).map(p => totalRevenue > 0 ? (Number(p.revenue) / totalRevenue) * 100 : 0);
    
    doughnutLabels.push("Others");
    const othersRevenue = topProducts.slice(3).reduce((sum, p) => sum + Number(p.revenue), 0);
    doughnutDataValues.push(totalRevenue > 0 ? (othersRevenue / totalRevenue) * 100 : 0);
  }

  // Round percentages
  doughnutDataValues = doughnutDataValues.map(v => Math.round(v * 10) / 10);

  const barData = {
    labels: barLabels,
    datasets: [
      {
        label: "Quantity Sold",
        data: barValues,
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
    labels: doughnutLabels,
    datasets: [
      {
        data: doughnutDataValues,
        backgroundColor: [
          chartColors.primary,
          chartColors.secondary,
          chartColors.chart3,
          chartColors.chart4,
        ].slice(0, Math.max(1, doughnutDataValues.length)), // Ensure enough colors, though we map up to 4
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
            Top {Math.min(10, topProducts.length)} by quantity sold
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[340px] w-full">
            {topProducts.length > 0 ? (
              <Bar data={barData} options={barOptions as any} />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
                No product data available.
              </div>
            )}
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
            {topProducts.length > 0 ? (
              <Doughnut data={doughnutData} options={doughnutOptions as any} />
            ) : (
              <div className="text-sm text-muted-foreground">No data</div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
