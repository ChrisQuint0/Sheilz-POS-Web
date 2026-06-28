import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InventoryItem, Category, Unit } from "../data";
import {
  ImagePlus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Upload,
  Package,
  Check,
  X,
} from "lucide-react";

interface IngredientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: InventoryItem | null;
  categories: Category[];
  units: Unit[];
  onSave: (item: Partial<InventoryItem>) => void;
  onDelete?: (id: string) => void;
}

export function IngredientModal({
  open,
  onOpenChange,
  item,
  categories,
  units,
  onSave,
  onDelete,
}: IngredientModalProps) {
  const isEdit = !!item;
  const [step, setStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      handleChange("imageUrl", url);
    }
  };

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reasonForChange, setReasonForChange] = useState<string>("");

  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: "",
    categoryId: "",
    unit: "g",
    currentStock: 0,
    maxCapacity: 0,
    lowStockThreshold: 0,
    notes: "",
    imageUrl: "",
  });

  useEffect(() => {
    if (open) {
      setStep(1);
      setConfirmDelete(false);
      setReasonForChange("");
      if (item) {
        setFormData({ ...item });
      } else {
        setFormData({
          name: "",
          categoryId: categories[0]?.id || "",
          unit: "g",
          currentStock: 0,
          maxCapacity: 0,
          lowStockThreshold: 0,
          notes: "",
          imageUrl: "",
        });
      }
    }
  }, [open, item, categories]);

  const handleChange = (field: keyof InventoryItem, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave({ ...formData, reasonForChange } as any);
    onOpenChange(false);
  };

  const stockFieldsChanged =
    isEdit &&
    item &&
    (formData.currentStock !== item.currentStock ||
      formData.maxCapacity !== item.maxCapacity ||
      formData.lowStockThreshold !== item.lowStockThreshold);

  const isSaveDisabled = stockFieldsChanged && !reasonForChange;

  const canProceedToStep2 =
    formData.name && formData.categoryId && formData.unit;

  const steps = [
    { label: "Details", num: 1 },
    { label: "Stock & Notes", num: 2 },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#C2456A]/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-[#C2456A]" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-[#3a2b27]">
                {isEdit ? "Edit Ingredient" : "Add Ingredient"}
              </DialogTitle>
              <DialogDescription className="text-[13px] text-gray-400">
                {isEdit
                  ? "Update ingredient details and stock configuration."
                  : "Add a new ingredient to your inventory."}
              </DialogDescription>
            </div>
          </div>

          {/* Step Progress */}
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <React.Fragment key={s.num}>
                <button
                  onClick={() => {
                    if (s.num < step || (s.num === 2 && canProceedToStep2))
                      setStep(s.num);
                  }}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                    step === s.num
                      ? "text-[#C2456A]"
                      : step > s.num
                        ? "text-emerald-600"
                        : "text-gray-400"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold border-2 transition-all ${
                      step === s.num
                        ? "border-[#C2456A] bg-[#C2456A]/10 text-[#C2456A]"
                        : step > s.num
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-gray-200 bg-gray-50 text-gray-400"
                    }`}
                  >
                    {step > s.num ? "✓" : s.num}
                  </span>
                  {s.label}
                </button>
                {i < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 rounded-full mx-1 ${step > 1 ? "bg-emerald-400" : "bg-gray-200"}`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 flex flex-col gap-5 overflow-y-auto min-h-0 flex-1">
          {step === 1 && (
            <div className="space-y-5">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label className="text-[13px] font-semibold text-[#3a2b27]">
                  Image
                </Label>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                />
                <div
                  className="w-full h-28 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/60 flex flex-col items-center justify-center cursor-pointer hover:border-[#C2456A]/40 hover:bg-[#C2456A]/5 transition-all group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {formData.imageUrl ? (
                    <div className="relative w-full h-full">
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-contain rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-semibold">
                          Change Image
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-gray-300 mb-1.5 group-hover:text-[#C2456A] transition-colors" />
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider group-hover:text-[#C2456A] transition-colors">
                        Click to Upload
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label className="text-[13px] font-semibold text-[#3a2b27]">
                  Ingredient Name <span className="text-[#C2456A]">*</span>
                </Label>
                <Input
                  value={formData.name || ""}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g. Espresso Beans"
                  className="h-10 bg-white border-gray-200 focus:border-[#C2456A] focus:ring-[#C2456A]/20"
                />
              </div>

              {/* Category + Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[13px] font-semibold text-[#3a2b27]">
                    Category <span className="text-[#C2456A]">*</span>
                  </Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(val) => handleChange("categoryId", val)}
                  >
                    <SelectTrigger className="h-10 bg-white border-gray-200">
                      <SelectValue>
                        {categories.find((c) => c.id === formData.categoryId)
                          ?.name || "Select Category"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[13px] font-semibold text-[#3a2b27]">
                    Unit <span className="text-[#C2456A]">*</span>
                  </Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(val) => handleChange("unit", val as Unit)}
                  >
                    <SelectTrigger className="h-10 bg-white border-gray-200">
                      <SelectValue>
                        {formData.unit || "Select Unit"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              {/* Stock Configuration */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Stock Configuration
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label className="text-[13px] font-semibold text-[#3a2b27]">
                      Current Stock
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={formData.currentStock || ""}
                        onChange={(e) =>
                          handleChange("currentStock", Number(e.target.value))
                        }
                        className="h-10 bg-white border-gray-200 pr-10 focus:border-[#C2456A] focus:ring-[#C2456A]/20"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                        {formData.unit}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[13px] font-semibold text-[#3a2b27]">
                      Max Capacity
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={formData.maxCapacity || ""}
                        onChange={(e) =>
                          handleChange("maxCapacity", Number(e.target.value))
                        }
                        className="h-10 bg-white border-gray-200 pr-10 focus:border-[#C2456A] focus:ring-[#C2456A]/20"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                        {formData.unit}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[13px] font-semibold text-[#3a2b27]">
                      Low Threshold
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={formData.lowStockThreshold || ""}
                        onChange={(e) =>
                          handleChange(
                            "lowStockThreshold",
                            Number(e.target.value),
                          )
                        }
                        className="h-10 bg-white border-gray-200 pr-10 focus:border-[#C2456A] focus:ring-[#C2456A]/20"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                        {formData.unit}
                      </span>
                    </div>
                  </div>

                  {/* Reason for Change */}
                  <div className="col-span-3 space-y-2 mt-2">
                    <Label className="text-[13px] font-semibold text-[#3a2b27]">
                      Reason for Change {stockFieldsChanged && <span className="text-[#C2456A]">*</span>}
                    </Label>
                    <Select
                      value={reasonForChange}
                      onValueChange={setReasonForChange}
                    >
                      <SelectTrigger className="h-10 bg-white border-gray-200 focus:border-[#C2456A] focus:ring-[#C2456A]/20">
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Manual Adjustment">Manual Adjustment</SelectItem>
                        <SelectItem value="Waste / Spoilage">Waste / Spoilage</SelectItem>
                        <SelectItem value="Stock Correction">Stock Correction</SelectItem>
                      </SelectContent>
                    </Select>
                    {stockFieldsChanged && !reasonForChange && (
                      <p className="text-xs font-medium text-rose-500 mt-1">
                        Reason for Change is required when updating stock information.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Internal Notes
                </h3>
                <textarea
                  className="flex min-h-[100px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C2456A]/20 focus-visible:border-[#C2456A] resize-none transition-all"
                  placeholder="e.g. Stored in dry storage container, reorder from SupplierX..."
                  value={formData.notes || ""}
                  onChange={(e) => handleChange("notes", e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center gap-2">
          {isEdit ? (
            confirmDelete ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] text-rose-600 font-medium">
                  Delete this ingredient?
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-emerald-600 hover:bg-emerald-50"
                  onClick={() => {
                    onDelete?.(item.id);
                    onOpenChange(false);
                  }}
                >
                  <Check className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-gray-400 hover:bg-gray-100"
                  onClick={() => setConfirmDelete(false)}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-9 px-3 text-[13px]"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Delete
              </Button>
            )
          ) : (
            <div></div>
          )}

          <div className="flex gap-2">
            {step === 2 && (
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="h-9 bg-white border-gray-200 text-[13px]"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
              </Button>
            )}
            {step === 1 ? (
              <Button
                onClick={() => setStep(2)}
                disabled={!canProceedToStep2}
                className="h-9 px-5 bg-[#C2456A] hover:bg-[#a33858] text-white shadow-sm text-[13px]"
              >
                Next <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={isSaveDisabled}
                className="h-9 px-5 bg-[#C2456A] hover:bg-[#a33858] text-white shadow-sm text-[13px]"
              >
                {isEdit ? "Save Changes" : "Create Ingredient"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
