"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ColDef,
  GridReadyEvent,
  GridApi,
  ModuleRegistry,
  AllCommunityModule,
} from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

ModuleRegistry.registerModules([AllCommunityModule]);

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Download,
  Plus,
  Trash2,
  Upload,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

import { Transaction, OrderItem } from "./data";
import { createClient } from "@/app/lib/supabase/client";
import { AddTransactionModal } from "./components/add-transaction-modal";
import { AuthorizationModal } from "./components/authorization-modal";
import { TransactionDrawer } from "./components/transaction-drawer";
import { MobileTransactionCard } from "./components/mobile-transaction-card";
import { format, subDays } from "date-fns";
import { ExportModal } from "./components/export-modal";
import { MassUploadModal } from "./components/mass-upload-modal";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useProfile } from "@/components/profile-provider";
import { Product } from "./components/product-catalog";

function formatItems(items: OrderItem[]): string {
  return items
    .map((i) => {
      const parts = [i.name];
      if (i.size) parts.push(`(${i.size})`);
      if (i.temperature) parts.push(`(${i.temperature})`);
      parts.push(`(x${i.qty})`);
      return parts.join(" ");
    })
    .join(", ");
}

const PAGE_SIZE = 20;

export default function SalesHistoryPage() {
  const { profile } = useProfile();
  const isAdmin = profile?.role === "Administrator";

  const [rowData, setRowData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [selectedRows, setSelectedRows] = useState<Transaction[]>([]);

  // Server-side Pagination State
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // External Filters
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [cashierFilter, setCashierFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isMassUploadOpen, setIsMassUploadOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    actionType: "edit" | "delete";
    targetTx?: Transaction | Transaction[];
  }>({ isOpen: false, actionType: "delete" });

  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [drawerTx, setDrawerTx] = useState<Transaction | null>(null);

  const currentUser = "Admin User";
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // Reset page when filters change
  const handleFilterChange = (setter: (val: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  useEffect(() => {
    const supabase = createClient();

    // Fetch dropdown options asynchronously
    supabase
      .from("payment_methods")
      .select("name")
      .eq("is_enabled", true)
      .order("name")
      .then(({ data }) => {
        if (data) setPaymentMethods(data.map((row) => row.name));
      });

    supabase
      .from("products")
      .select(
        "id, name, product_categories ( name ), product_variants ( price, sizes ( name ), temperatures ( name ) )",
      )
      .eq("is_visible", true)
      .is("archived_at", null)
      .order("name")
      .then(({ data }) => {
        if (data) {
          const mapped: Product[] = data.map((p: any) => ({
            id: p.id,
            name: p.name,
            category: p.product_categories?.name ?? "Other",
            variants: (p.product_variants ?? []).map((v: any) => ({
              size: v.sizes?.name ?? null,
              temp: v.temperatures?.name ?? null,
              price: v.price,
            })),
          }));
          setProducts(mapped);
        }
      });
  }, []);

  // Optimized fetch function executing server-side pagination, sorting, and filtering
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      // 1. Optimized Select Payload: Request only specific fields required for grid/drawer
      let query = supabase.from("orders").select(
        `
          id, order_id, customer_name, status, amount, payment_method, 
          cashier_name, cash_tendered, change_amount, created_by, 
          created_at, last_modified_by, last_modified_at,
          order_items (
            product_id, name, quantity, size, temperature, unit_price, subtotal
          )
        `,
        { count: "exact" },
      );

      // 2. Server-side Filtering
      if (statusFilter !== "All") {
        query = query.eq("status", statusFilter);
      }
      if (paymentFilter !== "All") {
        query = query.eq("payment_method", paymentFilter);
      }
      if (cashierFilter !== "All") {
        query = query.eq("cashier_name", cashierFilter);
      }

      if (dateFilter === "Today") {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        query = query.gte("created_at", startOfDay.toISOString());
      } else if (dateFilter === "Past Week") {
        query = query.gte("created_at", subDays(new Date(), 7).toISOString());
      } else if (dateFilter === "Past Month") {
        query = query.gte("created_at", subDays(new Date(), 30).toISOString());
      }

      if (globalFilter.trim() !== "") {
        const pattern = `%${globalFilter.trim()}%`;
        query = query.or(
          `order_id.ilike.${pattern},customer_name.ilike.${pattern},cashier_name.ilike.${pattern}`,
        );
      }

      // 3. Server-side Sorting and Pagination
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      query = query.order("created_at", { ascending: false }).range(from, to);

      const { data, count, error } = await query;

      if (error) throw error;

      if (count !== null) setTotalCount(count);

      const transactions: Transaction[] = (data || []).map((order) => ({
        id: order.id,
        orderId: order.order_id,
        customerName: order.customer_name,
        status: order.status,
        amount: order.amount,
        paymentMethod: order.payment_method,
        cashier: order.cashier_name,
        cashTendered: order.cash_tendered,
        changeAmount: order.change_amount,
        createdBy: order.created_by ?? currentUser,
        createdAt: order.created_at,
        lastModifiedBy: order.last_modified_by ?? "",
        lastModifiedAt: order.last_modified_at ?? "",
        items: (order.order_items ?? []).map((i: any) => ({
          productId: i.product_id ?? undefined,
          name: i.name,
          qty: i.quantity,
          size: i.size ?? "",
          temperature: i.temperature ?? "",
          unitPrice: i.unit_price ?? 0,
        })),
      }));

      setRowData(transactions);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch transactions.", { duration: 1500 });
    } finally {
      setLoading(false);
    }
  }, [
    page,
    globalFilter,
    statusFilter,
    paymentFilter,
    cashierFilter,
    dateFilter,
  ]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
    params.api.sizeColumnsToFit();
  }, []);

  const onSelectionChanged = useCallback(() => {
    if (gridApi) {
      setSelectedRows(gridApi.getSelectedRows());
    }
  }, [gridApi]);

  // Actions
  const handleExport = useCallback(() => {
    setIsExportModalOpen(true);
  }, []);

  const triggerExport = async (
    startDate: string,
    endDate: string,
    preset: string,
  ) => {
    setIsExporting(true);
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append("startDate", startDate);
      if (endDate) queryParams.append("endDate", endDate);
      if (globalFilter) queryParams.append("globalFilter", globalFilter);
      if (statusFilter !== "All")
        queryParams.append("statusFilter", statusFilter);
      if (paymentFilter !== "All")
        queryParams.append("paymentFilter", paymentFilter);
      if (cashierFilter !== "All")
        queryParams.append("cashierFilter", cashierFilter);
      queryParams.append("preset", preset);

      const response = await fetch(
        `/api/export-sales?${queryParams.toString()}`,
      );

      if (!response.ok) {
        toast.error("Failed to export data.", { duration: 1500 });
        setIsExporting(false);
        return;
      }

      const contentDisposition = response.headers.get("content-disposition");
      let filename = "Sales_History.xlsx";
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setIsExportModalOpen(false);
      toast.success("Sales history exported successfully.", { duration: 1500 });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("An error occurred during export.", { duration: 1500 });
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddTransaction = async (newTx: Omit<Transaction, "id">) => {
    const supabase = createClient();

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_id: newTx.orderId,
        customer_name: newTx.customerName,
        status: newTx.status,
        amount: newTx.amount,
        payment_method: newTx.paymentMethod,
        cashier_name: newTx.cashier,
      })
      .select("id")
      .single();

    if (orderError) {
      alert(`Failed to save order: ${orderError.message}`);
      return;
    }

    const orderItemRows = newTx.items.map((item) => ({
      order_id: orderData.id,
      product_id: item.productId || null,
      name: item.name,
      size: item.size || null,
      temperature: item.temperature || null,
      quantity: item.qty,
      unit_price: item.unitPrice,
      subtotal: item.unitPrice * item.qty,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItemRows);

    if (itemsError) {
      alert(`Failed to save items: ${itemsError.message}`);
      return;
    }

    setIsAddModalOpen(false);
    fetchOrders();
  };

  const requestDelete = (txs: Transaction | Transaction[]) => {
    setAuthModal({ isOpen: true, actionType: "delete", targetTx: txs });
  };

  const requestEdit = (tx: Transaction) => {
    setAuthModal({ isOpen: true, actionType: "edit", targetTx: tx });
  };

  const handleAuthorize = async () => {
    const { actionType, targetTx } = authModal;
    const supabase = createClient();

    if (actionType === "delete" && targetTx) {
      const txsToDelete = Array.isArray(targetTx) ? targetTx : [targetTx];
      const idsToDelete = txsToDelete.map((t) => t.id);

      const { error } = await supabase
        .from("orders")
        .delete()
        .in("id", idsToDelete);

      if (error) {
        const errorMessage = error.message.includes("loyalty_log_order_id_fkey")
          ? "Cannot delete transactions of customers in a loyalty program!"
          : `Failed to delete transactions: ${error.message}`;
        toast.error(errorMessage, { duration: 1500 });
        setAuthModal({ isOpen: false, actionType: "delete" });
        return;
      }

      toast.success(
        `${txsToDelete.length} transaction(s) deleted successfully.`,
        { duration: 1500 },
      );
      setSelectedRows([]);
      fetchOrders();
    } else if (actionType === "edit" && targetTx && !Array.isArray(targetTx)) {
      const { error } = await supabase
        .from("orders")
        .update({
          customer_name: targetTx.customerName,
          status: targetTx.status,
          payment_method: targetTx.paymentMethod,
          last_modified_at: new Date().toISOString(),
        })
        .eq("id", targetTx.id);

      if (error) {
        toast.error(`Failed to save changes: ${error.message}`, {
          duration: 1500,
        });
        setAuthModal({ isOpen: false, actionType: "delete" });
        return;
      }

      toast.success("Transaction updated successfully.", { duration: 1500 });
      fetchOrders();
    }

    setAuthModal({ isOpen: false, actionType: "delete" });
  };

  const colDefs = useMemo<ColDef<Transaction>[]>(
    () => [
      {
        field: "orderId",
        headerName: "Order ID",
        minWidth: 160,
        pinned: "left",
      },
      {
        field: "createdAt",
        headerName: "Date & Time",
        valueFormatter: (params) => {
          try {
            return format(new Date(params.value), "MMM dd, yyyy h:mm a");
          } catch {
            return params.value;
          }
        },
        minWidth: 180,
      },
      { field: "customerName", headerName: "Customer", minWidth: 150 },
      {
        field: "status",
        headerName: "Status",
        cellRenderer: (params: any) => (
          <div
            style={{ display: "flex", alignItems: "center", height: "100%" }}
          >
            <Badge
              variant={
                params.value.includes("Void") ? "destructive" : "outline"
              }
              className="font-normal"
            >
              {params.value}
            </Badge>
          </div>
        ),
        minWidth: 140,
      },
      {
        field: "items",
        headerName: "Item/s",
        valueGetter: (params) =>
          params.data ? formatItems(params.data.items) : "",
        minWidth: 200,
        flex: 1,
      },
      {
        field: "amount",
        headerName: "Amount",
        valueFormatter: (params) => `₱${params.value?.toFixed(2)}`,
        minWidth: 120,
      },
      {
        field: "paymentMethod",
        headerName: "Payment Method",
        cellRenderer: (params: any) => (
          <div
            style={{ display: "flex", alignItems: "center", height: "100%" }}
          >
            <span className="text-xs font-medium border px-2 py-0.5 rounded-full bg-muted/50 inline-block">
              {params.value}
            </span>
          </div>
        ),
        minWidth: 140,
      },
      { field: "cashier", headerName: "Cashier", minWidth: 150 },
      ...(isAdmin
        ? [
            {
              headerName: "Actions",
              pinned: "right" as const,
              width: 100,
              minWidth: 100,
              maxWidth: 100,
              sortable: false,
              filter: false,
              cellRenderer: (params: any) => (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    height: "100%",
                  }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      requestDelete(params.data);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ),
            },
          ]
        : []),
    ],
    [isAdmin],
  );

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  return (
    <>
      <div className="flex flex-col flex-1 w-full max-w-7xl mx-auto h-full space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-6 mb-2">
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-6 border-b border-[#C2456A]/10">
            <div>
              <p className="text-xs font-medium text-[#C2456A] uppercase tracking-widest mb-1">
                Transaction Records
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Sales History
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                View, search, manage, and export transaction records from the
                POS system.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {selectedRows.length > 0 && isDesktop && isAdmin && (
                <Button
                  variant="destructive"
                  onClick={() => requestDelete(selectedRows)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected ({selectedRows.length})
                </Button>
              )}
              <Button
                variant="outline"
                className="bg-background"
                onClick={handleExport}
              >
                <Download className="h-4 w-4 mr-2" /> Export Excel
              </Button>
              <Button
                variant="outline"
                className="bg-background"
                onClick={() => setIsMassUploadOpen(true)}
              >
                <Upload className="h-4 w-4 mr-2" /> Bulk Add
              </Button>
              <Button onClick={() => setIsAddModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add Transaction
              </Button>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 bg-card p-3 rounded-lg border shadow-sm">
          <div className="flex flex-col gap-1 flex-1">
            <Label
              htmlFor="search-filter"
              className="text-xs text-muted-foreground"
            >
              Search
            </Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-filter"
                type="text"
                placeholder="Search transaction ID, customer, cashier..."
                className="pl-9"
                value={globalFilter}
                onChange={(e) =>
                  handleFilterChange(setGlobalFilter, e.target.value)
                }
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col gap-1">
              <Label
                htmlFor="status-filter"
                className="text-xs text-muted-foreground"
              >
                Status
              </Label>
              <Select
                value={statusFilter}
                onValueChange={(val) =>
                  handleFilterChange(setStatusFilter, val ?? "All")
                }
              >
                <SelectTrigger id="status-filter" className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Void (Consumed)">
                    Void (Consumed)
                  </SelectItem>
                  <SelectItem value="Void (Not Made)">
                    Void (Not Made)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label
                htmlFor="payment-filter"
                className="text-xs text-muted-foreground"
              >
                Payment
              </Label>
              <Select
                value={paymentFilter}
                onValueChange={(val) =>
                  handleFilterChange(setPaymentFilter, val ?? "All")
                }
              >
                <SelectTrigger id="payment-filter" className="w-[140px]">
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Payments</SelectItem>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label
                htmlFor="date-filter"
                className="text-xs text-muted-foreground"
              >
                Date
              </Label>
              <Select
                value={dateFilter}
                onValueChange={(val) =>
                  handleFilterChange(setDateFilter, val ?? "All")
                }
              >
                <SelectTrigger id="date-filter" className="w-[140px]">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Time</SelectItem>
                  <SelectItem value="Today">Today</SelectItem>
                  <SelectItem value="Past Week">Past Week</SelectItem>
                  <SelectItem value="Past Month">Past Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Data View */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Loading transactions...
          </div>
        ) : isDesktop ? (
          <div className="flex-1 flex flex-col min-h-[500px] w-full border rounded-lg overflow-hidden shadow-sm">
            <div
              className="ag-theme-quartz flex-1"
              style={{ height: "100%", width: "100%" }}
            >
              <AgGridReact
                theme="legacy"
                rowData={rowData}
                columnDefs={colDefs}
                rowSelection={{
                  mode: "multiRow",
                  checkboxes: true,
                  headerCheckbox: true,
                }}
                onGridReady={onGridReady}
                onSelectionChanged={onSelectionChanged}
                onRowClicked={(e) => {
                  const target = e.event?.target as HTMLElement;
                  if (target?.closest("button")) return;
                  setDrawerTx(e.data);
                }}
                suppressCellFocus={true}
                animateRows={true}
                rowHeight={52}
                headerHeight={48}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pb-6">
            {rowData.map((tx) => (
              <MobileTransactionCard
                key={tx.id}
                transaction={tx}
                onClick={() => setDrawerTx(tx)}
              />
            ))}
          </div>
        )}

        {/* Server-Side Pagination Bar */}
        <div className="flex items-center justify-between px-2 py-3 bg-card border rounded-lg">
          <p className="text-xs text-muted-foreground">
            Showing <span className="font-medium">{rowData.length}</span> of{" "}
            <span className="font-medium">{totalCount}</span> results
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-xs font-medium">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modals & Drawers */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddTransaction}
        currentUser={currentUser}
        paymentMethods={paymentMethods}
        products={products}
      />
      <AuthorizationModal
        isOpen={authModal.isOpen}
        onClose={() => setAuthModal({ ...authModal, isOpen: false })}
        onAuthorize={handleAuthorize}
        actionType={authModal.actionType}
      />
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={triggerExport}
        isLoading={isExporting}
      />
      <MassUploadModal
        isOpen={isMassUploadOpen}
        onClose={() => setIsMassUploadOpen(false)}
        onUploaded={() => fetchOrders()}
        currentUser={currentUser}
        paymentMethods={paymentMethods}
        products={products}
      />
      <TransactionDrawer
        transaction={drawerTx}
        isOpen={!!drawerTx}
        onClose={() => setDrawerTx(null)}
        onEdit={requestEdit}
        onDelete={requestDelete}
        paymentMethods={paymentMethods}
      />
    </>
  );
}
