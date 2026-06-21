import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Category, PaymentMethod, Size, TemperatureOption } from '../types';
import { Plus, GripVertical, Trash2, CreditCard, Ruler, Thermometer, Tag, Edit2, Check, X } from 'lucide-react';

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
  setTemperatures
}: MoreSettingsModalProps) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newPaymentName, setNewPaymentName] = useState('');
  const [newSizeName, setNewSizeName] = useState('');
  const [newTempName, setNewTempName] = useState('');
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  // --- Edit state ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditValue(name);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  // --- Category handlers ---
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    setCategories(prev => [...prev, { id: `cat-${Date.now()}`, name: newCategoryName.trim() }]);
    setNewCategoryName('');
  };
  const handleDeleteCategory = (id: string) => setCategories(prev => prev.filter(c => c.id !== id));
  const handleSaveCategory = (id: string) => {
    if (!editValue.trim()) return;
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name: editValue.trim() } : c));
    setEditingId(null);
  };
  const handleDropCategory = (e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === dropIdx) return;
    setCategories(prev => { const arr = [...prev]; const [item] = arr.splice(draggedIdx, 1); arr.splice(dropIdx, 0, item); return arr; });
    setDraggedIdx(null);
  };

  // --- Payment handlers ---
  const handleAddPayment = () => {
    if (!newPaymentName.trim()) return;
    setPaymentMethods(prev => [...prev, { id: `pm-${Date.now()}`, name: newPaymentName.trim(), isEnabled: true }]);
    setNewPaymentName('');
  };
  const handleDeletePayment = (id: string) => setPaymentMethods(prev => prev.filter(p => p.id !== id));
  const handleSavePayment = (id: string) => {
    if (!editValue.trim()) return;
    setPaymentMethods(prev => prev.map(p => p.id === id ? { ...p, name: editValue.trim() } : p));
    setEditingId(null);
  };
  const handleTogglePayment = (id: string, isEnabled: boolean) => setPaymentMethods(prev => prev.map(p => p.id === id ? { ...p, isEnabled } : p));
  const handleDropPayment = (e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === dropIdx) return;
    setPaymentMethods(prev => { const arr = [...prev]; const [item] = arr.splice(draggedIdx, 1); arr.splice(dropIdx, 0, item); return arr; });
    setDraggedIdx(null);
  };

  // --- Size handlers ---
  const handleAddSize = () => {
    if (!newSizeName.trim()) return;
    setSizes(prev => [...prev, { id: `size-${Date.now()}`, name: newSizeName.trim() }]);
    setNewSizeName('');
  };
  const handleDeleteSize = (id: string) => setSizes(prev => prev.filter(s => s.id !== id));
  const handleSaveSize = (id: string) => {
    if (!editValue.trim()) return;
    setSizes(prev => prev.map(s => s.id === id ? { ...s, name: editValue.trim() } : s));
    setEditingId(null);
  };
  const handleDropSize = (e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === dropIdx) return;
    setSizes(prev => { const arr = [...prev]; const [item] = arr.splice(draggedIdx, 1); arr.splice(dropIdx, 0, item); return arr; });
    setDraggedIdx(null);
  };

  // --- Temperature handlers ---
  const handleAddTemp = () => {
    if (!newTempName.trim()) return;
    setTemperatures(prev => [...prev, { id: `temp-${Date.now()}`, name: newTempName.trim() }]);
    setNewTempName('');
  };
  const handleDeleteTemp = (id: string) => setTemperatures(prev => prev.filter(t => t.id !== id));
  const handleSaveTemp = (id: string) => {
    if (!editValue.trim()) return;
    setTemperatures(prev => prev.map(t => t.id === id ? { ...t, name: editValue.trim() } : t));
    setEditingId(null);
  };
  const handleDropTemp = (e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === dropIdx) return;
    setTemperatures(prev => { const arr = [...prev]; const [item] = arr.splice(draggedIdx, 1); arr.splice(dropIdx, 0, item); return arr; });
    setDraggedIdx(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] md:max-w-[900px] lg:max-w-[1000px] w-[95vw] max-h-[85vh] flex flex-col p-0 overflow-hidden border-gray-200">
        <DialogHeader className="p-6 pb-5 border-b border-gray-100 shrink-0">
          <DialogTitle className="text-xl font-bold text-[#3a2b27]">More Settings</DialogTitle>
          <DialogDescription className="text-sm text-gray-500 mt-1">
            Manage global configurations for categories, payment methods, sizes, and temperatures.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="categories" className="w-full flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="px-6 border-b border-gray-100 shrink-0">
            <TabsList variant="line" className="h-12 w-full justify-start gap-1 p-0">
              <TabsTrigger value="categories" className="px-4 h-full text-sm font-medium gap-2">
                <Tag className="w-4 h-4" /> Categories
              </TabsTrigger>
              <TabsTrigger value="payments" className="px-4 h-full text-sm font-medium gap-2">
                <CreditCard className="w-4 h-4" /> Payments
              </TabsTrigger>
              <TabsTrigger value="sizes" className="px-4 h-full text-sm font-medium gap-2">
                <Ruler className="w-4 h-4" /> Sizes
              </TabsTrigger>
              <TabsTrigger value="temperatures" className="px-4 h-full text-sm font-medium gap-2">
                <Thermometer className="w-4 h-4" /> Temperatures
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6 min-h-0 bg-gray-50/50">
            {/* Categories */}
            <TabsContent value="categories" className="m-0 space-y-5 outline-none">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-bold text-lg text-[#3a2b27]">Product Categories</h3>
                <div className="flex items-center gap-2">
                  <Input 
                    placeholder="New category name" 
                    value={newCategoryName} 
                    onChange={e => setNewCategoryName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                    className="w-48 h-9 text-sm bg-white border-gray-200 focus:border-[#C2456A]"
                  />
                  <Button onClick={handleAddCategory} size="sm" className="h-9 bg-[#C2456A] hover:bg-[#a33858] text-white"><Plus className="w-4 h-4 mr-1" /> Add</Button>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 shadow-sm">
                {categories.map((cat, idx) => (
                  <div 
                    key={cat.id} 
                    draggable={editingId !== cat.id}
                    onDragStart={() => setDraggedIdx(idx)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => handleDropCategory(e, idx)}
                    className={`flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/80 group transition-colors ${editingId !== cat.id ? 'cursor-move' : ''}`}
                  >
                    {editingId === cat.id ? (
                      <div className="flex items-center gap-2 w-full pr-2">
                        <Input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveCategory(cat.id)} className="h-8 text-sm bg-white border-gray-200 focus:border-[#C2456A]" />
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 shrink-0" onClick={() => handleSaveCategory(cat.id)}><Check className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 shrink-0" onClick={cancelEdit}><X className="w-4 h-4" /></Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
                          <span className="font-medium text-sm text-[#3a2b27]">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => startEdit(cat.id, cat.name)} className="text-gray-300 hover:text-blue-500 p-1.5 rounded-lg hover:bg-blue-50">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteCategory(cat.id)} className="text-gray-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {categories.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">No categories yet. Add one above.</div>}
              </div>
            </TabsContent>

            {/* Payment Methods */}
            <TabsContent value="payments" className="m-0 space-y-5 outline-none">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-bold text-lg text-[#3a2b27]">Payment Methods</h3>
                <div className="flex items-center gap-2">
                  <Input 
                    placeholder="New payment method" 
                    value={newPaymentName} 
                    onChange={e => setNewPaymentName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddPayment()}
                    className="w-48 h-9 text-sm bg-white border-gray-200 focus:border-[#C2456A]"
                  />
                  <Button onClick={handleAddPayment} size="sm" className="h-9 bg-[#C2456A] hover:bg-[#a33858] text-white"><Plus className="w-4 h-4 mr-1" /> Add</Button>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 shadow-sm">
                {paymentMethods.map((pm, idx) => (
                  <div 
                    key={pm.id} 
                    draggable={editingId !== pm.id}
                    onDragStart={() => setDraggedIdx(idx)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => handleDropPayment(e, idx)}
                    className={`flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/80 group transition-colors ${editingId !== pm.id ? 'cursor-move' : ''}`}
                  >
                    {editingId === pm.id ? (
                      <div className="flex items-center gap-2 w-full pr-2">
                        <Input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSavePayment(pm.id)} className="h-8 text-sm bg-white border-gray-200 focus:border-[#C2456A]" />
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 shrink-0" onClick={() => handleSavePayment(pm.id)}><Check className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 shrink-0" onClick={cancelEdit}><X className="w-4 h-4" /></Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
                          <span className="font-medium text-sm text-[#3a2b27]">{pm.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div onClick={e => e.stopPropagation()} className="cursor-default">
                            <Switch checked={pm.isEnabled} onCheckedChange={c => handleTogglePayment(pm.id, c)} />
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => startEdit(pm.id, pm.name)} className="text-gray-300 hover:text-blue-500 p-1.5 rounded-lg hover:bg-blue-50">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeletePayment(pm.id)} className="text-gray-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {paymentMethods.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">No payment methods yet. Add one above.</div>}
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
                    onChange={e => setNewSizeName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddSize()}
                    className="w-36 h-9 text-sm bg-white border-gray-200 focus:border-[#C2456A]"
                  />
                  <Button onClick={handleAddSize} size="sm" className="h-9 bg-[#C2456A] hover:bg-[#a33858] text-white"><Plus className="w-4 h-4 mr-1" /> Add</Button>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 shadow-sm">
                {sizes.map((size, idx) => (
                  <div 
                    key={size.id} 
                    draggable={editingId !== size.id}
                    onDragStart={() => setDraggedIdx(idx)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => handleDropSize(e, idx)}
                    className={`flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/80 group transition-colors ${editingId !== size.id ? 'cursor-move' : ''}`}
                  >
                    {editingId === size.id ? (
                      <div className="flex items-center gap-2 w-full pr-2">
                        <Input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveSize(size.id)} className="h-8 text-sm bg-white border-gray-200 focus:border-[#C2456A]" />
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 shrink-0" onClick={() => handleSaveSize(size.id)}><Check className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 shrink-0" onClick={cancelEdit}><X className="w-4 h-4" /></Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
                          <span className="font-medium text-sm text-[#3a2b27]">{size.name}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => startEdit(size.id, size.name)} className="text-gray-300 hover:text-blue-500 p-1.5 rounded-lg hover:bg-blue-50">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteSize(size.id)} className="text-gray-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {sizes.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">No sizes yet. Add one above.</div>}
              </div>
            </TabsContent>

            {/* Temperatures */}
            <TabsContent value="temperatures" className="m-0 space-y-5 outline-none">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-bold text-lg text-[#3a2b27]">Temperature Options</h3>
                <div className="flex items-center gap-2">
                  <Input 
                    placeholder="e.g. Blended" 
                    value={newTempName} 
                    onChange={e => setNewTempName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddTemp()}
                    className="w-40 h-9 text-sm bg-white border-gray-200 focus:border-[#C2456A]"
                  />
                  <Button onClick={handleAddTemp} size="sm" className="h-9 bg-[#C2456A] hover:bg-[#a33858] text-white"><Plus className="w-4 h-4 mr-1" /> Add</Button>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 shadow-sm">
                {temperatures.map((temp, idx) => (
                  <div 
                    key={temp.id} 
                    draggable={editingId !== temp.id}
                    onDragStart={() => setDraggedIdx(idx)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => handleDropTemp(e, idx)}
                    className={`flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/80 group transition-colors ${editingId !== temp.id ? 'cursor-move' : ''}`}
                  >
                    {editingId === temp.id ? (
                      <div className="flex items-center gap-2 w-full pr-2">
                        <Input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveTemp(temp.id)} className="h-8 text-sm bg-white border-gray-200 focus:border-[#C2456A]" />
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 shrink-0" onClick={() => handleSaveTemp(temp.id)}><Check className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 shrink-0" onClick={cancelEdit}><X className="w-4 h-4" /></Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
                          <span className="font-medium text-sm text-[#3a2b27]">{temp.name}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => startEdit(temp.id, temp.name)} className="text-gray-300 hover:text-blue-500 p-1.5 rounded-lg hover:bg-blue-50">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteTemp(temp.id)} className="text-gray-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {temperatures.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">No temperature options yet. Add one above.</div>}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
