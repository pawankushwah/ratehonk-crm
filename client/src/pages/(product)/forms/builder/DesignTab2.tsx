import { useState, useMemo, useEffect } from 'react';
import { 
  Brush, 
  Palette, 
  FileText, 
  MousePointer2, 
  Box, 
  Image as ImageIcon, 
  Columns as GridIcon, 
  Eye, 
  EyeOff, 
  Layers, 
  Split, 
  Zap, 
  Star, 
  Scan, 
  Maximize, 
  Gift
} from 'lucide-react';
import CardRenderer from '@/components/products/CardRenderer';
import { 
  VERTICAL_TEMPLATES, 
  HORIZONTAL_TEMPLATES, 
  DETAIL_TEMPLATES 
} from './templates';
import CustomSelect from '@/components/products/CustomSelect';
import Drawer from '@/components/products/Drawer';

interface DesignTab2Props {
  builderItems: any[];
  design: any | null;
  setDesign: (design: any) => void;
}

const DEFAULT_PREVIEW_IMAGE = '/src/assets/images/default-product-1.png';

const DebouncedColorPicker = ({ value, onChange, textMain, borderColor }: { value: string, onChange: (color: string) => void, textMain?: string, borderColor?: string }) => {
  const [tempColor, setTempColor] = useState(value);

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

export default function DesignTab2({ builderItems, design, setDesign }: DesignTab2Props) {
  // const { theme: appTheme } = useTheme();
  const isAppDark = false;

  const surfaceBg = isAppDark ? 'bg-[#0B0F1A]' : 'bg-slate-50';
  const itemBg = isAppDark ? 'bg-[#151B2B]' : 'bg-white';
  const borderColor = isAppDark ? 'border-[#222B3F]' : 'border-slate-200';
  const textMain = isAppDark ? 'text-white' : 'text-slate-900';
  const textMuted = isAppDark ? 'text-slate-400' : 'text-slate-500';

  const [activeMode, setActiveMode] = useState<'card' | 'view'>('card');
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Fallback design if null
  const currentDesign = useMemo(() => {
    if (!design || Object.keys(design).length === 0) return {
      templateId: 'universal',
      viewTemplateId: 'immersive_flowbite',
      theme: 'light' as 'light' | 'dark',
      mapping: {},
      visibility: {},
      styles: {
        primaryColor: '#6366f1',
        borderRadius: 'lg',
        padding: 'md',
        fontFamily: 'plus-jakarta'
      }
    };
    return design;
  }, [design]);

  const allFields = useMemo(() => {
    let result: any[] = [];
    const traverse = (items: any[]) => {
      (items || []).forEach(it => {
        if (it.kind === 'field' || it.kind === 'section' || it.kind === 'group') {
          result.push(it);
        }
        if (it.items) traverse(it.items);
        else if (it.fields) traverse(it.fields);
      });
    };
    traverse(builderItems);
    return result;
  }, [builderItems]);

  const mappableSlots = [
    { id: 'image', label: 'Primary Image', icon: ImageIcon, allowedTypes: ['image', 'file'] },
    { id: 'gallery', label: 'Image Gallery', icon: GridIcon, allowedTypes: ['image', 'file', 'array', 'gallery'] },
    { id: 'title', label: 'Product Title', icon: FileText, allowedTypes: ['text', 'select', 'addable-select', 'radio', 'id', 'formula'] },
    { id: 'price', label: 'Price Display', icon: Palette, allowedTypes: ['number', 'currency', 'formula', 'text'] },
    { id: 'description', label: 'Product Description', icon: FileText, allowedTypes: ['text', 'textarea', 'richtext'] },
    { id: 'category', label: 'Category/Tag', icon: Layers, allowedTypes: ['text', 'select', 'addable-select', 'radio', 'badge'] },
    { id: 'sku', label: 'SKU Identifier', icon: Box, allowedTypes: ['sku'] },
    { id: 'barcode', label: 'Barcode/EAN', icon: Scan, allowedTypes: ['barcode', 'text', 'number'] },
    { id: 'stock', label: 'Stock Status', icon: Layers, noMapping: true },
    { id: 'badge', label: 'Promotion Badge', icon: MousePointer2, noMapping: true },
    { id: 'rating', label: 'Product Rating', icon: Star, noMapping: true },
    { id: 'reviewCount', label: 'Review Count', icon: FileText, noMapping: true },
    { id: 'colors', label: 'Available Colors', icon: Palette, allowedTypes: ['color'] },
    { id: 'sizes', label: 'Available Sizes', icon: Maximize, allowedTypes: ['select', 'addable-select', 'radio', 'checkbox', 'text'] },
    { id: 'highlights', label: 'Feature Highlights', icon: GridIcon, allowedTypes: ['text', 'textarea', 'list', 'richtext', 'array', 'key-value'] },
    { id: 'promotions', label: 'Promotional Offers', icon: Gift, noMapping: true },
    { id: 'variantsSection', label: 'Variants Section', icon: Layers, allowedTypes: ['section', 'array', 'group'] },
    { id: 'actions', label: 'Actions', icon: MousePointer2, noMapping: true }
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

  const activeMapping = useMemo(() => {
    if (activeMode === 'view') return currentDesign.viewMapping || currentDesign.mapping || {};
    return currentDesign.cardMapping || currentDesign.mapping || {};
  }, [currentDesign, activeMode]);

  const activeVisibility = useMemo(() => {
    if (activeMode === 'view') return currentDesign.viewVisibility || currentDesign.visibility || {};
    return currentDesign.cardVisibility || currentDesign.visibility || {};
  }, [currentDesign, activeMode]);

  const handleUpdateMapping = (slotId: string, fieldId: string) => {
    const key = activeMode === 'view' ? 'viewMapping' : 'cardMapping';
    const newMapping = { ...(activeMapping), [slotId]: fieldId };
    setDesign({ ...currentDesign, [key]: newMapping });
  };

  const toggleVisibility = (slot: string) => {
    const key = activeMode === 'view' ? 'viewVisibility' : 'cardVisibility';
    const newVisibility = {
      ...(activeVisibility),
      [slot]: !(activeVisibility[slot] ?? true)
    };
    setDesign({ ...currentDesign, [key]: newVisibility });
  };

  const handleAutoMap = () => {
    const roles: (any)[] = ['title', 'price', 'description', 'image', 'category', 'sku', 'stock', 'badge', 'highlights', 'promotions', 'variantsSection'];
    const newMapping = { ...activeMapping };
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
      // Skip static slots
      const slotDef = mappableSlots.find(s => s.id === role);
      if (slotDef?.noMapping) return;

      if (!newMapping[role]) {
        const match = allFields.find(f => {
          const label = f.label.toLowerCase();
          return keywords[role]?.some(k => label.includes(k));
        });
        if (match) newMapping[role] = match.id;
      }
    });

    if (!newMapping.variantsSection) {
      const repeatableSection = builderItems.find(it => it.kind === 'section' && it.isRepeatable);
      if (repeatableSection) newMapping.variantsSection = repeatableSection.id;
    }

    const key = activeMode === 'view' ? 'viewMapping' : 'cardMapping';
    setDesign({ ...currentDesign, [key]: newMapping });
  };

  return (
    <div className={`flex flex-col w-full min-h-screen ${surfaceBg} transition-colors duration-500 relative overflow-x-hidden p-6`}>
      {/* WIREFRAME: HEADER */}
      <div className={`w-full border ${borderColor} ${itemBg} rounded-2xl px-6 py-4 flex items-center justify-between shadow-sm mb-6`}>
        {/* Left Side: Toggles (Card/PDP, Theme, Accent) */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={`flex p-1 rounded-xl border ${borderColor} bg-black/5 dark:bg-black/20`}>
              <button
                onClick={() => setActiveMode('card')}
                className={`px-6 py-2 rounded-lg text-[11px] font-black uppercase transition-all ${activeMode === 'card' ? 'bg-primary text-white shadow-md' : textMuted + ' hover:text-primary'}`}
              >
                Card
              </button>
              <button
                onClick={() => setActiveMode('view')}
                className={`px-6 py-2 rounded-lg text-[11px] font-black uppercase transition-all ${activeMode === 'view' ? 'bg-primary text-white shadow-md' : textMuted + ' hover:text-primary'}`}
              >
                PDP
              </button>
            </div>
          </div>

          {/* <div className="flex items-center gap-2">
            <div className={`flex p-1 rounded-xl border ${borderColor} bg-black/5 dark:bg-black/20`}>
              {['dark', 'light'].map((t) => (
                <button
                  key={t}
                  onClick={() => setDesign({ ...currentDesign, theme: t as 'dark' | 'light' })}
                  className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase transition-all ${currentDesign.theme === t ? 'bg-emerald-500 text-white shadow-md' : textMuted + ' hover:text-emerald-500'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div> */}

          <div className="flex items-center gap-2">
            <DebouncedColorPicker 
              value={currentDesign.styles?.primaryColor || '#6366f1'} 
              onChange={(color) => {
                setDesign({
                  ...currentDesign,
                  styles: {
                    ...currentDesign.styles,
                    primaryColor: color
                  }
                });
              }}
              textMain={textMain}
              borderColor={borderColor}
            />
          </div>
        </div>

        <div className="flex items-center">
          <button
            onClick={() => setIsTemplateSelectorOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:brightness-110 transition-all group"
          >
            <Brush size={16} className="group-hover:rotate-12 transition-transform" /> Change Design
          </button>
        </div>
      </div>

      {/* WIREFRAME: PREVIEW AREA */}
      <div className={`w-full flex-1 border ${borderColor} ${itemBg} rounded-2xl flex flex-col ${activeMode === 'card' ? 'items-center justify-center' : 'items-stretch'} p-8 shadow-sm mb-6 min-h-[500px]`}>
        <div className={`w-full ${activeMode === 'view' ? 'max-w-5xl mx-auto' : ''}`}>
          {(() => {
            const allTemplates = [...VERTICAL_TEMPLATES, ...HORIZONTAL_TEMPLATES, ...DETAIL_TEMPLATES];
            const currentTemplate = allTemplates.find(
              t => activeMode === 'card' ? t.id === currentDesign.templateId : t.id === currentDesign.viewTemplateId
            );
            const currentMockData = (currentTemplate?.mockData || {}) as any;

            return (
              <CardRenderer
                design={currentDesign}
                data={{ ...currentMockData, imageUrl: currentMockData.imageUrl || DEFAULT_PREVIEW_IMAGE }}
                template={{ form_schema: { items: builderItems }, design: currentDesign }}
                mode={activeMode}
                onSlotClick={(slot) => setSelectedSlot(slot)}
                activeSlot={selectedSlot}
                isPreview={true}
              />
            );
          })()}
        </div>
      </div>

      {/* WIREFRAME: MAPPING AREA */}
      <div className={`w-full border ${borderColor} ${itemBg} rounded-2xl p-8 shadow-sm mb-20`}>
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-glass-border">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Split size={20} />
             </div>
             <div>
                <h3 className={`text-lg font-black uppercase tracking-tighter ${textMain}`}>Mapping & Configuration</h3>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>Connect your fields to the template slots</p>
             </div>
          </div>
          <button
            onClick={handleAutoMap}
            className={`flex items-center gap-2 px-4 py-2 border ${borderColor} rounded-xl text-[10px] font-black uppercase tracking-widest ${textMuted} hover:text-primary hover:border-primary transition-all bg-black/5`}
          >
            <Zap size={14} /> Smart Map
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeSlots.map((slot) => {
            const isSelected = selectedSlot === slot.id;
            const mappedFieldId = (activeMapping || {})[slot.id];
            const mappedField = allFields.find(f => f.id === mappedFieldId);
            const isVisible = (activeVisibility || {})[slot.id] ?? true;

            // Type filtering logic
            const compatibleFields = allFields.filter(f => {
              if (!slot.allowedTypes || slot.allowedTypes.length === 0) return true;
              // Check kind match or type match
              const kind = f.kind?.toLowerCase();
              const type = f.type?.toLowerCase();
              return slot.allowedTypes.includes(kind) || (type && slot.allowedTypes.includes(type));
            });

            return (
              <div
                key={slot.id}
                onClick={() => setSelectedSlot(slot.id)}
                className={`group relative p-5 rounded-2xl border transition-all cursor-pointer ${isSelected ? 'border-primary bg-primary/5 shadow-md' : `${borderColor} hover:bg-black/5`}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className={`p-3 rounded-xl transition-all ${isSelected ? 'bg-primary text-white' : 'bg-gray-500/10 text-gray-500'}`}>
                        <slot.icon size={20} />
                      </div>
                      <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 ${isAppDark ? 'border-[#151B2B]' : 'border-white'} ${slot.noMapping ? (isVisible ? 'bg-emerald-500' : 'bg-red-400') : (mappedFieldId ? 'bg-emerald-500' : 'bg-red-500')}`} />
                    </div>
                    <div>
                      <h4 className={`text-xs font-black uppercase tracking-widest ${isSelected ? 'text-primary' : textMain}`}>{slot.label}</h4>
                      <p className={`text-[10px] font-bold ${textMuted} truncate max-w-[200px]`}>
                        {slot.noMapping 
                          ? (isVisible ? 'Currently Visible' : 'Currently Hidden')
                          : (mappedField ? `Mapped to: ${mappedField.label}` : 'Click to map field')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleVisibility(slot.id); }}
                    className={`p-2 rounded-lg transition-all ${isVisible ? 'text-primary bg-primary/10' : 'text-text-muted bg-black/5 opacity-50'}`}
                  >
                    {isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>

                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-glass-border animate-in slide-in-from-top-2 duration-200">
                    {!slot.noMapping ? (
                      <>
                        <CustomSelect
                          options={[
                            { label: 'Not Mapped', value: '' },
                            ...compatibleFields.map(f => ({ 
                              label: `${f.label} (${f.type || 'unknown'})`, 
                              value: f.id 
                            }))
                          ]}
                          value={mappedFieldId || ''}
                          onChange={(val: string) => handleUpdateMapping(slot.id, val)}
                          className="border-primary/20"
                        />
                        {compatibleFields.length === 0 && (
                          <p className="mt-2 text-[8px] font-black uppercase text-amber-500 animate-pulse">
                            ⚠️ No compatible {slot.allowedTypes?.join('/')} fields found
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-2 py-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
                          Standard Component — No mapping required
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* WIREFRAME: TEMPLATE GALLERY DRAWER */}
      <Drawer
        isOpen={isTemplateSelectorOpen}
        onClose={() => setIsTemplateSelectorOpen(false)}
        title="Select Template"
        size='3xl'
      >
        <div className="space-y-8">
          {/* Section: Mode Specific Templates */}
          {(activeMode === 'card' ? [
            { title: 'Vertical Cards', templates: VERTICAL_TEMPLATES },
            { title: 'Horizontal Cards', templates: HORIZONTAL_TEMPLATES }
          ] : [
            { title: 'Detail Page Views', templates: DETAIL_TEMPLATES }
          ]).map((group) => (
            <div key={group.title} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-4 bg-primary rounded-full" />
                <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${textMuted}`}>{group.title}</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {group.templates.map((tmpl) => {
                  const isSelected = activeMode === 'card' 
                    ? currentDesign.templateId === tmpl.id 
                    : currentDesign.viewTemplateId === tmpl.id;

                  return (
                    <button
                      key={tmpl.id}
                      onClick={() => {
                        if (activeMode === 'card') {
                          setDesign({ ...currentDesign, templateId: tmpl.id });
                        } else {
                          setDesign({ ...currentDesign, viewTemplateId: tmpl.id });
                        }
                        setIsTemplateSelectorOpen(false);
                      }}
                      className={`group relative flex flex-col p-4 rounded-2xl border transition-all text-left ${isSelected ? 'border-primary bg-primary/5 shadow-lg' : `${borderColor} hover:bg-black/5`}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className={`text-sm font-bold ${isSelected ? 'text-primary' : textMain}`}>{tmpl.name}</h4>
                          <p className={`text-[10px] font-medium uppercase tracking-widest ${textMuted}`}>{tmpl.id}</p>
                        </div>
                        {isSelected && (
                          <div className="p-1 px-2 bg-primary text-white rounded-md text-[8px] font-black uppercase">Active</div>
                        )}
                      </div>
                      
                      {/* Mini Preview */}
                      <div className={`w-full aspect-4/3 rounded-xl border ${borderColor} overflow-hidden  bg-black/5 flex items-center justify-center relative`}>
                        <div className='h-60 overflow-hidden flex justify-center items-center'>
                        <div className={`transition-all opacity-80 group-hover:opacity-100 pointer-events-none h-[200%] ${tmpl.type === 'detail' ? 'scale-[0.1]' : tmpl.type === 'card' ? 'scale-[0.55]' : 'w-[600px] h-full scale-[0.55]'}`}>
                          <CardRenderer 
                            mode={activeMode}
                            data={tmpl.mockData}
                            design={{ ...currentDesign, templateId: tmpl.id, viewTemplateId: tmpl.id }}
                            isPreview={true}
                          />
                        </div>
                        </div>

                        {!isSelected && <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100 transition-opacity">
                           <span className="bg-primary text-white text-[10px] font-black uppercase px-4 py-2 rounded-full shadow-lg">Select Design</span>
                        </div>}
                      </div>

                      {/* <div className="mt-3 flex items-center justify-between">
                         <div className="flex gap-1">
                            {tmpl.supportedSlots.slice(0, 4).map(s => (
                              <div key={s} className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" title={s} />
                            ))}
                            {tmpl.supportedSlots.length > 4 && <span className="text-[8px] font-bold text-text-muted">+{tmpl.supportedSlots.length - 4}</span>}
                         </div>
                         <ChevronRight size={14} className={`${textMuted} group-hover:text-primary transition-colors`} />
                      </div> */}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Drawer>
    </div>
  );
}