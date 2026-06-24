import React, { useState } from "react";
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
} from "lucide-react";
import { createClient } from "@/app/lib/supabase/client";

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
        setSizes((prev) => [
          ...prev,
          { id: data[0].id, name: data[0].name },
        ]);
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
      const { error } = await supabase
        .from("sizes")
        .delete()
        .eq("id", id);

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
          defaultValue="categories"
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
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
