'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Plus, Search, Settings2, PackageOpen, ShoppingBag, Filter } from 'lucide-react';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { MoreSettingsModal } from './components/MoreSettingsModal';
import { Product, Category } from './types';
import { createClient } from '@/app/lib/supabase/client';
import {
  initialPaymentMethods,
  initialSizes,
  initialTemperatures,
  initialIngredients
} from './data';

export default function POSSettingsPage() {
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState(initialPaymentMethods);
  const [sizes, setSizes] = useState(initialSizes);
  const [temperatures, setTemperatures] = useState(initialTemperatures);
  const [ingredients] = useState(initialIngredients);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const fetchAllData = async () => {
      try {
        const [productsRes, categoriesRes, paymentRes, sizesRes, tempsRes] =
          await Promise.all([
            supabase.from("products").select("*"),
            supabase.from("product_categories").select("id, name").order("name"),
            supabase
              .from("payment_methods")
              .select("id, name, is_enabled")
              .order("name"),
            supabase.from("sizes").select("id, name, sort_order").order("sort_order"),
            supabase
              .from("temperatures")
              .select("id, name, sort_order")
              .order("sort_order"),
          ]);

        if (productsRes.error) {
          alert("Failed to load products: " + productsRes.error.message);
        } else if (productsRes.data) {
          setProducts(
            productsRes.data.map((row: any) => ({
              id: row.id,
              name: row.name,
              categoryId: row.category_id,
              type: row.type,
              image: row.image_url ?? undefined,
              description: row.description ?? undefined,
              hasRecipe: row.has_recipe,
              isVisible: row.is_visible,
              sizes: [],
              temperatures: [],
              ingredients: [],
            }))
          );
        }

        if (categoriesRes.data) {
          setCategories(
            categoriesRes.data.map((cat: any) => ({
              id: cat.id,
              name: cat.name,
            }))
          );
        }

        if (paymentRes.data) {
          setPaymentMethods(
            paymentRes.data.map((pm: any) => ({
              id: pm.id,
              name: pm.name,
              isEnabled: pm.is_enabled,
            }))
          );
        }

        if (sizesRes.data) {
          setSizes(
            sizesRes.data.map((size: any) => ({
              id: size.id,
              name: size.name,
            }))
          );
        }

        if (tempsRes.data) {
          setTemperatures(
            tempsRes.data.map((temp: any) => ({
              id: temp.id,
              name: temp.name,
            }))
          );
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  // UI State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Derived State (Filtering)
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategoryId === 'all' || product.categoryId === selectedCategoryId;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategoryId]);

  // Count per category
  const productCount = products.length;
  const categoryCount = categories.length;

  // Handlers
  const handleProductSave = (savedProduct: Product) => {
    setProducts(prev => {
      const exists = prev.find(p => p.id === savedProduct.id);
      if (exists) {
        return prev.map(p => p.id === savedProduct.id ? savedProduct : p);
      }
      return [...prev, savedProduct];
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
              Manage products, recipes, categories, payment methods, and POS configurations.
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
                <p className="text-2xl font-bold tracking-tight leading-none">{productCount}</p>
                <p className="text-xs text-muted-foreground">Products</p>
              </div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="bg-[#e08a4f]/10 p-1.5 rounded-md">
                <Filter className="h-4 w-4 text-[#e08a4f]" />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight leading-none">{categoryCount}</p>
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
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={selectedCategoryId} onValueChange={(val) => setSelectedCategoryId(val ?? 'all')}>
              <SelectTrigger className="w-full sm:w-44 h-9 text-sm bg-white border-gray-200">
                <SelectValue placeholder="All Categories">
                  {selectedCategoryId === 'all' 
                    ? 'All Categories' 
                    : categories.find(c => c.id === selectedCategoryId)?.name || 'All Categories'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
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
          onClick={() => setSelectedCategoryId('all')}
          className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
            selectedCategoryId === 'all'
              ? 'bg-[#C2456A] text-white shadow-sm'
              : 'bg-white text-muted-foreground hover:text-foreground border border-gray-200 hover:border-gray-300'
          }`}
        >
          All Products
          <span className="ml-1.5 opacity-70">{products.length}</span>
        </button>
        {categories.map(cat => {
          const count = products.filter(p => p.categoryId === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedCategoryId === cat.id
                  ? 'bg-[#C2456A] text-white shadow-sm'
                  : 'bg-white text-muted-foreground hover:text-foreground border border-gray-200 hover:border-gray-300'
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
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id}
                product={product}
                category={categories.find(c => c.id === product.categoryId)}
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
            <h3 className="text-xl font-bold text-foreground mb-1">No products found</h3>
            <p className="text-muted-foreground text-sm mb-6 text-center max-w-sm">
              {products.length === 0 
                ? "Create your first menu item to start selling through the POS." 
                : "No products match your search and filter criteria."}
            </p>
            {products.length === 0 && (
              <Button onClick={handleAddProduct} className="bg-[#C2456A] hover:bg-[#a33858] text-white">
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