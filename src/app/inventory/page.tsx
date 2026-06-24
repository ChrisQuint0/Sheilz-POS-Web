"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  initialTransactions,
  InventoryItem,
  Category,
  Unit,
  InventoryTransaction,
  getInventoryStatus
} from './data';
import { createClient } from '@/app/lib/supabase/client';
import { InventoryCard } from './components/inventory-card';
import { IngredientModal } from './components/ingredient-modal';
import { ReplenishModal } from './components/replenish-modal';
import { SettingsModal } from './components/settings-modal';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  PackageOpen, Search, Settings2, Plus, ClipboardList, Download, 
  ArrowLeft, ChevronRight, Package, AlertTriangle, Filter
} from 'lucide-react';

export default function InventoryPage() {
  // State
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>(initialTransactions);

  // View state
  const [currentView, setCurrentView] = useState<'inventory' | 'transactions'>('inventory');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  
  const [replenishModalOpen, setReplenishModalOpen] = useState(false);
  const [replenishItem, setReplenishItem] = useState<InventoryItem | null>(null);
  
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Fetch inventory items, categories, and units from Supabase
  useEffect(() => {
    const supabase = createClient();

    // Fetch inventory items
    supabase
      .from('inventory_items')
      .select('*')
      .then(({ data, error }) => {
        console.log('Successfully fetched the table data', 'error:', error);
        if (!error && data) {
          const mapped: InventoryItem[] = data.map((row) => ({
            id: row.id,
            name: row.name,
            categoryId: row.category_id,
            unit: row.unit,
            currentStock: row.current_stock,
            maxCapacity: row.max_capacity,
            lowStockThreshold: row.low_stock_threshold,
            imageUrl: row.image_url,
            notes: row.notes,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }));
          setItems(mapped);
        }
        setLoading(false);
      });

    // Fetch categories
    supabase
      .from('inventory_categories')
      .select('id, name')
      .order('name')
      .then(({ data, error }) => {
        if (!error && data) {
          setCategories(data.map((row) => ({ id: row.id, name: row.name })));
        }
      });

    // Fetch units from inventory_units table
    supabase
      .from('inventory_units')
      .select('name')
      .order('name')
      .then(({ data, error }) => {
        if (!error && data) {
          setUnits(data.map((row) => row.name as Unit));
        }
      });
  }, []);

  // Derived data
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.unit.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || item.categoryId === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, categoryFilter]);

  // Quick stats
  const totalItems = items.length;
  const lowStockCount = items.filter(i => {
    const s = getInventoryStatus(i);
    return s === 'Low Stock' || s === 'Critical Stock' || s === 'Out of Stock';
  }).length;

  // Handlers for Drawer/Modal
  const handleOpenCreateModal = () => {
    setSelectedItem(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  const handleSaveIngredient = async (ingredientData: Partial<InventoryItem>) => {
    if (selectedItem) {
      // Edit
      const supabase = createClient();
      const { data, error } = await supabase
        .from('inventory_items')
        .update({
          name: ingredientData.name,
          category_id: ingredientData.categoryId,
          unit: ingredientData.unit,
          current_stock: ingredientData.currentStock,
          max_capacity: ingredientData.maxCapacity,
          low_stock_threshold: ingredientData.lowStockThreshold,
          image_url: ingredientData.imageUrl ?? null,
          notes: ingredientData.notes ?? null,
        })
        .eq('id', selectedItem.id)
        .select()
        .single();

      if (error) {
        alert(`Failed to update ingredient: ${error.message}`);
        return;
      }

      const updatedItem: InventoryItem = {
        id: data.id,
        name: data.name,
        categoryId: data.category_id,
        unit: data.unit,
        currentStock: data.current_stock,
        maxCapacity: data.max_capacity,
        lowStockThreshold: data.low_stock_threshold,
        imageUrl: data.image_url,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
      setItems(prev => prev.map(i => i.id === selectedItem.id ? updatedItem : i));
    } else {
      // Create
      const supabase = createClient();
      const { data, error } = await supabase
        .from('inventory_items')
        .insert({
          name: ingredientData.name,
          category_id: ingredientData.categoryId,
          unit: ingredientData.unit,
          current_stock: ingredientData.currentStock,
          max_capacity: ingredientData.maxCapacity,
          low_stock_threshold: ingredientData.lowStockThreshold,
          image_url: ingredientData.imageUrl ?? null,
          notes: ingredientData.notes ?? null,
        })
        .select()
        .single();

      if (error) {
        alert(`Failed to save ingredient: ${error.message}`);
        return;
      }

      const newItem: InventoryItem = {
        id: data.id,
        name: data.name,
        categoryId: data.category_id,
        unit: data.unit,
        currentStock: data.current_stock,
        maxCapacity: data.max_capacity,
        lowStockThreshold: data.low_stock_threshold,
        imageUrl: data.image_url,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
      setItems(prev => [...prev, newItem]);
    }
  };

  const handleDeleteIngredient = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id);

    if (error) {
      alert(`Failed to delete ingredient: ${error.message}`);
      return;
    }

    setItems(prev => prev.filter(i => i.id !== id));
  };

  // Handlers for Replenish
  const handleOpenReplenish = (item: InventoryItem) => {
    setReplenishItem(item);
    setReplenishModalOpen(true);
  };

  // TODO: include userId in the transaction data.
  const handleSaveReplenishment = async (transactionData: Partial<InventoryTransaction>) => {
    const supabase = createClient();

    // INSERT into inventory_transactions
    const { data: txnData, error: txnError } = await supabase
      .from('inventory_transactions')
      .insert({
        inventory_item_id: transactionData.ingredientId,
        type: transactionData.type,
        previous_stock: transactionData.previousStock,
        quantity_changed: transactionData.quantityChanged,
        new_stock: transactionData.newStock,
        notes: transactionData.notes ?? null,
        delivery_cost: transactionData.expenseDetails?.deliveryCost ?? null,
        expense_payment_method: transactionData.expenseDetails?.paymentMethod ?? null,
        supplier: transactionData.expenseDetails?.supplier ?? null,
        received_by: transactionData.expenseDetails?.receivedBy ?? null,
        delivery_date: transactionData.expenseDetails?.deliveryDate ?? null,
        delivery_time: transactionData.expenseDetails?.deliveryTime ?? null,
      })
      .select()
      .single();

    if (txnError) {
      alert(`Failed to save replenishment: ${txnError.message}`);
      return;
    }

    // UPDATE current_stock on the ingredient
    const { error: updateError } = await supabase
      .from('inventory_items')
      .update({ current_stock: transactionData.newStock })
      .eq('id', transactionData.ingredientId);

    if (updateError) {
      alert(`Stock updated in ledger but failed to update ingredient stock: ${updateError.message}`);
      return;
    }

    // Reflect in local state
    const newTxn: InventoryTransaction = {
      ...(transactionData as InventoryTransaction),
      id: txnData.id,
    };
    setTransactions(prev => [newTxn, ...prev]);
    setItems(prev => prev.map(i =>
      i.id === transactionData.ingredientId
        ? { ...i, currentStock: transactionData.newStock! }
        : i
    ));
  };

  // Handlers for Settings
  const handleAddCategory = (name: string) => {
    setCategories(prev => [...prev, { id: `cat-${Date.now()}`, name }]);
  };

  const handleUpdateCategory = (id: string, name: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name } : c));
  };

  const handleDeleteCategory = (id: string) => {
    if (items.some(i => i.categoryId === id)) {
      alert('Cannot delete category: Ingredients are currently assigned to it.');
      return;
    }
    setCategories(prev => prev.filter(c => c.id !== id));
    if (categoryFilter === id) setCategoryFilter('all');
  };

  const handleAddUnit = async (unit: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('inventory_units')
      .insert({ name: unit });
    if (error) {
      alert(`Failed to add unit: ${error.message}`);
      return;
    }
    setUnits(prev => [...prev, unit as Unit]);
  };

  const handleDeleteUnit = async (unit: string) => {
    if (items.some(i => i.unit === unit)) {
      alert('Cannot delete unit: Ingredients are currently using it.');
      return;
    }
    const supabase = createClient();
    const { error } = await supabase
      .from('inventory_units')
      .delete()
      .eq('name', unit);
    if (error) {
      alert(`Failed to delete unit: ${error.message}`);
      return;
    }
    setUnits(prev => prev.filter(u => u !== unit));
  };

  // Export Data
  const handleExportData = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (currentView === 'inventory') {
      csvContent += "Name,Category,Current Stock,Unit,Max Capacity,Status\n";
      filteredItems.forEach(item => {
        const cat = categories.find(c => c.id === item.categoryId)?.name || 'Uncategorized';
        const row = [item.name, cat, item.currentStock, item.unit, item.maxCapacity, item.currentStock <= item.lowStockThreshold ? 'Low' : 'Healthy'];
        csvContent += row.join(",") + "\n";
      });
    } else {
      csvContent += "Date,Ingredient,Type,Change,Unit,New Stock,Cost,Payment Method,User\n";
      transactions.forEach(txn => {
        const item = items.find(i => i.id === txn.ingredientId);
        const itemName = item?.name || 'Unknown';
        const unit = item?.unit || '';
        const cost = txn.expenseDetails?.deliveryCost || 0;
        const method = txn.expenseDetails?.paymentMethod || '-';
        const date = new Date(txn.date).toLocaleString().replace(/,/g, '');
        const row = [date, itemName, txn.type, txn.quantityChanged, unit, txn.newStock, cost, method, txn.userId];
        csvContent += row.join(",") + "\n";
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${currentView}_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8 items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading inventory...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-6 mb-8">
        {/* Breadcrumb for Transactions */}
        {currentView === 'transactions' && (
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setCurrentView('inventory')} 
              className="flex items-center gap-1.5 text-sm text-[#C2456A] hover:text-[#a33858] font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Inventory
            </button>
            <ChevronRight className="w-4 h-4 text-gray-300" />
            <span className="text-sm font-semibold text-[#3a2b27]">Transactions Ledger</span>
          </div>
        )}

        {/* Title + Actions */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-6 border-b border-[#C2456A]/10">
          <div>
            <p className="text-xs font-medium text-[#C2456A] uppercase tracking-widest mb-1">
              {currentView === 'inventory' ? 'Stock Management' : 'Transaction History'}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {currentView === 'inventory' ? 'Inventory' : 'Inventory Transactions'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {currentView === 'inventory' 
                ? 'Manage ingredients, monitor stock levels, and configure thresholds.' 
                : 'Historical record of replenishments, adjustments, and movements.'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0 self-start sm:self-auto">
            <Button 
              variant="outline" 
              className="h-9 bg-white border-gray-200 text-sm"
              onClick={handleExportData}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            
            {currentView === 'inventory' && (
              <>
                <Button 
                  variant="outline" 
                  className="h-9 bg-white border-gray-200 text-sm"
                  onClick={() => setCurrentView('transactions')}
                >
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Transactions
                </Button>
                <Button 
                  variant="outline"
                  className="h-9 bg-white border-gray-200 text-sm"
                  onClick={() => setSettingsModalOpen(true)}
                >
                  <Settings2 className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                <Button 
                  className="h-9 px-5 bg-[#C2456A] hover:bg-[#a33858] text-white shadow-sm text-sm"
                  onClick={handleOpenCreateModal}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Ingredient
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Stats + Filter Row (Inventory View Only) */}
        {currentView === 'inventory' && (
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Quick stats */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="bg-[#C2456A]/10 p-1.5 rounded-md">
                  <Package className="h-4 w-4 text-[#C2456A]" />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight leading-none">{totalItems}</p>
                  <p className="text-xs text-muted-foreground">Ingredients</p>
                </div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="flex items-center gap-2">
                <div className="bg-amber-500/10 p-1.5 rounded-md">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight leading-none">{lowStockCount}</p>
                  <p className="text-xs text-muted-foreground">Low / Critical</p>
                </div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="flex items-center gap-2">
                <div className="bg-[#e08a4f]/10 p-1.5 rounded-md">
                  <Filter className="h-4 w-4 text-[#e08a4f]" />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight leading-none">{categories.length}</p>
                  <p className="text-xs text-muted-foreground">Categories</p>
                </div>
              </div>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 sm:flex-none sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input 
                  placeholder="Search ingredients..." 
                  className="pl-9 h-9 text-sm bg-white border-gray-200 focus:border-[#C2456A] focus:ring-[#C2456A]/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-44 h-9 text-sm bg-white border-gray-200">
                  <SelectValue>
                    {categoryFilter === 'all' 
                      ? 'All Categories' 
                      : categories.find(c => c.id === categoryFilter)?.name || 'Select Category'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {currentView === 'inventory' ? (
        <>
          {/* Category filter pills */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                categoryFilter === 'all'
                  ? 'bg-[#C2456A] text-white shadow-sm'
                  : 'bg-white text-muted-foreground hover:text-foreground border border-gray-200 hover:border-gray-300'
              }`}
            >
              All Items
              <span className="ml-1.5 opacity-70">{items.length}</span>
            </button>
            {categories.map(cat => {
              const count = items.filter(p => p.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                    categoryFilter === cat.id
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

          {/* Main Grid */}
          <div className="flex-1 pb-10">
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredItems.map(item => (
                  <InventoryCard 
                    key={item.id} 
                    item={item} 
                    category={categories.find(c => c.id === item.categoryId)}
                    onClick={() => handleOpenEditModal(item)}
                    onReplenish={() => handleOpenReplenish(item)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] border-2 border-dashed border-gray-200 rounded-2xl bg-white">
                <div className="p-5 bg-[#C2456A]/10 rounded-2xl mb-5">
                  <PackageOpen className="w-10 h-10 text-[#C2456A]" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-1">No ingredients found</h3>
                <p className="text-muted-foreground text-sm mb-6 text-center max-w-sm">
                  {searchQuery || categoryFilter !== 'all' 
                    ? "No ingredients match your search and filter criteria." 
                    : "Create your first ingredient to begin tracking stock levels."}
                </p>
                {items.length === 0 && (
                  <Button onClick={handleOpenCreateModal} className="bg-[#C2456A] hover:bg-[#a33858] text-white">
                    <Plus className="w-4 h-4 mr-2" /> Add Ingredient
                  </Button>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Transactions View */
        <div className="flex-1 pb-10">
          <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    <th className="px-5 py-3.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date & Time</th>
                    <th className="px-5 py-3.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ingredient</th>
                    <th className="px-5 py-3.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-5 py-3.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Change</th>
                    <th className="px-5 py-3.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">New Stock</th>
                    <th className="px-5 py-3.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Delivery Cost</th>
                    <th className="px-5 py-3.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payment</th>
                    <th className="px-5 py-3.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.length > 0 ? transactions.map(txn => {
                    const item = items.find(i => i.id === txn.ingredientId);
                    const itemName = item ? item.name : 'Unknown Item';
                    const unit = item ? item.unit : '';
                    const isPositive = txn.quantityChanged > 0;
                    const cost = txn.expenseDetails?.deliveryCost;
                    const payment = txn.expenseDetails?.paymentMethod;

                    const getTypeBadge = () => {
                      switch (txn.type) {
                        case 'Replenishment':
                          return 'bg-emerald-50 text-emerald-700';
                        case 'Automatic POS Deduction':
                          return 'bg-sky-50 text-sky-700';
                        case 'Manual Adjustment':
                          return 'bg-amber-50 text-amber-700';
                        case 'Waste / Spoilage':
                          return 'bg-rose-50 text-rose-700';
                        default:
                          return 'bg-gray-50 text-gray-600';
                      }
                    };
                    
                    return (
                      <tr key={txn.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap text-[13px]">
                          {new Date(txn.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-[#3a2b27] text-[13px]">{itemName}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getTypeBadge()}`}>
                            {txn.type}
                          </span>
                        </td>
                        <td className={`px-5 py-3.5 text-right font-bold text-[13px] ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isPositive ? '+' : ''}{txn.quantityChanged.toLocaleString()} {unit}
                        </td>
                        <td className="px-5 py-3.5 text-right text-gray-500 text-[13px] font-medium">
                          {txn.newStock.toLocaleString()} {unit}
                        </td>
                        <td className="px-5 py-3.5 text-right text-gray-500 text-[13px]">
                          {cost !== undefined ? `₱${cost.toLocaleString(undefined, {minimumFractionDigits: 2})}` : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 text-[13px]">
                          {payment || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 text-[13px]">{txn.userId}</td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center">
                          <div className="p-4 bg-gray-100 rounded-2xl mb-4">
                            <ClipboardList className="w-8 h-8 text-gray-300" />
                          </div>
                          <p className="font-semibold text-[#3a2b27] mb-1">No transactions yet</p>
                          <p className="text-sm text-gray-400">Replenishment and deduction logs will appear here.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <IngredientModal 
        open={modalOpen}
        onOpenChange={setModalOpen}
        item={selectedItem}
        categories={categories}
        units={units}
        onSave={handleSaveIngredient}
        onDelete={handleDeleteIngredient}
      />

      <ReplenishModal 
        open={replenishModalOpen}
        onOpenChange={setReplenishModalOpen}
        item={replenishItem}
        onSave={handleSaveReplenishment}
      />

      <SettingsModal 
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
        categories={categories}
        units={units}
        onAddCategory={handleAddCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
        onAddUnit={handleAddUnit}
        onDeleteUnit={handleDeleteUnit}
      />
    </div>
  );
}