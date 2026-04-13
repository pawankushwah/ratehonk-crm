import React, { useState, useMemo, useEffect } from 'react';
import {
  Palette,
  LayoutGrid,
  FileText,
  MousePointer2,
  Box,
  Image as ImageIcon,
  Columns as GridIcon,
  Table as TableIcon,
  Eye,
  EyeOff, Layers,
  Split, CheckCircle2,
  Brush,
  Zap,
  Star, Scan,
  Maximize,
  Gift
} from 'lucide-react';
import CardRenderer, { type CardDesignConfig } from '@/components/products/CardRenderer';
import CustomSelect from '@/components/products/CustomSelect';
import { useTheme } from '@/context/ThemeContext';
import {
  VERTICAL_TEMPLATES,
  HORIZONTAL_TEMPLATES,
  DETAIL_TEMPLATES
} from './templates';

interface DesignTabProps {
  builderItems: any[];
  design: CardDesignConfig | null;
  setDesign: (design: CardDesignConfig) => void;
}

interface TemplateCardItemProps {
  t: any;
  isSelected: boolean;
  builderItems: any;
  currentDesign: any;
  onSelect: (id: string) => void;
}

const mockData = {
  title: 'Apple iMac 27", 1TB HDD, Retina 5K Display, M3 Max, lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quod.',
  price: 1699,
  category: 'Desktop PC',
  sku: 'RH-IMAC-2024',
  stock: 2333,
  rating: 4.8,
  reviewCount: 1240,
  discount: 'Up to 35% off',
  description: '1. 100% Cotton Body adaptive fabric blend in this t-shirt provides greater comfort and a body flattering look.\n2. Featuring fluid fabric that is adaptive to your movements and shape.\n3. Coloured with High-IQ dyes, which are 50% more sustainable and provide brighter, fade-proof colours.\n4. Available in trendy colours and designs',
  imageUrl: '/assets/images/default-product-2.png',
  colors: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#6366f1'],
  sizes: ['XS', 'S', 'M', 'L', 'XL'],
  // Sample field IDs for mapping demonstration
  'highlights-id': [
    { key: 'Material composition', value: 'Cotton' },
    { key: 'Fit type', value: 'Regular Fit' },
    { key: 'Sleeve type', value: 'Half Sleeve' },
    { key: 'Collar style', value: 'Crew Neck' }
  ],
  'promotions-id': [
    { label: 'Bank Offer', value: 'Upto $2,500.00 discount on select Credit Cards', footer: '44 offers >' },
    { label: 'Cashback', value: 'Upto $14.00 cashback as Amazon Pay Balance', footer: '2 offers >' }
  ]
};
const TemplateCardItem: React.FC<TemplateCardItemProps> = React.memo(({
  t,
  isSelected,
  builderItems,
  currentDesign,
  onSelect
}) => {
  return (
    <div
      onClick={() => onSelect(t.id)}
      className={"relative m-auto"}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1 z-10">
          <CheckCircle2 className="text-white" />
        </div>
      )}
      <CardRenderer
        design={{
          ...currentDesign,
          templateId: t.id,
          theme: 'light',
          visibility: {
            ...currentDesign.visibility,
            image: true,
            title: true,
            price: true,
            category: true,
            stock: true,
            sku: true,
            actions: true,
            colors: true,
            sizes: true,
            rating: true
          }
        }}
        data={{
          ...mockData,
          imageUrl: DEFAULT_PREVIEW_IMAGE,
          image: DEFAULT_PREVIEW_IMAGE
        }}
        template={{ form_schema: { items: builderItems } }}
        mode={t.type as any}
        isPreview={true}
      />

    </div>
  );
});
TemplateCardItem.displayName = 'TemplateCardItem';

const DEFAULT_PREVIEW_IMAGE = mockData.imageUrl;

