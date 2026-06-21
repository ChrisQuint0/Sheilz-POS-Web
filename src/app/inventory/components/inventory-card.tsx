import React from 'react';
import { InventoryItem, Category, getInventoryStatus } from '../data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, AlertCircle, AlertTriangle, CheckCircle2, Pencil, RefreshCw } from 'lucide-react';

interface InventoryCardProps {
  item: InventoryItem;
  category?: Category;
  onClick: () => void;
  onReplenish: (e: React.MouseEvent) => void;
}

export function InventoryCard({ item, category, onClick, onReplenish }: InventoryCardProps) {
  const status = getInventoryStatus(item);
  
  // Calculate percentage safely
  const percentage = Math.min(100, Math.max(0, (item.currentStock / item.maxCapacity) * 100));
  
  // Format numbers (e.g., 2,500)
  const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);

  const getStatusConfig = () => {
    switch (status) {
      case 'Healthy':
        return { 
          text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200/60',
          progress: 'bg-emerald-500', icon: <CheckCircle2 className="w-3.5 h-3.5" />,
          dot: 'bg-emerald-400'
        };
      case 'Low Stock':
        return { 
          text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200/60',
          progress: 'bg-amber-500', icon: <AlertTriangle className="w-3.5 h-3.5" />,
          dot: 'bg-amber-400'
        };
      case 'Critical Stock':
      case 'Out of Stock':
        return { 
          text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200/60',
          progress: 'bg-rose-500', icon: <AlertCircle className="w-3.5 h-3.5" />,
          dot: 'bg-rose-400'
        };
      default:
        return { 
          text: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200',
          progress: 'bg-gray-400', icon: null,
          dot: 'bg-gray-400'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div
      className="group rounded-xl border border-gray-200 bg-white overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-[#C2456A]/5 hover:border-[#C2456A]/20 hover:-translate-y-0.5 h-full flex flex-col"
      onClick={onClick}
    >
      {/* Top Section */}
      <div className="p-4 pb-3 flex-1 flex flex-col">
        <div className="flex items-start gap-3 mb-4">
          {/* Image / Icon */}
          <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <Package className="w-5 h-5 text-gray-300" />
            )}
          </div>

          {/* Name & Category */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[15px] text-[#3a2b27] leading-snug group-hover:text-[#C2456A] transition-colors">
              {item.name}
            </h3>
            <span className="inline-flex items-center bg-gray-100 text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-2 py-0.5 rounded-full mt-1.5">
              {category?.name || 'Uncategorized'}
            </span>
          </div>

          {/* Edit indicator */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <div className="w-7 h-7 rounded-lg bg-[#C2456A]/10 flex items-center justify-center">
              <Pencil className="w-3.5 h-3.5 text-[#C2456A]" />
            </div>
          </div>
        </div>

        {/* Stock Display */}
        <div className="mt-auto space-y-3">
          {/* Status Badge */}
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${config.dot}`} />
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${config.text}`}>
              {status}
            </span>
          </div>

          {/* Big Number */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold tracking-tight text-[#3a2b27] leading-none">
              {formatNumber(item.currentStock)}
            </span>
            <span className="text-sm text-gray-400 font-medium">{item.unit}</span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 ease-out ${config.progress}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-gray-400 font-medium">
              <span>Threshold: {formatNumber(item.lowStockThreshold)}</span>
              <span>Max: {formatNumber(item.maxCapacity)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 bg-gray-50/80 border-t border-gray-100 flex justify-end">
        <Button 
          size="sm" 
          className="h-7 px-3 text-[11px] font-semibold bg-[#C2456A] hover:bg-[#a33858] text-white shadow-sm"
          onClick={(e) => {
            e.stopPropagation();
            onReplenish(e);
          }}
        >
          <RefreshCw className="w-3 h-3 mr-1.5" />
          Replenish
        </Button>
      </div>
    </div>
  );
}
