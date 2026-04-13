import React from 'react';
import type { TemplateProps } from './common';
import { SlotWrapper } from './common';
import { formatDisplayValue } from '@/utils/dynamicRenderer';
import { Star, Heart } from 'lucide-react';

const HorizontalDetailTemplate: React.FC<TemplateProps> = ({ 
  data, 
  visibility, 
  accentColor, 
  bgBase,
  textMain, 
  textMuted,
  borderBase, 
  shadowClass, 
  fontClass,
  activeSlot,
  onSlotClick
}) => {
  const { title, price, imageUrl, rating = 5.0, description = "Premium quality hardware designed for pro users. Features M3 chip technology." } = data;
  const [selectedColor, setSelectedColor] = React.useState(0);

  return (
    <div className={`transition-all duration-300 m-auto min-w-[350px] w-full h-[220px] ${bgBase} ${borderBase} ${shadowClass} ${fontClass} rounded-3xl overflow-hidden flex flex-row border`}>
        {/* LEFT IMAGE SECTION */}
        <div className={`aspect-4/5 flex items-center justify-center relative border-r overflow-hidden ${borderBase} bg-gray-50 dark:bg-gray-900/50`}>
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
                className="w-full h-full object-contain grayscale-[0.2] hover:grayscale-0 transition-transform duration-700 hover:scale-110" 
              />
            </SlotWrapper>
          )}
        </div>
        
        {/* RIGHT CONTENT SECTION */}
        <div className="flex-1 p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-col justify-between items-start mb-1">
              {visibility.title && (
                <SlotWrapper 
                  slot="title"
                  activeSlot={activeSlot}
                  onSlotClick={onSlotClick}
                  accentColor={accentColor}
                  className="flex-1 mr-4"
                >
                  <h3 className={`text-base font-bold leading-tight line-clamp-1 ${textMain}`}>
                    {title}
                  </h3>
                </SlotWrapper>
              )}
            {visibility.rating && (
              <div className="flex items-center gap-1 shrink-0">
                <SlotWrapper slot="rating" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor} className="flex items-center gap-1">
                  <Star size={12} className="fill-yellow-400 text-yellow-400" />
                  <span className={`text-[10px] font-bold ${textMuted}`}>{rating}</span>
                </SlotWrapper>
              </div>
            )}
          </div>
          
          {visibility.description && (
            <SlotWrapper slot="description" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
              <p className={`text-[10px] line-clamp-2 mt-1 leading-relaxed ${textMuted}`}>
                {description}
              </p>
            </SlotWrapper>
          )}

            <div className="flex items-center gap-4 mt-4">
              {visibility.price && (
                <SlotWrapper 
                  slot="price"
                  activeSlot={activeSlot}
                  onSlotClick={onSlotClick}
                  accentColor={accentColor}
                >
                  <p className={`text-xl font-black ${textMain}`}>
                    {formatDisplayValue(price, 'price')}
                  </p>
                </SlotWrapper>
              )}

              {/* Variants (Colors & Sizes) */}
              <div className="flex gap-4 items-center">
                 {visibility.colors && (
                   <SlotWrapper slot="colors" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                     <div className="flex gap-1.5">
                       {(data.availableColors || ['#000', '#2563eb', '#ef4444']).slice(0, 3).map((color: any, i: number) => {
                         const colorValue = typeof color === 'object' ? color.value || color.hex : color;
                         return (
                           <div 
                             key={i} 
                             onClick={() => setSelectedColor(i)}
                             className={`w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/10 transition-all cursor-pointer ${selectedColor === i ? 'ring-2 ring-primary/40 scale-110' : 'opacity-40'}`}
                             style={{ 
                               backgroundColor: colorValue,
                               borderColor: selectedColor === i ? accentColor : undefined,
                               ['--tw-ring-color' as any]: selectedColor === i ? accentColor : 'transparent'
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
                         <span key={i} className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded border ${borderBase} ${textMuted} bg-black/5 dark:bg-white/5`}>
                           {typeof size === 'object' ? size.label : size}
                         </span>
                       ))}
                     </div>
                   </SlotWrapper>
                 )}
              </div>
            </div>
          </div>

          <div className={`flex gap-2 mt-4 pt-4 border-t ${borderBase}`}>
            <button className="flex-1 py-2.5 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:brightness-110 shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2" style={{ backgroundColor: accentColor }}>
              Quick Buy
            </button>
            <button className={`p-2.5 rounded-lg border text-gray-400 hover:text-red-500 transition-colors ${borderBase}`}>
              <Heart size={14} />
            </button>
          </div>
        </div>
      </div>
  );
};

export const mockData = {
  title: 'Apple MacBook Pro 14", M3 Pro Chip, 18GB RAM, 512GB SSD',
  price: 1999,
  category: 'Laptops',
  sku: 'MBP-14-M3P-SLV',
  stock: 45,
  rating: 4.9,
  reviewCount: 156,
  description: 'The most advanced chips ever built for a personal computer. M3 Pro and M3 Max push performance even further.',
  imageUrl: '/assets/images/default-product-2.png',
  availableColors: ['#94a3b8', '#1e293b'],
  availableSizes: ['14-inch', '16-inch'],
};

export default HorizontalDetailTemplate;
