"use client";

import { Doughnut } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { defaultChartOptions, chartColors } from "./chart-setup";
import { AlertTriangle, Receipt, ShieldAlert, Loader2 } from "lucide-react";
import { useAnalytics } from "../analytics-context";

export function OperationalInsights() {
  const { data, loading } = useAnalytics();

  if (loading) {
    return (
      <>
        <Card className="shadow-sm col-span-full md:col-span-1 lg:col-span-1 h-[380px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
        </Card>
        <Card className="shadow-sm col-span-full md:col-span-1 lg:col-span-1 h-[380px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
        </Card>
      </>
    );
  }

  const transactionStatus = data.transactionStatus;
  const voidAnalysis = data.voidAnalysis;

  const statusLabels = transactionStatus.map(s => s.status);
  const statusValues = transactionStatus.map(s => Number(s.percentage));

  // Default color mapping based on status
  const getColorForStatus = (status: string) => {
    if (status === "Completed") return chartColors.chart3; // green
    if (status === "Void (Not Made)") return chartColors.secondary; // orange
    if (status === "Void (Consumed)") return chartColors.destructive; // red
    return chartColors.chart4;
  };

  const doughnutData = {
    labels: statusLabels,
    datasets: [
      {
        data: statusValues,
        backgroundColor: statusLabels.map(getColorForStatus),
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

  const formatCurrency = (val: number) => {
    return val.toLocaleString("en-US", { minimumFractionDigits: 2 });
  };

  return (
    <>
      <Card className="shadow-sm col-span-full md:col-span-1 lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
            Transaction Status
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Order completion rate
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full flex items-center justify-center">
            {transactionStatus.length > 0 ? (
              <Doughnut data={doughnutData} options={doughnutOptions as any} />
            ) : (
              <div className="text-sm text-muted-foreground">No data</div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm col-span-full md:col-span-1 lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Void Analysis
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Waste and loss tracking
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-2">
          {voidAnalysis ? (
            <>
              {/* Total Voids */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-red-50 border border-red-100">
                <div className="p-2.5 bg-red-100 text-red-600 rounded-lg">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-red-500 uppercase tracking-wider">Total Voids</p>
                  <h3 className="text-2xl font-bold text-red-700 leading-tight">
                    {voidAnalysis.total_voids} <span className="text-sm font-normal text-red-400">({voidAnalysis.void_rate}%)</span>
                  </h3>
                </div>
              </div>
              
              {/* Revenue Lost */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-50 border border-amber-100">
                <div className="p-2.5 bg-amber-100 text-amber-600 rounded-lg">
                  <Receipt className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider">Revenue Lost</p>
                  <h3 className="text-2xl font-bold text-amber-700 leading-tight">₱{formatCurrency(voidAnalysis.revenue_lost)}</h3>
                </div>
              </div>

              {/* Void Rate Bar */}
              <div className="mt-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Void Rate</span>
                  <span className="text-xs font-bold text-foreground">{voidAnalysis.void_rate}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-red-400 transition-all"
                    style={{ width: `${Math.min(voidAnalysis.void_rate, 100)}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground h-full">
              No void data available.
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
