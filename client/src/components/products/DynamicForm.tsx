import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus as PlusIcon,
  Trash2,
  Info,
  Calendar,
  Layers,
  ImageIcon,
  Palette,
  Loader2,
  Barcode,
  Pencil,
  Star, Check
} from 'lucide-react';
import ImageCropperModal from './ImageCropperModal';
import Button from './Button';
import AddableSelect from './AddableSelect';
import Input from './Input';
import CustomSelect from './CustomSelect';
import BundleItemsPicker from './BundleItemsPicker';
import { cn } from '@/utils/cn';
import { generateSku, addDropdownOption, checkSkuUniqueness } from '@/lib/forms';
import { getDropdown } from '@/lib/dropdowns';
import { BuilderItem } from './DynamicForm';
import { ConditionalLogic } from './DynamicForm';
export type { 
  BuilderItem, 
  FormField, 
  FormSection, 
  FormGroup, 
  LogicCondition, 
  ConditionalLogic 
} from '@/types/form';


const getNestedValue = (obj: any, path: string[]) => {
  return path.reduce((o, key) => (o && o[key] !== undefined ? o[key] : undefined), obj);
};

const setNestedValue = (obj: any, path: string[], value: any) => {
  const newObj = { ...obj };
  let current = newObj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    current[key] = { ...current[key] };
    current = current[key];
  }
  current[path[path.length - 1]] = value;
  return newObj;
};

