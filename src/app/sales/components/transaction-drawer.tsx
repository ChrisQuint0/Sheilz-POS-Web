import { useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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
  const [localStatus, setLocalStatus] = useState<string>("");
  const [localPaymentMethod, setLocalPaymentMethod] = useState<string>("");
  const [localCustomer, setLocalCustomer] = useState<string>("");

  useEffect(() => {
    if (transaction && isOpen) {
      setLocalStatus(transaction.status);
      setLocalPaymentMethod(transaction.paymentMethod);
      setLocalCustomer(transaction.customerName);
    }
  }, [transaction, isOpen]);

  if (!transaction) return null;

  const isDirty = localStatus !== transaction.status || 
                  localPaymentMethod !== transaction.paymentMethod || 
                  localCustomer !== transaction.customerName;

  const handleSaveChanges = () => {
    onEdit({
      ...transaction,
      status: localStatus as any,
      paymentMethod: localPaymentMethod,
      customerName: localCustomer
    });
  };

  const handleDiscard = () => {
    setLocalStatus(transaction.status);
    setLocalPaymentMethod(transaction.paymentMethod);
    setLocalCustomer(transaction.customerName);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MMM dd, yyyy h:mm a");
    } catch {
      return dateStr;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-6 flex flex-row items-start justify-between border-b pb-4">
          <div>
            <SheetTitle>Transaction Details</SheetTitle>
            <SheetDescription>
              {transaction.orderId}
            </SheetDescription>
          </div>
          <div className="flex gap-2 mr-6 mt-1">
            <Button variant="default" size="sm" onClick={handleSaveChanges} disabled={!isDirty} className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white">
              Save Changes
            </Button>
          </div>
        </SheetHeader>
        
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            
            {/* Transaction Information */}
            <section className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Information</h3>
              <div className="grid grid-cols-2 gap-y-3 text-sm items-center">
                <div className="text-muted-foreground">Order ID</div>
                <div className="font-medium text-right">{transaction.orderId}</div>
                
                <div className="text-muted-foreground">Date & Time</div>
                <div className="font-medium text-right">{formatDate(transaction.createdAt)}</div>
                
                <div className="text-muted-foreground">Customer</div>
                <div className="text-right">
                  <Input 
                    value={localCustomer} 
                    onChange={(e) => setLocalCustomer(e.target.value)} 
                    className="h-8 text-right text-sm"
                  />
                </div>
                
                <div className="text-muted-foreground">Status</div>
                <div className="text-right">
                   <Select value={localStatus} onValueChange={setLocalStatus}>
                     <SelectTrigger className="h-8 text-sm">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="Completed">Completed</SelectItem>
                       <SelectItem value="Void (Not Made)">Void (Not Made)</SelectItem>
                       <SelectItem value="Void (Consumed)">Void (Consumed)</SelectItem>
                     </SelectContent>
                   </Select>
                </div>
                
                <div className="text-muted-foreground">Cashier</div>
                <div className="font-medium text-right">{transaction.cashier}</div>
                
                <div className="text-muted-foreground">Payment Method</div>
                <div className="text-right">
                   <Select value={localPaymentMethod} onValueChange={setLocalPaymentMethod}>
                     <SelectTrigger className="h-8 text-sm">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="Cash">Cash</SelectItem>
                       <SelectItem value="GCash">GCash</SelectItem>
                       <SelectItem value="BPI">BPI</SelectItem>
                       <SelectItem value="Maya">Maya</SelectItem>
                     </SelectContent>
                   </Select>
                </div>
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
              <Button variant="outline" className="flex-1" onClick={handleDiscard} disabled={!isDirty}>
                Discard
              </Button>
              <Button variant="default" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSaveChanges} disabled={!isDirty}>
                Save Changes
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
