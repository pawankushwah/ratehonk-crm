import React, { useState } from 'react';
import { getRoleValue, getRoleValues, getNormalizedVariants, formatDisplayValue, resolveImageUrl as resolveUrl } from '@/utils/dynamicRenderer';
import { ProductDataProvider } from './ProductDataContext';
import { 
  TemplateRegistry, 
  radiusMap as registryRadiusMap, 
  shadowMap as registryShadowMap, 
  paddingMap as registryPaddingMap, 
  fontMap as registryFontMap 
} from '@/pages/(product)/forms/builder/templates';
import defaultProductImage from '@/assets/images/default-product-1.png';

export interface CardDesignConfig {
  templateId?: string;
  viewTemplateId?: string;
  theme?: 'light' | 'dark';
  mapping?: Record<string, string>;
  visibility?: Record<string, boolean>;
  cardMapping?: Record<string, string>;
  viewMapping?: Record<string, string>;
  cardVisibility?: Record<string, boolean>;
  viewVisibility?: Record<string, boolean>;
  styles?: {
    primaryColor: string;
    borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
    shadow: 'none' | 'sm' | 'md' | 'lg' | '2xl';
    padding: 'sm' | 'md' | 'lg';
    fontFamily: 'plus-jakarta' | 'outfit' | 'mono';
  };
}

interface CardRendererProps {
  design: CardDesignConfig;
  data: Record<string, any>;
  template?: any;
  onSlotClick?: (slot: string, e: React.MouseEvent) => void;
  activeSlot?: string | null;
  mode?: 'card' | 'view';
  selectedVariant?: any;
  isPreview?: boolean;
  wholeData: Record<string, any>;
}

