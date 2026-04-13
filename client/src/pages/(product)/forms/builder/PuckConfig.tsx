import {
  Barcode as BarcodeIcon,
  Tag,
  Box,
  DollarSign,
  Heart,
  Share2,
  Info,
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import type { Config, Field } from '@puckeditor/core';
import { useResolvedField } from './ProductDataContext';
import { resolveImageUrl, formatDisplayValue } from '../../../../utils/dynamicRenderer';

// 1. Shared Props for Data Mapping
export interface MappedProp {
  fieldId?: string;
  staticText?: string;
}

export type PuckData = {
  content: any[];
  root: {
    styles?: {
      theme?: 'light' | 'dark';
      primaryColor?: string;
      borderRadius?: string;
      shadow?: string;
    }
  };
};

// 2. Custom Data Mapper Field
const createMappingField = (label: string, fields: any[]): Field => ({
  type: "select",
  label,
  options: [
    { label: "--- Select Mapping ---", value: "" },
    ...fields.map(f => ({ label: f.label || f.id, value: f.id }))
  ]
});

const ASPECT_RATIOS: Record<string, string> = {
  "auto": "aspect-auto",
  "square": "aspect-square",
  "portrait": "aspect-[3/4]",
  "landscape": "aspect-[16/9]",
  "tall": "aspect-[2/3]"
};

// 3. Puck Configuration
export const getPuckConfig = (formFields: any[]): Config => ({
  components: {
    // A. Visual Header
    ProductImage: {
      fields: {
        fieldId: createMappingField("Image Source", formFields),
        aspectRatio: {
          type: "select",
          label: "Aspect Ratio",
          options: [
            { label: "1:1 Square", value: "aspect-square" },
            { label: "4:3 Classic", value: "aspect-4/3" },
            { label: "16:9 Wide", value: "aspect-video" },
            { label: "4:5 Tall", value: "aspect-4/5" }
          ]
        },
        overlay: { type: "checkbox", label: "Gradient Overlay" }
      },
      render: ({ fieldId, aspectRatio = "aspect-square", overlay }: any) => {
        const resolvedValue = useResolvedField(fieldId);
        const url = resolveImageUrl(resolvedValue) || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80";
        
        return (
          <div className={`relative ${aspectRatio} bg-current/5 overflow-hidden rounded-2xl group`}>
            <img src={url} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" alt="Product" />
            {overlay && <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-60" />}
          </div>
        );
      }
    },

    // B. Title & Category
    TitleSection: {
      fields: {
        titleField: createMappingField("Title Source", formFields),
        categoryField: createMappingField("Category Source", formFields),
        alignment: {
          type: "radio",
          label: "Alignment",
          options: [
            { label: "Left", value: "text-left" },
            { label: "Center", value: "text-center" }
          ]
        },
        fontSize: {
          type: "select",
          label: "Font Size",
          options: [
            { label: "Large (2XL)", value: "text-2xl" },
            { label: "Extra (4XL)", value: "text-4xl" },
            { label: "Massive (6XL)", value: "text-6xl" }
          ]
        }
      },
      render: ({ titleField, categoryField, alignment = "text-left", fontSize = "text-2xl" }: any) => {
        const title = useResolvedField(titleField) || "Product Title Instance";
        const category = useResolvedField(categoryField) || "Category";
        
        return (
          <div className={`space-y-2 p-4 ${alignment}`}>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">
              {category}
            </span>
            <h2 className={`${fontSize} font-black text-current tracking-tight leading-none`}>
              {title}
            </h2>
          </div>
        );
      }
    },

    // C. Pricing Architecture
    PriceDisplay: {
      fields: {
        fieldId: createMappingField("Price Source", formFields),
        size: {
          type: "radio",
          label: "Scale",
          options: [
            { label: "Standard", value: "text-3xl" },
            { label: "High Impact", value: "text-6xl" }
          ]
        }
      },
      render: ({ fieldId, size = "text-3xl" }: any) => {
        const val = useResolvedField(fieldId);
        const formatted = formatDisplayValue(val, 'price');
        
        return (
          <div className="p-4 flex flex-col items-start gap-1">
             <span className="text-[8px] font-black uppercase tracking-widest opacity-40 text-current">MSRP / Retail</span>
             <div className={`${size} font-black text-current tracking-tighter tabular-nums`}>
                {formatted}
             </div>
          </div>
        );
      }
    },

    // D. Technical Verification Section (Barcode)
    BarcodeBlock: {
      fields: {
         fieldId: createMappingField("SKU/Serial Source", formFields),
         theme: {
           type: "select",
           label: "Visual Theme",
           options: [
             { label: "Standard 1D", value: "1d" },
             { label: "Retail Compact", value: "compact" }
           ]
         }
      },
      render: ({ fieldId}: any) => {
        const sku = useResolvedField(fieldId) || "SKU-PREVIEW-X9";
        return (
          <div className="m-4 p-8 bg-current/5 border border-current/10 rounded-4xl flex items-center justify-between">
             <div className="space-y-1">
                <span className="text-[9px] font-black uppercase opacity-40 tracking-widest text-current">Product ID</span>
                <p className="text-xl font-mono text-current tracking-widest uppercase truncate max-w-[150px]">
                   {sku}
                </p>
             </div>
             <div className="flex flex-col items-center opacity-40">
                <BarcodeIcon size={48} className="text-current" strokeWidth={1} />
                <span className="text-[7px] font-bold text-current mt-1 uppercase">Ratehonk Verify</span>
             </div>
          </div>
        );
      }
    },

    // F. Variant Swatches
    ColorBar: {
      fields: {
         label: { type: "text", label: "Group Label" },
         fieldId: createMappingField("Colors Source", formFields),
         style: {
           type: "radio",
           label: "Style",
           options: [
             { label: "Circular", value: "rounded-full" },
             { label: "Rounded", value: "rounded-lg" }
           ]
         }
      },
      render: ({ label = "Available Colors", style = "rounded-full" }: any) => (
        <div className="p-4 space-y-4">
           <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 text-current">{label}</span>
           <div className="flex gap-2">
              {['#ec4899', '#3b82f6', '#10b981', '#f59e0b'].map(c => (
                <div key={c} className={`w-8 h-8 ${style} border border-current/10 shadow-xl transition-transform hover:scale-110 cursor-pointer`} style={{ backgroundColor: c }} />
              ))}
           </div>
        </div>
      )
    },

    // G. Metric Cards (for Detail View)
    MetricCard: {
      fields: {
        label: { type: "text", label: "Label" },
        fieldId: createMappingField("Value Source", formFields),
        icon: {
          type: "select",
          label: "Icon",
          options: [
            { label: "Dollar", value: "DollarSign" },
            { label: "Box", value: "Box" },
            { label: "Shield", value: "ShieldCheck" },
            { label: "Zap", value: "Zap" },
            { label: "Tag", value: "Tag" }
          ]
        }
      },
      render: ({ label, fieldId, icon }: any) => {
        const val = useResolvedField(fieldId);
        const Icon = { DollarSign, Box, ShieldCheck, Zap, Tag }[icon as string] || Info;
        
        return (
          <div className="p-6 rounded-3xl bg-current/5 border border-current/10 flex flex-col items-center text-center group hover:bg-primary/5 transition-all">
             <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Icon size={24} />
             </div>
             <p className="text-[10px] uppercase font-black tracking-widest opacity-40 mb-1">{label}</p>
             <p className="text-xl font-black text-current">{val || "—"}</p>
          </div>
        );
      }
    },

    // H. Layout Grid (Two Columns)
    LayoutGrid: {
      render: ({ slots }: any) => (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-8">
           <div className="lg:col-span-5 space-y-6">{slots?.left}</div>
           <div className="lg:col-span-7 space-y-8">{slots?.right}</div>
        </div>
      )
    },

    // I. Action Buttons
    ActionButtons: {
      fields: {
        layout: { 
          type: "radio", 
          label: "Layout",
          options: [{ label: "Full Width", value: "full" }, { label: "Split", value: "between" }]
        }
      },
      render: ({ layout = "between" }: any) => (
        <div className={`flex gap-4 pt-6 ${layout === 'full' ? 'flex-col' : ''}`}>
           <button className="flex-1 h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all">
              Initiate Order
           </button>
           <button className="w-16 h-16 rounded-2xl bg-current/5 border border-current/10 flex items-center justify-center text-current hover:bg-primary/10 transition-all">
              <Heart size={24} />
           </button>
           <button className="w-16 h-16 rounded-2xl bg-current/5 border border-current/10 flex items-center justify-center text-current hover:bg-primary/10 transition-all">
              <Share2 size={24} />
           </button>
        </div>
      )
    },

    // J. Info List
    InfoList: {
      fields: {
        title: { type: "text", label: "Section Title" }
      },
      render: ({ title = "Product Details" }: any) => (
        <div className="p-4 space-y-4">
           <div className="flex items-center gap-2 text-primary">
              <Info size={18} />
              <h3 className="font-bold uppercase tracking-widest text-xs">{title}</h3>
           </div>
           <div className="space-y-3 opacity-60">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between border-b border-current/5 pb-2">
                   <span className="text-[10px] font-black uppercase tracking-widest">Detail Point {i}</span>
                   <ChevronRight size={14} />
                </div>
              ))}
           </div>
        </div>
      )
    },

    // K. Technical Specs (Blueprint)
    TechSpecs: {
      fields: {
        title: { type: "text", label: "Title" }
      },
      render: ({ title = "Technical Blueprint" }: any) => {
        return (
          <div className="p-8 rounded-[2.5rem] bg-current/5 border border-current/10 space-y-8">
             <div className="flex items-center gap-3 text-primary">
                <Zap size={22} className="fill-primary/20" />
                <h3 className="text-2xl font-black tracking-tight">{title}</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center justify-between border-b border-current/5 pb-3">
                     <span className="text-[10px] font-black uppercase tracking-widest opacity-40">System Parameter {i}</span>
                     <span className="text-xs font-bold font-mono">Mapped Value</span>
                  </div>
                ))}
             </div>
          </div>
        );
      }
    },

    // L. Granular Data Field (Single Item)
    DataField: {
      fields: {
         label: { type: "text", label: "Label override" },
         fieldId: createMappingField("Data Source", formFields),
         variant: {
           type: "select",
           label: "Visual Style",
           options: [
             { label: "Minimal", value: "minimal" },
             { label: "Glass Card", value: "glass" },
             { label: "Bold Badge", value: "bold" }
           ]
         }
      },
      render: ({ label, fieldId, variant = "minimal" }: any) => {
        const val = useResolvedField(fieldId);
        const resolvedLabel = label || formFields.find(f => f.id === fieldId)?.label || "Field";
        
        if (variant === "glass") {
          return (
            <div className="p-4 rounded-2xl bg-current/5 border border-current/10 backdrop-blur-md">
               <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">{resolvedLabel}</p>
               <p className="text-sm font-bold text-current">{val || "—"}</p>
            </div>
          );
        }

        if (variant === "bold") {
          return (
            <div className="flex items-center gap-3">
               <div className="px-3 py-1 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-lg">{resolvedLabel}</div>
               <div className="text-sm font-black text-current">{val || "—"}</div>
            </div>
          );
        }

        return (
          <div className="py-2 border-b border-current/5 flex items-center justify-between group hover:border-primary/30 transition-colors">
             <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{resolvedLabel}</span>
             <span className="text-sm font-bold text-current">{val || "—"}</span>
          </div>
        );
      }
    },

    // M. Data Table (Multi-Row)
    DataTable: {
      fields: {
        title: { type: "text", label: "Table Title" },
        rows: {
          type: "array",
          getItemSummary: (item: any) => item.label || "Row",
          props: {
            label: { type: "text", label: "Row Label" },
            fieldId: createMappingField("Row Data", formFields)
          }
        } as any
      },
      render: ({ title, rows = [] }: any) => (
        <div className="p-6 rounded-4xl bg-current/5 border border-current/10 space-y-4">
           {title && <h4 className="text-xs font-black uppercase tracking-[0.2em] opacity-40">{title}</h4>}
           <div className="space-y-0 text-sm">
              {rows.map((row: any, i: number) => (
                <div key={i} className={`flex items-center justify-between py-3 ${i !== rows.length - 1 ? 'border-b border-current/5' : ''}`}>
                   <span className="opacity-50 font-medium">{row.label || "Row Item"}</span>
                   <span className="font-bold text-current"><DataValue fieldId={row.fieldId} /></span>
                </div>
              ))}
           </div>
        </div>
      )
    },

    // N. Section Divider
    SectionDivider: {
      fields: {
        label: { type: "text", label: "Separator Text" },
        style: {
          type: "select",
          options: [{ label: "Line", value: "line" }, { label: "Dots", value: "dots" }]
        }
      },
      render: ({ label, style = "line" }: any) => (
        <div className="py-12 flex items-center gap-6">
           {label && <span className="text-[10px] font-black uppercase tracking-[0.5em] opacity-30 whitespace-nowrap">{label}</span>}
           <div className={`flex-1 ${style === 'line' ? 'h-px bg-current/10' : 'border-t border-dashed border-current/20'}`} />
        </div>
      )
    },

    // O. Flex Grid (Universal)
    FlexGrid: {
      fields: {
        columns: {
          type: "radio",
          label: "Column Count",
          options: [
            { label: "1 Wide", value: "1" },
            { label: "2 Split", value: "2" },
            { label: "3 Grid", value: "3" },
            { label: "4 Fine", value: "4" }
          ]
        }
      },
      render: ({ columns = "2", slots }: any) => (
        <div className={`grid gap-6 my-6 grid-cols-1 md:grid-cols-${columns}`}>
           {Array.from({ length: parseInt(columns) }).map((_, i) => (
             <div key={i} className="space-y-6">
                {slots?.[`col-${i}`]}
             </div>
           ))}
        </div>
      )
    }
  },

  root: {
    fields: {
      theme: {
        type: "radio",
        label: "Visual Theme",
        options: [
          { label: "Light", value: "light" },
          { label: "Dark", value: "dark" }
        ]
      },
      primaryColor: { type: "text", label: "Accent Color" },
      aspectRatio: {
        type: "select",
        label: "Card Aspect Ratio",
        options: [
          { label: "Auto Adaptive", value: "auto" },
          { label: "1:1 Square", value: "square" },
          { label: "3:4 Portrait", value: "portrait" },
          { label: "16:9 Landscape", value: "landscape" },
          { label: "2:3 Tall", value: "tall" }
        ]
      },
      borderRadius: {
        type: "select",
        label: "Global Radius",
        options: [
          { label: "None", value: "rounded-none" },
          { label: "Standard", value: "rounded-2xl" },
          { label: "Immersive", value: "rounded-[3rem]" }
        ]
      }
    },
    render: ({ children, styles }: any) => {
      const isLight = styles?.theme === "light";
      const aspectClass = ASPECT_RATIOS[styles?.aspectRatio || "auto"];
      
      return (
        <div className={`transition-all duration-500 min-h-screen ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#0A0A0B] text-white'} ${styles?.borderRadius || 'rounded-none'} ${aspectClass}`}>
          <div className="max-w-7xl mx-auto py-12 px-6">
            {children}
          </div>
        </div>
      );
    }
  }
});

// Helper for row values to ensure correct context usage
const DataValue = ({ fieldId }: { fieldId: string }) => {
  const val = useResolvedField(fieldId);
  return <>{val || "—"}</>;
};
