import React from 'react';
import type { TemplateProps } from './common';
import { SlotWrapper } from './common';
import { formatDisplayValue } from '@/utils/dynamicRenderer';
import { Star, Truck, Tag, Box, Heart, Minimize2 } from 'lucide-react';

const HorizontalAdvancedTemplate: React.FC<TemplateProps> = ({ 
  data, 
  visibility, 
  accentColor, 
  isDark,
  bgBase,
  textMain,
  textMuted,
  borderBase,
  shadowClass, 
  fontClass,
  activeSlot,
  onSlotClick,
  onVariantSelect,
  activeVariantIndex = 0
}) => {
  const { title, price, imageUrl, category = 'PREMIUM', sku = 'RH-GEN5-2024', stock = 124, rating = 4.9 } = data;
  const isSelected = (i: number) => activeVariantIndex === i;

  return (
    <div className={`group transition-all duration-500 m-auto w-full h-[220px] flex flex-row border hover:border-primary/50 relative overflow-hidden ${bgBase} ${borderBase} ${shadowClass} ${fontClass} rounded-4xl backdrop-blur-md`}>
        {/* LEFT IMAGE SECTION - Square with hover zoom */}
        <div className={`relative aspect-4/5 overflow-hidden border-r ${isDark ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
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
                className="w-full h-full object-contain transition-transform duration-1000 group-hover:scale-105" 
              />
            </SlotWrapper>
          )}

          {/* Badge Overlay */}
          <div className="absolute bottom-4 left-4">
             <div className={`px-3 py-1 backdrop-blur-md border rounded-full ${isDark ? 'bg-black/60 border-white/10' : 'bg-white/60 border-black/10'}`}>
                <span className="text-[8px] font-black uppercase tracking-widest italic" style={{ color: accentColor }}>In Stock</span>
             </div>
          </div>
        </div>
        
        {/* RIGHT CONTENT SECTION - Rich Metadata */}
        <div className="flex-1 p-6 flex flex-col justify-between">
           <div className="space-y-2">
              <div className="flex items-center gap-2">
                 {visibility.category && (
                    <SlotWrapper 
                      slot="category"
                      activeSlot={activeSlot}
                      onSlotClick={onSlotClick}
                      accentColor={accentColor}
                    >
                       <span className="text-[10px] font-black uppercase tracking-tighter" style={{ color: accentColor }}>{category}</span>
                    </SlotWrapper>
                 )}
                 <div className={`w-1 h-1 rounded-full ${isDark ? 'bg-white/20' : 'bg-black/20'}`} />
                 {visibility.rating && (
                   <SlotWrapper slot="rating" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor} className="flex items-center gap-1">
                      <Star size={10} className="fill-yellow-500 text-yellow-500" />
                      <span className={`text-[10px] font-bold opacity-60 ${textMain}`}>{rating}</span>
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
                  <h3 className={`text-xl font-black leading-tight line-clamp-1 truncate w-48 ${textMain}`}>
                    {title}
                  </h3>
                </SlotWrapper>
              )}

              {/* SKU & Spec Badges */}
              <div className="flex flex-wrap gap-2 pt-1 opacity-60">
                 {visibility.sku && (
                   <SlotWrapper 
                     slot="sku"
                     activeSlot={activeSlot}
                     onSlotClick={onSlotClick}
                     accentColor={accentColor}
                   >
                     <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md border ${isDark ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
                        <Tag size={10} className={textMuted} />
                        <span className={`text-[8px] font-mono tracking-tighter ${textMuted}`}>{sku}</span>
                     </div>
                   </SlotWrapper>
                 )}
                 {visibility.stock && (
                   <SlotWrapper 
                     slot="stock"
                     activeSlot={activeSlot}
                     onSlotClick={onSlotClick}
                     accentColor={accentColor}
                   >
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md border ${isDark ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
                        <Box size={10} className={textMuted} />
                        <span className={`text-[8px] font-mono tracking-tighter ${textMuted}`}>{stock} units</span>
                      </div>
                   </SlotWrapper>
                 )}
              </div>
           </div>

           <div className="space-y-4">
               {/* Feature Tags Wrapper */}
               {visibility.features && (
                 <SlotWrapper slot="features" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                    <div className={`flex gap-4 border-t pt-4 ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                        <div className="flex items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all">
                            <Truck size={14} style={{ color: accentColor }} />
                            <span className={`text-[9px] font-bold uppercase tracking-widest ${textMuted} opacity-40`}>Free Express</span>
                        </div>
                        <div className="flex items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all">
                            <Heart size={14} className="text-secondary" />
                            <span className={`text-[9px] font-bold uppercase tracking-widest ${textMuted} opacity-40`}>Wishlist</span>
                        </div>
                    </div>
                 </SlotWrapper>
               )}

               {/* Variants (Colors & Sizes) */}
               <div className="flex gap-6 items-center">
                  {visibility.colors && (
                     <SlotWrapper slot="colors" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                        <div className="flex gap-1.5">
                           {(data.availableColors || ['#000', '#2563eb', '#ef4444']).slice(0, 3).map((color: any, i: number) => {
                              const colorValue = typeof color === 'object' ? color.value || color.hex : color;
                              const selected = isSelected(i);
                              return (
                                <div 
                                  key={i} 
                                  onClick={() => onVariantSelect?.(i)}
                                  className={`w-3 h-3 rounded-full border cursor-pointer transition-all ${selected ? 'ring-2 ring-primary ring-offset-1 ring-offset-white dark:ring-offset-gray-900 scale-110' : 'opacity-40 hover:opacity-100'}`}
                                  style={{ 
                                    backgroundColor: colorValue,
                                    borderColor: selected ? accentColor : 'transparent',
                                    ['--tw-ring-color' as any]: selected ? accentColor : 'transparent'
                                  }}
                                />
                              );
                           })}
                        </div>
                     </SlotWrapper>
                  )}

                  {visibility.sizes && (
                     <SlotWrapper slot="sizes" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                        <div className="flex gap-1">
                           {(data.availableSizes || ['S', 'M', 'L']).slice(0, 2).map((size: any, i: number) => (
                              <span key={i} className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${isDark ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'} ${textMuted}`}>
                                 {typeof size === 'object' ? size.label : size}
                              </span>
                           ))}
                        </div>
                     </SlotWrapper>
                  )}
               </div>

              <div className="flex items-center justify-between gap-4">
                {visibility.price && (
                  <SlotWrapper 
                    slot="price"
                    activeSlot={activeSlot}
                    onSlotClick={onSlotClick}
                    accentColor={accentColor}
                  >
                    <div className="flex flex-col">
                      <span className={`text-[8px] font-black uppercase tracking-[0.2em] -mb-1 ml-1 ${textMuted} opacity-50`}>MSRP</span>
                      <p className="text-2xl font-black" style={{ color: accentColor }}>
                        {formatDisplayValue(price, 'price')}
                      </p>
                    </div>
                  </SlotWrapper>
                )}

                {visibility.actions && (
                  <SlotWrapper 
                    slot="actions"
                    activeSlot={activeSlot}
                    onSlotClick={onSlotClick}
                    accentColor={accentColor}
                  >
                    <button className={`h-10 px-6 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center gap-2 group-hover:translate-y-[-2px] ${isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-black/90'}`}>
                       Quick View <Minimize2 size={12} className="rotate-45" />
                    </button>
                  </SlotWrapper>
                )}
              </div>
           </div>
        </div>
        
        {/* Subtle Decorative Hover Glow */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ backgroundColor: `${accentColor}10` }} />
    </div>
  );
};

export const mockData = {
  title: 'Bose QuietComfort Ultra Wireless Noise Cancelling Headphones',
  price: 429,
  category: 'Audio',
  sku: 'BOSE-QCU-BLK',
  stock: 56,
  rating: 4.9,
  reviewCount: 890,
  description: 'World-class noise cancellation, quieter than ever before. Breakthrough spatial audio for immersive listening.',
  imageUrl: '/src/assets/images/default-product-1.png',
  availableColors: ['#000000', '#f3f4f6'],
  availableSizes: ['Standard'],
};

export default HorizontalAdvancedTemplate;
