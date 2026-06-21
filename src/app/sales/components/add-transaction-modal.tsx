import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderStatus, PaymentMethod, Transaction, OrderItem } from "../data";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, "id">) => void;
  currentUser: string;
}

export function AddTransactionModal({ isOpen, onClose, onSave, currentUser }: AddTransactionModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [status, setStatus] = useState<OrderStatus>("Completed");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [amount, setAmount] = useState<string>("");
  const [itemsStr, setItemsStr] = useState<string>("");

  const handleSave = () => {
    // Generate Order ID
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const randomSuffix = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    const orderId = `${yyyy}${mm}${dd}-${randomSuffix}`;

    // Parse simple items input (e.g. "Spanish Latte, Croissant")
    const parsedItems: OrderItem[] = itemsStr.split(',').filter(s => s.trim()).map((name, idx) => ({
      id: `new-it-${idx}`,
      name: name.trim(),
      qty: 1
    }));

    const finalCustomerName = customerName.trim() === "" ? "Walk-In" : customerName;

    const newTx: Omit<Transaction, "id"> = {
      orderId,
      createdAt: date.toISOString(),
      customerName: finalCustomerName,
      status,
      items: parsedItems.length > 0 ? parsedItems : [{ id: "unknown", name: "Unknown Item", qty: 1 }],
      amount: parseFloat(amount) || 0,
      paymentMethod,
      cashier: currentUser,
      createdBy: currentUser,
    };

    onSave(newTx);
    
    // Reset form
    setCustomerName("");
    setStatus("Completed");
    setPaymentMethod("Cash");
    setAmount("");
    setItemsStr("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>
            Manually encode a transaction when the POS is unavailable. The Order ID and timestamp will be generated automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          
          <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-2">
                <Label htmlFor="customerName">Customer Name (Optional)</Label>
                <Input
                  id="customerName"
                  placeholder="Defaults to Walk-In"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus)}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Void (Not Made)">Void (Not Made)</SelectItem>
                    <SelectItem value="Void (Consumed)">Void (Consumed)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="items">Ordered Items</Label>
            <Input
              id="items"
              placeholder="e.g. Spanish Latte, Iced Matcha Latte"
              value={itemsStr}
              onChange={(e) => setItemsStr(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Separate items with commas.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount (₱)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                  <SelectTrigger id="paymentMethod">
                    <SelectValue placeholder="Select Payment" />
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
          
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Transaction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
