import React, { useState } from 'react';
import type { TemplateProps } from '../card/common';
import { SlotWrapper } from '../card/common';
import { formatDisplayValue } from '@/utils/dynamicRenderer';
import { Star, Info, ChevronDown, Check } from 'lucide-react';
import CustomSelect from '@/components/products/CustomSelect';

const FlowbiteAdvancedDetailTemplate: React.FC<TemplateProps> = ({
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
  context
}) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const selectedColor = activeVariantIndex;
  const setSelectedColor = (idx: number) => onVariantSelect?.(idx);
  const [selectedSize, setSelectedSize] = useState(0);
  const [quantity, setQuantity] = useState('1');

  const mapping = context?.form_schema?.design?.mapping || context?.design?.mapping || context?.mapping || {};
  const formSchema = context?.form_schema?.items || context?.items || context?.schema || (Array.isArray(context) ? context : []);

  const mappedHighlightsId = mapping.highlights;

  const dynamicKeyValues = formSchema.filter((it: any) =>
    it.kind === 'field' && it.type === 'key-value' &&
    ((mappedHighlightsId && it.id === mappedHighlightsId) || !mappedHighlightsId)
  );

  const {
    title: rawTitle,
    price: rawPrice,
    imageUrl: rawImageUrl,
    description: dataDescription,
    rating: dataRating,
    reviewCount: dataReviewCount,
    availableColors = [],
    availableSizes = [],
    stock: rawStock,
    allImages = [],
    variants = []
  } = (data || {}) as any;

  // Final property Resolution (Trusting parent props first)
  const d = data as any;
  const title = rawTitle || d.title || "Product Name";
  const price = rawPrice !== undefined && rawPrice !== '—' ? rawPrice : (d.price || 0);
  const imageUrl = rawImageUrl || d.imageUrl || d.image;
  const stock = rawStock !== undefined && rawStock !== '—' ? rawStock : (d.stock || 0);
  const rating = dataRating !== undefined && dataRating !== '—' ? dataRating : (d.rating || 5.0);
  const reviewCount = dataReviewCount !== undefined && dataReviewCount !== '—' ? dataReviewCount : (d.reviewCount || 0);
  const description = dataDescription || d.description || (data as any).description || "Premium quality item for modern lifestyles.";

  // Variant resolution logic (Centralized)
  const processedVariants = variants;
  const activeVariant = processedVariants[selectedColor] || processedVariants[0];

  const derivedSizes = React.useMemo(() => {
    const sizes = activeVariant?.size || [];
    const sizesArray = Array.isArray(sizes) ? sizes : [sizes].filter(Boolean);
    return sizesArray.length > 0 ? Array.from(new Set(sizesArray)) : (availableSizes || []);
  }, [activeVariant, availableSizes]);

  // Centralized values from props (already resolved by CardRenderer)
  const displayPrice = price;
  const displayStock = stock;
  const displayImages = (activeVariant?.images && activeVariant.images.length > 0)
    ? activeVariant.images
    : (allImages.length > 0 ? allImages : [imageUrl || "/src/assets/images/default-product-1.png"].flat().filter(Boolean));

  const images = displayImages;

  // Final Highlights Resolution
  const resolvedHighlights = React.useMemo(() => {
    // 1. Try specifically mapped field
    if (mappedHighlightsId && (data as any)[mappedHighlightsId]) {
      return (data as any)[mappedHighlightsId];
    }
    // 2. Try the 'highlights' property directly
    if ((data as any).highlights) {
      return (data as any).highlights;
    }
    // 3. Fallback to any Key-Value field in schema
    if (dynamicKeyValues.length > 0) {
      const firstFieldId = dynamicKeyValues[0].id;
      return (data as any)[firstFieldId] || [];
    }
    return [];
  }, [data, mappedHighlightsId, dynamicKeyValues]);

  return (
    <section className={`py-4 md:py-8 antialiased min-w-5xl w-full ${bgBase} ${textMain}`}>
      <div className="max-w-7xl px-4 mx-auto 2xl:px-0">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12 xl:gap-20 items-start">

          {/* GALLERY SECTION */}
          <div className="space-y-6">
            {visibility.image && (
              <SlotWrapper
                slot="image"
                activeSlot={activeSlot}
                onSlotClick={onSlotClick}
                accentColor={accentColor}
                className="w-full"
              >
                <div className="relative aspect-square overflow-hidden bg-black/5">
                  <img
                    className="w-full h-full object-contain p-8 transition-transform duration-700 hover:scale-110"
                    src={images[selectedImage]}
                    alt={title}
                  />
                </div>

                {/* THUMBNAILS */}
                <div className="flex gap-4 mt-8 no-scrollbar pb-2">
                  {images.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`w-15 h-15 rounded-xl border-2 transition-all p-2 shrink-0 bg-white/5 ${selectedImage === idx ? 'scale-105' : 'opacity-40 hover:opacity-100'}`}
                      style={{ width: '60px', height: '60px', borderColor: selectedImage === idx ? accentColor : 'transparent' }}
                    >
                      <img src={img} className="w-full h-full object-contain" alt={`View ${idx + 1}`} />
                    </button>
                  ))}
                </div>
              </SlotWrapper>
            )}
          </div>

          <div className="flex flex-col h-full space-y-8">
            <div className="space-y-4">
              {visibility.stock && (
                <SlotWrapper slot="stock" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                    {Number(displayStock) > 0 ? "In Stock" : "Out of Stock"}
                  </span>
                </SlotWrapper>
              )}

              {/* TITLE */}
              {visibility.title && (
                <SlotWrapper slot="title" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                  <h1 className="text-2xl font-black sm:text-3xl tracking-tight leading-tight">
                    {title}
                  </h1>
                </SlotWrapper>
              )}

              {/* RATING */}
              {visibility.rating && (
                <div className="flex flex-col gap-4">
                  <SlotWrapper slot="rating" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor} className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} size={14} className="text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className={`text-xs font-bold leading-none ${textMuted}`}>({Number(rating).toFixed(1)})</p>
                    <span className={`text-xs font-bold leading-none underline opacity-60 ${textMain}`}>
                      {reviewCount} Reviews
                    </span>
                  </SlotWrapper>
                </div>
              )}
            </div>

            {/* PRICE */}
            <div className="py-6 border-y border-slate-200 dark:border-white/5 flex items-center justify-between">
              {visibility.price && (
                <SlotWrapper slot="price" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                  <p className="text-4xl font-extrabold tracking-tighter tabular-nums">
                    {formatDisplayValue(displayPrice, 'price')}
                  </p>
                </SlotWrapper>
              )}

              {visibility.quantity && (
                <SlotWrapper slot="quantity" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <label className={`text-[10px] font-black uppercase tracking-widest ${textMuted}`}>Quantity</label>
                      <div className="relative group">
                        <Info size={12} className="text-slate-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-[9px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10 shadow-2xl">
                          Select Quantity
                        </div>
                      </div>
                    </div>
                    <CustomSelect
                      value={quantity}
                      options={[1, 2, 3, 4, 5].map(q => ({ label: q.toString(), value: q.toString() }))}
                      onChange={setQuantity}
                      triggerClassName="h-9 py-0 min-w-[80px]"
                      className="w-auto"
                    />
                  </div>
                </SlotWrapper>)}

            </div>

            {/* VARIANTS */}
            <div className="flex flex-col border-slate-200 dark:border-white/5">
              {visibility.colors && (
                <SlotWrapper slot="colors" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                  <div className="space-y-3">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${textMuted}`}>Choice Colour</span>
                    <div className="flex gap-3">
                      {(processedVariants.length > 0 ? processedVariants : availableColors).map((variant: any, i: number) => {
                        const colorValue = typeof variant === 'object' ? variant.color || variant.value || variant.hex : variant;
                        return (
                          <button
                            key={i}
                            onClick={() => setSelectedColor(i)}
                            className={`flex justify-center items-center w-10 h-10 rounded-full border-2 transition-all ${selectedColor === i ? 'scale-110' : 'border-black'}`}
                            style={{
                              backgroundColor: colorValue || '#ccc',
                              borderColor: selectedColor === i ? accentColor : 'transparent',
                              ['--tw-ring-color' as any]: selectedColor === i ? accentColor : 'transparent'
                            }}
                          >{selectedColor === i && <Check size={14} className='text-white mix-blend-difference m-auto' />}</button>
                        );
                      })}
                    </div>
                  </div>
                  <hr className='my-4 text-slate-200 dark:text-white/5' />
                </SlotWrapper>
              )}

              {visibility.sizes && (
                <SlotWrapper slot="sizes" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                  <div className="space-y-3">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${textMuted}`}>Configuration Selection</span>
                    <div className="flex flex-wrap gap-3">
                      {(derivedSizes.length > 0 ? derivedSizes : availableSizes).map((size: any, i: number) => {
                        return (
                          <button
                            key={i}
                            onClick={() => setSelectedSize(i)}
                            className={`px-6 py-2.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${selectedSize === i ? 'bg-primary text-white scale-105 shadow-xl' : `bg-white/5 hover:bg-white/10 ${textMain} border-slate-200 dark:border-white/10`}`}
                            style={{ backgroundColor: selectedSize === i ? accentColor : undefined, borderColor: selectedSize === i ? accentColor : undefined }}
                          >
                            {typeof size === 'object' ? size.label : String(size)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <hr className='my-4 text-slate-200 dark:text-white/5' />
                </SlotWrapper>
              )}
            </div>
          </div>
        </div>

        {/* EXTENDED SECTIONS */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-12 gap-16 border-t border-slate-200 dark:border-white/5 pt-16">
          <div className="lg:col-span-12">
            {visibility.description && (
              <SlotWrapper slot="description" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                <h2 className="text-xl font-black uppercase tracking-[0.2em] mb-8">About this item</h2>
                {description && description !== "Premium quality item for modern lifestyles." && (
                  <>
                    <ul className={`grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6 list-disc pl-5 ${textMuted} text-sm leading-relaxed`}>
                      {description.split('\n').filter(Boolean).slice(0, isDescriptionExpanded ? undefined : 6).map((line: any, idx: any) => {
                        const cleanLine = line.replace(/^\d+\.\s*/, '').trim();
                        if (!cleanLine) return null;
                        return <li key={idx} className="pl-2">{cleanLine}</li>;
                      })}
                    </ul>
                    {description.split('\n').filter(Boolean).length > 6 && (
                      <button
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        className="text-xs font-black uppercase tracking-widest flex items-center gap-2 mt-8 py-2 px-6 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-white/5 transition-all"
                        style={{ color: accentColor }}
                      >
                        {isDescriptionExpanded ? (
                          <>Read Less <ChevronDown size={14} className="rotate-180" /></>
                        ) : (
                          <>Read More <ChevronDown size={14} /></>
                        )}
                      </button>
                    )}
                  </>
                )}
              </SlotWrapper>
            )}
          </div>

          <div className="lg:col-span-12">
            {visibility.highlights && (
              <div>
                <SlotWrapper slot="highlights" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black uppercase tracking-[0.2em] mb-8">Key Specifications</h3>
                  </div>

                  {resolvedHighlights.length > 0 && (
                    <div className="space-y-6 max-w-2xl">
                      {resolvedHighlights.map((kv: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-12 group">
                          <span className={`text-sm font-bold ${textMain} min-w-[200px] shrink-0 transition-colors group-hover:text-primary`}>
                            {kv.key || 'Specification'}
                          </span>
                          <p className={`text-sm ${textMain} opacity-80`}>
                            {kv.value || '—'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </SlotWrapper>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export const mockData = {
  title: 'Apple Mac Studio, M2 Ultra Chip, 64GB RAM, 1TB SSD',
  price: 3999,
  category: 'Desktop PC',
  sku: 'MAC-STUDIO-M2U-64',
  stock: 8,
  rating: 4.9,
  reviewCount: 128,
  quantity: 1,
  description: 'Mac Studio is a desktop powerhouse. It packs outrageous performance into an unbelievably compact form.',
  imageUrl: ["/src/assets/images/default-product-1.png", "/src/assets/images/default-product-2.png", "/src/assets/images/default-product-3.png", "/src/assets/images/default-product-4.png"],
  availableColors: ['Silver', "red", "blue"],
  availableSizes: ['M2 Max', 'M2 Ultra'],
  highlights: [
    { key: 'Processor', value: 'Apple M2 Ultra' },
    { key: 'RAM', value: '64GB' },
    { key: 'Storage', value: '1TB SSD' },
    { key: 'Graphics', value: 'Integrated' },
    { key: 'Ports', value: 'Thunderbolt 4, HDMI, USB-A' },
    { key: 'Connectivity', value: 'Wi-Fi 6E, Bluetooth 5.3' },
    { key: 'Operating System', value: 'macOS' },
    { key: 'Dimensions', value: '7.7 x 7.7 x 3.7 inches' },
    { key: 'Weight', value: '7.7 pounds' },
    { key: 'Power', value: '500W' },
  ],
};

export default FlowbiteAdvancedDetailTemplate;
