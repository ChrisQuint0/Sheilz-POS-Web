"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { createClient } from "@/app/lib/supabase/client";

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────

export interface AnalyticsFilters {
  dateFrom: string; // ISO date string YYYY-MM-DD
  dateTo: string;
  category: string; // "all" | category name
  paymentMethod: string; // "all" | method name
  cashier: string; // "all" | cashier name
}

export interface KpiData {
  total_revenue: number;
  total_orders: number;
  avg_order_value: number;
  inventory_expenses: number;
  net_revenue: number;
  revenue_change: number;
  orders_change: number;
  aov_change: number;
}

export interface RevenuePeriod {
  period_label: string;
  total_sales: number;
}

export interface TopProduct {
  product_name: string;
  qty_sold: number;
  revenue: number;
}

export interface CategoryRevenue {
  category_name: string;
  revenue: number;
}

export interface PeakHour {
  hour_label: string;
  order_count: number;
}

export interface PeakDay {
  day_label: string;
  total_sales: number;
}

export interface PaymentMethod {
  method: string;
  revenue: number;
  percentage: number;
}

export interface TransactionStatus {
  status: string;
  order_count: number;
  percentage: number;
}

export interface VoidAnalysis {
  total_voids: number;
  revenue_lost: number;
  void_rate: number;
  total_orders: number;
}

export interface InventoryConsumption {
  item_name: string;
  unit: string;
  total_consumed: number;
}

export interface AnalyticsData {
  kpis: KpiData | null;
  revenue: RevenuePeriod[];
  topProducts: TopProduct[];
  categoryRevenue: CategoryRevenue[];
  peakHours: PeakHour[];
  peakDays: PeakDay[];
  paymentDistribution: PaymentMethod[];
  transactionStatus: TransactionStatus[];
  voidAnalysis: VoidAnalysis | null;
  mostConsumed: InventoryConsumption[];
  leastConsumed: InventoryConsumption[];
}

export interface AnalyticsContextType {
  filters: AnalyticsFilters;
  setFilters: React.Dispatch<React.SetStateAction<AnalyticsFilters>>;
  data: AnalyticsData;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  // Dropdown options loaded from DB
  categories: string[];
  paymentMethods: string[];
  cashiers: string[];
}

// ────────────────────────────────────────────────
// Default values
// ────────────────────────────────────────────────



const emptyData: AnalyticsData = {
  kpis: null,
  revenue: [],
  topProducts: [],
  categoryRevenue: [],
  peakHours: [],
  peakDays: [],
  paymentDistribution: [],
  transactionStatus: [],
  voidAnalysis: null,
  mostConsumed: [],
  leastConsumed: [],
};

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

// ────────────────────────────────────────────────
// Provider
// ────────────────────────────────────────────────

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateFrom: "",
    dateTo: "",
    category: "all",
    paymentMethod: "all",
    cashier: "all",
  });
  const [data, setData] = useState<AnalyticsData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dropdown options
  const [categories, setCategories] = useState<string[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [cashiers, setCashiers] = useState<string[]>([]);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load dropdown options once
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const [catRes, pmRes, cashierRes] = await Promise.all([
        supabase.from("product_categories").select("name").order("name"),
        supabase.rpc("get_analytics_payment_methods"),
        supabase.rpc("get_cashier_list"),
      ]);
      if (catRes.data) setCategories(catRes.data.map((r: { name: string }) => r.name));
      if (pmRes.data) setPaymentMethods(pmRes.data.map((r: { method_name: string }) => r.method_name));
      if (cashierRes.data) setCashiers(cashierRes.data.map((r: { cashier_name: string }) => r.cashier_name));
    })();
  }, []);

  // Fetch analytics data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    // Build date range as ISO timestamps or null for "all time"
    const dateFrom = filters.dateFrom ? `${filters.dateFrom}T00:00:00.000Z` : null;
    const dateTo = filters.dateTo ? `${filters.dateTo}T23:59:59.999Z` : null;

    try {
      const filterParams = {
        p_date_from: dateFrom,
        p_date_to: dateTo,
        p_category: filters.category,
        p_payment_method: filters.paymentMethod,
        p_cashier: filters.cashier,
      };

      const [
        kpisRes,
        revenueRes,
        topProductsRes,
        categoryRes,
        peakHoursRes,
        peakDaysRes,
        paymentRes,
        statusRes,
        voidRes,
        mostConsumedRes,
        leastConsumedRes,
      ] = await Promise.all([
        supabase.rpc("get_analytics_kpis", filterParams),
        supabase.rpc("get_revenue_by_period", filterParams),
        supabase.rpc("get_top_products", { ...filterParams, p_limit: 10 }),
        supabase.rpc("get_revenue_by_category", filterParams),
        supabase.rpc("get_peak_hours", filterParams),
        supabase.rpc("get_peak_days", filterParams),
        supabase.rpc("get_payment_distribution", filterParams),
        supabase.rpc("get_transaction_status", filterParams),
        supabase.rpc("get_void_analysis", filterParams),
        supabase.rpc("get_inventory_consumption", { p_date_from: dateFrom, p_date_to: dateTo, p_direction: "most", p_limit: 4 }),
        supabase.rpc("get_inventory_consumption", { p_date_from: dateFrom, p_date_to: dateTo, p_direction: "least", p_limit: 4 }),
      ]);

      setData({
        kpis: kpisRes.data ?? null,
        revenue: revenueRes.data ?? [],
        topProducts: topProductsRes.data ?? [],
        categoryRevenue: categoryRes.data ?? [],
        peakHours: peakHoursRes.data ?? [],
        peakDays: peakDaysRes.data ?? [],
        paymentDistribution: paymentRes.data ?? [],
        transactionStatus: statusRes.data ?? [],
        voidAnalysis: voidRes.data ?? null,
        mostConsumed: mostConsumedRes.data ?? [],
        leastConsumed: leastConsumedRes.data ?? [],
      });
    } catch (err) {
      console.error("Analytics fetch error:", err);
      setError("Failed to load analytics data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [filters.dateFrom, filters.dateTo, filters.category, filters.paymentMethod, filters.cashier]);

  // Debounced fetch on filter change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchData();
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return (
    <AnalyticsContext.Provider
      value={{
        filters,
        setFilters,
        data,
        loading,
        error,
        refresh,
        categories,
        paymentMethods,
        cashiers,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
}

// ────────────────────────────────────────────────
// Hook
// ────────────────────────────────────────────────

export function useAnalytics(): AnalyticsContextType {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) throw new Error("useAnalytics must be used within <AnalyticsProvider>");
  return ctx;
}
