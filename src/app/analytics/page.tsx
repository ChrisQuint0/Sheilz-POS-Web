"use client";

import { AnalyticsProvider, useAnalytics } from "./analytics-context";
import { AnalyticsFilters } from "./components/analytics-filters";
import { KpiCards } from "./components/kpi-cards";
import { RevenueChart } from "./components/revenue-chart";
import { ProductPerformance } from "./components/product-performance";
import { CategoryPerformance } from "./components/category-performance";
import { PeakActivity } from "./components/peak-activity";
import { PaymentInsights } from "./components/payment-insights";
import { InventoryAnalytics } from "./components/inventory-analytics";
import { OperationalInsights } from "./components/operational-insights";
import { exportToExcel, exportChartsToPDF } from "./utils/export-utils";

function AnalyticsDashboard() {
  const { data, refresh } = useAnalytics();

  const handleExportExcel = () => {
    exportToExcel(data);
  };

  return (
    <div className="flex flex-col flex-1 w-full max-w-7xl mx-auto">
      <AnalyticsFilters 
        onExportExcel={handleExportExcel}
        onExportCharts={exportChartsToPDF}
        onRefresh={refresh}
      />
      
      <div id="analytics-dashboard-content">
        <KpiCards />

        {/* Charts Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Row 1: Sales Overview (2col) + Category (1col) */}
          <RevenueChart />
          <CategoryPerformance />

          {/* Row 2: Best Sellers (2col) + Revenue Contribution (1col) */}
          <ProductPerformance />

          {/* Row 3: Peak Hours (2col) + Peak Days (1col) */}
          <PeakActivity />

          {/* Row 4: Payment (1col) + Transaction Status (1col) + Void Analysis (1col) */}
          <PaymentInsights />
          <OperationalInsights />

          {/* Row 5: Most Consumed (2col) + Least Consumed (1col) */}
          <InventoryAnalytics />
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <AnalyticsProvider>
      <AnalyticsDashboard />
    </AnalyticsProvider>
  );
}