const DebouncedColorPicker = ({ value, onChange, textMain, borderColor }: { value: string, onChange: (color: string) => void, textMain?: string, borderColor?: string }) => {
  const [tempColor, setTempColor] = useState(value);

  // Sync prop changes -> tempColor
  useEffect(() => {
    setTempColor(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (tempColor !== value) {
        onChange(tempColor);
      }
    }, 150);
    return () => clearTimeout(handler);
  }, [tempColor, value, onChange]);

  return (
    <div className={`flex items-center gap-3 p-1.5 px-3 rounded-lg border ${borderColor || 'border-slate-200 dark:border-slate-700'} bg-black/20`}>
      <input
        type="color"
        value={tempColor}
        onChange={(e) => setTempColor(e.target.value)}
        className="h-5 w-5 rounded-md bg-transparent border-none cursor-pointer"
        style={{ padding: 0 }}
      />
      <span className={`text-[10px] font-mono font-bold ${textMain || 'text-slate-800 dark:text-slate-200'}`}>{tempColor}</span>
    </div>
  );
};

const DesignTab: React.FC<DesignTabProps> = ({ builderItems, design, setDesign }) => {
  const { theme: appTheme } = useTheme();
  const isAppDark = appTheme === 'dark';
  const [activeMode, setActiveMode] = useState<'card' | 'view'>('card');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isMappingVisible] = useState(true);
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);
  const [galleryTab, setGalleryTab] = useState<'card' | 'view'>('card');

  // Debounced update to global design state
  // We no longer need the local debounce loop here, the component handles it


  // Ensure design has initial values & fix lint by providing all required style fields
  const currentDesign = useMemo<CardDesignConfig>(() => design || {
    templateId: 'universal',
    viewTemplateId: 'immersive_flowbite',
    theme: 'dark' as 'light' | 'dark',
    mapping: {
      highlights: 'highlights-id',
      promotions: 'promotions-id'
    },
    visibility: {
      image: true,
      title: true,
      price: true,
      description: true,
      category: true,
      sku: true,
      stock: true,
      badge: true,
      actions: true,
      colors: true,
      sizes: true,
      rating: true
    },
    styles: {
      primaryColor: '#6366f1',
      borderRadius: 20,
      shadow: 20,
      padding: 20,
      fontFamily: 'plus-jakarta',
    }
  }, [design]);

  const allFields = useMemo(() => {
    let result: any[] = [];
    const traverse = (items: any[]) => {
      (items || []).forEach(it => {
        if (it.kind === 'field') result.push(it);
        else if (it.items) traverse(it.items);
        else if (it.fields) traverse(it.fields);
      });
    };
    traverse(builderItems);
    return result;
  }, [builderItems]);

  const handleUpdateMapping = (slot: string, fieldId: string) => {
    const newMapping = { ...(currentDesign.mapping || {}), [slot]: fieldId };
    setDesign({ ...currentDesign, mapping: newMapping });
  };

  const toggleVisibility = (slot: string) => {
    const newVisibility = {
      ...(currentDesign.visibility || {}),
      [slot]: !((currentDesign.visibility || {})[slot] ?? true)
    };
    setDesign({ ...currentDesign, visibility: newVisibility });
  };

  const handleAutoMap = () => {
    const roles: (any)[] = ['title', 'price', 'description', 'image', 'category', 'sku', 'stock', 'badge', 'highlights', 'promotions', 'variantsSection'];
    const newMapping = { ...currentDesign.mapping };
    const keywords: Record<string, string[]> = {
      title: ['name', 'title', 'product'],
      price: ['price', 'cost', 'msrp'],
      image: ['image', 'photo', 'picture', 'media'],
      description: ['desc', 'about', 'details'],
      category: ['category', 'type', 'tag'],
      sku: ['sku', 'code', 'id'],
      stock: ['stock', 'qty', 'quantity'],
      rating: ['rating', 'rate', 'star'],
      reviewCount: ['review', 'count', 'total', 'votes'],
      highlights: ['spec', 'highlight', 'tech', 'feature', 'key'],
      promotions: ['offer', 'promo', 'discount', 'bank']
    };
    roles.forEach(role => {
      if (!newMapping[role]) {
        const match = allFields.find(f => {
          const label = f.label.toLowerCase();
          return keywords[role]?.some(k => label.includes(k));
        });
        if (match) newMapping[role] = match.id;
      }
    });

    // Special Auto-Map for variants section (Find first repeatable section)
    if (!newMapping.variantsSection) {
      const allItems: any[] = [];
      const traverse = (items: any[]) => {
        (items || []).forEach(it => {
          allItems.push(it);
          if (it.items) traverse(it.items);
          if (it.fields) traverse(it.fields);
        });
      };
      traverse(builderItems);
      const repeatableSection = allItems.find(it => it.kind === 'section' && it.isRepeatable);
      if (repeatableSection) newMapping.variantsSection = repeatableSection.id;
    }

    setDesign({ ...currentDesign, mapping: newMapping });
  };

  const mappableSlots = [
    { id: 'image', label: 'Primary Image', icon: ImageIcon },
    { id: 'gallery', label: 'Image Gallery', icon: GridIcon },
    { id: 'title', label: 'Product Title', icon: FileText },
    { id: 'price', label: 'Price Display', icon: Palette },
    { id: 'description', label: 'Product Description', icon: FileText },
    { id: 'category', label: 'Category/Tag', icon: LayoutGrid },
    { id: 'sku', label: 'SKU Identifier', icon: Box },
    { id: 'barcode', label: 'Barcode/EAN', icon: Scan },
    { id: 'stock', label: 'Stock Status', icon: LayoutGrid },
    { id: 'badge', label: 'Promotion Badge', icon: MousePointer2 },
    { id: 'rating', label: 'Product Rating', icon: Star },
    { id: 'reviewCount', label: 'Review Count', icon: FileText },
    { id: 'colors', label: 'Available Colors', icon: Palette },
    { id: 'sizes', label: 'Available Sizes', icon: Maximize },
    { id: 'highlights', label: 'Feature Highlights', icon: GridIcon },
    { id: 'promotions', label: 'Promotional Offers', icon: Gift },
    { id: 'variantsSection', label: 'Variants Section', icon: Layers }
  ];

  const currentTemplate = useMemo(() => {
    const templateId = activeMode === 'view' ? currentDesign.viewTemplateId : currentDesign.templateId;
    return [...VERTICAL_TEMPLATES, ...HORIZONTAL_TEMPLATES, ...DETAIL_TEMPLATES].find(t => t.id === templateId);
  }, [currentDesign.templateId, currentDesign.viewTemplateId, activeMode]);

  const activeSlots = useMemo(() => {
    if (!currentTemplate || !('supportedSlots' in currentTemplate)) return mappableSlots;
    const supported = (currentTemplate as any).supportedSlots as string[];
    return mappableSlots.filter(s => supported.includes(s.id));
  }, [currentTemplate, mappableSlots]);

  // WORKSPACE THEME CONSTANTS (SYNCED WITH APP TOGGLE)
  const surfaceBg = isAppDark ? 'bg-[#0B0F1A]' : 'bg-slate-50';
  const itemBg = isAppDark ? 'bg-[#151B2B]' : 'bg-white';
  const borderColor = isAppDark ? 'border-[#222B3F]' : 'border-slate-200';
  const textMain = isAppDark ? 'text-white' : 'text-slate-900';
  const textMuted = isAppDark ? 'text-slate-400' : 'text-slate-500';
  const handleSelectTemplate = (templateId: string) => {
    const isDetail = DETAIL_TEMPLATES.some(t => t.id === templateId);
    
    const { elements, pages, rootStyles, blocks, content, ...rest } = (currentDesign as any);

    const newDesign = {
      ...rest,
      templateId: isDetail ? currentDesign.templateId : templateId,
      viewTemplateId: isDetail ? templateId : currentDesign.viewTemplateId,
    };

    setDesign(newDesign as CardDesignConfig);
    
    // Auto-update mode if template changes type
    if (isDetail) setActiveMode('view');
    else setActiveMode('card');
  };

  return (
    <div
      onClick={() => setSelectedSlot(null)}
      className={`flex flex-col w-full min-h-screen ${surfaceBg} transition-colors duration-500 relative overflow-x-hidden`}
    >

      {isTemplateSelectorOpen && <section className={`antialiased w-full ${surfaceBg} ${textMain}`}>
        <div className="max-w-7xl mx-auto px-4 2xl:px-0">
          <div
            onClick={(e) => e.stopPropagation()}
            className={`sticky top-0 z-10 w-full border-b ${borderColor} ${itemBg} px-8 py-4 flex items-center justify-between shadow-lg backdrop-blur-md bg-opacity-95 mb-5`}
          >
            <div className="flex items-center gap-8">

              <div className="flex items-center gap-6 pl-8 border-l border-white/10">
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Product Theme</span>
                  <div className={`flex p-0.5 rounded-lg border ${borderColor} bg-black/20`}>
                    {['dark', 'light'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setDesign({ ...currentDesign, theme: t as 'dark' | 'light' })}
                        className={`px-4 py-1.5 rounded-md text-[9px] font-black uppercase transition-all ${currentDesign.theme === t ? 'bg-primary text-white shadow-xl' : textMuted}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Product Accent</span>
                  <DebouncedColorPicker 
                    value={design?.styles?.primaryColor || '#6366f1'} 
                    onChange={(color) => {
                      setDesign({
                        ...currentDesign,
                        styles: {
                          borderRadius: 20,
                          shadow: 20,
                          padding: 20,
                          fontFamily: 'plus-jakarta',
                          ...currentDesign.styles,
                          primaryColor: color
                        }
                      });
                    }}
                    textMain={textMain}
                    borderColor={borderColor}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">View Mode</span>
                  <div className={`flex p-0.5 rounded-lg border ${borderColor} bg-black/20`}>
                    <button
                      onClick={() => setGalleryTab('card')}
                      className={`px-4 py-1.5 rounded-md text-[9px] font-black uppercase transition-all ${galleryTab === 'card' ? 'bg-emerald-500 text-white shadow-xl' : textMuted}`}
                    >
                      Card
                    </button>
                    <button
                      onClick={() => setGalleryTab('view')}
                      className={`px-4 py-1.5 rounded-md text-[9px] font-black uppercase transition-all ${galleryTab === 'view' ? 'bg-emerald-500 text-white shadow-xl' : textMuted}`}
                    >
                      PDP View
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                id="change-design-button"
                onClick={() => setIsTemplateSelectorOpen(false)}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:brightness-110 transition-all group"
              >
                <Brush size={14} className="group-hover:rotate-12 transition-transform" /> Close Gallery
              </button>
            </div>
          </div>

          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {galleryTab === 'card' ? (
              <>
                {/* VERTICAL CARD LAYOUTS */}
                <section>
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_12px_rgba(99,102,241,0.5)]" />
                    <h3 className="text-lg font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest">Vertical Cards</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8">
                    {VERTICAL_TEMPLATES.map((t) => (
                      <TemplateCardItem
                        key={t.id}
                        t={t}
                        isSelected={currentDesign.templateId === t.id}
                        builderItems={builderItems}
                        currentDesign={currentDesign}
                        onSelect={handleSelectTemplate}
                      />
                    ))}
                  </div>
                </section>

                {/* HORIZONTAL row LAYOUTS */}
                <section>
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                    <h3 className="text-lg font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest">Horizontal Rows</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {HORIZONTAL_TEMPLATES.map((t) => (
                      <TemplateCardItem
                        key={t.id}
                        t={t}
                        isSelected={currentDesign.templateId === t.id}
                        builderItems={builderItems}
                        currentDesign={currentDesign}
                        onSelect={handleSelectTemplate}
                      />
                    ))}
                  </div>
                </section>
              </>
            ) : (
              /* DETAIL VIEW LAYOUTS */
              <section>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-1.5 h-6 bg-indigo-500 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.5)]" />
                  <h3 className="text-lg font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest">Detailed Product Pages</h3>
                </div>
                <div className="grid grid-cols-1 gap-12 pb-20">
                  {DETAIL_TEMPLATES.map((t) => (
                    <TemplateCardItem
                      key={t.id}
                      t={t}
                      isSelected={currentDesign.viewTemplateId === t.id}
                      builderItems={builderItems}
                      currentDesign={currentDesign}
                      onSelect={handleSelectTemplate}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </section>}

      {!isTemplateSelectorOpen && <>
        {/* HEADER: GLOBAL CONTROLS */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={`sticky top-0 z-10 w-full border-b ${borderColor} ${itemBg} px-8 py-4 flex items-center justify-between shadow-lg backdrop-blur-md bg-opacity-95`}
        >
          <div className="flex items-center gap-8">

            <div className="flex items-center gap-6 pl-8 border-l border-white/10">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Product Theme</span>
                <div className={`flex p-0.5 rounded-lg border ${borderColor} bg-black/20`}>
                  {['dark', 'light'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setDesign({ ...currentDesign, theme: t as 'dark' | 'light' })}
                      className={`px-4 py-1.5 rounded-md text-[9px] font-black uppercase transition-all ${currentDesign.theme === t ? 'bg-primary text-white shadow-xl' : textMuted}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Product Accent</span>
                <DebouncedColorPicker 
                  value={design?.styles?.primaryColor || '#6366f1'} 
                  onChange={(color) => {
                    setDesign({
                      ...currentDesign,
                      styles: {
                        borderRadius: 20,
                        shadow: 20,
                        padding: 20,
                        fontFamily: 'plus-jakarta',
                        ...currentDesign.styles,
                        primaryColor: color
                      }
                    });
                  }}
                  textMain={textMain}
                  borderColor={borderColor}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">View Mode</span>
                <div className={`flex p-0.5 rounded-lg border ${borderColor} bg-black/20`}>
                  <button
                    onClick={() => setActiveMode('card')}
                    className={`px-4 py-1.5 rounded-md text-[9px] font-black uppercase transition-all ${activeMode === 'card' ? 'bg-emerald-500 text-white shadow-xl' : textMuted}`}
                  >
                    Card
                  </button>
                  <button
                    onClick={() => setActiveMode('view')}
                    className={`px-4 py-1.5 rounded-md text-[9px] font-black uppercase transition-all ${activeMode === 'view' ? 'bg-emerald-500 text-white shadow-xl' : textMuted}`}
                  >
                    PDP View
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              id="change-design-button"
              onClick={() => setIsTemplateSelectorOpen(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:brightness-110 transition-all group"
            >
              <Brush size={14} className="group-hover:rotate-12 transition-transform" /> Change Design
            </button>
          </div>
        </div>

        {/* WORKSPACE AREA */}
        <div className={`px-8 space-y-8 py-8 flex-1 flex flex-col`}>

          {/* PREVIEW CONTAINER */}
          <div
            onClick={(e) => e.stopPropagation()}
            className={`flex flex-col items-center justify-center transition-all duration-700 ${isMappingVisible ? 'pt-0' : 'flex-1 pt-12 pb-12'}`}
          >
                <CardRenderer
                  design={currentDesign}
                  data={{ ...mockData, imageUrl: DEFAULT_PREVIEW_IMAGE }}
                  template={{ form_schema: { items: builderItems }, design: currentDesign }}
                  mode={activeMode}
                  activeSlot={selectedSlot}
                  onSlotClick={(slot) => setSelectedSlot(slot)}
                  isPreview={true}
                />
          </div>

          {/* CONFIGURATION AREA */}
          {isMappingVisible && (
            <div className="grid grid-cols-12 gap-6 pb-20 fade-in animate-in duration-500">
              {/* ROLE ASSIGNMENT GRID */}
              <div className={`col-span-12 lg:col-span-7 border ${borderColor} ${itemBg} rounded-[2.5rem] flex flex-col shadow-lg overflow-hidden`}>
                <div className={`p-8 border-b ${borderColor} flex items-center justify-between bg-white/5`}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
                      <Layers size={24} />
                    </div>
                    <div>
                      <h3 className={`text-lg font-black ${textMain}`}>Role Assignment Matrix</h3>
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>Deep Schema Integration</p>
                    </div>
                  </div>
                  {/* Auto-Map moved here as a secondary tool */}
                  <button
                    onClick={handleAutoMap}
                    className={`flex items-center gap-2 px-4 py-2 ${borderColor} border rounded-xl text-[9px] font-black uppercase tracking-widest ${textMuted} hover:text-primary hover:border-primary transition-all`}
                  >
                    <Zap size={12} /> Smart Map
                  </button>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                  {activeSlots.map((slot) => {
                    const isSelected = selectedSlot === slot.id;
                    const mappedFieldId = (currentDesign.mapping || {})[slot.id];
                    const mappedField = allFields.find(f => f.id === mappedFieldId);

                    return (
                      <div
                        key={slot.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSlot(slot.id);
                        }}
                        className={`group relative p-5 rounded-2xl border transition-all cursor-pointer ${isSelected ? 'border-primary bg-primary/5 shadow-2xl' : `${borderColor} hover:bg-white/5`}`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-primary text-white shadow-lg' : 'bg-slate-500/10 text-slate-500'}`}>
                                <slot.icon size={18} />
                              </div>
                              {/* STATUS DOT */}
                              <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 ${isAppDark ? 'border-[#151B2B]' : 'border-white'} ${mappedFieldId ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            </div>
                            <div>
                              <h4 className={`text-xs font-black uppercase tracking-widest ${isSelected ? 'text-primary' : textMain}`}>{slot.label}</h4>
                              <span className={`text-[9px] font-bold ${textMuted}`}>{mappedField ? mappedField.label : 'Available'}</span>
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="pt-2">
                            <CustomSelect
                              options={[
                                { label: 'Unmapped', value: '' },
                                ...allFields.map(f => ({ label: f.label, value: f.id }))
                              ]}
                              value={mappedFieldId || ''}
                              onChange={(val: string) => handleUpdateMapping(slot.id, val)}
                              className="border-primary/30 h-10! text-xs"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* VISIBILITY & TOOLS */}
              <div className={`col-span-12 lg:col-span-5 flex flex-col gap-6`}>
                <div className={`border ${borderColor} ${itemBg} rounded-[2.5rem] p-8 shadow-xl space-y-8`}>
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <Eye className="text-primary" size={18} />
                      <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] ${textMuted}`}>Visibility Rules</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {activeSlots.map((slot) => {
                        const isVisible = (currentDesign.visibility || {})[slot.id] ?? true;
                        return (
                          <div
                            key={slot.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleVisibility(slot.id);
                            }}
                            className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${isVisible ? `bg-primary/5 border-primary/30` : `${borderColor} opacity-40 grayscale hover:opacity-60`}`}
                          >
                            <div className="flex items-center gap-2">
                              <slot.icon size={14} className={isVisible ? 'text-primary' : textMuted} />
                              <span className={`text-[10px] font-bold ${isVisible ? textMain : textMuted}`}>{slot.label}</span>
                            </div>
                            <div className={`p-1.5 rounded-lg ${isVisible ? 'text-primary hover:bg-primary/10' : textMuted}`}>
                              {isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-6 pt-8 border-t border-white/5">
                    <div className="flex items-center gap-3">
                      <Split className="text-secondary" size={18} />
                      <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] ${textMuted}`}>Modular Units</h4>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: 'Table', icon: TableIcon, color: 'text-secondary' },
                        { label: 'Grid', icon: GridIcon, color: 'text-orange-500' },
                        { label: 'Hero', icon: ImageIcon, color: 'text-blue-500' }
                      ].map((tool, i) => (
                        <button key={i} className={`flex flex-col items-center gap-3 p-5 rounded-2xl border ${borderColor} ${surfaceBg} transition-all group opacity-60 hover:opacity-100 hover:scale-[1.02] shadow-sm`}>
                          <tool.icon size={24} className={tool.color} />
                          <span className={`text-[9px] font-bold uppercase tracking-widest ${textMuted}`}>{tool.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </>}
    </div>
  );
};

export default DesignTab;
