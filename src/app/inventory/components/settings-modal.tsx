import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Category, Unit } from '../data';
import { Trash2, Plus, GripVertical, Check, X, Settings2, Tag, Ruler } from 'lucide-react';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  units: Unit[];
  onAddCategory: (name: string) => void;
  onUpdateCategory: (id: string, name: string) => void;
  onDeleteCategory: (id: string) => void;
  onAddUnit: (unit: string) => void;
  onDeleteUnit: (unit: string) => void;
}

export function SettingsModal({ 
  open, 
  onOpenChange,
  categories,
  units,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAddUnit,
  onDeleteUnit
}: SettingsModalProps) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [newUnitName, setNewUnitName] = useState('');

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName.trim());
      setNewCategoryName('');
    }
  };

  const handleSaveCategoryEdit = (id: string) => {
    if (editCategoryName.trim()) {
      onUpdateCategory(id, editCategoryName.trim());
    }
    setEditingCategoryId(null);
  };

  const handleAddUnit = () => {
    if (newUnitName.trim() && !units.includes(newUnitName.trim() as Unit)) {
      onAddUnit(newUnitName.trim());
      setNewUnitName('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e08a4f]/10 flex items-center justify-center">
              <Settings2 className="w-5 h-5 text-[#e08a4f]" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-[#3a2b27]">Inventory Settings</DialogTitle>
              <DialogDescription className="text-[13px] text-gray-400">
                Manage global inventory categories and measurement units.
              </DialogDescription>
            </div>
          </div>
        </div>

        <Tabs defaultValue="categories" className="flex flex-col flex-1 min-h-0">
          <div className="px-6 pt-3">
            <TabsList className="w-full grid grid-cols-2 h-10 bg-gray-100 p-1 rounded-lg">
              <TabsTrigger value="categories" className="rounded-md text-[13px] font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                Categories
              </TabsTrigger>
              <TabsTrigger value="units" className="rounded-md text-[13px] font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5" />
                Units
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="categories" className="mt-0 px-6 py-4 space-y-3 flex flex-col flex-1 min-h-0">
            {/* Add Input */}
            <div className="flex items-center gap-2 shrink-0">
              <Input 
                placeholder="New category name..." 
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                className="h-9 bg-white border-gray-200 text-sm focus:border-[#C2456A] focus:ring-[#C2456A]/20"
              />
              <Button 
                onClick={handleAddCategory} 
                disabled={!newCategoryName.trim()}
                className="h-9 px-4 bg-[#C2456A] hover:bg-[#a33858] text-white shadow-sm text-[13px] shrink-0"
              >
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>

            {/* Category List */}
            <div className="border border-gray-200 rounded-xl overflow-y-auto flex-1 bg-white">
              {categories.length > 0 ? categories.map((category) => (
                <div key={category.id} className="flex items-center gap-2 px-3.5 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors group">
                  <GripVertical className="w-3.5 h-3.5 text-gray-300 cursor-move shrink-0" />
                  
                  {editingCategoryId === category.id ? (
                    <div className="flex-1 flex items-center gap-1.5">
                      <Input 
                        autoFocus
                        className="h-8 text-sm bg-white border-gray-200"
                        value={editCategoryName}
                        onChange={e => setEditCategoryName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSaveCategoryEdit(category.id)}
                      />
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600 hover:bg-emerald-50" onClick={() => handleSaveCategoryEdit(category.id)}>
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400 hover:bg-gray-100" onClick={() => setEditingCategoryId(null)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span 
                        className="flex-1 text-[13px] font-medium text-[#3a2b27] cursor-pointer hover:text-[#C2456A] transition-colors" 
                        onClick={() => {
                          setEditingCategoryId(category.id);
                          setEditCategoryName(category.name);
                        }}
                      >
                        {category.name}
                      </span>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7 text-gray-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all" 
                        onClick={() => {
                          if(window.confirm('Delete category?')) {
                            onDeleteCategory(category.id);
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              )) : (
                <div className="px-4 py-8 text-center text-sm text-gray-400">
                  No categories yet. Add one above.
                </div>
              )}
            </div>
            <p className="text-[11px] text-gray-400 italic shrink-0">Categories assigned to active ingredients cannot be deleted.</p>
          </TabsContent>

          <TabsContent value="units" className="mt-0 px-6 py-4 space-y-3 flex flex-col flex-1 min-h-0">
            {/* Add Input */}
            <div className="flex items-center gap-2 shrink-0">
              <Input 
                placeholder="New unit (e.g. kg, box)..." 
                value={newUnitName}
                onChange={e => setNewUnitName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddUnit()}
                className="h-9 bg-white border-gray-200 text-sm focus:border-[#C2456A] focus:ring-[#C2456A]/20"
              />
              <Button 
                onClick={handleAddUnit} 
                disabled={!newUnitName.trim()}
                className="h-9 px-4 bg-[#C2456A] hover:bg-[#a33858] text-white shadow-sm text-[13px] shrink-0"
              >
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>

            {/* Unit List */}
            <div className="border border-gray-200 rounded-xl overflow-y-auto flex-1 bg-white">
              {units.length > 0 ? units.map((unit) => (
                <div key={unit} className="flex items-center gap-2 px-3.5 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors group">
                  <GripVertical className="w-3.5 h-3.5 text-gray-300 cursor-move shrink-0" />
                  <span className="flex-1 text-[13px] font-medium text-[#3a2b27]">{unit}</span>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-7 w-7 text-gray-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all" 
                    onClick={() => {
                      if(window.confirm('Delete unit?')) {
                        onDeleteUnit(unit);
                      }
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )) : (
                <div className="px-4 py-8 text-center text-sm text-gray-400">
                  No units yet. Add one above.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
