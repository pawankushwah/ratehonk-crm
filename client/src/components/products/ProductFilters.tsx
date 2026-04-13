import React from 'react';
import { Check, Filter as FilterIcon } from 'lucide-react';
import Button from './Button';

interface ProductFiltersProps {
  template: any;
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onReset: () => void;
  onApply?: () => void;
  isInline?: boolean; // If true, it renders as a sidebar, otherwise as drawer content
}

const ProductFilters: React.FC<ProductFiltersProps> = ({ 
  template, 
  filters, 
  onFilterChange, 
  onReset,
  onApply,
  isInline = false
}) => {

  const getFilterableFields = () => {
    // Basic fields that always exist (e.g. Color if it's inventory)
    const fields: any[] = [];
    
    if (!template) return fields;

    const traverse = (items: any[]) => {
      items.forEach(it => {
        if (it.kind === 'field' && (it.type === 'select' || it.type === 'addable-select' || it.type === 'color')) {
          if (!fields.find(f => f.id === it.id)) {
            fields.push(it);
          }
        } else if (it.kind === 'section') {
          traverse(it.items || []);
        } else if (it.kind === 'group') {
          traverse(it.fields || []);
        }
      });
    };
    traverse(template.schema || []);
    return fields;
  };

  const filterableFields = getFilterableFields();

  return (
    <div className={`flex flex-col h-full ${isInline ? 'w-full' : ''}`}>
      <div className={`flex-1 overflow-y-auto ${isInline ? 'pr-4' : ''} space-y-8 custom-scrollbar`}>
        {isInline && (
          <div className="flex items-center gap-2 mb-4 text-text-main">
            <FilterIcon size={18} className="text-primary" />
            <h2 className="text-lg font-bold tracking-tight">Active Filters</h2>
          </div>
        )}

        {filterableFields.map((field) => {
          const isColor = field.label.toLowerCase().includes('color') || field.type === 'color';
          const isSize = field.label.toLowerCase().includes('size');
          const options = field.options || [];

          return (
            <div key={field.id} className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted pl-1">
                {field.label}
              </label>
              
              {isColor ? (
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={() => onFilterChange(field.id, '')}
                    className={`w-10 h-10 rounded-full border transition-all flex items-center justify-center text-[10px] font-bold ${!filters[field.id] ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/20' : 'border-slate-200 bg-white text-text-muted hover:border-slate-300'}`}
                  >
                    All
                  </button>
                  {options.map((o: any) => {
                    const val = typeof o === 'string' ? o : (o.value || o.v || o.label || '');
                    const label = typeof o === 'string' ? o : (o.label || o.value || o.v || 'Unknown');
                    const isActive = filters[field.id] === val;
                    return (
                      <button 
                        key={val}
                        onClick={() => onFilterChange(field.id, val)}
                        className={`w-10 h-10 rounded-full border transition-all flex items-center justify-center relative group ${isActive ? 'scale-110 border-white shadow-xl rotate-12 z-10' : 'border-transparent'}`}
                        style={{ backgroundColor: val }}
                        title={label}
                      >
                        {isActive && <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full"><Check size={14} className="text-white drop-shadow-md" /></div>}
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-[8px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                          {label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : isSize ? (
                <div className="grid grid-cols-4 gap-2">
                  <button 
                    onClick={() => onFilterChange(field.id, '')}
                    className={`h-11 rounded-xl border text-[10px] font-black transition-all ${!filters[field.id] ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white border-slate-200 text-text-muted hover:border-slate-300 shadow-sm'}`}
                  >
                    ANY
                  </button>
                  {options.map((o: any) => {
                    const val = typeof o === 'string' ? o : (o.value || o.v || o.label || '');
                    const isActive = filters[field.id] === val;
                    return (
                      <button 
                        key={val}
                        onClick={() => onFilterChange(field.id, val)}
                        className={`h-11 rounded-xl border text-[10px] font-black transition-all uppercase ${isActive ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white border-slate-200 text-text-muted hover:border-slate-300 shadow-sm'}`}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  <button 
                    onClick={() => onFilterChange(field.id, '')}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all ${!filters[field.id] ? 'bg-primary/10 border-primary text-primary' : 'bg-slate-50 border-slate-200 text-text-muted hover:bg-slate-100'}`}
                  >
                    <span className="text-xs font-bold">All {field.label}s</span>
                    {!filters[field.id] && <Check size={16} />}
                  </button>
                  {options.slice(0, 5).map((o: any) => {
                    const val = typeof o === 'string' ? o : (o.value || o.v || o.label || '');
                    const label = typeof o === 'string' ? o : (o.label || o.value || o.v || 'Unknown');
                    const isActive = filters[field.id] === val;
                    return (
                      <button 
                        key={val}
                        onClick={() => onFilterChange(field.id, val)}
                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all ${isActive ? 'bg-primary/10 border-primary text-primary shadow-lg shadow-primary/5' : 'bg-slate-50 border-slate-200 text-text-muted hover:bg-slate-100'}`}
                      >
                        <span className="text-xs font-bold">{label}</span>
                        {isActive && <Check size={16} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted pl-1">Stock Status</label>
          <div className="flex p-1 rounded-2xl bg-slate-50 border border-slate-200 h-14 shadow-inner">
            {[
              { label: 'All', value: '' },
              { label: 'In Stock', value: 'in_stock' },
              { label: 'Out of Stock', value: 'out_of_stock' }
            ].map((status) => (
              <button
                key={status.value}
                onClick={() => onFilterChange('stock_status', status.value)}
                className={`flex-1 flex items-center justify-center rounded-xl text-[10px] font-black transition-all ${filters['stock_status'] === status.value ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:bg-slate-200/50'}`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={`pt-8 border-t border-slate-200 flex gap-4 ${isInline ? 'mt-6' : 'mt-auto'}`}>
        <Button 
          variant="outline" 
          className="flex-1 h-14 rounded-2xl" 
          onClick={onReset}
        >
          Reset All
        </Button>
        {onApply && (
          <Button 
            className="flex-1 h-14 rounded-2xl shadow-xl shadow-primary/20" 
            onClick={onApply}
          >
            Apply
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProductFilters;
