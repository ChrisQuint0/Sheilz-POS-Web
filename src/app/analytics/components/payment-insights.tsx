"use client";

import { Doughnut } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { defaultChartOptions, chartColors } from "./chart-setup";
import { Wallet } from "lucide-react";

export function PaymentInsights() {
  const data = {
    labels: ["GCash", "Cash", "Maya", "BPI"],
    datasets: [
      {
        data: [45, 30, 15, 10],
        backgroundColor: [
          chartColors.primary,
          chartColors.chart4,
          chartColors.chart3,
          chartColors.secondary,
        ],
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
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
    <Card className="shadow-sm col-span-full md:col-span-1 lg:col-span-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          Payment Methods
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          Customer payment preferences
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full flex items-center justify-center">
          <Doughnut data={data} options={options as any} />
        </div>
      </CardContent>
    </Card>
  );
}
