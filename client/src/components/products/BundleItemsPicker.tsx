import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Package,
  Loader2,
  ChevronDown,
  ChevronUp,
  Layers
} from 'lucide-react';
import { getAllDynamicData, getTemplates } from '@/lib/forms';
import GlassCard from '@/components/products/GlassCard';
import Input from '@/components/products/Input';
import { getRoleValue, resolveImageUrl } from '@/utils/dynamicRenderer';

interface BundleItem {
  id: string; // dynamic_data_id
  variantId?: number; // Optional variant ID
  name: string;
  sku: string;
  price: number;
  currentPrice?: number;
  quantity: number;
  imageUrl?: string | null;
  color?: string | null;
  typeLabel?: string;
  typeColor?: string;
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
        setTemplates(Array.isArray(res) ? res : (res.data || []));
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

  const getProductTypeTag = (formKey: string) => {
    const types: Record<string, { label: string, color: string }> = {
      'inventory': { label: 'INVENTORY', color: 'bg-emerald-500/10 text-emerald-500' },
      'non-inventory': { label: 'NON-INVENTORY', color: 'bg-blue-500/10 text-blue-500' },
      'service': { label: 'SERVICE', color: 'bg-amber-500/10 text-amber-500' },
      'bundle': { label: 'BUNDLE', color: 'bg-purple-500/10 text-purple-500' }
    };
    return types[formKey] || { label: 'OTHER', color: 'bg-slate-500/10 text-slate-500' };
  };

  const getProductDisplayData = (product: any, variant?: any) => {
    const fKey = product.FormTemplate?.formKey;
    let name = product.name || 'Unnamed Item';
    let sku = product.sku || 'No SKU';
    let price = product.price || 0;
    let image = product.images?.[0] || product.image;
    let color = variant?.color || product.color;

    // Use variant specific data if provided
    if (variant) {
      name = `${name} - ${variant.name || 'Variant'}`;
      sku = variant.sku || sku;
      price = variant.sales_price || price;
      image = (variant.images && variant.images.length > 0) ? variant.images[0] : (variant.image || image);
    } else if (fKey === 'non-inventory') {
      price = product.sales_price || product.price || 0;
    } else if (fKey === 'service') {
      price = product.rate || product.price || 0;
    } else if (fKey === 'bundle') {
      price = product.sales_price || product.price || 0;
    }

    return {
      name,
      sku,
      price,
      color,
      imageUrl: resolveImageUrl(image),
      typeInfo: getProductTypeTag(fKey || 'other')
    };
  };

  const addItem = (product: any, variant?: any) => {
    const displayData = getProductDisplayData(product, variant);

    const existing = value.find(item =>
      item.id === product.id &&
      (variant ? item.variantId === variant.id : !item.variantId)
    );

    if (existing) {
      updateQuantity(product.id, existing.quantity + 1, variant?.id);
    } else {
      onChange([...value, {
        id: product.id,
        variantId: variant?.id,
        name: displayData.name,
        sku: displayData.sku,
        price: Number(displayData.price),
        currentPrice: Number(displayData.price),
        quantity: 1,
        imageUrl: displayData.imageUrl,
        color: displayData.color,
        typeLabel: displayData.typeInfo.label,
        typeColor: displayData.typeInfo.color
      }]);
    }
    setSearch('');
    setShowResults(false);
  };

  const removeItem = (id: string, variantId?: number) => {
    onChange(value.filter(item => !(item.id === id && item.variantId === variantId)));
  };

  const updateQuantity = (id: string, qty: number, variantId?: number) => {
    if (qty < 1) return;
    onChange(value.map(item =>
      (item.id === id && item.variantId === variantId) ? { ...item, quantity: qty } : item
    ));
  };

