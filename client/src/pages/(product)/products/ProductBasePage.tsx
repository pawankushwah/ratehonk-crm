import { useState, useEffect, useRef } from 'react';
import {
  Package,
  Plus, ArrowRight,
  ArrowLeft,
  Loader2,
  Inbox,
  LayoutGrid,
  List,
  Search,
  Filter,
  Eye,
  Edit3,
  Share2,
  Copy,
  Maximize,
  Minimize,
  Trash2,
  Check
} from 'lucide-react';
import React from 'react';
import { useLocation } from 'wouter';
import { Layout } from '@/components/layout/layout';
import BrandIcon from '@/components/products/Icon';
import HeaderButton from '@/components/products/Button';
import GlassCard from '@/components/products/GlassCard';
import Drawer from '@/components/products/Drawer';
import ExceptInventoryForms from '@/components/products/ExceptInventoryForms';
import { getTemplate, getTemplates, getAllDynamicData, deleteDynamicData } from '@/lib/forms';
import ProductFilters from '@/components/products/ProductFilters';
import { getRoleValue, formatDisplayValue, resolveImageUrl } from '@/utils/dynamicRenderer';
import UniversalCard from '@/components/products/UniversalCard';
import InventoryForm from './InventoryForm';

type DrawerView = 'inventory' | 'non-inventory' | 'service' | 'bundle';

interface ProductBasePageProps {
  title: string;
  templateName?: string;
  templateId?: string;
  defaultDrawerView?: DrawerView;
  allTypes?: boolean;
  extraHeader?: React.ReactNode;
  activeTab?: string;
}

