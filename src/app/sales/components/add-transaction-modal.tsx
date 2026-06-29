import { useState, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { OrderStatus, PaymentMethod, Transaction, OrderItem } from "../data";
import { PRODUCT_CATALOG } from "./product-catalog";

interface FormOrderItem {
  id: string;
  productName: string;
  size: string | null;
  temp: string | null;
  qty: number;
  unitPrice: number;
  selectedAddons: string[];
}

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, "id">) => Promise<void>;
  currentUser: string;
  paymentMethods: string[];
}

export function AddTransactionModal({
  isOpen,
  onClose,
  onSave,
  currentUser,
  paymentMethods,
}: AddTransactionModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [status, setStatus] = useState<OrderStatus>("Completed");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [items, setItems] = useState<FormOrderItem[]>([]);

  const totalAmount = useMemo(() => {
    return items.reduce((acc, item) => {
      let itemPrice = item.unitPrice;
      const product = PRODUCT_CATALOG.find((p) => p.name === item.productName);
      if (product?.addons) {
        item.selectedAddons.forEach((addonName) => {
          const addon = product.addons!.find((a) => a.name === addonName);
          if (addon) itemPrice += addon.price;
        });
      }
      return acc + itemPrice * item.qty;
    }, 0);
  }, [items]);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `row-${Date.now()}-${Math.random()}`,
        productName: "",
        size: null,
        temp: null,
        qty: 1,
        unitPrice: 0,
        selectedAddons: [],
      },
    ]);
  };

  const updateItem = (id: string, field: keyof FormOrderItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        if (field === "productName") {
          const product = PRODUCT_CATALOG.find((p) => p.name === value);
          if (product && product.variants.length > 0) {
            const firstVariant = product.variants[0];
            updated.size = firstVariant.size;
            updated.temp = firstVariant.temp;
            updated.unitPrice = firstVariant.price;
            updated.selectedAddons = [];
          } else {
            updated.size = null;
            updated.temp = null;
            updated.unitPrice = 0;
            updated.selectedAddons = [];
          }
        } else if (field === "size" || field === "temp") {
          const product = PRODUCT_CATALOG.find(
            (p) => p.name === updated.productName,
          );
          if (product) {
            const variant = product.variants.find(
              (v) =>
                (v.size === updated.size ||
                  (v.size === null && updated.size === null)) &&
                (v.temp === updated.temp ||
                  (v.temp === null && updated.temp === null)),
            );
            if (variant) {
              updated.unitPrice = variant.price;
            }
          }
        }

        return updated;
      }),
    );
  };

  const handleSave = async () => {
    // Generate Order ID
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const randomSuffix = String(Math.floor(Math.random() * 1000)).padStart(
      3,
      "0",
    );
    const orderId = `${yyyy}${mm}${dd}-${randomSuffix}`;

    const parsedItems: OrderItem[] = items.map((item) => {
      let finalName = item.productName;
      let itemPrice = item.unitPrice;
      if (item.selectedAddons.length > 0) {
        finalName += ` (${item.selectedAddons.join(", ")})`;
        const product = PRODUCT_CATALOG.find(
          (p) => p.name === item.productName,
        );
        if (product?.addons) {
          item.selectedAddons.forEach((addonName) => {
            const addon = product.addons!.find((a) => a.name === addonName);
            if (addon) itemPrice += addon.price;
          });
        }
      }
      return {
        name: finalName,
        size: item.size ?? "",
        temperature: item.temp ?? "",
        qty: item.qty,
        unitPrice: itemPrice,
      };
    });

    const finalCustomerName =
      customerName.trim() === "" ? "Walk-In" : customerName;

    const newTx: Omit<Transaction, "id"> = {
      orderId,
      createdAt: date.toISOString(),
      customerName: finalCustomerName,
      status,
      items:
        parsedItems.length > 0
          ? parsedItems
          : [
              {
                name: "Unknown Item",
                size: "",
                temperature: "",
                qty: 1,
                unitPrice: 0,
              },
            ],
      amount: totalAmount,
      paymentMethod,
      cashier: currentUser,
      createdBy: currentUser,
    };

    setIsSubmitting(true);
    try {
      await onSave(newTx);
    } finally {
      setIsSubmitting(false);
    }

    // Reset form (only reached if onSave resolved without throwing)
    setCustomerName("");
    setStatus("Completed");
    setPaymentMethod("Cash");
    setItems([]);
  };

  const productCategories = Array.from(
    new Set(PRODUCT_CATALOG.map((p) => p.category)),
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>
            Build an order manually. The Order ID and timestamp will be
            generated automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 py-4 space-y-6">
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
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as OrderStatus)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Void (Not Made)">
                    Void (Not Made)
                  </SelectItem>
                  <SelectItem value="Void (Consumed)">
                    Void (Consumed)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">Ordered Items</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Item
              </Button>
            </div>

            <div className="flex flex-col gap-3">
              {items.length === 0 && (
                <div className="text-sm text-muted-foreground italic p-6 border border-dashed rounded-lg text-center bg-muted/10">
                  No items added. Click "Add Item" to start building the order.
                </div>
              )}
              {items.map((item, index) => {
                const product = PRODUCT_CATALOG.find(
                  (p) => p.name === item.productName,
                );

                const availableSizes = product
                  ? (Array.from(
                      new Set(
                        product.variants.map((v) => v.size).filter(Boolean),
                      ),
                    ) as string[])
                  : [];

                const validVariantsForSize = product
                  ? product.variants.filter((v) => v.size === item.size)
                  : [];
                const filteredTemps = Array.from(
                  new Set(
                    validVariantsForSize.map((v) => v.temp).filter(Boolean),
                  ),
                ) as string[];

                let itemPrice = item.unitPrice;
                if (product?.addons) {
                  item.selectedAddons.forEach((addonName) => {
                    const addon = product.addons!.find(
                      (a) => a.name === addonName,
                    );
                    if (addon) itemPrice += addon.price;
                  });
                }
                const subtotal = itemPrice * item.qty;

                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 p-4 border rounded-lg bg-card shadow-sm relative"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-sm text-foreground/80">
                        Item {index + 1}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() =>
                          setItems(items.filter((i) => i.id !== item.id))
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                      <div className="sm:col-span-4 space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Product
                        </Label>
                        <Select
                          value={item.productName}
                          onValueChange={(v) =>
                            updateItem(item.id, "productName", v)
                          }
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select Product" />
                          </SelectTrigger>
                          <SelectContent>
                            {productCategories.map((category) => (
                              <SelectGroup key={category}>
                                <SelectLabel>{category}</SelectLabel>
                                {PRODUCT_CATALOG.filter(
                                  (p) => p.category === category,
                                ).map((p) => (
                                  <SelectItem key={p.name} value={p.name}>
                                    {p.name}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {availableSizes.length > 0 ? (
                        <div className="sm:col-span-2 space-y-1.5">
                          <Label className="text-xs text-muted-foreground">
                            Size
                          </Label>
                          <Select
                            value={item.size || ""}
                            onValueChange={(v) =>
                              updateItem(item.id, "size", v)
                            }
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Size" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableSizes.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div className="sm:col-span-2"></div>
                      )}

                      {filteredTemps.length > 0 ? (
                        <div className="sm:col-span-2 space-y-1.5">
                          <Label className="text-xs text-muted-foreground">
                            Temp
                          </Label>
                          <Select
                            value={item.temp || ""}
                            onValueChange={(v) =>
                              updateItem(item.id, "temp", v)
                            }
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Temp" />
                            </SelectTrigger>
                            <SelectContent>
                              {filteredTemps.map((t) => (
                                <SelectItem key={t} value={t}>
                                  {t}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div className="sm:col-span-2"></div>
                      )}

                      <div className="sm:col-span-2 space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Qty
                        </Label>
                        <Input
                          className="h-9"
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val) && val > 0)
                              updateItem(item.id, "qty", val);
                          }}
                        />
                      </div>

                      <div className="sm:col-span-2 text-right space-y-1.5 flex flex-col justify-end">
                        <div className="text-xs text-muted-foreground">
                          Subtotal
                        </div>
                        <div className="font-medium text-sm h-9 flex items-center justify-end">
                          {item.productName ? `₱${subtotal.toFixed(2)}` : "—"}
                        </div>
                      </div>
                    </div>

                    {/* Addons */}
                    {product?.addons && product.addons.length > 0 && (
                      <div className="flex flex-wrap gap-4 mt-2 bg-muted/30 p-2 rounded-md border border-border/50">
                        {product.addons.map((addon) => (
                          <div
                            key={addon.name}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`${item.id}-${addon.name}`}
                              checked={item.selectedAddons.includes(addon.name)}
                              onCheckedChange={(checked) => {
                                const newAddons = checked
                                  ? [...item.selectedAddons, addon.name]
                                  : item.selectedAddons.filter(
                                      (a) => a !== addon.name,
                                    );
                                updateItem(
                                  item.id,
                                  "selectedAddons",
                                  newAddons,
                                );
                              }}
                            />
                            <Label
                              htmlFor={`${item.id}-${addon.name}`}
                              className="text-xs cursor-pointer font-normal"
                            >
                              {addon.name}{" "}
                              <span className="text-muted-foreground">
                                (+₱{addon.price.toFixed(2)})
                              </span>
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 mt-2 border-t shrink-0">
          <div className="grid gap-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
            >
              <SelectTrigger id="paymentMethod">
                <SelectValue placeholder="Select Payment" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2 justify-end text-right">
            <Label className="text-muted-foreground">Total Amount</Label>
            <div className="text-3xl font-bold tracking-tight text-primary">
              ₱{totalAmount.toFixed(2)}
            </div>
          </div>
        </div>
        <DialogFooter className="mt-4 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              isSubmitting ||
              items.length === 0 ||
              items.some((i) => !i.productName)
            }
          >
            {isSubmitting ? "Saving..." : "Save Transaction"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
