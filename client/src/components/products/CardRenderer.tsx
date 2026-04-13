import React, { useState, useEffect, useRef } from 'react';
import {
  Tag,
  Box,
  ShoppingCart,
  Heart,
  Star,
  Barcode,
  Share2
} from 'lucide-react';
import { getPuckConfig } from '@/pages/(product)/forms/builder/PuckConfig';
import { getRoleValue, getRoleValues, getNormalizedVariants, formatDisplayValue, resolveImageUrl as resolveUrl } from '@/utils/dynamicRenderer';
import { ProductDataProvider } from './ProductDataContext';
import { ComponentRegistry } from '@/pages/(product)/forms/builder/StudioComponents';
import { type CanvasElement } from '@/pages/(product)/forms/builder/Presets';
import { 
  TemplateRegistry, 
  radiusMap as registryRadiusMap, 
  shadowMap as registryShadowMap, 
  paddingMap as registryPaddingMap, 
  fontMap as registryFontMap 
} from '@/pages/(product)/forms/builder/templates';
import { Render } from '@puckeditor/core';

function extractFields(template: any): any[] {
  if (!template) return [];
  const schemaObj = template.schema || template.form_schema || {};
  const items = Array.isArray(schemaObj) ? schemaObj : (schemaObj.items || schemaObj.sections || []);
  
  const fields: any[] = [];
  const traverse = (currentItems: any[]) => {
    if (!Array.isArray(currentItems)) return;
    currentItems.forEach(item => {
      if (item.kind === 'field') {
        fields.push(item);
      } else if (item.items) {
        traverse(item.items);
      } else if (item.fields) {
        traverse(item.fields);
      }
    });
  };
  traverse(items);
  return fields;
}

export interface CardDesignConfig {
  content?: any;
  pages?: {
    card?: any;
    view?: any;
  };
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
  rootStyles?: {
    width: number;
    height: number;
    backgroundColor: string;
    foregroundColor: string;
    borderRadius: string;
    boxShadow: string;
    padding: string;
    fontFamily: string;
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
}

const CardRenderer: React.FC<CardRendererProps> = ({ 
  design, 
  data, 
  template,
  onSlotClick, 
  activeSlot, 
  mode = 'card',
  selectedVariant,
  isPreview = false
}) => {
  // 1. Resolve page design and Theme
  const pageDesign = design?.pages?.[mode] || (mode === 'card' ? design : null);
  const isLight = true;
  
  
  // 2. Responsive Scaling Logic for Freeform Studio
  const designWidth = pageDesign?.rootStyles?.width || design?.rootStyles?.width || (mode === 'view' ? 1000 : 450);
  const designHeight = pageDesign?.rootStyles?.height || design?.rootStyles?.height || (mode === 'view' ? 1200 : 850);
  const [containerWidth, setContainerWidth] = useState(designWidth);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Initial measure
    setContainerWidth(containerRef.current.offsetWidth);

    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setContainerWidth(entries[0].contentRect.width);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [designWidth, mode]);

  const scale = mode === 'view' ? 1 : Math.min(1, containerWidth / designWidth);

  // 3. High-Fidelity Freeform Studio (Studio Pro) Rendering
  if (pageDesign && pageDesign.elements) {
    const fields = extractFields(template);
    
    // THEME SYNC: Use Resolved Theme
    const themeStyles = pageDesign.rootStyles?.[isLight ? 'light' : 'dark'] || {};
    
    const outerContainerStyle: React.CSSProperties = {
      position: 'relative',
      width: '100%',
      maxWidth: mode === 'view' ? '1200px' : `${designWidth}px`,
      aspectRatio: `${designWidth} / ${designHeight}`,
      backgroundColor: themeStyles.backgroundColor || 'var(--color-bg-alt)',
      color: themeStyles.foregroundColor || 'var(--color-text-main)',
      borderRadius: themeStyles.borderRadius || (mode === 'view' ? '0' : '2.5rem'),
      boxShadow: mode === 'view' ? 'none' : '0 40px 80px -20px rgba(0,0,0,0.5)',
      overflow: 'hidden',
      margin: '0 auto',
      transition: 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1)'
    };

