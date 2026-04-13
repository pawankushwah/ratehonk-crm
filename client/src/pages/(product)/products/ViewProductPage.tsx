import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import {
  ArrowLeft, Package,
  Box, Loader2,
  AlertCircle
} from 'lucide-react';
import Button from '@/components/products/Button';
import { getTemplates, getDynamicItemData } from '@/lib/forms';
import { getRoleValue, findFieldByRole, resolveImageUrl } from '@/utils/dynamicRenderer';
import CardRenderer from '@/components/products/CardRenderer';
import { Layout } from '@/components/layout/layout';

const ViewProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [product, setProduct] = useState<any>(null);
  const [template, setTemplate] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  // const { setTitle } = useDashboard();

  // useEffect(() => {
  //   setTitle('Product Details');
  // }, [setTitle]);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        // 1. Fetch Product Data first (contains embedded template)
        const dataRes = await getDynamicItemData(id);
        
        if (dataRes.success && dataRes.data) {
          const productResponse = dataRes.data;
          setProduct(productResponse);

          // 2. Resolve Embedded Template or fallback to generic discovery
          let activeTemplate = productResponse.FormTemplate || productResponse.form_template || productResponse.formTemplate;
          
          if (!activeTemplate) {
            console.log("No embedded template found, fetching inventory archetype...");
            const templatesRes = await getTemplates();
            const templates = templatesRes.data || [];
            activeTemplate = templates.find((t: any) => 
               t.name.toLowerCase() === 'inventory' || t.resource_type === 'product'
            );
          }
          
          if (!activeTemplate) {
            throw new Error('Product architecture (template) not found.');
          }

          setTemplate(activeTemplate);
          
          // 3. Dynamic discovery of variants group
          let variantsFieldId = '';
          const schemaItems = activeTemplate.form_schema?.items || activeTemplate.schema?.items || activeTemplate.schema || [];
          
          const traverse = (items: any[]) => {
            for (const item of items) {
               if (item.kind === 'group' && (item.label?.toLowerCase().includes('variant') || item.name?.toLowerCase().includes('variant'))) {
                 variantsFieldId = item.id;
                 break;
               }
               if (item.items) traverse(item.items);
               if (item.fields) traverse(item.fields);
            }
          };
          
          if (Array.isArray(schemaItems)) {
            traverse(schemaItems);
          }

          const rawVariants = productResponse.data?.[variantsFieldId] || productResponse.data?.['1774592408283'] || [];
          if (rawVariants.length > 0) {
            setSelectedVariant(rawVariants[0]);
          }
        } else {
          setError('Product not found or has been removed.');
        }
      } catch (err: any) {
        console.error('Fetch error:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load product details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-32">
        <Loader2 className="animate-spin text-primary mb-4" size={48} />
        <p className="text-text-muted font-medium">Fetching product architecture...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center p-20 text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-6">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-bold text-text-main mb-2">Oops!</h2>
          <p className="text-text-muted max-w-md mb-8">{error || 'Something went wrong while loading this product.'}</p>
          <Button onClick={() => setLocation('/dashboard/products')}>Back to {template?.name || "Products"}</Button>
        </div>
      </Layout>
    );
  }

  const productData = product?.data || product || {};
  const name = getRoleValue('title', product, template);
  const description = getRoleValue('description', product, template);
  
  const specs: any[] = [];
  const roleFields = ['title', 'price', 'stock', 'category', 'sku', 'description', 'image'].map(r => findFieldByRole(r as any, template));
  
  const traverseSchema = (items: any[]) => {
    items.forEach(item => {
      if (item.kind === 'field') {
        if (roleFields.includes(item.id)) return;
        const val = productData[item.id];
        if (val && val !== '—') {
          specs.push({ label: item.label, value: val, type: item.type });
        }
      } else if (item.kind === 'section') {
        traverseSchema(item.items || []);
      } else if (item.kind === 'group') {
        traverseSchema(item.fields || []);
      }
    });
  };
  
  if (template?.form_schema?.items) {
    traverseSchema(template.form_schema.items);
  } else if (template?.schema) {
    traverseSchema(template.schema);
  }

  const image = getRoleValue('image', product, template);
  const imageUrl = resolveImageUrl(image);
  
  return (
    <Layout>
      <div className="min-h-screen pb-20">
        <div className="mb-8 flex items-center justify-between">
          <button 
            onClick={() => setLocation('/dashboard/all-products')}
            className="flex items-center gap-2 text-sm font-bold text-text-muted hover:text-primary transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all">
              <ArrowLeft size={18} />
            </div>
            Back to {template?.name || "Products"}
          </button>
        </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
        {template?.design ? (
          <CardRenderer 
            design={template.design}
            data={productData}
            template={template}
            mode="view"
            selectedVariant={selectedVariant}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
             <div className="lg:col-span-12 p-32 text-center bg-white/5 rounded-[3rem] border border-white/10 flex flex-col items-center justify-center overflow-hidden relative">
                {imageUrl && (
                  <div className="absolute inset-0 opacity-20 blur-3xl scale-150 -z-10">
                    <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="w-48 h-48 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary mb-8 overflow-hidden border border-white/10 shadow-2xl">
                   {imageUrl ? (
                     <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                   ) : (
                     <Package size={64} />
                   )}
                </div>
                <h2 className="text-4xl font-black mb-4 tracking-tighter">{name}</h2>
                <p className="text-text-muted max-w-xl mx-auto leading-relaxed text-lg">
                   {description !== '—' ? description : 'This product uses a dynamic architecture but has no defined immersive design.'}
                </p>
                <div className="mt-12 flex gap-4">
                   <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                      <Box size={18} className="text-primary" />
                      <span className="text-xs font-black uppercase tracking-widest">Awaiting Studio Pro Design</span>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Supplemental Technical Specifications (Automatic Discovery) */}
      <div className="mt-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* <div className="flex items-center gap-6 mb-12">
            <div className="w-16 h-16 rounded-4xl bg-primary/10 text-primary flex items-center justify-center shadow-2xl shadow-primary/20">
              <Tag size={32} />
            </div>
            <div>
              <h2 className="text-4xl font-black text-text-main tracking-tight">Product Architecture</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">Automated Attribute Discovery</p>
            </div>
          </div> */}

          {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {specs.length > 0 ? specs.map((spec, i) => (
              <GlassCard key={i} className="p-8 border-none bg-white/2 hover:bg-white/5 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-3xl -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between mb-6">
                   <span className="text-[10px] font-black uppercase tracking-widest text-[#A1A1AA] group-hover:text-primary transition-colors">
                      {spec.label}
                   </span>
                   <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                      <Info size={14} className="text-primary" />
                   </div>
                </div>
                <p className="text-xl font-black text-text-main group-hover:translate-x-1 transition-transform">
                  {formatDisplayValue(spec.value, spec.type)}
                </p>
              </GlassCard>
            )) : (
              <div className="col-span-full py-32 text-center bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                <p className="text-sm font-bold text-text-muted uppercase tracking-widest opacity-30">No supplemental technical parameters found.</p>
              </div>
            )}
          </div> */}
        </div>
      </div>
      </div>
    </Layout>
  );
};

export default ViewProductPage;
