import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { AnalyticsData } from "../analytics-context";

export const exportToExcel = (data: AnalyticsData) => {
  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: KPI Data (Net Revenue removed) ──
  const kpiData = [
    { Metric: "Total Revenue", Value: data.kpis?.total_revenue || 0 },
    { Metric: "Total Orders", Value: data.kpis?.total_orders || 0 },
    { Metric: "Average Order Value", Value: data.kpis?.avg_order_value || 0 },
    { Metric: "Inventory Expenses", Value: data.kpis?.inventory_expenses || 0 },
  ];
  const kpiSheet = XLSX.utils.json_to_sheet(kpiData);
  XLSX.utils.book_append_sheet(wb, kpiSheet, "KPIs");

  // ── Sheet 2: Revenue by Period ──
  if (data.revenue.length > 0) {
    const revenueRows = data.revenue.map(r => ({
      Period: r.period_label,
      "Total Sales": r.total_sales,
    }));
    const revenueSheet = XLSX.utils.json_to_sheet(revenueRows);
    XLSX.utils.book_append_sheet(wb, revenueSheet, "Revenue");
  }

  // ── Sheet 3: Top Products ──
  if (data.topProducts.length > 0) {
    const productRows = data.topProducts.map(p => ({
      "Product Name": p.product_name,
      "Qty Sold": p.qty_sold,
      Revenue: p.revenue,
    }));
    const productsSheet = XLSX.utils.json_to_sheet(productRows);
    XLSX.utils.book_append_sheet(wb, productsSheet, "Top Products");
  }

  // ── Sheet 4: Category Revenue ──
  if (data.categoryRevenue.length > 0) {
    const categoryRows = data.categoryRevenue.map(c => ({
      Category: c.category_name,
      Revenue: c.revenue,
    }));
    const categorySheet = XLSX.utils.json_to_sheet(categoryRows);
    XLSX.utils.book_append_sheet(wb, categorySheet, "Categories");
  }

  // ── Sheet 5: Peak Hours ──
  if (data.peakHours.length > 0) {
    const peakHourRows = data.peakHours.map(h => ({
      Hour: h.hour_label,
      "Order Count": h.order_count,
    }));
    const peakHoursSheet = XLSX.utils.json_to_sheet(peakHourRows);
    XLSX.utils.book_append_sheet(wb, peakHoursSheet, "Peak Hours");
  }

  // ── Sheet 6: Peak Days ──
  if (data.peakDays.length > 0) {
    const peakDayRows = data.peakDays.map(d => ({
      Day: d.day_label,
      "Total Sales": d.total_sales,
    }));
    const peakDaysSheet = XLSX.utils.json_to_sheet(peakDayRows);
    XLSX.utils.book_append_sheet(wb, peakDaysSheet, "Peak Days");
  }

  // ── Sheet 7: Payment Distribution ──
  if (data.paymentDistribution.length > 0) {
    const paymentRows = data.paymentDistribution.map(p => ({
      "Payment Method": p.method,
      Revenue: p.revenue,
      "Percentage (%)": p.percentage,
    }));
    const paymentSheet = XLSX.utils.json_to_sheet(paymentRows);
    XLSX.utils.book_append_sheet(wb, paymentSheet, "Payment Distribution");
  }

  // ── Sheet 8: Transaction Status ──
  if (data.transactionStatus.length > 0) {
    const statusRows = data.transactionStatus.map(s => ({
      Status: s.status,
      "Order Count": s.order_count,
      "Percentage (%)": s.percentage,
    }));
    const statusSheet = XLSX.utils.json_to_sheet(statusRows);
    XLSX.utils.book_append_sheet(wb, statusSheet, "Transaction Status");
  }

  // ── Sheet 9: Void Analysis ──
  if (data.voidAnalysis) {
    const voidData = [
      { Metric: "Total Voids", Value: data.voidAnalysis.total_voids },
      { Metric: "Revenue Lost", Value: data.voidAnalysis.revenue_lost },
      { Metric: "Void Rate (%)", Value: data.voidAnalysis.void_rate },
      { Metric: "Total Orders", Value: data.voidAnalysis.total_orders },
    ];
    const voidSheet = XLSX.utils.json_to_sheet(voidData);
    XLSX.utils.book_append_sheet(wb, voidSheet, "Void Analysis");
  }

  // ── Sheet 10: Most Consumed Ingredients ──
  if (data.mostConsumed.length > 0) {
    const mostRows = data.mostConsumed.map(i => ({
      "Item Name": i.item_name,
      Unit: i.unit,
      "Total Consumed": i.total_consumed,
    }));
    const mostSheet = XLSX.utils.json_to_sheet(mostRows);
    XLSX.utils.book_append_sheet(wb, mostSheet, "Most Consumed");
  }

  // ── Sheet 11: Least Consumed Ingredients ──
  if (data.leastConsumed.length > 0) {
    const leastRows = data.leastConsumed.map(i => ({
      "Item Name": i.item_name,
      Unit: i.unit,
      "Total Consumed": i.total_consumed,
    }));
    const leastSheet = XLSX.utils.json_to_sheet(leastRows);
    XLSX.utils.book_append_sheet(wb, leastSheet, "Least Consumed");
  }

  // Save the file
  XLSX.writeFile(wb, "Sheilz_Analytics_Report.xlsx");
};

