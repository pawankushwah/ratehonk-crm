import React from 'react';
import type { TemplateProps } from './common';
import { SlotWrapper } from './common';
import { formatDisplayValue } from '@/utils/dynamicRenderer';
import { Star, ShoppingBag } from 'lucide-react';

const HorizontalUniversalTemplate: React.FC<TemplateProps> = ({ 
  data, 
  context,
  visibility, 
  accentColor, 
  isDark,
  textMain,
  textMuted,
  borderBase,
  shadowClass, 
  fontClass,
  activeSlot,
  onSlotClick
}) => {
  const mapping = data?.mapping || (context?.form_schema?.design?.mapping) || context?.design?.mapping || {};
  const d = data as any;
  const title = d.title || d[mapping.title];
  const price = d.price !== undefined ? d.price : d[mapping.price];
  const imageUrl = d.imageUrl || d.image || d[mapping.image];
  const category = d.category || d[mapping.category] || 'Featured';
  const rating = d.rating !== undefined ? d.rating : (d[mapping.rating] || 4.8);
  const reviewCount = d.reviewCount !== undefined ? d.reviewCount : (d[mapping.reviewCount] || 0);
  const promo = d.promo || d[mapping.promo] || "SALE";
  const description = d.description || d[mapping.description];
  const availableColors = d.availableColors || d[mapping.colors] || [];
  const availableSizes = d.availableSizes || d[mapping.sizes] || [];
  const mappedColor = d.color || d[mapping.colors];

  const [selectedColor, setSelectedColor] = React.useState(0);


  return (
    <div className={`transition-all duration-300 m-auto w-full h-[220px] flex flex-row ${isDark ? 'bg-white/5' : 'bg-black/5'} backdrop-blur-3xl shadow-2xl relative ${shadowClass} ${fontClass} rounded-3xl overflow-hidden border ${borderBase}`}>
        {/* LEFT IMAGE SECTION - Symmetrical 1:1 Aspect for Row */}
        <div className={`relative aspect-4/5 overflow-hidden border-r ${isDark ? 'bg-white/5' : 'bg-black/5'} ${borderBase}`}>
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
                className="w-full h-full object-contain grayscale-[0.2] hover:grayscale-0 transition-all duration-700 hover:scale-110" 
              />
            </SlotWrapper>
          )}

           {/* Badge Overlay */}
           {visibility.badge && (
             <div className="absolute bottom-4 left-4">
                <SlotWrapper slot="badge" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                   <div className={`px-3 py-1 backdrop-blur-md border rounded-full ${isDark ? 'bg-black/60 border-white/10' : 'bg-white/60 border-black/10'}`}>
                      <span className="text-[8px] font-black uppercase tracking-widest italic" style={{ color: accentColor }}>In Stock</span>
                   </div>
                </SlotWrapper>
             </div>
           )}

           {/* Promo Overlay */}
           {visibility.promo && (
             <div className="absolute bottom-4 left-4">
                <SlotWrapper slot="promo" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                   <div className="px-3 py-1 bg-rose-500 text-white rounded-full shadow-lg shadow-rose-500/20">
                      <span className="text-[8px] font-black uppercase tracking-widest">{promo}</span>
                   </div>
                </SlotWrapper>
             </div>
           )}
        </div>
        
        {/* RIGHT CONTENT SECTION */}
        <div className="flex-1 p-6 flex flex-col justify-between">
          <div className="space-y-4">
             <div className="flex justify-between items-start">
                <div className="space-y-1">
                   {visibility.category && (
                      <SlotWrapper 
                        slot="category"
                        activeSlot={activeSlot}
                        onSlotClick={onSlotClick}
                        accentColor={accentColor}
                      >
                         <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: accentColor }}>{category}</span>
                      </SlotWrapper>
                   )}
                   {visibility.title && (
                      <SlotWrapper 
                        slot="title"
                        activeSlot={activeSlot}
                        onSlotClick={onSlotClick}
                        accentColor={accentColor}
                      >
                         <h3 className={`text-lg font-extrabold leading-tight tracking-tight line-clamp-1 truncate w-48 ${textMain}`}>
                           {title}
                         </h3>
                      </SlotWrapper>
                   )}
                   {visibility.description && (
                      <SlotWrapper 
                        slot="description"
                        activeSlot={activeSlot}
                        onSlotClick={onSlotClick}
                        accentColor={accentColor}
                      >
                         <p className={`text-[10px] leading-relaxed line-clamp-1 ${textMuted} mt-1`}>
                           {description || "Premium quality item for modern lifestyles."}
                         </p>
                      </SlotWrapper>
                   )}
                </div>
                 {visibility.rating && (
                   <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
                      <SlotWrapper slot="rating" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor} className="flex items-center gap-1.5">
                        <Star size={10} className="fill-yellow-400 text-yellow-400" />
                        <span className={`text-[10px] font-bold ${textMuted}`}>{rating}</span>
                      </SlotWrapper>
                      {visibility.reviewCount && (
                        <SlotWrapper slot="reviewCount" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                          <span className={`text-[8px] font-medium opacity-50 ${textMuted}`}>({reviewCount})</span>
                        </SlotWrapper>
                      )}
                   </div>
                 )}
             </div>

             {visibility.colors && (
               <div className="flex gap-2 items-center">
                  <SlotWrapper slot="colors" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor} className="flex gap-2">
                    {availableColors.length > 0 ? (
                      availableColors.map((color: any, i: number) => (
                        <button 
                          key={i} 
                          onClick={() => setSelectedColor(i)}
                          className={`w-4 h-4 rounded-full border transition-all ${selectedColor === i ? 'ring-2 ring-primary/40 scale-110' : 'border-white/20'}`}
                          style={{ backgroundColor: typeof color === 'object' ? color.value || color.hex : color }}
                          title={typeof color === 'object' ? color.label : color}
                        />
                      ))
                    ) : (
                      <>
                        {mappedColor && (
                          <button 
                            onClick={() => setSelectedColor(-1)}
                            className={`w-4 h-4 rounded-full border transition-all ${selectedColor === -1 ? 'ring-2 ring-primary/40 scale-110' : 'border-white/20'}`}
                            style={{ backgroundColor: mappedColor }}
                            title="Mapped Color"
                          />
                        )}
                        {/* {colors.map((color, i) => (
                          <button 
                            key={i} 
                            onClick={() => setSelectedColor(i)}
                            className={`w-4 h-4 rounded-full ${color.class} border transition-all ${selectedColor === i ? 'ring-2 ring-primary/40 scale-110' : 'border-white/20'}`}
                            title={color.name}
                          />
                        ))} */}
                      </>
                    )}
                  </SlotWrapper>
               </div>
             )}

             {visibility.sizes && (
               <div className="flex gap-1 items-center">
                  <SlotWrapper slot="sizes" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor} className="flex gap-1">
                    {availableSizes.length > 0 ? (
                      availableSizes.slice(0, 3).map((size: any, i: number) => (
                        <span key={i} className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border border-white/10 ${textMuted} bg-white/5`}>
                          {typeof size === 'object' ? size.label : size}
                        </span>
                      ))
                    ) : (
                      ['S', 'M', 'L'].map(s => (
                        <span key={s} className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border border-white/10 ${textMuted} bg-white/5`}>
                          {s}
                        </span>
                      ))
                    )}
                  </SlotWrapper>
               </div>
             )}
          </div>

          <div className={`flex items-center justify-between border-t pt-4 ${isDark ? 'border-white/5' : 'border-black/5'}`}>
             {visibility.price && (
                <SlotWrapper 
                  slot="price"
                  activeSlot={activeSlot}
                  onSlotClick={onSlotClick}
                  accentColor={accentColor}
                >
                   <div className="flex flex-col">
                      <span className={`text-[8px] font-bold uppercase tracking-widest ${textMuted} opacity-50`}>Starting at</span>
                      <p className={`text-2xl font-black ${textMain}`}>
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
                   <button className="flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-xl hover:brightness-110 transition-all active:scale-95" style={{ backgroundColor: accentColor }}>
                      <ShoppingBag size={14} /> Buy Now
                   </button>
                </SlotWrapper>
             )}
          </div>
        </div>
      </div>
  );
};

export const mockData = {
  title: 'iPad Pro 13-inch (M4): Ultra Retina XDR display, 512GB',
  price: 1299,
  category: 'Tablets',
  sku: 'IPAD-P13-M4-512',
  stock: 32,
  rating: 4.7,
  reviewCount: 450,
  promo: 'New Arrival',
  description: 'The thinnest Apple product ever. Featuring the outrageous performance of the M4 chip and a breakthrough Ultra Retina XDR display.',
  imageUrl: '/assets/images/default-product-2.png',
  availableColors: ['#1e293b', '#e2e8f0'],
  availableSizes: ['11-inch', '13-inch'],
};

export default HorizontalUniversalTemplate;
