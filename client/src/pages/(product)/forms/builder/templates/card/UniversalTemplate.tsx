import React from 'react';
import type { TemplateProps } from './common';
import { SlotWrapper } from './common';
import image1 from "@/assets/images/default-product-1.png"
import { formatDisplayValue, resolveImageUrl } from '@/utils/dynamicRenderer';
import { Tag, Box, Package, ChevronDown, Info, Heart, ShoppingCart, Star } from 'lucide-react';

const UniversalTemplate: React.FC<TemplateProps> = ({
  data,
  context,
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
  isDark,
  style,
  imageBaseURL
}) => {
  // const fontClass = 'font-plus-jakarta';
  // const shadowClass = 'shadow-2xl';
  
  // const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false);
  // const [expandedAccordions, setExpandedAccordions] = React.useState<Record<string, boolean>>({
  //   'product-details': true // Default open
  // });

  // --- DYNAMIC DATA RESOLUTION ---
  const mapping = context?.form_schema?.design?.mapping || context?.design?.mapping || context?.mapping || {};
  const formSchema = context?.form_schema?.items || context?.items || context?.schema || (Array.isArray(context) ? context : []);

  // Resolve core properties from mapping, prioritizing pre-resolved parent injection
  const d = data as any;
  const title = d.title || d[mapping.title];
  const price = d.price !== undefined ? d.price : d[mapping.price];
  const description = d.description || d[mapping.description] || (data as any).description || "Premium quality item for modern lifestyles.";
  const category = d.category || d[mapping.category] || "Retail Item";
  const sku = d.sku || d[mapping.sku] || "ID: 455-RH";
  const stock = d.stock !== undefined ? d.stock : (d[mapping.stock] || 0);
  const rating = d.rating !== undefined ? d.rating : (d[mapping.rating] || 4.5);
  const reviewCount = d.reviewCount !== undefined ? d.reviewCount : (d[mapping.reviewCount] || 0);
  const promo = d.promo || d[mapping.promo] || "SPECIAL OFFER";
  const imageUrl = d.imageUrl || d.image || d[mapping.image];

  const mappedHighlightsId = mapping.highlights;
  
  // const dynamicHighlights = React.useMemo(() => {
  //   // 1. Try specifically mapped field
  //   if (mappedHighlightsId && (data as any)[mappedHighlightsId]) {
  //     return (data as any)[mappedHighlightsId];
  //   }
  //   // 2. Try the 'highlights' property directly
  //   if ((data as any).highlights) {
  //     return (data as any).highlights;
  //   }
  //   // 3. Fallback to any Key-Value field found in schema
  //   const kvField = formSchema.find((it: any) => it.kind === 'field' && it.type === 'key-value');
  //   if (kvField) {
  //     return (data as any)[kvField.id] || [];
  //   }
  //   return [];
  // }, [data, mapping.highlights, formSchema]);
  
  const availableSizes = d.availableSizes || d[mapping.sizes] || [];
  const availableColors = d.availableColors || d[mapping.colors] || [];
  const allImages = d.allImages || [];
  const variants = d.variants || [];

  // Process variants into a standard format using mapping
  const processedVariants = variants;
  const selectedVariantIdx = activeVariantIndex;
  const setSelectedVariantIdx = (idx: number) => onVariantSelect?.(idx);
  
  const [selectedSizeIdx, setSelectedSizeIdx] = React.useState(0);

  // Final Active Variant
  const activeVariant = processedVariants[selectedVariantIdx] || processedVariants[0];

  // Derived options scoped to the active variant
  const derivedSizes = React.useMemo(() => {
    const sizes = activeVariant?.size || [];
    const sizesArray = Array.isArray(sizes) ? sizes : [sizes].filter(Boolean);
    return sizesArray.length > 0 ? Array.from(new Set(sizesArray)) : (availableSizes || []);
  }, [activeVariant, availableSizes]);

  // Resolution using centralized logic (props passed from CardRenderer are already resolved)
  const displayPrice = price;
  const displayStock = stock;
  const displayImages = (activeVariant?.images && activeVariant.images.length > 0) 
    ? activeVariant.images 
    : (allImages.length > 0 ? allImages : [imageUrl || "/src/assets/images/default-product-1.png"]);

  const images = displayImages;

  // --- CARD MODE ---
  const isBundle = d.itemType === 'bundle' || String(title).toLowerCase().includes('bundle');
  const bundleItems = d['bundle-items'] || d.bundle_items || [];

  return (
    <div 
      className={`transition-all duration-300 m-auto w-[300px] flex flex-col ${bgBase} border ${borderBase} backdrop-blur-3xl relative rounded-4xl overflow-hidden`}
      style={style}
    >
      {/* Top Image Section */}
      <div className={`relative aspect-square overflow-hidden ${isDark ? 'bg-[#131926]' : 'bg-[#F1F3F5]'}`}>
        {visibility.image && (
          <SlotWrapper
            slot="image"
            className="w-full h-full"
            activeSlot={activeSlot}
            onSlotClick={onSlotClick}
            accentColor={accentColor}
          >
            {allImages[0] ? (
              <img
                src={imageBaseURL+allImages[0]}
                alt={title}
                className="w-full h-full object-contain pt-5 px-4 pb-0 transition-all duration-700 hover:scale-110"
              />
            ) : (
            <div className={`w-full h-full flex flex-col items-center justify-center ${isDark ? 'bg-white/5 text-white/5' : 'bg-slate-200 text-slate-400'}`}>
              <Package size={64} strokeWidth={1} />
            </div>
          )}
        </SlotWrapper>
      )}

      {visibility.badge && (
        <SlotWrapper
          slot="badge"
          activeSlot={activeSlot}
          onSlotClick={onSlotClick}
          accentColor={accentColor}
          className="absolute top-4 left-4"
        >
          <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest backdrop-blur-md border ${isDark ? 'border-white/10 bg-emerald-500/20 text-emerald-400' : 'border-emerald-200 bg-emerald-50 text-emerald-600'}`}>
            {Number(displayStock) > 0 ? 'In Stock' : 'Out of Stock'}
          </span>
        </SlotWrapper>
      )}

      {visibility.promo && (
        <div className="absolute top-4 right-4">
          <SlotWrapper slot="promo" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
            <span className="px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest backdrop-blur-md border border-rose-500/30 bg-rose-500 text-white shadow-lg">
              {promo}
            </span>
          </SlotWrapper>
        </div>
      )}

      <div className="absolute bottom-4 right-4 z-10">
        {visibility.price && (
          <SlotWrapper
            slot="price"
            activeSlot={activeSlot}
            onSlotClick={onSlotClick}
            accentColor={accentColor}
          >
            <span className="px-3 py-1.5 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 backdrop-blur-md border border-white/20" style={{ backgroundColor: accentColor }}>
              {formatDisplayValue(displayPrice, 'price')}
            </span>
          </SlotWrapper>
        )}
      </div>
    </div>

    <div className="p-6 flex flex-col">
      <div>
        {visibility.category && (
          <SlotWrapper
            slot="category"
            activeSlot={activeSlot}
            onSlotClick={onSlotClick}
            accentColor={accentColor}
          >
            <span className="text-[10px] font-black uppercase tracking-widest block mb-1 opacity-70 italic" style={{ color: accentColor }}>
              {category}
            </span>
          </SlotWrapper>
        )}
        {visibility.title && (
          <SlotWrapper
            slot="title"
            activeSlot={activeSlot}
            onSlotClick={onSlotClick}
            accentColor={accentColor}
          >
            <h3 className={`text-lg font-bold leading-tight line-clamp-2 ${textMain}`}>
              {title}
            </h3>
          </SlotWrapper>
        )}
        
        {visibility.rating && (
          <div className="mt-1 flex items-center gap-1.5">
            <SlotWrapper
              slot="rating"
              activeSlot={activeSlot}
              onSlotClick={onSlotClick}
              accentColor={accentColor}
              className="flex items-center gap-1.5"
            >
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star 
                    key={i} 
                    size={10} 
                    className={`${Number(rating) >= i ? 'text-yellow-400 fill-current' : 'text-slate-300 dark:text-slate-600'}`} 
                  />
                ))}
              </div>
              <span className={`text-[10px] font-bold ${textMuted}`}>({Number(rating).toFixed(1)})</span>
            </SlotWrapper>
            {visibility.reviewCount && (
              <SlotWrapper
                slot="reviewCount"
                activeSlot={activeSlot}
                onSlotClick={onSlotClick}
                accentColor={accentColor}
              >
                <span className={`text-[10px] font-medium opacity-60 ${textMuted}`}>• {reviewCount} reviews</span>
              </SlotWrapper>
            )}
          </div>
        )}
      </div>

      {visibility.description && (
        <div className="mt-2 line-clamp-2">
          <SlotWrapper
            slot="description"
            activeSlot={activeSlot}
            onSlotClick={onSlotClick}
            accentColor={accentColor}
          >
            <p className={`text-[10px] leading-relaxed ${textMuted}`}>
              {description}
            </p>
          </SlotWrapper>
        </div>
      )}

      {isBundle && bundleItems.length > 0 && (
        <div className="mt-3 p-3 rounded-2xl bg-primary/5 border border-primary/10">
          <div className="flex items-center gap-2 mb-2">
            <Package size={12} className="text-primary" style={{ color: accentColor }} />
            <span className="text-[9px] font-black uppercase tracking-widest text-primary" style={{ color: accentColor }}>Bundle Includes</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {bundleItems.slice(0, 3).map((item: any, i: number) => (
              <div key={i} className={`px-2 py-0.5 rounded-md text-[8px] font-bold ${isDark ? 'bg-white/10 text-white' : 'bg-white text-slate-700'} shadow-sm border border-black/5`}>
                {item.title || item.name || `Item ${i + 1}`}
              </div>
            ))}
            {bundleItems.length > 3 && (
              <span className={`text-[8px] font-black opacity-40 ml-1 ${textMuted}`}>+{bundleItems.length - 3} more</span>
            )}
          </div>
        </div>
      )}

      {visibility.highlights && dynamicKeyValues.length > 0 && (
        <div className="mt-3">
          <SlotWrapper
            slot="highlights"
            activeSlot={activeSlot}
            onSlotClick={onSlotClick}
            accentColor={accentColor}
          >
            <div className="flex flex-wrap gap-1.5">
              {dynamicKeyValues.slice(0, 3).map((kv: any, i: number) => (
                <span key={i} className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'} ${textMuted}`}>
                  {kv.label}: <span className={isDark ? 'text-white' : 'text-slate-900'}>{d[kv.id] || '...'}</span>
                </span>
              ))}
            </div>
          </SlotWrapper>
        </div>
      )}

      {visibility.colors && (processedVariants.length > 0 || availableColors.length > 0) && (
        <div className="mt-4">
          <SlotWrapper
            slot="colors"
            activeSlot={activeSlot}
            onSlotClick={onSlotClick}
            accentColor={accentColor}
          >
            <div>
              <div className="flex gap-2.5">
                {(processedVariants.length > 0 ? processedVariants : availableColors).map((variant: any, i: number) => {
                  const colorValue = typeof variant === 'object' ? variant.color || variant.value || variant.hex : variant;
                  return (
                    <div
                      key={i}
                      onClick={() => {
                        setSelectedVariantIdx(i);
                        setSelectedSizeIdx(0);
                      }}
                      className={`w-6 h-6 rounded-full border ${isDark ? 'border-white/10' : 'border-slate-300'} shadow-lg cursor-pointer hover:scale-110 transition-all active:scale-95 overflow-hidden flex items-center justify-center p-0.5 ${selectedVariantIdx === i ? 'scale-110' : 'opacity-60'}`}
                    >
                       <div className="w-full h-full rounded-full" style={{ backgroundColor: colorValue || '#ccc' }} />
                    </div>
                  );
                })}
              </div>
            </div>
          </SlotWrapper>
        </div>
      )}

      {visibility.sizes && (derivedSizes.length > 0 || availableSizes.length > 0) && (
        <div className="mt-4 mb-2">
          <SlotWrapper
            slot="sizes"
            activeSlot={activeSlot}
            onSlotClick={onSlotClick}
            accentColor={accentColor}
          >
            <div>
              <div className="flex gap-2">
                {(derivedSizes.length > 0 ? derivedSizes : availableSizes).slice(0, 4).map((size: any, i: number) => (
                  <div
                    key={i}
                    onClick={() => setSelectedSizeIdx(i)}
                    className={`w-8 h-8 rounded-lg border ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'} uppercase flex items-center justify-center text-[10px] font-black cursor-pointer transition-all ${selectedSizeIdx === i ? 'bg-primary text-white scale-110' : `${textMuted}`}`}
                    style={{ backgroundColor: selectedSizeIdx === i ? accentColor : undefined }}
                  >
                    {typeof size === 'object' ? size.label : String(size)}
                  </div>
                ))}
              </div>
            </div>
          </SlotWrapper>
        </div>
      )}

      <div className={`mt-auto pt-4  ${borderBase} flex items-center justify-between text-[10px]`}>
        {visibility.sku && (
          <SlotWrapper
            slot="sku"
            activeSlot={activeSlot}
            onSlotClick={onSlotClick}
            accentColor={accentColor}
          >
            <div className={`flex items-center gap-1.5 ${textMuted} font-medium`}>
              <Tag size={12} className="opacity-50" style={{ color: accentColor }} />
              <span className="uppercase tracking-wider">{sku}</span>
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
            <div className={`flex items-center gap-1.5 ${textMuted} font-medium`}>
              <Box size={12} className="opacity-50" style={{ color: accentColor }} />
              <span>{Number(displayStock).toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 1 })} in stock</span>
            </div>
          </SlotWrapper>
        )}
      </div>
    </div>
  </div>
);
};

