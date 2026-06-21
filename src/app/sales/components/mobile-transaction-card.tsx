import { Transaction } from "../data";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface MobileTransactionCardProps {
  transaction: Transaction;
  onClick: () => void;
}

export function MobileTransactionCard({ transaction, onClick }: MobileTransactionCardProps) {
  const getStatusBadgeVariant = (status: string) => {
    if (status.includes("Void")) return "destructive";
    return "outline";
  };

  const getStatusBadgeStyle = (status: string) => {
    if (status.includes("Void")) return {};
    return { className: "bg-[#e8f4e8] text-[#4f9a5c] border-[#4f9a5c]/20" };
  };

  return (
    <div 
      onClick={onClick}
      className="bg-card border rounded-lg p-4 mb-3 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-xs text-muted-foreground mb-0.5">
            {format(new Date(transaction.createdAt), "MMM dd, yyyy • h:mm a")}
          </div>
          <div className="font-semibold text-sm">
            {transaction.orderId}
          </div>
        </div>
        <Badge 
          variant={getStatusBadgeVariant(transaction.status)} 
          {...getStatusBadgeStyle(transaction.status)}
        >
          {transaction.status}
        </Badge>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Customer</span>
          <span className="font-medium">{transaction.customerName}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-muted-foreground">Items</span>
          <span className="font-medium text-right max-w-[60%] truncate" title={transaction.items.map(i => i.name).join(", ")}>
            {transaction.items.map(i => i.name).join(", ")}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Payment</span>
          <span className="font-medium">{transaction.paymentMethod}</span>
        </div>

        <div className="flex justify-between items-center pt-2 mt-2 border-t">
          <span className="text-xs text-muted-foreground">Cashier: {transaction.cashier}</span>
          <span className="font-bold text-base text-primary">₱{transaction.amount.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
