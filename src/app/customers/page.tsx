"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Users, UserRound, RefreshCw, Download, Search, Settings2, 
  CheckCircle2, XCircle, QrCode
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { generateMockCustomers, Customer } from "./mock-data";
import { exportCustomersToExcel } from "./export-excel";
import { useProfile } from "@/components/profile-provider";

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

// Custom Progress Bar Component
const CustomProgress = ({ value, max }: { value: number, max: number }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden mt-1">
      <div 
        className="bg-[#C2456A] h-full transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

export default function CustomerManagementPage() {
  const { profile } = useProfile();
  const adminName = profile?.display_name || "Administrator";
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  
  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

  // Settings State
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settings, setSettings] = useState({
    purchasesRequired: 10,
    reward: "Free Drink",
    rewardQuantity: 1,
    enabled: true
  });

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setCustomers(generateMockCustomers());
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Derived KPIs
  const totalMembers = customers.length;
  const activeCards = customers.filter(c => c.status === "Active").length;
  const inactiveCards = customers.filter(c => c.status === "Inactive").length;
  const membersRedeemed = customers.filter(c => 
    c.recentActivity.some(a => a.action.includes("Redeemed"))
  ).length;

  // Filter 
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            c.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            c.cardNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [customers, searchQuery, statusFilter]);

  // Handlers
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setCustomers(generateMockCustomers());
      setLoading(false);
      toast.success("Customer list refreshed.");
    }, 600);
  };

  const handleExport = async () => {
    const dataToExport = filteredCustomers.length === 0 ? [] : filteredCustomers;
    
    if (dataToExport.length === 0) {
      toast.error("No customer records available to export.");
      return;
    }

    let reportScope = "Search Results / Filtered";
    if (searchQuery === "" && statusFilter === "All") {
      reportScope = "All Customers";
    }

    try {
      await exportCustomersToExcel({
        customers: dataToExport,
        allCustomersLength: customers.length,
        reportScope,
        adminName,
        settings
      });
      toast.success("Customer data exported successfully.");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to generate export file.");
    }
  };

  const handleSaveSettings = () => {
    setIsSettingsModalOpen(false);
    toast.success("Loyalty program settings saved.");
  };

  const openCustomerDrawer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDrawerOpen(true);
  };

  const toggleCustomerStatus = (checked: boolean) => {
    if (!selectedCustomer) return;
    const newStatus = checked ? "Active" : "Inactive";
    
    // Update local state
    const updatedCustomer = { ...selectedCustomer, status: newStatus as "Active" | "Inactive" };
    setSelectedCustomer(updatedCustomer);
    
    // Update main list
    setCustomers(customers.map(c => 
      c.id === selectedCustomer.id ? updatedCustomer : c
    ));
    
    toast.success(`Card ${newStatus.toLowerCase()} successfully.`);
  };

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

  // AG Grid Configuration
  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
    params.api.sizeColumnsToFit();
  }, []);

  const colDefs = useMemo<ColDef<Customer>[]>(
    () => [
      {
        field: "name",
        headerName: "Customer",
        cellRenderer: (params: any) => {
          if (!params.data) return null;
          return (
            <div style={{ display: "flex", alignItems: "center", height: "100%", gap: "12px" }}>
               <div className="h-8 w-8 rounded-full bg-[#fbe4ea] text-[#C2456A] flex items-center justify-center text-xs font-bold shrink-0">
                  {getInitials(params.data.name)}
               </div>
               <div className="flex flex-col justify-center leading-tight">
                  <span className="font-medium text-sm text-foreground">{params.data.name}</span>
                  <span className="text-xs text-muted-foreground">{params.data.email}</span>
               </div>
            </div>
          );
        },
        minWidth: 200,
      },
      { field: "cardNumber", headerName: "Card Number", minWidth: 150 },
      {
        field: "currentStamps",
        headerName: "Progress",
        cellRenderer: (params: any) => {
          if (params.value === undefined) return null;
          return (
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%", width: "100%", maxWidth: "120px" }}>
              <span className="text-xs font-medium text-right mb-0.5 mt-2">
                {params.value} / {settings.purchasesRequired}
              </span>
              <CustomProgress value={params.value} max={settings.purchasesRequired} />
            </div>
          );
        },
        minWidth: 150,
      },
      {
        field: "membershipDate",
        headerName: "Membership Date",
        valueFormatter: (params) => {
          if (!params.value) return "";
           return new Date(params.value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        },
        minWidth: 150,
      },
      {
        field: "status",
        headerName: "Status",
        cellRenderer: (params: any) => {
          if (!params.value) return null;
          const isActive = params.value === "Active";
          return (
            <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
              <Badge variant={isActive ? "default" : "secondary"}
                     className={isActive ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-transparent shadow-none" : "bg-gray-100 text-gray-800 hover:bg-gray-200"}>
                {params.value}
              </Badge>
            </div>
          );
        },
        minWidth: 120,
      },
      {
        headerName: "Actions",
        pinned: "right" as const,
        width: 100,
        minWidth: 100,
        maxWidth: 100,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          if (!params.data) return null;
          return (
            <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
              <Button variant="outline" size="sm" onClick={() => openCustomerDrawer(params.data)}>
                View
              </Button>
            </div>
          );
        }
      }
    ],
    [settings.purchasesRequired]
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      suppressMovable: true,
    }),
    [],
  );

  return (
    <div className="flex flex-col flex-1 w-full max-w-7xl mx-auto h-full space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-6 mb-2">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-6 border-b border-[#C2456A]/10">
          <div>
            <p className="text-xs font-medium text-[#C2456A] uppercase tracking-widest mb-1">
              Customer Records
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Customer Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage loyalty members, digital cards, and promotional loyalty settings.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button variant="outline" onClick={handleRefresh} disabled={loading} className="bg-background">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" className="bg-background" onClick={() => setIsSettingsModalOpen(true)}>
              <Settings2 className="h-4 w-4 mr-2" />
              Configuration
            </Button>
            <Button variant="default" onClick={handleExport} className="bg-[#C2456A] hover:bg-[#a13958]">
              <Download className="h-4 w-4 mr-2" />
              Export Customers
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Members</CardTitle>
            <div className="bg-muted p-1.5 rounded-md">
              <Users className="h-4 w-4 text-foreground/70" />
            </div>
          </CardHeader>
          <CardContent className="pt-1">
            {loading ? <Skeleton className="h-10 w-20 mb-1" /> : (
              <div className="text-3xl font-bold tracking-tight leading-none mb-1">{totalMembers.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground">Registered loyalty customers</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Active Cards</CardTitle>
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-1.5 rounded-md">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-1">
             {loading ? <Skeleton className="h-10 w-20 mb-1 bg-emerald-100" /> : (
              <div className="text-3xl font-bold tracking-tight leading-none text-emerald-700 dark:text-emerald-400 mb-1">
                {activeCards.toLocaleString()}
              </div>
             )}
             <p className="text-xs text-muted-foreground">Currently active in portal</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-amber-700 dark:text-amber-400">Inactive Cards</CardTitle>
            <div className="bg-amber-100 dark:bg-amber-900/30 p-1.5 rounded-md">
              <XCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-1">
            {loading ? <Skeleton className="h-10 w-20 mb-1 bg-amber-100" /> : (
              <div className="text-3xl font-bold tracking-tight leading-none text-amber-700 dark:text-amber-400 mb-1">
                {inactiveCards.toLocaleString()}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Suspended or disabled</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Members Redeemed Reward</CardTitle>
            <div className="bg-[#fbe4ea] p-1.5 rounded-md">
              <Settings2 className="h-4 w-4 text-[#C2456A]" />
            </div>
          </CardHeader>
          <CardContent className="pt-1">
            {loading ? <Skeleton className="h-10 w-20 mb-1" /> : (
              <div className="text-3xl font-bold tracking-tight leading-none text-[#C2456A] mb-1">
                {membersRedeemed.toLocaleString()}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Redeemed at least 1 free drink</p>
          </CardContent>
        </Card>
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
          <div className="relative flex-1 w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search-filter"
              placeholder="Search name, email, or card number..."
              className="pl-9 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="status-filter" className="w-[140px] bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 w-full bg-card rounded-lg border shadow-sm flex flex-col overflow-hidden min-h-[500px]">
        {loading ? (
           <div className="flex-1 flex flex-col items-center justify-center space-y-4 p-8">
             <Skeleton className="h-12 w-full rounded-md" />
             <Skeleton className="h-12 w-full rounded-md" />
             <Skeleton className="h-12 w-full rounded-md" />
             <Skeleton className="h-12 w-full rounded-md" />
           </div>
        ) : (
          <div
            className="ag-theme-quartz flex-1 w-full h-full"
            style={{ 
              "--ag-active-color": "#C2456A",
              "--ag-wrapper-border-radius": "0px",
              "--ag-header-background-color": "hsl(var(--muted) / 0.5)",
              "--ag-row-hover-color": "hsl(var(--muted) / 0.3)",
              "--ag-border-color": "hsl(var(--border))",
            } as React.CSSProperties}
          >
            <AgGridReact
              theme="legacy"
              rowData={filteredCustomers}
              columnDefs={colDefs}
              defaultColDef={defaultColDef}
              onGridReady={onGridReady}
              rowHeight={64}
              headerHeight={48}
              pagination={true}
              paginationPageSize={20}
              paginationPageSizeSelector={[20, 50, 100]}
              animateRows={true}
              domLayout="autoHeight"
            />
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <Dialog open={isSettingsModalOpen} onOpenChange={setIsSettingsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Loyalty Program Configuration</DialogTitle>
            <DialogDescription>
              Update promotional settings globally.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Required</Label>
              <Input 
                type="number" 
                min="1"
                value={settings.purchasesRequired}
                onChange={(e) => setSettings({...settings, purchasesRequired: parseInt(e.target.value) || 1})}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Reward</Label>
              <Select value={settings.reward} onValueChange={(val) => setSettings({...settings, reward: val})}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Free Drink">Free Drink</SelectItem>
                  <SelectItem value="Free Coffee">Free Coffee</SelectItem>
                  <SelectItem value="Free Pastry">Free Pastry</SelectItem>
                  <SelectItem value="Discount">Discount</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Quantity</Label>
              <Input 
                type="number" 
                min="1"
                value={settings.rewardQuantity}
                onChange={(e) => setSettings({...settings, rewardQuantity: parseInt(e.target.value) || 1})}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Status</Label>
              <div className="col-span-3 flex items-center gap-2">
                <Switch 
                  checked={settings.enabled}
                  onCheckedChange={(c) => setSettings({...settings, enabled: c})}
                />
                <span className="text-sm text-muted-foreground">{settings.enabled ? "Enabled" : "Disabled"}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSaveSettings} className="bg-[#C2456A] hover:bg-[#a13958]">
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto border-l p-0 flex flex-col h-full bg-background">
          {selectedCustomer && (
            <>
              <SheetHeader className="p-6 border-b bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                   <div className="h-14 w-14 rounded-full bg-[#fbe4ea] text-[#C2456A] flex items-center justify-center text-xl font-bold shrink-0 shadow-sm border border-[#C2456A]/20">
                      {getInitials(selectedCustomer.name)}
                    </div>
                    <div className="space-y-1 mt-1 text-left">
                      <SheetTitle className="text-xl">{selectedCustomer.name}</SheetTitle>
                      <SheetDescription className="text-sm">{selectedCustomer.email}</SheetDescription>
                    </div>
                </div>
              </SheetHeader>
              
              <div className="p-6 space-y-8 flex-1">
                
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Customer Name</p>
                      <p className="font-medium">{selectedCustomer.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Email</p>
                      <p className="font-medium">{selectedCustomer.email}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Member Since</p>
                      <p className="font-medium">{new Date(selectedCustomer.membershipDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Card Number</p>
                      <p className="font-mono text-xs mt-1 bg-muted px-2 py-1 rounded inline-block">{selectedCustomer.cardNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Digital Card */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Digital Card</h3>
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-card shadow-sm">
                    <div>
                      <p className="font-medium text-sm">Card Status</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Toggle to enable/disable member.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${selectedCustomer.status === 'Active' ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                        {selectedCustomer.status}
                      </span>
                      <Switch 
                        checked={selectedCustomer.status === "Active"}
                        onCheckedChange={toggleCustomerStatus}
                      />
                    </div>
                  </div>
                </div>

                {/* Loyalty Progress */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Loyalty Progress</h3>
                  <Card className="shadow-sm border-none bg-muted/40">
                    <CardContent className="p-4 space-y-4">
                      <div>
                        <div className="flex justify-between items-end mb-2">
                          <p className="text-sm font-medium">Current Stamps</p>
                          <p className="text-xl font-bold text-[#C2456A]">
                            {selectedCustomer.currentStamps} <span className="text-sm text-muted-foreground font-normal">/ {settings.purchasesRequired}</span>
                          </p>
                        </div>
                        <CustomProgress value={selectedCustomer.currentStamps} max={settings.purchasesRequired} />
                        <p className="text-xs text-muted-foreground mt-2 text-right">
                          {settings.purchasesRequired - selectedCustomer.currentStamps} purchases until {settings.reward}
                        </p>
                      </div>
                      <div className="pt-3 border-t grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Next Reward</p>
                          <p className="text-sm font-medium">{settings.rewardQuantity} {settings.reward}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Lifetime Purchases</p>
                          <p className="text-sm font-medium">{selectedCustomer.lifetimePurchases}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* QR Code Placeholder */}
                <div className="space-y-4">
                   <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Authentication</h3>
                   <div className="border border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center bg-muted/20">
                     <div className="w-32 h-32 bg-white rounded-xl shadow-sm border p-3 mb-3 flex items-center justify-center">
                       <QrCode className="w-full h-full text-slate-800" strokeWidth={1.5} />
                     </div>
                     <p className="text-xs font-medium">Generated by Loyalty Portal</p>
                     <p className="text-[10px] text-muted-foreground mt-1">Unique ID: {selectedCustomer.id.padStart(8, '0')}</p>
                   </div>
                </div>

                {/* Recent Activity */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent Loyalty Activity</h3>
                  <div className="relative border-l-2 border-muted ml-3 space-y-6">
                    {selectedCustomer.recentActivity.slice(0, 3).map((activity) => (
                      <div key={activity.id} className="relative pl-6">
                        <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-background border-2 border-[#C2456A]" />
                        <div>
                          <p className="text-sm font-medium">{activity.action}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={activity.detail.includes("+") ? "default" : "secondary"} className={`text-[10px] px-1.5 py-0 ${activity.detail.includes("+") ? 'bg-[#fbe4ea] text-[#C2456A] hover:bg-[#fbe4ea]' : ''}`}>
                              {activity.detail}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">{activity.date}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {selectedCustomer.recentActivity.length === 0 && (
                      <div className="pl-6 text-sm text-muted-foreground">No recent activity</div>
                    )}
                  </div>
                  {selectedCustomer.recentActivity.length > 3 && (
                    <Button 
                      variant="link" 
                      className="text-[#C2456A] hover:text-[#a13958] p-0 h-auto mt-2 font-medium"
                      onClick={() => setIsActivityModalOpen(true)}
                    >
                      View all {selectedCustomer.recentActivity.length}{" "}activities &rarr;
                    </Button>
                  )}
                </div>

              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Full Activity History Modal */}
      <Dialog open={isActivityModalOpen} onOpenChange={setIsActivityModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Activity History</DialogTitle>
            <DialogDescription>
              Complete loyalty program activity for {selectedCustomer?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4 pr-2">
            <div className="relative border-l-2 border-muted ml-3 space-y-6">
              {selectedCustomer?.recentActivity.map((activity) => (
                <div key={activity.id} className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-background border-2 border-[#C2456A]" />
                  <div>
                    <p className="text-sm font-medium">{activity.action}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={activity.detail.includes("+") ? "default" : "secondary"} className={`text-[10px] px-1.5 py-0 ${activity.detail.includes("+") ? 'bg-[#fbe4ea] text-[#C2456A] hover:bg-[#fbe4ea]' : ''}`}>
                        {activity.detail}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">{activity.date}</span>
                    </div>
                  </div>
                </div>
              ))}
              {selectedCustomer?.recentActivity.length === 0 && (
                <div className="pl-6 text-sm text-muted-foreground">No activity history available.</div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActivityModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
