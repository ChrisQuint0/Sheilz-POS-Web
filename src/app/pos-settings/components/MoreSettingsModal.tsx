import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Category, PaymentMethod, Size, TemperatureOption } from "../types";
import {
  Plus,
  GripVertical,
  Trash2,
  CreditCard,
  Ruler,
  Thermometer,
  Tag,
  Edit2,
  Check,
  X,
  ImagePlus,
  ImageOff,
  Package,
} from "lucide-react";
import { createClient } from "@/app/lib/supabase/client";
import {
  uploadImage,
  replaceImage,
  deleteImage,
} from "@/app/lib/supabase/storage";
import { toast } from "sonner";

interface MoreSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  paymentMethods: PaymentMethod[];
  setPaymentMethods: React.Dispatch<React.SetStateAction<PaymentMethod[]>>;
  sizes: Size[];
  setSizes: React.Dispatch<React.SetStateAction<Size[]>>;
  temperatures: TemperatureOption[];
  setTemperatures: React.Dispatch<React.SetStateAction<TemperatureOption[]>>;
}

export function MoreSettingsModal({
  open,
  onOpenChange,
  categories,
  setCategories,
  paymentMethods,
  setPaymentMethods,
  sizes,
  setSizes,
  temperatures,
  setTemperatures,
}: MoreSettingsModalProps) {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newPaymentName, setNewPaymentName] = useState("");
  const [newSizeName, setNewSizeName] = useState("");
  const [newTempName, setNewTempName] = useState("");
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- Edit state ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // --- Payment Image Upload state ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPaymentId, setUploadingPaymentId] = useState<string | null>(
    null,
  );

  // --- Active tab (controlled so we can lazy-load Packaging data) ---
  const [activeTab, setActiveTab] = useState("categories");

  // --- Packaging tab state ---
  // One toggle per ingredient applies to every product_recipes row using
  // that ingredient (confirmed with Ipei: bulk, not per-variant), so the
  // list is grouped by inventory_item_id with every variant it's used in
  // shown underneath for context.
  type PackagingUsage = {
    productName: string;
    sizeName: string | null;
    tempName: string | null;
  };
  type PackagingIngredient = {
    inventoryItemId: string;
    name: string;
    isPackaging: boolean;
    usages: PackagingUsage[];
  };
  const [packagingIngredients, setPackagingIngredients] = useState<
    PackagingIngredient[]
  >([]);
  const [packagingLoaded, setPackagingLoaded] = useState(false);
  const [packagingLoading, setPackagingLoading] = useState(false);

  const supabase = createClient();

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditValue(name);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  // --- Category handlers ---
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("product_categories")
        .insert([{ name: newCategoryName.trim() }])
        .select();

      if (error) {
        alert("Failed to add category: " + error.message);
        return;
      }

      if (data && data.length > 0) {
        setCategories((prev) => [
          ...prev,
          { id: data[0].id, name: data[0].name },
        ]);
      }
      setNewCategoryName("");
    } catch (err) {
      console.error("Error adding category:", err);
      alert("Failed to add category");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("product_categories")
        .delete()
        .eq("id", id);

      if (error) {
        alert("Failed to delete category: " + error.message);
        return;
      }

      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Error deleting category:", err);
      alert("Failed to delete category");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCategory = async (id: string) => {
    if (!editValue.trim()) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("product_categories")
        .update({ name: editValue.trim() })
        .eq("id", id);

      if (error) {
        alert("Failed to update category: " + error.message);
        return;
      }

      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name: editValue.trim() } : c)),
      );
      setEditingId(null);
    } catch (err) {
      console.error("Error updating category:", err);
      alert("Failed to update category");
    } finally {
      setIsLoading(false);
    }
  };
  const handleDropCategory = (e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === dropIdx) return;
    setCategories((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(draggedIdx, 1);
      arr.splice(dropIdx, 0, item);
      return arr;
    });
    setDraggedIdx(null);
  };

  // --- Payment handlers ---
  const handleUploadClick = (paymentId: string) => {
    setUploadingPaymentId(paymentId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Always reset the input so picking the same file twice still fires onChange
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file || !uploadingPaymentId) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large", {
        description: "Please choose an image under 5MB.",
      });
      setUploadingPaymentId(null);
      return;
    }

    setIsLoading(true);
    try {
      const payment = paymentMethods.find((p) => p.id === uploadingPaymentId);
      if (!payment) return;

      let publicUrl: string;
      if (payment.image) {
        publicUrl = await replaceImage(
          payment.image,
          file,
          "payments",
          payment.id,
        );
      } else {
        publicUrl = await uploadImage(file, "payments", payment.id);
      }

      const { error } = await supabase
        .from("payment_methods")
        .update({ image_url: publicUrl })
        .eq("id", payment.id);

      if (error) throw error;

      setPaymentMethods((prev) =>
        prev.map((p) => (p.id === payment.id ? { ...p, image: publicUrl } : p)),
      );
      toast.success("Logo uploaded", { description: payment.name });
    } catch (err) {
      console.error("Error uploading image:", err);
      toast.error("Failed to upload image", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsLoading(false);
      setUploadingPaymentId(null);
    }
  };

  const handleRemoveImage = async (paymentId: string, imageUrl: string) => {
    setIsLoading(true);
    try {
      // Best-effort storage cleanup; ignore failures so the UI can still update
      try {
        await deleteImage(imageUrl);
      } catch (cleanupErr) {
        console.error("Failed to delete image from storage:", cleanupErr);
      }

      const { error } = await supabase
        .from("payment_methods")
        .update({ image_url: null })
        .eq("id", paymentId);

      if (error) throw error;

      setPaymentMethods((prev) =>
        prev.map((p) => (p.id === paymentId ? { ...p, image: undefined } : p)),
      );
      toast.success("Logo removed");
    } catch (err) {
      console.error("Error removing image:", err);
      toast.error("Failed to remove logo", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPayment = async () => {
    if (!newPaymentName.trim()) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("payment_methods")
        .insert([{ name: newPaymentName.trim(), is_enabled: true }])
        .select();

      if (error) {
        alert("Failed to add payment method: " + error.message);
        return;
      }

      if (data && data.length > 0) {
        setPaymentMethods((prev) => [
          ...prev,
          {
            id: data[0].id,
            name: data[0].name,
            isEnabled: data[0].is_enabled,
          },
        ]);
      }
      setNewPaymentName("");
    } catch (err) {
      console.error("Error adding payment method:", err);
      alert("Failed to add payment method");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePayment = async (id: string) => {
    setIsLoading(true);
    try {
      // Clean up the image in storage before deleting the DB row
      const payment = paymentMethods.find((p) => p.id === id);
      if (payment?.image) {
        try {
          await deleteImage(payment.image);
        } catch (cleanupErr) {
          console.error("Failed to delete image from storage:", cleanupErr);
          // Continue with DB delete even if storage cleanup fails
        }
      }

      const { error } = await supabase
        .from("payment_methods")
        .delete()
        .eq("id", id);

      if (error) {
        alert("Failed to delete payment method: " + error.message);
        return;
      }

      setPaymentMethods((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Error deleting payment method:", err);
      alert("Failed to delete payment method");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePayment = async (id: string) => {
    if (!editValue.trim()) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("payment_methods")
        .update({ name: editValue.trim() })
        .eq("id", id);

      if (error) {
        alert("Failed to update payment method: " + error.message);
        return;
      }

      setPaymentMethods((prev) =>
        prev.map((p) => (p.id === id ? { ...p, name: editValue.trim() } : p)),
      );
      setEditingId(null);
    } catch (err) {
      console.error("Error updating payment method:", err);
      alert("Failed to update payment method");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePayment = async (id: string, isEnabled: boolean) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("payment_methods")
        .update({ is_enabled: isEnabled })
        .eq("id", id);

      if (error) {
        alert("Failed to update payment method: " + error.message);
        return;
      }

      setPaymentMethods((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isEnabled } : p)),
      );
    } catch (err) {
      console.error("Error updating payment method:", err);
      alert("Failed to update payment method");
    } finally {
      setIsLoading(false);
    }
  };
  const handleDropPayment = (e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === dropIdx) return;
    setPaymentMethods((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(draggedIdx, 1);
      arr.splice(dropIdx, 0, item);
      return arr;
    });
    setDraggedIdx(null);
  };

  // --- Packaging handlers ---
  const fetchPackagingData = async () => {
    setPackagingLoading(true);
    try {
      const { data, error } = await supabase.from("product_recipes").select(`
          inventory_item_id,
          is_packaging,
          products ( name ),
          product_variants ( sizes ( name ), temperatures ( name ) ),
          inventory_items ( name )
        `);

      if (error) throw error;

      const grouped = new Map<string, PackagingIngredient>();
      (data || []).forEach((row: any) => {
        const key = row.inventory_item_id;
        const usage: PackagingUsage = {
          productName: row.products?.name ?? "Unknown product",
          sizeName: row.product_variants?.sizes?.name ?? null,
          tempName: row.product_variants?.temperatures?.name ?? null,
        };
        const existing = grouped.get(key);
        if (existing) {
          existing.usages.push(usage);
          if (row.is_packaging) existing.isPackaging = true;
        } else {
          grouped.set(key, {
            inventoryItemId: key,
            name: row.inventory_items?.name ?? "Unknown ingredient",
            isPackaging: !!row.is_packaging,
            usages: [usage],
          });
        }
      });

      setPackagingIngredients(
        Array.from(grouped.values()).sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      );
      setPackagingLoaded(true);
    } catch (err) {
      console.error("Error fetching packaging data:", err);
      toast.error("Failed to load packaging data", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setPackagingLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "packaging" && !packagingLoaded) {
      fetchPackagingData();
    }
  };

  const handleTogglePackaging = async (
    inventoryItemId: string,
    value: boolean,
  ) => {
    setIsLoading(true);
    try {
      // .select() + row-count check so an RLS block (or any other silent
      // no-op) surfaces as a loud failure instead of the toggle appearing
      // to succeed locally while nothing actually changed remotely.
      const { data, error } = await supabase
        .from("product_recipes")
        .update({ is_packaging: value })
        .eq("inventory_item_id", inventoryItemId)
        .select("id");

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error(
          "No recipe rows were updated — check permissions for this ingredient.",
        );
      }

      setPackagingIngredients((prev) =>
        prev.map((ing) =>
          ing.inventoryItemId === inventoryItemId
            ? { ...ing, isPackaging: value }
            : ing,
        ),
      );
      toast.success(value ? "Marked as packaging" : "Unmarked as packaging");
    } catch (err) {
      console.error("Error updating packaging flag:", err);
      toast.error("Failed to update packaging flag", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Size handlers ---
  const handleAddSize = async () => {
    if (!newSizeName.trim()) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("sizes")
        .insert([{ name: newSizeName.trim() }])
        .select();

      if (error) {
        alert("Failed to add size: " + error.message);
        return;
      }

      if (data && data.length > 0) {
        setSizes((prev) => [...prev, { id: data[0].id, name: data[0].name }]);
      }
      setNewSizeName("");
    } catch (err) {
      console.error("Error adding size:", err);
      alert("Failed to add size");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSize = async (id: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from("sizes").delete().eq("id", id);

      if (error) {
        alert("Failed to delete size: " + error.message);
        return;
      }

      setSizes((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Error deleting size:", err);
      alert("Failed to delete size");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSize = async (id: string) => {
    if (!editValue.trim()) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("sizes")
        .update({ name: editValue.trim() })
        .eq("id", id);

      if (error) {
        alert("Failed to update size: " + error.message);
        return;
      }

      setSizes((prev) =>
        prev.map((s) => (s.id === id ? { ...s, name: editValue.trim() } : s)),
      );
      setEditingId(null);
    } catch (err) {
      console.error("Error updating size:", err);
      alert("Failed to update size");
    } finally {
      setIsLoading(false);
    }
  };
  const handleDropSize = (e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === dropIdx) return;
    setSizes((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(draggedIdx, 1);
      arr.splice(dropIdx, 0, item);
      return arr;
    });
    setDraggedIdx(null);
  };

  // --- Temperature handlers ---
  const handleAddTemp = async () => {
    if (!newTempName.trim()) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("temperatures")
        .insert([{ name: newTempName.trim() }])
        .select();

      if (error) {
        alert("Failed to add temperature: " + error.message);
        return;
      }

      if (data && data.length > 0) {
        setTemperatures((prev) => [
          ...prev,
          { id: data[0].id, name: data[0].name },
        ]);
      }
      setNewTempName("");
    } catch (err) {
      console.error("Error adding temperature:", err);
      alert("Failed to add temperature");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTemp = async (id: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("temperatures")
        .delete()
        .eq("id", id);

      if (error) {
        alert("Failed to delete temperature: " + error.message);
        return;
      }

      setTemperatures((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Error deleting temperature:", err);
      alert("Failed to delete temperature");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTemp = async (id: string) => {
    if (!editValue.trim()) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("temperatures")
        .update({ name: editValue.trim() })
        .eq("id", id);

      if (error) {
        alert("Failed to update temperature: " + error.message);
        return;
      }

      setTemperatures((prev) =>
        prev.map((t) => (t.id === id ? { ...t, name: editValue.trim() } : t)),
      );
      setEditingId(null);
    } catch (err) {
      console.error("Error updating temperature:", err);
      alert("Failed to update temperature");
    } finally {
      setIsLoading(false);
    }
  };
  const handleDropTemp = (e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === dropIdx) return;
    setTemperatures((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(draggedIdx, 1);
      arr.splice(dropIdx, 0, item);
      return arr;
    });
    setDraggedIdx(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] md:max-w-[900px] lg:max-w-[1000px] w-[95vw] max-h-[85vh] flex flex-col p-0 overflow-hidden border-gray-200">
        <DialogHeader className="p-6 pb-5 border-b border-gray-100 shrink-0">
          <DialogTitle className="text-xl font-bold text-[#3a2b27]">
            More Settings
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 mt-1">
            Manage global configurations for categories, payment methods, sizes,
            and temperatures.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          <div className="px-6 border-b border-gray-100 shrink-0">
            <TabsList
              variant="line"
              className="h-12 w-full justify-start gap-1 p-0"
            >
              <TabsTrigger
                value="categories"
                className="px-4 h-full text-sm font-medium gap-2"
              >
                <Tag className="w-4 h-4" /> Categories
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="px-4 h-full text-sm font-medium gap-2"
              >
                <CreditCard className="w-4 h-4" /> Payments
              </TabsTrigger>
              <TabsTrigger
                value="sizes"
                className="px-4 h-full text-sm font-medium gap-2"
              >
                <Ruler className="w-4 h-4" /> Sizes
              </TabsTrigger>
              <TabsTrigger
                value="temperatures"
                className="px-4 h-full text-sm font-medium gap-2"
              >
                <Thermometer className="w-4 h-4" /> Temperatures
              </TabsTrigger>
              <TabsTrigger
                value="packaging"
                className="px-4 h-full text-sm font-medium gap-2"
              >
                <Package className="w-4 h-4" /> Packaging
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6 min-h-0 bg-gray-50/50">
            {/* Categories */}
            <TabsContent
              value="categories"
              className="m-0 space-y-5 outline-none"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-bold text-lg text-[#3a2b27]">
                  Product Categories
                </h3>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="New category name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                    className="w-48 h-9 text-sm bg-white border-gray-200 focus:border-[#C2456A]"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleAddCategory}
                    size="sm"
                    className="h-9 bg-[#C2456A] hover:bg-[#a33858] text-white"
                    disabled={isLoading}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 shadow-sm">
                {categories.map((cat, idx) => (
                  <div
                    key={cat.id}
                    draggable={editingId !== cat.id && !isLoading}
                    onDragStart={() => setDraggedIdx(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDropCategory(e, idx)}
                    className={`flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/80 group transition-colors ${editingId !== cat.id && !isLoading ? "cursor-move" : ""}`}
                  >
                    {editingId === cat.id ? (
                      <div className="flex items-center gap-2 w-full pr-2">
                        <Input
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSaveCategory(cat.id)
                          }
                          className="h-8 text-sm bg-white border-gray-200 focus:border-[#C2456A]"
                          disabled={isLoading}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 shrink-0"
                          onClick={() => handleSaveCategory(cat.id)}
                          disabled={isLoading}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 shrink-0"
                          onClick={cancelEdit}
                          disabled={isLoading}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
                          <span className="font-medium text-sm text-[#3a2b27]">
                            {cat.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() => startEdit(cat.id, cat.name)}
                            className="text-gray-300 hover:text-blue-500 p-1.5 rounded-lg hover:bg-blue-50 disabled:opacity-50"
                            disabled={isLoading}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="text-gray-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50"
                            disabled={isLoading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {categories.length === 0 && (
                  <div className="p-8 text-center text-gray-400 text-sm">
                    No categories yet. Add one above.
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Payment Methods */}
            <TabsContent
              value="payments"
              className="m-0 space-y-5 outline-none"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-bold text-lg text-[#3a2b27]">
                  Payment Methods
                </h3>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <Input
                    placeholder="New payment method"
                    value={newPaymentName}
                    onChange={(e) => setNewPaymentName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddPayment()}
                    className="w-48 h-9 text-sm bg-white border-gray-200 focus:border-[#C2456A]"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleAddPayment}
                    size="sm"
                    className="h-9 bg-[#C2456A] hover:bg-[#a33858] text-white"
                    disabled={isLoading}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 shadow-sm">
                {paymentMethods.map((pm, idx) => (
                  <div
                    key={pm.id}
                    draggable={editingId !== pm.id && !isLoading}
                    onDragStart={() => setDraggedIdx(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDropPayment(e, idx)}
                    className={`flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/80 group transition-colors ${editingId !== pm.id && !isLoading ? "cursor-move" : ""}`}
                  >
                    {editingId === pm.id ? (
                      <div className="flex items-center gap-2 w-full pr-2">
                        <Input
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSavePayment(pm.id)
                          }
                          className="h-8 text-sm bg-white border-gray-200 focus:border-[#C2456A]"
                          disabled={isLoading}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 shrink-0"
                          onClick={() => handleSavePayment(pm.id)}
                          disabled={isLoading}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 shrink-0"
                          onClick={cancelEdit}
                          disabled={isLoading}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
                          {pm.image && (
                            <img
                              src={pm.image}
                              alt={pm.name}
                              className="w-8 h-8 object-contain rounded border bg-white"
                            />
                          )}
                          <span className="font-medium text-sm text-[#3a2b27]">
                            {pm.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="cursor-default"
                          >
                            <Switch
                              checked={pm.isEnabled}
                              onCheckedChange={(c) =>
                                handleTogglePayment(pm.id, c)
                              }
                              disabled={isLoading}
                            />
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={() => handleUploadClick(pm.id)}
                              className="text-gray-300 hover:text-indigo-500 p-1.5 rounded-lg hover:bg-indigo-50 disabled:opacity-50"
                              disabled={isLoading}
                              title={pm.image ? "Replace Logo" : "Upload Logo"}
                            >
                              <ImagePlus className="w-4 h-4" />
                            </button>
                            {pm.image && (
                              <button
                                onClick={() =>
                                  handleRemoveImage(pm.id, pm.image!)
                                }
                                className="text-gray-300 hover:text-orange-500 p-1.5 rounded-lg hover:bg-orange-50 disabled:opacity-50"
                                disabled={isLoading}
                                title="Remove Logo"
                              >
                                <ImageOff className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => startEdit(pm.id, pm.name)}
                              className="text-gray-300 hover:text-blue-500 p-1.5 rounded-lg hover:bg-blue-50 disabled:opacity-50"
                              disabled={isLoading}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePayment(pm.id)}
                              className="text-gray-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50"
                              disabled={isLoading}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {paymentMethods.length === 0 && (
                  <div className="p-8 text-center text-gray-400 text-sm">
                    No payment methods yet. Add one above.
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Sizes */}
            <TabsContent value="sizes" className="m-0 space-y-5 outline-none">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-bold text-lg text-[#3a2b27]">Cup Sizes</h3>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="e.g. 8oz"
                    value={newSizeName}
                    onChange={(e) => setNewSizeName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddSize()}
                    className="w-36 h-9 text-sm bg-white border-gray-200 focus:border-[#C2456A]"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleAddSize}
                    size="sm"
                    className="h-9 bg-[#C2456A] hover:bg-[#a33858] text-white"
                    disabled={isLoading}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 shadow-sm">
                {sizes.map((size, idx) => (
                  <div
                    key={size.id}
                    draggable={editingId !== size.id && !isLoading}
                    onDragStart={() => setDraggedIdx(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDropSize(e, idx)}
                    className={`flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/80 group transition-colors ${editingId !== size.id && !isLoading ? "cursor-move" : ""}`}
                  >
                    {editingId === size.id ? (
                      <div className="flex items-center gap-2 w-full pr-2">
                        <Input
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSaveSize(size.id)
                          }
                          className="h-8 text-sm bg-white border-gray-200 focus:border-[#C2456A]"
                          disabled={isLoading}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 shrink-0"
                          onClick={() => handleSaveSize(size.id)}
                          disabled={isLoading}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 shrink-0"
                          onClick={cancelEdit}
                          disabled={isLoading}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
                          <span className="font-medium text-sm text-[#3a2b27]">
                            {size.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() => startEdit(size.id, size.name)}
                            className="text-gray-300 hover:text-blue-500 p-1.5 rounded-lg hover:bg-blue-50 disabled:opacity-50"
                            disabled={isLoading}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSize(size.id)}
                            className="text-gray-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50"
                            disabled={isLoading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {sizes.length === 0 && (
                  <div className="p-8 text-center text-gray-400 text-sm">
                    No sizes yet. Add one above.
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Temperatures */}
            <TabsContent
              value="temperatures"
              className="m-0 space-y-5 outline-none"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-bold text-lg text-[#3a2b27]">
                  Temperature Options
                </h3>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="e.g. Blended"
                    value={newTempName}
                    onChange={(e) => setNewTempName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTemp()}
                    className="w-40 h-9 text-sm bg-white border-gray-200 focus:border-[#C2456A]"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleAddTemp}
                    size="sm"
                    className="h-9 bg-[#C2456A] hover:bg-[#a33858] text-white"
                    disabled={isLoading}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 shadow-sm">
                {temperatures.map((temp, idx) => (
                  <div
                    key={temp.id}
                    draggable={editingId !== temp.id && !isLoading}
                    onDragStart={() => setDraggedIdx(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDropTemp(e, idx)}
                    className={`flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/80 group transition-colors ${editingId !== temp.id && !isLoading ? "cursor-move" : ""}`}
                  >
                    {editingId === temp.id ? (
                      <div className="flex items-center gap-2 w-full pr-2">
                        <Input
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSaveTemp(temp.id)
                          }
                          className="h-8 text-sm bg-white border-gray-200 focus:border-[#C2456A]"
                          disabled={isLoading}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 shrink-0"
                          onClick={() => handleSaveTemp(temp.id)}
                          disabled={isLoading}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 shrink-0"
                          onClick={cancelEdit}
                          disabled={isLoading}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
                          <span className="font-medium text-sm text-[#3a2b27]">
                            {temp.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() => startEdit(temp.id, temp.name)}
                            className="text-gray-300 hover:text-blue-500 p-1.5 rounded-lg hover:bg-blue-50 disabled:opacity-50"
                            disabled={isLoading}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTemp(temp.id)}
                            className="text-gray-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50"
                            disabled={isLoading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {temperatures.length === 0 && (
                  <div className="p-8 text-center text-gray-400 text-sm">
                    No temperature options yet. Add one above.
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Packaging */}
            <TabsContent
              value="packaging"
              className="m-0 space-y-5 outline-none"
            >
              <div>
                <h3 className="font-bold text-lg text-[#3a2b27]">
                  Packaging Items
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Mark ingredients that are only used for Take-Out (cups, lids,
                  straws). Toggling one on applies to every recipe it appears in
                  — no need to edit each product individually. Dine-In orders
                  skip deducting these; Take-Out orders don't.
                </p>
              </div>

              {packagingLoading ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  Loading ingredients...
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 shadow-sm">
                  {packagingIngredients.map((ing) => (
                    <div
                      key={ing.inventoryItemId}
                      className="flex items-start justify-between gap-4 px-4 py-3.5 hover:bg-gray-50/80 transition-colors"
                    >
                      <div className="min-w-0">
                        <span className="font-medium text-sm text-[#3a2b27]">
                          {ing.name}
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {ing.usages.map((u, i) => (
                            <span
                              key={i}
                              className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5"
                            >
                              {u.productName}
                              {u.sizeName ? ` · ${u.sizeName}` : ""}
                              {u.tempName ? ` · ${u.tempName}` : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                      <Switch
                        checked={ing.isPackaging}
                        onCheckedChange={(c) =>
                          handleTogglePackaging(ing.inventoryItemId, c)
                        }
                        disabled={isLoading}
                        className="shrink-0 mt-0.5"
                      />
                    </div>
                  ))}
                  {packagingIngredients.length === 0 && (
                    <div className="p-8 text-center text-gray-400 text-sm">
                      No ingredients are used in any recipe yet. Add ingredients
                      to a product's recipe first, then mark the packaging ones
                      here.
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
