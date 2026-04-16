import React from 'react';
import type { TemplateProps } from './common';
import { SlotWrapper } from './common';
import { formatDisplayValue } from '@/utils/dynamicRenderer';
import { Heart, ChevronLeft, ChevronRight, Wallet } from 'lucide-react';

const CarouselTemplate: React.FC<TemplateProps> = ({ 
  data, 
  visibility, 
  accentColor, 
  shadowClass, 
  fontClass,
  activeSlot,
  onSlotClick,
  onVariantSelect,
  activeVariantIndex = 0,
  imageBaseURL,
}) => {
  const { 
    title: initialTitle, 
    price: initialPrice, 
    imageUrl: initialImageUrl, 
    description: initialDescription,
    availableColors = [],
    availableSizes = [],
    variants = [],
    allImages = [],
    mapping= {}
  } = (data || {}) as any;

  // Final property Resolution (Trusting parent props first)
  const d = data as any;
  const title = initialTitle || d.title || "Product Name";
  const description = initialDescription || d.description || "Premium quality item.";

  // Variant resolution logic
  const processedVariants = variants;
  const activeVariant = processedVariants[activeVariantIndex] || processedVariants[0];

  // Scoped values
  const displayPrice = initialPrice !== undefined && initialPrice !== '—' ? initialPrice : (activeVariant?.price || 0);
  const imageUrl = d.imageUrl || d.image || d[mapping.image];
  const displayImages = (activeVariant?.images && activeVariant.images.length > 0) 
    ? activeVariant.images 
    : (allImages.length > 0 ? allImages : [imageUrl]);

  const images = displayImages;
  const totalSlides = images.length;
  const [currentSlide, setCurrentSlide] = React.useState(1);
  const price = displayPrice;

  // Reset slide index if product/variant changes
  React.useEffect(() => {
    setCurrentSlide(1);
  }, [activeVariantIndex, initialImageUrl]);

  const nextSlide = () => setCurrentSlide(prev => (prev % totalSlides) + 1);
  const prevSlide = () => setCurrentSlide(prev => (prev === 1 ? totalSlides : prev - 1));

  return (
    <div className={`transition-all duration-300 m-auto w-[300px] h-full p-5 flex flex-col bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700 ${shadowClass} ${fontClass} rounded-xl overflow-hidden gap-4`}>
        {/* CAROUSEL SECTION (1:1 Aspect Ratio) */}
          <div className="relative aspect-[4/3] w-full h-[200px] bg-gray-50 dark:bg-gray-900/50 ">
            {visibility.image && (
              <SlotWrapper 
                slot="image" 
                className="w-full h-full"
                activeSlot={activeSlot}
                onSlotClick={onSlotClick}
                accentColor={accentColor}
              >
                <img 
                  src={imageBaseURL + images[currentSlide - 1]} 
                  alt={`${title} - Slide ${currentSlide}`} 
                  className="w-full h-full object-contain transition-transform duration-700 hover:scale-105" 
                />
              </SlotWrapper>
            )}
          </div>
        
        {/* INFO SECTION */}
        <div className="flex flex-col gap-2">
          {/* Navigation Controls */}
          <div className="flex items-center justify-between px-1">
            <button 
              onClick={prevSlide}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft size={16} className="text-gray-500" />
            </button>
            
            <span className="text-[10px] font-black uppercase text-gray-400">
              {currentSlide} <span className="mx-1 text-gray-300">of</span> {totalSlides}
            </span>

            <button 
              onClick={nextSlide}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronRight size={16} className="text-gray-500" />
            </button>
          </div>
           {visibility.title && (
              <SlotWrapper 
                slot="title"
                activeSlot={activeSlot}
                onSlotClick={onSlotClick}
                accentColor={accentColor}
              >
                 <a href="#" className="text-base font-bold text-gray-900 dark:text-white hover:underline transition-all line-clamp-1 block">
                   {title}
                 </a>
              </SlotWrapper>
           )}
            {visibility.description && (
               <SlotWrapper slot="description" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                 <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed italic">
                    {description}
                 </p>
               </SlotWrapper>
            )}
        </div>

        {/* INSTALLMENT BADGE */}
        {visibility.badge && (
          <SlotWrapper slot="badge" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
            <div className="py-2.5 px-3 bg-primary/5 dark:bg-primary/20 border border-primary/10 rounded-lg flex items-center gap-2">
               <Wallet size={14} className="text-primary" style={{ color: accentColor }} />
               <span className="text-[9px] font-bold text-primary leading-none" style={{ color: accentColor }}>
                  Buy in installments with Flowbite Wallet
               </span>
            </div>
          </SlotWrapper>
        )}

        {/* PRICING & VARIANTS */}
        <div className="space-y-4">
           <div className="flex items-center justify-between">
              {visibility.price && (
                 <SlotWrapper slot="price" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">
                      {formatDisplayValue(price, 'price')}
                    </p>
                 </SlotWrapper>
              )}
              
              {visibility.colors && (
                <SlotWrapper slot="colors" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                  <div className="flex gap-1.5">
                    {(data.availableColors || ['#000', '#2563eb', '#ef4444']).map((color: any, i: number) => {
                       const colorValue = typeof color === 'object' ? color.value || color.hex : color;
                       const isSelected = activeVariantIndex === i;
                       return (
                         <div 
                           key={i} 
                           onClick={() => onVariantSelect?.(i)}
                           className={`w-4 h-4 rounded-full border border-white dark:border-gray-800 transition-all cursor-pointer ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-white dark:ring-offset-gray-800' : 'opacity-40'}`}
                           style={{ 
                             backgroundColor: colorValue,
                             borderColor: isSelected ? accentColor : undefined,
                             ['--tw-ring-color' as any]: isSelected ? accentColor : 'transparent'
                           }}
                         />
                       );
                    })}
                  </div>
                </SlotWrapper>
              )}
           </div>

           {visibility.sizes && (
              <SlotWrapper slot="sizes" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                <div className="flex flex-wrap gap-1.5">
                  {(data.availableSizes || ['S', 'M', 'L']).map((size: any, i: number) => (
                    <span 
                      key={i} 
                      className={`text-[8px] font-black uppercase px-2 py-1 rounded border ${i === 0 ? 'bg-primary text-white border-primary' : 'bg-gray-50 text-gray-400 border-gray-100 dark:bg-gray-900 dark:border-gray-700'}`}
                      style={i === 0 ? { backgroundColor: accentColor, borderColor: accentColor } : {}}
                    >
                      {typeof size === 'object' ? size.label : size}
                    </span>
                  ))}
                </div>
              </SlotWrapper>
           )}
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-2">
           {visibility.actions && (
             <>
                <button className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all flex items-center justify-center gap-2">
                   <Heart size={14} /> Wishlist
                </button>
                <SlotWrapper slot="actions" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor} className="flex-1">
                  <button 
                    className="w-full py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:brightness-110 shadow-lg shadow-primary/20 transition-all"
                    style={{ backgroundColor: accentColor }}
                  >
                     Buy Now
                  </button>
                </SlotWrapper>
             </>
           )}
        </div>
      </div>
  );
};

export const mockData = {
  title: 'PlayStation 5 Console - Slim Edition',
  price: 499,
  category: 'Consoles',
  sku: 'PS5-SLIM-WHT',
  stock: 24,
  rating: 4.8,
  reviewCount: 2400,
  description: 'Experience lightning fast loading with an ultra-high speed SSD, deeper immersion with support for haptic feedback and 3D Audio.',
  imageUrl: '/src/assets/images/default-product-1.png',
  availableColors: ['#ffffff', '#000000', '#2563eb'],
  availableSizes: ['Disc Edition', 'Digital Edition'],
};

export default CarouselTemplate;
