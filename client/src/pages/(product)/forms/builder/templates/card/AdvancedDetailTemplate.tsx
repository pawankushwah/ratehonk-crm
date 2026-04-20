import React from 'react';
import type { TemplateProps } from './common';
import { SlotWrapper } from './common';
import { formatDisplayValue } from '@/utils/dynamicRenderer';
import { Star, Minus, Plus, ShoppingCart } from 'lucide-react';
import defaultProductImage from '@/assets/images/default-product-1.png';

const AdvancedDetailTemplate: React.FC<TemplateProps> = ({ 
  data, 
  visibility, 
  accentColor, 
  bgBase,
  textMain,
  textMuted,
  activeSlot,
  onSlotClick,
  onVariantSelect,
  activeVariantIndex = 0,
  imageBaseURL
}) => {
  const { 
    title: initialTitle, 
    price: initialPrice, 
    imageUrl: initialImageUrl, 
    sku: initialSku,
    barcode: initialBarcode,
    reviewCount: initialReviewCount,
    rating: initialRating,
    availableColors = [],
    availableSizes = [],
    mapping = {},
    variants = [],
    allImages = [],
  } = (data || {}) as any;

  // Final property Resolution (Trusting parent props first)
  const d = data as any;
  const title = initialTitle || d.title || "Product Name";
  const sku = initialSku || d.sku || "";
  const barcode = initialBarcode || d.barcode || "";
  const rating = initialRating !== undefined ? initialRating : (d.rating || 5.0);
  const reviewCount = initialReviewCount !== undefined ? initialReviewCount : (d.reviewCount || 455);

  // Variant resolution logic
  const processedVariants = variants;
  const activeVariant = processedVariants[activeVariantIndex] || processedVariants[0];

  // Scoped values
  const displayPrice = initialPrice !== undefined && initialPrice !== '—' ? initialPrice : (activeVariant?.price || 0);
  const imageUrl = d.imageUrl || d.image || d[mapping.image];
  const displayImages = (activeVariant?.images && activeVariant.images.length > 0) 
    ? activeVariant.images 
    : (allImages.length > 0 ? allImages : [imageUrl]);

  const price = displayPrice;
  const [quantity, setQuantity] = React.useState(1);
  // Remove local selectedColor state, use activeVariantIndex prop instead

  return (
    <div className={`transition-all duration-300 m-auto w-[300px] max-h-[500px] h-fit ${bgBase} border rounded-4xl overflow-hidden flex flex-col`}>
        {/* TOP IMAGE SECTION (1:1 Aspect Ratio) */}
        <div className={`relative aspect-[4/3] w-full pt-5 border-b overflow-hidden bg-gray-50 dark:bg-gray-900/50`}>
          {visibility.image && (
            <SlotWrapper 
              slot="image" 
              className="w-full h-full"
              activeSlot={activeSlot}
              onSlotClick={onSlotClick}
              accentColor={accentColor}
            >
              <img 
                src={imageBaseURL+displayImages[0]} 
                alt={title} 
                className="w-full h-full object-contain hover:scale-105 transition-transform duration-500" 
              />
            </SlotWrapper>
          )}
        </div>
        
        <div className="p-5 flex flex-col flex-1">
          {/* Header Info */}
          <div className="mb-4">
              {visibility.title && (
                 <SlotWrapper 
                   slot="title"
                   activeSlot={activeSlot}
                   onSlotClick={onSlotClick}
                   accentColor={accentColor}
                   className="mb-1"
                 >
                     <h3 className={`text-base font-bold leading-tight ${textMain}`}>
                       {title}
                     </h3>
                     <div className="flex flex-col gap-1 mt-1">
                        {visibility.sku && sku && (
                          <SlotWrapper slot="sku" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                            <span className={`text-[8px] font-black uppercase tracking-widest ${textMuted}`}>SKU: {sku}</span>
                          </SlotWrapper>
                        )}
                        {visibility.barcode && barcode && (
                          <SlotWrapper slot="barcode" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                            <span className={`text-[8px] font-mono tracking-widest ${textMuted}`}>{barcode}</span>
                          </SlotWrapper>
                        )}
                     </div>
                  </SlotWrapper>
              )}
              
              <div className="flex items-center gap-2 mt-2">
                 {visibility.price && (
                    <SlotWrapper 
                      slot="price"
                      activeSlot={activeSlot}
                      onSlotClick={onSlotClick}
                      accentColor={accentColor}
                    >
                       <p className={`text-xl font-extrabold ${textMain}`}>
                         {formatDisplayValue(price, 'price')}
                       </p>
                    </SlotWrapper>
                 )}
                 {visibility.rating && (
                   <SlotWrapper slot="rating" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor} className="flex items-center gap-1.5">
                     <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} size={10} className="fill-yellow-400 text-yellow-400" />
                        ))}
                     </div>
                     <span className={`text-[10px] ${textMuted}`}>({reviewCount})</span>
                   </SlotWrapper>
                 )}
              </div>
          </div>

          {/* Variant Selection (Colors & Sizes) */}
          <div className="mb-4 space-y-4">
             {visibility.colors && (
                <SlotWrapper slot="colors" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                   <div className="flex gap-2.5">
                       {(data.availableColors || ['#000', '#2563eb', '#ef4444']).map((color: any, i: number) => {
                         const colorValue = typeof color === 'object' ? color.color || color.value || color.hex : color;
                         const isSelected = activeVariantIndex === i;
                         return (
                           <button 
                             key={i} 
                             onClick={() => onVariantSelect?.(i)}
                             className={`w-6 h-6 rounded-full border-2 transition-all ${isSelected ? 'border-primary ring-2 ring-primary/20 scale-110' : 'border-white dark:border-gray-800'}`}
                             style={{ 
                               backgroundColor: colorValue,
                               borderColor: isSelected ? accentColor : undefined 
                             }}
                           />
                         );
                       })}
                   </div>
                </SlotWrapper>
             )}

             {visibility.sizes && (
                <SlotWrapper slot="sizes" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                   <div className="flex flex-wrap gap-2">
                      {(data.availableSizes || ['S', 'M', 'L']).map((size: any, i: number) => (
                        <button 
                          key={i}
                          className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all ${i === 0 ? 'bg-primary text-white' : `bg-white/5 ${textMain}`}`}
                          style={i === 0 ? { backgroundColor: accentColor, borderColor: accentColor } : {}}
                        >
                          {typeof size === 'object' ? size.label : size}
                        </button>
                      ))}
                   </div>
                </SlotWrapper>
             )}

             <div className="flex gap-2">
                <div className={`flex items-center border rounded-lg overflow-hidden flex-1 max-w-[120px]`}>
                   <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className={`p-2 hover:bg-black/5 transition-colors ${textMain}`}>
                     <Minus size={12} />
                   </button>
                   <input type="text" value={quantity} readOnly className={`w-10 text-center text-xs font-bold bg-transparent ${textMain}`} />
                   <button onClick={() => setQuantity(quantity + 1)} className={`p-2 hover:bg-black/5 transition-colors ${textMain}`}>
                     <Plus size={12} />
                   </button>
                </div>
                
                {visibility.actions && (
                  <SlotWrapper slot="actions" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor} className="flex-1">
                    <button className="w-full h-10 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:brightness-110 shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2" style={{ backgroundColor: accentColor }}>
                       <ShoppingCart size={14} /> Add
                    </button>
                  </SlotWrapper>
                )}
             </div>
          </div>
        </div>
      </div>
  );
};

export const mockData = {
  name: 'Keychron Q1 Max QMK/VIA Wireless Custom Mechanical Keyboard',
  title: 'Keychron Q1 Max QMK/VIA Wireless Custom Mechanical Keyboard',
  sales_price: 209,
  price: 209,
  category: 'Keyboards',
  sku: 'KC-Q1M-BRWN',
  stock: 12,
  rating: 5.0,
  reviewCount: 320,
  description: 'A 75% layout wireless mechanical keyboard with double-gasket mount design and full CNC aluminum body.',
  allImages: [defaultProductImage],
  imageUrl: defaultProductImage,
  availableColors: ['#1f2937', '#6b7280', '#9ca3af'],
  availableSizes: ['Red Switch', 'Brown Switch', 'Blue Switch'],
};

export default AdvancedDetailTemplate;
