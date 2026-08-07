import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Transaction } from "../data";
import { format } from "date-fns";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, Send } from "lucide-react";
import Image from "next/image";

interface DigitalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export function DigitalReceiptModal({
  isOpen,
  onClose,
  transaction,
}: DigitalReceiptModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [validationError, setValidationError] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isOpen && transaction) {
      setStep(1);
      setEmail("");
      setValidationError("");
      setIsSending(false);
      
      if (transaction.customerName && transaction.customerName.toLowerCase() !== "walk-in") {
        setCustomerName(transaction.customerName);
      } else {
        setCustomerName("");
      }
    }
  }, [isOpen, transaction]);

  if (!transaction) return null;

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleNext = () => {
    if (!email) {
      setValidationError("Please enter a valid email address.");
      return;
    }
    if (!validateEmail(email)) {
      setValidationError("Please enter a valid email address.");
      return;
    }
    setValidationError("");
    setStep(2);
  };

  const handleSend = () => {
    setIsSending(true);
    
    // Simulate frontend-only send
    setTimeout(() => {
      setIsSending(false);
      toast.success("Receipt prepared successfully", {
        description: `The receipt is ready to be sent to ${email}.`,
      });
      onClose();
    }, 1500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        {step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle>Send Digital Receipt</DialogTitle>
              <DialogDescription>
                Send a digital copy of this receipt to the customer's email address.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  placeholder="e.g. Christopher Quinto"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="customer@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (validationError) setValidationError("");
                  }}
                  className={validationError ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {validationError && (
                  <p className="text-sm text-destructive">{validationError}</p>
                )}
              </div>
            </div>
            <DialogFooter className="flex-row justify-between sm:justify-between">
              <Button variant="outline" onClick={onClose} type="button">
                Cancel
              </Button>
              <Button onClick={handleNext} type="button">
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Receipt Preview</DialogTitle>
              <DialogDescription>
                Review the digital receipt before sending it to the customer.
              </DialogDescription>
            </DialogHeader>
            
            <div className="bg-muted/30 p-3 rounded-md text-sm mb-2 border">
              <p className="text-muted-foreground mb-1 font-medium">Sending to:</p>
              {customerName && <p className="font-medium">{customerName}</p>}
              <p className="text-muted-foreground">{email}</p>
            </div>

            <div className="border rounded-md bg-white shadow-sm overflow-y-auto flex flex-col mb-4 max-h-[350px]">
              <div className="p-6 pb-4 flex flex-col items-center border-b border-dashed shrink-0">
                <div className="relative w-16 h-16 mb-3">
                  <Image src="/sheilz_pos_logo.png" alt="Sheilz Coffee" fill className="object-contain" />
                </div>
                <h3 className="font-bold tracking-widest uppercase text-foreground">Sheilz Coffee</h3>
                <p className="text-xs text-muted-foreground text-center mt-1">611 Mercedez Ave, Pasig City</p>
              </div>
              
              <div className="p-6 pt-4 text-sm font-mono space-y-4">
                <div className="grid grid-cols-[1fr_auto] gap-1 text-xs">
                  <span className="text-muted-foreground">Order No:</span>
                  <span className="font-medium text-right">#{transaction.orderId}</span>
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium text-right">{format(new Date(transaction.createdAt), "MM/dd/yyyy HH:mm")}</span>
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-medium text-right">{customerName || "Walk-In"}</span>
                </div>
                
                <div className="border-t border-dashed my-4"></div>
                
                <div className="grid grid-cols-[1fr_auto_auto] gap-x-2 gap-y-3">
                  <span className="font-semibold text-xs tracking-wider">ITEM</span>
                  <span className="font-semibold text-xs tracking-wider text-center px-2">QTY</span>
                  <span className="font-semibold text-xs tracking-wider text-right">TOTAL</span>
                  
                  {transaction.items.map((item, idx) => (
                    <div className="col-span-3 grid grid-cols-[1fr_auto_auto] gap-x-2" key={idx}>
                      <div className="flex flex-col">
                        <span className="font-medium">{item.name}</span>
                        {(item.size || item.temperature) && (
                          <span className="text-xs text-muted-foreground mt-0.5">
                            {[item.size, item.temperature].filter(Boolean).join(", ")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-start justify-center px-2">
                        <span className="text-sm">{item.qty}</span>
                      </div>
                      <div className="flex items-start justify-end">
                        <span className="text-sm">₱{(item.unitPrice * item.qty).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-dashed my-4"></div>
                
                <div className="grid grid-cols-[1fr_auto] gap-1 items-end">
                  <span className="font-bold text-sm">TOTAL</span>
                  <span className="font-bold text-lg">₱{transaction.amount.toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-[1fr_auto] gap-1 mt-2">
                  <span className="text-xs text-muted-foreground">Payment Method:</span>
                  <span className="text-xs font-medium text-right">{transaction.paymentMethod}</span>
                </div>
                
                <div className="mt-8 text-center text-xs text-muted-foreground">
                  <p>Thank you for visiting!</p>
                  <p>Please come again.</p>
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex-row justify-between sm:justify-between">
              <Button variant="outline" onClick={() => setStep(1)} type="button" disabled={isSending}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button onClick={handleSend} type="button" disabled={isSending} className="bg-primary">
                {isSending ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" /> Send Receipt
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
