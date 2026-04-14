import React from 'react';
import type { TemplateProps } from './common';
import { SlotWrapper } from './common';
import { formatDisplayValue } from '@/utils/dynamicRenderer';

const SimpleTemplate: React.FC<TemplateProps> = ({ 
  data, 
  visibility, 
  accentColor, 
  bgBase,
  textMain,
  textMuted,
  borderBase,
  activeSlot,
  onSlotClick,
  radiusClass = 'rounded-lg',
  shadowClass = 'shadow-md',
  paddingClass = 'p-6',
  fontClass = 'font-sans'
}) => {
  const { 
    title, price, imageUrl, 
    category = '',
    description
  } = data;

  return (
    <div className={`flex flex-col m-auto w-[320px] transition-all duration-300 overflow-hidden border ${bgBase} ${borderBase} ${radiusClass} ${shadowClass} ${fontClass}`}>
        <div className={`relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800`}>
          {visibility?.image !== false && (
            <SlotWrapper 
              slot="image" 
              className="w-full h-full"
              activeSlot={activeSlot}
              onSlotClick={onSlotClick}
              accentColor={accentColor}
            >
              <img 
                src={imageUrl || "/src/assets/images/default-product-1.png"} 
                alt={title || "Product"} 
                className="w-full h-full object-contain transition-transform duration-700 hover:scale-105" 
              />
            </SlotWrapper>
          )}
        </div>
        
        <div className={`flex-1 flex flex-col ${paddingClass}`}>
          {visibility?.category !== false && category && (
            <SlotWrapper 
              slot="category"
              activeSlot={activeSlot}
              onSlotClick={onSlotClick}
              accentColor={accentColor}
              className="mb-2"
            >
              <span className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>{category}</span>
            </SlotWrapper>
          )}

          {visibility?.title !== false && (
             <SlotWrapper 
               slot="title"
               activeSlot={activeSlot}
               onSlotClick={onSlotClick}
               accentColor={accentColor}
               className="mb-2"
             >
                <h3 className={`text-xl font-bold leading-tight line-clamp-2 ${textMain}`}>{title || "Product Name"}</h3>
             </SlotWrapper>
          )}
          
          {visibility?.description !== false && description && (
             <SlotWrapper 
               slot="description"
               activeSlot={activeSlot}
               onSlotClick={onSlotClick}
               accentColor={accentColor}
               className="mb-4"
             >
                <p className={`text-sm ${textMuted} line-clamp-2 leading-relaxed`}>{description}</p>
             </SlotWrapper>
          )}

          <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            {visibility?.price !== false && (
              <SlotWrapper 
                slot="price"
                activeSlot={activeSlot}
                onSlotClick={onSlotClick}
                accentColor={accentColor}
              >
                <p className={`text-2xl font-black ${textMain}`}>
                  {price ? formatDisplayValue(price, 'price') : '$0.00'}
                </p>
              </SlotWrapper>
            )}

            {visibility?.actions !== false && (
              <SlotWrapper 
                slot="actions"
                activeSlot={activeSlot}
                onSlotClick={onSlotClick}
                accentColor={accentColor}
              >
                <button 
                  type="button" 
                  className="px-5 py-2.5 text-sm font-bold text-white transition-all shadow-md hover:brightness-110"
                  style={{ backgroundColor: accentColor, borderRadius: '9999px' }}
                >
                  Buy Now
                </button>
              </SlotWrapper>
            )}
          </div>
        </div>
    </div>
  );
};

export const mockData = {
  title: 'Denim Tshirt',
  price: 49.99,
  category: 'Clothing',
  description: 'Premium quality denim tshirt designed for comfort and durability.',
  imageUrl: '/src/assets/images/default-product-1.png',
};

export default SimpleTemplate;
