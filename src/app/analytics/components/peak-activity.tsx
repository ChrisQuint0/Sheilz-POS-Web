"use client";

import { Line, Bar } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { defaultChartOptions, chartColors } from "./chart-setup";
import { Clock, Calendar } from "lucide-react";

export function PeakActivity() {
  const lineData = {
    labels: ["6 AM", "7 AM", "8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM"],
    datasets: [
      {
        label: "Orders per Hour",
        data: [5, 15, 42, 55, 38, 45, 60, 52, 40, 35, 48, 55],
        borderColor: chartColors.secondary,
        backgroundColor: chartColors.secondaryLight,
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: chartColors.secondary,
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
      },
    ],
  };

  const lineOptions = {
    ...defaultChartOptions,
    plugins: {
      ...defaultChartOptions.plugins,
      legend: { display: false },
    },
  };

  const barData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Sales (₱)",
        data: [12000, 11500, 13000, 12800, 18000, 24000, 21000],
        backgroundColor: chartColors.chart3,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const barOptions = {
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
    <>
      <Card className="shadow-sm col-span-full lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Peak Sales Hours
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Optimize staffing and preparation
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Peak hour</p>
            <p className="text-sm font-semibold text-foreground">12 PM · 60 orders</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <Line data={lineData} options={lineOptions as any} />
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm col-span-full lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Peak Sales Days
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Strongest business days
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <Bar data={barData} options={barOptions as any} />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
