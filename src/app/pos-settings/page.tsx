"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Settings2,
  PackageOpen,
  ShoppingBag,
  Filter,
  Check,
} from "lucide-react";
import { ProductCard } from "./components/ProductCard";
import { ProductModal } from "./components/ProductModal";
import { MoreSettingsModal } from "./components/MoreSettingsModal";
import { Product, Category, Ingredient } from "./types";
import { createClient } from "@/app/lib/supabase/client";
import { toast } from "sonner";
import {
  initialPaymentMethods,
  initialSizes,
  initialTemperatures,
} from "./data";

export default function POSSettingsPage() {
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState(initialPaymentMethods);
  const [sizes, setSizes] = useState(initialSizes);
  const [temperatures, setTemperatures] = useState(initialTemperatures);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const fetchAllData = async () => {
      try {
        const [
          productsRes,
          categoriesRes,
          paymentRes,
          sizesRes,
          tempsRes,
          ingredientsRes,
          variantsRes,
          recipesRes,
        ] = await Promise.all([
          supabase.from("products").select("*"),
          supabase.from("product_categories").select("id, name").order("name"),
          supabase
            .from("payment_methods")
            .select("id, name, is_enabled")
            .order("name"),
          supabase
            .from("sizes")
            .select("id, name, sort_order")
            .order("sort_order"),
          supabase
            .from("temperatures")
            .select("id, name, sort_order")
            .order("sort_order"),
          supabase
            .from("inventory_items")
            .select("id, name, unit")
            .order("name"),
          supabase
            .from("product_variants")
            .select("id, product_id, size_id, temperature_id, price"),
          supabase
            .from("product_recipes")
            .select(
              "id, product_id, variant_id, inventory_item_id, quantity, unit",
            ),
        ]);

        if (productsRes.error) {
          alert("Failed to load products: " + productsRes.error.message);
        }

        if (categoriesRes.data) {
          setCategories(
            categoriesRes.data.map((cat: any) => ({
              id: cat.id,
              name: cat.name,
            })),
          );
        }

        if (paymentRes.data) {
          setPaymentMethods(
            paymentRes.data.map((pm: any) => ({
              id: pm.id,
              name: pm.name,
              isEnabled: pm.is_enabled,
            })),
          );
        }

        if (sizesRes.data) {
          setSizes(
            sizesRes.data.map((size: any) => ({
              id: size.id,
              name: size.name,
            })),
          );
        }

        if (tempsRes.data) {
          setTemperatures(
            tempsRes.data.map((temp: any) => ({
              id: temp.id,
              name: temp.name,
            })),
          );
        }

        if (ingredientsRes.data) {
          setIngredients(
            ingredientsRes.data.map((item: any) => ({
              id: item.id,
              name: item.name,
              unit: item.unit,
            })),
          );
        }

        // Build product data with variants and recipes
        if (productsRes.data && !productsRes.error) {
          const variants = variantsRes.data || [];
          const recipes = recipesRes.data || [];

          const productsWithRelations = productsRes.data.map((row: any) => {
            // Get variants for this product
            const productVariants = variants.filter(
              (v: any) => v.product_id === row.id,
            );

            // Extract sizes and temperatures from variants
            const productSizes: string[] = [];
            const productTemps: string[] = [];
            const prices: Record<string, number> = {};

            productVariants.forEach((variant: any) => {
              // Build combo key
              const sizeKey = variant.size_id || "null";
              const tempKey = variant.temperature_id || "null";
              const comboKey = `${sizeKey}_${tempKey}`;

              // Track unique sizes and temperatures
              if (variant.size_id && !productSizes.includes(variant.size_id)) {
                productSizes.push(variant.size_id);
              }
              if (
                variant.temperature_id &&
                !productTemps.includes(variant.temperature_id)
              ) {
                productTemps.push(variant.temperature_id);
              }

              // Store price by combo key
              prices[comboKey] = variant.price;
            });

            // Build recipes grouped by variant combo
            const productRecipes: Record<
              string,
              Array<{ ingredientId: string; quantity: string; unit: string }>
            > = {};

            productVariants.forEach((variant: any) => {
              const sizeKey = variant.size_id || "null";
              const tempKey = variant.temperature_id || "null";
              const comboKey = `${sizeKey}_${tempKey}`;

              // Find recipes for this variant
              const variantRecipes = recipes.filter(
                (r: any) => r.variant_id === variant.id,
              );

              if (variantRecipes.length > 0) {
                productRecipes[comboKey] = variantRecipes.map((r: any) => ({
                  ingredientId: r.inventory_item_id,
                  quantity: String(r.quantity),
                  unit: r.unit || "",
                }));
              }
            });

            return {
              id: row.id,
              name: row.name,
              categoryId: row.category_id,
              type: row.type,
              image: row.image_url ?? undefined,
              description: row.description ?? undefined,
              hasRecipe: row.has_recipe,
              isVisible: row.is_visible,
              sizes: productSizes,
              temperatures: productTemps,
              prices: prices,
              recipes: productRecipes,
            };
          });

          setProducts(productsWithRelations);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");

  // UI State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Derived State (Filtering)
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategoryId === "all" ||
        product.categoryId === selectedCategoryId;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategoryId]);

  // Count per category
  const productCount = products.length;
  const categoryCount = categories.length;

  // Handlers
  const handleProductSave = async (savedProduct: Product) => {
    const supabase = createClient();
    const isEdit = products.some((p) => p.id === savedProduct.id);

    // ── 1. INSERT or UPDATE `products` ──────────────────────────────────────
    let productId: string;

    if (isEdit) {
      const { error } = await supabase
        .from("products")
        .update({
          name: savedProduct.name,
          category_id: savedProduct.categoryId,
          type: savedProduct.type,
          description: savedProduct.description ?? null,
          image_url: savedProduct.image ?? null,
          has_recipe: savedProduct.hasRecipe,
          is_visible: savedProduct.isVisible,
        })
        .eq("id", savedProduct.id);

      if (error) {
        alert("Failed to save product: " + error.message);
        return;
      }
      productId = savedProduct.id;
    } else {
      const { data, error } = await supabase
        .from("products")
        .insert({
          name: savedProduct.name,
          category_id: savedProduct.categoryId,
          type: savedProduct.type,
          description: savedProduct.description ?? null,
          image_url: savedProduct.image ?? null,
          has_recipe: savedProduct.hasRecipe,
          is_visible: savedProduct.isVisible,
        })
        .select("id")
        .single();

      if (error || !data) {
        alert(
          "Failed to save product: " + (error?.message ?? "No data returned"),
        );
        return;
      }
      productId = data.id;
    }

    // ── 2. Sync `product_variants` (delete-then-insert) ──────────────────────
    // First, delete all existing variants for this product
    const { error: deleteVariantsError } = await supabase
      .from("product_variants")
      .delete()
      .eq("product_id", productId);

    if (deleteVariantsError) {
      alert("Failed to sync variants: " + deleteVariantsError.message);
      return;
    }

    // Build variant rows from the selected sizes and temperatures
    // Each combination of size and temperature gets its own variant
    const variantRows: Array<{
      product_id: string;
      size_id: string | null;
      temperature_id: string | null;
      price: number;
    }> = [];

    const {
      sizes: selectedSizes,
      temperatures: selectedTemps,
      prices,
    } = savedProduct;

    // If both sizes and temperatures are selected, create combinations
    if (selectedSizes.length > 0 && selectedTemps.length > 0) {
      for (const sizeId of selectedSizes) {
        for (const tempId of selectedTemps) {
          const comboId = `${sizeId}_${tempId}`;
          const price = prices[comboId] ?? 0;
          variantRows.push({
            product_id: productId,
            size_id: sizeId,
            temperature_id: tempId,
            price,
          });
        }
      }
    }
    // If only sizes are selected (no temperatures)
    else if (selectedSizes.length > 0) {
      for (const sizeId of selectedSizes) {
        const price = prices[sizeId] ?? 0;
        variantRows.push({
          product_id: productId,
          size_id: sizeId,
          temperature_id: null,
          price,
        });
      }
    }
    // If only temperatures are selected (no sizes)
    else if (selectedTemps.length > 0) {
      for (const tempId of selectedTemps) {
        const price = prices[tempId] ?? 0;
        variantRows.push({
          product_id: productId,
          size_id: null,
          temperature_id: tempId,
          price,
        });
      }
    }
    // If neither sizes nor temperatures are selected, create a single default variant
    else {
      variantRows.push({
        product_id: productId,
        size_id: null,
        temperature_id: null,
        price: Object.values(prices)[0] ?? 0,
      });
    }

    // Insert the new variants and get their IDs
    if (variantRows.length === 0) {
      alert("No variants to save");
      return;
    }

    const { data: insertedVariants, error: insertVariantsError } =
      await supabase
        .from("product_variants")
        .insert(variantRows)
        .select("id, size_id, temperature_id");

    if (insertVariantsError || !insertedVariants) {
      alert(
        "Failed to save variants: " +
          (insertVariantsError?.message ?? "No data returned"),
      );
      return;
    }

    // ── 3. Build variant mapping for recipes ──────────────────────────────
    // Create a map: comboKey -> variantId
    // comboKey format: `${sizeId || 'null'}_${temperatureId || 'null'}`
    const variantMap = new Map<string, string>();

    insertedVariants.forEach((variant: any) => {
      const key = `${variant.size_id || "null"}_${variant.temperature_id || "null"}`;
      variantMap.set(key, variant.id);
    });

    // ── 4. Sync `product_recipes` using variant IDs ──────────────────────
    // Delete all existing recipes for this product
    const { error: deleteRecipesError } = await supabase
      .from("product_recipes")
      .delete()
      .eq("product_id", productId);

    if (deleteRecipesError) {
      alert("Failed to sync recipes: " + deleteRecipesError.message);
      return;
    }

    // Build recipe rows with variant_id
    // Now that variant_id is NOT NULL, every recipe must be linked to a variant
    const recipeRows: Array<{
      product_id: string;
      variant_id: string;
      inventory_item_id: string;
      quantity: number;
      unit: string;
    }> = [];

    // Iterate through all recipe entries from the UI
    // recipes is structured as: { [comboKey]: Array<{ingredientId, quantity, unit}> }
    const recipeEntries = Object.entries(savedProduct.recipes);

    for (const [comboKey, ingredients] of recipeEntries) {
      // Find the matching variant ID for this combo
      const variantId = variantMap.get(comboKey);

      if (!variantId) {
        // This shouldn't happen if the UI is consistent, but log a warning
        console.warn(`No variant found for combo: ${comboKey}`);
        continue;
      }

      // Add each ingredient for this variant
      for (const ingredient of ingredients) {
        const quantity = parseFloat(ingredient.quantity) || 0;

        // Only add if quantity is greater than 0 (optional optimization)
        if (quantity > 0) {
          recipeRows.push({
            product_id: productId,
            variant_id: variantId,
            inventory_item_id: ingredient.ingredientId,
            quantity: quantity,
            unit: ingredient.unit || "",
          });
        }
      }
    }

    // Insert all recipe rows
    if (recipeRows.length > 0) {
      const { error: insertRecipesError } = await supabase
        .from("product_recipes")
        .insert(recipeRows);

      if (insertRecipesError) {
        alert("Failed to save recipes: " + insertRecipesError.message);
        return;
      }
    }

    // ── 5. Update local state only after all DB writes succeed ───────────────
    const finalProduct: Product = {
      ...savedProduct,
      id: productId,
    };

    setProducts((prev) => {
      if (isEdit) {
        return prev.map((p) => (p.id === productId ? finalProduct : p));
      }
      return [...prev, finalProduct];
    });

    // Optional: Log success
    console.log(`Product ${isEdit ? "updated" : "created"} successfully:`, {
      productId,
      variantCount: insertedVariants.length,
      recipeCount: recipeRows.length,
    });
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleProductDelete = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    toast.success("Successfully Deleted", {
      description: "The product has been successfully removed from your catalog.",
    });
  };

  return (
    <div className="flex flex-col flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
      {loading ? (
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <p className="text-muted-foreground text-sm">Loading products...</p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-6 border-b border-[#C2456A]/10">
              <div>
                <p className="text-xs font-medium text-[#C2456A] uppercase tracking-widest mb-1">
                  Product Management
                </p>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  POS Settings
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage products, recipes, categories, payment methods, and POS
                  configurations.
                </p>
              </div>

              <Button
                variant="outline"
                className="shrink-0 bg-background self-start sm:self-auto"
                onClick={() => setIsSettingsModalOpen(true)}
              >
                <Settings2 className="w-4 h-4 mr-2" />
                More Settings
              </Button>
            </div>

            {/* Stats + Actions Row */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              {/* Quick stats */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="bg-[#C2456A]/10 p-1.5 rounded-md">
                    <ShoppingBag className="h-4 w-4 text-[#C2456A]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold tracking-tight leading-none">
                      {productCount}
                    </p>
                    <p className="text-xs text-muted-foreground">Products</p>
                  </div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="flex items-center gap-2">
                  <div className="bg-[#e08a4f]/10 p-1.5 rounded-md">
                    <Filter className="h-4 w-4 text-[#e08a4f]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold tracking-tight leading-none">
                      {categoryCount}
                    </p>
                    <p className="text-xs text-muted-foreground">Categories</p>
                  </div>
                </div>
              </div>

              {/* Search, filter, and CTA */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                <div className="relative flex-1 sm:flex-none sm:w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search products..."
                    className="pl-9 h-9 text-sm bg-white border-gray-200 focus:border-[#C2456A] focus:ring-[#C2456A]/20"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <Select
                  value={selectedCategoryId}
                  onValueChange={(val) => setSelectedCategoryId(val ?? "all")}
                >
                  <SelectTrigger className="w-full sm:w-44 h-9 text-sm bg-white border-gray-200">
                    <SelectValue placeholder="All Categories">
                      {selectedCategoryId === "all"
                        ? "All Categories"
                        : categories.find((c) => c.id === selectedCategoryId)
                            ?.name || "All Categories"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  className="h-9 px-5 bg-[#C2456A] hover:bg-[#a33858] text-white shadow-sm"
                  onClick={handleAddProduct}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </div>
            </div>
          </div>

          {/* Category filter pills */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setSelectedCategoryId("all")}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedCategoryId === "all"
                  ? "bg-[#C2456A] text-white shadow-sm"
                  : "bg-white text-muted-foreground hover:text-foreground border border-gray-200 hover:border-gray-300"
              }`}
            >
              All Products
              <span className="ml-1.5 opacity-70">{products.length}</span>
            </button>
            {categories.map((cat) => {
              const count = products.filter(
                (p) => p.categoryId === cat.id,
              ).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedCategoryId === cat.id
                      ? "bg-[#C2456A] text-white shadow-sm"
                      : "bg-white text-muted-foreground hover:text-foreground border border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {cat.name}
                  <span className="ml-1.5 opacity-70">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 pb-10">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    category={categories.find(
                      (c) => c.id === product.categoryId,
                    )}
                    sizes={sizes}
                    temperatures={temperatures}
                    onClick={handleEditProduct}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] border-2 border-dashed border-gray-200 rounded-2xl bg-white">
                <div className="p-5 bg-[#C2456A]/10 rounded-2xl mb-5">
                  <PackageOpen className="w-10 h-10 text-[#C2456A]" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-1">
                  No products found
                </h3>
                <p className="text-muted-foreground text-sm mb-6 text-center max-w-sm">
                  {products.length === 0
                    ? "Create your first menu item to start selling through the POS."
                    : "No products match your search and filter criteria."}
                </p>
                {products.length === 0 && (
                  <Button
                    onClick={handleAddProduct}
                    className="bg-[#C2456A] hover:bg-[#a33858] text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Modals */}
          <ProductModal
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            product={selectedProduct}
            categories={categories}
            sizes={sizes}
            temperatures={temperatures}
            ingredientsList={ingredients}
            onSave={handleProductSave}
            onDelete={handleProductDelete}
          />

          <MoreSettingsModal
            open={isSettingsModalOpen}
            onOpenChange={setIsSettingsModalOpen}
            categories={categories}
            setCategories={setCategories}
            paymentMethods={paymentMethods}
            setPaymentMethods={setPaymentMethods}
            sizes={sizes}
            setSizes={setSizes}
            temperatures={temperatures}
            setTemperatures={setTemperatures}
          />
        </>
      )}
    </div>
  );
}