export const UniversalTemplateView: React.FC<TemplateProps> = ({
  data,
  context,
  visibility,
  accentColor,
  bgBase,
  textMain,
  textMuted,
  borderBase,
  activeSlot,
  onSlotClick,
  isDark
}) => {

  const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false);
  const [expandedAccordions, setExpandedAccordions] = React.useState<Record<string, boolean>>({
    'product-details': true // Default open
  });

  const mapping = context?.form_schema?.design?.mapping || context?.design?.mapping || context?.mapping || {};
  const formSchema = context?.form_schema?.items || context?.items || context?.schema || (Array.isArray(context) ? context : []);

  // Resolve core properties from mapping, prioritizing pre-resolved parent injection
  const d = data as any;
  const title = d.title || d[mapping.title];
  const price = d.price !== undefined ? d.price : d[mapping.price];
  const description = d.description || d[mapping.description] || (data as any).description || "Premium quality item for modern lifestyles.";
  // const category = d.category || d[mapping.category] || "Retail Item";
  const sku = d.sku || d[mapping.sku] || "ID: 455-RH";
  const stock = d.stock !== undefined ? d.stock : (d[mapping.stock] || 0);
  // const rating = d.rating !== undefined ? d.rating : (d[mapping.rating] || 4.5);
  // const reviewCount = d.reviewCount !== undefined ? d.reviewCount : (d[mapping.reviewCount] || 0);
  const promo = d.promo || d[mapping.promo] || "SPECIAL OFFER";
  const imageUrl = d.imageUrl || d.image || d[mapping.image];

  const mappedHighlightsId = mapping.highlights;
  
  const dynamicHighlights = React.useMemo(() => {
    // 1. Try specifically mapped field
    if (mappedHighlightsId && (data as any)[mappedHighlightsId]) {
      return (data as any)[mappedHighlightsId];
    }
    // 2. Try the 'highlights' property directly
    if ((data as any).highlights) {
      return (data as any).highlights;
    }
    // 3. Fallback to any Key-Value field found in schema
    const kvField = formSchema.find((it: any) => it.kind === 'field' && it.type === 'key-value');
    if (kvField) {
      return (data as any)[kvField.id] || [];
    }
    return [];
  }, [data, mapping.highlights, formSchema]);
  
  const availableSizes = d.availableSizes || d[mapping.sizes] || [];
  const availableColors = d.availableColors || d[mapping.colors] || [];
  const allImages = d.allImages || [];
  const variants = d.variants || [];

  // Find the repeatable section ID (Variants section)
  const variantSectionId = mapping.variantsSection || Object.keys(data).find(key => Array.isArray((data as any)[key]) && typeof (data as any)[key][0] === 'object');
  const rawVariants = variantSectionId ? (data as any)[variantSectionId] : (Array.isArray(variants) ? variants : []);

  // Process variants into a standard format using mapping
  const processedVariants = React.useMemo(() => {
    if (!variantSectionId || !Array.isArray(rawVariants)) return variants;
    
    return rawVariants.map((rv: any, idx: number) => ({
      id: rv.id || `variant-${idx}`,
      color: rv[mapping.colors] || rv.color,
      sizes: Array.isArray(rv[mapping.sizes]) ? rv[mapping.sizes] : (rv[mapping.sizes] ? [rv[mapping.sizes]] : (rv.sizes || [])),
      price: rv[mapping.price] || rv.price,
      stock: rv[mapping.stock] || rv.stock,
      images: rv[mapping.image] 
        ? (Array.isArray(rv[mapping.image]) ? rv[mapping.image] : [rv[mapping.image]]).map(resolveImageUrl).filter(Boolean) 
        : (Array.isArray(rv.images) ? rv.images : (rv.images ? [rv.images] : [])).map(resolveImageUrl).filter(Boolean)
    }));
  }, [rawVariants, mapping, variants, variantSectionId]);

  const [selectedVariantIdx, setSelectedVariantIdx] = React.useState(0);
  const [selectedSizeIdx, setSelectedSizeIdx] = React.useState(0);
  const [selectedImage, setSelectedImage] = React.useState(0);

  // Final Active Variant
  const activeVariant = processedVariants[selectedVariantIdx] || processedVariants[0];

  // Derived options scoped to the active variant
  const derivedSizes = React.useMemo(() => {
    const sizes = activeVariant?.sizes || [];
    return sizes.length > 0 ? Array.from(new Set(sizes)) : (availableSizes || []);
  }, [activeVariant, availableSizes]);

  // Extract dynamic fields from form schema for other sections
  const dynamicAccordions = formSchema.filter((it: any) => it.kind === 'field' && it.type === 'accordion');
  
  // Prioritize mapped fields for specific slots
  const mappedPromotionsId = mapping.promotions;

  const dynamicKeyValues = formSchema.filter((it: any) => 
    it.kind === 'field' && it.type === 'key-value' && 
    ((mappedHighlightsId && it.id === mappedHighlightsId) || !mappedHighlightsId)
  );

  const dynamicOffers = formSchema.filter((it: any) => 
    it.kind === 'field' && it.type === 'offers' && 
    ((mappedPromotionsId && it.id === mappedPromotionsId) || !mappedPromotionsId)
  );

  // --- DESIGNER PREVIEW HACK ---
  const isPreview = !!onSlotClick;
  if (isPreview) {
    if (dynamicKeyValues.length === 0 && mappedHighlightsId && d[mappedHighlightsId]) {
      dynamicKeyValues.push({ id: mappedHighlightsId, label: 'Feature Highlights', type: 'key-value', kind: 'field' });
    }
    if (dynamicOffers.length === 0 && mappedPromotionsId && d[mappedPromotionsId]) {
      dynamicOffers.push({ id: mappedPromotionsId, label: 'Promotions', type: 'offers', kind: 'field' });
    }
  }

  const displayPrice = activeVariant?.price || price;
  const displayStock = activeVariant?.stock || stock;
  const displayImages = (activeVariant?.images && activeVariant.images.length > 0) 
    ? activeVariant.images 
    : (allImages.length > 0 ? allImages : [imageUrl || "/src/assets/images/default-product-1.png"]);

  const images = displayImages;

  const toggleAccordion = (id: string | number) => {
    setExpandedAccordions(prev => ({ ...prev, [id]: !prev[id] }));
  };
  
  // --- CARD MODE ---
  // Detect if this is a bundle to show item summary
  // const isBundle = d.itemType === 'bundle' || String(title).toLowerCase().includes('bundle');
  // const bundleItems = d['bundle-items'] || d.bundle_items || [];

  return (
      <div className={`w-full mx-auto flex flex-col ${bgBase} ${textMain} rounded-3xl overflow-hidden ${borderBase} custom-scrollbar`}>
        {/* HERO SECTION */}
        <div className="flex flex-col lg:flex-row gap-0 lg:min-h-[700px] border-b border-white/5">
          {/* LEFT: ADVANCED GALLERY */}
          <div className={`lg:w-1/2 flex flex-col pb-8 lg:border-r ${borderBase} ${isDark ? 'bg-black/20' : 'bg-slate-50'}`}>
            {visibility.image && (
              <SlotWrapper
                slot="image"
                className="flex-1 flex flex-col gap-8 h-full"
                activeSlot={activeSlot}
                onSlotClick={onSlotClick}
                accentColor={accentColor}
              >
                {/* Main View */}
                <div className="flex-1 overflow-hidden relative group-gallery flex items-center justify-center p-12">
                  <img
                    src={images[selectedImage]}
                    alt={title}
                    className="max-w-full max-h-full object-contain transition-all duration-700 hover:scale-105"
                  />
                  <div className="absolute top-6 left-6 flex gap-3">
                    {visibility.promo && (
                      <SlotWrapper slot="promo" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                        <div className="px-4 py-2 bg-rose-500/90 backdrop-blur-xl border border-rose-400/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-rose-500/20">
                          {promo}
                        </div>
                      </SlotWrapper>
                    )}
                  </div>
                </div>
                {/* Thumbnails */}
                <div className="flex gap-4 justify-center px-4 overflow-x-auto pb-2 no-scrollbar">
                  {images.map((img: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`w-20 h-20 rounded-2xl border-2 transition-all p-1 shrink-0 ${selectedImage === i ? 'scale-110 shadow-lg' : 'opacity-40 hover:opacity-100'} bg-white/5`}
                      style={{ borderColor: selectedImage === i ? accentColor : 'transparent' }}
                    >
                      <img src={img} className="w-full h-full object-contain rounded-xl" alt={`Gallery ${i}`} />
                    </button>
                  ))}
                </div>
              </SlotWrapper>
            )}
          </div>

          {/* RIGHT: CORE INTERACTION */}
          <div className={`lg:w-1/2 p-12 flex flex-col space-y-10 ${isDark ? 'bg-white/5' : 'bg-white'} no-scrollbar`}>
            <div className="space-y-6">
              {visibility.title && (
                <SlotWrapper slot="title" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                  <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'} sm:text-3xl leading-tight`}>
                    {title}
                  </h1>
                </SlotWrapper>
              )}

              <div className="mt-4 sm:items-center sm:gap-6 sm:flex">
                {visibility.price && (
                  <SlotWrapper slot="price" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                    <p className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-gray-900'} sm:text-4xl`}>
                      {formatDisplayValue(displayPrice, 'price')}
                    </p>
                  </SlotWrapper>
                )}


              </div>

              {/* ACTION BUTTONS (FLOWBITE STYLE) */}
              <div className="mt-8 sm:gap-4 sm:items-center sm:flex">
                <button 
                  className={`flex-1 flex items-center justify-center py-3.5 px-6 text-sm font-medium ${isDark ? 'text-gray-400 border-gray-600 bg-gray-800 hover:bg-gray-700 hover:text-white' : 'text-gray-900 border-gray-200 bg-white hover:bg-gray-100 hover:text-primary-700'} rounded-xl border focus:outline-none transition-all duration-300`}
                >
                  <Heart className="w-5 h-5 mr-3" />
                  Add to favorites
                </button>

                <button 
                  className={`mt-4 sm:mt-0 flex-1 flex items-center justify-center py-3.5 px-6 text-sm font-bold text-white rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all duration-300`}
                  style={{ backgroundColor: accentColor }}
                >
                  <ShoppingCart className="w-5 h-5 mr-3" />
                  Add to cart
                </button>
              </div>

              <hr className={`my-8 ${isDark ? 'border-gray-800' : 'border-gray-100'}`} />

              <div className="flex flex-wrap items-start justify-between gap-4 text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-8">
                <div className="flex flex-col items-center gap-2 text-center w-20">
                  <div className={`p-3 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <Tag size={16} />
                  </div>
                  <span>10 days<br/>Return & Exchange</span>
                </div>
                <div className="flex flex-col items-center gap-2 text-center w-20">
                  <div className={`p-3 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <Box size={16} />
                  </div>
                  <span>Free<br/>Delivery</span>
                </div>
                <div className="flex flex-col items-center gap-2 text-center w-20">
                  <div className={`p-3 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <Package size={16} />
                  </div>
                  <span>Amazon<br/>Delivered</span>
                </div>
                <div className="flex flex-col items-center gap-2 text-center w-20">
                  <div className={`p-3 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <Info size={16} />
                  </div>
                  <span>Secure<br/>transaction</span>
                </div>
              </div>
            </div>

            {/* VARIANT PICKERS */}
            <div className="space-y-10 pt-6">
              {visibility.colors && (processedVariants.length > 0 || availableColors.length > 0) && (
                <SlotWrapper slot="colors" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                  <div className="space-y-4">
                    <span className={`text-xs font-bold uppercase tracking-widest ${textMuted}`}>Select Variant</span>
                    <div className="flex flex-wrap gap-4">
                      {(processedVariants.length > 0 ? processedVariants : availableColors).map((variant: any, i: number) => {
                        const colorValue = typeof variant === 'object' ? variant.color || variant.value || variant.hex : variant;
                        return (
                          <div
                            key={i}
                            onClick={() => {
                              setSelectedVariantIdx(i);
                              setSelectedSizeIdx(0); // Reset size selection
                              setSelectedImage(0); // Reset gallery
                            }}
                            className={`w-12 h-12 rounded-xl border-2 cursor-pointer transition-all hover:scale-110 active:scale-95 flex items-center justify-center overflow-hidden bg-white/5 p-0.5 ${selectedVariantIdx === i ? 'shadow-xl scale-110 shadow-primary/10' : 'opacity-40 hover:opacity-100'}`}
                            style={{
                              borderColor: selectedVariantIdx === i ? accentColor : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                            }}
                          >
                             <div className="w-full h-full rounded-lg" style={{ backgroundColor: colorValue || '#ccc' }} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </SlotWrapper>
              )}

              {visibility.sizes && (derivedSizes.length > 0 || availableSizes.length > 0) && (
                <SlotWrapper slot="sizes" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                  <div className="space-y-4">
                    <span className={`text-xs font-bold uppercase tracking-widest ${textMuted}`}>Select Size</span>
                    <div className="flex flex-wrap gap-3">
                      {(derivedSizes.length > 0 ? derivedSizes : availableSizes).map((size: any, i: number) => {
                        const isSelected = selectedSizeIdx === i;
                        return (
                          <button
                            key={i}
                            onClick={() => setSelectedSizeIdx(i)}
                            className={`px-8 py-3.5 rounded-xl border-2 font-bold text-xs tracking-widest transition-all ${isSelected ? 'shadow-lg scale-105' : 'opacity-50 hover:opacity-100 hover:border-white/20'}`}
                            style={{
                              borderColor: isSelected ? accentColor : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
                              backgroundColor: isSelected ? `${accentColor}10` : 'transparent',
                              color: isSelected ? accentColor : 'inherit'
                            }}
                          >
                            {typeof size === 'object' ? size.label : size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </SlotWrapper>
              )}
            </div>

            <div className="pt-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="p-2 rounded-lg bg-primary/10 text-primary" style={{ color: accentColor }}>
                    <Tag size={16} />
                 </div>
                 <div className="flex flex-col">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${textMuted} opacity-40`}>Reference</span>
                    <span className="text-xs font-bold">{sku}</span>
                 </div>
              </div>
              <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'} border border-emerald-500/20`}>
                {displayStock > 0 ? `${Number(displayStock).toLocaleString()} Inventory Units` : 'Out of Stock'}
              </div>
            </div>
          </div>
        </div>

        {/* TOP HIGHLIGHTS & ABOUT SECTION (AMAZON STYLE) */}
        <div className="px-16 lg:px-24 py-16 border-b border-white/5">
           <div className="max-w-4xl mx-auto space-y-16">
              {/* Top Highlights Accordion */}
              {visibility.highlights && (
                <div className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                  <h2>
                    <button 
                      type="button" 
                      onClick={() => toggleAccordion('top-highlights')}
                      className={`flex items-center justify-between w-full py-6 font-bold text-left ${isDark ? 'text-white' : 'text-gray-900'} transition-all group`}
                    >
                      <span className="text-xl tracking-tight">Top highlights</span>
                      <ChevronDown 
                        size={24} 
                        className={`transition-transform duration-300 ${expandedAccordions['top-highlights'] === false ? '' : 'rotate-180'}`} 
                      />
                    </button>
                  </h2>
                  <div className={`overflow-hidden transition-all duration-300 ${expandedAccordions['top-highlights'] === false ? 'max-h-0' : 'max-h-[1000px] mb-8'}`}>
                    <SlotWrapper slot="highlights" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                      {dynamicHighlights.length > 0 ? (
                        <div className="space-y-3 py-4">
                          {dynamicHighlights.map((kv: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-8 text-sm">
                              <span className={`font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'} min-w-[140px] shrink-0`}>
                                {kv.key || 'Specification'}
                              </span>
                              <span className={`${textMuted}`}>
                                {kv.value || 'Not specified'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        onSlotClick && (
                          <div className="py-4 opacity-40 italic text-[10px] uppercase tracking-widest">
                            No highlights mapped (Click to configure)
                          </div>
                        )
                      )}
                    </SlotWrapper>
                  </div>
                </div>
              )}

              {/* About this item (Bulleted) */}
              {visibility.description && (
                <div className="space-y-6">
                  <SlotWrapper slot="description" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                    <h3 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>About this item</h3>
                    {description && description !== "Premium quality item for modern lifestyles." ? (
                      <>
                        <ul className={`mt-6 space-y-4 list-disc pl-5 ${textMuted} text-base leading-relaxed`}>
                          {description.split('\n').filter(Boolean).slice(0, isDescriptionExpanded ? undefined : 3).map((line: any, idx: any) => {
                            const cleanLine = line.replace(/^\d+\.\s*/, '').trim();
                            if (!cleanLine) return null;
                            return (
                              <li key={idx} className="pl-2">
                                {cleanLine}
                              </li>
                            );
                          })}
                        </ul>
                        {description.split('\n').filter(Boolean).length > 3 && (
                          <button 
                            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                            className="text-sm font-bold flex items-center gap-1 mt-4 transition-all"
                            style={{ color: accentColor }}
                          >
                            {isDescriptionExpanded ? (
                              <>Read less <ChevronDown size={14} className="rotate-180" /></>
                            ) : (
                              <>Read more <ChevronDown size={14} /></>
                            )}
                          </button>
                        )}
                      </>
                    ) : (
                      onSlotClick && (
                        <div className="mt-6 p-10 border-2 border-dashed border-white/5 rounded-4xl flex flex-col items-center justify-center text-center hover:border-primary transition-colors">
                           <p className="text-sm font-black uppercase tracking-widest opacity-40">Click to connect Description</p>
                        </div>
                      )
                    )}
                  </SlotWrapper>
                </div>
              )}

              {/* Highlights Detail Section */}
              {visibility.highlights && (
                <div className="mt-12 space-y-8 pt-8 border-t border-white/5">
                  <SlotWrapper slot="highlights" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                    <h3 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Key Features & Specifications</h3>
                    {dynamicHighlights.length > 0 ? (
                      <div className="space-y-6 mt-10">
                        {dynamicHighlights.map((kv: any, idx: number) => (
                           <div key={idx} className="flex items-start gap-12 text-base">
                             <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'} min-w-[180px] shrink-0`}>
                               {kv.key || 'Specification'}
                             </span>
                             <span className={`${textMuted}`}>
                               {kv.value || 'Not specified'}
                             </span>
                           </div>
                        ))}
                      </div>
                    ) : (
                      onSlotClick && (
                        <div className="mt-10 p-16 border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center text-center hover:border-primary transition-colors">
                            <p className="text-base font-black uppercase tracking-widest opacity-40 italic">Feature Mapping Skeleton</p>
                            <p className="text-xs font-bold uppercase tracking-widest text-primary mt-4">Click to map product specs</p>
                        </div>
                      )
                    )}
                  </SlotWrapper>
                </div>
              )}
           </div>
        </div>



        {/* ACCORDION SECTIONS (FLOWBITE FLUSH STYLE) */}
        <div className="px-16 lg:px-24 py-16">
          <div id="accordion-flush" className="max-w-4xl mx-auto">
            {dynamicAccordions.map((field: any, idx: number) => {
              const isExpanded = expandedAccordions[field.id] || expandedAccordions['product-details'] && idx === 0;
              const content = field.properties?.accordionContent || field.properties?.keyValues || [];

              return (
                <div key={field.id} className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-100'} last:border-0`}>
                  <h2>
                    <button 
                      type="button" 
                      onClick={() => toggleAccordion(field.id)}
                      className={`flex items-center justify-between w-full py-8 font-bold text-left ${isExpanded ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-gray-400' : 'text-gray-500')} transition-all group`}
                    >
                      <span className="text-xl tracking-tight">{field.label || 'Details'}</span>
                      <ChevronDown 
                        size={24} 
                        className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                      />
                    </button>
                  </h2>
                  <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[1000px] mb-8' : 'max-h-0'}`}>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                        {content.length > 0 ? content.map((row: any, rIdx: number) => (
                          <div key={rIdx} className="flex flex-col gap-1">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${textMuted} opacity-50`}>
                              {row.key || 'Specification'}
                            </span>
                            <span className="text-sm font-bold tracking-tight capitalize">
                              {row.value || 'Data...'}
                            </span>
                          </div>
                        )) : (
                          <p className={`text-base leading-relaxed ${textMuted}`}>
                             Detailed information and configuration options for this segment are managed in the form builder. Add key-value technical pairs to populate this matrix.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* FALLBACK IF NO DYNAMIC ACCORDIONS */}
            {dynamicAccordions.length === 0 && (<></>
              // <div className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
              //   <h2>
              //      <button 
              //       type="button" 
              //       onClick={() => toggleAccordion('product-details')}
              //       className={`flex items-center justify-between w-full py-8 font-bold text-left ${expandedAccordions['product-details'] ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-gray-400' : 'text-gray-500')}`}
              //      >
              //         <span className="text-xl tracking-tight">About this Item</span>
              //         <ChevronDown 
              //           size={24} 
              //           className={`transition-transform duration-300 ${expandedAccordions['product-details'] ? 'rotate-180' : ''}`} 
              //         />
              //      </button>
              //   </h2>
              //   <div className={`overflow-hidden transition-all duration-300 ${expandedAccordions['product-details'] ? 'max-h-[500px] mb-8' : 'max-h-0'}`}>
              //      <p className={`text-base leading-relaxed ${textMuted}`}>
              //        {description}
              //      </p>
              //   </div>
              // </div>
            )}
          </div>
        </div>
      </div>
    );
};

export const mockData = {
  title: 'Apple iMac 27", 1TB HDD, Retina 5K Display, M3 Max',
  price: 1699,
  category: 'Desktop PC',
  sku: 'RH-IMAC-2024',
  stock: 2333,
  rating: 4.8,
  reviewCount: 1240,
  promo: 'Best Seller',
  description: 'Experience the ultimate desktop performance with the new iMac. Featuring a stunning 5K Retina display and the powerful M3 Max chip for professionals.',
  imageUrl: [image1],
  availableColors: ['#F5276C', '#F54927', '#F59E27', '#F5D127', '#F5F5F5'],
  availableSizes: ['XS', 'S', 'M', 'L', 'XL'],
  highlights: [
    { key: 'Brand', value: 'Apple' },
    { key: 'Model', value: 'iMac 2024' },
    { key: 'Processor', value: 'M3 Max' },
    { key: 'Display', value: 'Retina 5K' }
  ],
  promotions: [
    { label: 'Free Shipping', type: 'shipping' },
    { label: '10% Off with RH-PROMO', type: 'discount' }
  ],
};

export default UniversalTemplate;
