"use client";

import { useState, useCallback, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, GridReadyEvent, GridApi, ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

ModuleRegistry.registerModules([AllCommunityModule]);
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Plus, Trash2, Edit2 } from "lucide-react";

import { Transaction, initialTransactions, OrderItem } from "./data";
import { AddTransactionModal } from "./components/add-transaction-modal";
import { AuthorizationModal } from "./components/authorization-modal";
import { TransactionDrawer } from "./components/transaction-drawer";
import { MobileTransactionCard } from "./components/mobile-transaction-card";
import { format } from "date-fns";
import { useMediaQuery } from "@/hooks/use-media-query";

export default function SalesHistoryPage() {
  const [rowData, setRowData] = useState<Transaction[]>(initialTransactions);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [selectedRows, setSelectedRows] = useState<Transaction[]>([]);
  
  // External Filters
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [cashierFilter, setCashierFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; actionType: "edit" | "delete"; targetTx?: Transaction | Transaction[] }>({ isOpen: false, actionType: "delete" });
  
  // Drawer state
  const [drawerTx, setDrawerTx] = useState<Transaction | null>(null);

  const currentUser = "Admin User";
  
  // Responsive hook
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // Apply filters to derive displayed data
  const filteredTransactions = useMemo(() => {
    return rowData.filter(tx => {
      if (globalFilter) {
        const lowerQ = globalFilter.toLowerCase();
        const matchesGlobal = 
          tx.orderId.toLowerCase().includes(lowerQ) ||
          tx.customerName.toLowerCase().includes(lowerQ) ||
          tx.cashier.toLowerCase().includes(lowerQ) ||
          tx.items.some(i => i.name.toLowerCase().includes(lowerQ));
        if (!matchesGlobal) return false;
      }
      if (statusFilter !== "All" && !tx.status.includes(statusFilter)) return false;
      if (paymentFilter !== "All" && tx.paymentMethod !== paymentFilter) return false;
      if (cashierFilter !== "All" && tx.cashier !== cashierFilter) return false;
      if (dateFilter === "Today") {
         const today = new Date().toDateString();
         const txDate = new Date(tx.createdAt).toDateString();
         if (today !== txDate) return false;
      }
      return true;
    });
  }, [rowData, globalFilter, statusFilter, paymentFilter, cashierFilter, dateFilter]);

  // AG Grid Configuration
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
    // Export exactly what's filtered.
    const rowsToExport = filteredTransactions.map(tx => ({
      "Order ID": tx.orderId,
      "Date & Time": format(new Date(tx.createdAt), "MMM dd, yyyy h:mm a"),
      "Customer": tx.customerName,
      "Status": tx.status,
      "Item/s": tx.items.map((i: OrderItem) => i.name).join(", "),
      "Amount": tx.amount,
      "Payment Method": tx.paymentMethod,
      "Cashier": tx.cashier
    }));

    const worksheet = XLSX.utils.json_to_sheet(rowsToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales History");
    XLSX.writeFile(workbook, `Sales_History_${format(new Date(), "yyyyMMdd")}.xlsx`);
  }, [filteredTransactions]);

  const handleAddTransaction = (newTx: Omit<Transaction, "id">) => {
    const transaction: Transaction = {
      ...newTx,
      id: `tx-${Date.now()}`
    };
    setRowData(prev => [transaction, ...prev]);
    setIsAddModalOpen(false);
  };

  const requestDelete = (txs: Transaction | Transaction[]) => {
    setAuthModal({ isOpen: true, actionType: "delete", targetTx: txs });
  };

  const requestEdit = (tx: Transaction) => {
    setAuthModal({ isOpen: true, actionType: "edit", targetTx: tx });
  };

  const handleAuthorize = () => {
    const { actionType, targetTx } = authModal;
    
    if (actionType === "delete" && targetTx) {
      const txsToDelete = Array.isArray(targetTx) ? targetTx : [targetTx];
      const idsToDelete = new Set(txsToDelete.map(t => t.id));
      setRowData(prev => prev.filter(tx => !idsToDelete.has(tx.id)));
      
      if (drawerTx && idsToDelete.has(drawerTx.id)) {
        setDrawerTx(null);
      }
      setSelectedRows([]);
    } else if (actionType === "edit" && targetTx && !Array.isArray(targetTx)) {
      setRowData(prev => prev.map(tx => {
        if (tx.id === targetTx.id) {
           const updated = {
              ...targetTx, 
              lastModifiedBy: currentUser,
              lastModifiedAt: new Date().toISOString()
           };
           if (drawerTx?.id === tx.id) setDrawerTx(updated);
           return updated;
        }
        return tx;
      }));
    }
    
    setAuthModal({ isOpen: false, actionType: "delete" });
  };

  // Column Definitions
  const colDefs = useMemo<ColDef<Transaction>[]>(() => [
    { 
      field: "orderId", 
      headerName: "Order ID", 
      checkboxSelection: true,
      headerCheckboxSelection: true,
      minWidth: 160,
      pinned: "left"
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
      cellRenderer: (params: any) => {
        const status = params.value;
        if (status.includes("Void")) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <Badge variant="destructive" className="font-normal">{status}</Badge>
            </div>
          );
        }
        return (
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Badge 
              variant="outline" 
              className="font-normal bg-[#e8f4e8] text-[#4f9a5c] border-[#4f9a5c]/20 hover:bg-[#e8f4e8]/80"
            >
              {status}
            </Badge>
          </div>
        );
      },
      minWidth: 140
    },
    {
      field: "items",
      headerName: "Item/s",
      valueGetter: (params) => {
        if (!params.data) return "";
        return params.data.items.map(i => i.name).join(", ");
      },
      tooltipValueGetter: (params) => {
         if (!params.data) return "";
         return params.data.items.map(i => `${i.name} (x${i.qty})`).join(", ");
      },
      minWidth: 200,
      flex: 1
    },
    { 
      field: "amount", 
      headerName: "Amount",
      valueFormatter: (params) => `₱${params.value?.toFixed(2)}`,
      minWidth: 120
    },
    { 
      field: "paymentMethod", 
      headerName: "Payment Method",
      cellRenderer: (params: any) => {
        return (
           <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
             <span className="text-xs font-medium border px-2 py-0.5 rounded-full bg-muted/50 inline-block">
               {params.value}
             </span>
           </div>
        );
      },
      minWidth: 140 
    },
    { field: "cashier", headerName: "Cashier", minWidth: 150 },
    {
      headerName: "Actions",
      pinned: "right",
      width: 100,
      minWidth: 100,
      maxWidth: 100,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
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
        );
      }
    }
  ], []);

  const defaultColDef = useMemo<ColDef>(() => {
    return {
      sortable: true,
      filter: true,
      resizable: true,
      suppressMovable: true,
    };
  }, []);

  return (
    <>
      <div className="flex flex-col flex-1 w-full max-w-7xl mx-auto h-full space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sales History</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              View, search, manage, and export transaction records from the POS system.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {selectedRows.length > 0 && isDesktop && (
              <Button 
                variant="destructive" 
                onClick={() => requestDelete(selectedRows)}
                className="animate-in fade-in"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected ({selectedRows.length})
              </Button>
            )}
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 bg-card p-3 rounded-lg border shadow-sm">
           <div className="relative flex-1">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
             <Input
               type="text"
               placeholder="Search transactions..."
               className="pl-9"
               value={globalFilter}
               onChange={(e) => setGlobalFilter(e.target.value)}
             />
           </div>
           <div className="flex flex-wrap gap-3">
             <Select value={statusFilter} onValueChange={setStatusFilter}>
               <SelectTrigger className="w-[140px]">
                 <SelectValue placeholder="Status" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="All">All Statuses</SelectItem>
                 <SelectItem value="Completed">Completed</SelectItem>
                 <SelectItem value="Void">Voided</SelectItem>
               </SelectContent>
             </Select>

             <Select value={paymentFilter} onValueChange={setPaymentFilter}>
               <SelectTrigger className="w-[140px]">
                 <SelectValue placeholder="Payment" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="All">All Payments</SelectItem>
                 <SelectItem value="Cash">Cash</SelectItem>
                 <SelectItem value="GCash">GCash</SelectItem>
                 <SelectItem value="BPI">BPI</SelectItem>
                 <SelectItem value="Maya">Maya</SelectItem>
               </SelectContent>
             </Select>

             <Select value={cashierFilter} onValueChange={setCashierFilter}>
               <SelectTrigger className="w-[140px]">
                 <SelectValue placeholder="Cashier" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="All">All Cashiers</SelectItem>
                 <SelectItem value="Joshua T.">Joshua T.</SelectItem>
                 <SelectItem value="Maria R.">Maria R.</SelectItem>
               </SelectContent>
             </Select>

             <Select value={dateFilter} onValueChange={setDateFilter}>
               <SelectTrigger className="w-[140px]">
                 <SelectValue placeholder="Date" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="All">All Time</SelectItem>
                 <SelectItem value="Today">Today</SelectItem>
               </SelectContent>
             </Select>
           </div>
        </div>

        {/* Data View */}
        {isDesktop ? (
          <div className="flex-1 min-h-[500px] w-full border rounded-lg overflow-hidden shadow-sm">
            <div className="ag-theme-quartz" style={{ height: "100%", width: "100%" }}>
              <AgGridReact
                theme="legacy"
                rowData={filteredTransactions}
                columnDefs={colDefs}
                defaultColDef={defaultColDef}
                rowSelection={{
                  mode: "multiRow",
                }}
                pagination={true}
                paginationPageSize={20}
                onGridReady={onGridReady}
                onSelectionChanged={onSelectionChanged}
                onRowClicked={(e) => {
                  const target = e.event?.target as HTMLElement;
                  if (target?.closest('button')) return;
                  setDrawerTx(e.data);
                }}
                suppressCellFocus={true}
                animateRows={true}
                rowHeight={52}
                headerHeight={48}
                overlayNoRowsTemplate={
                  '<div class="flex flex-col items-center justify-center p-8 text-center space-y-3"><h3 class="font-semibold text-lg">No transactions found</h3><p class="text-sm text-muted-foreground">Try adjusting your filters or add a new transaction.</p></div>'
                }
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pb-6">
             <div className="text-sm text-muted-foreground mb-4">
               Showing {filteredTransactions.length} transactions
             </div>
             {filteredTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 border rounded-lg bg-card">
                  <h3 className="font-semibold text-lg">No transactions found</h3>
                  <p className="text-sm text-muted-foreground">Try adjusting your filters or add a new transaction.</p>
                </div>
             ) : (
               filteredTransactions.map(tx => (
                 <MobileTransactionCard 
                   key={tx.id} 
                   transaction={tx} 
                   onClick={() => setDrawerTx(tx)} 
                 />
               ))
             )}
          </div>
        )}
      </div>

      {/* Modals & Drawers */}
      <AddTransactionModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSave={handleAddTransaction} 
        currentUser={currentUser}
      />
      
      <AuthorizationModal 
        isOpen={authModal.isOpen} 
        onClose={() => setAuthModal({ ...authModal, isOpen: false })} 
        onAuthorize={handleAuthorize} 
        actionType={authModal.actionType} 
      />

      <TransactionDrawer
        transaction={drawerTx}
        isOpen={!!drawerTx}
        onClose={() => setDrawerTx(null)}
        onEdit={requestEdit}
        onDelete={requestDelete}
      />

    </>
  );
}
