import React from 'react';
import type { TemplateProps } from './common';
import { SlotWrapper } from './common';
import { formatDisplayValue } from '@/utils/dynamicRenderer';
import { ShoppingCart, Star } from 'lucide-react';

const FlowbiteTemplate: React.FC<TemplateProps> = ({ 
  data, 
  visibility, 
  accentColor, 
  bgBase,
  textMain, 
  textMuted = 'text-gray-500',
  borderBase,
  activeSlot,
  onSlotClick,
  onVariantSelect,
  activeVariantIndex = 0
}) => {
  const { 
    title, price, imageUrl, 
    sku = '', barcode = '', 
    reviewCount = 455, rating = 5.0,
    color: mappedColor,
    availableColors = [],
    availableSizes = [],
    description,
    variants = []
  } = data;

  return (
    <div className={`flex flex-col rounded-4xl border transition-all duration-300 m-auto w-[300px] h-full overflow-hidden pb-5 ${bgBase} ${borderBase}`} style={{height: "100%"}}>
        <div className={`relative aspect-square overflow-hidden bg-[#F1F3F5]`}>
          {visibility.image && (
            <SlotWrapper 
              slot="image" 
              className="w-full h-full"
              activeSlot={activeSlot}
              onSlotClick={onSlotClick}
              accentColor={accentColor}
            >
              <img 
                src={imageUrl || "https://placehold.co/600x600?text=Product+Image"} 
                alt={title} 
                className="w-full h-full object-contain pt-5 px-4 pb-0 transition-all duration-700 hover:scale-110" 
              />
            </SlotWrapper>
          )}
        </div>
        
        <div className="pt-6 px-6 flex-2">
          <div className="mb-4 flex items-center justify-between gap-4">
            {visibility.badge && (
              <SlotWrapper 
                slot="badge"
                activeSlot={activeSlot}
                onSlotClick={onSlotClick}
                accentColor={accentColor}
              >
                <span className="rounded bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary border border-primary/20">
                  Up to 35% off
                </span>
              </SlotWrapper>
            )}
          </div>

          {visibility.title && (
             <SlotWrapper 
               slot="title"
               activeSlot={activeSlot}
               onSlotClick={onSlotClick}
               accentColor={accentColor}
             >
                <div className="space-y-1">
                  <a href="#" className={`text-lg font-bold leading-tight line-clamp-2 ${textMain}`}>
                    {title}
                  </a>
                  <div className="flex flex-col gap-1 mt-1">
                    {visibility.sku && sku && (
                      <SlotWrapper 
                        slot="sku"
                        activeSlot={activeSlot}
                        onSlotClick={onSlotClick}
                        accentColor={accentColor}
                      >
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">SKU: {sku}</span>
                      </SlotWrapper>
                    )}
                    {visibility.barcode && (
                      <SlotWrapper 
                        slot="barcode"
                        activeSlot={activeSlot}
                        onSlotClick={onSlotClick}
                        accentColor={accentColor}
                      >
                        <div className="flex flex-col gap-1.5 grayscale opacity-50 hover:opacity-100 transition-opacity">
                           <div className="flex items-end gap-px h-4">
                              {[2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 2, 1, 3, 1, 2, 4, 1, 2].map((w, i) => (
                                  <div key={i} className="bg-gray-400" style={{ width: `${w}px`, height: i % 3 === 0 ? '100%' : '80%' }} />
                              ))}
                           </div>
                           {barcode && <span className="text-[8px] font-mono text-gray-400 tracking-[0.2em] leading-none">{barcode}</span>}
                        </div>
                      </SlotWrapper>
                    )}
                  </div>
                </div>
             </SlotWrapper>
          )}
          
          {visibility.rating && (
            <div className="mt-2 flex items-center gap-2">
              <SlotWrapper 
                slot="rating"
                activeSlot={activeSlot}
                onSlotClick={onSlotClick}
                accentColor={accentColor}
                className="flex items-center gap-2"
              >
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className={`text-sm font-medium ${textMain}`}>{Number(rating).toFixed(1)}</p>
                <p className="text-sm font-medium text-gray-500">({reviewCount})</p>
              </SlotWrapper>
            </div>
          )}

          {visibility.stock && (
            <div className="mt-2 text-xs font-bold">
              <SlotWrapper 
                slot="stock"
                activeSlot={activeSlot}
                onSlotClick={onSlotClick}
                accentColor={accentColor}
              >
                <span className={Number(data.stock || 0) > 0 ? 'text-emerald-500' : 'text-red-500'}>
                  {Number(data.stock || 0) > 0 ? `${data.stock} in stock` : 'Out of stock'}
                </span>
              </SlotWrapper>
            </div>
          )}

          {visibility?.description !== false && description && (
             <SlotWrapper 
               slot="description"
               activeSlot={activeSlot}
               onSlotClick={onSlotClick}
               accentColor={accentColor}
               className="mb-4 mt-2"
             >
                <p className={`text-sm ${textMuted} line-clamp-2 leading-relaxed`}>{description}</p>
             </SlotWrapper>
          )}

          {visibility?.colors !== false && (availableColors.length > 0 || variants.length > 0) && (
            <div className="mt-4">
              <SlotWrapper 
                slot="colors"
                activeSlot={activeSlot}
                onSlotClick={onSlotClick}
                accentColor={accentColor}
              >
                <div className="flex gap-1.5">
                  {(availableColors.length > 0 ? availableColors : variants).map((c: any, i: number) => {
                    const colorValue = typeof c === 'object' ? c.color || c.value || c.hex : c;
                    const isSelected = activeVariantIndex === i;
                    return (
                      <div 
                        key={i} 
                        onClick={() => onVariantSelect?.(i)}
                        className={`w-4 h-4 rounded-full border transition-all cursor-pointer ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-white dark:ring-offset-gray-800' : 'opacity-40 hover:opacity-100'}`}
                        style={{ 
                          backgroundColor: colorValue,
                          borderColor: isSelected ? accentColor : 'transparent',
                          ['--tw-ring-color' as any]: isSelected ? accentColor : 'transparent'
                         }}
                      />
                    );
                  })}
                </div>
              </SlotWrapper>
            </div>
          )}

          {visibility.sizes && (
            <div className="mt-3">
              <SlotWrapper 
                slot="sizes"
                activeSlot={activeSlot}
                onSlotClick={onSlotClick}
                accentColor={accentColor}
              >
                <div className="flex gap-2">
                  {(availableSizes.length > 0 ? availableSizes : ['S', 'M', 'L']).slice(0, 3).map((size: any, i: number) => (
                    <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200 uppercase">
                      {typeof size === 'object' ? size.label : size}
                    </span>
                  ))}
                </div>
              </SlotWrapper>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 border-t border-gray-100 dark:border-gray-700 pt-4 mt-4">
            {visibility.price && (
              <SlotWrapper 
                slot="price"
                activeSlot={activeSlot}
                onSlotClick={onSlotClick}
                accentColor={accentColor}
              >
                <p className={`text-2xl font-extrabold leading-tight ${textMain}`}>
                  {formatDisplayValue(price, 'price')}
                </p>
              </SlotWrapper>
            )}

            {visibility.actions && (
              <SlotWrapper 
                slot="actions"
                activeSlot={activeSlot}
                onSlotClick={onSlotClick}
                accentColor={accentColor}
              >
                <button 
                  type="button" 
                  className="inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:brightness-110 shadow-lg shadow-primary/20 transition-all"
                  style={{ backgroundColor: accentColor }}
                >
                  <ShoppingCart size={16} className="mr-2" />
                  Add to cart
                </button>
              </SlotWrapper>
            )}
          </div>
        </div>
      </div>
  );
};

export const mockData = {
  title: 'Samsung Galaxy S24 Ultra, 512GB Titanium Gray',
  price: 1299,
  category: 'Phones',
  sku: 'SG-S24U-512-GRY',
  stock: 85,
  rating: 4.9,
  reviewCount: 856,
  description: 'The ultimate Galaxy experience with Titanium frame and the new S Pen. Galaxy AI is here.',
  imageUrl: '/src/assets/images/default-product-1.png',
  availableColors: ['#4b5563', '#f3f4f6', '#1e293b'],
  availableSizes: ['128GB', '256GB', '512GB'],
};

export default FlowbiteTemplate;
