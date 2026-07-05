import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Product,
  Category,
  Size,
  TemperatureOption,
  ProductType,
  Ingredient,
} from "../types";
import {
  ImagePlus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Search,
  Plus,
  Check,
  Archive,
  Loader2,
} from "lucide-react";
import { replaceImage } from "@/app/lib/supabase/storage";
import { toast } from "sonner";

interface ProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  categories: Category[];
  sizes: Size[];
  temperatures: TemperatureOption[];
  ingredientsList: Ingredient[];
  onSave: (product: Product) => void;
  onArchive?: (productId: string) => void;
}

export function ProductModal({
  open,
  onOpenChange,
  product,
  categories,
  sizes,
  temperatures,
  ingredientsList,
  onSave,
  onArchive,
}: ProductModalProps) {
  const [step, setStep] = useState(0);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [editedProduct, setEditedProduct] = useState<Product | null>(null);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [selectedRecipeConfigId, setSelectedRecipeConfigId] = useState<
    string | null
  >(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [pricingErrors, setPricingErrors] = useState<string[]>([]);

  // Get the steps based on product type
  const getSteps = (type: ProductType): string[] => {
    if (type === "Beverage") {
      return ["Basic Details", "Variants", "Pricing", "Recipe", "Summary"];
    }
    return ["Basic Details", "Pricing", "Summary"];
  };

  const currentProductType = (editedProduct?.type ?? "Beverage") as ProductType;
  const steps = getSteps(currentProductType);

  const variantCombinations = React.useMemo(() => {
    if (!editedProduct) return [];
    const sizesSelected = editedProduct.sizes;
    const tempsSelected = editedProduct.temperatures;

    // For Pastry products, if no sizes/temps selected, use default
    if (sizesSelected.length === 0 && tempsSelected.length === 0) {
      return [{ id: "default", name: "Regular" }];
    }

    if (sizesSelected.length > 0 && tempsSelected.length === 0) {
      return sizesSelected.map((sId) => {
        const sName = sizes.find((s) => s.id === sId)?.name || sId;
        return { id: sId, name: sName };
      });
    }

    if (sizesSelected.length === 0 && tempsSelected.length > 0) {
      return tempsSelected.map((tId) => {
        const tName = temperatures.find((t) => t.id === tId)?.name || tId;
        return { id: tId, name: tName };
      });
    }

    const combos: { id: string; name: string }[] = [];
    for (const sId of sizesSelected) {
      for (const tId of tempsSelected) {
        const sName = sizes.find((s) => s.id === sId)?.name || sId;
        const tName = temperatures.find((t) => t.id === tId)?.name || tId;
        combos.push({ id: `${sId}_${tId}`, name: `${sName} ${tName}` });
      }
    }
    return combos;
  }, [editedProduct?.sizes, editedProduct?.temperatures, sizes, temperatures]);

  // Only combos that have a price set — used in the Recipe step
  const pricedVariantCombinations = React.useMemo(() => {
    if (!editedProduct) return [];
    return variantCombinations.filter((combo) => {
      const price = editedProduct.prices?.[combo.id];
      return (
        price !== undefined &&
        price !== null &&
        !isNaN(price) &&
        String(price).trim() !== ""
      );
    });
  }, [variantCombinations, editedProduct?.prices]);

  const checkScroll = React.useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [step, variantCombinations, selectedRecipeConfigId, checkScroll]);

  const scrollCombos = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const amount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -amount : amount,
        behavior: "smooth",
      });
      setTimeout(checkScroll, 300);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editedProduct) return;

    setIsUploadingImage(true);
    try {
      const newImageUrl = await replaceImage(
        editedProduct.image || null,
        file,
        "products",
        editedProduct.id
      );
      setEditedProduct((prev) => (prev ? { ...prev, image: newImageUrl } : prev));
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Recipe step: auto-select first priced combo as active tab
  useEffect(() => {
    if (step === 3 && editedProduct?.type === "Beverage") {
      if (
        pricedVariantCombinations.length > 0 &&
        (!selectedRecipeConfigId ||
          !pricedVariantCombinations.some(
            (c) => c.id === selectedRecipeConfigId,
          ))
      ) {
        setSelectedRecipeConfigId(pricedVariantCombinations[0].id);
      } else if (pricedVariantCombinations.length === 0) {
        setSelectedRecipeConfigId(null);
      }
    }
  }, [step, pricedVariantCombinations, selectedRecipeConfigId, editedProduct]);

  useEffect(() => {
    if (open) {
      setStep(0);
      setSelectedRecipeConfigId(null);
      if (product) {
        setEditedProduct({ ...product });
      } else {
        setEditedProduct({
          id: `new-${Date.now()}`,
          name: "",
          categoryId: "",
          type: "Beverage",
          sizes: [],
          temperatures: [],
          prices: {},
          hasRecipe: false,
          recipes: {},
          isVisible: true,
        });
      }
    }
  }, [product, open]);

  // Reset step when product type changes to avoid being on a step that doesn't exist
  useEffect(() => {
    if (editedProduct) {
      const productType = editedProduct.type as ProductType;
      const currentSteps = getSteps(productType);
      if (step >= currentSteps.length) {
        setStep(currentSteps.length - 1);
      }
    }
  }, [editedProduct?.type, step]);

  if (!editedProduct) return null;

  const isEditing = !!product;

  const nextStep = () => {
    // Beverage: Pricing is step 2. Pastry: Pricing is step 1.
    const pricingStepIndex = editedProduct.type === "Beverage" ? 2 : 1;
    if (step === pricingStepIndex) {
      const errors: string[] = [];
      for (const combo of variantCombinations) {
        const price = editedProduct.prices?.[combo.id];
        if (
          price === undefined ||
          price === null ||
          isNaN(price) ||
          price < 0 ||
          String(price).trim() === ""
        ) {
          errors.push(combo.id);
        }
      }
      if (errors.length > 0) {
        setPricingErrors(errors);
        return;
      }
      setPricingErrors([]);
    }
    setStep((s) => Math.min(steps.length - 1, s + 1));
  };
  const prevStep = () => setStep((s) => Math.max(0, s - 1));

  const handleSizeToggle = (sizeId: string) => {
    setEditedProduct((prev) => {
      if (!prev) return prev;
      const newSizes = prev.sizes.includes(sizeId)
        ? prev.sizes.filter((id) => id !== sizeId)
        : [...prev.sizes, sizeId];
      return { ...prev, sizes: newSizes };
    });
  };

  const handleTempToggle = (tempId: string) => {
    setEditedProduct((prev) => {
      if (!prev) return prev;
      const newTemps = prev.temperatures.includes(tempId)
        ? prev.temperatures.filter((id) => id !== tempId)
        : [...prev.temperatures, tempId];
      return { ...prev, temperatures: newTemps };
    });
  };

  const handleAddIngredient = (ingredientId: string) => {
    if (!selectedRecipeConfigId) return;
    setEditedProduct((prev) => {
      if (!prev) return prev;
      const currentRecipe = prev.recipes[selectedRecipeConfigId] || [];
      if (currentRecipe.some((i) => i.ingredientId === ingredientId))
        return prev;

      const ingredientUnit =
        ingredientsList.find((i) => i.id === ingredientId)?.unit ?? "";
      const newRecipes = {
        ...prev.recipes,
        [selectedRecipeConfigId]: [
          ...currentRecipe,
          { ingredientId, quantity: "1", unit: ingredientUnit },
        ],
      };

      return {
        ...prev,
        recipes: newRecipes,
        hasRecipe: Object.values(newRecipes).some((r) => r.length > 0),
      };
    });
  };

  const handleRemoveIngredient = (ingredientId: string) => {
    if (!selectedRecipeConfigId) return;
    setEditedProduct((prev) => {
      if (!prev) return prev;
      const currentRecipe = prev.recipes[selectedRecipeConfigId] || [];
      const newRecipe = currentRecipe.filter(
        (i) => i.ingredientId !== ingredientId,
      );

      const newRecipes = {
        ...prev.recipes,
        [selectedRecipeConfigId]: newRecipe,
      };

      return {
        ...prev,
        recipes: newRecipes,
        hasRecipe: Object.values(newRecipes).some((r) => r.length > 0),
      };
    });
  };

  const updateIngredient = (
    ingredientId: string,
    field: "quantity" | "unit",
    value: string,
  ) => {
    if (!selectedRecipeConfigId) return;
    setEditedProduct((prev) => {
      if (!prev) return prev;
      const currentRecipe = prev.recipes[selectedRecipeConfigId] || [];
      return {
        ...prev,
        recipes: {
          ...prev.recipes,
          [selectedRecipeConfigId]: currentRecipe.map((i) =>
            i.ingredientId === ingredientId ? { ...i, [field]: value } : i,
          ),
        },
      };
    });
  };

  const filteredIngredients = ingredientsList.filter((i) =>
    i.name.toLowerCase().includes(ingredientSearch.toLowerCase()),
  );

  // Check if we should show recipe step
  const showRecipeStep = editedProduct.type === "Beverage";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] md:max-w-[900px] lg:max-w-[1000px] w-[95vw] p-0 flex flex-col gap-0 max-h-[90vh] overflow-hidden border-gray-200">
          {/* Header */}
          <div className="p-6 pb-5 border-b border-gray-100 bg-white z-10 shrink-0">
            <DialogHeader className="mb-0 p-0">
              <DialogTitle className="text-xl font-bold text-[#3a2b27]">
                {isEditing ? "Edit Product" : "Add Product"}
              </DialogTitle>
            </DialogHeader>

            {/* Stepper */}
            <div className="flex items-center mt-5">
              {steps.map((s, i) => (
                <React.Fragment key={s}>
                  <button
                    onClick={() => {
                      if (i < step) setStep(i);
                    }}
                    className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                      i < step ? "cursor-pointer" : "cursor-default"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        step === i
                          ? "bg-[#C2456A] text-white shadow-md shadow-[#C2456A]/25"
                          : step > i
                            ? "bg-emerald-500 text-white"
                            : "bg-gray-100 text-gray-400 border border-gray-200"
                      }`}
                    >
                      {step > i ? <Check className="w-3.5 h-3.5" /> : i + 1}
                    </div>
                    <span
                      className={`hidden sm:inline ${
                        step === i
                          ? "text-[#C2456A] font-semibold"
                          : step > i
                            ? "text-emerald-600"
                            : "text-gray-400"
                      }`}
                    >
                      {s}
                    </span>
                  </button>
                  {i < steps.length - 1 && (
                    <div
                      className={`h-px flex-1 mx-3 transition-colors ${step > i ? "bg-emerald-300" : "bg-gray-200"}`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
            {/* Step 1: Basic Details */}
            {step === 0 && (
              <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-300">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <Label className="mb-3 block font-semibold text-[#3a2b27]">
                    Product Image
                  </Label>
                  <div
                    className={`border-2 border-dashed border-gray-200 rounded-xl p-10 flex flex-col items-center justify-center gap-3 hover:bg-gray-50 hover:border-[#C2456A]/30 transition-all ${!isUploadingImage ? "cursor-pointer" : "cursor-not-allowed"} group relative overflow-hidden min-h-[200px]`}
                    onClick={() => !isUploadingImage && fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                    />
                    {editedProduct.image ? (
                      <div className="absolute inset-0 w-full h-full">
                        <img
                          src={editedProduct.image}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          {isUploadingImage ? (
                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                          ) : (
                            <span className="text-white text-sm font-semibold flex items-center gap-2">
                              <ImagePlus className="w-4 h-4" /> Change Image
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="p-4 rounded-2xl bg-gray-100 text-gray-400 group-hover:text-[#C2456A] group-hover:bg-[#C2456A]/10 transition-colors">
                          {isUploadingImage ? (
                            <Loader2 className="w-8 h-8 animate-spin" />
                          ) : (
                            <ImagePlus className="w-8 h-8" />
                          )}
                        </div>
                        <div className="text-sm text-center text-gray-500">
                          <span className="text-[#C2456A] font-semibold">
                            {isUploadingImage ? "Uploading..." : "Click to upload"}
                          </span>{" "}
                          {!isUploadingImage && "or drag and drop"}
                        </div>
                        {!isUploadingImage && (
                          <div className="text-xs text-gray-400">
                            PNG, JPG up to 5MB
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label
                        htmlFor="name"
                        className="font-semibold text-[#3a2b27] text-sm"
                      >
                        Product Name <span className="text-[#C2456A]">*</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder="e.g. Spanish Latte"
                        className="h-10 bg-white border-gray-200 focus:border-[#C2456A] focus:ring-[#C2456A]/20"
                        value={editedProduct.name}
                        onChange={(e) =>
                          setEditedProduct({
                            ...editedProduct,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="category"
                        className="font-semibold text-[#3a2b27] text-sm"
                      >
                        Category <span className="text-[#C2456A]">*</span>
                      </Label>
                      <Select
                        value={editedProduct.categoryId}
                        onValueChange={(val) => {
                          if (val)
                            setEditedProduct({
                              ...editedProduct,
                              categoryId: val,
                            });
                        }}
                      >
                        <SelectTrigger
                          id="category"
                          className="h-10 bg-white border-gray-200"
                        >
                          <SelectValue placeholder="Select a category">
                            {editedProduct.categoryId
                              ? categories.find(
                                  (c) => c.id === editedProduct.categoryId,
                                )?.name
                              : "Select a category"}
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
                  </div>

                  <div className="space-y-3">
                    <Label className="font-semibold text-[#3a2b27] text-sm block">
                      Product Type
                    </Label>
                    <RadioGroup
                      value={editedProduct.type}
                      onValueChange={(val) => {
                        const newType = val as ProductType;
                        setEditedProduct({ ...editedProduct, type: newType });
                        // Reset to step 0 when type changes
                        setStep(0);
                      }}
                      className="grid grid-cols-2 gap-3"
                    >
                      <label
                        className={`flex items-center gap-3 border-2 rounded-xl px-4 py-3.5 cursor-pointer transition-all ${
                          editedProduct.type === "Beverage"
                            ? "border-[#C2456A] bg-[#C2456A]/5 shadow-sm shadow-[#C2456A]/10"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <RadioGroupItem value="Beverage" id="type-beverage" />
                        <div>
                          <span className="font-semibold text-sm text-[#3a2b27]">
                            Beverage
                          </span>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Drinks with recipe deduction
                          </p>
                        </div>
                      </label>
                      <label
                        className={`flex items-center gap-3 border-2 rounded-xl px-4 py-3.5 cursor-pointer transition-all ${
                          editedProduct.type === "Pastry"
                            ? "border-[#C2456A] bg-[#C2456A]/5 shadow-sm shadow-[#C2456A]/10"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <RadioGroupItem value="Pastry" id="type-pastry" />
                        <div>
                          <span className="font-semibold text-sm text-[#3a2b27]">
                            Pastry
                          </span>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Baked goods, no recipe needed
                          </p>
                        </div>
                      </label>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="description"
                      className="font-semibold text-[#3a2b27] text-sm"
                    >
                      Description{" "}
                      <span className="text-gray-400 font-normal">
                        (Optional)
                      </span>
                    </Label>
                    <textarea
                      id="description"
                      className="flex min-h-[80px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C2456A]/20 focus:border-[#C2456A] transition-colors"
                      placeholder="Brief description for internal reference"
                      value={editedProduct.description || ""}
                      onChange={(e) =>
                        setEditedProduct({
                          ...editedProduct,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Variants (Beverage only) */}
            {step === 1 && editedProduct?.type === "Beverage" && (
              <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-300">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-semibold text-[#3a2b27] text-lg">
                      Available Sizes
                    </h3>
                    <p className="text-sm text-gray-400 mt-0.5">
                      Select the sizes this product can be served in.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {sizes.map((size) => {
                      const isActive = editedProduct.sizes.includes(size.id);
                      return (
                        <div
                          key={size.id}
                          className={`flex items-center gap-3 border-2 rounded-xl p-4 cursor-pointer transition-all ${
                            isActive
                              ? "border-[#C2456A] bg-[#C2456A]/5 shadow-sm shadow-[#C2456A]/10"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                          onClick={() => handleSizeToggle(size.id)}
                        >
                          <Checkbox
                            id={`size-${size.id}`}
                            checked={isActive}
                            onCheckedChange={() => handleSizeToggle(size.id)}
                          />
                          <Label
                            htmlFor={`size-${size.id}`}
                            className="flex-1 cursor-pointer font-semibold text-sm"
                          >
                            {size.name}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-semibold text-[#3a2b27] text-lg">
                      Temperature Options
                    </h3>
                    <p className="text-sm text-gray-400 mt-0.5">
                      Select the temperature options available for this product.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {temperatures.map((temp) => {
                      const isActive = editedProduct.temperatures.includes(
                        temp.id,
                      );
                      return (
                        <div
                          key={temp.id}
                          className={`flex items-center gap-3 border-2 rounded-xl p-4 cursor-pointer transition-all ${
                            isActive
                              ? "border-[#C2456A] bg-[#C2456A]/5 shadow-sm shadow-[#C2456A]/10"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                          onClick={() => handleTempToggle(temp.id)}
                        >
                          <Checkbox
                            id={`temp-${temp.id}`}
                            checked={isActive}
                            onCheckedChange={() => handleTempToggle(temp.id)}
                          />
                          <Label
                            htmlFor={`temp-${temp.id}`}
                            className="flex-1 cursor-pointer font-semibold text-sm"
                          >
                            {temp.name}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Pricing (Pastry) or Step 3: Pricing (Beverage) */}
            {((step === 1 && editedProduct?.type === "Pastry") ||
              (step === 2 && editedProduct?.type === "Beverage")) && (
              <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-300">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-semibold text-[#3a2b27] text-lg">
                      Pricing Configuration
                    </h3>
                    <p className="text-sm text-gray-400 mt-0.5">
                      Assign a selling price to each variant combination.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {variantCombinations.map((combo) => {
                      const hasError = pricingErrors.includes(combo.id);
                      return (
                        <div key={combo.id} className="flex items-center gap-4">
                          <Label className="w-1/2 font-medium text-sm text-[#3a2b27]">
                            {combo.name}
                          </Label>
                          <div className="relative w-1/2">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">
                              ₱
                            </span>
                            <Input
                              type="number"
                              placeholder="0.00"
                              className={`pl-7 h-10 ${hasError ? "border-red-500 focus:ring-red-500/20" : "border-gray-200 focus:border-[#C2456A] focus:ring-[#C2456A]/20"}`}
                              value={editedProduct.prices?.[combo.id] ?? ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditedProduct((prev) => {
                                  if (!prev) return prev;
                                  const newPrices = { ...prev.prices };
                                  if (val === "") {
                                    delete newPrices[combo.id];
                                  } else {
                                    newPrices[combo.id] = parseFloat(val);
                                  }
                                  return { ...prev, prices: newPrices };
                                });
                                setPricingErrors((prev) =>
                                  prev.filter((id) => id !== combo.id),
                                );
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {pricingErrors.length > 0 && (
                      <div className="text-red-500 text-sm font-medium mt-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                        Please enter a valid price for all combinations.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Recipe (Beverage only) — shows only priced combos */}
            {step === 3 && editedProduct?.type === "Beverage" && (
              <div className="space-y-4 animate-in fade-in duration-300 flex flex-col h-full min-h-[420px]">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-semibold text-[#3a2b27] text-lg">
                      Recipe Configuration
                    </h3>
                    <p className="text-sm text-gray-400 mt-0.5">
                      Define the ingredients for each priced variant.
                    </p>
                  </div>

                  {/* Variant tabs */}
                  {pricedVariantCombinations.length > 0 ? (
                    <>
                      <div className="relative">
                        <div
                          ref={scrollContainerRef}
                          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
                          onScroll={checkScroll}
                        >
                          {pricedVariantCombinations.map((combo) => {
                            const isActive =
                              selectedRecipeConfigId === combo.id;
                            return (
                              <button
                                key={combo.id}
                                onClick={() =>
                                  setSelectedRecipeConfigId(combo.id)
                                }
                                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                                  isActive
                                    ? "bg-[#C2456A] text-white shadow-md shadow-[#C2456A]/25"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                              >
                                {combo.name}
                              </button>
                            );
                          })}
                        </div>
                        {canScrollLeft && (
                          <button
                            onClick={() => scrollCombos("left")}
                            className="absolute left-0 top-1/2 -translate-y-1/2 bg-white shadow-md rounded-full p-1.5 border border-gray-200 hover:bg-gray-50"
                          >
                            <ChevronLeft className="w-4 h-4 text-gray-600" />
                          </button>
                        )}
                        {canScrollRight && (
                          <button
                            onClick={() => scrollCombos("right")}
                            className="absolute right-0 top-1/2 -translate-y-1/2 bg-white shadow-md rounded-full p-1.5 border border-gray-200 hover:bg-gray-50"
                          >
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                          </button>
                        )}
                      </div>

                      {/* Ingredients for selected variant - Flex row layout */}
                      {selectedRecipeConfigId && (
                        <div className="flex gap-6">
                          {/* Left side - Available ingredients */}
                          <div className="flex-1 space-y-2">
                            <Label className="font-semibold text-[#3a2b27] text-sm">
                              Available Ingredients
                            </Label>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <Input
                                placeholder="Search ingredients..."
                                className="pl-9 h-10 bg-white border-gray-200 focus:border-[#C2456A] focus:ring-[#C2456A]/20"
                                value={ingredientSearch}
                                onChange={(e) =>
                                  setIngredientSearch(e.target.value)
                                }
                              />
                            </div>
                            <div className="max-h-64 overflow-y-auto space-y-1 border border-gray-200 rounded-lg p-2">
                              {filteredIngredients.length > 0 ? (
                                filteredIngredients.map((ingredient) => {
                                  const isAdded = (
                                    editedProduct.recipes[
                                      selectedRecipeConfigId
                                    ] || []
                                  ).some(
                                    (i) => i.ingredientId === ingredient.id,
                                  );
                                  return (
                                    <div
                                      key={ingredient.id}
                                      className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                                        isAdded
                                          ? "bg-gray-50 opacity-60"
                                          : "hover:bg-gray-50 cursor-pointer"
                                      }`}
                                      onClick={() =>
                                        !isAdded &&
                                        handleAddIngredient(ingredient.id)
                                      }
                                    >
                                      <div>
                                        <span className="text-sm font-medium text-[#3a2b27]">
                                          {ingredient.name}
                                        </span>
                                        <span className="text-xs text-gray-400 ml-2">
                                          {ingredient.unit}
                                        </span>
                                      </div>
                                      {isAdded ? (
                                        <Check className="w-4 h-4 text-emerald-500" />
                                      ) : (
                                        <Plus className="w-4 h-4 text-gray-400 hover:text-[#C2456A]" />
                                      )}
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-center py-4 text-gray-400 text-sm">
                                  No ingredients found
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right side - Selected ingredients */}
                          <div className="flex-1 space-y-2">
                            <Label className="font-semibold text-[#3a2b27] text-sm">
                              Selected Ingredients
                            </Label>
                            {(
                              editedProduct.recipes[selectedRecipeConfigId] ||
                              []
                            ).length > 0 ? (
                              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                {editedProduct.recipes[
                                  selectedRecipeConfigId
                                ].map((item) => {
                                  const ingredient = ingredientsList.find(
                                    (i) => i.id === item.ingredientId,
                                  );
                                  if (!ingredient) return null;
                                  return (
                                    <div
                                      key={item.ingredientId}
                                      className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200"
                                    >
                                      <div className="flex-1">
                                        <span className="font-medium text-[#3a2b27] text-sm">
                                          {ingredient.name}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Input
                                          type="text"
                                          className="w-20 h-8 text-sm border-gray-200"
                                          value={item.quantity}
                                          onChange={(e) =>
                                            updateIngredient(
                                              item.ingredientId,
                                              "quantity",
                                              e.target.value,
                                            )
                                          }
                                        />
                                        <Select
                                          value={item.unit}
                                          onValueChange={(val) =>
                                            updateIngredient(
                                              item.ingredientId,
                                              "unit",
                                              val || "",
                                            )
                                          }
                                        >
                                          <SelectTrigger className="w-24 h-8 text-sm border-gray-200">
                                            <SelectValue />
                                          </SelectTrigger>
                                        </Select>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                          onClick={() =>
                                            handleRemoveIngredient(
                                              item.ingredientId,
                                            )
                                          }
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg h-48 flex items-center justify-center">
                                <div>
                                  <p className="text-sm">
                                    No ingredients selected
                                  </p>
                                  <p className="text-xs mt-1">
                                    Click on ingredients from the left to add
                                    them
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <p className="font-medium">
                        No priced variants available
                      </p>
                      <p className="text-sm mt-1">
                        Please go back to the Pricing step and set prices for at
                        least one variant.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Summary step — Pastry: step 2, Beverage: step 4 */}
            {((step === 2 && editedProduct?.type === "Pastry") ||
              (step === 4 && editedProduct?.type === "Beverage")) && (
              <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-300">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-[#3a2b27] mb-5">
                    Product Summary
                  </h3>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                          Name
                        </span>
                        <span className="font-semibold text-[#3a2b27]">
                          {editedProduct.name || "—"}
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                          Category
                        </span>
                        <span className="font-semibold text-[#3a2b27]">
                          {categories.find(
                            (c) => c.id === editedProduct.categoryId,
                          )?.name || "—"}
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                          Type
                        </span>
                        <span
                          className={`inline-flex items-center font-semibold text-sm px-2.5 py-0.5 rounded-full ${
                            editedProduct.type === "Beverage"
                              ? "bg-blue-50 text-blue-600"
                              : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {editedProduct.type}
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 col-span-2 sm:col-span-1">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                          Pricing
                        </span>
                        <div className="space-y-1.5">
                          {variantCombinations.map((combo) => {
                            const price = editedProduct.prices?.[combo.id];
                            return (
                              <div
                                key={combo.id}
                                className="flex flex-col xl:flex-row xl:items-center justify-between text-sm gap-1"
                              >
                                <span className="font-medium text-[#3a2b27]">
                                  {combo.name}
                                </span>
                                <span className="font-semibold text-gray-700">
                                  {price !== undefined &&
                                  price !== null &&
                                  !isNaN(price)
                                    ? `₱${price}`
                                    : "—"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {showRecipeStep && (
                        <div className="bg-gray-50 rounded-lg p-4 col-span-2 sm:col-span-1">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                            Recipe Status
                          </span>
                          {pricedVariantCombinations.length === 0 ? (
                            <span className="font-semibold text-gray-400 text-sm">
                              No priced variants
                            </span>
                          ) : (
                            <div className="space-y-1.5">
                              {pricedVariantCombinations.map((combo) => {
                                const hasRecipe =
                                  (editedProduct.recipes[combo.id] || [])
                                    .length > 0;
                                return (
                                  <div
                                    key={combo.id}
                                    className="flex flex-col xl:flex-row xl:items-center justify-between text-sm gap-1"
                                  >
                                    <span className="font-medium text-[#3a2b27]">
                                      {combo.name}
                                    </span>
                                    <span
                                      className={`font-semibold text-xs ${hasRecipe ? "text-emerald-600" : "text-gray-400"}`}
                                    >
                                      {hasRecipe
                                        ? "Configured"
                                        : "Not configured"}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {(editedProduct.sizes.length > 0 ||
                      editedProduct.temperatures.length > 0) && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                          Variants
                        </span>
                        <div className="flex gap-2 flex-wrap">
                          {editedProduct.sizes.map((id) => {
                            const s = sizes.find((s) => s.id === id);
                            return s ? (
                              <span
                                key={id}
                                className="text-xs font-medium bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-[#3a2b27]"
                              >
                                {s.name}
                              </span>
                            ) : null;
                          })}
                          {editedProduct.temperatures.map((id) => {
                            const t = temperatures.find((t) => t.id === id);
                            return t ? (
                              <span
                                key={id}
                                className={`text-xs font-medium px-2.5 py-1 rounded-lg ${
                                  t.name === "Hot"
                                    ? "bg-red-50 text-red-500 border border-red-100"
                                    : t.name === "Cold"
                                      ? "bg-sky-50 text-sky-500 border border-sky-100"
                                      : "bg-white border border-gray-200 text-[#3a2b27]"
                                }`}
                              >
                                {t.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border-2 border-[#C2456A]/15 p-5 shadow-sm flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-bold text-[#3a2b27]">
                      Available in POS
                    </Label>
                    <p className="text-sm text-gray-400">
                      Toggle off to hide from the mobile app catalog.
                    </p>
                  </div>
                  <Switch
                    checked={editedProduct.isVisible}
                    onCheckedChange={(checked) =>
                      setEditedProduct({ ...editedProduct, isVisible: checked })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-white z-10 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isEditing && (
                <Button
                  variant="ghost"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => setShowArchiveConfirm(true)}
                >
                  <Archive className="w-4 h-4 mr-1" /> Archive
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {step > 0 ? (
                <Button
                  variant="ghost"
                  onClick={prevStep}
                  className="text-gray-500 hover:text-[#3a2b27]"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="text-gray-500 hover:text-[#3a2b27]"
                >
                  Cancel
                </Button>
              )}

              {step < steps.length - 1 ? (
                <Button
                  onClick={nextStep}
                  className="bg-[#C2456A] hover:bg-[#a33858] text-white shadow-sm px-6"
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    onSave(editedProduct);
                    onOpenChange(false);
                  }}
                  className="bg-[#C2456A] hover:bg-[#a33858] text-white shadow-sm px-6"
                >
                  <Check className="w-4 h-4 mr-1" /> Save Product
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isEditing && (
        <Dialog open={showArchiveConfirm} onOpenChange={setShowArchiveConfirm}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-red-600">
                Archive Product
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-2">
                This will remove the product from the active catalog. Existing
                sales history and recipes will be preserved.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setShowArchiveConfirm(false)}
                className="bg-white"
              >
                Cancel
              </Button>
              <Button
                className="bg-red-500 hover:bg-red-600 text-white"
                onClick={() => {
                  if (editedProduct) {
                    onArchive?.(editedProduct.id);
                  }
                  setShowArchiveConfirm(false);
                  onOpenChange(false);
                }}
              >
                Archive
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
