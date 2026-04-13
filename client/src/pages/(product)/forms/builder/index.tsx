import React, { useState, useEffect, useRef } from 'react';
import {
  Eye,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  X,
  Plus,
  GripVertical,
  Trash2,
  Settings2,
  Layout,
  Info,
  Loader2,
  Check, Columns,
  CheckSquare,
  Layers,
  Package,
  LayoutGrid, Grid,
  PlusIcon,
  Gift,
  Brush
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useLocation } from 'wouter';
import Button from '@/components/products/Button';
import GlassCard from '@/components/products/GlassCard';
import Input from '@/components/products/Input';
import Drawer from '@/components/products/Drawer';
import CustomSelect from '@/components/products/CustomSelect';
import { useSnackbar } from '@/components/products/SnackbarContext';
import {
  getTemplate,
  createTemplate,
  updateTemplate,
  getFrontendForms,
  createFrontendForm,
  type FrontendForm,
  uploadImage
} from '@/lib/forms';
import { getDropdowns, type Dropdown, type DropdownOption } from '@/lib/dropdowns';
import { Layout as DashboardLayout } from '@/components/layout/layout';
import DesignTab from './DesignTab';
import DesignTab2 from './DesignTab2';
import { 
  type BuilderItem, 
  type FormField, 
  type FormSection, 
  type FormGroup, 
  type LogicCondition, 
  type ConditionalLogic 
} from '@/types/form';


// const GRID_COLS: Record<number, string> = {
//   1: 'grid-cols-1',
//   2: 'grid-cols-2',
//   3: 'grid-cols-3',
//   4: 'grid-cols-4',
//   5: 'grid-cols-5',
//   6: 'grid-cols-6',
//   7: 'grid-cols-7',
//   8: 'grid-cols-8',
//   9: 'grid-cols-9',
//   10: 'grid-cols-10',
//   11: 'grid-cols-11',
//   12: 'grid-cols-12'
// };

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
  12: 'col-span-12',
  'full': 'col-span-12'
};

