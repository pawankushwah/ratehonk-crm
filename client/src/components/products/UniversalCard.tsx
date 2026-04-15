import React from 'react';
import { 
  Eye, 
  Edit3, 
  Share2, 
  Trash2
} from 'lucide-react';
import CardRenderer from './CardRenderer';

interface UniversalCardProps {
  product: any;
  template: any;
  onView?: () => void;
  onEdit?: () => void;
  onShare?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
}

const UniversalCard: React.FC<UniversalCardProps> = ({ 
  product, 
  template, 
  onView, 
  onEdit, 
  onShare, 
  onDelete 
}) => {
  // Determine the effective design architecture
  const hasCustomDesign = template?.design && (
    template.design.pages?.card || 
    template.design.templateId || 
    template.design.content || 
    template.design.elements
  );
  
  const effectiveDesign = hasCustomDesign ? template.design : {
    templateId: 'modern',
    styles: { 
      borderRadius: 20,
      shadow: 20,
      padding: 20,
      fontFamily: 'plus-jakarta',
      primaryColor: '#ec4899'
    }
  };

  return (
    <div className="cursor-pointer group/card relative">
      <CardRenderer 
        design={effectiveDesign} 
        data={product.data || product} 
        template={template}
        mode="card"
      />
      
      {/* Universal Action Overlay (Synced with App State) */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover/card:opacity-100 transition-all duration-300 translate-x-2 group-hover/card:translate-x-0 z-10">
         {onView && (
           <button 
             onClick={(e) => { e.stopPropagation(); onView(); }} 
             className="p-2.5 rounded-xl bg-slate-900 text-white border border-slate-800 hover:bg-primary hover:border-primary transition-all shadow-xl" 
             title="View Details"
           >
             <Eye size={16} />
           </button>
         )}
         {/* {onEdit && (
           <button 
             onClick={(e) => { e.stopPropagation(); onEdit(); }} 
             className="p-2.5 rounded-xl bg-slate-900 text-white border border-slate-800 hover:bg-emerald-500 hover:border-emerald-500 transition-all shadow-xl" 
             title="Edit Product"
           >
             <Edit3 size={16} />
           </button>
         )} */}
         {onShare && (
           <button 
             onClick={(e) => { e.stopPropagation(); onShare(e); }} 
             className="p-2.5 rounded-xl bg-slate-900 text-white border border-slate-800 hover:bg-sky-500 hover:border-sky-500 transition-all shadow-xl" 
             title="Share Product"
           >
             <Share2 size={16} />
           </button>
         )}
         {/* {onDelete && (
           <button 
             onClick={(e) => { e.stopPropagation(); onDelete(e); }} 
             className="p-2.5 rounded-xl bg-slate-900 text-white border border-slate-800 hover:bg-red-500 hover:border-red-500 transition-all shadow-xl" 
             title="Delete Product"
           >
             <Trash2 size={16} />
           </button>
         )} */}
      </div>
    </div>
  );
};

export default UniversalCard;
