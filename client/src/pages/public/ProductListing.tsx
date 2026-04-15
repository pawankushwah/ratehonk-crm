import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Inbox,
  ShoppingBag,
  List,
  LayoutGrid,
  Package,
  Eye,
  Share2
} from 'lucide-react';
import PublicLayout from '@/components/products/PublicLayout';
import { getAllDynamicDataPublic, getPublicTemplates } from '@/lib/forms';
import UniversalCard from '@/components/products/UniversalCard';
import Drawer from '@/components/products/Drawer';
import { useLocation, useParams } from 'wouter';
import { getRoleValue, formatDisplayValue, resolveImageUrl } from '@/utils/dynamicRenderer';

const PublicProductListing = () => {
  let { userId } = useParams<{ userId: string }>();
    const [, setLocation] = useLocation();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inventoryTemplate, setInventoryTemplate] = useState<any>(null);
  
  // View & Filter States
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const fetchData = async (currentSearch = search, activeFilters = filters) => {
    setIsLoading(true);
    try {
      // Resolve Inventory Template for fallback
      let invTemplate = inventoryTemplate;
      // if (!invTemplate) {
      //   const templates = await getPublicTemplates();
      //   invTemplate = templates?.find((t: any) => 
      //     t.name.toLowerCase() === 'inventory' || t.resource_type === 'product'
      //   ) || templates?.[0];
        
      //   if (invTemplate) {
      //     setInventoryTemplate(invTemplate);
      //   }
      // }

      const dataRes = await getAllDynamicDataPublic({ 
        user: userId,
        search: currentSearch,
        ...activeFilters
      });
      
      if (dataRes?.success) {
        const results = Array.isArray(dataRes.data) ? dataRes.data : (dataRes.data?.data || []);
        setProducts(results);
      }
    } catch (err) {
      console.error('Failed to fetch public products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(search, filters);
    }, 500);
    return () => clearTimeout(timer);
  }, [userId, search, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const shareUrl = window.location.href;
  const shareTitle = `${userId || 'User'}'s Collection | RateHonk`;
  const shareDescription = `Explore the exclusive product collection from ${userId || 'this seller'} on RateHonk. Find unique items and premium designs.`;
  const shareImage = products.length > 0 ? (products[0].data?.['1774607666147']?.[0]?.url || products[0].data?.['1774607666147']?.[0] || `https://picsum.photos/seed/${userId}/1200/630`) : `https://picsum.photos/seed/${userId}/1200/630`;

  return (
    <PublicLayout username={userId}>
      {/* <Helmet>
        <title>{shareTitle}</title>
        <meta name="description" content={shareDescription} />
        
        <meta property="og:type" content="website" />
        <meta property="og:url" content={shareUrl} />
        <meta property="og:title" content={shareTitle} />
        <meta property="og:description" content={shareDescription} />
        <meta property="og:image" content={shareImage} />

        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={shareUrl} />
        <meta property="twitter:title" content={shareTitle} />
        <meta property="twitter:description" content={shareDescription} />
        <meta property="twitter:image" content={shareImage} />
      </Helmet> */}

      <div className="flex flex-col gap-10">
        {/* Hero Section */}
        <div className="relative p-10 rounded-[2.5rem] bg-linear-to-br from-primary/10 via-transparent to-bg-alt border border-glass-border/50 overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full animate-pulse" />
            <div className="relative z-10 max-w-2xl">
                <h1 className="text-5xl font-black text-text-main tracking-tight mb-4 leading-tight">
                    Discovery <br />
                    <span className="gradient-text">Premium Collections</span>
                </h1>
                <p className="text-text-muted font-medium italic opacity-70">
                    Exploring unique items curated specifically for you. Quality materials meets state-of-the-art designs.
                </p>
            </div>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-2 border-b border-glass-border/30">
            <div className="flex items-center gap-4 flex-1 w-full">
                <div className="relative flex-1 group">
                    <input 
                      type="text" 
                      placeholder="Search items..." 
                      className="w-full h-12 pl-12 pr-4 rounded-2xl bg-glass-bg border border-glass-border/50 text-sm text-text-main outline-none focus:border-primary/50 transition-all font-medium group-hover:bg-glass-bg/80"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-hover:text-primary transition-colors" size={20} />
                </div>
                
                <div className="flex p-1 rounded-2xl bg-glass-bg border border-glass-border/50 h-12">
                  <button 
                    onClick={() => setViewMode('table')}
                    className={`flex items-center justify-center w-12 h-full rounded-xl transition-all ${viewMode === 'table' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:bg-white/5'}`}
                  >
                    <List size={20} />
                  </button>
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`flex items-center justify-center w-12 h-full rounded-xl transition-all ${viewMode === 'grid' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:bg-white/5'}`}
                  >
                    <LayoutGrid size={20} />
                  </button>
                </div>

                <button 
                  onClick={() => setIsFilterDrawerOpen(true)}
                  className={`h-12 px-6 rounded-2xl border flex items-center gap-2 text-sm font-bold transition-all ${Object.keys(filters).length > 0 ? 'bg-primary/10 border-primary text-primary' : 'border-glass-border/50 bg-glass-bg text-text-main hover:bg-glass-bg/80'}`}
                >
                    <Filter size={18} className="text-primary" />
                    Filters {Object.keys(filters).length > 0 && '(Active)'}
                </button>
            </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
              <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                  <ShoppingBag className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary/40" size={20} />
              </div>
              <p className="text-text-muted font-black uppercase tracking-[0.2em] text-[10px] animate-pulse">Syncing Products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 gap-6 opacity-40">
            <Inbox size={64} className="text-text-muted" strokeWidth={1} />
            <div className="text-center">
              <h3 className="text-2xl font-black text-text-main">No collections found</h3>
              <p className="text-sm text-text-muted italic">The vault is currently empty for this user.</p>
            </div>
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-hidden rounded-[2.5rem] bg-glass-bg border border-glass-border/50 shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-glass-border/30 bg-glass-bg/50">
                     <th className="p-6 text-[10px] font-black uppercase tracking-widest text-text-muted">Discovery Item</th>
                     <th className="p-6 text-[10px] font-black uppercase tracking-widest text-text-muted">Category</th>
                     <th className="p-6 text-[10px] font-black uppercase tracking-widest text-text-muted">Price</th>
                     <th className="p-6 text-[10px] font-black uppercase tracking-widest text-text-muted">Availability</th>
                     <th className="p-6 text-right text-[10px] font-black uppercase tracking-widest text-text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const template = p.FormTemplate || inventoryTemplate;
                    const name = getRoleValue('title', p, template);
                    const category = getRoleValue('category', p, template);
                    const price = getRoleValue('price', p, template);
                    const stock = getRoleValue('stock', p, template);
                    const image = getRoleValue('image', p, template);
                    const imageUrl = resolveImageUrl(image);

                    return (
                      <tr key={p.id} className="border-b border-glass-border/20 last:border-0 hover:bg-white/5 transition-colors group/row">
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-primary overflow-hidden border border-white/5 group-hover/row:scale-105 transition-transform duration-500">
                              {imageUrl ? (
                                <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                              ) : (
                                <Package size={24} strokeWidth={1.5} />
                              )}
                            </div>
                            <div>
                               <span className="text-sm font-black text-text-main block tracking-tight">{name}</span>
                               <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold opacity-60">ID: {p.id.slice(0, 12)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">{category}</span>
                        </td>
                        <td className="p-6">
                           <span className="text-sm font-black text-text-main">{formatDisplayValue(price, 'price')}</span>
                        </td>
                        <td className="p-6">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${Number(stock) > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                            {Number(stock) > 0 ? `Stocked (${stock})` : 'Sold Out'}
                          </span>
                        </td>
                        <td className="p-6 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button 
                              onClick={() => setLocation(`/public/${userId}/${p.id}`)}
                              className="w-10 h-10 rounded-xl bg-white/5 text-text-muted hover:bg-primary/10 hover:text-primary border border-white/5 transition-all flex items-center justify-center group/btn"
                              title="Explore Vault"
                            >
                              <Eye size={18} className="group-hover/btn:scale-110 transition-transform" />
                            </button>
                            <button 
                              className="w-10 h-10 rounded-xl bg-white/5 text-text-muted hover:bg-sky-500/10 hover:text-sky-500 border border-white/5 transition-all flex items-center justify-center group/btn"
                              title="Share Discovery"
                              onClick={(e) => {
                                e.stopPropagation();
                                const url = `${window.location.origin}/public/${userId}/${p.id}`;
                                navigator.clipboard.writeText(url);
                                alert('Link copied to clipboard!');
                              }}
                            >
                              <Share2 size={18} className="group-hover/btn:scale-110 transition-transform" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map(p => (
              <UniversalCard 
                key={p.id} 
                product={p} 
                template={p.FormTemplate || inventoryTemplate} 
                onView={() => setLocation(`/public/${userId}/${p.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <Drawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        title="Filter Products"
        widthClassName="max-w-md"
      >
        <div className="space-y-8">
          {/* Categories */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Category</label>
            <div className="flex flex-wrap gap-2">
              {['All', 'T-shirt', 'Electronics', 'Footwear', 'Accessories'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleFilterChange('category', cat === 'All' ? '' : cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    (filters.category === cat || (cat === 'All' && !filters.category))
                      ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                      : 'border-glass-border bg-glass-bg text-text-muted hover:border-glass-border/50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Price Range</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Under $50', min: '0', max: '50' },
                { label: '$50 - $100', min: '50', max: '100' },
                { label: '$100 - $500', min: '100', max: '500' },
                { label: '$500+', min: '500', max: '' }
              ].map((range) => (
                <button
                  key={range.label}
                  onClick={() => {
                    handleFilterChange('min_price', range.min);
                    handleFilterChange('max_price', range.max);
                  }}
                  className={`px-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all border ${
                    filters.min_price === range.min && filters.max_price === range.max
                      ? 'bg-primary border-primary text-white shadow-lg'
                      : 'border-glass-border bg-glass-bg text-text-muted hover:border-glass-border/50'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stock Status */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Stock Status</label>
            <div className="flex p-1 rounded-xl bg-glass-bg border border-glass-border h-12">
              {[
                { label: 'All', value: '' },
                { label: 'In Stock', value: 'in_stock' },
                { label: 'Out of Stock', value: 'out_of_stock' }
              ].map((status) => (
                <button
                  key={status.value}
                  onClick={() => handleFilterChange('stock_status', status.value)}
                  className={`flex-1 flex items-center justify-center rounded-lg text-[10px] font-black transition-all ${
                    (filters.stock_status === status.value || (!status.value && !filters.stock_status))
                      ? 'bg-primary text-white shadow-lg'
                      : 'text-text-muted hover:bg-glass-bg'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-glass-border flex gap-4">
            <button 
              className="flex-1 h-12 rounded-xl border border-glass-border text-xs font-bold text-text-main"
              onClick={() => {
                setFilters({});
                setIsFilterDrawerOpen(false);
              }}
            >
              Reset All
            </button>
            <button 
              className="flex-1 h-12 rounded-xl bg-primary text-white text-xs font-bold shadow-lg shadow-primary/20"
              onClick={() => setIsFilterDrawerOpen(false)}
            >
              Show Results
            </button>
          </div>
        </div>
      </Drawer>
    </PublicLayout>
  );
};

export default PublicProductListing;