const LayoutWidthSelector = ({ value, onChange }: { value: number | 'full', onChange: (val: number | 'full') => void }) => (
  <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-glass-border w-fit">
    {[3, 6, 9, 12].map((cols) => (
      <button
        key={cols}
        onClick={(e) => { e.stopPropagation(); onChange(cols); }}
        className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all ${
          (value === cols || (value === 'full' && cols === 12)) 
            ? 'bg-primary text-white shadow-lg shadow-primary/20' 
            : 'text-text-muted hover:text-text-main hover:bg-white/5'
        }`}
      >
        {cols === 3 ? '1/4' : cols === 6 ? '1/2' : cols === 9 ? '3/4' : 'Full'}
      </button>
    ))}
  </div>
);


const SidebarTreeItem = ({ 
  item, 
  depth = 0, 
  activeItemId,
  onSelect,
  onDelete,
  isExpanded,
  onToggleExpand,
  isOverlay = false
}: { 
  item: BuilderItem, 
  depth: number, 
  activeItemId: string | null,
  onSelect: (id: string) => void,
  onDelete?: (id: string) => void,
  isExpanded?: boolean,
  onToggleExpand?: (id: string) => void,
  isOverlay?: boolean
}) => {
  const sortable = useSortable({ id: item.id, disabled: isOverlay });
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = sortable;

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1, // Keep it visible but slightly dimmed/highlighted
    zIndex: isDragging ? 100 : 'auto',
  };

  const Icon = item.kind === 'section' ? Layout : item.kind === 'group' ? Layers : Package;
  const label = item.kind === 'section' ? item.name : item.kind === 'group' ? 'Untitled Group' : item.label;
  const isActive = activeItemId === item.id;
  // const hasChildren = (item.kind === 'section' && item.items.length > 0) || (item.kind === 'group' && item.fields.length > 0);

  return (
    <div ref={setNodeRef} style={style} className="select-none">
      <div 
        onClick={(e) => {
          e.stopPropagation();
          onSelect(item.id);
        }}
        className={`flex items-center gap-2 p-2 rounded-lg transition-all group/sideitem cursor-pointer border ${
          isDragging 
            ? 'bg-primary/20 border-primary/50 shadow-inner' // Styling for active drag
            : isActive 
              ? 'bg-white border-primary/30 text-primary shadow-sm ring-1 ring-primary/20' 
              : 'bg-white/5 border-glass-border hover:bg-white/10 text-text-muted hover:text-text-main'
        }`}
        style={{ marginLeft: `${depth * 12}px` }}
      >
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-text-muted hover:text-primary transition-colors">
          <GripVertical size={20} />
        </div>
        
        {(item.kind === 'section' || item.kind === 'group') && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand?.(item.id);
            }}
            className="p-0.5 hover:bg-white/10 rounded text-text-muted hover:text-text-main transition-colors"
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        )}

        <Icon size={12} className={isActive ? 'text-primary' : 'text-text-muted group-hover/sideitem:text-primary transition-colors'} />
        <span className={`text-[12px] font-bold truncate flex-1 ${isActive ? 'text-text-main' : ''}`}>
          {label || (item.kind === 'field' ? 'Unnamed Field' : 'Untitled')}
        </span>

        {onDelete && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            className={`p-1.5 hover:bg-red-500/10 text-text-muted hover:text-red-500 rounded-md transition-all ${
              isActive ? 'opacity-100' : 'opacity-0 group-hover/sideitem:opacity-100'
            }`}
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {isExpanded && !isOverlay && (
        <>
          {item.kind === 'section' && item.items.length > 0 && (
            <SortableContext items={item.items.map(i => i.id)} strategy={verticalListSortingStrategy}>
              <div className="mt-0.5 space-y-0.5">
                {item.items.map((sub) => (
                  <SidebarTreeItem 
                    key={sub.id} 
                    item={sub} 
                    depth={depth + 1} 
                    activeItemId={activeItemId}
                    onSelect={onSelect}
                    onDelete={onDelete}
                    isExpanded={isExpanded}
                    onToggleExpand={onToggleExpand}
                  />
                ))}
              </div>
            </SortableContext>
          )}

          {item.kind === 'group' && item.fields.length > 0 && (
            <SortableContext items={item.fields.map(i => i.id)} strategy={verticalListSortingStrategy}>
              <div className="mt-0.5 space-y-0.5">
                {item.fields.map((sub) => (
                  <SidebarTreeItem 
                    key={sub.id} 
                    item={sub} 
                    depth={depth + 1} 
                    activeItemId={activeItemId}
                    onSelect={onSelect}
                    onDelete={onDelete}
                    isExpanded={isExpanded}
                    onToggleExpand={onToggleExpand}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </>
      )}
    </div>
  );
};

const FieldItem = ({ 
  field, 
  index, 
  onUpdate, 
  onRemove, 
  onMove,
  onEditLogic,
  onEditOptions,
  onEditProperties,
  isLayoutMode
}: { 
  field: FormField, 
  parentId: string | null, 
  index: number, 
  onUpdate: (updates: Partial<FormField>) => void, 
  onRemove: () => void, 
  onMove: (dir: 'up' | 'down') => void,
  onEditLogic: () => void,
  onEditOptions: () => void,
  onEditProperties: () => void,
  isLayoutMode?: boolean
}) => {
  // const {
  //   transform,
  //   transition,
  //   isDragging
  // } = useSortable({ id: field.id });

  // const style = {
  //   transform: CSS.Transform.toString(transform),
  //   transition,
  //   opacity: isDragging ? 0.5 : 1,
  //   zIndex: isDragging ? 50 : 'auto',
  // };

  if (isLayoutMode) {
    const colSpan = field.layout?.colSpan || 12;
    return (
      <div 
        className={`group/layout-field p-4 rounded-2xl border border-glass-border bg-white/5 hover:border-primary/50 transition-all flex flex-col gap-3 relative ${COL_SPAN[colSpan]}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button 
              onClick={() => onMove('up')}
              disabled={index === 0}
              className="p-1.5 hover:bg-white/10 rounded-lg text-text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronUp size={14} />
            </button>
            <button 
              onClick={() => onMove('down')}
              className="p-1.5 hover:bg-white/10 rounded-lg text-text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronDown size={14} />
            </button>
          </div>
          <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">{field.label}</span>
        </div>
        <LayoutWidthSelector 
          value={field.layout?.colSpan || 12} 
          onChange={(val) => onUpdate({ layout: { ...field.layout, colSpan: val } })} 
        />
      </div>
    );
  }

  return (
    <div className="flex gap-4 p-4 rounded-xl border border-glass-border bg-white/5 hover:bg-white/10 transition-all group/field">
      <div className="flex-1 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Field Label"
            value={field.label}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ label: e.target.value })}
            className="space-y-1!"
          />
          <CustomSelect
            label="Data Type"
            options={[
              { label: 'Text', value: 'text' },
              { label: 'Textarea', value: 'textarea' },
              { label: 'Number', value: 'number' },
              { label: 'Select Dropdown', value: 'select' },
              { label: 'Checkbox', value: 'checkbox' },
              { label: 'Radio Group', value: 'radio' },
              { label: 'Addable Dropdown', value: 'addable-select' },
              { label: 'Color Picker', value: 'color' },
              { label: 'Date', value: 'date' },
              { label: 'Image Upload', value: 'image' },
              { label: 'SKU ID (Auto)', value: 'sku' },
              { label: 'Barcode', value: 'barcode' },
              { label: 'Bundle Items (Items Picker)', value: 'bundle-items' },
              { label: 'Key Value Row', value: 'key-value' }
            ]}
            value={field.type}
            onChange={(val: string) => onUpdate({ type: val as any })}
            className="space-y-1!"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(['select', 'radio', 'addable-select', 'checkbox'].includes(field.type)) && (
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white/5 border-glass-border hover:border-primary/40 text-[10px] font-bold py-2 px-3 h-auto"
              onClick={onEditOptions}
            >
              Options ({field.options?.length || 0})
            </Button>
          )}
          {(['sku', 'number', 'textarea', 'text', 'color', 'date', 'image', 'select', 'addable-select', 'bundle-items', 'checkbox', 'radio'].includes(field.type)) && (
            <Button 
              variant="outline" 
              size="sm" 
              className={`bg-white/5 border-glass-border hover:border-secondary/40 text-[10px] font-bold py-2 px-3 h-auto ${field.properties?.addButtonTitle && field.type === 'addable-select' ? 'border-secondary/30 bg-secondary/10' : ''}`}
              onClick={onEditProperties}
            >
              Properties
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className={`text-[10px] font-bold py-2 px-3 h-auto transition-all ${field.logic?.conditions.length ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-glass-border hover:border-yellow-500/40 text-text-muted hover:text-text-main'}`}
            onClick={onEditLogic}
            icon={field.logic?.conditions.length ? Check : Info}
          >
            {field.logic?.conditions.length ? `Logic Applied (${field.logic.conditions.length})` : 'Add Logic'}
          </Button>
        </div>
      </div>
      <div className="flex flex-col justify-start pt-6 gap-2">
        <div className="flex flex-col gap-1 items-center opacity-0 group-hover/field:opacity-100 transition-opacity">
          <button 
            onClick={() => onMove('up')}
            disabled={index === 0}
            className="p-1.5 hover:bg-white/10 rounded-lg text-text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronUp size={16} />
          </button>
          <button 
            onClick={() => onMove('down')}
            className="p-1.5 hover:bg-white/10 rounded-lg text-text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronDown size={16} />
          </button>
        </div>
        <button
          onClick={onRemove}
          className="p-2 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover/field:opacity-100"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

// interface SortableItemProps {
//   id: string;
//   children: React.ReactNode;
//   className?: string;
//   disabled?: boolean;
// }

// const SortableItem = ({ id, children, className, disabled }: SortableItemProps) => {
//   const {
//     attributes,
//     listeners,
//     setNodeRef,
//     transform,
//     transition,
//     isDragging
//   } = useSortable({ id, disabled });

//   const style = {
//     transform: CSS.Translate.toString(transform),
//     transition,
//     zIndex: isDragging ? 50 : undefined,
//     opacity: isDragging ? 0.3 : 1,
//   };

//   return (
//     <div ref={setNodeRef} style={style} {...attributes} className={className}>
//       <div className="relative group">
//         <div {...listeners} className="absolute -left-3 top-1/2 -translate-y-1/2 p-1 text-text-muted opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity z-20">
//           <GripVertical size={14} />
//         </div>
//         {children}
//       </div>
//     </div>
//   );
// };

export default function FormBuilderPage() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const templateId = searchParams.get('id');

  const [formName, setFormName] = useState('New Form Template');
  // const [resourceType, setResourceType] = useState<'product' | 'order' | 'customer'>('product');
  const [mappedTo, setMappedTo] = useState<string | null>(null);
  const [builderItems, setBuilderItems] = useState<BuilderItem[]>([
    { kind: 'section', id: '1', name: 'General Information', isRepeatable: false, items: [] }
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'options' | 'properties' | 'logic' | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [availableDropdowns, setAvailableDropdowns] = useState<Dropdown[]>([]);
  const [frontendForms, setFrontendForms] = useState<FrontendForm[]>([]);
  const [newOption, setNewOption] = useState('');
  const [activeTab, setActiveTab] = useState<'editor' | 'layout' | 'design' | 'design2' | 'preview'>((searchParams.get('tab') as any) || 'editor');
  // const [previousTab, setPreviousTab] = useState<'editor' | 'layout' | 'preview'>('editor');
  const [design, setDesign] = useState<any>(null);
  const [previewInstances, setPreviewInstances] = useState<Record<string, string[]>>({});
  const [previewData, setPreviewData] = useState<Record<string, any>>({});
  const [previewErrors, setPreviewErrors] = useState<Record<string, string>>({});
  const [isNewMappingModalOpen, setIsNewMappingModalOpen] = useState(false);
  const [newMapping, setNewMapping] = useState({ name: '', formKey: '' });
  const [isCreatingMapping, setIsCreatingMapping] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['1'])); // '1' is the default section ID
  // const [activeSidebarDragId, setActiveSidebarDragId] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { showSnackbar } = useSnackbar();
  
  useEffect(() => {
    if (activeTab === 'preview') {
      const newErrors: Record<string, string> = {};
      
      const validateRecursive = (items: BuilderItem[]) => {
        items.forEach(it => {
          if (it.kind === 'field') {
            const val = previewData[it.id];
            const props = it.properties || {};
            
            if (props.required) {
              const isEmpty = val === undefined || val === null || 
                (typeof val === 'string' && val.trim() === '') ||
                (Array.isArray(val) && val.length === 0);
              
              if (isEmpty) newErrors[it.id] = `${it.label} is required`;
            }

            if (it.type === 'number' && val !== undefined && val !== '') {
              const numVal = Number(val);
              if (props.min !== undefined && numVal < props.min) newErrors[it.id] = `Minimum value is ${props.min}`;
              if (props.max !== undefined && numVal > props.max) newErrors[it.id] = `Maximum value is ${props.max}`;
            }
          } else if (it.kind === 'section') {
            validateRecursive(it.items);
          } else if (it.kind === 'group') {
            validateRecursive(it.fields);
          }
        });
      };

      validateRecursive(builderItems);
      setPreviewErrors(newErrors);
    }
  }, [previewData, builderItems, activeTab, previewInstances]);
  
  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (templateId) {
      const loadTemplate = async () => {
        setIsLoading(true);
        try {
          const response = await getTemplate(templateId);
          const data = response[0];
          setFormName(data.name);
          setMappedTo(data.mappedTo || null);
          setBuilderItems(data.schema || []);
          if (data.design) setDesign(data.design);
          const forms = await getFrontendForms();
          console.log(forms, "forms");
          setFrontendForms(forms);
        } catch (error) {
          console.error('Failed to load template:', error);
          showSnackbar('Failed to load template.', 'error');
        } finally {
          setIsLoading(false);
        }
      };
      loadTemplate();
    }
  }, [templateId]);

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const data = await getDropdowns();
        setAvailableDropdowns(data);
      } catch (error) {
        console.error('Failed to fetch dropdowns:', error);
      }
    };

    const fetchFrontendForms = async () => {
      try {
        const data = await getFrontendForms();
        setFrontendForms(data);
      } catch (error) {
        console.error('Failed to fetch frontend forms:', error);
      }
    };

    fetchDropdowns();
    fetchFrontendForms();
  }, []);

  const handleSetTab = (tab: string) => {
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.set('tab', tab);
    setLocation(`${window.location.pathname}?${currentParams.toString()}`);
    setActiveTab(tab as any);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      showSnackbar('Please enter a form name before saving.', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        name: formName,
        mappedTo: mappedTo || null,
        schema: builderItems,
        design
      };

      if (templateId) {
        await updateTemplate(templateId, payload);
      } else {
        await createTemplate(payload);
      }
      showSnackbar('Template saved successfully!', 'success');
    } catch (error) {
      console.error('Save failed:', error);
      showSnackbar('Failed to save template. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const addOption = (id: string, option: string) => {
    if (!option.trim()) return;
    const updateRecursive = (items: any[]): any[] => {
      return items.map(item => {
        if (item.id === id && item.kind === 'field') {
          const options = item.options || [];
          if (options.includes(option.trim())) return item;
          return { ...item, options: [...options, option.trim()] };
        }
        if (item.kind === 'section') return { ...item, items: updateRecursive(item.items) };
        if (item.kind === 'group') return { ...item, fields: updateRecursive(item.fields) };
        return item;
      });
    };
    setBuilderItems(updateRecursive(builderItems));
    setNewOption('');
  };

  const removeOption = (id: string, option: string) => {
    const updateRecursive = (items: any[]): any[] => {
      return items.map(item => {
        if (item.id === id && item.kind === 'field') {
          return { ...item, options: (item.options || []).filter((o: string) => o !== option) };
        }
        if (item.kind === 'section') return { ...item, items: updateRecursive(item.items) };
        if (item.kind === 'group') return { ...item, fields: updateRecursive(item.fields) };
        return item;
      });
    };
    setBuilderItems(updateRecursive(builderItems));
  };

  const updateFieldProperty = (id: string, key: string, value: any) => {
    const updateRecursive = (items: any[]): any[] => {
      return items.map(item => {
        // Single Stock Field Constraint: If setting a field as stock, clear it from all others
        if (key === 'isStock' && value === true && item.kind === 'field' && item.id !== id) {
          if (item.properties?.isStock) {
            return { ...item, properties: { ...item.properties, isStock: false } };
          }
        }

        if (item.id === id && item.kind === 'field') {
          return { ...item, properties: { ...(item.properties || {}), [key]: value } };
        }
        if (item.kind === 'section') return { ...item, items: updateRecursive(item.items) };
        if (item.kind === 'group') return { ...item, fields: updateRecursive(item.fields) };
        return item;
      });
    };
    setBuilderItems(updateRecursive(builderItems));
  };

  const addLogicCondition = (id: string) => {
    const updateRecursive = (items: any[]): any[] => {
      return items.map(item => {
        if (item.id === id) {
          const logic = item.logic || { type: 'AND', conditions: [] };
          return { 
            ...item, 
            logic: { 
              ...logic, 
              conditions: [...logic.conditions, { fieldId: '', operator: 'equals', value: '' }] 
            } 
          };
        }
        if (item.kind === 'section') return { ...item, items: updateRecursive(item.items) };
        if (item.kind === 'group') return { ...item, fields: updateRecursive(item.fields) };
        return item;
      });
    };
    setBuilderItems(updateRecursive(builderItems));
  };

  const updateLogicCondition = (itemId: string, condIdx: number, updates: Partial<LogicCondition>) => {
    const updateRecursive = (items: any[]): any[] => {
      return items.map(item => {
        if (item.id === itemId && item.logic) {
          const newConditions = [...item.logic.conditions];
          newConditions[condIdx] = { ...newConditions[condIdx], ...updates };
          return { ...item, logic: { ...item.logic, conditions: newConditions } };
        }
        if (item.kind === 'section') return { ...item, items: updateRecursive(item.items) };
        if (item.kind === 'group') return { ...item, fields: updateRecursive(item.fields) };
        return item;
      });
    };
    setBuilderItems(updateRecursive(builderItems));
  };

  const removeLogicCondition = (itemId: string, condIdx: number) => {
    const updateRecursive = (items: any[]): any[] => {
      return items.map(item => {
        if (item.id === itemId && item.logic) {
          return { 
            ...item, 
            logic: { 
              ...item.logic, 
              conditions: item.logic.conditions.filter((_: any, i: number) => i !== condIdx) 
            } 
          };
        }
        if (item.kind === 'section') return { ...item, items: updateRecursive(item.items) };
        if (item.kind === 'group') return { ...item, fields: updateRecursive(item.fields) };
        return item;
      });
    };
    setBuilderItems(updateRecursive(builderItems));
  };

  const getAllFieldsRecursive = (items: any[]): FormField[] => {
    let fields: FormField[] = [];
    items.forEach(item => {
      if (item.kind === 'field') fields.push(item);
      if (item.kind === 'section') fields = [...fields, ...getAllFieldsRecursive(item.items)];
      if (item.kind === 'group') fields = [...fields, ...getAllFieldsRecursive(item.fields)];
    });
    return fields;
  };

  const insertAfterSelected = (newItem: BuilderItem) => {
    setBuilderItems(prev => {
      // If nothing selected, just append to root
      if (!editingItemId) return [...prev, newItem];

      const res = findItemAndContainer(editingItemId, prev);
      if (!res) return [...prev, newItem];

      const { containerId } = res;
      
      // Constraint Check: Sections must be root
      if (newItem.kind === 'section') {
        if (containerId === 'root') {
          const idx = prev.findIndex(i => i.id === editingItemId);
          const next = [...prev];
          next.splice(idx + 1, 0, newItem);
          return next;
        } else {
          // If selected is nested, find its top-level section/item and insert after that at root
          let topId = containerId;
          const topRes = findItemAndContainer(containerId, prev);
          if (topRes && topRes.containerId !== 'root') {
            topId = topRes.containerId; // Handle nested groups in sections
          }
          const idx = prev.findIndex(i => i.id === topId);
          const next = [...prev];
          next.splice(idx >= 0 ? idx + 1 : next.length, 0, newItem);
          return next;
        }
      }

      // Logic for adding Field or Group after selected item
      const insertAt = (items: BuilderItem[]): BuilderItem[] => {
        if (containerId === 'root') {
          const idx = items.findIndex(i => i.id === editingItemId);
          const next = [...items];
          next.splice(idx + 1, 0, newItem);
          return next;
        }

        return items.map(item => {
          if (item.id === containerId) {
            const listKey = item.kind === 'section' ? 'items' : 'fields';
            const list = [...((item as any)[listKey] || [])];
            const idx = list.findIndex(i => i.id === editingItemId);
            list.splice(idx + 1, 0, newItem as any);
            return { ...item, [listKey]: list };
          }
          if (item.kind === 'section') return { ...item, items: insertAt(item.items) as any };
          if (item.kind === 'group') return { ...item, fields: insertAt(item.fields) as any };
          return item;
        });
      };

      return insertAt(prev);
    });
    
    // Automatically select the new item
    setEditingItemId(newItem.id);
  };

  const addSection = () => {
    const newSection: FormSection = {
      kind: 'section',
      id: Date.now().toString(),
      name: 'New Section',
      isRepeatable: false,
      items: []
    };
    insertAfterSelected(newSection);
  };

  const addTopLevelField = () => {
    const newField: FormField = {
      kind: 'field',
      id: Date.now().toString(),
      label: 'New Field',
      type: 'text'
    };
    insertAfterSelected(newField);
  };

  const addGroup = (sectionId: string | null = null) => {
    const newGroup: FormGroup = {
      kind: 'group',
      id: Date.now().toString(),
      fields: [],
      logic: { type: 'AND', conditions: [] }
    };

    if (!sectionId && editingItemId) {
      insertAfterSelected(newGroup);
      return;
    }

    if (!sectionId) {
      setBuilderItems(prev => [...prev, newGroup]);
      return;
    }

    setBuilderItems(prev => prev.map(item => {
      if (item.kind === 'section' && item.id === sectionId) {
        return { ...item, items: [...item.items, newGroup] };
      }
      return item;
    }));
  };

  const addField = (parentId: string | null) => {
    const newField: FormField = {
      kind: 'field',
      id: Date.now().toString(),
      label: 'New Field',
      type: 'text'
    };

    if (!parentId && editingItemId) {
      insertAfterSelected(newField);
      return;
    }

    if (!parentId) {
      setBuilderItems([...builderItems, newField]);
      return;
    }

    const updateRecursive = (items: any[]): any[] => {
      return items.map(item => {
        if (item.id === parentId) {
          if (item.kind === 'section') return { ...item, items: [...item.items, newField] };
          if (item.kind === 'group') return { ...item, fields: [...item.fields, newField] };
        }
        if (item.kind === 'section') return { ...item, items: updateRecursive(item.items) };
        if (item.kind === 'group') return { ...item, fields: updateRecursive(item.fields) };
        return item;
      });
    };
    setBuilderItems(updateRecursive(builderItems));
  };

  const insertAt = (containerId: string, index: number, kind: 'field' | 'section' | 'group', type?: any) => {
    const id = Date.now().toString();
    let newItem: BuilderItem;
    
    if (kind === 'section') {
      newItem = { kind: 'section', id, name: 'New Section', isRepeatable: false, items: [] };
    } else if (kind === 'group') {
      newItem = { kind: 'group', id, fields: [], logic: { type: 'AND', conditions: [] } };
    } else {
      newItem = { kind: 'field', id, label: kind === 'field' && type === 'key-value' ? 'Key Value' : 'New Field', type: type || 'text' };
    }

    setBuilderItems(prev => {
      const updateRecursive = (items: BuilderItem[]): BuilderItem[] => {
        if (containerId === 'root') {
          const next = [...items];
          next.splice(index, 0, newItem);
          return next;
        }

        return items.map(item => {
          if (item.id === containerId) {
            const listKey = item.kind === 'section' ? 'items' : 'fields';
            const list = [...((item as any)[listKey] || [])];
            list.splice(index, 0, newItem as any);
            return { ...item, [listKey]: list };
          }
          if (item.kind === 'section') return { ...item, items: updateRecursive(item.items) as any };
          if (item.kind === 'group') return { ...item, fields: updateRecursive(item.fields) as any };
          return item;
        });
      };
      return updateRecursive(prev);
    });

    setEditingItemId(id);
    setTimeout(() => {
      const el = document.getElementById(`item-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const updateItem = (id: string, updates: any) => {
    const updateRecursive = (items: any[]): any[] => {
      return items.map(item => {
        if (item.id === id) return { ...item, ...updates };
        if (item.kind === 'section') return { ...item, items: updateRecursive(item.items) };
        if (item.kind === 'group') return { ...item, fields: updateRecursive(item.fields) };
        return item;
      });
    };
    setBuilderItems(updateRecursive(builderItems));
  };

  const removeItem = (id: string) => {
    const removeRecursive = (items: any[]): any[] => {
      return items
        .filter(item => item.id !== id)
        .map(item => {
          if (item.kind === 'section') return { ...item, items: removeRecursive(item.items) };
          if (item.kind === 'group') return { ...item, fields: removeRecursive(item.fields) };
          return item;
        });
    };
    setBuilderItems(removeRecursive(builderItems));
  };

  const moveBuilderItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...builderItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    setBuilderItems(newItems);
  };

  const handleCreateMapping = async () => {
    if (!newMapping.name || !newMapping.formKey) return;
    setIsCreatingMapping(true);
    try {
      const data = await createFrontendForm(newMapping);
      setFrontendForms(prev => [...prev, data]);
      setMappedTo(data.id);
      setIsNewMappingModalOpen(false);
      setNewMapping({ name: '', formKey: '' });
    } catch (error) {
       console.error('Failed to create mapping:', error);
       showSnackbar('Failed to create mapping.', 'error');
    } finally {
      setIsCreatingMapping(false);
    }
  };

  const moveNestedItem = (parentId: string, index: number, direction: 'up' | 'down') => {
    const updateRecursive = (items: any[]): any[] => {
      return items.map(item => {
        if (item.id === parentId) {
          const listName = item.kind === 'section' ? 'items' : 'fields';
          const newList = [...(item[listName] || [])];
          const targetIdx = direction === 'up' ? index - 1 : index + 1;
          if (targetIdx >= 0 && targetIdx < newList.length) {
            [newList[index], newList[targetIdx]] = [newList[targetIdx], newList[index]];
            return { ...item, [listName]: newList };
          }
        }
        if (item.kind === 'section') return { ...item, items: updateRecursive(item.items) };
        if (item.kind === 'group') return { ...item, fields: updateRecursive(item.fields) };
        return item;
      });
    };
    setBuilderItems(updateRecursive(builderItems));
  };

  const findItemRecursive = (items: BuilderItem[], itemId: string): BuilderItem | null => {
    for (const item of items) {
      if (item.id === itemId) return item;
      if (item.kind === 'section') {
        const found = findItemRecursive(item.items, itemId);
        if (found) return found;
      }
      if (item.kind === 'group') {
        const found = findItemRecursive(item.fields, itemId);
        if (found) return found;
      }
    }
    return null;
  };

  const findContainer = (id: string, items: BuilderItem[] = builderItems): string | null => {
    if (items.find(i => i.id === id)) return 'root';
    for (const item of items) {
      if (item.kind === 'section') {
        if (item.items.find(i => i.id === id)) return item.id;
        const found = findContainer(id, item.items);
        if (found) return found;
      }
      if (item.kind === 'group') {
        if (item.fields.find(i => i.id === id)) return item.id;
      }
    }
    return null;
  };

  const getContainerItems = (containerId: string, items: BuilderItem[] = builderItems): BuilderItem[] => {
    if (containerId === 'root') return items;
    for (const item of items) {
      if (item.id === containerId) {
        return item.kind === 'section' ? item.items : (item.kind === 'group' ? item.fields : []);
      }
      if (item.kind === 'section') {
        const found = getContainerItems(containerId, item.items);
        if (found.length > 0 || item.items.some(i => i.id === containerId)) { // Checking if this is the parent
           const container = item.items.find(i => i.id === containerId) as (FormField | FormGroup | undefined);
           if (container) return container.kind === 'group' ? container.fields : [];
          return found;
        }
      }
    }
    return [];
  };

  // Improved recursive finder that returns the item and its container
  const findItemAndContainer = (id: string, items: BuilderItem[] = builderItems): { item: BuilderItem, containerId: string } | null => {
    const rootItem = items.find(i => i.id === id);
    if (rootItem) return { item: rootItem, containerId: 'root' };

    for (const item of items) {
      if (item.kind === 'section') {
        const sub = item.items.find(i => i.id === id);
        if (sub) return { item: sub, containerId: item.id };
        const found = findItemAndContainer(id, item.items);
        if (found) return found;
      }
      if (item.kind === 'group') {
        const sub = item.fields.find(i => i.id === id);
        if (sub) return { item: sub, containerId: item.id };
      }
    }
    return null;
  };

  const activeItem = editingItemId ? findItemRecursive(builderItems, editingItemId) : null;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={48} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-20 p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={ChevronLeft}
              onClick={() => setLocation('/forms')}
              className="bg-white/5 border-glass-border hover:bg-white/10"
            >
              Back to List
            </Button>
          </div>
          <div className="flex gap-3">
            <div className="flex bg-white/5 p-1 rounded-2xl border border-glass-border">
              {[
                { id: 'editor', label: 'Items', icon: CheckSquare },
                { id: 'layout', label: 'Layout', icon: Layout },
                // { id: 'design', label: 'Design', icon: Palette },
                { id: 'design2', label: 'Design', icon: Brush },
                { id: 'preview', label: 'Preview', icon: Eye }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'preview' && activeTab !== 'preview') {
                      setPreviewInstances({});
                      setPreviewData({});
                    }
                    setActiveTab(tab.id as any);
                  }}
                  className={`
                    flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300
                    ${activeTab === tab.id 
                      ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                      : 'text-text-muted hover:text-text-main hover:bg-white/5'}
                  `}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button
                size="sm"
                icon={isSaving ? Loader2 : Check}
                className="shadow-lg shadow-primary/20 h-[46px]"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Template'}
              </Button>
            </div>
          </div>
        </div>

        {activeTab === 'editor' && (
          <>
            <div className="space-y-2 border-b border-glass-border pb-8 text-center sm:text-left">
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="text-4xl font-black text-text-main bg-transparent border-none focus:outline-none focus:ring-0 w-full hover:bg-white/5 rounded-xl px-4 py-2 -ml-4 transition-all placeholder:text-text-muted/30"
                placeholder="Untitled Form Template"
              />
              <p className="text-text-muted text-lg font-medium opacity-70">Define groups and fields for your custom dynamic form</p>
              
              <div className="flex flex-wrap gap-4 mt-4">
                {/* <div className="w-full sm:w-80 space-y-2">
                  <Select
                    label="Resource Type"
                    options={[
                      { label: 'Product', value: 'product' },
                      { label: 'Order', value: 'order' },
                      { label: 'Customer', value: 'customer' }
                    ]}
                    value={resourceType}
                    onChange={(e: any) => setResourceType(e.target.value)}
                    className="!space-y-1"
                  />
                </div> */}
                {!templateId && (
                  <div className="w-full sm:w-80 space-y-2">
                    <CustomSelect
                      label="Mapped to Frontend Form"
                      options={[
                        { label: 'Not Mapped', value: '' },
                        ...frontendForms.map(f => ({ label: f.name, value: f.id }))
                      ]}
                      value={mappedTo || ''}
                      onChange={(val: string) => setMappedTo(val || null)}
                      className="!space-y-1"
                    />
                    {import.meta.env.DEV && (
                      <button 
                        onClick={() => setIsNewMappingModalOpen(true)}
                        className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-light transition-colors flex items-center gap-1"
                      >
                        <Plus size={10} /> Create New Mapping (DEV ONLY)
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 items-start">
              {/* Sidebar / Toolbox - Sticky */}
              <div className="lg:col-span-1 space-y-6 sticky top-4">
                <GlassCard ref={sidebarRef} className="p-5 bg-primary/5 border-primary/20 backdrop-blur-xl h-[calc(100vh-150px)] overflow-y-auto">
                  <h3 className="text-sm font-black text-primary mb-5 flex items-center gap-2 uppercase tracking-tighter">
                    <Settings2 size={16} /> Workspace Toolbox
                  </h3>
                  <div className="space-y-3">
                    <button
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/5 border border-secondary/20 hover:bg-secondary/10 transition-all font-bold text-secondary text-sm group"
                      onClick={addSection}
                    >
                      <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                        <Layout size={18} />
                      </div>
                      Section
                    </button>
                    
                    <button
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-all font-bold text-primary text-sm group"
                      onClick={addTopLevelField}
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <CheckSquare size={18} />
                      </div>
                      Field
                    </button>

                    <button
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 hover:bg-blue-500/10 transition-all font-bold text-blue-400 text-sm group"
                      onClick={() => addGroup(null)}
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                        <LayoutGrid size={18} />
                      </div>
                      Group
                    </button>
                    <button
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20 hover:bg-yellow-500/10 transition-all font-bold text-yellow-500 text-sm group"
                      onClick={() => insertAt('root', builderItems.length, 'field', 'key-value')}
                    >
                      <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
                        <Grid size={18} />
                      </div>
                      Key Value
                    </button>

                    <button
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 transition-all font-bold text-emerald-500 text-sm group"
                      onClick={() => insertAt('root', builderItems.length, 'field', 'accordion')}
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                        <ChevronDown size={18} />
                      </div>
                      Accordion
                    </button>

                    <button
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 hover:bg-rose-500/10 transition-all font-bold text-rose-500 text-sm group"
                      onClick={() => insertAt('root', builderItems.length, 'field', 'offers')}
                    >
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center group-hover:bg-rose-500/20 transition-colors">
                        <Gift size={18} />
                      </div>
                      Offers
                    </button>
                  </div>

                  {/* Sections List in Sidebar - Improved Recursive Tree */}
                  {builderItems.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-glass-border space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Form Structure</h4>
                        <Layers size={12} className="text-text-muted opacity-50" />
                      </div>
                      
                      <div className="space-y-1">
                        <DndContext 
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          // onDragStart={(event) => {
                          //   // setActiveSidebarDragId(event.active.id as string);
                          // }}
                          onDragEnd={(event) => {
                            // setActiveSidebarDragId(null);
                            const { active, over } = event;
                            if (!over || active.id === over.id) return;
                            
                            const activeId = active.id as string;
                            const overId = over.id as string;

                            const activeItemContainer = findItemAndContainer(activeId);
                            const overItemContainer = findItemAndContainer(overId);

                            if (!activeItemContainer || !overItemContainer) return;

                            setBuilderItems(prev => {
                              const activeItem = findItemRecursive(prev, activeId);
                              if (!activeItem) return prev;

                              // 1. Remove from source
                              const removeFromSource = (items: BuilderItem[]): BuilderItem[] => {
                                return items.filter(i => i.id !== activeId).map(i => {
                                  if (i.kind === 'section') return { ...i, items: removeFromSource(i.items) as any };
                                  if (i.kind === 'group') return { ...i, fields: removeFromSource(i.fields) as any };
                                  return i;
                                });
                              };

                              let tempItems = removeFromSource(prev);

                              // 2. Identify target and constraints
                              let targetContainerId = overItemContainer.containerId;
                              
                              // Section constraint: Sections always to root
                              if (activeItem.kind === 'section') {
                                targetContainerId = 'root';
                              }

                              // 3. Insert into target
                              const insertIntoTarget = (items: BuilderItem[]): BuilderItem[] => {
                                if (targetContainerId === 'root') {
                                  let overIdx = items.findIndex(i => i.id === overId);
                                  
                                  // Section drop constraints:
                                  if (overIdx === -1 && activeItem.kind === 'section') {
                                    const topParent = findItemAndContainer(overId, prev);
                                    if (topParent) {
                                      let rootParentId = topParent.containerId;
                                      if (rootParentId !== 'root') {
                                        const p = findItemAndContainer(rootParentId, prev);
                                        if (p) rootParentId = p.containerId;
                                      }
                                      overIdx = items.findIndex(i => i.id === (topParent.containerId === 'root' ? overId : topParent.containerId));
                                    }
                                  }

                                  const nextItems = [...items];
                                  const oldIdx = items.findIndex(i => i.id === activeId);

                                  if (oldIdx !== -1) {
                                    // Intra-container move
                                    return arrayMove(nextItems, oldIdx, overIdx >= 0 ? overIdx : nextItems.length);
                                  } else {
                                    // Inter-container move
                                    nextItems.splice(overIdx >= 0 ? overIdx : nextItems.length, 0, activeItem);
                                    return nextItems;
                                  }
                                }

                                return items.map(item => {
                                  if (item.id === targetContainerId) {
                                    const listKey = item.kind === 'section' ? 'items' : 'fields';
                                    const list = [...((item as any)[listKey] || [])];
                                    const oldIdx = list.findIndex(i => i.id === activeId);
                                    const overIdx = list.findIndex(i => i.id === overId);
                                    
                                    if (oldIdx !== -1) {
                                      return { ...item, [listKey]: arrayMove(list, oldIdx, overIdx >= 0 ? overIdx : list.length) };
                                    } else {
                                      list.splice(overIdx >= 0 ? overIdx : list.length, 0, activeItem as any);
                                      return { ...item, [listKey]: list };
                                    }
                                  }
                                  if (item.kind === 'section') return { ...item, items: insertIntoTarget(item.items) as any };
                                  if (item.kind === 'group') return { ...item, fields: insertIntoTarget(item.fields) as any };
                                  return item;
                                });
                              };

                              return insertIntoTarget(activeItemContainer.containerId === targetContainerId ? prev : tempItems);
                            });
                          }}
                        >
                          <SortableContext items={builderItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-1">
                              {builderItems.map((item) => (
                                <SidebarTreeItem 
                                  key={item.id} 
                                  item={item} 
                                  depth={0} 
                                  activeItemId={editingItemId}
                                  onSelect={(id) => {
                                    setEditingItemId(id);
                                    setActiveTab('editor');
                                  }}
                                  onDelete={(id) => {
                                    removeItem(id);
                                    if (editingItemId === id) setEditingItemId(null);
                                  }}
                                  isExpanded={expandedItems.has(item.id)}
                                  onToggleExpand={(id) => {
                                    setExpandedItems(prev => {
                                      const next = new Set(prev);
                                      if (next.has(id)) next.delete(id);
                                      else next.add(id);
                                      return next;
                                    });
                                  }}
                                />
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                      </div>
                    </div>
                  )}
                </GlassCard>
              </div>

              {/* Main Builder Area */}
              <div className="lg:col-span-3 space-y-6 pb-20">
            <PlusSeparator containerId="root" index={0} allowedTypes={['field', 'section', 'group', 'key-value']} onInsert={insertAt} />
            {builderItems.map((item: BuilderItem, index: number) => (
              <React.Fragment key={item.id}>
                <div id={`item-${item.id}`} className="group/item relative">
                {item.kind === 'section' ? (
                  <GlassCard className="p-0 overflow-hidden border-2 border-transparent hover:border-primary/30 transition-all">
                    {/* Section Header */}
                    <div className={`p-6 border-b border-glass-border flex items-center justify-between gap-4 transition-colors ${item.isRepeatable ? 'bg-secondary/5' : 'bg-glass-bg/50'}`}>
                      <div className="flex items-center gap-4 flex-1">
                        <div className="cursor-grab active:cursor-grabbing text-text-muted hover:text-text-main transition-colors">
                          <GripVertical size={20} />
                        </div>
                        <div className="space-y-1 flex-1">
                          <input
                            value={item.name}
                            onChange={(e) => updateItem(item.id, { name: e.target.value })}
                            className="text-xl font-bold text-text-main bg-transparent border-none focus:outline-none focus:ring-0 p-0 w-full"
                            placeholder="Section Name"
                          />
                          {item.isRepeatable && (
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-secondary animate-pulse">
                              <Plus size={10} /> Repeatable Section
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className={`text-[10px] font-bold py-2 px-3 h-auto transition-all ${item.logic?.conditions.length ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-glass-border text-text-muted hover:text-text-main hover:border-yellow-500/40'}`}
                          onClick={() => {
                            setEditingItemId(item.id);
                            setDrawerMode('logic');
                            setIsDrawerOpen(true);
                          }}
                          icon={item.logic?.conditions.length ? Check : Info}
                        >
                          {item.logic?.conditions.length ? `Logic (${item.logic.conditions.length})` : 'Logic'}
                        </Button>
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={item.isRepeatable}
                            onChange={(e) => updateItem(item.id, { isRepeatable: e.target.checked })}
                            className="w-4 h-4 rounded border-glass-border text-primary focus:ring-primary/50 bg-white/10"
                          />
                          <span className="text-sm font-medium text-text-muted group-hover:text-text-main transition-colors">Repeatable</span>
                        </label>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Section Items (Fields or Groups) */}
                    <div className="p-6 pb-12 space-y-4">
                      <PlusSeparator containerId={item.id} index={0} allowedTypes={['field', 'group']} onInsert={insertAt} />
                      {item.items.map((subItem, subIdx) => (
                        <React.Fragment key={subItem.id}>
                          <div id={`item-${subItem.id}`}>
                          {subItem.kind === 'group' ? (
                            <div className="p-4 rounded-2xl border border-glass-border bg-white/5 space-y-4">
                              <div className="flex items-center justify-between opacity-50 text-[10px] font-black uppercase tracking-widest text-text-muted">
                                <div className="flex items-center gap-3">
                                  <span>Untitled Group</span>
                                  <button 
                                    onClick={() => {
                                      setEditingItemId(subItem.id);
                                      setDrawerMode('logic');
                                      setIsDrawerOpen(true);
                                    }}
                                    className={`hover:text-primary transition-colors ${subItem.logic?.conditions.length ? 'text-primary font-black' : ''}`}
                                  >
                                    {subItem.logic?.conditions.length ? `(LOGIC: ${subItem.logic.conditions.length})` : '(SET LOGIC)'}
                                  </button>
                                </div>
                                <button onClick={() => removeItem(subItem.id)} className="hover:text-red-500"><X size={12} /></button>
                              </div>
                              <div className="space-y-4">
                                <PlusSeparator containerId={subItem.id} index={0} allowedTypes={['field']} onInsert={insertAt} />
                                {subItem.fields.map((field, fIdx) => (
                                  <React.Fragment key={field.id}>
                                    <div id={`item-${field.id}`}>
                                      <FieldItem 
                                        key={field.id} 
                                        field={field} 
                                        parentId={subItem.id} 
                                        index={fIdx}
                                        onUpdate={(updates) => updateItem(field.id, updates)}
                                        onRemove={() => removeItem(field.id)}
                                        onMove={(dir) => moveNestedItem(subItem.id, fIdx, dir)}
                                        onEditLogic={() => {
                                          setEditingItemId(field.id);
                                          setDrawerMode('logic');
                                          setIsDrawerOpen(true);
                                        }}
                                        onEditOptions={() => {
                                          setEditingItemId(field.id);
                                          setDrawerMode('options');
                                          setIsDrawerOpen(true);
                                        }}
                                        onEditProperties={() => {
                                          setEditingItemId(field.id);
                                          setDrawerMode('properties');
                                          setIsDrawerOpen(true);
                                        }}
                                      />
                                    </div>
                                    <PlusSeparator containerId={subItem.id} index={fIdx + 1} allowedTypes={['field']} onInsert={insertAt} />
                                  </React.Fragment>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <FieldItem 
                              field={subItem} 
                              parentId={item.id} 
                              index={subIdx}
                              onUpdate={(updates) => updateItem(subItem.id, updates)}
                              onRemove={() => removeItem(subItem.id)}
                              onMove={(dir) => moveNestedItem(item.id, subIdx, dir)}
                              onEditLogic={() => {
                                setEditingItemId(subItem.id);
                                setDrawerMode('logic');
                                setIsDrawerOpen(true);
                              }}
                              onEditOptions={() => {
                                setEditingItemId(subItem.id);
                                setDrawerMode('options');
                                setIsDrawerOpen(true);
                              }}
                              onEditProperties={() => {
                                setEditingItemId(subItem.id);
                                setDrawerMode('properties');
                                setIsDrawerOpen(true);
                              }}
                            />
                          )}
                          </div>
                          <PlusSeparator containerId={item.id} index={subIdx + 1} allowedTypes={['field', 'group']} onInsert={insertAt} />
                        </React.Fragment>
                      ))}
                      <div className="flex gap-4">
                        <Button 
                          variant="outline" 
                          icon={Plus} 
                          className="flex-1 border-dashed"
                          onClick={() => addField(item.id)}
                        >
                          Field
                        </Button>
                        <Button 
                          variant="outline" 
                          icon={Layout} 
                          className="flex-1 border-dashed"
                          onClick={() => addGroup(item.id)}
                        >
                          Group
                        </Button>
                      </div>
                    </div>
                  </GlassCard>
                ) : item.kind === 'group' ? (
                  <div id={`item-${item.id}`} className="p-4 rounded-2xl border border-glass-border bg-white/5 space-y-2">
                    <div className="flex items-center justify-between opacity-50 text-[10px] font-black uppercase tracking-widest text-text-muted">
                      <div className="flex items-center gap-3">
                        <span>Untitled Group</span>
                        <button 
                          onClick={() => {
                            setEditingItemId(item.id);
                            setDrawerMode('logic');
                            setIsDrawerOpen(true);
                          }}
                          className={`hover:text-primary transition-colors ${item.logic?.conditions.length ? 'text-primary font-black' : ''}`}
                        >
                          {item.logic?.conditions.length ? `(LOGIC: ${item.logic.conditions.length})` : '(SET LOGIC)'}
                        </button>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="hover:text-red-500"><X size={12} /></button>
                    </div>
                    <div className="space-y-2">
                      <PlusSeparator containerId={item.id} index={0} allowedTypes={['field']} onInsert={insertAt} />
                      {item.fields.map((field, fIdx) => (
                        <React.Fragment key={field.id}>
                          <div id={`item-${field.id}`}>
                            <FieldItem 
                              key={field.id} 
                              field={field} 
                              parentId={item.id} 
                              index={fIdx}
                              onUpdate={(updates) => updateItem(field.id, updates)}
                              onRemove={() => removeItem(field.id)}
                              onMove={(dir) => moveNestedItem(item.id, fIdx, dir)}
                              onEditLogic={() => {
                                setEditingItemId(field.id);
                                setDrawerMode('logic');
                                setIsDrawerOpen(true);
                              }}
                              onEditOptions={() => {
                                setEditingItemId(field.id);
                                setDrawerMode('options');
                                setIsDrawerOpen(true);
                              }}
                              onEditProperties={() => {
                                setEditingItemId(field.id);
                                setDrawerMode('properties');
                                setIsDrawerOpen(true);
                              }}
                            />
                          </div>
                          <PlusSeparator containerId={item.id} index={fIdx + 1} allowedTypes={['field']} onInsert={insertAt} />
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div id={`item-${item.id}`}>
                    <FieldItem 
                      field={item} 
                      parentId={null} 
                      index={index}
                      onUpdate={(updates) => updateItem(item.id, updates)}
                      onRemove={() => removeItem(item.id)}
                      onMove={(dir) => moveBuilderItem(index, dir)}
                      onEditLogic={() => {
                        setEditingItemId(item.id);
                        setDrawerMode('logic');
                        setIsDrawerOpen(true);
                      }}
                      onEditOptions={() => {
                        setEditingItemId(item.id);
                        setDrawerMode('options');
                        setIsDrawerOpen(true);
                      }}
                      onEditProperties={() => {
                        setEditingItemId(item.id);
                        setDrawerMode('properties');
                        setIsDrawerOpen(true);
                      }}
                    />
                  </div>
                )}
                </div>
                <PlusSeparator containerId="root" index={index + 1} allowedTypes={['field', 'section', 'group', 'key-value']} onInsert={insertAt} />
              </React.Fragment>
            ))}

            <div className="flex gap-6">
              <Button
                variant="outline"
                onClick={addSection}
                className="flex-1 h-16 border-2 border-dashed bg-transparent hover:bg-primary/5 border-glass-border hover:border-primary/50 text-lg font-bold"
                icon={Plus}
              >
                Section
              </Button>
              <Button
                variant="outline"
                onClick={addTopLevelField}
                className="flex-1 h-16 border-2 border-dashed bg-transparent hover:bg-secondary/5 border-glass-border hover:border-secondary/50 text-lg font-bold"
                icon={Plus}
              >
                Field
              </Button>
              <Button
                variant="outline"
                onClick={() => addGroup(null)}
                className="flex-1 h-16 border-2 border-dashed bg-transparent hover:bg-yellow-500/5 border-glass-border hover:border-yellow-500/50 text-lg font-bold"
                icon={Layout}
              >
               Group
              </Button>
            </div>
            <div className="h-40" />
          </div>
        </div>
          </>
        )}

        {activeTab === 'design' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <DesignTab 
              builderItems={builderItems}
              design={design}
              setDesign={setDesign}
            />
          </div>
        )}

        {activeTab === 'design2' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <DesignTab2 
              builderItems={builderItems}
              design={design}
              setDesign={setDesign}
            />
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center space-y-4 py-10 border-b border-glass-border/50">
              <h1 className="text-4xl font-black text-text-main tracking-tighter">{formName}</h1>
              <p className="text-text-muted text-lg font-medium opacity-70">Form Preview Mode</p>
            </div>

            <div className="grid grid-cols-12 gap-x-8 gap-y-16 pb-20">
              {builderItems.map((item) => {
                const renderItem = (it: BuilderItem, isNested = false) => {
                  const isVisible = (logic?: ConditionalLogic) => {
                    if (!logic || (logic.conditions || []).length === 0) return true;
                    const results = (logic.conditions || []).map(cond => {
                      const val = previewData[cond.fieldId];
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
                    return logic.type === 'AND' ? results.every(r => r) : results.some(r => r);
                  };

                  if (it.kind === 'section') {
                    if (!isVisible(it.logic)) return null;
                    const instances = it.isRepeatable 
                      ? (previewInstances[it.id] || ['initial']) 
                      : ['static'];

                    return (
                      <div key={it.id} className={`space-y-6 ${isNested ? '' : 'col-span-full'}`}>
                        <div className="flex items-center justify-between border-b border-glass-border pb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--color-primary-rgb),0.5)]" />
                            <h2 className="text-2xl font-bold text-text-main">{it.name}</h2>
                          </div>
                          {it.isRepeatable && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setPreviewInstances(prev => ({
                                ...prev,
                                [it.id]: [...(prev[it.id] || ['initial']), Date.now().toString()]
                              }))}
                              icon={Plus}
                              className="bg-primary/5 border-primary/20 text-primary"
                            >
                              Add Entry
                            </Button>
                          )}
                        </div>
                        {instances.map((instanceId, idx) => (
                          <GlassCard key={instanceId} className="p-8 space-y-8 relative group">
                            {it.isRepeatable && instances.length > 1 && (
                              <button 
                                onClick={() => setPreviewInstances(prev => ({
                                  ...prev,
                                  [it.id]: prev[it.id].filter(id => id !== instanceId)
                                }))}
                                className="absolute -top-3 -right-3 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X size={16} />
                              </button>
                            )}
                            {it.isRepeatable && instances.length > 1 && (
                              <div className="absolute top-4 right-8 text-[10px] font-black uppercase tracking-widest text-text-muted opacity-30">
                                Entry #{idx + 1}
                              </div>
                            )}
                            <div className="space-y-8">
                              <div className="grid grid-cols-12 gap-y-10 gap-x-8">
                                {(it.items || []).map(subItem => renderItem(subItem, true))}
                              </div>
                            </div>
                          </GlassCard>
                        ))}
                      </div>
                    );
                  }

                  if (it.kind === 'group') {
                    if (!isVisible(it.logic)) return null;
                    const colSpan = it.layout?.colSpan || 12;
                    return (
                      <div key={it.id} className={`${COL_SPAN[colSpan]} grid grid-cols-12 gap-x-8 gap-y-10 p-8 rounded-2xl bg-white/5 border border-glass-border/30 border-dashed ${isNested ? '' : 'col-span-full'}`}>
                        {(it.fields || []).map(f => renderItem(f, true))}
                      </div>
                    );
                  }

                    if (it.kind === 'field') {
                      if (!isVisible(it.logic)) return null;
                      const colSpan = it.layout?.colSpan || 12;
                      const error = previewErrors[it.id];

                      return (
                        <div key={it.id} className={`${COL_SPAN[colSpan]} ${isNested ? "" : "w-full"}`}>
                          <div className="transition-all duration-300">
                          {it.type === 'image' ? (
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-text-muted/70 flex items-center gap-1">
                                {it.label}
                                {it.properties?.required && <span className="text-red-500">*</span>}
                              </label>
                              <div className="relative border-2 border-dashed border-glass-border rounded-2xl p-10 flex flex-col items-center justify-center gap-3 bg-white/5 hover:bg-white/10 transition-all cursor-pointer group/upload text-center">
                                <input 
                                  type="file" 
                                  className="absolute inset-0 opacity-0 cursor-pointer" 
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onloadend = async () => {
                                        const base64 = reader.result as string;
                                        try {
                                          const res = await uploadImage(base64, file.name, file.type);
                                          setPreviewData(prev => ({ ...prev, [it.id]: res.uuid }));
                                          showSnackbar('Image uploaded successfully!', 'success');
                                        } catch (err) { showSnackbar('Upload failed', 'error'); }
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                                <div className="p-4 rounded-full bg-primary/10 text-primary group-hover/upload:scale-110 transition-transform mx-auto">
                                  <Plus size={32} />
                                </div>
                                <p className="text-sm font-bold text-text-muted">
                                  {previewData[it.id] ? `Uploaded: ${previewData[it.id].substring(0,8)}...` : 'Click to upload image'}
                                </p>
                                <p className="text-[10px] text-text-muted/50 uppercase tracking-widest font-black">Base64 Flow</p>
                              </div>
                            </div>
                          ) : it.type === 'key-value' ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between group/label pr-1">
                                <label className="text-sm font-bold text-text-muted/70 flex items-center gap-1">
                                  {it.label}
                                  {it.properties?.required && <span className="text-red-500">*</span>}
                                </label>
                                {(it.properties?.showPlusIcon || it.properties?.allowMultiple !== false) && (
                                  <div className="flex items-center gap-2">
                                    {it.properties?.showPlusIcon && (
                                      <button 
                                        type="button"
                                        className="p-1 text-slate-400 hover:text-primary transition-colors"
                                        onClick={() => alert(`Plus Clicked for Field: ${it.label}`)}
                                      >
                                        <Plus size={14} />
                                      </button>
                                    )}
                                    {it.properties?.allowMultiple !== false && (
                                      <button 
                                        type="button"
                                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10 transition-all text-[10px] font-black uppercase tracking-widest"
                                        onClick={() => {
                                          const current = Array.isArray(previewData[it.id]) ? previewData[it.id] : (previewData[it.id] ? [previewData[it.id]] : [{key: '', value: ''}]);
                                          setPreviewData(prev => ({ ...prev, [it.id]: [...current, { key: '', value: '' }] }));
                                        }}
                                      >
                                        <PlusIcon size={12} /> Add Pair
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              <div className="space-y-4">
                                {(Array.isArray(previewData[it.id]) ? previewData[it.id] : [previewData[it.id] || {key: '', value: ''}]).map((row: any, rIdx: number, arr: any[]) => (
                                  <div key={rIdx} className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative group/kv">
                                    <div className="space-y-1.5">
                                      <p className="text-[9px] font-black uppercase text-text-muted tracking-widest ml-1">Key / Property</p>
                                      {it.dropdownId ? (
                                        <CustomSelect 
                                          options={availableDropdowns.find(d => d.id === it.dropdownId)?.options.map((o: any) => ({ label: o.label, value: o.value })) || []}
                                          value={row.key || ''}
                                          onChange={(val: string) => {
                                            const newRows = [...arr];
                                            newRows[rIdx] = { ...newRows[rIdx], key: val };
                                            setPreviewData(prev => ({ ...prev, [it.id]: newRows }));
                                          }}
                                          placeholder="Select Key"
                                        />
                                      ) : (
                                        <Input 
                                          value={row.key || ''}
                                          onChange={(e: any) => {
                                            const newRows = [...arr];
                                            newRows[rIdx] = { ...newRows[rIdx], key: e.target.value };
                                            setPreviewData(prev => ({ ...prev, [it.id]: newRows }));
                                          }}
                                          placeholder="Enter Key"
                                        />
                                      )}
                                    </div>
                                    <div className="space-y-1.5 relative">
                                      <p className="text-[9px] font-black uppercase text-text-muted tracking-widest ml-1">Value / Data</p>
                                      <div className="flex gap-2 items-center">
                                        <Input 
                                          value={row.value || ''}
                                          onChange={(e: any) => {
                                            const newRows = [...arr];
                                            newRows[rIdx] = { ...newRows[rIdx], value: e.target.value };
                                            setPreviewData(prev => ({ ...prev, [it.id]: newRows }));
                                          }}
                                          onKeyDown={(e: any) => {
                                            if (e.key === 'Tab' && !e.shiftKey && rIdx === arr.length - 1 && it.properties?.allowMultiple !== false) {
                                              const newRows = [...arr, { key: '', value: '' }];
                                              setPreviewData(prev => ({ ...prev, [it.id]: newRows }));
                                            }
                                          }}
                                          placeholder={it.properties?.placeholder || "Enter Value"}
                                        />
                                        {it.properties?.allowMultiple !== false && arr.length > 1 && (
                                          <button 
                                            onClick={() => {
                                              const newRows = arr.filter((_, i) => i !== rIdx);
                                              setPreviewData(prev => ({ ...prev, [it.id]: newRows }));
                                            }}
                                            className="shrink-0 w-11 h-11 flex items-center justify-center rounded-xl bg-red-500/5 border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover/kv:opacity-100"
                                          >
                                            <X size={16} />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : it.type === 'accordion' ? (
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-text-muted/70 flex items-center gap-1">
                                {it.label}
                                {it.properties?.required && <span className="text-red-500">*</span>}
                              </label>
                              <div className="w-full rounded-2xl border border-glass-border overflow-hidden bg-white/5">
                                <div className="p-4 flex items-center justify-between font-bold text-sm bg-white/5">
                                  <span>{it.label} Section</span>
                                  <ChevronDown size={16} />
                                </div>
                                <div className="p-4 pt-0 border-t border-glass-border/10">
                                  <p className="text-xs text-text-muted mt-4 italic">
                                    {it.properties?.accordionStyle === 'bullets' ? '• Bullet point preview' : 'Key: Value preview'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : it.type === 'offers' ? (
                            <div className="space-y-4">
                              <label className="text-sm font-bold text-text-muted/70 flex items-center gap-1">
                                {it.label}
                                {it.properties?.required && <span className="text-red-500">*</span>}
                              </label>
                              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                                {(Array.isArray(it.options) ? it.options : [{ label: 'Offer Title', value: 'Preview of offer description and details.', footer: 'View Offers >' }]).map((offer: any, idx) => (
                                  <div key={idx} className="shrink-0 w-64 p-5 rounded-2xl border border-glass-border bg-white/5 space-y-3">
                                    <p className="text-xs font-black uppercase tracking-widest text-primary">{offer.label}</p>
                                    <p className="text-sm font-bold line-clamp-2">{offer.value}</p>
                                    <p className="text-[10px] font-black text-primary/60">{offer.footer}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : it.type === 'sku' ? (
                              <Input 
                                label={it.label} 
                                disabled={!it.properties?.editable} 
                                value={previewData[it.id] || `${it.properties?.prefix || 'SKU'}-XXXXX`} 
                                onChange={(e: any) => setPreviewData(prev => ({ ...prev, [it.id]: e.target.value }))}
                                inputClassName="!h-12" 
                              />
                          ) : it.type === 'select' || it.type === 'addable-select' ? (
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-text-muted/70 flex items-center gap-1">
                                {it.label}
                                {it.properties?.required && <span className="text-red-500">*</span>}
                              </label>
                              <CustomSelect 
                                options={(it.options || []).map((opt: any) => {
                                  if (typeof opt === 'string') return { label: opt, value: opt };
                                  return { label: opt.label || opt.value || 'Option', value: opt.value || opt.id || String(opt) };
                                })}
                                value={previewData[it.id] || ''}
                                onChange={(val: string) => setPreviewData(prev => ({ ...prev, [it.id]: val }))}
                                placeholder={it.properties?.placeholder || "Select option"}
                                onAddNew={it.type === 'addable-select' ? () => {
                                  const val = prompt('Enter new option name:');
                                  if (val) {
                                    const updateRecursive = (items: BuilderItem[]): BuilderItem[] => {
                                      return items.map(item => {
                                        if (item.id === it.id && item.kind === 'field') {
                                          return { ...item, options: [...(item.options || []), val] };
                                        }
                                        if (item.kind === 'section') return { ...item, items: updateRecursive(item.items) as (FormField | FormGroup)[] };
                                        if (item.kind === 'group') return { ...item, fields: updateRecursive(item.fields) as FormField[] };
                                        return item;
                                      });
                                    };
                                    setBuilderItems(updateRecursive(builderItems));
                                  }
                                } : undefined}
                                addNewLabel={it.properties?.addButtonTitle || "Add New"}
                                required={it.properties?.required}
                              />
                            </div>
                          ) : it.type === 'checkbox' ? (
                            <div className="space-y-3">
                              {!it.properties?.hideLabel && (
                                <label className="text-sm font-bold text-text-muted/70 flex items-center gap-1">
                                  {it.label}
                                  {it.properties?.required && <span className="text-red-500">*</span>}
                                </label>
                              )}
                              <div className="flex flex-wrap gap-6">
                                {(it.options || ['Option 1']).map((opt: any, idx) => {
                                  const val = typeof opt === 'string' ? opt : (opt.value || opt.id || idx);
                                  const label = typeof opt === 'string' ? opt : (opt.label || opt.value || 'Option');
                                  const key = typeof opt === 'string' ? opt : (opt.id || opt.value || idx);
                                  return (
                                    <label key={key} className="flex items-center gap-2 cursor-pointer group">
                                      <input 
                                        type="checkbox" 
                                        className="hidden" 
                                        onChange={(e) => {
                                          const current = previewData[it.id] || [];
                                          const newVal = e.target.checked ? [...current, val] : current.filter((o: string) => o !== val);
                                          setPreviewData(prev => ({ ...prev, [it.id]: newVal }));
                                        }}
                                      />
                                      <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${(previewData[it.id] || []).includes(val) ? 'bg-primary border-primary' : 'border-transparent bg-white/5'}`}>
                                        {(previewData[it.id] || []).includes(val) && <Check size={12} className="text-white" strokeWidth={4} />}
                                      </div>
                                      <span className="text-sm font-bold text-text-main">{label}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          ) : it.type === 'radio' ? (
                            <div className="space-y-3">
                              {!it.properties?.hideLabel && (
                                <label className="text-sm font-bold text-text-muted/70 flex items-center gap-1">
                                  {it.label}
                                  {it.properties?.required && <span className="text-red-500">*</span>}
                                </label>
                              )}
                              <div className="flex flex-wrap gap-6">
                                {(it.options || ['Option 1']).map((opt: any, idx) => {
                                  const val = typeof opt === 'string' ? opt : (opt.value || opt.id || idx);
                                  const label = typeof opt === 'string' ? opt : (opt.label || opt.value || 'Option');
                                  const key = typeof opt === 'string' ? opt : (opt.id || opt.value || idx);
                                  return (
                                    <label key={key} className="flex items-center gap-2 cursor-pointer group">
                                      <input 
                                        type="radio" 
                                        name={it.id} 
                                        className="hidden" 
                                        onChange={() => setPreviewData(prev => ({ ...prev, [it.id]: val }))}
                                      />
                                      <div className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${previewData[it.id] === val ? 'bg-primary border-primary' : 'border-transparent bg-white/5'}`}>
                                        {previewData[it.id] === val && <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />}
                                      </div>
                                      <span className="text-sm font-bold text-text-main">{label}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          ) : it.type === 'textarea' ? (
                            <div className="space-y-2">
                               <label className="text-sm font-bold text-text-muted/70 flex items-center gap-1">
                                {it.label}
                                {it.properties?.required && <span className="text-red-500">*</span>}
                              </label>
                              <textarea
                                value={previewData[it.id] || ''}
                                onChange={(e) => setPreviewData(prev => ({ ...prev, [it.id]: e.target.value }))}
                                placeholder={it.properties?.placeholder || `Enter ${it.label}...`}
                                required={it.properties?.required}
                                className="w-full min-h-[120px] p-4 rounded-2xl bg-white/5 border-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all text-text-main placeholder:text-text-muted/30 outline-none"
                              />
                            </div>
                          ) : it.type === 'bundle-items' ? (
                            <div className="space-y-4 my-4">
                              <div className="p-10 border-2 border-dashed border-glass-border rounded-3xl bg-white/5 flex flex-col items-center justify-center gap-4 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                  <Package size={32} />
                                </div>
                                <div>
                                  <p className="text-lg font-bold text-text-main">Bundle Items Picker</p>
                                  <p className="text-sm text-text-muted italic">User will see product selection UI here</p>
                                </div>
                                <Button variant="outline" size="sm" className="bg-white/5 cursor-not-allowed" disabled>
                                  {it.properties?.addButtonTitle || 'Add Product'}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                               <label className="text-sm font-bold text-text-muted/70 flex items-center gap-1">
                                {it.label}
                                {it.properties?.required && <span className="text-red-500">*</span>}
                              </label>
                              <Input
                                type={it.type === 'number' ? 'number' : it.type === 'date' ? 'date' : 'text'}
                                value={previewData[it.id] || ''}
                                onChange={(e: any) => setPreviewData(prev => ({ ...prev, [it.id]: e.target.value }))}
                                placeholder={it.properties?.placeholder || `Enter ${it.label}...`}
                                inputClassName="!h-12"
                                min={it.properties?.min}
                                max={it.properties?.max}
                                required={it.properties?.required}
                              />
                            </div>
                          )}
                          </div>
                          {error && (
                            <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mt-2 ml-1 flex items-center gap-1.5 animate-in slide-in-from-top-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                              {error}
                            </p>
                          )}
                        </div>
                      );
                    }
                  return null;
                };

                return renderItem(item);
              })}
            </div>
          </div>
        )}

        {activeTab === 'layout' && (
          <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="text-center space-y-4 py-8 border-b border-glass-border/50">
               <div className="flex items-center justify-center gap-4 mb-2">
                 <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <Columns size={24} />
                 </div>
                 <h1 className="text-4xl font-black text-text-main tracking-tight">Layout Editor</h1>
               </div>
               <p className="text-text-muted text-lg font-medium opacity-70">Use controls to reorder sections, adjust grid columns, and field widths.</p>
            </div>

            <div className="grid grid-cols-12 gap-6 pb-40 px-2 lg:px-0">
              {builderItems.map((item, idx) => {
                const colSpan = item.layout?.colSpan || 12;
                    return (
                        <div key={item.id} className={`${COL_SPAN[colSpan]} group/layout-container`}>
                          <div className={`p-1 rounded-3xl transition-all ${activeTab === 'layout' ? 'hover:ring-2 ring-primary/20 hover:bg-white/2' : ''}`}>
                            {item.kind === 'section' ? (
                              <div className="space-y-4">
                                <div className="flex items-center justify-between px-2 bg-white/5 py-3 rounded-2xl border border-glass-border">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                      <Columns size={14} />
                                    </div>
                                    <div>
                                      <h3 className="text-sm font-bold text-text-main line-clamp-1">{item.name}</h3>
                                      <p className="text-[9px] font-black uppercase text-text-muted tracking-widest leading-none">Form Section</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5 opacity-0 group-hover/layout-container:opacity-100 transition-opacity">
                                      <button 
                                        onClick={() => moveBuilderItem(idx, 'up')}
                                        disabled={idx === 0}
                                        className="p-1.5 hover:bg-white/10 rounded-lg text-text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                      >
                                        <ChevronUp size={16} />
                                      </button>
                                      <button 
                                        onClick={() => moveBuilderItem(idx, 'down')}
                                        disabled={idx === builderItems.length - 1}
                                        className="p-1.5 hover:bg-white/10 rounded-lg text-text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                      >
                                        <ChevronDown size={16} />
                                      </button>
                                    </div>
                                  </div>
                            </div>
                            
                                <div className="grid grid-cols-12 gap-4 p-5 rounded-[2rem] bg-white/[0.03] border border-dashed border-glass-border/50 min-h-[100px]">
                                  {(item.items || []).map((sub, sidx) => (
                                    <div key={sub.id} className={`${COL_SPAN[sub.layout?.colSpan || 12]} group/layout-item`}>
                                      {sub.kind === 'field' ? (
                                        <FieldItem 
                                          field={sub as FormField} 
                                          parentId={item.id} 
                                          index={sidx}
                                          isLayoutMode
                                          onUpdate={(u) => updateItem(sub.id, u)}
                                          onRemove={() => removeItem(sub.id)}
                                          onMove={(dir) => moveNestedItem(item.id, sidx, dir)}
                                          onEditLogic={() => {}}
                                          onEditOptions={() => {}}
                                          onEditProperties={() => {}}
                                        />
                                      ) : (
                                        <div className="p-4 rounded-[1.5rem] border border-glass-border bg-white/[0.02] border-dashed space-y-4">
                                          <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                                                  <Layers size={10} />
                                                </div>
                                                <span className="text-[10px] font-black uppercase text-text-muted tracking-widest italic opacity-50">Group Interior</span>
                                              </div>
                                              <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1 opacity-0 group-hover/layout-item:opacity-100 transition-opacity mr-2">
                                                  <button 
                                                    onClick={() => moveNestedItem(item.id, sidx, 'up')}
                                                    disabled={sidx === 0}
                                                    className="p-1 hover:bg-white/10 rounded-lg text-text-muted hover:text-primary disabled:opacity-20 transition-all"
                                                  >
                                                    <ChevronUp size={14} />
                                                  </button>
                                                  <button 
                                                    onClick={() => moveNestedItem(item.id, sidx, 'down')}
                                                    disabled={sidx === item.items.length - 1}
                                                    className="p-1 hover:bg-white/10 rounded-lg text-text-muted hover:text-primary disabled:opacity-20 transition-all"
                                                  >
                                                    <ChevronDown size={14} />
                                                  </button>
                                                </div>
                                            </div>
                                        </div>
                                        
                                          <div className="grid grid-cols-12 gap-3 min-h-[60px]">
                                              {((sub as FormGroup).fields || []).map((f: any, fi: number) => (
                                                <FieldItem 
                                                  key={f.id}
                                                  field={f as FormField}
                                                  parentId={sub.id}
                                                  index={fi}
                                                  isLayoutMode
                                                  onUpdate={(u) => updateItem(f.id, u)}
                                                  onRemove={() => removeItem(f.id)}
                                                  onMove={(dir) => moveNestedItem(sub.id, fi, dir)}
                                                  onEditLogic={() => {}}
                                                  onEditOptions={() => {}}
                                                  onEditProperties={() => {}}
                                                />
                                              ))}
                                          </div>
                                        </div>
                                      )}
                                  </div>
                                  ))}
                                </div>
                              </div>
                        ) : item.kind === 'group' ? (
                          <div className={`p-1 rounded-3xl bg-white/5 border border-glass-border border-dashed space-y-4 ${COL_SPAN[colSpan]}`}>
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-glass-border group/layout-item">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                                    <Layers size={14} />
                                  </div>
                                  <div>
                                    <h3 className="text-sm font-bold text-text-main">Standalone Group</h3>
                                    <p className="text-[9px] font-black uppercase text-text-muted tracking-widest leading-none">Layout Container</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-1 opacity-0 group-hover/layout-item:opacity-100 transition-opacity">
                                    <button 
                                      onClick={() => moveBuilderItem(idx, 'up')}
                                      disabled={idx === 0}
                                      className="p-1.5 hover:bg-white/10 rounded-lg text-text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                      <ChevronUp size={16} />
                                    </button>
                                    <button 
                                      onClick={() => moveBuilderItem(idx, 'down')}
                                      disabled={idx === builderItems.length - 1}
                                      className="p-1.5 hover:bg-white/10 rounded-lg text-text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                      <ChevronDown size={16} />
                                    </button>
                                  </div>
                              </div>
                            </div>
                            

                              <div className="grid grid-cols-12 gap-4 p-5 min-h-[100px]">
                                  {(item.fields || []).map((f, fi) => (
                                    <FieldItem 
                                      key={f.id}
                                      field={f}
                                      parentId={item.id}
                                      index={fi}
                                      isLayoutMode
                                      onUpdate={(u) => updateItem(f.id, u)}
                                      onRemove={() => removeItem(f.id)}
                                      onMove={() => {}}
                                      onEditLogic={() => {}}
                                      onEditOptions={() => {}}
                                      onEditProperties={() => {}}
                                    />
                                  ))}
                              </div>

                          </div>
                        ) : (
                          <div>
                            <FieldItem 
                              field={item} 
                              parentId={null} 
                              index={builderItems.indexOf(item)}
                              isLayoutMode
                              onUpdate={(u) => updateItem(item.id, u)}
                              onRemove={() => removeItem(item.id)}
                              onMove={() => {}}
                              onEditLogic={() => {}}
                              onEditOptions={() => {}}
                              onEditProperties={() => {}}
                            />
                          </div>
                        )}
                        </div>
                      </div>
                    );
                  })}
                </div>
          </div>
        )}
      </div>
      
      {/* Properties Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setEditingItemId(null);
          setDrawerMode(null);
        }}
        title={drawerMode === 'options' ? 'Manage Options' : drawerMode === 'logic' ? 'Conditional Visibility' : 'Field Properties'}
        widthClassName="max-w-4xl"
      >
        <div className="p-6 space-y-8 flex flex-col">
          {activeItem && (
            <>
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Editing {activeItem.kind}</p>
                <h3 className="text-lg font-bold text-text-main">
                  {activeItem.kind === 'section' ? activeItem.name : activeItem.kind === 'group' ? 'Group' : activeItem.label}
                </h3>
              </div>

              {drawerMode === 'options' && activeItem.kind === 'field' && (
                <div className="space-y-6 flex-1 overflow-y-auto pr-2">
                  {(activeItem.type === 'checkbox' || activeItem.type === 'radio') && (
                    <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-glass-border cursor-pointer hover:bg-white/10 transition-all group mb-4">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">Hide Field Label</p>
                        <p className="text-xs text-text-muted">Hide the main label for this field group</p>
                      </div>
                      <input 
                        type="checkbox"
                        checked={activeItem.properties?.hideLabel || false}
                        onChange={(e: any) => updateFieldProperty(activeItem.id, 'hideLabel', e.target.checked)}
                        className="w-5 h-5 rounded border-glass-border text-primary focus:ring-primary/50 bg-white/10 checkbox-custom"
                      />
                    </label>
                  )}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Reusable Dropdown</label>
                      <CustomSelect 
                        options={[
                          { label: 'Manual Entry (Ad-hoc)', value: '' },
                          ...availableDropdowns.map(d => ({ label: d.name, value: d.id }))
                        ]}
                        value={activeItem.dropdownId || ''}
                        onChange={(val: string) => {
                          const dropdownId = val;
                          const selectedDropdown = availableDropdowns.find(d => d.id === dropdownId);
                          updateItem(activeItem.id, { 
                            dropdownId: dropdownId || undefined,
                            options: selectedDropdown ? selectedDropdown.options : activeItem.options
                          });
                        }}
                      />
                    </div>

                    {!activeItem.dropdownId ? (
                      <div className="space-y-4 pt-4 border-t border-glass-border">
                        <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Manual Options</label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add new option..."
                            value={newOption}
                            onChange={(e: any) => setNewOption(e.target.value)}
                            onKeyPress={(e: any) => e.key === 'Enter' && addOption(activeItem.id, newOption)}
                            className="h-11!"
                          />
                          <Button 
                            onClick={() => addOption(activeItem.id, newOption)}
                            className="px-6"
                          >
                            Add
                          </Button>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {activeItem.options?.map((option: any, idx) => {
                            const label = typeof option === 'string' ? option : option.label;
                            const key = typeof option === 'string' ? option : option.id || idx;
                            return (
                              <div 
                                key={key} 
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-glass-border group/chip animate-in zoom-in-90 duration-300"
                              >
                                <span className="text-sm font-medium text-text-main">{label}</span>
                                <button
                                  onClick={() => removeOption(activeItem.id, option)}
                                  className="hover:text-red-500 transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            );
                          })}
                          {(!activeItem.options || activeItem.options.length === 0) && (
                            <div className="text-center py-10 w-full border-2 border-dashed border-glass-border rounded-2xl">
                              <p className="text-sm text-text-muted italic">No options added yet</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-4">
                        <div className="flex items-center gap-3 text-primary">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Check size={16} />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-black uppercase tracking-widest">Linked Dropdown</p>
                            <p className="text-lg font-bold text-text-main">{availableDropdowns.find(d => d.id === activeItem.dropdownId)?.name}</p>
                          </div>
                        </div>
                        <p className="text-xs text-text-muted leading-relaxed italic">
                          Options are synced from the library. To edit them, go to the 
                          <a 
                            href='/dashboard/forms/dropdowns'
                            target="_blank"
                            className="text-primary hover:underline ml-1 font-bold not-italic"
                          >
                            Dropdowns Manager
                          </a>.
                        </p>
                        <div className="pt-4 border-t border-glass-border">
                          <p className="text-[10px] font-black uppercase text-text-muted tracking-widest mb-3">Live Options</p>
                          <div className="flex flex-wrap gap-1.5 grayscale opacity-60">
                            {activeItem.options?.map((opt: any, idx) => {
                              const label = typeof opt === 'string' ? opt : opt.label;
                              const key = typeof opt === 'string' ? opt : opt.id || idx;
                              return (
                                <span key={key} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-glass-border">
                                  {label}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {drawerMode === 'properties' && activeItem.kind === 'field' && (
                <div className="space-y-6 flex-1 overflow-y-auto pr-2">
                  {activeItem.type === 'sku' && (
                    <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">SKU Prefix</label>
                      <Input 
                        value={activeItem.properties?.prefix || ''}
                        onChange={(e: any) => updateFieldProperty(activeItem.id, 'prefix', e.target.value)}
                        placeholder="e.g., RATE-..."
                        className="h-11! border-glass-border"
                      />
                    </div>
                    <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-glass-border cursor-pointer hover:bg-white/10 transition-all group">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">Allow Manual Editing</p>
                        <p className="text-xs text-text-muted">User can manually type the SKU if needed</p>
                      </div>
                      <input 
                        type="checkbox"
                        checked={activeItem.properties?.editable === true}
                        onChange={(e) => updateFieldProperty(activeItem.id, 'editable', e.target.checked)}
                        className="w-5 h-5 rounded border-glass-border text-primary focus:ring-primary/50 bg-white/10 checkbox-custom"
                      />
                    </label>
                  </>
                  )}
                  {activeItem.type === 'image' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Crop Aspect Ratio</label>
                        <CustomSelect 
                          options={[
                            { label: 'Square (1:1)', value: '1:1' },
                            { label: 'Landscape (4:3)', value: '4:3' },
                            { label: 'Portrait (3:4)', value: '3:4' },
                            { label: 'Landscape (16:9)', value: '16:9' },
                            { label: 'Portrait (9:16)', value: '9:16' },
                            { label: 'Free (No Constraint)', value: 'Free' },
                            { label: 'Custom', value: 'custom' }
                          ]}
                          value={['1:1', '4:3', '3:4', '16:9', 'Free'].includes(activeItem.properties?.aspectRatio || '1:1') ? (activeItem.properties?.aspectRatio || '1:1') : 'custom'}
                          onChange={(val: string) => {
                            if (val === 'custom') {
                              updateFieldProperty(activeItem.id, 'aspectRatio', '21:9'); 
                            } else {
                              updateFieldProperty(activeItem.id, 'aspectRatio', val);
                            }
                          }}
                          className="border-glass-border"
                        />
                      </div>
                      {(!['1:1', '4:3', '3:4', '16:9', '9:16', 'Free', 'custom'].includes(activeItem.properties?.aspectRatio || '1:1') || activeItem.properties?.aspectRatio === 'custom') && (
                        <div className="space-y-2 animate-in slide-in-from-top-1 duration-300 mb-2">
                          <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Manual Ratio (W:H)</label>
                          <Input 
                            value={activeItem.properties?.aspectRatio === 'custom' ? '' : activeItem.properties?.aspectRatio}
                            onChange={(e: any) => updateFieldProperty(activeItem.id, 'aspectRatio', e.target.value)}
                            placeholder="e.g., 21:9"
                            className="h-11! border-glass-border"
                          />
                          <p className="text-[9px] text-text-muted italic">Type width and height separated by colon (e.g. 21:9)</p>
                        </div>
                      )}
                      <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-glass-border cursor-pointer hover:bg-white/10 transition-all group">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">Multiple Images</p>
                          <p className="text-xs text-text-muted">Allow selecting more than one image</p>
                        </div>
                        <input 
                          type="checkbox"
                          checked={activeItem.properties?.allowMultiple !== false}
                          onChange={(e) => updateFieldProperty(activeItem.id, 'allowMultiple', e.target.checked)}
                          className="w-5 h-5 rounded border-glass-border text-primary focus:ring-primary/50 bg-white/10 checkbox-custom"
                        />
                      </label>
                    </div>
                  )}

                  {activeItem.type === 'key-value' && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Keys Dropdown Source</label>
                        <CustomSelect 
                          options={[
                            { label: 'Manual Entry (No Dropdown)', value: '' },
                            ...availableDropdowns.map(d => ({ label: d.name, value: d.id }))
                          ]}
                          value={activeItem.dropdownId || ''}
                          onChange={(val: string) => updateItem(activeItem.id, { dropdownId: val || undefined })}
                          className="border-glass-border"
                        />
                        <p className="text-[11px] text-text-muted italic">Select a dropdown to use its options as keys</p>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-glass-border">
                        <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Field Features</label>
                        <div className="space-y-3">
                          <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-glass-border cursor-pointer hover:bg-white/10 transition-all group">
                            <div className="flex-1">
                              <p className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">Multiple Rows</p>
                              <p className="text-xs text-text-muted">Allow adding multiple key-value pairs</p>
                            </div>
                            <input 
                              type="checkbox"
                              checked={activeItem.properties?.allowMultiple !== false}
                              onChange={(e: any) => updateFieldProperty(activeItem.id, 'allowMultiple', e.target.checked)}
                              className="w-5 h-5 rounded border-glass-border text-primary focus:ring-primary/50 bg-white/10 checkbox-custom"
                            />
                          </label>

                          <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-glass-border cursor-pointer hover:bg-white/10 transition-all group">
                            <div className="flex-1">
                              <p className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">Show Plus Icon</p>
                              <p className="text-xs text-text-muted">Show a custom action icon next to label</p>
                            </div>
                            <input 
                              type="checkbox"
                              checked={activeItem.properties?.showPlusIcon || false}
                              onChange={(e: any) => updateFieldProperty(activeItem.id, 'showPlusIcon', e.target.checked)}
                              className="w-5 h-5 rounded border-glass-border text-primary focus:ring-primary/50 bg-white/10 checkbox-custom"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeItem.type === 'addable-select' && (
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Add Button Title</label>
                        <Input 
                          value={activeItem.properties?.addButtonTitle || ''}
                          onChange={(e: any) => updateFieldProperty(activeItem.id, 'addButtonTitle', e.target.value)}
                          placeholder="e.g., Add New Product"
                          className="h-11! border-glass-border"
                        />
                    </div>
                  )}

                  {activeItem.type === 'accordion' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Content Style</label>
                        <CustomSelect 
                          options={[
                            { label: 'Key-Value Pairs', value: 'key-value' },
                            { label: 'Bullet Points', value: 'bullets' }
                          ]}
                          value={activeItem.properties?.accordionStyle || 'key-value'}
                          onChange={(val: string) => updateFieldProperty(activeItem.id, 'accordionStyle', val)}
                          className="border-glass-border"
                        />
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-glass-border">
                        <p className="text-xs text-text-muted italic leading-relaxed">
                          This creates an Amazon-style collapsible section. In the form, users will see the label as the clickable header.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeItem.type === 'offers' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Manage Offer Cards</label>
                        <button 
                          onClick={() => {
                            const current = Array.isArray(activeItem.options) ? activeItem.options : [];
                            updateItem(activeItem.id, { 
                              options: [...current, { label: 'New Offer', value: 'Discount Description', footer: 'View Offers >' }] 
                            });
                          }}
                          className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-light transition-colors"
                        >
                          + Add Card
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        {(Array.isArray(activeItem.options) ? activeItem.options : []).map((offer: any, idx: number) => (
                          <div key={idx} className="p-4 rounded-xl bg-white/5 border border-glass-border space-y-3 relative group/offer">
                            <button 
                              onClick={() => {
                                const next = (activeItem.options as any[]).filter((_, i) => i !== idx);
                                updateItem(activeItem.id, { options: next });
                              }}
                              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover/offer:opacity-100 transition-opacity z-10"
                            >
                              <X size={12} />
                            </button>
                            <Input 
                              value={offer.label || ''}
                              onChange={(e: any) => {
                                const next = [...(activeItem.options as any[])];
                                next[idx] = { ...next[idx], label: e.target.value };
                                updateItem(activeItem.id, { options: next });
                              }}
                              placeholder="Offer Title (e.g. Bank Offer)"
                              className="h-9 font-bold!"
                            />
                            <textarea 
                              value={offer.value || ''}
                              onChange={(e: any) => {
                                const next = [...(activeItem.options as any[])];
                                next[idx] = { ...next[idx], value: e.target.value };
                                updateItem(activeItem.id, { options: next });
                              }}
                              placeholder="Short Description..."
                              className="w-full bg-white/5 border border-glass-border rounded-lg p-2 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-primary min-h-[60px]"
                            />
                            <Input 
                              value={offer.footer || ''}
                              onChange={(e: any) => {
                                const next = [...(activeItem.options as any[])];
                                next[idx] = { ...next[idx], footer: e.target.value };
                                updateItem(activeItem.id, { options: next });
                              }}
                              placeholder="Footer Text (e.g. 2 offers >)"
                              className="h-8 text-[10px]!"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                   {activeItem.type === 'bundle-items' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Add Button Title</label>
                          <Input 
                            value={activeItem.properties?.addButtonTitle || ''}
                            onChange={(e: any) => updateFieldProperty(activeItem.id, 'addButtonTitle', e.target.value)}
                            placeholder="e.g., Select Unit/Item"
                            className="h-11! border-glass-border"
                          />
                      </div>
                    </div>
                  )}
                   {activeItem.type === 'number' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Min Value</label>
                          <Input 
                            type="number"
                            value={activeItem.properties?.min ?? ''}
                            onChange={(e: any) => updateFieldProperty(activeItem.id, 'min', e.target.value === '' ? undefined : Number(e.target.value))}
                            className="h-11! border-glass-border"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Max Value</label>
                          <Input 
                            type="number"
                            value={activeItem.properties?.max ?? ''}
                            onChange={(e: any) => updateFieldProperty(activeItem.id, 'max', e.target.value === '' ? undefined : Number(e.target.value))}
                            className="h-11! border-glass-border"
                          />
                        </div>
                      </div>

                      <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-glass-border cursor-pointer hover:bg-white/10 transition-all group">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">Use as Stock Field</p>
                          <p className="text-xs text-text-muted">Identify this field for stock management</p>
                        </div>
                        <input 
                          type="checkbox"
                          checked={activeItem.properties?.isStock || false}
                          onChange={(e: any) => updateFieldProperty(activeItem.id, 'isStock', e.target.checked)}
                          className="w-5 h-5 rounded border-glass-border text-primary focus:ring-primary/50 bg-white/10 checkbox-custom"
                        />
                      </label>
                    </div>
                  )}

                  {(activeItem.type === 'checkbox' || activeItem.type === 'radio') && (
                    <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-glass-border cursor-pointer hover:bg-white/10 transition-all group">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">Hide Field Label</p>
                        <p className="text-xs text-text-muted">Hide the main label for this field group</p>
                      </div>
                      <input 
                        type="checkbox"
                        checked={activeItem.properties?.hideLabel || false}
                        onChange={(e: any) => updateFieldProperty(activeItem.id, 'hideLabel', e.target.checked)}
                        className="w-5 h-5 rounded border-glass-border text-primary focus:ring-primary/50 bg-white/10 checkbox-custom"
                      />
                    </label>
                  )}

                  <div className="space-y-4 pt-6 border-t border-glass-border">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Placeholder Text</label>
                      <Input 
                        value={activeItem.properties?.placeholder || ''}
                        onChange={(e: any) => updateFieldProperty(activeItem.id, 'placeholder', e.target.value)}
                        placeholder="Enter placeholder..."
                        className="h-11! border-glass-border"
                      />
                    </div>
                    <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-glass-border cursor-pointer hover:bg-white/10 transition-all group">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">Required Field</p>
                        <p className="text-xs text-text-muted">Force user to fill this field</p>
                      </div>
                      <input 
                        type="checkbox"
                        checked={activeItem.properties?.required || false}
                        onChange={(e) => updateFieldProperty(activeItem.id, 'required', e.target.checked)}
                        className="w-5 h-5 rounded border-glass-border text-primary focus:ring-primary/50 bg-white/10 checkbox-custom"
                      />
                    </label>
                  </div>
                </div>
              )}

              {drawerMode === 'logic' && (
                <div className="space-y-6 flex-1 overflow-y-auto pr-2">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Visibility Rules</p>
                    <CustomSelect
                      options={[{ label: 'Match All (AND)', value: 'AND' }, { label: 'Match Any (OR)', value: 'OR' }]}
                      value={activeItem.logic?.type || 'AND'}
                      onChange={(val: string) => updateItem(activeItem.id, { 
                        logic: { ...(activeItem.logic || { conditions: [] }), type: val as any } 
                      })}
                      className="w-40!"
                    />
                  </div>

                  <div className="space-y-4">
                    {activeItem.logic?.conditions.map((cond, idx) => {
                      const allFields = getAllFieldsRecursive(builderItems);
                      const dependentField = allFields.find(f => f.id === cond.fieldId);
                      const fieldType = dependentField?.type || 'text';

                      // Define operators based on field type
                      let operators = [
                        { label: 'Equals', value: 'equals' },
                        { label: 'Not Equals', value: 'not_equals' },
                      ];

                      if (['text', 'select', 'radio', 'addable-select', 'checkbox'].includes(fieldType)) {
                        operators.push(
                          { label: 'Contains', value: 'contains' },
                          { label: 'Starts With', value: 'starts_with' },
                          { label: 'Ends With', value: 'ends_with' }
                        );
                      }
                      
                      if (fieldType === 'number' || fieldType === 'sku') {
                        operators.push(
                          { label: 'Greater Than', value: 'greater_than' },
                          { label: 'Less Than', value: 'less_than' }
                        );
                      }

                      if (fieldType === 'date') {
                        operators.push(
                          { label: 'Before', value: 'greater_than' }, // Using existing values for compatibility
                          { label: 'After', value: 'less_than' }
                        );
                      }

                      return (
                        <div key={idx} className="p-4 rounded-xl bg-white/5 border border-glass-border space-y-3 relative group/cond">
                          <button 
                            onClick={() => removeLogicCondition(activeItem.id, idx)}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover/cond:opacity-100 transition-opacity z-10"
                          >
                            <X size={12} />
                          </button>
                          
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Dependent on field</label>
                            <CustomSelect
                              options={allFields
                                .filter(f => f.id !== activeItem.id)
                                .map(f => ({ label: f.label, value: f.id }))}
                              value={cond.fieldId}
                              onChange={(val: string) => updateLogicCondition(activeItem.id, idx, { fieldId: val, value: '' })}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Operator</label>
                               <CustomSelect
                                options={operators}
                                value={cond.operator}
                                onChange={(val: string) => updateLogicCondition(activeItem.id, idx, { operator: val as any })}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Value</label>
                              {['select', 'radio', 'addable-select', 'checkbox'].includes(fieldType) ? (
                                <CustomSelect
                                  options={(dependentField?.options || []).map((opt: any) => ({ 
                                    label: typeof opt === 'string' ? opt : opt.label, 
                                    value: typeof opt === 'string' ? opt : opt.value 
                                  }))}
                                  value={cond.value}
                                  onChange={(val: string) => updateLogicCondition(activeItem.id, idx, { value: val })}
                                />
                              ) : (
                                <Input
                                  type={fieldType === 'number' ? 'number' : fieldType === 'date' ? 'date' : fieldType === 'color' ? 'color' : 'text'}
                                  value={cond.value}
                                  onChange={(e: any) => updateLogicCondition(activeItem.id, idx, { value: e.target.value })}
                                  placeholder="Value..."
                                  className="h-10! border-glass-border"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    <Button 
                      variant="outline" 
                      className="w-full border-dashed py-6"
                      icon={Plus}
                      onClick={() => addLogicCondition(activeItem.id)}
                    >
                      Add Condition
                    </Button>
                  </div>
                </div>
              )}

              <Button 
                variant="primary" 
                className="w-full h-12 shadow-lg shadow-primary/20"
                onClick={() => setIsDrawerOpen(false)}
              >
                Done
              </Button>
            </>
          )}
        </div>
      </Drawer>
      {/* New Mapping Modal (DEV ONLY) */}
      <Drawer
        isOpen={isNewMappingModalOpen}
        onClose={() => setIsNewMappingModalOpen(false)}
        title="Create New Form Mapping"
        widthClassName="max-w-2xl"
      >
        <div className="space-y-6">
          <Input 
            label="Form Name (Display Name)"
            placeholder="e.g. Add Product Inventory"
            value={newMapping.name}
            onChange={(e: any) => setNewMapping(prev => ({ ...prev, name: e.target.value }))}
          />
          <Input 
            label="Form Key (Unique Identifier)"
            placeholder="e.g. add-inventory"
            value={newMapping.formKey}
            onChange={(e: any) => setNewMapping(prev => ({ ...prev, formKey: e.target.value }))}
          />
          <div className="flex gap-4 pt-4">
            <Button 
               className="flex-1"
               onClick={handleCreateMapping}
               disabled={isCreatingMapping}
            >
              {isCreatingMapping ? 'Creating...' : 'Create Mapping'}
            </Button>
            <Button 
               variant="outline"
               className="flex-1"
               onClick={() => setIsNewMappingModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Drawer>
  </DashboardLayout>
);
};


// --- Helper Component for Insertion Menu ---
const PlusSeparator = ({ 
  containerId, 
  index, 
  allowedTypes, 
  onInsert 
}: { 
  containerId: string, 
  index: number, 
  allowedTypes: ('field' | 'section' | 'group' | 'key-value' | 'accordion' | 'offers')[],
  onInsert: (containerId: string, index: number, kind: any, type?: any) => void
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  return (
    <div className="relative h-10 group/plus flex items-center justify-center z-10 pointer-events-none">
      <div className="absolute inset-0 flex items-center px-4">
        <div className="w-full border-t-2 border-primary/5 group-hover/plus:border-primary/30 transition-all" />
      </div>
      <div className="relative pointer-events-auto" ref={menuRef}>
        <button 
          onClick={() => setShowMenu(!showMenu)}
          className={`
            relative z-30 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-xl
            ${showMenu 
              ? 'bg-primary text-white scale-110 rotate-45' 
              : 'bg-glass-bg border border-glass-border text-text-muted hover:text-white hover:bg-primary hover:border-primary opacity-0 scale-50 group-hover/plus:opacity-100 group-hover/plus:scale-100'}
          `}
        >
          <Plus size={16} />
        </button>

        {showMenu && (
          <div className="absolute left-1/2 -translate-x-1/2 top-10 w-48 bg-glass-bg/90 backdrop-blur-xl border border-glass-border rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
            <p className="px-3 py-1.5 text-[10px] font-black uppercase text-text-muted tracking-widest border-b border-glass-border mb-1">Add New Item</p>
            {allowedTypes.includes('field') && (
              <button 
                onClick={() => { onInsert(containerId, index, 'field'); setShowMenu(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-main hover:bg-white/10 transition-colors group"
              >
                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center group-hover:bg-primary/20">
                  <CheckSquare size={14} className="text-primary" />
                </div>
                Add Field
              </button>
            )}
            {allowedTypes.includes('section') && (
              <button 
                onClick={() => { onInsert(containerId, index, 'section'); setShowMenu(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-main hover:bg-white/10 transition-colors group"
              >
                <div className="w-6 h-6 rounded-md bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20">
                  <Layout size={14} className="text-secondary" />
                </div>
                Add Section
              </button>
            )}
            {allowedTypes.includes('group') && (
              <button 
                onClick={() => { onInsert(containerId, index, 'group'); setShowMenu(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-main hover:bg-white/10 transition-colors group"
              >
                <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20">
                  <LayoutGrid size={14} className="text-blue-400" />
                </div>
                Add Group
              </button>
            )}
             {allowedTypes.includes('key-value') && (
              <button 
                onClick={() => { onInsert(containerId, index, 'field', 'key-value'); setShowMenu(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-main hover:bg-white/10 transition-colors group"
              >
                <div className="w-6 h-6 rounded-md bg-yellow-500/10 flex items-center justify-center group-hover:bg-yellow-500/20">
                  <Grid size={14} className="text-yellow-400" />
                </div>
                Add Key Value
              </button>
            )}
            {allowedTypes.includes('field') && (
              <>
                <button 
                  onClick={() => { onInsert(containerId, index, 'field', 'accordion'); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-main hover:bg-white/10 transition-colors group"
                >
                  <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20">
                    <ChevronDown size={14} className="text-emerald-500" />
                  </div>
                  Add Accordion
                </button>
                <button 
                  onClick={() => { onInsert(containerId, index, 'field', 'offers'); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-main hover:bg-white/10 transition-colors group"
                >
                  <div className="w-6 h-6 rounded-md bg-rose-500/10 flex items-center justify-center group-hover:bg-rose-500/20">
                    <Gift size={14} className="text-rose-500" />
                  </div>
                  Add Offers
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
