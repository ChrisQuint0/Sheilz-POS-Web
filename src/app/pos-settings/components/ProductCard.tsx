import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Product, Category, Size, TemperatureOption } from '../types';
import { Image as ImageIcon, Eye, EyeOff } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  category?: Category;
  sizes: Size[];
  temperatures: TemperatureOption[];
  onClick: (product: Product) => void;
}

export function ProductCard({ product, category, sizes, temperatures, onClick }: ProductCardProps) {
  return (
    <div
      className="group rounded-xl border border-gray-200 bg-white overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-[#C2456A]/5 hover:border-[#C2456A]/20 hover:-translate-y-0.5"
      onClick={() => onClick(product)}
    >
      {/* Image */}
      <div className="aspect-[16/10] w-full overflow-hidden relative bg-gray-50">
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
            <ImageIcon className="w-10 h-10 mb-1" />
            <span className="text-[11px] font-medium uppercase tracking-wider">No Image</span>
          </div>
        )}
        
        {/* Visibility badge */}
        {!product.isVisible && (
          <div className="absolute top-2.5 right-2.5">
            <span className="inline-flex items-center gap-1 bg-gray-900/70 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-1 rounded-full">
              <EyeOff className="w-3 h-3" /> Hidden
            </span>
          </div>
        )}

        {/* Category pill overlay */}
        <div className="absolute bottom-2.5 left-2.5">
          <span className="inline-flex items-center bg-white/90 backdrop-blur-sm text-[11px] font-semibold text-[#3a2b27] px-2.5 py-1 rounded-full shadow-sm border border-white/50">
            {category?.name || 'Uncategorized'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-semibold text-[15px] text-[#3a2b27] leading-snug group-hover:text-[#C2456A] transition-colors line-clamp-1">
            {product.name}
          </h3>
          <span className={`shrink-0 inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            product.type === 'Beverage' 
              ? 'bg-blue-50 text-blue-600' 
              : 'bg-amber-50 text-amber-600'
          }`}>
            {product.type}
          </span>
        </div>

        {/* Sizes & Temps */}
        <div className="space-y-2 mb-3">
          {product.sizes.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider w-9 shrink-0">Size</span>
              <div className="flex flex-wrap gap-1">
                {product.sizes.map(sizeId => {
                  const s = sizes.find(s => s.id === sizeId);
                  return s ? (
                    <span key={s.id} className="text-[11px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                      {s.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {product.temperatures.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider w-9 shrink-0">Temp</span>
              <div className="flex flex-wrap gap-1">
                {product.temperatures.map(tempId => {
                  const t = temperatures.find(t => t.id === tempId);
                  return t ? (
                    <span key={t.id} className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                      t.name === 'Hot' ? 'bg-red-50 text-red-500' : 
                      t.name === 'Cold' ? 'bg-sky-50 text-sky-500' : 
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {t.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 flex items-center justify-between border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${product.hasRecipe ? 'bg-emerald-400' : 'bg-gray-300'}`} />
            <span className={`text-[11px] font-medium ${product.hasRecipe ? 'text-emerald-600' : 'text-gray-400'}`}>
              {product.hasRecipe ? 'Recipe Ready' : 'No Recipe'}
            </span>
          </div>
          {(() => {
            const uniqueIngredientsCount = Object.values(product.recipes || {}).reduce((acc, recipe) => {
              recipe.forEach(ing => acc.add(ing.ingredientId));
              return acc;
            }, new Set<string>()).size;
            
            return uniqueIngredientsCount > 0 && (
              <span className="text-[10px] text-gray-400 font-medium">
                {uniqueIngredientsCount} ingredient{uniqueIngredientsCount !== 1 ? 's' : ''}
              </span>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
