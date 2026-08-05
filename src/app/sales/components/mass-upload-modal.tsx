"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Upload,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Loader2,
  CheckCircle2,
  XCircle,
  Package,
  Eraser,
  AlertTriangle,
} from "lucide-react";
import { OrderStatus, PaymentMethod, Transaction, OrderItem } from "../data";
import { Product } from "./product-catalog";
import { createClient } from "@/app/lib/supabase/client";

// ── Types ────────────────────────────────────────────────────────────────────

interface FormOrderItem {
  id: string;
  productId: string | null;
  productName: string;
  size: string | null;
  temp: string | null;
  qty: number;
  unitPrice: number;
}

type UploadStatus = "draft" | "uploading" | "uploaded" | "failed";

interface DraftOrder {
  draftId: string;
  customerName: string;
  status: OrderStatus;
  paymentMethod: string;
  items: FormOrderItem[];
  uploadStatus: UploadStatus;
  errorMessage?: string;
  uploadedTransaction?: Transaction;
}

interface MassUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploaded: (transactions: Transaction[]) => void;
  currentUser: string;
  paymentMethods: string[];
  products: Product[];
}

// ── Local-storage key ────────────────────────────────────────────────────────

const STORAGE_KEY = "sheilz-mass-upload-drafts";

function saveDrafts(drafts: DraftOrder[]) {
  try {
    // Only persist drafts that haven't been uploaded yet
    const toSave = drafts.filter((d) => d.uploadStatus !== "uploaded");
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    /* quota exceeded — silently ignore */
  }
}