const toTitleCase = (str: string) => {
  if (!str) return '';
  // Special case for acronyms if needed, otherwise standard Title Case
  return str
    .split(/[\s_]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const ColorPickerField = ({ 
  value, 
  onChange, 
  showErrors, 
  error, 
  label, 
  required 
}: any) => {
  const [internalValue, setInternalValue] = useState(value || '#000000');

  useEffect(() => {
    if (value !== internalValue) {
      setInternalValue(value || '#000000');
      onChange(value || '#000000');
    }
  }, [value]);

  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    setInternalValue(e.currentTarget.value);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-3">
      <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300 tracking-tight px-0.5">
        {label}
        {required && <span className="text-red-500 ml-1 font-bold">*</span>}
      </label>
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Input 
            placeholder="#000000" 
            value={internalValue}
            onChange={(e: any) => {
              setInternalValue(e.target.value);
              onChange(e.target.value);
            }}
            inputClassName={cn("pl-14 font-mono", showErrors && error && "border-red-500 bg-red-50/10")}
          />
          <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <input 
              type="color" 
              value={internalValue}
              onInput={handleInput}
              onChange={handleChange}
              className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer scale-150"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const generateBarcodeValue = () => {
  const prefix = "890"; // Common prefix for some regions
  const random = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
  const last = Math.floor(Math.random() * 10);
  return `${prefix}${random}${last}`;
};

const normalizeInitialData = (data: Record<string, any>, schema: BuilderItem[]) => {
  const normalizedData = { ...data };
  const instanceMap: Record<string, string[]> = {};

  const processItems = (items: BuilderItem[], currentData: any) => {
    if (!items || !currentData) return;
    
    items.forEach(item => {
      if (item.kind === 'section') {
        const value = currentData[item.id];
        if (item.isRepeatable && Array.isArray(value)) {
          const ids: string[] = [];
          const newSectionObj: Record<string, any> = {};
          
          value.forEach((val, idx) => {
            // Generate a unique sequential ID for each existing item
            const id = `item_${idx}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
            ids.push(id);
            newSectionObj[id] = { ...val };
            // Recursively normalize children of this instance
            processItems(item.items, newSectionObj[id]);
          });

          currentData[item.id] = newSectionObj;
          instanceMap[item.id] = ids;
        } else if (item.isRepeatable && value && typeof value === 'object') {
           // Already normalized or in object format
           instanceMap[item.id] = Object.keys(value);
           Object.values(value).forEach(v => processItems(item.items, v));
        } else {
          // Non-repeatable section or missing data, just traverse
          processItems(item.items, currentData);
        }
      } else if (item.kind === 'group') {
        processItems(item.fields, currentData);
      } else if (item.kind === 'field' && (item.type === 'select' || item.type === 'addable-select')) {
          // Ensure null/undefined doesn't break select components
          if (currentData[item.id] === null || currentData[item.id] === undefined) {
             currentData[item.id] = '';
          }
      }
    });
  };

  processItems(schema, normalizedData);
  return { normalizedData, instanceMap };
};

interface DynamicFormProps {
  schema: BuilderItem[];
  initialData?: Record<string, any>;
  onChange?: (data: Record<string, any>) => void;
  onImageUpload?: (file: File, originalFile?: File) => Promise<string>;
  onValidationChange?: (isValid: boolean, errors: Record<string, string>) => void;
  forceShowErrors?: boolean;
  onPlusClick?: (fieldId: string, label: string) => void;
  availableDropdowns?: { id: string, name: string, options: string[] }[];
}

const SECTION_ICONS: Record<string, any> = {
  'general information': Info,
  'variants': Layers,
  'inventory details': Calendar,
  'images': ImageIcon,
  'pricing': Palette
};

const GRID_COLS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  7: 'grid-cols-7',
  8: 'grid-cols-8',
  9: 'grid-cols-9',
  10: 'grid-cols-10',
  11: 'grid-cols-11',
  12: 'grid-cols-12'
};

const COL_SPAN: Record<number | string, string> = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  5: 'col-span-5',
  6: 'col-span-6',
  7: 'col-span-7',
  8: 'col-span-8',
  9: 'col-span-9',
  10: 'col-span-10',
  11: 'col-span-11',
  12: 'col-span-12',
  'full': 'col-span-full'
};

export const DynamicForm: React.FC<DynamicFormProps> = ({ 
  schema, 
  initialData = {}, 
  onChange,
  onImageUpload,
  onValidationChange,
  forceShowErrors = false,
  onPlusClick,
  availableDropdowns = []
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [instances, setInstances] = useState<Record<string, string[]>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const initializedRef = useRef(false);

  // Initialize and Normalize data only ONCE when data is first provided
  useEffect(() => {
    if (!initializedRef.current && initialData && Object.keys(initialData).length > 0) {
      const { normalizedData, instanceMap } = normalizeInitialData(initialData, schema);
      setFormData(normalizedData);
      setInstances(instanceMap);
      initializedRef.current = true;
    }
  }, [initialData, schema]);

  const [generatingSku, setGeneratingSku] = useState<Record<string, boolean>>({});
  const [uploadingImages, setUploadingImages] = useState<Record<string, boolean | 'fetching'>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [customOptions, setCustomOptions] = useState<Record<string, string[]>>({});
  const [dropdownOptions, setDropdownOptions] = useState<Record<string, string[]>>({});
  const [skuErrors, setSkuErrors] = useState<Record<string, string>>({});
  const [checkingSkus, setCheckingSkus] = useState<Record<string, boolean>>({});
  const [croppingState, setCroppingState] = useState<{
    isOpen: boolean;
    files: File[];
    fieldId: string;
    path: string[];
    allowMultiple: boolean;
    aspectRatio?: string;
    editingImageId?: string;
  }>({
    isOpen: false,
    files: [],
    fieldId: '',
    path: [],
    allowMultiple: true,
    aspectRatio: '1:1',
    editingImageId: undefined
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  useEffect(() => {
    const fetchAllDropdowns = async () => {
      const ids = new Set<string>();
      const traverse = (items: BuilderItem[]) => {
        items.forEach(item => {
          if ('kind' in item) {
            if (item.kind === 'field' && item.dropdownId) {
              ids.add(item.dropdownId);
            } else if (item.kind === 'group') {
              traverse(item.fields);
            } else if (item.kind === 'section') {
              traverse(item.items);
            }
          }
        });
      };
      traverse(schema);

      for (const id of Array.from(ids)) {
        try {
          // Attempt to fetch from the real API
          const dd = await getDropdown(id);
          if (dd) {
            const opts = dd.options.map(o => typeof o === 'string' ? o : o.label);
            setDropdownOptions(prev => ({ ...prev, [id]: opts }));
          }
        } catch (err) {
          console.error(`Failed to fetch dropdown ${id}`, err);
        }
      }
    };
    fetchAllDropdowns();
  }, [schema]);

  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (forceShowErrors) {
      setShowErrors(true);
    }
  }, [forceShowErrors]);

  useEffect(() => {
    if (onChange) {
      onChange(formData);
    }
    // Trigger validation update on data change or section changes
    validateForm();
  }, [formData, onChange, instances]);

  const validateField = (field: any, value: any): string => {
    if (field.kind !== 'field') return '';
    
    const props = field.properties || {};
    
    // Required check
    if (props.required) {
      const isEmpty = value === undefined || value === null || 
        (typeof value === 'string' && value.trim() === '') ||
        (Array.isArray(value) && value.length === 0);
      
      if (isEmpty) return `${toTitleCase(field.label)} is required`;
    }

    // Number checks
    if (field.type === 'number' && value !== undefined && value !== '') {
      const numVal = Number(value);
      if (props.min !== undefined && numVal < props.min) return `Minimum value is ${props.min}`;
      if (props.max !== undefined && numVal > props.max) return `Maximum value is ${props.max}`;
    }

    return '';
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    const traverse = (items: BuilderItem[], path: string[] = []) => {
      items.forEach(item => {
        if (item.kind === 'field') {
          if (isVisible(item.logic, path)) {
            const val = getNestedValue(formData, [...path, item.id]) ?? formData[item.id];
            const error = validateField(item, val);
            if (error) {
              newErrors[[...path, item.id].join('.')] = error;
              isValid = false;
            }
          }
        } else if (item.kind === 'group') {
          if (isVisible(item.logic, path)) {
            traverse(item.fields, path);
          }
        } else if (item.kind === 'section') {
          if (isVisible(item.logic, path)) {
            const sectionInstances = item.isRepeatable ? (instances[item.id] || []) : ['static'];
            sectionInstances.forEach(instanceId => {
              const subPath = item.isRepeatable ? [...path, item.id, instanceId] : path;
              traverse(item.items, subPath);
            });
          }
        }
      });
    };

    traverse(schema);
    setErrors(newErrors);
    
    // Form is valid only if both standard errors and SKU uniqueness errors are empty
    const hasSkuErrors = Object.values(skuErrors).some(err => !!err);
    if (onValidationChange) {
      onValidationChange(isValid && !hasSkuErrors, { ...newErrors, ...skuErrors });
    }
  };

  // SKU Auto-generation logic
  useEffect(() => {
    const path: string[] = [];
    const skuFields: any[] = [];
    const findSkuFields = (items: BuilderItem[]) => {
      items.forEach(it => {
        if (it.kind === 'field' && it.type === 'sku') {
          skuFields.push(it);
        } else if (it.kind === 'section') {
          findSkuFields((it as any).items || (it as any).fields || []);
        } else if (it.kind === 'group') {
          findSkuFields((it as any).fields || (it as any).items || []);
        }
      });
    };
    findSkuFields(schema);

    skuFields.forEach(async (field) => {
      // Use dynamic check to see current value from state if needed
      // but for now we check against the initial check
      const currentValue = getNestedValue(formData, [...path, field.id]) ?? formData[field.id];
      const isEmpty = !currentValue || String(currentValue).trim() === '' || String(currentValue).includes('XXXXX');
      
      const scopedGeneratingKey = field.id + path.join('_');
      if (isEmpty && !generatingSku[scopedGeneratingKey]) {
        console.log(`Generating SKU for ${field.id} with prefix ${field.properties?.prefix}`);
        setGeneratingSku(prev => ({ ...prev, [scopedGeneratingKey]: true }));
        try {
          const sku = await generateSku(field.properties?.prefix || 'PROD');
          console.log(`Generated SKU: ${sku} for ${field.id}`);
          updateField(field.id, sku, path);
        } catch (err) {
          console.error('Failed to generate SKU', err);
        } finally {
          setGeneratingSku(prev => ({ ...prev, [scopedGeneratingKey]: false }));
        }
      }
    });
  }, [schema]); // Only runs when schema changes or on mount

  // SKU Uniqueness Check logic (Async)
  useEffect(() => {
    const timer = setTimeout(async () => {
      const skuFields: { id: string, value: string, path: string[] }[] = [];
      const findSkuFields = (items: BuilderItem[], path: string[] = []) => {
        items.forEach(it => {
          if (it.kind === 'field' && it.type === 'sku') {
            const val = getNestedValue(formData, [...path, it.id]) ?? formData[it.id];
            if (val && !String(val).includes('XXXXX')) {
              skuFields.push({ id: it.id, value: String(val), path });
            }
          } else if (it.kind === 'section') {
            const sectionInstances = it.isRepeatable ? (instances[it.id] || []) : ['static'];
            sectionInstances.forEach(instanceId => {
               findSkuFields(it.items, it.isRepeatable ? [...path, it.id, instanceId] : path);
            });
          } else if (it.kind === 'group') {
            findSkuFields(it.fields, path);
          }
        });
      };
      findSkuFields(schema);

      for (const field of skuFields) {
        const errorKey = [...field.path, field.id].join('.');
        // Don't re-check if it hasn't changed or is currently generating
        if (checkingSkus[errorKey]) continue;

        setCheckingSkus(prev => ({ ...prev, [errorKey]: true }));
        try {
          const isUnique = await checkSkuUniqueness(field.value);
          setSkuErrors(prev => ({
            ...prev,
            [errorKey]: isUnique ? '' : 'This SKU is already in use'
          }));
        } catch (err) {
          console.error('SKU check failed', err);
        } finally {
          setCheckingSkus(prev => ({ ...prev, [errorKey]: false }));
        }
      }
    }, 800); // 800ms debounce

    return () => clearTimeout(timer);
  }, [formData, schema, instances]);

  const isVisible = (logic: ConditionalLogic | undefined, path: string[] = []) => {
    if (!logic || logic.conditions.length === 0) return true;
    const results = logic.conditions.map((cond: any) => {
      // Use scoped lookup for conditions first, fall back to global
      const scopedPath = [...path, cond.fieldId];
      let val = getNestedValue(formData, scopedPath);
      if (val === undefined) {
        val = formData[cond.fieldId];
      }
      
      const condVal = cond.value;
      const sVal = String(val || '').toLowerCase();
      const sCondVal = String(condVal || '').toLowerCase();

      switch (cond.operator) {
        case 'equals': return sVal === sCondVal;
        case 'not_equals': return sVal !== sCondVal;
        case 'greater_than': return Number(val) > Number(condVal);
        case 'less_than': return Number(val) < Number(condVal);
        case 'contains': return sVal.includes(sCondVal);
        case 'starts_with': return sVal.startsWith(sCondVal);
        case 'ends_with': return sVal.endsWith(sCondVal);
        default: return true;
      }
    });
    return logic.type === 'AND' ? results.every((r: any) => r) : results.some((r: any) => r);
  };

  const handleEditImage = async (fieldId: string, uuid: string, aspectRatio: string, path: string[]) => {
    try {
      setUploadingImages(prev => ({ ...prev, [uuid]: 'fetching' }));
      const response = await fetch(`${API_URL}/api/images/${uuid}?original=true`);
      if (!response.ok) throw new Error('Failed to fetch original image');
      
      const blob = await response.blob();
      const file = new File([blob], `original_${uuid}.jpg`, { type: blob.type });
      
      setCroppingState({
        isOpen: true,
        files: [file],
        fieldId,
        path,
        allowMultiple: false,
        aspectRatio,
        editingImageId: uuid
      });
    } catch (err) {
      console.error('Edit Image failed:', err);
    } finally {
      setUploadingImages(prev => ({ ...prev, [uuid]: false }));
    }
  };

  const updateField = (id: string, value: any, path: string[] = []) => {
    if (path.length > 0) {
      setFormData(prev => setNestedValue(prev, [...path, id], value));
    } else {
      setFormData(prev => ({ ...prev, [id]: value }));
    }
  };
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const setPrimaryImage = (fieldId: string, uuid: string, path: string[]) => {
    const fullPath = [...path, fieldId];
    const current = getNestedValue(formData, fullPath) || [];
    
    // PNG Check logic
    // In this simplified version, we'll try to find the extension if possible.
    // If it's a UUID, we can't be 100% sure without API, but let's assume valid for now or check filenames.
    // However, the user said "check for the PNG image only for primary".
    const image = current.find((img: any) => (typeof img === 'string' ? img : (img.uuid || img.id)) === uuid);
    const fileName = typeof image === 'object' ? (image.name || image.filename || '') : '';
    const isPng = fileName.toLowerCase().endsWith('.png') || uuid.toLowerCase().includes('png'); // Naive check

    if (!isPng && fileName !== '') {
       setFormErrors(prev => ({ ...prev, [fieldId]: 'Only PNG images can be set as primary' }));
       setTimeout(() => setFormErrors(prev => ({ ...prev, [fieldId]: '' })), 3000);
       return;
    }

    const newVal = [
      image,
      ...current.filter((img: any) => (typeof img === 'string' ? img : (img.uuid || img.id)) !== uuid)
    ];
    updateField(fieldId, newVal, path);
  };

  const toggleImage = (fieldId: string, uuid: string, allowMultiple = true, path: string[] = []) => {
    const fullPath = [...path, fieldId];
    const current = getNestedValue(formData, fullPath) || [];
    const exists = current.some((img: any) => (typeof img === 'string' ? img : (img.uuid || img.id)) === uuid);
    
    if (exists) {
      const newVal = current.filter((img: any) => (typeof img === 'string' ? img : (img.uuid || img.id)) !== uuid);
      updateField(fieldId, newVal, path);
    } else {
      const newVal = allowMultiple ? [...current, uuid] : [uuid];
      updateField(fieldId, newVal, path);
    }
  };

  const renderItem = (itemProps: BuilderItem, isNested = false, path: string[] = []) => {
    const it: any = { ...itemProps };
    if (!it.kind) {
      if (it.items || it.fields) {
        if (it.name) it.kind = 'section';
        else it.kind = 'group';
      } else {
        it.kind = 'field';
      }
    }

    if (it.kind === 'section') {
      if (!isVisible(it.logic)) return null;
      const sectionInstances = it.isRepeatable 
        ? (instances[it.id] || ['initial']) 
        : ['static'];

      const SectionIcon = SECTION_ICONS[it.name.toLowerCase()] || Info;
      const gridColsClass = it.layout?.gridCols ? GRID_COLS[it.layout.gridCols] : 'grid-cols-1';

      return (
        <div key={it.id} className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                <SectionIcon size={22} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight font-heading">{toTitleCase(it.name)}</h2>
            </div>
            {it.isRepeatable && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setInstances(prev => ({
                  ...prev,
                  [it.id]: [Date.now().toString(), ...(prev[it.id] || ['initial'])]
                }))}
                icon={PlusIcon}
                className="bg-primary/5 border-primary/20 text-primary hover:bg-primary/10 transition-all font-bold"
              >
                Add {toTitleCase(it.name === 'Variants' ? 'Variant' : 'Entry')}
              </Button>
            )}
          </div>
          <div className="space-y-4">
            {sectionInstances.map((instanceId, idx) => {
              const content = (
                <div className={`grid ${gridColsClass} gap-6`}>
                  {(it.items || (it as any).fields || []).map((subItem: any) => renderItem(subItem, true, it.isRepeatable ? [...path, it.id, instanceId] : path))}
                </div>
              );

              if (!it.isRepeatable) return <div key={instanceId}>{content}</div>;

              return (
                <div key={instanceId} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative group hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] font-bold tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                      {toTitleCase(it.name === 'Variants' ? 'Variant' : 'Entry')} #{sectionInstances.length - idx}
                    </span>
                    {sectionInstances.length > 1 && (
                      <button 
                        onClick={() => setInstances(prev => ({
                          ...prev,
                          [it.id]: prev[it.id].filter(id => id !== instanceId)
                        }))}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (it.kind === 'group') {
      if (!isVisible(it.logic, path)) return null;
      const gridColsClass = it.layout?.gridCols ? GRID_COLS[it.layout.gridCols] : 'grid-cols-1 md:grid-cols-2';
      const colSpanClass = it.layout?.colSpan ? COL_SPAN[it.layout.colSpan] : '';

      return (
        <div key={it.id} className={cn(colSpanClass, "grid gap-6 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 relative", gridColsClass)}>
           <div className="absolute -top-2.5 left-6 px-2 bg-slate-50 dark:bg-slate-900 text-[10px] font-bold tracking-tight text-slate-400">
             {toTitleCase(it.name || 'Grouped Fields')}
           </div>
          {((it as any).fields || (it as any).items || []).map((f: any) => renderItem(f, true, path))}
        </div>
      );
    }

    if (it.kind === 'field') {
      if (!isVisible(it.logic, path)) return null;
      const colSpanClass = it.layout?.colSpan ? COL_SPAN[it.layout.colSpan] : '';
      const errorKey = [...path, it.id].join('.');
      const error = errors[errorKey];
      const fieldValue = getNestedValue(formData, [...path, it.id]) ?? formData[it.id];

      return (
        <div key={it.id} className={`${colSpanClass} relative ${isNested ? "focus-within:z-50" : "w-full focus-within:z-50"}`}>
          <div className="transition-all duration-300">
            {it.type === 'image' ? (
              <div className="space-y-3">
                <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300 tracking-tight px-0.5 flex justify-between items-end">
                  <span>
                    {toTitleCase(it.label)}
                    {it.properties?.required && <span className="text-red-500 ml-1 font-bold">*</span>}
                  </span>
                  {it.properties?.aspectRatio && it.properties.aspectRatio !== 'Free' && (
                    <span className="text-[9px] font-black text-primary/60 bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10 lowercase">
                      {it.properties.aspectRatio} ratio
                    </span>
                  )}
                </label>
                <div className={cn(
                  "flex flex-wrap gap-4 p-6 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 border-dashed transition-all",
                  showErrors && error ? "border-red-500 bg-red-50/10" : "hover:border-slate-400 dark:hover:border-slate-600"
                )}>
                  {((fieldValue as any[]) || []).map((item, idx) => {
                    if (!item) return null;
                    const isString = typeof item === 'string';
                    const uuid = isString ? item : (item.uuid || item.id || `img_${idx}`);
                    const isUploading = uploadingImages[uuid];
                    const previewUrl = previews[uuid];
                    const finalUrl = previewUrl || (item.url ? item.url : `${API_URL}/api/images/${uuid}`);
                    // const error = formErrors[it.id];
                    
                    return (
                      <div key={uuid} className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 group/image shadow-sm bg-slate-100 dark:bg-slate-900">
                        <img 
                          src={finalUrl} 
                          alt="preview" 
                          className={cn(
                            "w-full h-full object-cover transition-all duration-500",
                            isUploading ? "opacity-40 scale-95 blur-[1px] animate-pulse" : "group-hover/image:scale-110",
                            idx === 0 && "ring-2 ring-emerald-500 ring-offset-2"
                          )} 
                          onError={(e) => {
                            if (!previewUrl) {
                               (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=IMG';
                            }
                          }}
                        />
                        {idx === 0 && (
                          <div className="absolute top-2 left-2 bg-emerald-500 text-white p-1 rounded-md shadow-lg z-10">
                            <Star size={10} fill="currentColor" />
                          </div>
                        )}
                        {isUploading && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60">
                            <Loader2 className="animate-spin text-white mb-2" size={20} />
                            <span className="text-[8px] font-bold text-white tracking-wider text-center">
                              {isUploading === 'fetching' ? 'Loading' : 'Uploading'}
                            </span>
                          </div>
                        )}
                        {!isUploading && (
                          <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover/image:opacity-100 transition-all translate-y-1 group-hover/image:translate-y-0">
                            {idx !== 0 && (
                              <button 
                                onClick={() => setPrimaryImage(it.id, uuid, path)}
                                className="p-1.5 bg-emerald-500 text-white rounded-lg shadow-lg hover:bg-emerald-600 transition-all"
                                title="Set as Primary"
                              >
                                <Star size={12} />
                              </button>
                            )}
                            <button 
                              onClick={() => handleEditImage(it.id, uuid, it.properties?.aspectRatio || '1:1', path)}
                              className="p-1.5 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 transition-all"
                              title="Edit Crop"
                            >
                              <Pencil size={12} />
                            </button>
                            <button 
                              onClick={() => toggleImage(it.id, uuid, it.properties?.allowMultiple !== false, path)}
                              className="p-1.5 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition-all"
                              title="Remove Image"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <label className={cn(
                    "w-24 h-24 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 transition-all cursor-pointer bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 group/add",
                    Object.values(uploadingImages).some(Boolean) && "opacity-50 pointer-events-none"
                  )}>
                    <input 
                      type="file" 
                      multiple={it.properties?.allowMultiple !== false} 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (!files || files.length === 0) return;
                        
                        setCroppingState({
                          isOpen: true,
                          files: Array.from(files),
                          fieldId: it.id,
                          path: path,
                          allowMultiple: it.properties?.allowMultiple !== false,
                          aspectRatio: it.properties?.aspectRatio || '1:1'
                        });
                        
                        // Reset input so the same file can be selected again if needed
                        e.target.value = '';
                      }}
                    />
                    <PlusIcon size={24} className="mb-1 text-slate-400 group-hover/add:text-primary transition-colors" />
                    <span className="text-[9px] font-bold tracking-wider">Add Image</span>
                  </label>
                </div>
              </div>
            ) : it.type === 'color' ? (
              <ColorPickerField 
                id={it.id}
                label={toTitleCase(it.label)}
                value={fieldValue}
                showErrors={showErrors}
                error={error}
                required={it.properties?.required}
                onChange={(val: string) => updateField(it.id, val, path)}
              />
            ) : (it.type === 'sku' || it.label.toLowerCase().includes('sku')) ? (
              <div className="relative group/sku">
                <Input 
                  label={toTitleCase(it.label)} 
                  disabled={!it.properties?.editable && !generatingSku[it.id + path.join('_')]} 
                  value={generatingSku[it.id + path.join('_')] ? 'GENERATING...' : (fieldValue)} 
                  onChange={(e: any) => updateField(it.id, e.target.value, path)}
                  inputClassName={cn(
                    "font-mono tracking-wider bg-slate-50 dark:bg-slate-900/50 pr-24",
                    !it.properties?.editable && "opacity-70",
                    showErrors && (error || skuErrors[[...path, it.id].join('.')]) && "border-red-500 bg-red-50/10"
                  )} 
                  placeholder={it.properties?.placeholder || "Enter SKU..."}
                  error={showErrors ? skuErrors[[...path, it.id].join('.')] : undefined}
                />
                <button
                  type="button"
                  className="absolute right-4 top-[32px] h-8 px-3 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all disabled:opacity-30 z-10"
                  onClick={async () => {
                    const scopedKey = it.id + path.join('_');
                    if (generatingSku[scopedKey]) return;
                    setGeneratingSku(prev => ({ ...prev, [scopedKey]: true }));
                    try {
                      const sku = await generateSku(it.properties?.prefix || '');
                      updateField(it.id, sku, path);
                      // Clear SKU error when generating new one
                      setSkuErrors(prev => ({ ...prev, [[...path, it.id].join('.')]: '' }));
                    } catch (err) { 
                      console.error('SKU fetch failed', err);
                    } finally { 
                      setGeneratingSku(prev => ({ ...prev, [scopedKey]: false })); 
                    }
                  }}
                  disabled={generatingSku[it.id + path.join('_')]}
                >
                  {checkingSkus[[...path, it.id].join('.')] ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : fieldValue ? 'REGEN' : 'GENERATE'}
                </button>
              </div>
            ) : it.type === 'barcode' ? (
              <div className="relative group/barcode">
                <Input 
                  label={toTitleCase(it.label)} 
                  value={fieldValue || ''} 
                  onChange={(e: any) => updateField(it.id, e.target.value, path)}
                  inputClassName={cn(
                    "font-mono tracking-[0.2em] bg-slate-50 dark:bg-slate-900/50 pr-24",
                    showErrors && error && "border-red-500 bg-red-50/10"
                  )} 
                  placeholder={it.properties?.placeholder || "Enter Barcode..."}
                  icon={Barcode}
                />
                <button
                  type="button"
                  className="absolute right-4 top-[32px] h-8 px-3 rounded-lg bg-secondary/10 text-secondary text-[10px] font-black uppercase tracking-widest hover:bg-secondary/20 transition-all z-10"
                  onClick={() => {
                    const code = generateBarcodeValue();
                    updateField(it.id, code, path);
                  }}
                >
                  {fieldValue ? 'REGEN' : 'GEN'}
                </button>
              </div>
            ) : it.type === 'select' || it.type === 'addable-select' ? (
              <div className="space-y-4">
                <div className="flex-1">
                  <AddableSelect
                    label={toTitleCase(it.label)}
                    options={[
                      ...(it.dropdownId && dropdownOptions[it.dropdownId] ? dropdownOptions[it.dropdownId] : (it.options || [])), 
                      ...(customOptions[it.id] || [])
                    ].map((opt: any) => {
                      if (typeof opt === 'string') return { label: opt, value: opt };
                      if (typeof opt === 'object' && opt !== null) {
                        return { label: opt.label || opt.value || 'Unnamed Option', value: opt.value || opt.id || '' };
                      }
                      return { label: 'Invalid Option', value: '' };
                    })}
                    value={fieldValue || ''}
                    onChange={(val: string) => updateField(it.id, val, path)}
                    placeholder={it.properties?.placeholder || "Select option"}
                    onAdd={it.type === 'addable-select' ? async (val: string) => {
                      if (it.dropdownId) {
                        try { await addDropdownOption(it.dropdownId, val); } catch (err) { console.error(err); }
                      }
                      setCustomOptions(prev => ({ ...prev, [it.id]: [...(prev[it.id] || []), val] }));
                      updateField(it.id, val, path);
                    } : undefined}
                    addNewLabel={it.properties?.addButtonTitle || "Add New"}
                    required={it.properties?.required}
                    disabled={it.properties?.disabled}
                  />
                </div>
              </div>
            ) : it.type === 'checkbox' ? (
              <div className="space-y-3">
                {!it.properties?.hideLabel && (
                  <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300 tracking-tight px-0.5">
                    {toTitleCase(it.label)}
                    {it.properties?.required && <span className="text-red-500 ml-1 font-bold">*</span>}
                  </label>
                )}
                <div className="flex flex-wrap gap-6">
                  {(it.options || ['Option 1']).map((opt: string) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        onChange={(e) => {
                          const current = fieldValue || [];
                          const newVal = e.target.checked ? [...current, opt] : current.filter((o: string) => o !== opt);
                          updateField(it.id, newVal, path);
                        }}
                      />
                      <div className={cn(
                        "w-5 h-5 rounded border border-slate-200 dark:border-slate-800 transition-all flex items-center justify-center",
                        (fieldValue || []).includes(opt) ? "bg-primary border-primary" : "bg-white dark:bg-slate-950 group-hover:border-slate-400"
                      )}>
                         {(fieldValue || []).includes(opt) && <Check size={12} className="text-white" strokeWidth={4} />}
                      </div>
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : it.type === 'radio' ? (
              <div className="space-y-3">
                {!it.properties?.hideLabel && (
                  <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300 tracking-tight px-0.5">
                    {toTitleCase(it.label)}
                    {it.properties?.required && <span className="text-red-500 ml-1 font-bold">*</span>}
                  </label>
                )}
                <div className="flex flex-wrap gap-6">
                  {(it.options || ['Option 1']).map((opt: string) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" name={it.id + path.join('_')} className="hidden" onChange={() => updateField(it.id, opt, path)} />
                      <div className={cn(
                        "w-5 h-5 rounded-full border border-slate-200 dark:border-slate-800 transition-all flex items-center justify-center",
                        fieldValue === opt ? "bg-primary border-primary" : "bg-white dark:bg-slate-950 group-hover:border-slate-400"
                      )}>
                        {fieldValue === opt && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : it.type === 'textarea' ? (
              <div className="space-y-3">
                 <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300 tracking-tight px-0.5">
                  {toTitleCase(it.label)}
                  {it.properties?.required && <span className="text-red-500 ml-1 font-bold">*</span>}
                </label>
                <textarea
                  value={fieldValue || ''}
                  onChange={(e) => updateField(it.id, e.target.value, path)}
                  placeholder={it.properties?.placeholder || `Enter ${it.label}...`}
                  required={it.properties?.required}
                  className={cn(
                    "w-full min-h-[120px] p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm ring-offset-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 shadow-sm hover:border-slate-400 dark:hover:border-slate-600",
                    showErrors && error && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                  )}
                />
              </div>
            ) : it.type === 'bundle-items' ? (
              <div className="space-y-4">
                <BundleItemsPicker 
                  label={toTitleCase(it.label)}
                  placeholder={it.properties?.placeholder}
                  value={fieldValue || []}
                  onChange={(val) => updateField(it.id, val, path)}
                  required={it.properties?.required}
                />
              </div>
            ) : it.type === 'key-value' ? (
              <div className="space-y-3">
                {!it.properties?.hideLabel && (
                  <div className="flex items-center justify-between group/label pr-1">
                    <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300 tracking-tight px-0.5">
                      {toTitleCase(it.label)}
                      {it.properties?.required && <span className="text-red-500 ml-1 font-bold">*</span>}
                    </label>
                    <div className="flex items-center gap-2">
                       {onPlusClick && it.properties?.showPlusIcon && (
                        <button 
                          type="button"
                          onClick={() => onPlusClick(it.id, it.label)}
                          className="p-1 text-slate-400 hover:text-primary transition-colors"
                        >
                          <PlusIcon size={14} />
                        </button>
                      )}
                      {it.properties?.allowMultiple !== false && (
                         <button 
                          type="button"
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10 transition-all text-[10px] font-black uppercase tracking-widest"
                          onClick={() => {
                            const current = Array.isArray(fieldValue) ? fieldValue : (fieldValue ? [fieldValue] : [{key: '', value: ''}]);
                            updateField(it.id, [...current, { key: '', value: '' }], path);
                          }}
                          title="Add Pair"
                        >
                          <PlusIcon size={12} /> Add Pair
                        </button>
                      )}
                    </div>
                  </div>
                )}
                <div className="space-y-4">
                  {(Array.isArray(fieldValue) ? fieldValue : [fieldValue || {key: '', value: ''}]).map((row, rIdx, arr) => (
                    <div key={rIdx} className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative group/kv">
                      <div className="space-y-1.5">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Key / Property</p>
                        {it.dropdownId ? (
                          <CustomSelect 
                            options={availableDropdowns.find(d => d.id === it.dropdownId)?.options.map(o => ({ label: o, value: o })) || []}
                            value={row.key || ''}
                            onChange={(val: string) => {
                              const newRows = [...arr];
                              newRows[rIdx] = { ...newRows[rIdx], key: val };
                              updateField(it.id, newRows, path);
                            }}
                            placeholder="Select Key"
                          />
                        ) : (
                          <Input 
                            value={row.key || ''}
                            onChange={(e: any) => {
                              const newRows = [...arr];
                              newRows[rIdx] = { ...newRows[rIdx], key: e.target.value };
                              updateField(it.id, newRows, path);
                            }}
                            placeholder="Enter Key"
                          />
                        )}
                      </div>
                      <div className="space-y-1.5 relative">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Value / Data</p>
                        <div className="flex gap-2 items-center">
                          <Input 
                            value={row.value || ''}
                            onChange={(e: any) => {
                              const newRows = [...arr];
                              newRows[rIdx] = { ...newRows[rIdx], value: e.target.value };
                              updateField(it.id, newRows, path);
                            }}
                            onKeyDown={(e: any) => {
                              if (e.key === 'Tab' && !e.shiftKey && rIdx === arr.length - 1 && it.properties?.allowMultiple !== false) {
                                updateField(it.id, [...arr, { key: '', value: '' }], path);
                              }
                            }}
                            placeholder={it.properties?.placeholder || "Enter Value"}
                          />
                          {it.properties?.allowMultiple !== false && arr.length > 1 && (
                            <button 
                              onClick={() => {
                                const newRows = arr.filter((_, i) => i !== rIdx);
                                updateField(it.id, newRows, path);
                              }}
                              className="shrink-0 w-11 h-11 flex items-center justify-center rounded-xl bg-red-500/5 border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover/kv:opacity-100"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                 <div className="flex items-center justify-between group/label pr-1">
                  <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300 tracking-tight px-0.5">
                    {toTitleCase(it.label)}
                    {it.properties?.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {onPlusClick && it.properties?.showPlusIcon && (
                    <button 
                      type="button"
                      onClick={() => onPlusClick(it.id, it.label)}
                      className="p-1 text-slate-400 hover:text-primary transition-colors"
                    >
                      <PlusIcon size={14} />
                    </button>
                  )}
                </div>
                <Input
                  type={it.type === 'number' ? 'number' : it.type === 'date' ? 'date' : 'text'}
                  value={fieldValue || ''}
                  onChange={(e: any) => updateField(it.id, e.target.value, path)}
                  placeholder={it.properties?.placeholder || `Enter ${it.label}...`}
                  min={it.properties?.min}
                  max={it.properties?.max}
                  required={it.properties?.required}
                />
              </div>
            )}
          </div>
          {(showErrors && error) || formErrors[it.id] ? (
            <p className="text-[10px] font-bold tracking-widest text-red-500 mt-2 ml-1 flex items-center gap-1.5 animate-in slide-in-from-top-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
              {error || formErrors[it.id]}
            </p>
          ) : null}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 pb-20">
      {schema.map(item => renderItem(item, false, []))}

      {/* 1:1 Image Cropper Modal */}
      <ImageCropperModal
        isOpen={croppingState.isOpen}
        files={croppingState.files}
        aspectRatio={croppingState.aspectRatio}
        onClose={() => setCroppingState(prev => ({ ...prev, isOpen: false, files: [] }))}
        onComplete={async (results) => {
          if (!onImageUpload) return;
          
          const fieldId = croppingState.fieldId;
          const path = croppingState.path;
          const allowMultiple = croppingState.allowMultiple;
          const editingImageId = croppingState.editingImageId;

          const newTempItems = results.map((res, i) => {
            const tempId = editingImageId || `temp_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 7)}`;
            return { 
              id: tempId, 
              url: URL.createObjectURL(res.cropped), 
              file: res.cropped,
              originalFile: res.original
            };
          });

          // Show immediate previews for the cropped items
          setPreviews(prev => {
            const next = { ...prev };
            newTempItems.forEach(item => { next[item.id] = item.url; });
            return next;
          });

          setUploadingImages(prev => {
            const next = { ...prev };
            newTempItems.forEach(item => { next[item.id] = true; });
            return next;
          });

          // Update form state with temp IDs (if not already there)
          if (!editingImageId) {
            setFormData(prev => {
              const fullPath = [...path, fieldId];
              const currentIds = getNestedValue(prev, fullPath) || [];
              const updated = allowMultiple 
                ? [...currentIds, ...newTempItems.map(i => i.id)] 
                : [newTempItems[0].id];
              return setNestedValue(prev, fullPath, updated);
            });
          }

          // Upload each cropped image with its original version
          newTempItems.forEach(async (item) => {
            let realUuid: string | null = null;
            try {
              realUuid = await onImageUpload(item.file, item.originalFile);
              const finalObj = { uuid: realUuid, url: item.url };
              
              setPreviews(prev => ({ ...prev, [realUuid as string]: item.url }));
              
              setFormData(prev => {
                const fullPath = [...path, fieldId];
                const currentData: any[] = getNestedValue(prev, fullPath) || [];
                const updated = currentData.map((fItem: any) => {
                  const fId = typeof fItem === 'string' ? fItem : (fItem.uuid || fItem.id);
                  const matchId = editingImageId || item.id;
                  return fId === matchId ? finalObj : fItem;
                });
                return setNestedValue(prev, fullPath, updated);
              });
            } catch (err) {
              console.error('Image upload failed:', err);
              // Clean up on failure if it's a new upload
              if (!editingImageId) {
                setFormData(prev => {
                  const fullPath = [...path, fieldId];
                  const currentData: any[] = getNestedValue(prev, fullPath) || [];
                  const updated = currentData.filter((fItem: any) => {
                    const fId = typeof fItem === 'string' ? fItem : (fItem.uuid || fItem.id);
                    return fId !== item.id;
                  });
                  return setNestedValue(prev, fullPath, updated);
                });
              }
            } finally {
              setUploadingImages(prev => ({ ...prev, [item.id]: false }));
              if (realUuid) setUploadingImages(prev => ({ ...prev, [realUuid as string]: false }));
            }
          });
        }}
      />
    </div>
  );
};
