import React, { useState, useMemo } from 'react';
import type { TemplateProps } from '../card/common';
import { SlotWrapper } from '../card/common';
import { formatDisplayValue, resolveImageUrl } from '@/utils/dynamicRenderer';
import { Package, Star, Info, ChevronDown, Check, Tag, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import defaultProductImage from '@/assets/images/default-product-1.png';

const InteractiveBundleTemplate: React.FC<TemplateProps> = ({
  data,
  visibility,
  accentColor,
  bgBase,
  textMain,
  textMuted,
  activeSlot,
  onSlotClick,
  isDark,
  context,
  imageBaseURL
}) => {
  const d = data as any;
  const [selectedImage, setSelectedImage] = useState(0);

  const title = d.title || "Premium Bundle Pack";
  const price = d.price || 0;
  const bundleItems = d.bundleItems || [];
  const imageUrl = d.imageUrl || d.image;
  const description = d.description || "A comprehensive collection of high-quality products curated for maximum value and performance.";
  
  const allImages = useMemo(() => {
    const imgs = d.allImages || [imageUrl];
    return imgs.flat().filter(Boolean);
  }, [d.allImages, imageUrl]);

  // Calculate savings
  const totalMarketValue = useMemo(() => {
    return bundleItems.reduce((acc: number, item: any) => acc + (Number(item.market_price || 0) * Number(item.quantity || 1)), 0);
  }, [bundleItems]);

  const savings = totalMarketValue > price ? totalMarketValue - price : 0;
  const savingsPercent = totalMarketValue > 0 ? Math.round((savings / totalMarketValue) * 100) : 0;

  return (
    <div className={`w-full mx-auto flex flex-col ${bgBase} ${textMain} rounded-3xl overflow-hidden border border-white/5 shadow-2xl`}>
      {/* HERO SECTION */}
      <div className="flex flex-col lg:flex-row gap-0 border-b border-white/5">
        {/* LEFT: VISUALS */}
        <div className={`lg:w-5/12 p-8 lg:p-12 space-y-8 lg:border-r border-white/5 ${isDark ? 'bg-black/20' : 'bg-slate-50'}`}>
          {visibility.image && (
            <SlotWrapper
              slot="image"
              className="space-y-8"
              activeSlot={activeSlot}
              onSlotClick={onSlotClick}
              accentColor={accentColor}
            >
              <div className="aspect-square relative flex items-center justify-center p-8 bg-white/5 rounded-3xl overflow-hidden group">
                <img
                  src={imageBaseURL + (allImages[selectedImage] || '')}
                  alt={title}
                  className="max-w-full max-h-full object-contain transition-all duration-700 group-hover:scale-105"
                  onError={(e) => (e.currentTarget.src = defaultProductImage)}
                />
                
                {savingsPercent > 0 && (
                  <div className="absolute top-6 right-6 px-4 py-2 bg-emerald-500 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-emerald-500/20 animate-bounce">
                    Save {savingsPercent}%
                  </div>
                )}
              </div>

              {/* THUMBNAILS */}
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                {allImages.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-16 h-16 rounded-xl border-2 transition-all p-1 shrink-0 ${selectedImage === idx ? 'scale-110 shadow-lg' : 'opacity-40 hover:opacity-100'} bg-white/5`}
                    style={{ borderColor: selectedImage === idx ? accentColor : 'transparent' }}
                  >
                    <img src={imageBaseURL + img} className="w-full h-full object-contain" alt={`View ${idx}`} />
                  </button>
                ))}
              </div>
            </SlotWrapper>
          )}
        </div>

        {/* RIGHT: BUNDLE SUMMARY */}
        <div className={`lg:w-7/12 p-8 lg:p-16 flex flex-col justify-center space-y-10 ${isDark ? 'bg-white/5' : 'bg-white'}`}>
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-primary/10 rounded-lg text-primary text-[10px] font-black uppercase tracking-widest" style={{ color: accentColor, backgroundColor: `${accentColor}20` }}>
                Curated Bundle
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={12} className="text-yellow-400 fill-current" />
                ))}
              </div>
            </div>

            {visibility.title && (
              <SlotWrapper slot="title" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                <h1 className="text-3xl lg:text-5xl font-black tracking-tight leading-[1.1]">
                  {title}
                </h1>
              </SlotWrapper>
            )}

            <div className="flex flex-col gap-2">
               {visibility.price && (
                <SlotWrapper slot="price" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                  <div className="flex items-end gap-4">
                    <span className="text-4xl lg:text-6xl font-black tracking-tighter" style={{ color: accentColor }}>
                      {formatDisplayValue(price, 'price')}
                    </span>
                    {totalMarketValue > price && (
                      <div className="flex flex-col mb-1.5 opacity-60">
                         <span className="text-sm line-through decoration-rose-500 decoration-2">
                           {formatDisplayValue(totalMarketValue, 'price')}
                         </span>
                         <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
                           Bundle Value
                         </span>
                      </div>
                    )}
                  </div>
                </SlotWrapper>
              )}
            </div>

            {visibility.description && (
              <SlotWrapper slot="description" activeSlot={activeSlot} onSlotClick={onSlotClick} accentColor={accentColor}>
                <p className={`text-sm leading-relaxed max-w-xl ${textMuted}`}>
                  {description}
                </p>
              </SlotWrapper>
            )}
          </div>

          <div className="flex flex-wrap gap-6 pt-6 border-t border-white/5">
             <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                   <ShieldCheck size={20} />
                </div>
                <div className="flex flex-col">
                   <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Warranty</span>
                   <span className="text-xs font-bold">1 Year Protection</span>
                </div>
             </div>
             <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                   <Zap size={20} />
                </div>
                <div className="flex flex-col">
                   <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Delivery</span>
                   <span className="text-xs font-bold">Priority Shipping</span>
                </div>
             </div>
          </div>

          <button 
            className="w-full lg:w-fit px-12 py-5 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-2xl shadow-primary/40 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3"
            style={{ backgroundColor: accentColor }}
          >
            Claim This Bundle <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* BUNDLE CONTENTS GRID */}
      <div className="p-8 lg:p-16 space-y-12">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-white/5">
          <div className="space-y-4">
             <div className="flex items-center gap-2">
                <Package size={20} className="text-primary" style={{ color: accentColor }} />
                <h2 className="text-xl lg:text-3xl font-black uppercase tracking-widest italic">Inside the Pack</h2>
             </div>
             <p className={`text-xs opacity-60 font-medium max-w-lg ${textMuted}`}>
               Every item in this bundle has been carefully selected to ensure perfect synergy and performance. Here is what you get:
             </p>
          </div>
          {savings > 0 && (
            <div className="p-6 rounded-3xl bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 flex flex-col items-center justify-center text-center">
               <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Instant Saving</span>
               <span className="text-2xl font-black tracking-tighter">{formatDisplayValue(savings, 'price')} OFF</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {bundleItems.map((item: any, idx: number) => (
            <div 
              key={idx} 
              className={`group flex flex-col p-6 rounded-3xl border ${isDark ? 'border-white/5 bg-white/5' : 'border-slate-100 bg-slate-50/50'} hover:border-primary/30 transition-all hover:shadow-2xl hover:shadow-primary/5`}
            >
              <div className="flex items-center gap-6 mb-4">
                <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center p-3 shadow-inner overflow-hidden flex-shrink-0">
                  <img 
                    src={imageBaseURL + (item.item_image || item.imageUrl)} 
                    alt={item.display_name} 
                    className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => (e.currentTarget.src = defaultProductImage)}
                  />
                </div>
                <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-1.5 mb-1">
                      <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase bg-primary/10 text-primary" style={{ color: accentColor, backgroundColor: `${accentColor}10` }}>
                        {item.typeLabel || 'Item'}
                      </span>
                      <span className="text-[10px] font-black opacity-40">× {Number(item.quantity || 1)}</span>
                   </div>
                   <h3 className="text-sm font-black tracking-tight truncate leading-tight mb-1">{item.display_name || item.label}</h3>
                   <div className="flex items-center gap-1.5">
                      <Tag size={10} className="opacity-40" />
                      <span className="text-[10px] font-bold opacity-40 tracking-wider truncate">{item.item_sku || 'REF: ...'}</span>
                   </div>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Single Value</span>
                    <span className="text-xs font-bold">{formatDisplayValue(item.market_price || item.unit_price, 'price')}</span>
                 </div>
                 <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                    <Check size={12} /> Included
                 </div>
              </div>
            </div>
          ))}

          {/* Placeholder for small bundles */}
          {bundleItems.length > 0 && bundleItems.length < 3 && Array.from({ length: 3 - bundleItems.length }).map((_, i) => (
             <div key={`empty-${i}`} className="hidden lg:flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-dashed border-white/5 opacity-20">
                <Package size={32} />
             </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const mockData = {
  title: 'Ultimate Creative Studio Bundle',
  price: 5499,
  category: 'Workspace Solutions',
  imageUrl: [defaultProductImage],
  description: 'Elevate your creative workflow with the ultimate hardware synergy. This curated bundle includes all the essentials for professional content creation at an unbeatable value.',
  bundleItems: [
    {
      display_name: 'Mac Studio M2 Ultra',
      item_sku: 'MAC-ST-M2U',
      quantity: 1,
      market_price: 3999,
      typeLabel: 'Inventory',
      item_image: defaultProductImage
    },
    {
       display_name: 'Studio Display Nano-Texture',
       item_sku: 'SD-NANO',
       quantity: 1,
       market_price: 1899,
       typeLabel: 'Inventory',
       item_image: defaultProductImage
    },
    {
       display_name: 'Magic Keyboard with Touch ID',
       item_sku: 'MAGIC-KB',
       quantity: 1,
       market_price: 199,
       typeLabel: 'Inventory',
       item_image: defaultProductImage
    }
  ]
};

export default InteractiveBundleTemplate;