const CardRenderer: React.FC<CardRendererProps> = ({ 
  design = {}, 
  data = {}, 
  template = {},
  onSlotClick, 
  activeSlot, 
  mode = 'card',
  selectedVariant: propSelectedVariant,
  isPreview = false,
  wholeData = {}
}) => {
  console.log("whole Data", wholeData)
  const [localVariantIndex, setLocalVariantIndex] = useState(0);
  const isLight = design?.theme !== 'dark';

  const resolvedTemplateId = (mode === 'view' ? (design.viewTemplateId || design.templateId) : design.templateId) || 'simple';
  
  const currentMapping = mode === 'view' 
    ? (design.viewMapping || design.mapping || {}) 
    : (design.cardMapping || design.mapping || {});
  
  const rawVisibility = mode === 'view' 
    ? (design.viewVisibility || design.visibility || {}) 
    : (design.cardVisibility || design.visibility || {});

  const DEFAULT_VISIBILITY = {
    image: true,
    gallery: true,
    title: true,
    price: true,
    description: true,
    category: true,
    sku: true,
    stock: true,
    barcode: true,
    rating: true,
    promo: true,
    badge: true,
    discount: true,
    actions: true,
    colors: true,
    sizes: true,
    highlights: true,
    promotions: true
  };

  const currentVisibility = { ...DEFAULT_VISIBILITY, ...rawVisibility };
  const designWithContext = { ...design, mapping: currentMapping, visibility: currentVisibility };

  // Calculate variants early to support variant-aware resolution
  const variants = wholeData?.variants || [];
  const activeVariant = variants[localVariantIndex];
  
  const radiusClass = (registryRadiusMap as any)[design.styles?.borderRadius || 'lg'] || 'rounded-lg';
  const shadowClass = (registryShadowMap as any)[design.styles?.shadow || 'lg'] || 'shadow-lg';
  const paddingClass = (registryPaddingMap as any)[design.styles?.padding || 'md'] || 'p-6';
  const fontClass = (registryFontMap as any)[design.styles?.fontFamily || 'plus-jakarta'] || 'font-plus-jakarta';

  // Direct Assignment from wholeData (specialized fields from backend)
  let title = '—';
  let price = '—';
  let sku = '—';
  let stock = '—';
  let category = '—';
  let images = [];

  const fKey = wholeData?.FormTemplate?.formKey || 'inventory';
  console.log(wholeData, "wholeData")
  
  if (fKey === 'inventory') {
    title = wholeData?.name || '—';
    category = wholeData?.category || '—';
    if (activeVariant) {
      price = activeVariant.sales_price ?? '—';
      sku = activeVariant.model_number || activeVariant.sku || '—';
      stock = activeVariant.variant_stock ?? '—';
      images = activeVariant.images || [];
    } else {
      price = wholeData?.sales_price ?? '—';
      sku = wholeData?.sku || '—';
      stock = wholeData?.stock ?? '—';
      images = wholeData?.images || [];
    }
    console.log(images, "images")
  } else if (fKey === 'non-inventory') {
    title = wholeData?.name || '—';
    price = wholeData?.sales_price ?? '—';
    sku = wholeData?.sku || '—';
    stock = wholeData?.stock ?? '—';
    category = wholeData?.category || '—';
    images = wholeData?.images || [];
  } else if (fKey === 'service') {
    title = wholeData?.name || '—';
    price = wholeData?.rate ?? '—';
    sku = wholeData?.sku || '—';
    images = wholeData?.images || [];
  } else if (fKey === 'bundle') {
    title = wholeData?.name || '—';
    sku = wholeData?.sku || '—';
    stock = wholeData?.stock ?? '—';
    images = wholeData?.images || [];
  } else {
    // Fallback for other data types
    title = wholeData?.name || getRoleValue('title', wholeData, designWithContext, activeVariant) || '—';
    price = wholeData?.sales_price || wholeData?.rate || getRoleValue('price', wholeData, designWithContext, activeVariant) || '—';
    sku = wholeData?.sku || getRoleValue('sku', wholeData, designWithContext, activeVariant) || '—';
    stock = wholeData?.stock ?? getRoleValue('stock', wholeData, designWithContext, activeVariant) ?? '—';
    images = wholeData?.images || [];
  }

  const imageUrl = resolveUrl(images.length > 0 ? images[0] : null) || defaultProductImage;
  const barcode = wholeData?.barcode || wholeData?.data?.barcode || '—';
  const keyValue = wholeData?.keyValue || wholeData?.data?.keyValue || '—';
  const allImages = images;
  const accentColor = design.styles?.primaryColor || '#ec4899';

  const RegistryComponent = (TemplateRegistry as any)[resolvedTemplateId as keyof typeof TemplateRegistry];

  if (RegistryComponent) {
    const availableColors = getRoleValues('colors', data, designWithContext);
    const availableSizes = getRoleValues('sizes', data, designWithContext);
    // const allImages = getRoleValues('image', data, designWithContext).map(resolveUrl).filter(Boolean);
    console.log(allImages, "allImages")
  
    const cleanValue = (v: any) => v === '—' ? undefined : v;
    // console.log({ 
    //         ...data, 
    //         title: cleanValue(title), 
    //         price: cleanValue(price), 
    //         imageUrl: cleanValue(imageUrl), 
    //         images: cleanValue(rawImage), 
    //         category: cleanValue(category), 
    //         sku: cleanValue(sku), 
    //         stock: cleanValue(stock), 
    //         barcode: cleanValue(barcode),
    //         keyValue: cleanValue(keyValue),
    //         availableColors,
    //         availableSizes,
    //         allImages,
    //         variants
    //       })
    return (
      <ProductDataProvider value={{ data, template, selectedVariant: activeVariant }}>
        <RegistryComponent 
          context={template}
          data={{ 
            ...data, 
            title: cleanValue(title), 
            price: cleanValue(price), 
            imageUrl: cleanValue(imageUrl), 
            category: cleanValue(category), 
            sku: cleanValue(sku), 
            stock: cleanValue(stock), 
            barcode: cleanValue(barcode),
            availableColors,
            availableSizes,
            allImages,
            variants,
            bundleItems: wholeData?.bundleItems || []
          }}
          imageBaseURL={isPreview ? "" : "/api/images/"}
          visibility={currentVisibility}
          accentColor={accentColor}
          isDark={!isLight}
          bgBase={isLight ? 'bg-white' : 'bg-slate-950'}
          textMain={isLight ? 'text-slate-900' : 'text-white'}
          textMuted={isLight ? 'text-slate-500' : 'text-slate-400'}
          borderBase={isLight ? 'border-slate-200' : 'border-white/10'}
          mode={mode}
          radiusClass={radiusClass}
          shadowClass={shadowClass}
          paddingClass={paddingClass}
          fontClass={fontClass}
          activeSlot={activeSlot}
          onSlotClick={onSlotClick}
          onVariantSelect={(index: number) => setLocalVariantIndex(index)}
          activeVariantIndex={localVariantIndex}
        />
      </ProductDataProvider>
    );
  }

  return (
    <div className={`p-12 text-center text-slate-500 bg-white border rounded-xl shadow-sm w-[300px] m-auto`}>
      Template not found
    </div>
  );
};

export default CardRenderer;
