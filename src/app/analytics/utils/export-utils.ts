import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export const exportToExcel = () => {
  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // KPI Data
  const kpiData = [
    { Metric: "Total Revenue", Value: "125430" },
    { Metric: "Total Orders", Value: "1248" },
    { Metric: "Average Order Value", Value: "100.50" },
    { Metric: "Inventory Expenses", Value: "18250" },
    { Metric: "Net Revenue", Value: "107180" }
  ];
  const kpiSheet = XLSX.utils.json_to_sheet(kpiData);
  XLSX.utils.book_append_sheet(wb, kpiSheet, "KPIs");

  // Revenue Data
  const revenueData = [
    { Month: "Jan", Sales: 85000 },
    { Month: "Feb", Sales: 91000 },
    { Month: "Mar", Sales: 104000 },
    { Month: "Apr", Sales: 97000 },
    { Month: "May", Sales: 121000 },
    { Month: "Jun", Sales: 138000 }
  ];
  const revenueSheet = XLSX.utils.json_to_sheet(revenueData);
  XLSX.utils.book_append_sheet(wb, revenueSheet, "Revenue");

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
