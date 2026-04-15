import { useState, useEffect } from 'react';
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
// import { Helmet } from 'react-helmet-async';
import GlassCard from '@/components/products/GlassCard';
import Button from '@/components/products/Button';
import PublicLayout from '@/components/products/PublicLayout';
import CardRenderer, { type CardDesignConfig } from '@/components/products/CardRenderer';
import { getDynamicItemDataPublic, getPublicTemplates } from '@/lib/forms';
import { getRoleValue, getNormalizedVariants, resolveImageUrl, findFieldByRole } from '@/utils/dynamicRenderer';
import { useLocation, useParams } from 'wouter';

const DEFAULT_VIEW_DESIGN: CardDesignConfig = {
  templateId: 'immersive_flowbite',
  theme: 'light',
  styles: {
    primaryColor: '#ec4899',
    borderRadius: 'lg',
    shadow: 'lg',
    padding: 'md',
    fontFamily: 'plus-jakarta'
  }
};

const PublicProductView = () => {
  const { userId, productId } = useParams<{ userId: string; productId: string }>();
  const [, setLocation] = useLocation();
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Variant Selection State
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!productId) return;
      setIsLoading(true);
      try {
        const productRecord = await getDynamicItemDataPublic(productId, userId);
        if (productRecord && productRecord.id) {
          setProduct(productRecord);
          
          // Determine the template
          let activeTemplate = productRecord.FormTemplate || 
            (productRecord.template_schema ? {
              schema: productRecord.template_schema,
              design: productRecord.template_design,
              mapping: productRecord.template_design?.viewMapping || productRecord.template_design?.mapping || {},
              name: productRecord.template_name
            } : null);
          
          if (!activeTemplate) {
            const templates = await getPublicTemplates();
            activeTemplate = templates?.find((t: any) => 
               t.name.toLowerCase() === 'inventory' || t.resource_type === 'product'
            ) || templates?.[0];
          }

          if (activeTemplate) {
            const variants = getNormalizedVariants(productRecord, activeTemplate);
            if (variants.length > 0) {
              setSelectedVariant(variants[0]);
            }
          }
        } else {
          setError('Product not found or has been removed from the public catalog.');
        }
      } catch (err: any) {
        console.error('Fetch error:', err);
        setError(err.message || 'Failed to open the vault. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId, userId]);

  const template = product?.FormTemplate || (product?.template_schema ? {
    schema: product.template_schema,
    design: product.template_design,
    mapping: product.template_design?.viewMapping || product.template_design?.mapping || {},
    name: product.template_name
  } : null);

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
          <Button onClick={() => setLocation(`/public/${userId}`)} variant="outline">Back to Catalog</Button>
        </div>
      </PublicLayout>
    );
  }

  const pd = product.data || product || {};
  const name = getRoleValue('title', product, template);
  const category = getRoleValue('category', product, template);
  const description = getRoleValue('description', product, template);
  const image = getRoleValue('image', product, template);
  
  const shareImage = resolveImageUrl(image) || `https://picsum.photos/seed/${productId}/600/600`;
  const shareUrl = window.location.href;
  const shareTitle = `${name} | RateHonk`;
  const shareDescription = description && description !== '—' ? description : `Check out this exclusive ${category || 'product'} on RateHonk.`;

  return (
    <PublicLayout username={userId}>
      {/* <Helmet> */}
        {/* <title>{shareTitle}</title>
        <meta name="description" content={shareDescription} /> */}
        
        {/* Open Graph / Facebook */}
        {/* <meta property="og:type" content="product" />
        <meta property="og:url" content={shareUrl} />
        <meta property="og:title" content={shareTitle} />
        <meta property="og:description" content={shareDescription} />
        <meta property="og:image" content={shareImage} /> */}

        {/* Twitter */}
        {/* <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={shareUrl} />
        <meta property="twitter:title" content={shareTitle} />
        <meta property="twitter:description" content={shareDescription} />
        <meta property="twitter:image" content={shareImage} /> */}
      {/* </Helmet> */}

      <div className="mb-10">
        <button 
          onClick={() => setLocation(`/public/${userId}`)}
          className="flex items-center gap-2 text-sm font-bold text-text-muted hover:text-primary transition-all group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Collection
        </button>
      </div>

      <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-1000">
         <CardRenderer 
           design={template?.design || DEFAULT_VIEW_DESIGN} 
           data={pd} 
           template={template} 
           mode="view" 
           selectedVariant={selectedVariant}
         />
      </div>
    </PublicLayout>
  );
};

export default PublicProductView;
