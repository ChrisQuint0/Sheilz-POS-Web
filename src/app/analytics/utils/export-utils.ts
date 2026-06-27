import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { AnalyticsData } from "../analytics-context";

export const exportToExcel = (data: AnalyticsData) => {
  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // KPI Data
  const kpiData = [
    { Metric: "Total Revenue", Value: data.kpis?.total_revenue || 0 },
    { Metric: "Total Orders", Value: data.kpis?.total_orders || 0 },
    { Metric: "Average Order Value", Value: data.kpis?.avg_order_value || 0 },
    { Metric: "Inventory Expenses", Value: data.kpis?.inventory_expenses || 0 },
    { Metric: "Net Revenue", Value: data.kpis?.net_revenue || 0 }
  ];
  const kpiSheet = XLSX.utils.json_to_sheet(kpiData);
  XLSX.utils.book_append_sheet(wb, kpiSheet, "KPIs");

  // Revenue Data
  const revenueSheet = XLSX.utils.json_to_sheet(data.revenue);
  XLSX.utils.book_append_sheet(wb, revenueSheet, "Revenue");

  // Top Products
  const productsSheet = XLSX.utils.json_to_sheet(data.topProducts);
  XLSX.utils.book_append_sheet(wb, productsSheet, "Top Products");

  // Category Revenue
  const categorySheet = XLSX.utils.json_to_sheet(data.categoryRevenue);
  XLSX.utils.book_append_sheet(wb, categorySheet, "Categories");

  // Save the file
  XLSX.writeFile(wb, "Sheilz_Analytics_Report.xlsx");
};

export const exportChartsToPDF = async () => {
  const analyticsContainer = document.getElementById("analytics-dashboard-content");
  if (!analyticsContainer) return;

  try {
    // Hide buttons temporarily if we don't want them in the PDF (optional)
    // For this implementation, we assume the user clicks "Export Charts" 
    // and we capture the container holding the charts.

    const canvas = await html2canvas(analyticsContainer, {
      scale: 2, // Higher resolution
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    
    // Calculate PDF dimensions
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    // Add image to PDF
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    
    // Save PDF
    pdf.save("Sheilz_Analytics_Charts.pdf");
  } catch (error) {
    console.error("Error exporting charts to PDF:", error);
    alert("Failed to export charts. Please try again.");
  }
};
