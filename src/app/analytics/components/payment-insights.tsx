"use client";

import { Doughnut } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { defaultChartOptions, chartColors } from "./chart-setup";
import { Wallet, Loader2 } from "lucide-react";
import { useAnalytics } from "../analytics-context";

export function PaymentInsights() {
  const { data, loading } = useAnalytics();

  if (loading) {
    return (
      <Card className="shadow-sm col-span-full md:col-span-1 lg:col-span-1 h-[380px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
      </Card>
    );
  }

  const paymentData = data.paymentDistribution;
  const labels = paymentData.map(p => p.method);
  const percentages = paymentData.map(p => Number(p.percentage));

  const colors = [
    chartColors.primary,
    chartColors.chart4,
    chartColors.chart3,
    chartColors.secondary,
    chartColors.chart5,
  ];

  const chartData = {
    labels,
    datasets: [
      {
        data: percentages,
        backgroundColor: labels.map((_, i) => colors[i % colors.length]),
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
          {paymentData.length > 0 ? (
            <Doughnut data={chartData} options={options as any} />
          ) : (
            <div className="text-sm text-muted-foreground">No data</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
