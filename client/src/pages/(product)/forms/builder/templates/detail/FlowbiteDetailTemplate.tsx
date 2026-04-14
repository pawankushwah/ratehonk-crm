import { useMemo, useState } from 'react';
import type { TemplateProps } from '../card/common';
import { SlotWrapper } from '../card/common';
import { formatDisplayValue, resolveImageUrl } from '@/utils/dynamicRenderer';
import { Star, Heart, ShoppingCart, ChevronDown, Check, Tag } from 'lucide-react';

const FlowbiteDetailTemplate: React.FC<TemplateProps> = ({
  data,
  visibility,
  accentColor,
  bgBase,
  textMain,
  textMuted,
  borderBase,
  activeSlot,
  onSlotClick,
  onVariantSelect,
  activeVariantIndex = 0,
  context
}) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const selectedVariantIdx = activeVariantIndex;
  const setSelectedVariantIdx = (idx: number) => onVariantSelect?.(idx);
  const [selectedSizeIdx, setSelectedSizeIdx] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);

  const mapping = context?.design?.viewMapping || context?.design?.mapping || context?.mapping || {};
  const formSchema = context?.schema || context?.items || (Array.isArray(context) ? context : []);

  const mappedHighlightsId = mapping.highlights;

  const dynamicKeyValues = formSchema.filter((it: any) =>
    it.kind === 'field' && it.type === 'key-value' &&
    ((mappedHighlightsId && it.id === mappedHighlightsId) || !mappedHighlightsId)
  );

  const {
    title: initialTitle,
    price: initialPrice,
    imageUrl: initialImageUrl,
    description: dataDescription,
    rating: dataRating,
    reviewCount: dataReviewCount,
    availableColors = [],
    availableSizes = [],
    stock: initialStock,
    sku: initialSku,
    allImages = [],
    variants = []
  } = (data || {}) as any;

  // Final property Resolution
  const d = data as any;
  const title = initialTitle || d[mapping.title] || "Product Name";
  const price = initialPrice !== undefined && initialPrice !== '—' ? initialPrice : (d[mapping.price] || 0);
  const imageUrl = initialImageUrl || d.image || d[mapping.image];
  const description = dataDescription || d[mapping.description] || d.description || "Premium quality item for modern lifestyles.";
  const sku = initialSku || d[mapping.sku] || "ID: 455-RH";
  const stock = initialStock !== undefined && initialStock !== '—' ? initialStock : (d[mapping.stock] || 0);
  const rating = dataRating !== undefined && dataRating !== '—' ? dataRating : (d[mapping.rating] || 4.5);
  const reviewCount = dataReviewCount !== undefined && dataReviewCount !== '—' ? dataReviewCount : (d[mapping.reviewCount] || 0);

  // Variant resolution logic (Synced with UniversalTemplateView)
  const variantSectionId = mapping.variantsSection || Object.keys(data).find(key => Array.isArray((data as any)[key]) && typeof (data as any)[key][0] === 'object');
  const rawVariants = variantSectionId ? (data as any)[variantSectionId] : (Array.isArray(variants) ? variants : []);

  const processedVariants = variants.length > 0 ? variants : [];
  const activeVariant = processedVariants[selectedVariantIdx] || processedVariants[0];

  const derivedSizes = useMemo(() => {
    const sizes = activeVariant?.sizes || [];
    return sizes.length > 0 ? Array.from(new Set(sizes)) : (availableSizes || []);
  }, [activeVariant, availableSizes]);

  const displayPrice = activeVariant?.price || price;
  const displayStock = activeVariant?.stock || stock;
  const displayImages = (activeVariant?.images && activeVariant.images.length > 0)
    ? activeVariant.images
    : (allImages.length > 0 ? allImages : [imageUrl || "/src/assets/images/default-product-1.png"].flat().filter(Boolean));

  const images = displayImages;

  // Final Highlights Resolution
  const resolvedHighlights = useMemo(() => {
    if (mappedHighlightsId && (data as any)[mappedHighlightsId]) {
      return (data as any)[mappedHighlightsId];
    }
    if ((data as any).highlights) {
      return (data as any).highlights;
    }
    if (dynamicKeyValues.length > 0) {
      const firstFieldId = dynamicKeyValues[0].id;
      return (data as any)[firstFieldId] || [];
    }
    return [];
  }, [data, mappedHighlightsId, dynamicKeyValues]);

  return (
    <section className={`py-4 md:py-8 antialiased min-w-5xl w-full ${bgBase}`}>
      <div className="max-w-7xl px-4 mx-auto 2xl:px-0">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 xl:gap-16 items-start">
          {/* IMAGE SECTION */}
          <div className="shrink-0 max-w-md lg:max-w-lg mx-auto w-full sticky top-20">
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
                    className="w-full h-full object-contain pt-8 transition-transform duration-700 hover:scale-110"
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
                      style={{width: '60px', height: '60px', borderColor: selectedImage === idx ? accentColor : 'transparent' }}
                    >
                      <img src={img} className="w-full h-full object-contain" alt={`View ${idx + 1}`} />
                    </button>
                  ))}
                </div>
              </SlotWrapper>
            )}
          </div>

          <div className="mt-6 sm:mt-8 lg:mt-0 flex flex-col h-full">
            <div className="m-8">
              {/* TITLE */}
              {visibility.title && (
                <SlotWrapper slot="title" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                  <h1 className="text-3xl font-black sm:text-3xl tracking-tight leading-tight">
                    {title}
                  </h1>
                </SlotWrapper>
              )}

              {/* RATING */}
              {visibility.rating && (
                <SlotWrapper slot="rating" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor} className="flex items-center gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} size={14} className="text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className={`text-xs font-bold leading-none ${textMuted}`}>
                      ({Number(rating).toFixed(1)})
                    </p>
                    <span className={`text-xs font-bold leading-none underline opacity-60 ${textMain}`}>
                      {reviewCount} Reviews
                    </span>
                    <hr className='my-6 text-slate-200 dark:text-white/5' />
                  </div>
                </SlotWrapper>
              )}

              {/* Price */}
              {visibility.price && (
                <SlotWrapper slot="price" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor} className='mt-2'>
                  <p className="text-4xl font-extrabold tracking-tighter tabular-nums">
                    {formatDisplayValue(displayPrice, 'price')}
                  </p>
                  <hr className='my-2 text-slate-200 dark:text-white/5' />
                </SlotWrapper>
              )}

              {visibility.colors && (processedVariants.length > 0 || availableColors.length > 0) && (
                <SlotWrapper slot="colors" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                  <div className="space-y-3">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${textMuted}`}>Choice Colour</span>
                    <div className="flex gap-3">
                      {(processedVariants.length > 0 ? processedVariants : availableColors).map((variant: any, i: number) => {
                        const colorValue = typeof variant === 'object' ? variant.color || variant.value || variant.hex : variant;
                        const isSelected = selectedVariantIdx === i;
                        return (
                          <button
                            key={i}
                            onClick={() => {
                              setSelectedVariantIdx(i);
                              setSelectedSizeIdx(0);
                              setSelectedImage(0);
                            }}
                            className={`flex justify-center items-center w-10 h-10 rounded-full border-2 transition-all ${isSelected ? 'scale-110' : 'border-black opacity-60 hover:opacity-100'}`}
                            style={{
                              backgroundColor: colorValue || '#ccc',
                              borderColor: isSelected ? accentColor : 'transparent',
                              ['--tw-ring-color' as any]: isSelected ? accentColor : 'transparent'
                            }}
                          >{isSelected && <Check size={14} className='text-white mix-blend-difference m-auto' />}</button>
                        );
                      })}
                    </div>
                  </div>
                  <hr className='my-4 text-slate-200 dark:text-white/5' />
                </SlotWrapper>
              )}

              {visibility.sizes && (derivedSizes.length > 0 || availableSizes.length > 0) && (
                <SlotWrapper slot="sizes" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                  <div className="space-y-3">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${textMuted}`}>Configuration Selection</span>
                    <div className="flex flex-wrap gap-3">
                      {(derivedSizes.length > 0 ? derivedSizes : availableSizes).map((size: any, i: number) => {
                        const isSelected = selectedSizeIdx === i;
                        return (
                          <button
                            key={i}
                            onClick={() => setSelectedSizeIdx(i)}
                            className={`px-6 py-2.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${isSelected ? 'bg-primary text-white scale-105 shadow-xl' : `bg-white/5 hover:bg-white/10 ${textMain} border-slate-200 dark:border-white/10`}`}
                            style={{
                              backgroundColor: isSelected ? accentColor : undefined,
                              borderColor: isSelected ? accentColor : undefined
                            }}
                          >
                            {typeof size === 'object' ? size.label : size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <hr className='my-4 text-slate-200 dark:text-white/5' />
                </SlotWrapper>
              )}

              {/* ACTIONS */}
              {visibility.actions && (
                <div className="pt-4 flex flex-col sm:flex-row gap-4">
                  <SlotWrapper slot="actions" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor} className="flex flex-col sm:flex-row gap-4 w-full">
                    <button
                      className={`flex items-center justify-center h-14 px-8 text-[10px] font-black uppercase tracking-widest transition-all rounded-2xl border ${borderBase} hover:bg-white/5 active:scale-95 shadow-lg`}
                    >
                      <Heart size={18} className="mr-2" />
                      Favourites
                    </button>

                    <button
                      className="flex-1 h-14 text-white bg-primary font-black uppercase tracking-widest rounded-2xl text-[10px] px-8 flex items-center justify-center shadow-2xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
                      style={{ backgroundColor: accentColor }}
                    >
                      <ShoppingCart size={18} className="mr-2 text-white" />
                      Direct Purchase
                    </button>
                  </SlotWrapper>
                </div>
              )}
              {/* EXTRA PRODUCT INFO */}
              <SlotWrapper slot="sku" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor} className="flex flex-col sm:flex-row gap-4 w-full">

                <div className="flex flex-wrap items-center justify-between gap-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary" style={{ color: accentColor }}>
                      <Tag size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${textMuted} opacity-40`}>Reference</span>
                      <span className="text-sm font-bold">{sku}</span>
                    </div>
                  </div>
                  {visibility.stock && (
                    <div className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest ${displayStock > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'} border border-current opacity-100`}>
                      {displayStock > 0 ? `${Number(displayStock).toLocaleString()} Inventory Units` : 'Out of Stock'}
                    </div>
                  )}
                </div>
              </SlotWrapper>

              {/* ABOUT THIS ITEM */}
              {visibility.description && (
                <div className="space-y-4 mt-8">
                  <SlotWrapper slot="description" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em]">About this item</h3>
                    {description && description !== "Premium quality item for modern lifestyles." ? (
                      <>
                        <ul className={`mt-4 space-y-3 list-disc pl-5 ${textMuted} text-xs leading-relaxed`}>
                          {description.split('\n').filter(Boolean).slice(0, isDescriptionExpanded ? undefined : 3).map((line: any, idx: any) => {
                            const cleanLine = line.replace(/^\d+\.\s*/, '').trim();
                            if (!cleanLine) return null;
                            return <li key={idx} className="pl-1">{cleanLine}</li>;
                          })}
                        </ul>
                        {description.split('\n').filter(Boolean).length > 3 && (
                          <button
                            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                            className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1 mt-4 transition-all opacity-60 hover:opacity-100"
                            style={{ color: accentColor }}
                          >
                            {isDescriptionExpanded ? (
                              <>Show less <ChevronDown size={14} className="rotate-180" /></>
                            ) : (
                              <>Show more <ChevronDown size={14} /></>
                            )}
                          </button>
                        )}
                      </>
                    ) : (
                      onSlotClick && (
                        <div className="mt-4 p-6 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center text-center group-hover:border-primary transition-colors">
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Click to map Description</p>
                        </div>
                      )
                    )}
                  </SlotWrapper>
                </div>
              )}

              {/* KEY HIGHLIGHTS */}
              {visibility.highlights && (
                <div className="pt-8 space-y-4 border-t border-slate-200 dark:border-white/5 mt-8 min-h-[100px]">
                  <SlotWrapper slot="highlights" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                    <div className="flex items-center gap-2 mb-6">
                      <h3 className="text-sm font-black uppercase tracking-[0.2em]">Key Specifications</h3>
                    </div>

                    {resolvedHighlights.length > 0 && (
                      <div className="space-y-4">
                        {resolvedHighlights.map((kv: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-4 text-sm">
                            <span className={`font-bold ${textMain} min-w-[150px] shrink-0`}>
                              {kv.key || 'Specification'}
                            </span>
                            <span className={`${textMain} opacity-80`}>
                              {kv.value || '—'}
                            </span>
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
      </div>
    </section>
  );
};

export const mockData = {
  title: 'De\'Longhi Magnifica Start Automatic Coffee Center',
  price: 599,
  category: 'Appliances',
  sku: 'DEL-MAG-STRT-S',
  stock: 12,
  rating: 4.8,
  reviewCount: 456,
  description: 'Enter the world of bean-to-cup coffee with De\'Longhi Magnifica Start, providing everything you need to get started with your favorite espresso-based drinks at home.',
  imageUrl: ['/src/assets/images/default-product-1.png', '/src/assets/images/default-product-2.png', '/src/assets/images/default-product-3.png', '/src/assets/images/default-product-4.png'],
  availableColors: ['#000000', '#94a3b8', '#ffffff'],
  availableSizes: ['Standard Edition', 'Plus Edition'],
  highlights: [{
    "key": "Material composition",
    "value": "100% Combed Cotton"
  },
  {
    "key": "Pattern",
    "value": "Solid"
  },
  {
    "key": "Fit type",
    "value": "Regular Fit"
  },
  {
    "key": "Sleeve type",
    "value": "Half Sleeve"
  },
  {
    "key": "Collar style",
    "value": "Crew Collar"
  },
  {
    "key": "Length",
    "value": "Standard Length"
  },
  {
    "key": "Country of Origin",
    "value": "India"
  }]
};

export default FlowbiteDetailTemplate;
