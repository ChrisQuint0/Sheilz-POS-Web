"use client";

import { Doughnut } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { defaultChartOptions, chartColors } from "./chart-setup";
import { AlertTriangle, Receipt, ShieldAlert } from "lucide-react";

export function OperationalInsights() {
  const doughnutData = {
    labels: ["Completed", "Void (Not Made)", "Void (Consumed)"],
    datasets: [
      {
        data: [92, 5, 3],
        backgroundColor: [
          chartColors.chart3,
          chartColors.secondary,
          chartColors.destructive,
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
            <Doughnut data={doughnutData} options={doughnutOptions as any} />
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
          {/* Total Voids */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-red-50 border border-red-100">
            <div className="p-2.5 bg-red-100 text-red-600 rounded-lg">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-red-500 uppercase tracking-wider">Total Voids</p>
              <h3 className="text-2xl font-bold text-red-700 leading-tight">
                32 <span className="text-sm font-normal text-red-400">(8%)</span>
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
              <h3 className="text-2xl font-bold text-amber-700 leading-tight">₱4,250</h3>
            </div>
          </div>

          {/* Void Rate Bar */}
          <div className="mt-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-muted-foreground">Void Rate</span>
              <span className="text-xs font-bold text-foreground">8%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-red-400 transition-all"
                style={{ width: "8%" }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
