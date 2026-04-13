import { useState, useEffect } from 'react';
import { 
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Settings
} from 'lucide-react';
import Button from './Button';
import { DynamicForm } from './DynamicForm';
import { type BuilderItem } from '@/types/form';
import { getTemplates, uploadImage, submitFormData, updateDynamicData } from '@/lib/forms';
import { compressImage } from '@/utils/imageCompressor';

interface NonInventoryFormProps {
  onCancel: () => void;
  onSave: (data: any) => void;
  initialData?: any;
  mode?: 'create' | 'edit' | 'view';
  templateId?: string;
  itemType?: ItemType;
}

type ItemType = 'non-inventory' | 'service' | 'bundle';

const ExceptInventoryForms = ({ 
  onCancel, 
  onSave, 
  initialData = {}, 
  mode = 'create',
  templateId,
  itemType: propItemType
}: NonInventoryFormProps) => {
  const [itemType] = useState<ItemType>(propItemType || (initialData?.data?.itemType as ItemType) || 'non-inventory');
  const [schema, setSchema] = useState<BuilderItem[] | null>(null);
  const [targetTemplateId, setTargetTemplateId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>(initialData?.data || {});
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);

  // Map itemType to formKey
  const getFormKey = (type: ItemType) => type;

  useEffect(() => {
    const fetchTargetTemplate = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getTemplates();
        const templates = response.data || [];
        
        const currentFormKey = getFormKey(itemType);
        
        let targetTemplate;
        if (templateId) {
          targetTemplate = templates.find((t: any) => t.id === templateId);
        } else {
          // Find by formKey or name
          targetTemplate = templates.find((t: any) => 
            (t.formKey && t.formKey.toLowerCase() === currentFormKey) ||
            t.name.toLowerCase() === currentFormKey.replace('-', ' ') ||
            t.name.toLowerCase() === currentFormKey
          );
        }

        if (targetTemplate) {
          setSchema(targetTemplate.schema);
          setTargetTemplateId(targetTemplate.id);
        } else {
          setError(`Template for "${itemType}" (key: ${currentFormKey}) not found. Please create one with this formKey in the Form Builder.`);
        }
      } catch (err) {
        console.error('Failed to fetch template:', err);
        setError('Failed to load the form template.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTargetTemplate();
  }, [itemType, templateId]);

  const handleImageUpload = async (file: File) => {
    try {
      const compressedBlob = await compressImage(file, 1024, 1024, 0.7);
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          try {
            const res = await uploadImage(base64, file.name, file.type);
            const resolvedUuid = res?.data?.id || res?.uuid || res?.data?.uuid || res?.id || `fallback_${Date.now()}`;
            resolve(resolvedUuid);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(compressedBlob);
      });
    } catch (err) {
      console.error('Image upload failed:', err);
      throw err;
    }
  };

  const formatDataForSubmission = (data: any, currentSchema: BuilderItem[]) => {
    const formatted: any = { ...data };
    
    currentSchema.forEach(item => {
      if (item.kind === 'section') {
        if (item.isRepeatable) {
          const sectionData = formatted[item.id];
          if (sectionData && typeof sectionData === 'object' && !Array.isArray(sectionData)) {
            formatted[item.id] = Object.values(sectionData).map(instance => 
              formatDataForSubmission(instance as any, item.items)
            );
          }
        } else {
          const subData = formatDataForSubmission(formatted, item.items);
          Object.assign(formatted, subData);
        }
      } else if (item.kind === 'group') {
        const subData = formatDataForSubmission(formatted, item.fields);
        Object.assign(formatted, subData);
      } else if (item.kind === 'field') {
        if (item.type === 'image' && Array.isArray(formatted[item.id])) {
          formatted[item.id] = formatted[item.id]
            .map((img: any) => (typeof img === 'string' ? img : (img.uuid || img.id)))
            .filter((id: any) => id && !id.toString().startsWith('temp_'));
        }
      }
    });

    return formatted;
  };

  const [isPriceManual, setIsPriceManual] = useState(false);
  const [prevAutoPrice, setPrevAutoPrice] = useState<number | null>(null);

  // Auto-calculate bundle price
  useEffect(() => {
    if (itemType !== 'bundle' || !schema) return;

    // Find the bundle items field and the price field
    const bundleField = schema.find(f => f.kind === 'field' && (f as any).type === 'bundle');
    const priceField = schema.find(f => f.kind === 'field' && ((f as any).role === 'price' || (f as any).label === 'Sales Price' || f.id === '1774593452328'));

    if (!bundleField || !priceField) return;

    const bundleItems = formData[bundleField.id] || [];
    if (!Array.isArray(bundleItems)) return;

    const total = bundleItems.reduce((sum: number, item: any) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
    
    // Only update if not manual or if prices are empty
    const currentPrice = formData[priceField.id];
    
    if (!isPriceManual || !currentPrice || currentPrice === prevAutoPrice?.toString()) {
      if (total.toString() !== currentPrice) {
        setFormData(prev => ({ ...prev, [priceField.id]: total.toString() }));
        setPrevAutoPrice(total);
      }
    }
  }, [formData, itemType, schema, isPriceManual, prevAutoPrice]);

  const handleFormChange = (newData: Record<string, any>) => {
    // Check if price was manually changed
    if (itemType === 'bundle' && schema) {
      const priceField = schema.find(f => f.kind === 'field' && ((f as any).role === 'price' || (f as any).label === 'Sales Price' || f.id === '1774593452328'));
      if (priceField && newData[priceField.id] !== formData[priceField.id]) {
        // If the NEW value is different from the auto-calculated one we were about to set, mark as manual
        if (newData[priceField.id] !== prevAutoPrice?.toString()) {
          setIsPriceManual(true);
        }
      }
    }
    setFormData(newData);
  };

  const handleFinalSave = async () => {
    if (!targetTemplateId || !schema) return;
    
    if (!isValid) {
      setHasAttemptedSave(true);
      setSaveError('Please correctly fill in all required fields.');
      return;
    }
    
    setIsSaving(true);
    setSaveError(null);
    try {
      const submissionData = formatDataForSubmission(formData, schema);
      // Include itemType for backend categorization if needed
      const finalPayload = { ...submissionData, itemType };
      
      if (mode === 'edit' && initialData && initialData.id) {
        await updateDynamicData(initialData.id, finalPayload);
      } else {
        const resourceId = crypto.randomUUID(); 
        await submitFormData(resourceId, targetTemplateId, finalPayload);
      }
      
      setIsSuccess(true);
      setTimeout(() => {
        onSave(finalPayload);
      }, 1500);
    } catch (err: any) {
      console.error('Submission failed:', err);
      setSaveError(err.response?.data?.message || 'Failed to save. Please check your inputs.');
    } finally {
      setIsSaving(false);
    }
  };

  const isViewMode = mode === 'view';

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Item Type Selector Removed */}

      {/* Admin Quick Access */}
      {!isViewMode && targetTemplateId && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
              <Settings size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary opacity-70">Administrator Access</p>
              <p className="text-xs font-bold text-text-main">Modify "{itemType}" form structure?</p>
            </div>
          </div>
          <button 
            onClick={() => window.location.href = `/dashboard/forms/builder?id=${targetTemplateId}`}
            className="px-4 py-2 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            Edit Template
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="relative">
            <Loader2 className="animate-spin text-primary" size={40} />
            <div className="absolute inset-0 animate-ping opacity-20 bg-primary rounded-full" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted animate-pulse">Fetching Schema...</p>
        </div>
      ) : error || !schema ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-6 text-center bg-red-500/5 rounded-3xl border border-red-500/10">
          <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shadow-lg shadow-red-500/5">
            <AlertCircle size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-text-main">Configuration Error</h3>
            <p className="text-text-muted text-sm max-w-xs mx-auto opacity-70">{error || 'Unknown error occurred'}</p>
          </div>
          <Button variant="outline" onClick={onCancel} className="h-12 px-8 border-red-500/20 text-red-500 hover:bg-red-500/5">Go Back</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {saveError && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 animate-in slide-in-from-top-2">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-500">Submission Error</p>
                <p className="text-xs text-red-400/80 mt-0.5">{saveError}</p>
              </div>
              <button onClick={() => setSaveError(null)} className="text-red-500/50 hover:text-red-500 transition-colors">
                <X size={16} />
              </button>
            </div>
          )}

          <DynamicForm 
            schema={schema} 
            onChange={handleFormChange}
            onImageUpload={handleImageUpload}
            initialData={formData}
            onValidationChange={(valid) => setIsValid(valid)}
            forceShowErrors={hasAttemptedSave}
          />

          <div className="pt-8 border-t border-slate-200 flex gap-4 mb-5">
            {isViewMode ? (
              <Button variant="outline" className="flex-1 h-14 rounded-2xl" onClick={onCancel}>Close View</Button>
            ) : (
              <>
                <Button variant="outline" className="flex-1 h-14 rounded-2xl" onClick={onCancel} disabled={isSaving}>Cancel</Button>
                <Button 
                  className={`flex-1 h-14 rounded-2xl shadow-xl ${isSuccess ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'shadow-primary/20'}`} 
                  onClick={handleFinalSave}
                  loading={isSaving}
                  disabled={isSaving || isSuccess}
                  icon={isSuccess ? CheckCircle2 : undefined}
                >
                  {isSuccess ? 'Success!' : mode === 'edit' ? 'Update Details' : `Create ${itemType === 'non-inventory' ? 'Product' : itemType === 'service' ? 'Service' : 'Bundle'}`}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExceptInventoryForms;