const ProductBasePage: React.FC<ProductBasePageProps> = ({ 
  title, 
  templateName, 
  templateId, 
  defaultDrawerView = 'inventory', 
  allTypes = false,
  extraHeader,
  activeTab
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerView, setDrawerView] = useState<DrawerView>(defaultDrawerView);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inventoryTemplate, setInventoryTemplate] = useState<any>(null);
  
  // View & Pagination & Search States
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  
  // Read initial states from URL query
  const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get('search') || '');
  const [filters, setFilters] = useState<Record<string, string>>(() => {
    const params = new URLSearchParams(window.location.search);
    const initial: Record<string, string> = {};
    params.forEach((val, key) => {
      if (key !== 'search' && key !== 'viewMode' && key !== 'page') {
        initial[key] = val;
      }
    });
    return initial;
  });

  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [page, setPage] = useState(() => Number(new URLSearchParams(window.location.search).get('page')) || 1);
  const [meta, setMeta] = useState<any>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharingProduct, setSharingProduct] = useState<any>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [, setLocation] = useLocation();
  // const { setTitle, setIsSidebarHidden, setIsHeaderHidden } = useDashboard();
  const isFirstRender = useRef(true);
  const limit = 10;

  // useEffect(() => {
  //   setTitle(title);
  // }, [setTitle, title]);

  // useEffect(() => {
  //   setIsSidebarHidden(isFullscreen);
  //   setIsHeaderHidden(isFullscreen);
  // }, [isFullscreen, setIsSidebarHidden, setIsHeaderHidden]);

  const fetchData = async (currentPage = page, currentSearch = search, activeFilters = filters) => {
    setIsLoading(true);
    try {
      let invTemplate = inventoryTemplate;
      const tIdToFetch = (templateId || templateName || (allTypes ? 'all' : 'inventory')).toString();
      
      // Force refresh if template context changed
      if (invTemplate && 
          invTemplate.formKey !== tIdToFetch && 
          invTemplate.id?.toString() !== tIdToFetch) {
        invTemplate = null;
      }

      // Fetch template if missing (except for "All" view where we use 'inventory' for filters)
      if (!invTemplate) {
        const fetchId = allTypes ? 'inventory' : tIdToFetch;
        invTemplate = await getTemplate(fetchId);
        if (invTemplate) {
          setInventoryTemplate(invTemplate);
        }
      }

      // Fetch Data
      const dataRes = await getAllDynamicData({ 
        ...(allTypes ? {} : { templateId: invTemplate?.id }),
        page: currentPage, 
        limit, 
        search: currentSearch,
        ...activeFilters
      });
      
      if (dataRes.success) {
        const rawData = dataRes.data?.data || dataRes.data || [];
        const rawMeta = dataRes.data?.meta || dataRes.meta || { total: rawData.length, totalPages: 1 };
        
        // Extract schema from first result if template is still missing or we want latest
        if (rawData.length > 0 && !allTypes) {
          const firstItem = rawData[0];
          if (firstItem.template_schema && (!invTemplate || invTemplate.id !== firstItem.template_id)) {
            const extracted = {
              id: firstItem.template_id,
              name: firstItem.template_name,
              schema: firstItem.template_schema,
              design: firstItem.template_design,
              formKey: firstItem.form_key
            };
            setInventoryTemplate(extracted);
            invTemplate = extracted;
          }
        }

        if (rawData.length === 0 && !currentSearch && Object.keys(activeFilters).length === 0) {
          setProducts([]);
          setMeta({ total: 0, totalPages: 1 });
        } else {
          setProducts(rawData.reverse());
          setMeta(rawMeta);
        }
      }
    } catch (err) {
      console.error(`Failed to fetch ${title}:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(page, search, filters);
    }, isFirstRender.current ? 0 : 500);

    isFirstRender.current = false;
    return () => clearTimeout(timer);
  }, [page, search, filters, templateId, templateName, allTypes]);

  // Sync state to URL without reloading the page
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', page.toString());
    if (search) params.set('search', search);
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    
    const newSearch = params.toString();
    const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '');
    window.history.replaceState(null, '', newUrl);
  }, [page, search, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      if (!value) delete newFilters[key];
      else newFilters[key] = value;
      return newFilters;
    });
    setPage(1); // Reset to first page when filtering
  };

  const getFilterableFields = () => {
    const fields: any[] = [
      { id: '1774607666149', label: 'Color', options: [
        { label: 'Black', value: '#000000' },
        { label: 'Cream', value: '#F5F5DC' },
        { label: 'Blue', value: '#4682B4' }
      ] },
    ];
    
    if (!inventoryTemplate) return fields;

    const traverse = (items: any[]) => {
      items.forEach(it => {
        if (it.kind === 'field' && (it.type === 'select' || it.type === 'addable-select')) {
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
    traverse(inventoryTemplate.schema);
    return fields;
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setDrawerView(defaultDrawerView), 300);
  };

  const handleSave = () => {
    fetchData();
    handleCloseDrawer();
  };

  const handleShare = (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSharingProduct(product);
    setIsShareModalOpen(true);
    setIsCopied(false);
  };

  const copyToClipboard = () => {
    const url = `${window.location.origin}/public/${sharingProduct?.tenant_id || 'guest'}/${sharingProduct?.id}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDelete = async (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete this ${title.toLowerCase() || 'item'}?`)) return;
    
    try {
      await deleteDynamicData(productId);
      fetchData();
    } catch (err) {
      console.error(`Failed to delete ${title.toLowerCase() || 'item'}:`, err);
    }
  };

  const socialLinks = [
    { name: 'WhatsApp', icon: (props: any) => <BrandIcon icon="whatsapp" {...props} />, color: 'hover:text-emerald-500', url: (u: string) => `https://wa.me/?text=Check out this ${sharingProduct?.data?.[Object.keys(sharingProduct?.data || {})[0]] || 'item'}: ${u}` },
    { name: 'X', icon: (props: any) => <BrandIcon icon="ri:twitter-x-fill" {...props} />, color: 'hover:text-white', url: (u: string) => `https://twitter.com/intent/tweet?text=Check out this item!&url=${u}` },
    { name: 'Meta', icon: (props: any) => <BrandIcon icon="logos:meta-icon" {...props} />, color: 'hover:text-blue-500', url: (u: string) => `https://www.facebook.com/sharer/sharer.php?u=${u}` },
  ];

  return (
    <Layout>
      <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4 flex-1 max-w-2xl flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <input 
              type="text"
              placeholder={`Search ${title.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-12 pr-4 rounded-xl bg-glass-bg border border-glass-border text-sm text-text-main outline-none focus:border-primary/50 transition-all font-medium"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
              <Search size={18} />
            </div>
          </div>
          
          {/* {!isFullscreen && (
            <button 
              onClick={() => setIsFilterDrawerOpen(true)}
              className={`flex items-center gap-2 h-11 px-6 rounded-xl border transition-all active:scale-95 group ${Object.values(filters).some(v => v !== '') ? 'bg-primary/10 border-primary text-primary' : 'bg-glass-bg border-glass-border text-text-main hover:bg-white/5'}`}
            >
              <Filter size={18} className={`${Object.values(filters).some(v => v !== '') ? 'text-primary' : 'text-primary group-hover:scale-110'} transition-transform`} />
              <span>Filters {Object.values(filters).some(v => v !== '') ? '(Active)' : ''}</span>
            </button>
          )} */}
          
          <div className="flex p-1 rounded-xl bg-glass-bg border border-glass-border h-11">
            <button 
              onClick={() => setViewMode('table')}
              className={`flex items-center justify-center w-10 h-full rounded-lg transition-all ${viewMode === 'table' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:bg-white/5'}`}
            >
              <List size={18} />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`flex items-center justify-center w-10 h-full rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:bg-white/5'}`}
            >
              <LayoutGrid size={18} />
            </button>
          </div>

          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center justify-center w-11 h-11 rounded-xl bg-glass-bg border border-glass-border text-text-muted hover:text-primary hover:border-primary/50 transition-all group active:scale-95"
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
        
        {title !== "Products" && activeTab !== "all" && <HeaderButton onClick={() => {
          setDrawerMode('create');
          setSelectedProduct(null);
          setIsDrawerOpen(true);
        }} className="shadow-lg shadow-primary/20 shrink-0">
          <Plus size={18} /> Add New {title}
        </HeaderButton>}
      </div>

      {extraHeader && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-500">
            {extraHeader}
          </div>
        )}

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {isFullscreen && (
          <aside className="w-full lg:w-72 lg:h-[calc(100vh-120px)] lg:sticky lg:top-6 overflow-y-auto lg:pr-2 custom-scrollbar shrink-0">
            <GlassCard className="p-6 h-full border-primary/10">
              <ProductFilters 
                template={inventoryTemplate}
                filters={filters}
                onFilterChange={handleFilterChange}
                onReset={() => setFilters({})}
                isInline={true}
              />
            </GlassCard>
          </aside>
        )}
        
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-32">
              <Loader2 className="animate-spin text-primary mb-4" size={48} />
              <p className="text-text-muted font-medium">Loading {title.toLowerCase()}...</p>
            </div>
          ) : products.length === 0 ? (
            <GlassCard className="p-20 text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center opacity-40">
                <Inbox size={32} />
              </div>
              <div>
                <p className="text-xl font-bold text-text-main">No {title.toLowerCase()} found</p>
                <p className="text-sm text-text-muted mt-1">
                  {search ? `Try adjusting your search for "${search}"` : `Your ${title.toLowerCase()} list is currently empty.`}
                </p>
              </div>
              {search && (
                <button onClick={() => setSearch('')} className="text-primary text-sm font-bold mt-2 hover:underline">
                  Clear search
                </button>
              )}
            </GlassCard>
          ) : viewMode === 'table' ? (
            <GlassCard className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-glass-border bg-glass-bg">
                       <th className="p-4 text-sm font-bold text-text-main">Item</th>
                       <th className="p-4 text-sm font-bold text-text-main">Category</th>
                       <th className="p-4 text-sm font-bold text-text-main">Price</th>
                       <th className="p-4 text-sm font-bold text-text-main">Stock</th>
                       <th className="p-4 text-sm font-bold text-text-main text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => {
                      const template = product.FormTemplate || (product.template_schema ? { 
                        schema: product.template_schema, 
                        design: product.template_design, 
                        mapping: product.template_design?.cardMapping || product.template_design?.mapping || product.template_mapping || {},
                        name: product.template_name 
                      } : inventoryTemplate);

                      // Use specialized fields if available, fallback to role lookup
                      const name = product.name || getRoleValue('title', product, template);
                      const category = product.category || getRoleValue('category', product, template);
                      const price = product.price !== undefined ? product.price : getRoleValue('price', product, template);
                      const stock = product.stock !== undefined ? product.stock : getRoleValue('stock', product, template);
                      const sku = product.sku || getRoleValue('sku', product, template);
                      const barcode = getRoleValue('barcode', product, template);
                      const images = product.images || getRoleValue('image', product, template);
                      const imageUrl = resolveImageUrl((Array.isArray(images) && images.length > 0) ? images[0] : images);

                      return (
                        <tr key={product.id} className="border-b border-glass-border last:border-0 hover:bg-glass-bg transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary overflow-hidden border border-white/5">
                                {imageUrl ? (
                                  <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                                ) : (
                                  <Package size={18} />
                                )}
                              </div>
                              <div>
                                <span className="text-sm font-semibold text-text-main block">{name}</span>
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">SKU: {sku !== '—' ? sku : `ID: ${product.id.slice(0, 8)}`}</span>
                                  {barcode !== '—' && <span className="text-[10px] text-primary/70 font-mono tracking-wider">{barcode}</span>}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-text-muted">
                            <span className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] uppercase font-bold tracking-tight">{category}</span>
                          </td>
                          <td className="p-4 text-sm font-bold text-text-main">{formatDisplayValue(price, 'price')}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${Number(stock) > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                              {Number(stock) > 0 ? `In Stock (${stock})` : 'Out of Stock'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => setLocation(`/dashboard/products/view/${product.id}`)} className="p-2 rounded-lg bg-white/5 text-text-muted hover:bg-primary/10 hover:text-primary transition-all"><Eye size={16} /></button>
                              <button onClick={(e) => handleShare(product, e)} className="p-2 rounded-lg bg-white/5 text-text-muted hover:bg-sky-500/10 hover:text-sky-500 transition-all"><Share2 size={16} /></button>
                              <button onClick={() => { setDrawerMode('edit'); setSelectedProduct(product); setDrawerView(defaultDrawerView); setIsDrawerOpen(true); }} className="p-2 rounded-lg bg-white/5 text-text-muted hover:bg-emerald-500/10 hover:text-emerald-500 transition-all"><Edit3 size={16} /></button>
                              <button onClick={(e) => handleDelete(product.id, e)} className="p-2 rounded-lg bg-white/5 text-text-muted hover:bg-red-500/10 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          ) : (
            <div className="flex flex-wrap gap-6">
              {products.map((product) => (
                <UniversalCard 
                  key={product.id}
                  product={product}
                  template={product.FormTemplate || (product.template_schema ? { 
                    schema: product.template_schema, 
                    design: product.template_design, 
                    mapping: product.template_design?.cardMapping || product.template_design?.mapping || product.template_mapping || {},
                    name: product.template_name 
                  } : inventoryTemplate)}
                  onView={() => setLocation(`/products/${product.FormTemplate.formKey}/${product.dynamic_data_id}`)}
                  onEdit={() => { 
                    setDrawerMode('edit'); 
                    setSelectedProduct(product); 
                    setDrawerView(defaultDrawerView); 
                    setIsDrawerOpen(true); 
                  }}
                  onShare={(e: any) => handleShare(product, e)}
                  onDelete={(e: any) => handleDelete(product.id, e)}
                />
              ))}
            </div>
          )}
          
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-2 pt-10 pb-10">
              <p className="text-xs text-text-muted">
                Showing <span className="text-text-main font-semibold">{(page - 1) * limit + 1}</span> to <span className="text-text-main font-semibold">{Math.min(page * limit, meta.total)}</span> of <span className="text-text-main font-semibold">{meta.total}</span> items
              </p>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(prev => prev - 1)} className="h-10 px-4 rounded-xl bg-white border border-slate-200 text-xs font-bold text-text-muted disabled:opacity-30 flex items-center gap-2 hover:bg-slate-50 transition-all"><ArrowLeft size={14} /> Previous</button>
                <div className="flex gap-1 items-center px-2">
                  {[...Array(meta.totalPages)].map((_, i) => (
                    <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 rounded-lg text-[10px] font-bold transition-all ${page === i + 1 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:bg-slate-100'}`}>{i + 1}</button>
                  ))}
                </div>
                <button disabled={page === meta.totalPages} onClick={() => setPage(prev => prev + 1)} className="h-10 px-4 rounded-xl bg-white border border-slate-200 text-xs font-bold text-text-muted disabled:opacity-30 flex items-center gap-2 hover:bg-slate-50 transition-all">Next <ArrowRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Product Drawer */}
      <Drawer 
        isOpen={isDrawerOpen} 
        onClose={handleCloseDrawer} 
        title={`${drawerMode === 'edit' ? 'Edit' : drawerMode === 'view' ? 'View' : 'Item'} Details`}
        size="xl"
      >
        {isDrawerOpen && (
          <div className="h-full flex flex-col">
            {drawerView === 'inventory' ? (
               <InventoryForm 
                 onCancel={handleCloseDrawer} 
                 onSave={handleSave} 
                 initialData={selectedProduct} 
                 mode={drawerMode} 
                 templateName={templateName} 
                 templateId={templateId} 
                 template={inventoryTemplate}
               />
            ) : (
               <ExceptInventoryForms 
                 onCancel={handleCloseDrawer} 
                 onSave={handleSave} 
                 initialData={selectedProduct} 
                 mode={drawerMode} 
                 itemType={drawerView as any}
                 templateId={templateId}
                 template={inventoryTemplate}
               />
            )}
          </div>
        )}
      </Drawer>

      <Drawer isOpen={isFilterDrawerOpen} onClose={() => setIsFilterDrawerOpen(false)} title="Filter Items" side={isFullscreen ? 'left' : 'right'}>
        <div className="space-y-8">
          {getFilterableFields().map((field) => {
            const isColor = field.label.toLowerCase().includes('color');
            const options = field.options || [];
            return (
              <div key={field.id} className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted pl-1">{field.label}</label>
                {isColor ? (
                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => handleFilterChange(field.id, '')} className={`w-10 h-10 rounded-full border flex items-center justify-center text-[10px] font-bold ${!filters[field.id] ? 'border-primary bg-primary/10 text-primary' : 'border-glass-border bg-glass-bg text-text-muted'}`}>All</button>
                    {options.map((o: any) => {
                      const val = typeof o === 'string' ? o : (o.value || o.v || o.label || '');
                      const isActive = filters[field.id] === val;
                      return (
                        <button key={val} onClick={() => handleFilterChange(field.id, val)} className={`w-10 h-10 rounded-full border transition-all flex items-center justify-center relative group ${isActive ? 'scale-110 border-white shadow-xl' : 'border-transparent'}`} style={{ backgroundColor: val }} title={typeof o === 'string' ? o : o.label}>
                          {isActive && <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full"><Check size={14} className="text-white" /></div>}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button onClick={() => handleFilterChange(field.id, '')} className={`w-full flex items-center justify-between p-3.5 rounded-2xl border ${!filters[field.id] ? 'bg-primary/10 border-primary text-primary' : 'bg-slate-50 border-slate-200 text-text-muted'}`}><span className="text-xs font-bold">All {field.label}s</span>{!filters[field.id] && <Check size={16} />}</button>
                    {options.slice(0, 3).map((o: any) => {
                      const val = typeof o === 'string' ? o : (o.value || o.v || o.label || '');
                      const label = typeof o === 'string' ? o : (o.label || o.value || o.v || 'Unknown');
                      const isActive = filters[field.id] === val;
                      return (
                        <button key={val} onClick={() => handleFilterChange(field.id, val)} className={`w-full flex items-center justify-between p-3.5 rounded-2xl border ${isActive ? 'bg-primary/10 border-primary text-primary' : 'bg-slate-50 border-slate-200 text-text-muted'}`}><span className="text-xs font-bold">{label}</span>{isActive && <Check size={16} />}</button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          <div className="pt-8 border-t border-slate-200 flex gap-4 mt-auto">
            <HeaderButton variant="outline" className="flex-1 h-14 rounded-2xl" onClick={() => { setFilters({}); setIsFilterDrawerOpen(false); fetchData(1, search, {}); }}>Reset</HeaderButton>
            <HeaderButton className="flex-1 h-14 rounded-2xl" onClick={() => { setIsFilterDrawerOpen(false); fetchData(1, search, filters); }}>Apply</HeaderButton>
          </div>
        </div>
      </Drawer>

      <Drawer isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title="Share Item">
        <div className="space-y-8 h-full flex flex-col">
          <div className="p-6 rounded-3xl bg-primary/5 border border-primary/20 flex flex-col items-center text-center gap-4">
             <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"><Share2 size={32} /></div>
             <div><h3 className="text-xl font-bold text-text-main">Promote this {title.slice(0, -1)}</h3><p className="text-xs text-text-muted mt-1 italic">Spread the word about your items.</p></div>
          </div>
          <div className="space-y-3">
             <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted pl-1">Shareable Link</label>
             <div className="relative group">
                <input type="text" readOnly value={`${window.location.origin}/public/${sharingProduct?.tenant_id || 'guest'}/${sharingProduct?.id}`} className="w-full h-14 pl-4 pr-14 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-text-main font-medium outline-none" />
                <button onClick={copyToClipboard} className={`absolute right-2 top-2 h-10 px-4 rounded-xl flex items-center gap-2 text-xs font-bold transition-all active:scale-95 ${isCopied ? 'bg-emerald-500 text-white shadow-lg' : 'bg-primary text-white shadow-lg'}`}>{isCopied ? <Check size={14} /> : <Copy size={14} />}{isCopied ? 'Copied' : 'Copy'}</button>
             </div>
          </div>
          <div className="space-y-4">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted pl-1">Social Sharing</p>
             <div className="grid grid-cols-3 gap-4">
                {socialLinks.map(({ name, icon: Icon, color, url }) => (
                  <button key={name} onClick={() => { const storeUrl = `${window.location.origin}/public/${sharingProduct?.tenant_id || 'guest'}/${sharingProduct?.id}`; window.open(url(storeUrl), '_blank'); }} className={`flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-glass-border/30 transition-all group active:scale-95 ${color}`}><Icon size={24} className="group-hover:scale-110 transition-transform" /><span className="text-[10px] font-bold text-text-muted group-hover:text-text-main">{name}</span></button>
                ))}
             </div>
          </div>
        </div>
      </Drawer>
    </div>
  </Layout>
  );
};

export default ProductBasePage;
