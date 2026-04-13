import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Package, 
  Loader2
} from 'lucide-react';
import { getAllDynamicData, getTemplates } from '@/lib/forms';
import GlassCard from '@/components/products/GlassCard';
import Input from '@/components/products/Input';
import { getRoleValue, resolveImageUrl } from '@/utils/dynamicRenderer';

interface BundleItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
}

interface BundleItemsPickerProps {
  value: BundleItem[];
  onChange: (value: BundleItem[]) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

const BundleItemsPicker: React.FC<BundleItemsPickerProps> = ({
  value = [],
  onChange,
  label = 'Included Items',
  placeholder = 'Search products to add...',
  required = false
}) => {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTemplatesData = async () => {
      try {
        const res = await getTemplates();
        setTemplates(res.data || []);
      } catch (err) {
        console.error('Failed to fetch templates:', err);
      }
    };
    fetchTemplatesData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (search.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await getAllDynamicData({ search, limit: 5 });
        const data = response.data?.data || response.data || [];
        setSearchResults(data);
        setShowResults(true);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const addItem = (product: any) => {
    const template = templates.find(t => t.id === product.templateId) || product.FormTemplate;
    const name = getRoleValue('title', product, template);
    const sku = getRoleValue('sku', product, template);
    const price = Number(getRoleValue('price', product, template) || 0);
    const image = getRoleValue('image', product, template);
    const imageUrl = resolveImageUrl(image?.[0] || image);

    const existing = value.find(item => item.id === product.id);
    if (existing) {
      updateQuantity(product.id, existing.quantity + 1);
    } else {
      onChange([...value, { 
        id: product.id, 
        name: name === '—' ? 'Unnamed Item' : name, 
        sku: sku === '—' ? 'NO-SKU' : sku, 
        price, 
        quantity: 1,
        imageUrl 
      }]);
    }
    setSearch('');
    setShowResults(false);
  };

  const removeItem = (id: string) => {
    onChange(value.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty < 1) return;
    onChange(value.map(item => item.id === id ? { ...item, quantity: qty } : item));
  };

  const totalItems = value.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = value.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted pl-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {value.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full ring-1 ring-primary/20">
              {totalItems} ITEMS SELECTED
            </span>
          </div>
        )}
      </div>

      <div className="relative" ref={searchRef}>
        <div className="relative group">
          <Input
            placeholder={placeholder}
            value={search}
            onChange={(e: any) => setSearch(e.target.value)}
            onFocus={() => search.length >= 2 && setShowResults(true)}
            inputClassName="pl-12 h-14! bg-white/5 border-glass-border focus:border-primary/50"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors">
            {isSearching ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
          </div>
        </div>

        {showResults && searchResults.length > 0 && (
          <GlassCard className="absolute top-full mt-2 w-full z-[100] p-2 bg-[var(--color-bg-main)]/95 backdrop-blur-2xl border-primary/20 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
              {searchResults.map((product) => {
                const template = templates.find(t => t.id === product.templateId) || product.FormTemplate;
                const name = getRoleValue('title', product, template);
                const sku = getRoleValue('sku', product, template);
                const price = getRoleValue('price', product, template);
                const image = getRoleValue('image', product, template);
                const imageUrl = resolveImageUrl(image?.[0] || image);
                
                return (
                  <button
                    key={product.id}
                    onClick={() => addItem(product)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-primary/10 transition-all group/result text-left border border-transparent hover:border-primary/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-text-muted group-hover/result:text-primary overflow-hidden border border-white/5 transition-colors">
                        {imageUrl ? (
                          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                        ) : (
                          <Package size={20} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text-main leading-tight italic">
                          {name === '—' ? 'Unnamed Item' : name}
                        </p>
                        <p className="text-[10px] text-text-muted uppercase tracking-widest mt-1 italic">
                          {sku === '—' ? 'No SKU' : sku} • {template?.name || 'Item'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                       <div className="p-1.5 rounded-full bg-primary/20 text-primary opacity-0 group-hover/result:opacity-100 transition-all scale-75 group-hover/result:scale-100">
                          <Plus size={14} />
                       </div>
                       <span className="text-xs font-black text-text-main">${price || 0}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </GlassCard>
        )}
      </div>

      <div className="space-y-3">
        {value.map((item) => (
          <div 
            key={item.id} 
            className="group/item relative flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-white/5 border border-glass-border hover:bg-white/10 hover:border-primary/30 transition-all duration-300 animate-in slide-in-from-left-4"
          >
            {/* Professional Clean Image Container */}
            <div className="relative w-20 h-20 shrink-0 rounded-xl bg-black/20 border border-glass-border overflow-hidden flex items-center justify-center">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <Package size={24} className="text-text-muted/20" />
              )}
            </div>
            
            {/* Content Area - Professional Layout */}
            <div className="flex-1 min-w-0">
               <div className="flex items-center gap-2 mb-1">
                 <p className="text-[10px] font-medium text-text-muted uppercase tracking-widest opacity-50">
                   SKU: {item.sku}
                 </p>
               </div>
               <h4 className="text-sm font-bold text-text-main line-clamp-1 mb-2">
                 {item.name}
               </h4>
               <div className="flex items-center gap-2">
                  <div className="relative group/price">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-text-muted">$</span>
                    <input 
                      type="number"
                      value={item.price}
                      onChange={(e) => {
                        const newPrice = Number(e.target.value);
                        onChange(value.map(v => v.id === item.id ? { ...v, price: newPrice } : v));
                      }}
                      className="w-20 pl-5 pr-2 py-1 rounded-md border border-glass-border text-xs font-bold text-text-main focus:border-primary/50 outline-none transition-all bg-white"
                    />
                  </div>
                  <span className="text-[10px] font-medium text-text-muted uppercase tracking-widest">
                    Price/Unit
                  </span>
               </div>
            </div>

            {/* Actions & Quantity */}
            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-x-8 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-0 border-glass-border">
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-xl p-1 border border-glass-border">
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg text-text-muted hover:text-primary transition-all disabled:opacity-30"
                    disabled={item.quantity <= 1}
                  >
                    <Minus size={14} />
                  </button>
                  <div className="w-10 text-center">
                     <span className="text-sm font-bold text-text-main">{item.quantity}</span>
                  </div>
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg text-text-muted hover:text-primary transition-all"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-end min-w-[90px]">
                 <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-0.5">Subtotal</p>
                 <span className="text-base font-bold text-primary">
                    ${(item.price * item.quantity).toFixed(2)}
                 </span>
              </div>

              <button 
                onClick={() => removeItem(item.id)}
                className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                title="Remove item"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}

        {value.length === 0 && (
          <div className="py-12 border-2 border-dashed border-glass-border rounded-[2.5rem] bg-white/2 flex flex-col items-center justify-center gap-3 text-center opacity-50 group-hover:opacity-100 transition-opacity">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <Package size={28} className="text-text-muted" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-main">No items included yet</p>
              <p className="text-[10px] text-text-muted uppercase tracking-widest mt-1 italic">Search for products above to start building the bundle</p>
            </div>
          </div>
        )}

        {value.length > 0 && (
          <div className="pt-6 mt-4 border-t border-glass-border flex flex-col items-end gap-2 animate-in slide-in-from-bottom-2">
             <div className="flex items-center gap-4 text-text-muted uppercase tracking-[0.2em] font-bold text-[10px]">
               <span>Total Items:</span>
               <span className="text-text-main">{totalItems}</span>
             </div>
             <div className="flex items-center gap-4">
                <span className="text-text-muted uppercase tracking-[0.2em] font-bold text-[10px]">Grand Total:</span>
                <span className="text-2xl font-black text-primary">${totalPrice.toFixed(2)}</span>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default BundleItemsPicker;