  const totalItems = value.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = value.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Process search results into a flat list (Variants only if they exist, otherwise Product)
  const flattenedResults = searchResults.flatMap(product => {
    if (product.variants && product.variants.length > 0) {
      return product.variants.map((v: any) => ({ product, variant: v }));
    }
    return [{ product, variant: null }];
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300 tracking-tight px-0.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {value.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full ring-1 ring-primary/20">
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

        {showResults && flattenedResults.length > 0 && (
          <GlassCard className="absolute top-full mt-2 w-full z-[100] p-2 bg-[var(--color-bg-main)]/95 backdrop-blur-2xl border-primary/20 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-1 max-h-80 overflow-y-auto custom-scrollbar">
              {flattenedResults.map((item, idx) => {
                const { product, variant } = item;
                const displayData = getProductDisplayData(product, variant);

                return (
                  <button
                    key={`${product.id}-${variant?.id || 'base'}-${idx}`}
                    onClick={() => addItem(product, variant)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl hover:bg-primary/10 transition-all group/result text-left border border-transparent hover:border-primary/20 ${variant ? 'ml-0 border-l-primary/30' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-text-muted group-hover/result:text-primary overflow-hidden border border-white/5 transition-colors shrink-0">
                        {displayData.imageUrl ? (
                          <img src={displayData.imageUrl} alt={displayData.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package size={20} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-bold text-text-main line-clamp-1">
                            {displayData.name}
                          </p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ring-1 ring-inset ${displayData.typeInfo.color} ring-current/20 shrink-0`}>
                            {displayData.typeInfo.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-text-muted truncate">
                            {displayData.sku}
                          </p>
                          {displayData.color && (
                            <div className="flex items-center gap-1 ml-auto">
                              <div
                                className="w-3 h-3 rounded-full border border-white/10 shadow-sm"
                                style={{ backgroundColor: displayData.color }}
                                title={`Color: ${displayData.color}`}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 pl-2">
                      <div className="flex flex-col items-end gap-1">
                        <div className="p-1.5 rounded-full bg-primary/20 text-primary opacity-0 group-hover/result:opacity-100 transition-all scale-75 group-hover/result:scale-100">
                          <Plus size={14} />
                        </div>
                        <span className="text-xs font-bold text-text-main">${displayData.price}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </GlassCard>
        )}
      </div>

      <div className="space-y-2">
        {value.map((item) => (
          <div
            key={`${item.id}-${item.variantId || 'base'}`}
            className="group/item relative flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-glass-border hover:bg-white/10 hover:border-primary/20 transition-all duration-300 animate-in slide-in-from-left-4"
          >
            {/* Image Thumbnail */}
            <div className="relative w-14 h-14 shrink-0 rounded-xl bg-black/20 border border-glass-border overflow-hidden flex items-center justify-center">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <Package size={20} className="text-text-muted/20" />
              )}
              {item.variantId && (
                <div className="absolute top-1 right-1">
                  <Layers size={10} className="text-primary" />
                </div>
              )}
            </div>

            {/* Info Area */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h4 className="text-sm font-bold text-text-main truncate">
                  {item.name}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-text-muted truncate">
                  {item.sku}
                </p>
                {item.color && (
                  <div
                    className="w-2.5 h-2.5 rounded-full border border-white/10 shadow-sm shrink-0"
                    style={{ backgroundColor: item.color }}
                    title={`Color: ${item.color}`}
                  />
                )}
              </div>
              <div className="flex items-center gap-2 my-2">
                {item.typeLabel && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ring-1 ring-inset ${item.typeColor || 'bg-slate-500/10 text-slate-500'} ring-current/20 shrink-0`}>
                    {item.typeLabel}
                  </span>
                )}

                <div className="w-fit">{item.currentPrice !== undefined && item.currentPrice !== item.price && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 animate-in fade-in zoom-in duration-300 w-fit">
                    <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400">Actual: ${item.currentPrice}</span>
                    <button
                      onClick={() => {
                        onChange(value.map(v => (v.id === item.id && v.variantId === item.variantId) ? { ...v, price: item.currentPrice || 0 } : v));
                      }}
                      className="text-[8px] font-black text-amber-600 hover:text-amber-700 underline underline-offset-2"
                    >
                      USE CURRENT
                    </button>
                  </div>
                )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-end gap-1">
                  <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-lg border border-glass-border">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1, item.variantId)}
                      className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded-md text-text-muted hover:text-primary transition-all disabled:opacity-30"
                      disabled={item.quantity <= 1}
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-xs font-bold text-text-main min-w-[1.2rem] text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1, item.variantId)}
                      className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded-md text-text-muted hover:text-primary transition-all"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  <div className="relative group/price">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted">$</span>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => {
                        const newPrice = Number(e.target.value);
                        onChange(value.map(v => (v.id === item.id && v.variantId === item.variantId) ? { ...v, price: newPrice } : v));
                      }}
                      className="w-20 h-8 pl-5 pr-2 py-1 rounded-lg border border-glass-border text-xs font-bold text-text-main focus:border-primary/50 outline-none transition-all bg-white"
                    />
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-5 items-end justify-between min-w-[70px]">
                  {/* <p className="text-[10px] font-bold text-text-muted uppercase mb-0.5">Subtotal</p> */}
                  <span className="text-base font-bold text-primary flex-1 h-full">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={() => removeItem(item.id, item.variantId)}
                  className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                  title="Remove item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Price & Quantity Controls */}

          </div>
        ))}

        {value.length === 0 && (
          <div className="py-12 border-2 border-dashed border-glass-border rounded-[2.5rem] bg-white/2 flex flex-col items-center justify-center gap-3 text-center opacity-50 group-hover:opacity-100 transition-opacity">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <Package size={28} className="text-text-muted" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-main">No items included yet</p>
              <p className="text-xs text-text-muted mt-1">Search for products above to start building the bundle</p>
            </div>
          </div>
        )}

        {value.length > 0 && (
          <div className="pt-6 mt-4 border-t border-glass-border flex flex-col items-end gap-2 animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-4">
              <span className="text-text-muted font-bold text-xs">Grand Total:</span>
              <span className="text-2xl font-bold text-primary">${totalPrice.toFixed(2)}</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default BundleItemsPicker;
