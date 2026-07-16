import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import * as XLSX from "xlsx";
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

    if (!data || data.length === 0) {
      return NextResponse.json({ message: "No transactions found" }, { status: 404 });
    }

    let filteredData = data;

    // Apply global filter in memory
    if (globalFilter) {
      const lowerQ = globalFilter.toLowerCase();
      filteredData = data.filter((order) => {
        const items = order.order_items || [];
        const matchesGlobal =
          (order.order_id || "").toLowerCase().includes(lowerQ) ||
          (order.customer_name || "").toLowerCase().includes(lowerQ) ||
          (order.cashier_name || "").toLowerCase().includes(lowerQ) ||
          items.some((i: any) => (i.name || "").toLowerCase().includes(lowerQ));
        return matchesGlobal;
      });
    }

    if (filteredData.length === 0) {
      return NextResponse.json({ message: "No transactions found" }, { status: 404 });
    }

    // Format data for Excel
    const rowsToExport = filteredData.map((tx) => {
      const itemsFormatted = (tx.order_items || []).map((i: any) => {
        const parts = [i.name];
        if (i.size) parts.push(`(${i.size})`);
        if (i.temperature) parts.push(`(${i.temperature})`);
        parts.push(`(x${i.quantity})`);
        return parts.join(" ");
      }).join(", ");

      return {
        "Order ID": tx.order_id,
        "Date & Time": format(new Date(tx.created_at), "MMM dd, yyyy h:mm a"),
        Customer: tx.customer_name,
        Status: tx.status,
        "Item/s": itemsFormatted,
        Amount: tx.amount,
        "Payment Method": tx.payment_method,
        Cashier: tx.cashier_name,
      };
    });

    // ── Fetch Dashboard KPIs and Revenue Trend ──
    const [kpisRes, trendRes] = await Promise.all([
      supabase.rpc("get_dashboard_kpis"),
      supabase.rpc("get_dashboard_revenue_trend"),
    ]);

    const workbook = XLSX.utils.book_new();

    // Sheet 1: Dashboard Summary (KPI Cards)
    const kpiRow = kpisRes.data;
    if (kpiRow) {
      const kpiData = [
        { Metric: "Today's Revenue", Value: `₱${Number(kpiRow.today_revenue || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}` },
        { Metric: "Yesterday's Revenue", Value: `₱${Number(kpiRow.yesterday_revenue || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}` },
        { Metric: "Revenue Change (%)", Value: `${kpiRow.revenue_change || 0}%` },
        { Metric: "Today's Orders", Value: kpiRow.today_orders || 0 },
        { Metric: "Yesterday's Orders", Value: kpiRow.yesterday_orders || 0 },
        { Metric: "Orders Change (%)", Value: `${kpiRow.orders_change || 0}%` },
        { Metric: "Avg. Order Value (Today)", Value: `₱${Number(kpiRow.today_avg_order || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}` },
        { Metric: "Avg. Order Value (Yesterday)", Value: `₱${Number(kpiRow.yesterday_avg_order || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}` },
        { Metric: "AOV Change (%)", Value: `${kpiRow.aov_change || 0}%` },
      ];
      const kpiSheet = XLSX.utils.json_to_sheet(kpiData);
      XLSX.utils.book_append_sheet(workbook, kpiSheet, "Dashboard Summary");
    }

    // Sheet 2: Revenue Trend (7-day)
    const trendData = trendRes.data;
    if (trendData && trendData.length > 0) {
      const trendRows = trendData.map((d: any) => ({
        Day: d.day_label,
        Date: d.day_date,
        Revenue: Number(d.total_revenue || 0),
      }));
      const trendSheet = XLSX.utils.json_to_sheet(trendRows);
      XLSX.utils.book_append_sheet(workbook, trendSheet, "Revenue Trend");
    }

    // Sheet 3: Sales History (individual orders)
    const worksheet = XLSX.utils.json_to_sheet(rowsToExport);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales History");

    // Generate buffer
    const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Format filename
    let filenameStr = "Sales_Report";
    if (preset === "Today" || preset === "Yesterday" || preset === "Last 7 Days" || preset === "Last 30 Days" || preset === "This Month" || preset === "Last Month") {
        filenameStr += `_${preset.replace(/ /g, "_")}`;
    } else if (startDate && endDate) {
        filenameStr += `_${startDate}_to_${endDate}`;
    } else {
        filenameStr += `_${format(new Date(), "yyyyMMdd")}`;
    }
    
    // Log the export event
    const { logAppEvent } = await import('@/app/audit/actions');
    await logAppEvent('Report Exported', 'Low', 'Report', `${filenameStr}.xlsx`, {
      metadata: {
        preset,
        startDate: startDate || null,
        endDate: endDate || null,
        rowsExported: rowsToExport.length,
      }
    });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${filenameStr}.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