    return (
      <ProductDataProvider value={{ data, template, selectedVariant }}>
        <div ref={containerRef} style={outerContainerStyle} className="studio-pro-render group/studio">
           <div 
             style={{
               position: 'absolute',
               top: 0,
               left: 0,
               width: `${designWidth}px`,
               height: `${designHeight}px`,
               transformOrigin: 'top left',
               transform: `scale(${scale})`,
               transition: 'transform 0.1s ease-out'
             }}
           >
             {(pageDesign.elements as CanvasElement[])
               .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
               .map((el) => {
                 const Component = ComponentRegistry[el.type];
                 if (!Component) return null;

                 return (
                   <div 
                     key={el.id}
                     style={{
                       position: 'absolute',
                       left: el.x,
                       top: el.y,
                       width: el.width,
                       height: el.height,
                       zIndex: el.zIndex,
                       transform: `rotate(${el.rotation || 0}deg)`,
                       opacity: el.opacity !== undefined ? el.opacity : 1,
                       transition: 'all 0.3s ease-out'
                     }}
                   >
                     <Component 
                       type={el.type} 
                       props={el.props} 
                       style={el.style || {}}
                       formFields={fields} 
                       mockData={data}
                       isLight={isLight}
                     />
                   </div>
                 );
               })}
           </div>
        </div>
      </ProductDataProvider>
    );
  }

  // 4. Fallback: Check for Legacy Puck design
  if (pageDesign && (pageDesign.content || pageDesign.blocks)) {
    const fields = extractFields(template) || Object.keys(data).map(k => ({ id: k, label: k }));
    const puckConfig = getPuckConfig(fields);
    
    // Normalize pageDesign structure for Puck Render
    const puckData = {
      content: pageDesign.blocks || pageDesign.content || [],
      root: { props: { styles: pageDesign.rootStyles || design.styles } }
    };

    return (
      <ProductDataProvider value={{ data, template, selectedVariant }}>
        <div className={`w-full h-full ${mode === 'view' ? '' : 'max-w-[400px] shadow-2xl rounded-[3rem] overflow-hidden'}`}>
           <Render config={puckConfig} data={puckData} />
        </div>
      </ProductDataProvider>
    );
  }

  // 5. Fallback: Hardcoded Templates (Legacy)
  const resolvedTemplateId = (mode === 'view' ? (design.viewTemplateId || design.templateId) : design.templateId) || 'classic';
  
  // Resolve mode-specific mapping and visibility with legacy fallback
  const currentMapping = mode === 'view' 
    ? (design.viewMapping || design.mapping || {}) 
    : (design.cardMapping || design.mapping || {});
  
  const rawVisibility = mode === 'view' 
    ? (design.viewVisibility || design.visibility || {}) 
    : (design.cardVisibility || design.visibility || {});

  // Standard merge for visibility to ensure defaults are true if keys are missing
  const DEFAULT_VISIBILITY = {
    image: true,
    gallery: true,
    title: true,
    price: true,
    description: true,
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
    highlights: true
  };

  const currentVisibility = { ...DEFAULT_VISIBILITY, ...rawVisibility };

  const designWithContext = { ...design, mapping: currentMapping, visibility: currentVisibility };

  const radiusClass = (registryRadiusMap as any)[design.styles?.borderRadius || 'lg'] || 'rounded-lg';
  const shadowClass = (registryShadowMap as any)[design.styles?.shadow || 'lg'] || 'shadow-lg';
  const paddingClass = (registryPaddingMap as any)[design.styles?.padding || 'md'] || 'p-6';
  const fontClass = (registryFontMap as any)[design.styles?.fontFamily || 'plus-jakarta'] || 'font-plus-jakarta';
  const mapping = currentMapping;
  const visibility = currentVisibility;

  // Resolve data based on mapping / dynamic roles
  const title = getRoleValue('title', { data }, designWithContext);
  const price = getRoleValue('price', { data }, designWithContext);
  const description = getRoleValue('description', { data }, designWithContext);
  const imageUrl = resolveUrl(getRoleValue('image', { data }, designWithContext)) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';
  const category = getRoleValue('category', { data }, designWithContext);
  const sku = getRoleValue('sku', { data }, designWithContext);
  const stock = getRoleValue('stock', { data }, designWithContext);
  const barcode = getRoleValue('barcode', { data }, designWithContext); // [NEW: Barcode support]
  const accentColor = design.styles?.primaryColor || '#ec4899';

  const RegistryComponent = (TemplateRegistry as any)[resolvedTemplateId];
  if (RegistryComponent) {
    const availableColors = getRoleValues('colors', { data }, designWithContext);
    const availableSizes = getRoleValues('sizes', { data }, designWithContext);
    const allImages = getRoleValues('image', { data }, designWithContext).map(resolveUrl).filter(Boolean);
    const variants = getNormalizedVariants({ data }, designWithContext);
  
    return (
      <ProductDataProvider value={{ data, template, selectedVariant }}>
        <RegistryComponent 
          context={template}
          data={{ 
            ...data, 
            title, 
            price, 
            imageUrl, 
            category, 
            sku, 
            stock, 
            barcode,
            availableColors,
            availableSizes,
            allImages,
            variants
          }}
          visibility={currentVisibility}
          accentColor={accentColor}
          isDark={!isLight}
          bgBase={isLight ? 'bg-white' : 'bg-[#0A0A0B]'}
          textMain={isLight ? 'text-slate-900' : 'text-white'}
          textMuted={isLight ? 'text-slate-500' : 'text-slate-400'}
          borderBase={isLight ? 'border-slate-200' : 'border-white/10'}
          mode={mode}
        />
      </ProductDataProvider>
    );
  }

  const SlotWrapper = ({ slot, children, className = "" }: { slot: string, children: React.ReactNode, className?: string }) => {
    const isActive = activeSlot === slot;
    if (!onSlotClick) return <div className={className}>{children}</div>;
    
    return (
      <div 
        onClick={(e) => onSlotClick(slot, e)}
        className={`
          relative cursor-pointer group/slot transition-all duration-300
          ${isActive ? 'ring-2 ring-offset-2 ring-offset-black/50 rounded-lg scale-[1.02]' : 'hover:ring-1 hover:ring-opacity-50 hover:rounded-lg'}
          ${className}
        `}
        style={{ 
          borderColor: isActive ? accentColor : undefined,
          boxShadow: isActive ? `0 0 20px ${accentColor}40` : undefined,
          borderRadius: design.styles?.borderRadius === 'none' ? '0' : '1rem'
        }}
      >
        {children}
        <div className={`
          absolute inset-0 opacity-0 group-hover/slot:opacity-100 transition-opacity flex items-center justify-center
          ${isActive ? 'opacity-100' : ''}
        `} style={{ backgroundColor: `${accentColor}10`, borderRadius: design.styles?.borderRadius === 'none' ? '0' : '1rem' }}>
          <div className="text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-lg translate-y-2 group-hover/slot:translate-y-0 transition-transform" style={{ backgroundColor: accentColor }}>
            Map {slot}
          </div>
        </div>
      </div>
    );
  };

  const CardWrapper = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={`group relative w-full h-full bg-white transition-all duration-300 ${radiusClass} ${shadowClass} border border-[#e5e7eb] overflow-hidden flex flex-col ${className} ${fontClass}`}>
      {children}
    </div>
  );

  // Template 1: Classic - "Quiet luxury"
  if (resolvedTemplateId === 'classic' && mode === 'card') {
    return (
      <CardWrapper className={`w-[320px] bg-white border border-[#F1F1F4] group p-0`}>
        {visibility.image && (
          <SlotWrapper slot="image" className="relative h-64 overflow-hidden bg-[#F8F9FA]">
            <img src={imageUrl} alt={title} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105" />
            {visibility.badge && (
              <div className="absolute top-5 left-5 bg-black/90 backdrop-blur-xl px-3 py-1 rounded-sm text-[9px] font-black uppercase tracking-[0.2em] text-white shadow-xl">
                Autumn 24
              </div>
            )}
          </SlotWrapper>
        )}
        <div className={`${paddingClass} space-y-6`}>
          <div className="space-y-2">
            {visibility.category && (
              <SlotWrapper slot="category">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">{category}</span>
              </SlotWrapper>
            )}
            {visibility.title && (
              <SlotWrapper slot="title">
                <h3 className="text-xl font-bold tracking-tight text-slate-900 leading-[1.2]">{title}</h3>
              </SlotWrapper>
            )}
          </div>
          
          {visibility.description && (
            <SlotWrapper slot="description">
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 font-medium">
                {description}
              </p>
            </SlotWrapper>
          )}

          <div className="pt-4 flex items-end justify-between">
            {visibility.price && (
              <SlotWrapper slot="price" className="flex flex-col">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mb-1">MSRP</span>
                <span className="text-2xl font-black text-slate-950 tracking-tighter">{formatDisplayValue(price, 'price')}</span>
              </SlotWrapper>
            )}
            {visibility.actions && (
              <button 
                className="h-12 px-6 rounded-full bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all shadow-xl"
                style={{ borderRadius: design.styles?.borderRadius === 'none' ? '0' : '999px', backgroundColor: accentColor }}
              >
                Purchase
              </button>
            )}
          </div>
        </div>
      </CardWrapper>
    );
  }

  // Template 2: Modern - "Bold Impact"
  if (resolvedTemplateId === 'modern' && mode === 'card') {
    return (
      <div className={`w-[340px] bg-white group rounded-[2.5rem] overflow-hidden ${shadowClass} hover:shadow-2xl transition-all duration-500 ${fontClass}`}>
        {visibility.image && (
          <SlotWrapper slot="image" className="relative h-[380px] overflow-hidden">
            <img src={imageUrl} alt={title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
            
            <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
               {visibility.badge && (
                 <span className="px-4 py-1.5 rounded-full bg-white text-black text-[9px] font-black uppercase tracking-widest shadow-2xl">
                    Trend Leader
                 </span>
               )}
               <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all">
                  <Heart size={18} />
               </button>
            </div>

            <div className="absolute bottom-6 left-6 right-6">
               <div className="space-y-1 mb-4">
                  {visibility.category && (
                    <SlotWrapper slot="category">
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] drop-shadow-md" style={{ color: accentColor }}>{category}</span>
                    </SlotWrapper>
                  ) || null}
                  {visibility.title && (
                    <SlotWrapper slot="title">
                       <h3 className="text-2xl font-black text-white tracking-tight leading-none drop-shadow-xl">{title}</h3>
                    </SlotWrapper>
                  ) || null}
               </div>
               <div className="flex items-center justify-between">
                  {visibility.price && (
                    <SlotWrapper slot="price">
                       <span className="text-2xl font-black text-white drop-shadow-lg">{formatDisplayValue(price, 'price')}</span>
                    </SlotWrapper>
                  ) || null}
                  {visibility.actions && (
                    <button className="bg-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-black shadow-2xl hover:scale-105 transition-transform">
                       View Item
                    </button>
                  )}
               </div>
            </div>
          </SlotWrapper>
        )}
      </div>
    );
  }

  // Template 3: Glass - "Frosted Sophistication"
  if (resolvedTemplateId === 'glass' && mode === 'card') {
    return (
      <div className={`relative p-10 overflow-hidden w-[360px] min-h-[500px] flex flex-col justify-end transition-all duration-700 bg-transparent rounded-[3rem] ${shadowClass} ${fontClass}`}>
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] animate-pulse delay-1000" />
        
        {visibility.image && (
          <div className="absolute inset-0 z-0">
             <img src={imageUrl} alt={title} className="w-full h-full object-cover scale-110 grayscale-[0.3] brightness-75 transition-all duration-1000" />
             <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/20 to-black/80" />
          </div>
        )}

        <div className="relative z-10 backdrop-blur-2xl bg-white/10 border border-white/20 rounded-[2.5rem] p-8 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] space-y-6">
          <div className="flex items-center justify-between">
             {visibility.badge && (
               <div className="bg-white/20 border border-white/30 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] text-white">
                  Limited Series
               </div>
             )}
             <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => <Star key={i} size={10} className="text-yellow-400 fill-yellow-400" />)}
             </div>
          </div>

          <div className="space-y-2">
             {visibility.title && (
               <SlotWrapper slot="title">
                 <h3 className="text-2xl font-black tracking-tight leading-tight text-white drop-shadow-md">{title}</h3>
               </SlotWrapper>
             )}
             {visibility.category && (
                <SlotWrapper slot="category">
                  <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em]">{category}</p>
                </SlotWrapper>
             )}
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-white/10">
             {visibility.price && (
                <SlotWrapper slot="price" className="flex flex-col">
                   <span className="text-[8px] font-black uppercase text-white/30 tracking-[0.2em] mb-1">Vault Price</span>
                   <span className="text-3xl font-black tracking-tighter text-white tabular-nums">{formatDisplayValue(price, 'price')}</span>
                </SlotWrapper>
             )}
             {visibility.actions && (
                <button 
                  className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-2xl"
                >
                   <ShoppingCart size={22} strokeWidth={2.5} />
                </button>
             )}
          </div>
        </div>
      </div>
    );
  }

  // Template 4: Inventory Standard
  if (resolvedTemplateId === 'inventory_standard' && mode === 'card') {
    return (
      <div className={`group relative overflow-hidden h-full flex flex-col border border-card-border bg-card-bg transition-all duration-300 hover:-translate-y-1 w-[280px] ${radiusClass} ${shadowClass} ${fontClass}`}>
        <div className="relative aspect-4/3 overflow-hidden bg-white/5">
          {visibility.image && (
             <img src={imageUrl} alt={title} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" />
          )}
          {visibility.stock && (
            <div className="absolute top-3 left-3 z-10">
              <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest backdrop-blur-md border border-white/10 ${Number(stock) > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {Number(stock) > 0 ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
          )}
          {visibility.price && (
            <div className="absolute bottom-3 right-3 z-10">
              <span className="px-3 py-1.5 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 backdrop-blur-md border border-white/20" style={{ backgroundColor: accentColor }}>
                {formatDisplayValue(price, 'price')}
              </span>
            </div>
          )}
        </div>
        
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              {visibility.category && (
                <span className="text-[10px] font-black uppercase tracking-widest block mb-1 opacity-70 italic" style={{ color: accentColor }}>{category}</span>
              )}
              {visibility.title && (
                <h3 className="text-base font-bold text-text-main line-clamp-1 group-hover:text-primary transition-colors">{title}</h3>
              )}
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-[10px]">
            {visibility.sku && (
               <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                  <Tag size={12} className="opacity-50" />
                  <span className="uppercase tracking-wider">{sku}</span>
               </div>
            )}
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
               <Box size={12} className="opacity-50" />
               <span>{stock} in stock</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Template 5: Neo Brutalism - "Bold & Unapologetic" [NEW]
  if (resolvedTemplateId === 'neo_brutalism' && mode === 'card') {
    return (
      <div className={`w-[320px] bg-white border-4 border-black p-6 shadow-[8px_8px_0_0_#000] hover:shadow-[12px_12px_0_0_#000] hover:-translate-x-1 hover:-translate-y-1 transition-all ${fontClass}`}>
        {visibility.image && (
          <div className="border-4 border-black mb-6 bg-yellow-400 overflow-hidden aspect-square">
            <img src={imageUrl} alt={title} className="w-full h-full object-cover grayscale mix-blend-multiply" />
          </div>
        )}
        <div className="space-y-4">
          <div className="flex justify-between items-start">
             {visibility.title && <h3 className="text-2xl font-black uppercase italic leading-none">{title}</h3>}
             {visibility.price && <span className="bg-pink-500 text-white px-3 py-1 font-black shadow-md border-2 border-black inline-block">{formatDisplayValue(price, 'price')}</span>}
          </div>
          {visibility.description && <p className="text-xs font-bold leading-tight">{description}</p>}
          <div className="flex gap-2">
             <button className="flex-1 py-3 bg-cyan-400 border-2 border-black font-black uppercase tracking-tighter hover:bg-white transition-colors">Action Now</button>
             <button className="w-12 bg-white border-2 border-black flex items-center justify-center animate-bounce"><Heart size={20} fill="red"/></button>
          </div>
        </div>
      </div>
    );
  }

  // Template 6: Luxury Noir - "Midnight Gold" [NEW]
  if (resolvedTemplateId === 'luxury' && mode === 'card') {
    const gold = "#D4AF37";
    return (
      <div className={`w-[340px] bg-[#0A0A0A] border border-white/10 p-10 flex flex-col items-center text-center space-y-8 ${fontClass}`}>
        {visibility.image && (
          <div className="w-48 h-48 rounded-full border border-white/20 p-2 group-hover:border-amber-400 transition-colors">
            <img src={imageUrl} alt={title} className="w-full h-full object-cover rounded-full" />
          </div>
        )}
        <div className="space-y-3">
           {visibility.category && <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">{category}</span>}
           {visibility.title && <h3 className="text-3xl font-light text-white tracking-widest uppercase">{title}</h3>}
        </div>
        <div className="w-12 h-px bg-white/20" />
        {visibility.price && (
          <span className="text-4xl font-light tracking-tighter" style={{ color: gold }}>{formatDisplayValue(price, 'price')}</span>
        )}
        {visibility.actions && (
          <button className="px-12 py-4 border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all">
            Inquire Details
          </button>
        )}
      </div>
    );
  }

  // Immersive View Page Replication
  if (mode === 'view') {
    return (
      <div className={`w-full bg-bg-alt overflow-hidden ${radiusClass} transition-all duration-700 min-h-screen border border-glass-border/30 ${fontClass}`}>
        {/* Floating Breadcrumb Replication */}
        <div className="px-12 py-8 flex items-center justify-between border-b border-white/5">
           <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-[#A1A1AA] cursor-default">
              <span className="hover:text-primary transition-colors">Catalog</span>
              <span className="opacity-30">/</span>
              <span className="hover:text-primary transition-colors">{category}</span>
              <span className="opacity-30">/</span>
              <span className="text-text-main">{title}</span>
           </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-16 p-12">
          {/* Left: Premium Gallery Controller */}
          <div className="xl:col-span-5 space-y-8">
            {visibility.image && (
              <SlotWrapper slot="image" className="relative aspect-square overflow-hidden rounded-[3rem] border border-glass-border/30 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
                <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent flex items-end p-4" />
                
                <div className="absolute bottom-6 left-6 right-6 flex gap-4 p-4 rounded-4xl bg-white/5 backdrop-blur-xl border border-white/5 no-scrollbar overflow-x-auto">
                   {[1,2,3,4].map(idx => (
                     <div key={idx} className={`w-12 h-12 rounded-xl bg-white/10 border transition-all ${idx === 1 ? 'border-primary ring-4 ring-primary/20 scale-105' : 'border-white/10 opacity-40 hover:opacity-100 hover:scale-105 cursor-pointer'}`} />
                   ))}
                </div>
              </SlotWrapper>
            )}

            {/* BARCODE SECTION - [NEW] */}
            <div className="p-8 rounded-4xl bg-white/5 border border-glass-border/30 flex items-center justify-between group">
               <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Technical Identity</p>
                  <p className="text-xl font-mono font-bold text-text-main tracking-widest">{sku}</p>
               </div>
               <div className="flex flex-col items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <Barcode size={48} className="text-text-main" strokeWidth={1} />
                  <span className="text-[8px] font-bold text-text-main/40">RH-RETAIL-SCAN</span>
               </div>
            </div>
          </div>

          {/* Right: Detailed Information Architecture */}
          <div className="xl:col-span-7 flex flex-col space-y-12">
             <div className="space-y-6">
                <div className="flex items-center gap-3">
                   {visibility.badge && (
                      <SlotWrapper slot="badge">
                        <span className="bg-primary/20 border border-primary/40 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-primary shadow-xl shadow-primary/10">
                           In-Stock Arrival
                        </span>
                      </SlotWrapper>
                   )}
                   <span className="w-px h-4 bg-white/10" />
                   {visibility.category && (
                     <SlotWrapper slot="category">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#A1A1AA]">{category}</span>
                     </SlotWrapper>
                   )}
                </div>

                {visibility.title && (
                   <SlotWrapper slot="title">
                      <h1 className="text-7xl font-black tracking-tight text-text-main leading-[0.95] drop-shadow-2xl">{title}</h1>
                   </SlotWrapper>
                )}
             </div>

             <div className="py-10 border-y border-white/5 flex items-center justify-between">
                {visibility.price && (
                   <SlotWrapper slot="price" className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary" style={{ color: accentColor }}>RH Retail Pricing</p>
                       <div className="flex items-end gap-3 font-outfit">
                          <span className="text-6xl font-black text-text-main tracking-tighter tabular-nums">{formatDisplayValue(price, 'price')}</span>
                       </div>
                   </SlotWrapper>
                )}
                {visibility.stock && (
                   <SlotWrapper slot="stock" className="flex flex-col items-end">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1 flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Availability
                      </span>
                      <span className="text-2xl font-black text-text-main tabular-nums">{stock} Units</span>
                   </SlotWrapper>
                )}
             </div>

             {visibility.description && (
                <SlotWrapper slot="description">
                   <div className="space-y-4 max-w-2xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#A1A1AA]">Item Description</p>
                      <p className="text-lg text-text-main opacity-80 leading-relaxed font-medium">
                         {description}
                      </p>
                   </div>
                </SlotWrapper>
             )}

             {visibility.actions && (
                <div className="flex gap-6 pt-10">
                   <button 
                      className="flex-1 h-20 rounded-4xl bg-text-main text-bg-main font-black uppercase tracking-[0.2em] text-sm shadow-[0_25px_50px_-12px_rgba(255,255,255,0.2)] hover:-translate-y-1 transition-all"
                      style={{ borderRadius: design.styles?.borderRadius === 'none' ? '0' : '2.5rem' }}
                   >
                      Add To Direct Order
                   </button>
                   <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-20">
                      <button className="w-10 h-10 rounded-4xl bg-text-main/5 text-text-main flex items-center justify-center backdrop-blur-xl border border-glass-border">
                         <Share2 size={16} />
                      </button>
                   </div>
                   <button className="w-20 h-20 rounded-4xl bg-glass-bg border border-glass-border flex items-center justify-center text-text-main hover:bg-glass-bg/50 transition-all shadow-xl">
                      <Heart size={28} />
                   </button>
                </div>
             )}
          </div>
        </div>

        {/* Technical Specification Section Replication */}
        <div className="px-12 py-24 bg-text-main/2 border-t border-glass-border">
           <div className="max-w-7xl mx-auto space-y-12">
              <div className="space-y-2">
                 <h2 className="text-4xl font-black text-text-main tracking-tight">Technical Specifications</h2>
                 <p className="text-sm font-bold text-text-muted uppercase tracking-[0.3em]">Full Architecture Breakdown</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-24">
                 {Object.entries(mapping)
                   .filter(([key]) => !['title', 'price', 'description', 'image', 'category', 'sku', 'stock', 'colors', 'badge', 'actions'].includes(key))
                   .map(([key, val], i) => (
                    <div key={i} className="space-y-4 group">
                       <div className="flex items-center justify-between border-b border-glass-border pb-4 group-hover:border-primary/50 transition-colors">
                          <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="text-sm font-bold text-text-main uppercase">{String(val || '—')}</span>
                       </div>
                    </div>
                 ))}
                 {(!mapping || Object.keys(mapping).length < 5) && [1,2,3].map(i => (
                    <div key={`fill-${i}`} className="space-y-4 group opacity-40">
                       <div className="flex items-center justify-between border-b border-glass-border pb-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Dynamic Attribute {i}</span>
                          <span className="text-sm font-bold text-text-main">—</span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <CardWrapper>
      <div className="p-12 text-center text-text-muted">
        Select a template or switch to View mode to see the design
      </div>
    </CardWrapper>
  );
};

export default CardRenderer;
