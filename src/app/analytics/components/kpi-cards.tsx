import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, CreditCard, PackageMinus, TrendingUp, ArrowUpRight } from "lucide-react";

export function KpiCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
      {/* Hero card — Total Revenue with brand treatment */}
      <Card className="shadow-sm bg-[#C2456A] border-[#C2456A] text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="text-xs font-medium text-white/70">
            Total Revenue
          </CardTitle>
          <div className="bg-white/15 p-1.5 rounded-md">
            <span className="text-white text-sm font-bold">₱</span>
          </div>
        </CardHeader>
        <CardContent className="pt-1">
          <div className="text-3xl font-bold tracking-tight leading-none mb-2">
            125,430
            <span className="text-lg font-normal opacity-70">.00</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="flex items-center text-xs font-semibold bg-white/20 text-white rounded-full px-2 py-0.5">
              <ArrowUpRight className="h-3 w-3 mr-0.5" />
              +12.5%
            </span>
            <span className="text-xs text-white/60">vs. previous</span>
          </div>
        </CardContent>
      </Card>

      {/* Total Orders */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Total Orders
          </CardTitle>
          <div className="bg-muted p-1.5 rounded-md">
            <ShoppingBag className="h-4 w-4 text-foreground/70" />
          </div>
        </CardHeader>
        <CardContent className="pt-1">
          <div className="text-3xl font-bold tracking-tight leading-none mb-2">
            1,248
          </div>
          <div className="flex items-center gap-1.5">
            <span className="flex items-center text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">
              <ArrowUpRight className="h-3 w-3 mr-0.5" />
              +8.3%
            </span>
            <span className="text-xs text-muted-foreground">vs. previous</span>
          </div>
        </CardContent>
      </Card>

      {/* Average Order Value */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Avg. Order Value
          </CardTitle>
          <div className="bg-muted p-1.5 rounded-md">
            <CreditCard className="h-4 w-4 text-foreground/70" />
          </div>
        </CardHeader>
        <CardContent className="pt-1">
          <div className="text-3xl font-bold tracking-tight leading-none mb-2">
            100
            <span className="text-lg font-normal text-muted-foreground">.50</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="flex items-center text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">
              <ArrowUpRight className="h-3 w-3 mr-0.5" />
              +3.2%
            </span>
            <span className="text-xs text-muted-foreground">vs. previous</span>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Expenses */}
      <Card className="shadow-sm border-amber-200 bg-amber-50/60">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="text-xs font-medium text-amber-700">
            Inventory Expenses
          </CardTitle>
          <div className="bg-amber-100 p-1.5 rounded-md">
            <PackageMinus className="h-4 w-4 text-amber-600" />
          </div>
        </CardHeader>
        <CardContent className="pt-1">
          <div className="text-3xl font-bold tracking-tight leading-none text-amber-800 mb-2">
            18,250
            <span className="text-lg font-normal opacity-60">.00</span>
          </div>
          <p className="text-xs text-amber-600/80 font-medium">
            For selected period
          </p>
        </CardContent>
      </Card>

      {/* Net Revenue — Hero accent */}
      <Card className="shadow-sm border-emerald-200 bg-emerald-50/60">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="text-xs font-medium text-emerald-700">
            Net Revenue
          </CardTitle>
          <div className="bg-emerald-100 p-1.5 rounded-md">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
        </CardHeader>
        <CardContent className="pt-1">
          <div className="text-3xl font-bold tracking-tight leading-none text-emerald-800 mb-2">
            107,180
            <span className="text-lg font-normal opacity-60">.00</span>
          </div>
          <p className="text-xs text-emerald-600/80 font-medium">
            Actual business performance
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
