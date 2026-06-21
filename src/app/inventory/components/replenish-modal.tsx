import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InventoryItem, InventoryTransaction } from '../data';
import { ArrowLeft, ArrowRight, RefreshCw, TruckIcon, PackageCheck, Receipt } from 'lucide-react';

interface ReplenishModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  onSave: (transaction: Partial<InventoryTransaction>) => void;
}

const PAYMENT_METHODS = ['Cash', 'GCash', 'Maya', 'Bank Transfer', 'Credit Card'];

export function ReplenishModal({ open, onOpenChange, item, onSave }: ReplenishModalProps) {
  const [step, setStep] = useState(1);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().split(' ')[0].substring(0, 5));
  const [supplier, setSupplier] = useState('');
  const [notes, setNotes] = useState('');
  const [quantityDelivered, setQuantityDelivered] = useState<number>(0);
  const [deliveryCost, setDeliveryCost] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [receivedBy, setReceivedBy] = useState('Current User');

  useEffect(() => {
    if (open) {
      setStep(1);
      setDate(new Date().toISOString().split('T')[0]);
      setTime(new Date().toTimeString().split(' ')[0].substring(0, 5));
      setSupplier('');
      setNotes('');
      setQuantityDelivered(0);
      setDeliveryCost(0);
      setPaymentMethod('Cash');
      setReceivedBy('Current User');
    }
  }, [open]);

  if (!item) return null;

  const handleSave = () => {
    onSave({
      ingredientId: item.id,
      type: 'Replenishment',
      previousStock: item.currentStock,
      quantityChanged: quantityDelivered,
      newStock: item.currentStock + quantityDelivered,
      userId: receivedBy,
      date: new Date(`${date}T${time}`).toISOString(),
      notes,
      expenseDetails: {
        deliveryCost,
        paymentMethod: paymentMethod as any,
        supplier,
        receivedBy,
        deliveryDate: date,
        deliveryTime: time,
      }
    });
    onOpenChange(false);
  };

  const newStock = item.currentStock + (quantityDelivered || 0);

  const steps = [
    { label: 'Delivery', icon: TruckIcon, num: 1 },
    { label: 'Stock', icon: PackageCheck, num: 2 },
    { label: 'Expense', icon: Receipt, num: 3 },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-[#3a2b27]">
                Replenish Stock
              </DialogTitle>
              <DialogDescription className="text-[13px] text-gray-400">
                {item.name} · Current: {item.currentStock.toLocaleString()} {item.unit}
              </DialogDescription>
            </div>
          </div>

          {/* Step Progress */}
          <div className="flex items-center gap-1">
            {steps.map((s, i) => (
              <React.Fragment key={s.num}>
                <button 
                  onClick={() => { if (s.num < step) setStep(s.num); }}
                  className={`flex items-center gap-1.5 text-[13px] font-medium transition-colors ${
                    step === s.num 
                      ? 'text-[#C2456A]' 
                      : step > s.num 
                        ? 'text-emerald-600 cursor-pointer' 
                        : 'text-gray-400 cursor-default'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full text-[10px] flex items-center justify-center font-bold border-2 transition-all ${
                    step === s.num
                      ? 'border-[#C2456A] bg-[#C2456A]/10 text-[#C2456A]'
                      : step > s.num
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-gray-200 bg-gray-50 text-gray-400'
                  }`}>
                    {step > s.num ? '✓' : s.num}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 rounded-full mx-1 ${step > s.num ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 flex flex-col gap-5 overflow-y-auto min-h-0 flex-1">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Delivery Information</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-[13px] font-semibold text-[#3a2b27]">Delivery Date</Label>
                  <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-10 bg-white border-gray-200 focus:border-[#C2456A] focus:ring-[#C2456A]/20" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px] font-semibold text-[#3a2b27]">Delivery Time</Label>
                  <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="h-10 bg-white border-gray-200 focus:border-[#C2456A] focus:ring-[#C2456A]/20" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-semibold text-[#3a2b27]">Supplier <span className="text-gray-400 font-normal">(Optional)</span></Label>
                <Input placeholder="e.g. ABC Beverage Supplies" value={supplier} onChange={e => setSupplier(e.target.value)} className="h-10 bg-white border-gray-200 focus:border-[#C2456A] focus:ring-[#C2456A]/20" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Stock Information</h3>
              <div className="space-y-2">
                <Label className="text-[13px] font-semibold text-[#3a2b27]">Current Stock</Label>
                <div className="h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 flex items-center text-sm text-gray-500 font-medium">
                  {item.currentStock.toLocaleString()} {item.unit}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-semibold text-[#3a2b27]">Quantity Delivered</Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    value={quantityDelivered || ''} 
                    onChange={e => setQuantityDelivered(Number(e.target.value))}
                    className="h-10 bg-white border-gray-200 pr-12 focus:border-[#C2456A] focus:ring-[#C2456A]/20"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">{item.unit}</span>
                </div>
              </div>
              {quantityDelivered > 0 && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                  <span className="text-[13px] text-emerald-700 font-medium">New Stock Level</span>
                  <span className="text-lg font-bold text-emerald-700">{newStock.toLocaleString()} {item.unit}</span>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Expense Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-[13px] font-semibold text-[#3a2b27]">Delivery Cost (₱)</Label>
                  <Input 
                    type="number" 
                    value={deliveryCost || ''} 
                    onChange={e => setDeliveryCost(Number(e.target.value))}
                    className="h-10 bg-white border-gray-200 focus:border-[#C2456A] focus:ring-[#C2456A]/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px] font-semibold text-[#3a2b27]">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="h-10 bg-white border-gray-200">
                      <SelectValue placeholder="Select Method" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Summary Card */}
              <div className="mt-2 rounded-xl border border-gray-200 overflow-hidden bg-white">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Summary</h4>
                </div>
                <div className="p-4 space-y-2.5 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Previous Stock</span>
                    <span className="font-semibold text-[#3a2b27]">{item.currentStock.toLocaleString()} {item.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Qty Delivered</span>
                    <span className="font-bold text-emerald-600">+{quantityDelivered.toLocaleString()} {item.unit}</span>
                  </div>
                  <div className="h-px bg-gray-100 my-1" />
                  <div className="flex justify-between">
                    <span className="font-semibold text-[#3a2b27]">New Stock</span>
                    <span className="font-bold text-[#3a2b27] text-base">{newStock.toLocaleString()} {item.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Expense</span>
                    <span className="font-semibold text-[#C2456A]">₱{deliveryCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center gap-2">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="h-9 bg-white border-gray-200 text-[13px]">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
            </Button>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)} className="h-9 bg-white border-gray-200 text-[13px]">Cancel</Button>
          )}

          {step < 3 ? (
            <Button 
              onClick={() => setStep(step + 1)}
              className="h-9 px-5 bg-[#C2456A] hover:bg-[#a33858] text-white shadow-sm text-[13px]"
            >
              Next <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          ) : (
            <Button 
              onClick={handleSave} 
              disabled={quantityDelivered <= 0}
              className="h-9 px-5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-[13px]"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Save Replenishment
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