export const exportChartsToPDF = async () => {
  const analyticsContainer = document.getElementById("analytics-dashboard-content");
  if (!analyticsContainer) return;

  try {
    // Grab all chart canvas elements rendered by Chart.js
    const canvasElements = analyticsContainer.querySelectorAll("canvas");

    if (canvasElements.length === 0) {
      alert("No charts found to export.");
      return;
    }

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;

    // Title page header
    pdf.setFontSize(20);
    pdf.setTextColor(194, 69, 106); // Brand color #C2456A
    pdf.text("Sheilz Analytics Report", margin, 25);
    pdf.setFontSize(10);
    pdf.setTextColor(130, 111, 105); // Muted color #826f69
    pdf.text(`Generated on ${new Date().toLocaleDateString("en-PH", { 
      weekday: "long", year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit"
    })}`, margin, 33);

    let yOffset = 45;

    canvasElements.forEach((canvas) => {
      // Get the chart image directly from the canvas (bypasses html2canvas entirely)
      const imgData = canvas.toDataURL("image/png", 1.0);

      // Extract chart title from the closest Card component
      const card = canvas.closest('.shadow-sm');
      let chartTitle = "Analytics Chart";
      if (card) {
        const titleEl = card.querySelector('.font-semibold');
        if (titleEl && titleEl.textContent) {
          chartTitle = titleEl.textContent.trim();
        }
      }

      // Calculate dimensions to fit within the page
      const canvasRatio = canvas.height / canvas.width;
      const imgWidth = contentWidth;
      const imgHeight = imgWidth * canvasRatio;

      // Check if chart + title fits on current page, otherwise add a new page
      if (yOffset + imgHeight + 10 > pageHeight - margin) {
        pdf.addPage();
        yOffset = margin;
      }

      // Add chart title
      pdf.setFontSize(14);
      pdf.setTextColor(58, 43, 39); // #3a2b27 (foreground)
      pdf.text(chartTitle, margin, yOffset);
      yOffset += 6; // Spacing below title

      // Add the chart image
      pdf.addImage(imgData, "PNG", margin, yOffset, imgWidth, imgHeight);
      yOffset += imgHeight + 12; // 12mm spacing between charts
    });

    // Save PDF
    pdf.save("Sheilz_Analytics_Charts.pdf");
  } catch (error) {
    console.error("Error exporting charts to PDF:", error);
    alert("Failed to export charts. Please try again.");
  }
};
