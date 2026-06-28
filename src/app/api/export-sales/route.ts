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

    const worksheet = XLSX.utils.json_to_sheet(rowsToExport);
    const workbook = XLSX.utils.book_new();
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
