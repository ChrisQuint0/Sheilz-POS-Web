"use client";

import { Line, Bar } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { defaultChartOptions, chartColors } from "./chart-setup";
import { Clock, Calendar, Loader2 } from "lucide-react";
import { useAnalytics } from "../analytics-context";

export function PeakActivity() {
  const { data, loading } = useAnalytics();
  
  if (loading) {
    return (
      <>
        <Card className="shadow-sm col-span-full lg:col-span-2 h-[380px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
        </Card>
        <Card className="shadow-sm col-span-full lg:col-span-1 h-[380px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
        </Card>
      </>
    );
  }

  const peakHours = data.peakHours;
  const peakDays = data.peakDays;

  // Filter out 12AM to 5AM from the chart since it's mostly 0s, unless there are orders
  // Find first non-zero and last non-zero to bound it, or use a default range like 6 AM - 8 PM
  let startIdx = 6; // 6 AM
  let endIdx = 20; // 8 PM
  
  const lineLabels = peakHours.slice(startIdx, endIdx + 1).map(h => h.hour_label);
  const lineValues = peakHours.slice(startIdx, endIdx + 1).map(h => Number(h.order_count));

  const peakHourValue = Math.max(...peakHours.map(h => Number(h.order_count)));
  const peakHourLabel = peakHours.find(h => Number(h.order_count) === peakHourValue)?.hour_label || "";

  const lineData = {
    labels: lineLabels,
    datasets: [
      {
        label: "Orders per Hour",
        data: lineValues,
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

  // Peak Days Data (already comes out as Sun-Sat)
  // Usually Mon-Sun is better for display, but Sun-Sat is fine
  const barLabels = peakDays.map(d => d.day_label);
  const barValues = peakDays.map(d => d.total_sales);

  const barData = {
    labels: barLabels,
    datasets: [
      {
        label: "Sales (₱)",
        data: barValues,
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
            <p className="text-sm font-semibold text-foreground">{peakHourLabel} · {peakHourValue} orders</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {peakHourValue > 0 ? (
              <Line data={lineData} options={lineOptions as any} />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
                No hourly data available.
              </div>
            )}
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
            {peakDays.length > 0 ? (
              <Bar data={barData} options={barOptions as any} />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
                No daily data available.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
