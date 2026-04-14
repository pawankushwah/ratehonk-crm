import React from 'react';

export type TemplateMode = 'card' | 'view';

export interface TemplateProps {
  data: {
    title: string;
    price: string | number;
    description: string;
    imageUrl: string;
    category?: string;
    sku?: string;
    stock?: string | number;
    barcode?: string; // [NEW: Barcode support]
    rating?: string | number;
    reviewCount?: string | number;
    promo?: string;
    color?: string;
    availableColors?: string[];
    availableSizes?: string[];
    allImages?: string[]; // [NEW: Multi-image gallery support]
    features?: string[];
    mapping?: Record<string, string>;
    variants?: any[]; // [NEW: Interactive variant support]
  };
  visibility: Record<string, boolean>;
  mode?: TemplateMode;
  accentColor: string;
  isDark: boolean;
  bgBase: string;
  textMain: string;
  textMuted: string;
  borderBase: string;
  radiusClass: string;
  shadowClass: string;
  paddingClass: string;
  fontClass: string;
  activeSlot?: string | null;
  onSlotClick?: (slot: string, e: React.MouseEvent) => void;
  onVariantSelect?: (index: number) => void;
  activeVariantIndex?: number;
  context?: any;
  style?: React.CSSProperties;
}

interface SlotWrapperProps {
  slot: string;
  activeSlot?: string | null;
  onSlotClick?: (slot: string, e: React.MouseEvent) => void;
  children: React.ReactNode;
  className?: string;
  accentColor?: string;
  borderRadius?: string;
}

export const SlotWrapper: React.FC<SlotWrapperProps> = ({ 
  slot, 
  activeSlot, 
  onSlotClick, 
  children, 
  className = "",
  borderRadius = "rounded-lg"
}) => {
  const isActive = activeSlot === slot;
  
  return (
    <div 
      className={`relative group/slot ${className} transition-all duration-300 ${onSlotClick ? 'cursor-pointer' : ''}`}
      onClick={(e) => {
        if (onSlotClick) {
          e.stopPropagation();
          onSlotClick(slot, e);
        }
      }}
    >
      {onSlotClick && (
        <div className={`absolute -inset-1 border-2 border-dashed transition-all duration-300 pointer-events-none z-50 ${borderRadius} ${isActive ? 'border-primary opacity-100 scale-100' : 'border-primary/40 opacity-0 scale-95 group-hover/slot:opacity-100 group-hover/slot:scale-100'}`}>
           <div className="absolute top-0 right-0 -translate-y-full px-2 py-0.5 bg-primary text-white text-[8px] font-black uppercase tracking-widest rounded-t-md whitespace-nowrap">
              {slot} Editor
           </div>
        </div>
      )}
      {children}
    </div>
  );
};

interface CardWrapperProps {
  children: React.ReactNode;
  className?: string;
  bgBase?: string;
  radiusClass?: string;
  shadowClass?: string;
  borderBase?: string;
  fontClass?: string;
}

export const CardWrapper: React.FC<CardWrapperProps> = ({ 
  children, 
  className = "",
  bgBase = "bg-white",
  radiusClass = "rounded-xl",
  shadowClass = "shadow-md",
  borderBase = "border-slate-200",
  fontClass = "font-sans"
}) => {
  return (
    <div className={`relative overflow-hidden ${bgBase} ${radiusClass} ${shadowClass} border ${borderBase} ${fontClass} ${className}`}>
      {children}
    </div>
  );
};
