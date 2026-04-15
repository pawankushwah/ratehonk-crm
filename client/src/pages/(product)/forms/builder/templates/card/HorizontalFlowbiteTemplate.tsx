import React from 'react';
import type { TemplateProps } from './common';
import { SlotWrapper } from './common';
import { formatDisplayValue } from '@/utils/dynamicRenderer';
import { Star, ShoppingCart } from 'lucide-react';

const HorizontalFlowbiteTemplate: React.FC<TemplateProps> = ({ 
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
  onSlotClick,
  onVariantSelect,
  activeVariantIndex = 0
}) => {
  const { 
    title: initialTitle, 
    price: initialPrice, 
    imageUrl: initialImageUrl, 
    sku: initialSku,
    availableColors = [],
    availableSizes = [],
    description: initialDescription,
    stock: initialStock,
    reviewCount: initialReviewCount,
    rating: initialRating,
    variants = []
  } = (data || {}) as any;

  // Final property Resolution (Trusting parent props first)
  const d = data as any;
  const title = initialTitle || d.title || "Product Name";
  const rating = initialRating !== undefined ? initialRating : (d.rating || 5.0);
  const reviewCount = initialReviewCount !== undefined ? initialReviewCount : (d.reviewCount || 455);

  // Variant resolution logic
  const processedVariants = variants;
  const activeVariant = processedVariants[activeVariantIndex] || processedVariants[0];

  // Scoped values
  const displayPrice = initialPrice !== undefined && initialPrice !== '—' ? initialPrice : (activeVariant?.price || 0);
  const displayImages = (activeVariant?.images && activeVariant.images.length > 0)
    ? activeVariant.images
    : [initialImageUrl || d.imageUrl || d.image || "/src/assets/images/default-product-1.png"].flat().filter(Boolean);

  const imageUrl = displayImages[0];
  const price = displayPrice;
  const isSelected = (i: number) => activeVariantIndex === i;

  return (
    <div className={`flex flex-row rounded-3xl border transition-all duration-300 m-auto w-full h-[220px] overflow-hidden ${bgBase} ${borderBase} ${shadowClass} ${fontClass}`}>
        {/* LEFT IMAGE SECTION */}
        <div className={`aspect-4/5 relative border-r overflow-hidden ${borderBase} bg-gray-50 dark:bg-gray-900/50`}>
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
                className="w-full h-full object-contain transition-all duration-700 hover:scale-110" 
              />
            </SlotWrapper>
          )}
        </div>
        
        {/* RIGHT CONTENT SECTION */}
        <div className="flex-1 p-6 flex flex-col justify-between">
          <div>
            <div className="mb-4 flex items-center justify-between gap-4">
              {visibility.badge && (
                <SlotWrapper 
                  slot="badge"
                  activeSlot={activeSlot}
                  onSlotClick={onSlotClick}
                  accentColor={accentColor}
                >
                  <span className="rounded bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800 dark:bg-primary-900 dark:text-primary-300"> Up to 35% off </span>
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
                <h3 className={`text-lg font-semibold leading-tight line-clamp-1 hover:underline ${textMain}`}>
                  {title}
                </h3>
              </SlotWrapper>
            )}

            {visibility.rating && (
              <div className="mt-2 flex items-center gap-2">
                <SlotWrapper slot="rating" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor} className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} size={12} className="fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${textMuted}`}>{rating}</p>
                  <p className={`text-xs font-medium ${textMuted}`}>({reviewCount})</p>
                </SlotWrapper>
              </div>
            )}

            {/* Variants (Colors & Sizes) */}
            <div className="mt-3 flex gap-4 items-center">
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
                           className={`w-3 h-3 rounded-full border transition-all cursor-pointer ${selected ? 'ring-2 ring-primary ring-offset-1 ring-offset-white dark:ring-offset-gray-900' : 'opacity-40 hover:opacity-100'}`}
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
                      <span key={i} className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200 uppercase">
                        {typeof size === 'object' ? size.label : size}
                      </span>
                    ))}
                  </div>
                </SlotWrapper>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
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
                <button type="button" className="inline-flex items-center rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-4  focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800" style={{ backgroundColor: accentColor }}>
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
  title: 'Apple Watch Ultra 2 [GPS + Cellular 49mm] Smartwatch',
  price: 799,
  category: 'Wearables',
  sku: 'AWU-2-49-ORG',
  stock: 18,
  rating: 4.8,
  reviewCount: 3200,
  description: 'The most rugged and capable Apple Watch. Designed for outdoor adventures and supercharged workouts.',
  imageUrl: '/src/assets/images/default-product-1.png',
  availableColors: ['#f97316', '#e2e8f0', '#0f172a'],
  availableSizes: ['49mm'],
};

export default HorizontalFlowbiteTemplate;
