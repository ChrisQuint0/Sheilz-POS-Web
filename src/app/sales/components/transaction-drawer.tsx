import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Transaction } from "../data";
import { format } from "date-fns";

interface TransactionDrawerProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}

export function TransactionDrawer({ transaction, isOpen, onClose, onEdit, onDelete }: TransactionDrawerProps) {
  if (!transaction) return null;

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MMM dd, yyyy h:mm a");
    } catch {
      return dateStr;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    if (status === "Completed") return "default";
    return "destructive";
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-6 pb-0">
          <SheetTitle>Transaction Details</SheetTitle>
          <SheetDescription>
            {transaction.orderId}
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            
            {/* Transaction Information */}
            <section className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Information</h3>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <div className="text-muted-foreground">Order ID</div>
                <div className="font-medium text-right">{transaction.orderId}</div>
                
                <div className="text-muted-foreground">Date & Time</div>
                <div className="font-medium text-right">{formatDate(transaction.createdAt)}</div>
                
                <div className="text-muted-foreground">Customer</div>
                <div className="font-medium text-right">{transaction.customerName}</div>
                
                <div className="text-muted-foreground">Status</div>
                <div className="text-right">
                   <Badge variant={getStatusBadgeVariant(transaction.status)} className="rounded-md">
                     {transaction.status}
                   </Badge>
                </div>
                
                <div className="text-muted-foreground">Cashier</div>
                <div className="font-medium text-right">{transaction.cashier}</div>
                
                <div className="text-muted-foreground">Payment Method</div>
                <div className="font-medium text-right">{transaction.paymentMethod}</div>
              </div>
            </section>
            
            <Separator />
            
            {/* Ordered Items */}
            <section className="space-y-3">
               <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Ordered Items</h3>
               <div className="space-y-4">
                 {transaction.items.map((item, idx) => (
                    <div key={item.id || idx} className="flex justify-between items-start text-sm">
                      <div className="space-y-1">
                        <div className="font-medium">{item.name}</div>
                        {(item.size || item.temp) && (
                           <div className="text-xs text-muted-foreground flex items-center gap-2">
                             {item.size && <span>• {item.size}</span>}
                             {item.temp && <span>• {item.temp}</span>}
                           </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                           Qty: {item.qty}
                        </div>
                      </div>
                    </div>
                 ))}
               </div>
            </section>

            <Separator />

            {/* Order Summary */}
            <section className="space-y-3">
               <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Order Summary</h3>
               <div className="grid grid-cols-2 gap-y-2 text-sm">
                 <div className="text-muted-foreground">Subtotal</div>
                 <div className="text-right">₱{transaction.amount.toFixed(2)}</div>

                 <div className="text-muted-foreground">Discount</div>
                 <div className="text-right">₱0.00</div>
                 
                 <div className="font-semibold mt-2">Total Amount</div>
                 <div className="text-right font-bold text-lg mt-1 text-primary">₱{transaction.amount.toFixed(2)}</div>
               </div>
            </section>

            <Separator />

            {/* Audit Info */}
            <section className="space-y-3">
               <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Audit Information</h3>
               <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-2">
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Created By</span>
                    <span className="font-medium">{transaction.createdBy}</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Created At</span>
                    <span className="font-medium">{formatDate(transaction.createdAt)}</span>
                 </div>
                 {transaction.lastModifiedBy && (
                   <>
                     <Separator className="my-2" />
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Modified By</span>
                        <span className="font-medium">{transaction.lastModifiedBy}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Modified At</span>
                        <span className="font-medium">{formatDate(transaction.lastModifiedAt!)}</span>
                     </div>
                   </>
                 )}
               </div>
            </section>

          </div>
        </ScrollArea>

        <SheetFooter className="p-6 pt-0 border-t mt-auto flex flex-col gap-2 sm:flex-col sm:space-x-0">
            <div className="flex w-full gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => onEdit(transaction)}>
                Edit Transaction
              </Button>
              <Button variant="destructive" className="flex-1" onClick={() => onDelete(transaction)}>
                Delete
              </Button>
            </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
