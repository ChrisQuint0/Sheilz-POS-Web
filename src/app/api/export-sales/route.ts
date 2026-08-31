import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import ExcelJS from "exceljs";
import { format } from "date-fns";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const globalFilter = searchParams.get("globalFilter");
  const statusFilter = searchParams.get("statusFilter");
  const paymentFilter = searchParams.get("paymentFilter");
  const cashierFilter = searchParams.get("cashierFilter");
  const preset = searchParams.get("preset") || "Custom Range";

  try {
    const supabase = await createClient();
    
    let query = supabase
      .from("orders")
      .select(`
        *,
        order_items (
          name,
          quantity,
          size,
          temperature
        )
      `)
      .order("created_at", { ascending: false });
      
    if (startDate) {
      query = query.gte("created_at", `${startDate}T00:00:00.000Z`);
    }
    
    if (endDate) {
      query = query.lte("created_at", `${endDate}T23:59:59.999Z`);
    }
    
    if (statusFilter && statusFilter !== "All") {
      query = query.ilike("status", `%${statusFilter}%`);
    }
    
    if (paymentFilter && paymentFilter !== "All") {
      query = query.eq("payment_method", paymentFilter);
    }
    
    if (cashierFilter && cashierFilter !== "All") {
      query = query.eq("cashier_name", cashierFilter);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let filteredData = data || [];

    // Apply global filter in memory
    if (globalFilter) {
      const lowerQ = globalFilter.toLowerCase();
      filteredData = filteredData.filter((order) => {
        const items = order.order_items || [];
        const matchesGlobal =
          (order.order_id || "").toLowerCase().includes(lowerQ) ||
          (order.customer_name || "").toLowerCase().includes(lowerQ) ||
          (order.cashier_name || "").toLowerCase().includes(lowerQ) ||
          items.some((i: any) => (i.name || "").toLowerCase().includes(lowerQ));
        return matchesGlobal;
      });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Sheilz Coffee System";
    workbook.created = new Date();
    
    let filenameStr = "Sales_History";
    if (preset === "Today" || preset === "Yesterday" || preset === "Last 7 Days" || preset === "Last 30 Days" || preset === "This Month" || preset === "Last Month") {
        filenameStr += `_${preset.replace(/ /g, "_")}_${format(new Date(), "yyyy-MM-dd")}`;
    } else if (startDate && endDate) {
        filenameStr += `_Custom_${startDate}_to_${endDate}`;
    } else {
        filenameStr += `_${format(new Date(), "yyyy-MM-dd")}`;
    }

    if (filteredData.length === 0) {
      const emptySheet = workbook.addWorksheet("Summary");
      emptySheet.columns = [{ width: 80 }];
      emptySheet.addRow(["No transaction records were found for the selected filters."]);
      
      const buf = await workbook.xlsx.writeBuffer();
      try {
        const { logAppEvent } = await import('@/app/audit/actions');
        await logAppEvent('Sales History Exported', 'Low', 'Report', `${filenameStr}.xlsx`, {
          metadata: {
            preset,
            startDate: startDate || null,
            endDate: endDate || null,
            rowsExported: 0,
          }
        });
      } catch (logErr) {
        console.error('Failed to log sales history export:', logErr);
      }
      return new NextResponse(buf as ArrayBuffer, {
        status: 200,
        headers: {
          "Content-Disposition": `attachment; filename="${filenameStr}.xlsx"`,
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      });
    }

    // Worksheet 1: Report Summary
    const summarySheet = workbook.addWorksheet("Report Summary");
    summarySheet.getColumn(1).width = 30;
    summarySheet.getColumn(2).width = 25;
    summarySheet.getColumn(3).width = 25;
    
    summarySheet.mergeCells('A1:C1');
    summarySheet.getCell('A1').value = 'Sheilz Coffee';
    summarySheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    summarySheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC2456A' } };
    summarySheet.getCell('A1').alignment = { horizontal: 'center' };

    summarySheet.mergeCells('A2:C2');
    summarySheet.getCell('A2').value = 'Sales History Report';
    summarySheet.getCell('A2').font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    summarySheet.getCell('A2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC2456A' } };
    summarySheet.getCell('A2').alignment = { horizontal: 'center' };

    summarySheet.addRow(['Report Generated On', format(new Date(), "MMM dd, yyyy h:mm a"), '']);
    summarySheet.addRow(['Reporting Period', preset, '']);
    summarySheet.addRow(['Generated By', 'System Admin', '']); // Real app uses active profile
    summarySheet.addRow([]);

    summarySheet.addRow(['Summary Statistics', '', '']);
    summarySheet.getCell(`A${summarySheet.rowCount}`).font = { bold: true };
    summarySheet.addRow(['Total Transactions', { formula: `COUNT('Transaction Records'!A:A)` }]);
    summarySheet.addRow(['Total Sales', { formula: `SUM('Transaction Records'!H:H)` }]);
    summarySheet.getCell(`B${summarySheet.rowCount}`).numFmt = '₱#,##0.00';
    summarySheet.addRow(['Average Transaction Value', { formula: `AVERAGE('Transaction Records'!H:H)` }]);
    summarySheet.getCell(`B${summarySheet.rowCount}`).numFmt = '₱#,##0.00';
    summarySheet.addRow(['Highest Transaction Amount', { formula: `MAX('Transaction Records'!H:H)` }]);
    summarySheet.getCell(`B${summarySheet.rowCount}`).numFmt = '₱#,##0.00';
    summarySheet.addRow(['Lowest Transaction Amount', { formula: `MIN('Transaction Records'!H:H)` }]);
    summarySheet.getCell(`B${summarySheet.rowCount}`).numFmt = '₱#,##0.00';
    summarySheet.addRow(['Completed Transactions', { formula: `COUNTIF('Transaction Records'!E:E, "Completed")` }]);
    summarySheet.addRow(['Cancelled Transactions', { formula: `COUNTIF('Transaction Records'!E:E, "Cancelled")` }]);
    summarySheet.addRow(['Refunded Transactions', { formula: `COUNTIF('Transaction Records'!E:E, "Refunded")` }]);
    summarySheet.addRow([]);

    // Get unique cashiers and payments for the summary breakdown
    const cashierStats = new Map();
    filteredData.forEach(tx => {
        const c = tx.cashier_name || "Unknown";
        if (!cashierStats.has(c)) {
            cashierStats.set(c, { count: 0, revenue: 0 });
        }
        const st = cashierStats.get(c);
        st.count += 1;
        st.revenue += Number(tx.amount || 0);
    });
    const sortedCashiers = Array.from(cashierStats.entries()).sort((a, b) => b[1].revenue - a[1].revenue);
    const uniquePayments = Array.from(new Set(filteredData.map(d => d.payment_method)));

    summarySheet.addRow(['Payment Method Breakdown', '', '']);
    summarySheet.getCell(`A${summarySheet.rowCount}`).font = { bold: true };
    summarySheet.addRow(['Payment Method', 'Transactions', 'Total Sales']);
    summarySheet.getRow(summarySheet.rowCount).font = { bold: true };
    
    uniquePayments.forEach(method => {
        summarySheet.addRow([
            method,
            { formula: `COUNTIF('Transaction Records'!I:I, "${method}")` },
            { formula: `SUMIF('Transaction Records'!I:I, "${method}", 'Transaction Records'!H:H)` }
        ]);
        summarySheet.getCell(`C${summarySheet.rowCount}`).numFmt = '₱#,##0.00';
    });
    summarySheet.addRow(['Total', { formula: `SUM(B${summarySheet.rowCount - uniquePayments.length}:B${summarySheet.rowCount - 1})` }, { formula: `SUM(C${summarySheet.rowCount - uniquePayments.length}:C${summarySheet.rowCount - 1})` }]);
    summarySheet.getRow(summarySheet.rowCount).font = { bold: true };
    summarySheet.getCell(`C${summarySheet.rowCount}`).numFmt = '₱#,##0.00';
    summarySheet.addRow([]);

    summarySheet.addRow(['Cashier Breakdown', '', '']);
    summarySheet.getCell(`A${summarySheet.rowCount}`).font = { bold: true };
    summarySheet.addRow(['Cashier', 'Transactions', 'Total Sales']);
    summarySheet.getRow(summarySheet.rowCount).font = { bold: true };
    
    sortedCashiers.forEach(([cashier]) => {
        summarySheet.addRow([
            cashier,
            { formula: `COUNTIF('Transaction Records'!J:J, "${cashier}")` },
            { formula: `SUMIF('Transaction Records'!J:J, "${cashier}", 'Transaction Records'!H:H)` }
        ]);
        summarySheet.getCell(`C${summarySheet.rowCount}`).numFmt = '₱#,##0.00';
    });
    summarySheet.addRow(['Total', { formula: `SUM(B${summarySheet.rowCount - sortedCashiers.length}:B${summarySheet.rowCount - 1})` }, { formula: `SUM(C${summarySheet.rowCount - sortedCashiers.length}:C${summarySheet.rowCount - 1})` }]);
    summarySheet.getRow(summarySheet.rowCount).font = { bold: true };
    summarySheet.getCell(`C${summarySheet.rowCount}`).numFmt = '₱#,##0.00';

    // Worksheet 2: Transaction Records
    const txSheet = workbook.addWorksheet("Transaction Records", { views: [{ state: 'frozen', ySplit: 1 }] });
    
    const tableRows = filteredData.map(tx => {
        const itemsFormatted = (tx.order_items || []).map((i: any) => {
            const parts = [i.name];
            if (i.size) parts.push(`(${i.size})`);
            if (i.temperature) parts.push(`(${i.temperature})`);
            parts.push(`(x${i.quantity})`);
            return parts.join(" ");
        }).join(", ");
        
        const qty = (tx.order_items || []).reduce((sum: number, i: any) => sum + (i.quantity || 0), 0);
        
        return [
            tx.order_id,
            new Date(tx.created_at),
            format(new Date(tx.created_at), "h:mm a"),
            tx.customer_name,
            tx.status,
            itemsFormatted,
            qty,
            Number(tx.amount || 0),
            tx.payment_method,
            tx.cashier_name || "Unknown",
            "N/A",
            "N/A",
            "N/A",
            "N/A"
        ];
    });

    txSheet.addTable({
      name: 'TransactionsTable',
      ref: 'A1',
      headerRow: true,
      totalsRow: false,
      style: {
        theme: 'TableStyleLight1',
        showRowStripes: true,
      },
      columns: [
        { name: 'Order ID', filterButton: true },
        { name: 'Date', filterButton: true },
        { name: 'Time', filterButton: true },
        { name: 'Customer', filterButton: true },
        { name: 'Status', filterButton: true },
        { name: 'Items Purchased', filterButton: true },
        { name: 'Quantity', filterButton: true },
        { name: 'Amount', filterButton: true },
        { name: 'Payment Method', filterButton: true },
        { name: 'Cashier', filterButton: true },
        { name: 'Discount', filterButton: true },
        { name: 'Loyalty Discount', filterButton: true },
        { name: 'Tax', filterButton: true },
        { name: 'Notes', filterButton: true },
      ],
      rows: tableRows
    });

    txSheet.getColumn(1).width = 20; // Order ID
    txSheet.getColumn(2).width = 15; // Date
    txSheet.getColumn(2).numFmt = 'mm/dd/yyyy'; 
    txSheet.getColumn(3).width = 12; // Time
    txSheet.getColumn(4).width = 20; // Customer
    txSheet.getColumn(5).width = 15; // Status
    txSheet.getColumn(6).width = 45; // Items
    txSheet.getColumn(6).alignment = { wrapText: true };
    txSheet.getColumn(7).width = 10; // Qty
    txSheet.getColumn(8).width = 15; // Amount
    txSheet.getColumn(8).numFmt = '₱#,##0.00';
    txSheet.getColumn(8).alignment = { horizontal: 'right' };
    txSheet.getColumn(9).width = 18; // Payment Method
    txSheet.getColumn(10).width = 20; // Cashier
    txSheet.getColumn(11).width = 12; // Discount
    txSheet.getColumn(12).width = 18; // Loyalty
    txSheet.getColumn(13).width = 12; // Tax
    txSheet.getColumn(14).width = 20; // Notes

    txSheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
            row.eachCell(cell => {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC2456A' } };
                cell.alignment = { horizontal: 'center' };
            });
        } else {
            const statusCell = row.getCell(5);
            if (statusCell.value) {
                let color = 'FF3A2B27';
                if (statusCell.value === 'Completed') color = 'FF4F9A5C'; // Green
                else if (statusCell.value === 'Cancelled' || statusCell.value === 'Void') color = 'FFD6485E'; // Red
                else if (statusCell.value === 'Pending') color = 'FFE08A4F'; // Orange
                else if (statusCell.value === 'Refunded') color = 'FFA855F7'; // Purple
                statusCell.font = { color: { argb: color }, bold: true };
            }
        }
    });

    // Worksheet 3: Payment Analysis
    const paymentSheet = workbook.addWorksheet("Payment Analysis");
    paymentSheet.columns = [
        { header: 'Payment Method', key: 'method', width: 25 },
        { header: 'Number of Transactions', key: 'count', width: 25 },
        { header: 'Revenue', key: 'revenue', width: 25 },
        { header: 'Percentage', key: 'percentage', width: 20 },
    ];
    paymentSheet.getRow(1).eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC2456A' } };
    });

    uniquePayments.forEach(method => {
        paymentSheet.addRow([
            method,
            { formula: `COUNTIF('Transaction Records'!I:I, "${method}")` },
            { formula: `SUMIF('Transaction Records'!I:I, "${method}", 'Transaction Records'!H:H)` },
            { formula: `SUMIF('Transaction Records'!I:I, "${method}", 'Transaction Records'!H:H) / SUM('Transaction Records'!H:H)` }
        ]);
    });
    paymentSheet.addRow([
        "Total",
        { formula: `SUM(B2:B${uniquePayments.length + 1})` },
        { formula: `SUM(C2:C${uniquePayments.length + 1})` },
        { formula: `SUM(D2:D${uniquePayments.length + 1})` },
    ]);
    const pTotalRow = paymentSheet.getRow(uniquePayments.length + 2);
    pTotalRow.font = { bold: true };
    paymentSheet.getColumn(3).numFmt = '₱#,##0.00';
    paymentSheet.getColumn(4).numFmt = '0.00%';

    // Worksheet 4: Cashier Performance
    const cashierSheet = workbook.addWorksheet("Cashier Performance");
    cashierSheet.columns = [
        { header: 'Cashier Name', key: 'cashier', width: 25 },
        { header: 'Number of Transactions', key: 'count', width: 25 },
        { header: 'Total Sales', key: 'revenue', width: 25 },
        { header: 'Average Sale', key: 'avg', width: 25 },
    ];
    cashierSheet.getRow(1).eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC2456A' } };
    });
    
    sortedCashiers.forEach(([cashier]) => {
        cashierSheet.addRow([
            cashier,
            { formula: `COUNTIF('Transaction Records'!J:J, "${cashier}")` },
            { formula: `SUMIF('Transaction Records'!J:J, "${cashier}", 'Transaction Records'!H:H)` },
            { formula: `AVERAGEIF('Transaction Records'!J:J, "${cashier}", 'Transaction Records'!H:H)` },
        ]);
    });
    cashierSheet.addRow([
        "Total",
        { formula: `SUM(B2:B${sortedCashiers.length + 1})` },
        { formula: `SUM(C2:C${sortedCashiers.length + 1})` },
        "" // No total for average
    ]);
    const cTotalRow = cashierSheet.getRow(sortedCashiers.length + 2);
    cTotalRow.font = { bold: true };
    cashierSheet.getColumn(3).numFmt = '₱#,##0.00';
    cashierSheet.getColumn(4).numFmt = '₱#,##0.00';

    const buf = await workbook.xlsx.writeBuffer();
    
    try {
      const { logAppEvent } = await import('@/app/audit/actions');
      await logAppEvent('Sales History Exported', 'Low', 'Report', `${filenameStr}.xlsx`, {
        metadata: {
          preset,
          startDate: startDate || null,
          endDate: endDate || null,
          rowsExported: filteredData.length,
        }
      });
    } catch (logErr) {
      console.error('Failed to log sales history export:', logErr);
    }

    return new NextResponse(buf as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${filenameStr}.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (err: any) {
    console.error("Export error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
