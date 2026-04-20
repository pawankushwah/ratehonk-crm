import React, { useMemo, useState } from 'react';
import type { TemplateProps } from '../card/common';
import { SlotWrapper } from '../card/common';
import { formatDisplayValue, resolveImageUrl } from '@/utils/dynamicRenderer';
import defaultProductImage from '@/assets/images/default-product-1.png';
import { Package, ChevronLeft, ChevronRight } from 'lucide-react';

const InteractiveBundleTemplate: React.FC<TemplateProps> = ({
  data,
  visibility,
  accentColor = '#6366f1',
  bgBase,
  textMain,
  textMuted,
  activeSlot,
  onSlotClick,
  context, // The parent template context
  imageBaseURL
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const d = (data || {}) as any;
  const title = d?.title || "Product Bundle";
  const price = Number(d?.price || 0);
  const description = d?.description || "";
  
  // ROBUST DATA RESOLUTION for Bundle Items
  const bundleItems = useMemo(() => {
    // 1. Try directly passed bundleItems (from CardRenderer/Success join)
    if (d?.bundleItems && Array.isArray(d.bundleItems) && d.bundleItems.length > 0) {
      return d.bundleItems;
    }
    
    // 2. Try to find the field of type 'bundle-items' in the schema
    const schemaItems = context?.form_schema?.items || context?.schema || [];
    
    // Check for explicit mapping first
    const mappedId = context?.mapping?.bundleItems;
    if (mappedId && d[mappedId] && Array.isArray(d[mappedId])) {
      return d[mappedId];
    }

    const bundleField = schemaItems.find((it: any) => it.type === 'bundle-items' || it.type === 'bundle' || it.role === 'bundleItems' || it.role === 'bundle-items');
    if (bundleField && d[bundleField.id] && Array.isArray(d[bundleField.id])) {
      return d[bundleField.id];
    }

    // 3. Last resort: check common IDs
    const fallbackId = '1775121053564';
    if (d?.[fallbackId] && Array.isArray(d[fallbackId])) {
      return d[fallbackId];
    }

    return [];
  }, [d, context]);

  const allImages = (d.allImages || d.images || [d.imageUrl || d.image || defaultProductImage]).flat().filter(Boolean);

  const subtotal = useMemo(() => {
    return bundleItems.reduce((acc: number, item: any) => acc + (Number(item.market_price || item.currentPrice || item.price || 0) * Number(item.quantity || 1)), 0);
  }, [bundleItems]);

  // const discount = subtotal > price ? subtotal - price : 0;

  // Safe Image Resolver that doesn't double-prefix
  const safeResolve = (url: any) => {
    if (!url) return defaultProductImage;
    if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('/api/images/')) return url;
    return `${imageBaseURL || '/api/images/'}${url}`;
  };

  return (
    <div className={`w-full max-w-3xl mx-auto p-6 md:p-12 flex flex-col gap-12 font-sans ${bgBase} ${textMain}`}>
      
      {/* 1. HERO: IMAGE CAROUSEL & TITLE */}
      <div className="flex flex-col items-center text-center gap-8">
        {visibility.image && (
          <SlotWrapper slot="image" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
            <div className="relative group w-full max-w-md aspect-square flex items-center justify-center bg-current/5 rounded-3xl overflow-hidden shadow-2xl shadow-current/5">
              <img
                src={safeResolve(allImages[activeImageIndex])}
                alt={title}
                className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                onError={(e) => (e.currentTarget.src = defaultProductImage)}
              />
              
              {allImages.length > 1 && (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveImageIndex(prev => (prev === 0 ? allImages.length - 1 : prev - 1)); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/80"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveImageIndex(prev => (prev === allImages.length - 1 ? 0 : prev + 1)); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/80"
                  >
                    <ChevronRight size={20} />
                  </button>
                  <div className="absolute bottom-6 flex gap-1.5 justify-center w-full">
                    {allImages.map((_: any, i: number) => (
                      <div 
                        key={i} 
                        className={`h-1 rounded-full transition-all duration-300 ${i === activeImageIndex ? 'w-8 bg-white' : 'w-2 bg-white/30'}`} 
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </SlotWrapper>
        )}

        <div className="space-y-4">
          {visibility.title && (
            <SlotWrapper slot="title" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
              <h1 className="text-4xl font-bold tracking-tight uppercase">
                {title}
              </h1>
            </SlotWrapper>
          )}
          {visibility.description && description && (
            <SlotWrapper slot="description" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
              <p className={`text-sm opacity-60 leading-relaxed max-w-lg mx-auto ${textMuted}`}>
                {description}
              </p>
            </SlotWrapper>
          )}
        </div>
      </div>

      {/* 2. ITEM LIST: MINIMAL ROWS WITH INTEGRATED PRICING */}
      <div className="space-y-6">
        <SlotWrapper slot="bundleItems" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
          <div className="space-y-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 border-b border-current pb-3">Included Contents</h2>
            <div className="divide-y divide-current/5">
              {bundleItems.length > 0 ? (
                bundleItems.map((item: any, idx: number) => (
                  <div key={idx} className="py-5 flex items-center justify-between gap-4 group/item">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-current/5 flex items-center justify-center p-2 opacity-80 group-hover/item:opacity-100 transition-opacity">
                        <img 
                          src={safeResolve(item.imageUrl || item.item_image || item.image)} 
                          alt="" 
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => (e.currentTarget.src = defaultProductImage)}
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold tracking-tight">{item.name || item.display_name || item.label}</span>
                        <span className="text-[10px] opacity-40 uppercase tracking-[0.1em] font-black">QTY: {Number(item.quantity || 1)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-bold opacity-40 group-hover/item:opacity-70 transition-opacity italic">
                        {formatDisplayValue(item.price || item.unit_price || item.market_price || 0, 'price')}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-16 flex flex-col items-center justify-center opacity-10 italic gap-4">
                  <Package size={40} strokeWidth={1} />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">No items assigned to bundle</p>
                </div>
              )}

              {/* PROFESSIONAL PRICING SUMMARY */}
              <div className="pt-12 mt-4 space-y-6 border-t border-current/5">
                <div className="flex justify-between items-baseline">
                  {/* <span className="text-[15px] font-bold uppercase tracking-[0.25em] opacity-40">Individual Total</span> */}
                  <span className="text-[15px] font-bold uppercase tracking-[0.25em] opacity-40">Total</span>
                  <span className="text-sm font-medium opacity-60 tabular-nums">
                    {formatDisplayValue(subtotal, 'price')}
                  </span>
                </div>
                
                {/* {discount > 0 && (
                  <div className="flex justify-between items-baseline">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-500">Bundle Savings</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-500 tabular-nums">
                      -{formatDisplayValue(discount, 'price')}
                    </span>
                  </div>
                )} */}

                <div className="flex flex-col gap-2 pt-6">
                  <div className="flex justify-between items-end">
                    {/* <div className="flex flex-col">
                      <span className="text-[11px] font-black uppercase tracking-[0.3em] opacity-30">Final Bundle Price</span>
                      <span className="text-5xl font-black tracking-tighter tabular-nums" style={{ color: accentColor }}>
                        {formatDisplayValue(price, 'price')}
                      </span>
                    </div> */}
                    {/* {discount > 0 && (
                      <div className="mb-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
                          Save {Math.round((discount / subtotal) * 100)}%
                        </span>
                      </div>
                    )} */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SlotWrapper>

        {/* <button 
          className="w-full mt-10 py-7 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] text-white shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] brightness-110"
          style={{ 
            backgroundColor: accentColor,
            boxShadow: `0 20px 40px -12px ${accentColor}40` 
          }}
        >
          Proceed to Order Bundle
        </button> */}
      </div>

    </div>
  );
};

export const mockData = {
  title: 'Minimalist Tech Set',
  price: 1299,
  category: 'Essentials',
  images: [defaultProductImage],
  description: 'A curated selection of high-performance tools for your daily workflow.',
  bundleItems: [
    {
      display_name: 'Wireless Keyboard',
      quantity: 1,
      market_price: 199,
    },
    {
       display_name: 'Precision Mouse',
       quantity: 1,
       market_price: 99,
    },
    {
       display_name: 'Ultra HDR Monitor',
       quantity: 1,
       market_price: 1100,
    }
  ]
};

export default InteractiveBundleTemplate;
