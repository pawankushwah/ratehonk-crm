import React from 'react';
import { 
  Heart, 
  Share2, 
  ChevronRight, 
  ShoppingCart, 
  Plus,
  Box,
  Star,
  Info,
  ShieldCheck,
  Zap,
  Truck,
  RotateCcw as RefreshIcon,
  Search,
  User,
  ShoppingBag,
  Circle,
  Square,
  ChevronLeft
} from 'lucide-react';
import { type ElementType } from './Presets';
import { resolveImageUrl } from '../../../../utils/dynamicRenderer';

const ICON_MAP: Record<string, any> = {
  Heart, Share2, ChevronRight, ShoppingCart, Star, Info, ShieldCheck, Zap, Truck, ShoppingBag, 
  Search, User, Sync: RefreshIcon, Box, Circle, Square
};

export interface StudioComponentProps {
  type: ElementType;
  props: any;
  style: any;
  formFields: any[];
  mockData: Record<string, any>;
  isLight: boolean;
}

export const ProductImage: React.FC<StudioComponentProps> = ({ props, isLight, mockData }) => {
  const { aspectRatio = 'aspect-square', overlay = false, overlayPos = 'bottom-left', borderRadius = 0, fieldId, imageIndex = 0 } = props;
  
  // Resolve Image from Data
  const rawId = typeof fieldId === 'object' ? (fieldId?.value || fieldId?.id) : fieldId;
  const rawValue = rawId ? (mockData[rawId] || null) : null;
  const imageList = Array.isArray(rawValue) ? rawValue : (rawValue ? (typeof rawValue === 'object' && rawValue.items ? rawValue.items : [rawValue]) : []);
  const imageUrl = resolveImageUrl(imageList[imageIndex] || rawValue);

  return (
    <div className={`w-full h-full relative overflow-hidden transition-all duration-700 ${isLight ? 'bg-slate-100' : 'bg-white/5 shadow-2xl'}`} style={{ borderRadius }}>
      {imageUrl ? (
        <img src={imageUrl} alt="Product" className="w-full h-full object-cover" />
      ) : (
        <div className={`w-full h-full flex items-center justify-center text-primary/20 ${aspectRatio}`}>
           <Box size={48} strokeWidth={1} />
        </div>
      )}
      {overlay && (
        <div className={`absolute p-4 ${overlayPos === 'bottom-left' ? 'bottom-0 left-0' : 'top-0 right-0'}`}>
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/10 shadow-2xl">
            <Heart size={18} />
          </div>
        </div>
      )}
    </div>
  );
};

export const ProductCarousel: React.FC<StudioComponentProps> = ({ props, isLight, mockData }) => {
  const { fieldId, showArrows = true, showDots = true, borderRadius = 20 } = props;
  const [index, setIndex] = React.useState(0);

  const rawId = typeof fieldId === 'object' ? (fieldId?.value || fieldId?.id) : fieldId;
  const rawValue = rawId ? (mockData[rawId] || null) : null;
  const imageList = Array.isArray(rawValue) ? rawValue : (rawValue ? (typeof rawValue === 'object' && rawValue.items ? rawValue.items : [rawValue]) : []);
  
  // Robust image list resolution
  const resolvedImages = imageList.map((img: any) => resolveImageUrl(img)).filter(Boolean);
  
  if (imageList.length === 0) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${isLight ? 'bg-slate-100' : 'bg-white/5'}`} style={{ borderRadius }}>
         <Box size={40} className="opacity-20" />
      </div>
    );
  }

  const handleNext = () => setIndex((prev) => (prev + 1) % imageList.length);
  const handlePrev = () => setIndex((prev) => (prev - 1 + imageList.length) % imageList.length);

  return (
    <div className="w-full h-full relative group overflow-hidden" style={{ borderRadius }}>
       <div className="w-full h-full flex transition-transform duration-700 ease-out" style={{ transform: `translateX(-${index * 100}%)` }}>
          {resolvedImages.map((img: any, i: number) => (
             <img key={i} src={img} alt="" className="w-full h-full object-cover shrink-0" />
          ))}
       </div>

       {showArrows && imageList.length > 1 && (
         <>
           <button onClick={handlePrev} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black/40 shadow-xl">
              <ChevronLeft size={20} />
           </button>
           <button onClick={handleNext} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black/40 shadow-xl">
              <ChevronRight size={20} />
           </button>
         </>
       )}

       {showDots && imageList.length > 1 && (
         <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 p-2 rounded-full bg-black/20 backdrop-blur-md">
            {imageList.map((_: any, i: number) => (
               <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === index ? 'bg-white w-4' : 'bg-white/40'}`} />
            ))}
         </div>
       )}
    </div>
  );
};

