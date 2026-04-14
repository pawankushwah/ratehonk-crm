import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShoppingBag,
  Share2,
  Heart,
  CheckCircle2,
  ShieldCheck,
  Truck,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Check
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import GlassCard from '@/components/products/GlassCard';
import Button from '@/components/products/Button';
import PublicLayout from '@/components/products/PublicLayout';
import CardRenderer from '@/components/products/CardRenderer';
import { getDynamicItemDataPublic } from '@/lib/forms';

const PublicProductView = () => {
  const { userId, productId } = useParams<{ userId: string; productId: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [template] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Variant Selection State
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!productId) return;
      setIsLoading(true);
      try {
        // const templatesRes = await getTemplates();
        // const invTemplate = (templatesRes.data || []).find((t: any) => 
        //   t.name.toLowerCase() === 'inventory' || t.resource_type === 'product'
        // );
        
        // if (!invTemplate) throw new Error('Inventory template not found');
        // setTemplate(invTemplate);

        const dataRes = await getDynamicItemDataPublic(productId);
        if (dataRes.success && dataRes.data) {
          const productRecord = dataRes.data;
          setProduct(productRecord);
          
          const pd = productRecord.data || productRecord || {};
          const isInventory = productRecord.FormTemplate?.name === 'Inventory' || productRecord.templateId === '019d2ecf-5291-7cce-b37c-50c6c5f27d1b';

          let variants: any[] = [];
          if (isInventory) {
            variants = pd['1774592408283'] || [];
          } else {
            variants = pd['1774607666149'] || [];
          }
          
          if (variants.length > 0) {
            const mappedVariants = variants.map((v: any) => ({
              ...v,
              color: isInventory ? v['1774593363843'] : (v.color || v.value),
              size: isInventory ? v['1774593375945'] : v.size,
              price: isInventory ? v['1774593307729'] : v.price,
              stock: isInventory ? v['1774592416416'] : v.stock,
              image: isInventory ? v['1774607666147'] : (v.image || v.url)
            }));
            
            setSelectedVariant(mappedVariants[0]);
            if (mappedVariants[0].size) setSelectedSize(mappedVariants[0].size);
          }
        } else {
          setError('Product not found.');
        }
      } catch (err: any) {
        console.error('Fetch error:', err);
        setError(err.message || 'Failed to load product details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId]);

  const getVal = (keywords: string[]) => {
    if (!template || !product) return '—';
    const pd = product.data || product || {};
    const findField = (items: any[]): any => {
      for (const it of items) {
        if (it.kind === 'field' && keywords.some(k => it.label.toLowerCase().includes(k.toLowerCase()))) return it;
        if (it.kind === 'section') { const f = findField(it.items); if (f) return f; }
        if (it.kind === 'group') { const f = findField(it.fields); if (f) return f; }
      }
      return null;
    };
    const field = findField(template.schema);
    return field ? pd[field.id] || '—' : '—';
  };

  if (isLoading) {
    return (
      <PublicLayout username={userId}>
        <div className="flex flex-col items-center justify-center p-40">
          <Loader2 className="animate-spin text-primary mb-4" size={48} />
          <p className="text-text-muted font-black uppercase tracking-widest text-xs opacity-50">Opening Vault...</p>
        </div>
      </PublicLayout>
    );
  }

  if (error || !product) {
    return (
      <PublicLayout username={userId}>
        <div className="flex flex-col items-center justify-center p-20 text-center gap-6">
          <AlertCircle size={64} className="text-red-500/40" strokeWidth={1} />
          <div>
            <h2 className="text-3xl font-black text-text-main mb-2 tracking-tight">Access Denied</h2>
            <p className="text-text-muted max-w-md italic opacity-70">{error || 'This product is no longer available in the public catalog.'}</p>
          </div>
          <Button onClick={() => navigate(`/p/${userId}`)} variant="outline">Back to Catalog</Button>
        </div>
      </PublicLayout>
    );
  }

  const pd = product.data || product || {};
  const isInventory = product.FormTemplate?.name === 'Inventory' || product.templateId === '019d2ecf-5291-7cce-b37c-50c6c5f27d1b';
  
  let name, category, basePrice: string, baseStock, description, variants: any[] = [];
  
  if (isInventory) {
    name = pd['1774624701189'];
    category = pd['1774642468861'];
    basePrice = pd['1774593452328'];
    description = pd['1774594031376'] || pd['description'];
    
    const rawVariants = pd['1774592408283'] || [];
    variants = rawVariants.map((v: any) => ({
      ...v,
      color: v['1774593363843'],
      size: v['1774593375945'],
      price: v['1774593307729'] || basePrice,
      stock: v['1774592416416'],
      image: v['1774607666147']
    }));
    
    baseStock = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
  } else {
    name = getVal(['name', 'product', 'title']);
    category = getVal(['category', 'type']);
    basePrice = getVal(['price', 'cost']);
    baseStock = getVal(['stock', 'quantity', 'qty']);
    description = getVal(['description', 'about', 'details']);
    variants = pd["1774607666149"] || [];
  }
  
  const allImages: any[] = [];
  variants.forEach(v => {
    if (v.image) {
      if (Array.isArray(v.image)) allImages.push(...v.image);
      else allImages.push(v.image);
    }
  });
  const uniqueImages = allImages.length > 0 ? allImages : (pd["1774607666147"] || []);
  
  const currentPrice = selectedVariant?.price || basePrice;
  const currentStock = selectedVariant?.stock || baseStock;
  
  const availableColors = variants.filter((v, i, self) => 
    i === self.findIndex((t) => (t.color === v.color))
  );
  const availableSizes = Array.from(new Set(variants.map(v => v.size).filter(Boolean)));

  const resolveImageUrl = (img: any) => {
    if (!img) return null;
    if (typeof img === 'string') {
      if (img.startsWith('http') || img.startsWith('blob:') || img.startsWith('data:')) return img;
      return `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/images/${img}`;
    }
    return img.url || (typeof img[0] === 'string' ? `${import.meta.env.VITE_API_URL}/api/images/${img[0]}` : img[0]?.url);
  };

  const shareImage = resolveImageUrl(uniqueImages[0]) || `https://picsum.photos/seed/${productId}/600/600`;
  const shareUrl = window.location.href;
  const shareTitle = `${name} | RateHonk`;
  const shareDescription = description && description !== '—' ? description : `Check out this exclusive ${category || 'product'} on RateHonk.`;

  return (
    <PublicLayout username={userId}>
      <Helmet>
        <title>{shareTitle}</title>
        <meta name="description" content={shareDescription} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="product" />
        <meta property="og:url" content={shareUrl} />
        <meta property="og:title" content={shareTitle} />
        <meta property="og:description" content={shareDescription} />
        <meta property="og:image" content={shareImage} />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={shareUrl} />
        <meta property="twitter:title" content={shareTitle} />
        <meta property="twitter:description" content={shareDescription} />
        <meta property="twitter:image" content={shareImage} />
      </Helmet>

      <div className="mb-10">
        <button 
          onClick={() => navigate(`/p/${userId}`)}
          className="flex items-center gap-2 text-sm font-bold text-text-muted hover:text-primary transition-all group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Collection
        </button>
      </div>

      {product.FormTemplate?.design ? (
        <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-1000">
           <CardRenderer 
             design={product.FormTemplate.design} 
             data={product.data || product} 
             template={product.FormTemplate} 
             mode="view" 
             selectedVariant={selectedVariant}
           />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="lg:col-span-7 space-y-6">
            <GlassCard className="overflow-hidden p-0 border-none shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] group relative">
               <div className="aspect-square bg-white/5 relative overflow-hidden">
                  {uniqueImages.length > 0 ? (
                    <>
                      <img 
                        key={currentImageIndex}
                        src={resolveImageUrl(uniqueImages[currentImageIndex]) || ''} 
                        alt={name} 
                        className="w-full h-full object-cover animate-in fade-in duration-700"
                      />
                      
                      {uniqueImages.length > 1 && (
                        <>
                          <button 
                            onClick={() => setCurrentImageIndex(prev => (prev === 0 ? uniqueImages.length - 1 : prev - 1))}
                            className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-black/20 hover:bg-black/40 backdrop-blur-md text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-2xl z-20"
                          >
                            <ChevronLeft size={24} />
                          </button>
                          <button 
                            onClick={() => setCurrentImageIndex(prev => (prev === uniqueImages.length - 1 ? 0 : prev + 1))}
                            className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-black/20 hover:bg-black/40 backdrop-blur-md text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-2xl z-20"
                          >
                            <ChevronRight size={24} />
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 text-text-muted/20 pb-20">
                      <ShoppingBag size={140} strokeWidth={1} />
                      <p className="text-sm font-black uppercase tracking-[0.4em] mt-8 opacity-30">Exclusive Collection Item</p>
                    </div>
                  )}
                  
                  <div className="absolute top-6 right-6 flex flex-col gap-3 z-10">
                      <button className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-primary transition-all shadow-xl">
                          <Heart size={20} />
                      </button>
                      <button className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-primary transition-all shadow-xl">
                          <Share2 size={20} />
                      </button>
                  </div>
               </div>
               
               {uniqueImages.length > 1 && (
                 <div className="absolute bottom-6 left-6 right-6 flex gap-4 p-4 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 no-scrollbar overflow-x-auto">
                   {uniqueImages.map((img: any, i: number) => (
                     <button 
                       key={i} 
                       onClick={() => setCurrentImageIndex(i)}
                       className={`w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-all active:scale-95 ${i === currentImageIndex ? 'border-primary ring-4 ring-primary/20 scale-105' : 'border-white/20 hover:border-white/40'}`}
                     >
                       <img src={resolveImageUrl(img) || ''} alt="" className="w-full h-full object-cover" />
                     </button>
                   ))}
                 </div>
               )}
            </GlassCard>

            <GlassCard className="p-8 hidden lg:block border-none bg-linear-to-br from-white/5 to-transparent">
               <div className="grid grid-cols-3 gap-8">
                  <div className="flex flex-col items-center text-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                          <ShieldCheck size={24} />
                      </div>
                      <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-text-main mb-1">Authentic</p>
                          <p className="text-[10px] text-text-muted opacity-60">Verified Origin</p>
                      </div>
                  </div>
                  <div className="flex flex-col items-center text-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center">
                          <Truck size={24} />
                      </div>
                      <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-text-main mb-1">Express</p>
                          <p className="text-[10px] text-text-muted opacity-60">Worldwide Shipping</p>
                      </div>
                  </div>
                  <div className="flex flex-col items-center text-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                          <CheckCircle2 size={24} />
                      </div>
                      <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-text-main mb-1">Warranty</p>
                          <p className="text-[10px] text-text-muted opacity-60">24 Months Protection</p>
                      </div>
                  </div>
               </div>
            </GlassCard>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                      {category}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/10 ${Number(currentStock) > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {Number(currentStock) > 0 ? 'Ready to Ship' : 'Pre-order Only'}
                  </span>
              </div>
              <h1 className="text-5xl font-black text-text-main tracking-tight leading-none uppercase">{name}</h1>
              <div className="flex items-end gap-3 pt-2">
                  <span className="text-4xl font-black text-text-main tracking-tight">${currentPrice}</span>
                  <span className="text-sm font-medium text-text-muted mb-2 opacity-50 italic">Inc. VAT & Fees</span>
              </div>
            </div>

            <GlassCard className="p-8 space-y-8 border-none bg-linear-to-tr from-white/5 to-transparent shadow-2xl">
               {availableColors.length > 0 && (
                 <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-black uppercase tracking-widest text-text-main">Select Color</span>
                        <span className="text-[10px] font-bold text-primary italic uppercase tracking-widest">{selectedVariant?.label || selectedVariant?.color}</span>
                    </div>
                    <div className="flex gap-4">
                      {availableColors.map((c: any, i: number) => (
                        <button
                          key={i}
                          onClick={() => {
                            setSelectedVariant(c);
                            const imgIndex = uniqueImages.findIndex((img: any) => {
                              const imgId = typeof img === 'string' ? img : (img.uuid || img.id);
                              const variantImg = Array.isArray(c.image) ? c.image[0] : c.image;
                              const vId = typeof variantImg === 'string' ? variantImg : (variantImg?.uuid || variantImg?.id);
                              return imgId === vId;
                            });
                            if (imgIndex !== -1) setCurrentImageIndex(imgIndex);
                          }}
                          className={`w-12 h-12 rounded-2xl border-2 transition-all duration-500 relative flex items-center justify-center shadow-xl hover:-translate-y-1 
                            ${selectedVariant?.color === c.color 
                              ? 'border-slate-900 dark:border-white ring-2 ring-primary ring-offset-2 ring-offset-white/80 dark:ring-offset-bg-dark scale-110 rotate-12 z-10' 
                              : 'border-black/5 dark:border-white/5 opacity-60 hover:opacity-100'}`}
                          style={{ backgroundColor: (c.color && typeof c.color === 'string') ? c.color : '#e2e8f0' }}
                          title={c.label || 'Variant'}
                        >
                           {/* Subtle inner ring for visibility on white bg */}
                           <div className="absolute inset-0 rounded-2xl border border-black/5 pointer-events-none" />
                           
                           {selectedVariant?.color === c.color && (
                             <div className="flex items-center justify-center bg-black/30 dark:bg-white/20 backdrop-blur-[1px] rounded-full p-1">
                               <Check size={14} className="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" />
                             </div>
                           )}
                        </button>
                      ))}
                    </div>
                 </div>
               )}

               {availableSizes.length > 0 && (
                 <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-black uppercase tracking-widest text-text-main">Choose Size</span>
                        <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline opacity-60">Size Guide</button>
                    </div>
                    <div className="grid grid-cols-5 gap-3">
                        {availableSizes.map(size => (
                            <button 
                              key={size}
                              onClick={() => setSelectedSize(size)}
                              className={`h-12 rounded-xl border font-black text-xs transition-all flex items-center justify-center hover:shadow-lg ${selectedSize === size ? 'bg-primary border-primary text-white shadow-primary/30' : 'bg-white/5 border-glass-border/30 text-text-muted hover:border-white/20'}`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                 </div>
               )}

               <div className="pt-4 flex flex-col gap-4">
                  <button className="w-full h-16 rounded-[1.25rem] bg-primary text-white font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-4 shadow-[0_20px_40px_-10px_rgba(var(--color-primary),0.3)] hover:bg-primary/90 transition-all active:scale-95 group/main">
                      <ShoppingBag size={20} className="group-hover/main:animate-bounce" />
                      Place Order Now
                  </button>
               </div>
            </GlassCard>

            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-[1px] flex-1 bg-glass-border/50" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-40">Architectural Notes</span>
                    <div className="h-[1px] flex-1 bg-glass-border/50" />
                </div>
                <p className="text-sm font-medium text-text-muted leading-relaxed italic opacity-80 pl-4 border-l-2 border-primary/20">
                  {description !== '—' ? description : 'No description provided by the creator for this exclusive item.'}
                </p>
            </div>
          </div>
        </div>
      )}
    </PublicLayout>
  );
};

export default PublicProductView;
