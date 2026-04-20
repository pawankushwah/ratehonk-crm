import { useState, useEffect } from 'react';
import { 
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Settings
} from 'lucide-react';
import { getTemplates, uploadImage, submitFormData, updateDynamicData } from '@/lib/forms';
import { compressImage } from '@/utils/imageCompressor';
import Button from '@/components/products/Button';
import { DynamicForm } from '@/components/products/DynamicForm';
import { findFieldByRole } from '@/utils/dynamicRenderer';
import { BuilderItem } from '@/types/form';

interface InventoryFormProps {
  onCancel: () => void;
  onSave: (data: any) => void;
  initialData?: any;
  mode?: 'create' | 'edit' | 'view';
  templateName?: string;
  templateId?: string;
  template?: any;
}

const InventoryForm = ({ 
  onCancel, 
  onSave, 
  initialData = {}, 
  mode = 'create',
  templateName,
  templateId,
  template: propTemplate
}: InventoryFormProps) => {
  const [schema, setSchema] = useState<BuilderItem[] | null>(null);
  const [targetTemplateId, setTargetTemplateId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>(initialData?.data || {});
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);

  useEffect(() => {
    const fetchTargetTemplate = async () => {
      let activeTemplate = propTemplate;
      
      if (!activeTemplate) {
        try {
          const tId = templateId || templateName || 'inventory';
          activeTemplate = await getTemplate(tId);
        } catch (err) {
          console.error('Failed to fetch template:', err);
          setError('Failed to load the form template.');
          setIsLoading(false);
          return;
        }
      }

      if (activeTemplate) {
        setSchema(activeTemplate.schema);
        setTargetTemplateId(activeTemplate.id);
        
        // If we are editing, merge specialized fields (name, sku, category, price)
        // back into the formData blob so they show up in the form fields.
        if (mode === 'edit' && initialData) {
          const mergedData = { ...(initialData.data || {}) };
          
          // Use the helper to find matching field IDs for core roles
          const nameId = findFieldByRole('title', activeTemplate);
          const skuId = findFieldByRole('sku', activeTemplate);
          const categoryId = findFieldByRole('category', activeTemplate);
          const priceId = findFieldByRole('price', activeTemplate);
          
          if (nameId && initialData.name) mergedData[nameId] = initialData.name;
          if (skuId && initialData.sku) mergedData[skuId] = initialData.sku;
          if (categoryId && initialData.category) mergedData[categoryId] = initialData.category;
          if (priceId && initialData.price) mergedData[priceId] = initialData.price;
          
          setFormData(mergedData);
        }
      } else {
        setError(`${templateName || 'Inventory'} form template not found.`);
      }
      setIsLoading(false);
    };

    fetchTargetTemplate();
  }, [templateId, templateName, propTemplate, initialData, mode]);

  const handleImageUpload = async (file: File, originalFile?: File) => {
    try {
      const compressedBlob = await compressImage(file, 1024, 1024, 0.7);
      
      // Also compress original if it's too large, or just use as is
      let originalBase64: string | undefined = undefined;
      if (originalFile) {
        const compressedOriginal = await compressImage(originalFile, 2048, 2048, 0.8);
        originalBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(compressedOriginal);
        });
      }

      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          try {
            const res = await uploadImage(base64, file.name, file.type, originalBase64);
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
      if (mode === 'edit' && initialData && initialData.id) {
        await updateDynamicData(initialData.id, submissionData);
      } else {
        const resourceId = crypto.randomUUID(); 
        await submitFormData(resourceId, targetTemplateId, submissionData);
      }
      
      setIsSuccess(true);
      setTimeout(() => {
        onSave(submissionData);
      }, 1500);
    } catch (err: any) {
      console.error('Submission failed:', err);
      setSaveError(err.response?.data?.message || 'Failed to save. Please check your inputs.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (error || !schema) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
          <AlertCircle size={32} />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-text-main">Template Error</h3>
          <p className="text-text-muted max-w-xs">{error || 'Unknown error occurred'}</p>
        </div>
        <Button variant="outline" onClick={onCancel} className="mt-4">Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
            <Settings size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary opacity-70">Administrator Access</p>
            <p className="text-xs font-bold text-text-main">Need to modify this form's structure?</p>
          </div>
        </div>
        <button 
          onClick={() => window.location.href = `/forms/builder?id=${targetTemplateId}`}
          className="px-4 py-2 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          Edit Template
        </button>
      </div>

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
        onChange={setFormData}
        onImageUpload={handleImageUpload}
        initialData={formData}
        onValidationChange={(valid) => setIsValid(valid)}
        forceShowErrors={hasAttemptedSave}
      />

      <div className="pt-8 border-t border-slate-200 flex gap-4 mb-5">
        {(() => {
          if (mode === 'view') {
            return <Button variant="outline" className="flex-1" onClick={onCancel}>Close View</Button>;
          }
          
          let buttonLabel = '';
          if (isSuccess) {
            buttonLabel = 'Saved!';
          } else if (mode === 'edit') {
            buttonLabel = 'Update Details';
          } else {
            buttonLabel = 'Create Inventory';
          }

          return (
            <>
              <Button variant="outline" className="flex-1" onClick={onCancel} disabled={isSaving}>Cancel</Button>
              <Button 
                className={`flex-1 shadow-xl ${isSuccess ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'shadow-primary/20'}`} 
                onClick={handleFinalSave}
                loading={isSaving}
                disabled={isSaving || isSuccess}
                icon={isSuccess ? CheckCircle2 : undefined}
              >
                {buttonLabel}
              </Button>
            </>
          );
        })()}
      </div>
    </div>
  );
};

export default InventoryForm;