export const TitleSection: React.FC<StudioComponentProps> = ({ props, mockData }) => {
  const { titleField, content, fontSize = 'text-4xl', alignment = 'text-left', color = 'inherit' } = props;
  const displayTitle = titleField ? (mockData[titleField] || `[${titleField}]`) : (content || 'Untitled Product');

  return (
    <div className={`w-full ${alignment} transition-all duration-500`} style={{ color }}>
      <h1 className={`${fontSize} font-black tracking-tighter leading-none uppercase italic`}>
        {displayTitle}
      </h1>
    </div>
  );
};

export const PriceDisplay: React.FC<StudioComponentProps> = ({ props, mockData }) => {
  const { fieldId, fontSize = 'text-5xl', color = 'inherit' } = props;
  const price = fieldId ? (mockData[fieldId] || '0.00') : '299.00';

  return (
    <div className="flex items-baseline gap-1 transition-all duration-500" style={{ color }}>
      <span className="text-xl font-bold opacity-40 italic">$</span>
      <span className={`${fontSize} font-black tracking-tighter tabular-nums italic`}>{price}</span>
    </div>
  );
};

export const ActionButtons: React.FC<StudioComponentProps> = ({ props, isLight }) => {
  const { showHeart = true, showShare = true, showVisit = true, layout = 'left' } = props;
  
  return (
    <div className={`flex items-center gap-4 ${layout === 'between' ? 'justify-between' : (layout === 'right' ? 'justify-end' : 'justify-start')} w-full`}>
      <div className="flex gap-3">
        {showHeart && <CircularButton icon={<Heart size={18}/>} isLight={isLight} />}
        {showShare && <CircularButton icon={<Share2 size={18}/>} isLight={isLight} />}
      </div>
      {showVisit && (
        <button className={`flex items-center gap-3 px-6 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95 ${isLight ? 'bg-slate-900 text-white' : 'bg-white text-black'}`}>
           Visit Store <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
};

export const Shape: React.FC<StudioComponentProps> = ({ props }) => {
  const { shapeType = 'rectangle', fill = '#3B82F6', stroke = 'transparent', strokeWidth = 0, strokeStyle = 'solid', borderRadius = 0 } = props;
  
  return (
    <div 
      className={`w-full h-full transition-all duration-500 ${shapeType === 'circle' ? 'rounded-full' : ''}`}
      style={{ 
        backgroundColor: fill,
        border: `${strokeWidth}px ${strokeStyle} ${stroke}`,
        borderRadius: shapeType === 'circle' ? '50%' : borderRadius
      }}
    />
  );
};

export const Text: React.FC<StudioComponentProps> = ({ props }) => {
  const { content = 'Text Block', fontSize = 16, fontWeight = 'medium', fontStyle = 'normal', textAlign = 'left', color = 'inherit', backgroundColor = 'transparent', padding = 0, borderRadius = 0 } = props;

  return (
    <div 
      className="w-full h-full flex items-center transition-all duration-500 overflow-hidden" 
      style={{ 
        fontSize, 
        fontWeight, 
        fontStyle, 
        textAlign, 
        color, 
        backgroundColor, 
        padding, 
        borderRadius,
        whiteSpace: 'pre-wrap',
        lineHeight: 1.2
      }}
    >
      {content}
    </div>
  );
};

export const Image: React.FC<StudioComponentProps> = ({ props }) => {
  const { src, borderRadius = 0, opacity = 1, objectFit = 'cover' } = props;
  
  return (
    <div className="w-full h-full overflow-hidden transition-all duration-500" style={{ borderRadius, opacity }}>
      {src ? (
        <img src={src} alt="Uploaded" className="w-full h-full" style={{ objectFit }} />
      ) : (
        <div className="w-full h-full bg-primary/5 flex items-center justify-center text-primary/20">
           <Plus size={48} strokeWidth={1} />
        </div>
      )}
    </div>
  );
};

export const Icon: React.FC<StudioComponentProps> = ({ props }) => {
  const { iconName = 'Star', size = 24, color = 'currentColor', strokeWidth = 2, opacity = 1 } = props;
  const LucideIcon = ICON_MAP[iconName] || Star;

  return (
    <div className="w-full h-full flex items-center justify-center transition-all duration-500" style={{ opacity, color }}>
       <LucideIcon size={size} strokeWidth={strokeWidth} />
    </div>
  );
};

export const DataTable: React.FC<StudioComponentProps> = ({ props, isLight, mockData }) => {
  const { fieldId, title = "Specifications", borderRadius = 24, fontSize = 13 } = props;
  
  const rawData = fieldId ? (mockData[fieldId] || []) : [];
  const items = Array.isArray(rawData) ? rawData : (typeof rawData === 'object' ? Object.entries(rawData).map(([l, v]) => ({ label: l, value: String(v) })) : []);

  return (
    <div className={`w-full h-full border overflow-hidden transition-all duration-500 ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/5 shadow-2xl'}`} style={{ borderRadius }}>
      <div className="p-6 border-b border-current/5 flex items-center justify-between bg-current/5">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 italic">{title}</h4>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Search size={14} /></div>
      </div>
      <div className="p-6">
        {items.length > 0 ? (
          <div className="space-y-4">
            {items.map((it: any, i: number) => (
              <div key={i} className="flex items-center justify-between border-b border-current/5 pb-3">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{it.label || it.name}</span>
                <span className="font-bold text-primary italic" style={{ fontSize }}>{it.value || it.content}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 flex flex-col items-center justify-center opacity-20 italic">
            <Box size={32} strokeWidth={1} />
            <p className="text-[9px] font-black uppercase tracking-widest mt-2">No Data Mapped</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const DataGrid: React.FC<StudioComponentProps> = ({ props, isLight, mockData }) => {
  const { fieldId, columns = 2, borderRadius = 24, padding = 20, gap = 12 } = props;
  
  const rawData = fieldId ? (mockData[fieldId] || []) : [];
  const items = Array.isArray(rawData) ? rawData : (typeof rawData === 'object' ? Object.entries(rawData).map(([l, v]) => ({ label: l, value: String(v) })) : []);

  return (
    <div className="w-full h-full overflow-hidden" style={{ borderRadius }}>
      <div 
        className="grid w-full h-full" 
        style={{ 
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap,
          padding
        }}
      >
        {items.map((it: any, i: number) => (
          <div 
            key={i} 
            className={`p-5 rounded-3xl border transition-all duration-500 flex flex-col justify-between ${isLight ? 'bg-slate-50 border-slate-100 shadow-sm' : 'bg-white/5 border-white/5'}`}
          >
            <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 truncate">{it.label || it.name}</span>
            <span className="text-sm font-black text-primary truncate italic mt-2">{it.value || it.content}</span>
          </div>
        ))}
        {items.length === 0 && (
          <div className="col-span-full h-full flex items-center justify-center opacity-10 border border-dashed rounded-3xl">
             <Star size={40} />
          </div>
        )}
      </div>
    </div>
  );
};

const CircularButton = ({ icon, isLight }: any) => (
  <button className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-xl ${isLight ? 'bg-white text-slate-400 border border-slate-100' : 'bg-white/10 text-white border border-white/10'}`}>
    {icon}
  </button>
);

export const ComponentRegistry: Record<string, React.FC<StudioComponentProps>> = {
  ProductImage,
  ProductCarousel,
  TitleSection,
  PriceDisplay,
  ActionButtons,
  Shape,
  Text,
  Image,
  Icon,
  DataTable,
  DataGrid
};