function loadDrafts(): DraftOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: DraftOrder[] = JSON.parse(raw);
    // Reset any stale "uploading" status back to "draft"
    return parsed.map((d) => ({
      ...d,
      uploadStatus: d.uploadStatus === "uploading" ? "draft" : d.uploadStatus,
    }));
  } catch {
    return [];
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeDraftId() {
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeItemId() {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function blankDraft(paymentDefault: string): DraftOrder {
  return {
    draftId: makeDraftId(),
    customerName: "",
    status: "Completed",
    paymentMethod: paymentDefault || "Cash",
    items: [],
    uploadStatus: "draft",
  };
}

function calcTotal(items: FormOrderItem[]): number {
  return items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
}

function itemsSummary(items: FormOrderItem[]): string {
  if (items.length === 0) return "No items";
  const names = items
    .filter((i) => i.productName)
    .map((i) => {
      const parts = [i.productName];
      if (i.size) parts.push(`(${i.size})`);
      if (i.temp) parts.push(`(${i.temp})`);
      parts.push(`×${i.qty}`);
      return parts.join(" ");
    });
  if (names.length === 0) return `${items.length} item(s) — incomplete`;
  return names.join(", ");
}

// ── Status badge sub-component ───────────────────────────────────────────────

function StatusBadge({ status }: { status: UploadStatus }) {
  switch (status) {
    case "draft":
      return (
        <Badge
          variant="outline"
          className="font-normal gap-1 text-amber-600 border-amber-300 bg-amber-50"
        >
          <CircleDot className="w-3 h-3" />
          Draft
        </Badge>
      );
    case "uploading":
      return (
        <Badge
          variant="outline"
          className="font-normal gap-1 text-blue-600 border-blue-300 bg-blue-50"
        >
          <Loader2 className="w-3 h-3 animate-spin" />
          Uploading
        </Badge>
      );
    case "uploaded":
      return (
        <Badge
          variant="outline"
          className="font-normal gap-1 text-[#4f9a5c] border-[#4f9a5c]/20 bg-[#e8f4e8]"
        >
          <CheckCircle2 className="w-3 h-3" />
          Uploaded
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive" className="font-normal gap-1">
          <XCircle className="w-3 h-3" />
          Failed
        </Badge>
      );
  }
}

// ── Main Component ───────────────────────────────────────────────────────────

export function MassUploadModal({
  isOpen,
  onClose,
  onUploaded,
  currentUser,
  paymentMethods,
  products,
}: MassUploadModalProps) {
  const [drafts, setDrafts] = useState<DraftOrder[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const hasLoadedRef = useRef(false);

  // Load drafts from localStorage on first open
  useEffect(() => {
    if (isOpen && !hasLoadedRef.current) {
      const saved = loadDrafts();
      if (saved.length > 0) {
        setDrafts(saved);
      }
      hasLoadedRef.current = true;
    }
    if (!isOpen) {
      hasLoadedRef.current = false;
    }
  }, [isOpen]);

  // Persist drafts to localStorage whenever they change
  useEffect(() => {
    if (hasLoadedRef.current) {
      saveDrafts(drafts);
    }
  }, [drafts]);

  // Derived counts
  const counts = useMemo(() => {
    const draft = drafts.filter((d) => d.uploadStatus === "draft").length;
    const uploaded = drafts.filter((d) => d.uploadStatus === "uploaded").length;
    const failed = drafts.filter((d) => d.uploadStatus === "failed").length;
    const uploading = drafts.filter(
      (d) => d.uploadStatus === "uploading",
    ).length;
    return { draft, uploaded, failed, uploading, total: drafts.length };
  }, [drafts]);

  const hasUnsaved = counts.draft > 0 || counts.failed > 0;

  // ── Draft CRUD ─────────────────────────────────────────────────────────────

  const addDraft = () => {
    const d = blankDraft(paymentMethods[0] || "Cash");
    setDrafts((prev) => [...prev, d]);
    setExpandedId(d.draftId);
  };

  const removeDraft = (draftId: string) => {
    setDrafts((prev) => prev.filter((d) => d.draftId !== draftId));
    if (expandedId === draftId) setExpandedId(null);
  };

  const updateDraft = (draftId: string, patch: Partial<DraftOrder>) => {
    setDrafts((prev) =>
      prev.map((d) => (d.draftId === draftId ? { ...d, ...patch } : d)),
    );
  };

  const clearUploaded = () => {
    setDrafts((prev) => prev.filter((d) => d.uploadStatus !== "uploaded"));
  };

  const clearAll = () => {
    setDrafts([]);
    setExpandedId(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  // ── Item CRUD inside a draft ───────────────────────────────────────────────

  const addItem = (draftId: string) => {
    setDrafts((prev) =>
      prev.map((d) =>
        d.draftId !== draftId
          ? d
          : {
              ...d,
              items: [
                ...d.items,
                {
                  id: makeItemId(),
                  productId: null,
                  productName: "",
                  size: null,
                  temp: null,
                  qty: 1,
                  unitPrice: 0,
                },
              ],
            },
      ),
    );
  };

  const removeItem = (draftId: string, itemId: string) => {
    setDrafts((prev) =>
      prev.map((d) =>
        d.draftId !== draftId
          ? d
          : { ...d, items: d.items.filter((i) => i.id !== itemId) },
      ),
    );
  };

  const updateItem = (
    draftId: string,
    itemId: string,
    field: keyof FormOrderItem,
    value: any,
  ) => {
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.draftId !== draftId) return d;
        return {
          ...d,
          items: d.items.map((item) => {
            if (item.id !== itemId) return item;
            const updated = { ...item, [field]: value };

            if (field === "productName") {
              const product = products.find((p) => p.name === value);
              if (product) {
                updated.productId = product.id;
                if (product.variants.length > 0) {
                  const firstVariant = product.variants[0];
                  updated.size = firstVariant.size;
                  updated.temp = firstVariant.temp;
                  updated.unitPrice = firstVariant.price;
                } else {
                  updated.size = null;
                  updated.temp = null;
                  updated.unitPrice = 0;
                }
              } else {
                updated.productId = null;
                updated.size = null;
                updated.temp = null;
                updated.unitPrice = 0;
              }
            } else if (field === "size" || field === "temp") {
              const product = products.find(
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
        };
      }),
    );
  };

  // ── Upload Logic ───────────────────────────────────────────────────────────

  const uploadAll = useCallback(async () => {
    const toUpload = drafts.filter(
      (d) => d.uploadStatus === "draft" || d.uploadStatus === "failed",
    );
    if (toUpload.length === 0) return;

    setIsUploading(true);
    const supabase = createClient();
    const successfulTransactions: Transaction[] = [];

    for (const draft of toUpload) {
      // Validate
      if (
        draft.items.length === 0 ||
        draft.items.some((i) => !i.productName)
      ) {
        setDrafts((prev) =>
          prev.map((d) =>
            d.draftId === draft.draftId
              ? {
                  ...d,
                  uploadStatus: "failed" as UploadStatus,
                  errorMessage:
                    "Missing items or incomplete product selection.",
                }
              : d,
          ),
        );
        continue;
      }

      // Mark uploading
      setDrafts((prev) =>
        prev.map((d) =>
          d.draftId === draft.draftId
            ? { ...d, uploadStatus: "uploading" as UploadStatus }
            : d,
        ),
      );

      try {
        // Generate Order ID
        const date = new Date();
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        const randomSuffix = String(
          Math.floor(Math.random() * 1000),
        ).padStart(3, "0");
        const orderId = `${yyyy}${mm}${dd}-${randomSuffix}`;

        const finalCustomerName =
          draft.customerName.trim() === "" ? "Walk-In" : draft.customerName;
        const amount = calcTotal(draft.items);

        // Insert order
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .insert({
            order_id: orderId,
            customer_name: finalCustomerName,
            status: draft.status,
            amount,
            payment_method: draft.paymentMethod,
            cashier_name: currentUser,
          })
          .select("id, order_id, created_at")
          .single();

        if (orderError) throw new Error(orderError.message);

        // Insert order items
        const orderItemRows = draft.items.map((item) => ({
          order_id: orderData.id,
          product_id: item.productId,
          name: item.productName,
          size: item.size || null,
          temperature: item.temp || null,
          quantity: item.qty,
          unit_price: item.unitPrice,
          subtotal: item.unitPrice * item.qty,
        }));

        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(orderItemRows);

        if (itemsError) throw new Error(itemsError.message);

        // Build the Transaction object for the parent
        const transaction: Transaction = {
          id: orderData.id,
          orderId: orderData.order_id,
          createdAt: orderData.created_at,
          customerName: finalCustomerName,
          status: draft.status,
          items: draft.items.map((item) => ({
            productId: item.productId ?? undefined,
            name: item.productName,
            size: item.size ?? "",
            temperature: item.temp ?? "",
            qty: item.qty,
            unitPrice: item.unitPrice,
          })),
          amount,
          paymentMethod: draft.paymentMethod,
          cashier: currentUser,
          createdBy: currentUser,
        };

        successfulTransactions.push(transaction);

        // Mark uploaded
        setDrafts((prev) =>
          prev.map((d) =>
            d.draftId === draft.draftId
              ? {
                  ...d,
                  uploadStatus: "uploaded" as UploadStatus,
                  uploadedTransaction: transaction,
                  errorMessage: undefined,
                }
              : d,
          ),
        );
      } catch (err: any) {
        setDrafts((prev) =>
          prev.map((d) =>
            d.draftId === draft.draftId
              ? {
                  ...d,
                  uploadStatus: "failed" as UploadStatus,
                  errorMessage: err.message || "Unknown error",
                }
              : d,
          ),
        );
      }
    }

    // Notify parent of all successful uploads
    if (successfulTransactions.length > 0) {
      onUploaded(successfulTransactions);
    }

    setIsUploading(false);
  }, [drafts, currentUser, products, onUploaded]);

  // ── Close handling ─────────────────────────────────────────────────────────

  const handleRequestClose = () => {
    if (hasUnsaved && !confirmClose) {
      setConfirmClose(true);
      return;
    }
    // Actually close
    setConfirmClose(false);
    onClose();
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      handleRequestClose();
    }
  };

  // ── Product categories ─────────────────────────────────────────────────────

  const productCategories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))),
    [products],
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-[1100px] max-h-[92vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle>Bulk Add Orders</DialogTitle>
            {counts.total > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {counts.draft > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 font-medium">
                    {counts.draft} draft{counts.draft !== 1 ? "s" : ""}
                  </span>
                )}
                {counts.uploaded > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#e8f4e8] text-[#4f9a5c] border border-[#4f9a5c]/20 font-medium">
                    {counts.uploaded} uploaded
                  </span>
                )}
                {counts.failed > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20 font-medium">
                    {counts.failed} failed
                  </span>
                )}
              </div>
            )}
          </div>
          <DialogDescription>
            Build multiple orders at once and upload them in bulk. Drafts are
            saved automatically.
          </DialogDescription>
        </DialogHeader>

        {/* Confirm close banner */}
        {confirmClose && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-amber-800 flex-1">
              You have unsaved drafts. Are you sure you want to close?
            </span>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmClose(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setConfirmClose(false);
                  onClose();
                }}
              >
                Discard & Close
              </Button>
            </div>
          </div>
        )}

        {/* Draft list — scrollable */}
        <div className="flex-1 overflow-y-auto pr-1 py-2 space-y-3 min-h-0">
          {drafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg bg-muted/10 text-center space-y-3">
              <Package className="w-10 h-10 text-muted-foreground/40" />
              <div>
                <p className="font-medium text-foreground/70">
                  No draft orders yet
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Click "Add Draft Order" below to start building your batch.
                </p>
              </div>
            </div>
          ) : (
            drafts.map((draft, index) => (
              <DraftCard
                key={draft.draftId}
                draft={draft}
                index={index}
                isExpanded={expandedId === draft.draftId}
                onToggle={() =>
                  setExpandedId(
                    expandedId === draft.draftId ? null : draft.draftId,
                  )
                }
                onRemove={() => removeDraft(draft.draftId)}
                onUpdate={(patch) => updateDraft(draft.draftId, patch)}
                onAddItem={() => addItem(draft.draftId)}
                onRemoveItem={(itemId) => removeItem(draft.draftId, itemId)}
                onUpdateItem={(itemId, field, value) =>
                  updateItem(draft.draftId, itemId, field, value)
                }
                paymentMethods={paymentMethods}
                products={products}
                productCategories={productCategories}
              />
            ))
          )}
        </div>

        {/* Action bar */}
        <div className="flex flex-col gap-3 pt-3 border-t shrink-0">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={addDraft}>
              <Plus className="w-4 h-4 mr-2" />
              Add Draft Order
            </Button>

            <div className="flex items-center gap-2">
              {counts.uploaded > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearUploaded}
                  className="text-muted-foreground"
                >
                  <Eraser className="w-4 h-4 mr-2" />
                  Clear Uploaded
                </Button>
              )}
              {counts.total > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleRequestClose}
            disabled={isUploading}
          >
            Close
          </Button>
          <Button
            onClick={uploadAll}
            disabled={
              isUploading || (counts.draft === 0 && counts.failed === 0)
            }
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload All Drafts
                {(counts.draft > 0 || counts.failed > 0) &&
                  ` (${counts.draft + counts.failed})`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Draft Card ───────────────────────────────────────────────────────────────

interface DraftCardProps {
  draft: DraftOrder;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onUpdate: (patch: Partial<DraftOrder>) => void;
  onAddItem: () => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateItem: (
    itemId: string,
    field: keyof FormOrderItem,
    value: any,
  ) => void;
  paymentMethods: string[];
  products: Product[];
  productCategories: string[];
}

function DraftCard({
  draft,
  index,
  isExpanded,
  onToggle,
  onRemove,
  onUpdate,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  paymentMethods,
  products,
  productCategories,
}: DraftCardProps) {
  const total = calcTotal(draft.items);
  const isEditable =
    draft.uploadStatus === "draft" || draft.uploadStatus === "failed";

  return (
    <div
      className={`border rounded-lg overflow-hidden transition-colors ${
        draft.uploadStatus === "uploaded"
          ? "bg-[#e8f4e8]/30 border-[#4f9a5c]/20"
          : draft.uploadStatus === "failed"
            ? "bg-destructive/5 border-destructive/20"
            : draft.uploadStatus === "uploading"
              ? "bg-blue-50/30 border-blue-200"
              : "bg-card border-border"
      }`}
    >
      {/* Collapsed header */}
      <button
        type="button"
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
        onClick={onToggle}
      >
        <div className="text-muted-foreground">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </div>

        <div className="flex-1 min-w-0 flex items-center gap-3">
          <span className="font-semibold text-sm text-foreground/70 shrink-0">
            #{index + 1}
          </span>
          <span className="text-sm font-medium truncate">
            {draft.customerName.trim() || "Walk-In"}
          </span>
          <span className="hidden sm:inline text-xs text-muted-foreground truncate max-w-[300px]">
            {itemsSummary(draft.items)}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="font-semibold text-sm">₱{total.toFixed(2)}</span>
          <StatusBadge status={draft.uploadStatus} />
          {isEditable && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </button>

      {/* Error message */}
      {draft.uploadStatus === "failed" && draft.errorMessage && (
        <div className="px-4 pb-2 text-xs text-destructive flex items-center gap-1.5">
          <XCircle className="w-3 h-3 shrink-0" />
          {draft.errorMessage}
        </div>
      )}

      {/* Expanded form */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t space-y-4">
          {/* Top fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">
                Customer Name
              </Label>
              <Input
                placeholder="Defaults to Walk-In"
                value={draft.customerName}
                onChange={(e) => onUpdate({ customerName: e.target.value })}
                disabled={!isEditable}
                className="h-9"
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select
                value={draft.status}
                onValueChange={(v) => onUpdate({ status: v as OrderStatus })}
                disabled={!isEditable}
              >
                <SelectTrigger className="h-9">
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
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">
                Payment Method
              </Label>
              <Select
                value={draft.paymentMethod}
                onValueChange={(v) => v && onUpdate({ paymentMethod: v })}
                disabled={!isEditable}
              >
                <SelectTrigger className="h-9">
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
          </div>

          {/* Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Order Items</Label>
              {isEditable && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onAddItem}
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Item
                </Button>
              )}
            </div>

            {draft.items.length === 0 ? (
              <div className="text-sm text-muted-foreground italic p-4 border border-dashed rounded-lg text-center bg-muted/10">
                No items added. Click "Add Item" to start.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {draft.items.map((item, itemIdx) => (
                  <DraftItemRow
                    key={item.id}
                    item={item}
                    itemIdx={itemIdx}
                    disabled={!isEditable}
                    products={products}
                    productCategories={productCategories}
                    onUpdate={(field, value) =>
                      onUpdateItem(item.id, field, value)
                    }
                    onRemove={() => onRemoveItem(item.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Total */}
          <div className="flex justify-end items-center gap-3 pt-2 border-t">
            <span className="text-sm text-muted-foreground">Total:</span>
            <span className="text-xl font-bold tracking-tight text-primary">
              ₱{total.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Item Row ─────────────────────────────────────────────────────────────────

interface DraftItemRowProps {
  item: FormOrderItem;
  itemIdx: number;
  disabled: boolean;
  products: Product[];
  productCategories: string[];
  onUpdate: (field: keyof FormOrderItem, value: any) => void;
  onRemove: () => void;
}

function DraftItemRow({
  item,
  itemIdx,
  disabled,
  products,
  productCategories,
  onUpdate,
  onRemove,
}: DraftItemRowProps) {
  const product = products.find((p) => p.name === item.productName);

  const availableSizes = product
    ? (Array.from(
        new Set(product.variants.map((v) => v.size).filter(Boolean)),
      ) as string[])
    : [];

  const validVariantsForSize = product
    ? product.variants.filter((v) => v.size === item.size)
    : [];
  const filteredTemps = Array.from(
    new Set(validVariantsForSize.map((v) => v.temp).filter(Boolean)),
  ) as string[];

  const subtotal = item.unitPrice * item.qty;

  return (
    <div className="flex flex-col gap-2 p-3 border rounded-lg bg-background/50 relative">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Item {itemIdx + 1}
        </span>
        {!disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-12 gap-3 items-end">
        {/* Product */}
        <div className="col-span-2 sm:col-span-4 space-y-1">
          <Label className="text-xs text-muted-foreground">Product</Label>
          <Select
            value={item.productName}
            onValueChange={(v) => onUpdate("productName", v)}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select Product" />
            </SelectTrigger>
            <SelectContent>
              {productCategories.map((category) => (
                <SelectGroup key={category}>
                  <SelectLabel>{category}</SelectLabel>
                  {products
                    .filter((p) => p.category === category)
                    .map((p) => (
                      <SelectItem key={p.name} value={p.name}>
                        {p.name}
                      </SelectItem>
                    ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Size */}
        {availableSizes.length > 0 ? (
          <div className="sm:col-span-2 space-y-1">
            <Label className="text-xs text-muted-foreground">Size</Label>
            <Select
              value={item.size || ""}
              onValueChange={(v) => onUpdate("size", v)}
              disabled={disabled}
            >
              <SelectTrigger className="h-8 text-xs">
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
          <div className="sm:col-span-2" />
        )}

        {/* Temperature */}
        {filteredTemps.length > 0 ? (
          <div className="sm:col-span-2 space-y-1">
            <Label className="text-xs text-muted-foreground">Temp</Label>
            <Select
              value={item.temp || ""}
              onValueChange={(v) => onUpdate("temp", v)}
              disabled={disabled}
            >
              <SelectTrigger className="h-8 text-xs">
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
          <div className="sm:col-span-2" />
        )}

        {/* Qty */}
        <div className="sm:col-span-2 space-y-1">
          <Label className="text-xs text-muted-foreground">Qty</Label>
          <Input
            className="h-8 text-xs"
            type="number"
            min="1"
            value={item.qty}
            disabled={disabled}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val) && val > 0) onUpdate("qty", val);
            }}
          />
        </div>

        {/* Subtotal */}
        <div className="sm:col-span-2 text-right space-y-1 flex flex-col justify-end">
          <span className="text-xs text-muted-foreground">Subtotal</span>
          <span className="font-medium text-xs h-8 flex items-center justify-end">
            {item.productName ? `₱${subtotal.toFixed(2)}` : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
