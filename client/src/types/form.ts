import { DropdownOption } from '@/lib/dropdowns';

export interface LogicCondition {
  fieldId: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'starts_with' | 'ends_with';
  value: any;
}

export interface ConditionalLogic {
  type: 'AND' | 'OR';
  conditions: LogicCondition[];
}

export interface FormField {
  kind: 'field';
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'color' | 'date' | 'image' | 'sku' | 'barcode' | 'checkbox' | 'radio' | 'addable-select' | 'bundle-items' | 'key-value' | 'accordion' | 'offers';
  options?: (string | DropdownOption)[];
  dropdownId?: string;
  properties?: {
    prefix?: string;
    min?: number;
    max?: number;
    placeholder?: string;
    required?: boolean;
    allowMultiple?: boolean;
    addButtonTitle?: string;
    editable?: boolean;
    aspectRatio?: string;
    hideLabel?: boolean;
    showPlusIcon?: boolean;
    accordionStyle?: 'key-value' | 'bullets';
    isStock?: boolean;
  };
  locked?: boolean;
  disabledProperties?: string[];
  logic?: ConditionalLogic;
  layout?: {
    colSpan?: number | 'full';
  };
}

export interface FormGroup {
  kind: 'group';
  id: string;
  fields: FormField[];
  locked?: boolean;
  logic?: ConditionalLogic;
  layout?: {
    gridCols?: number;
    colSpan?: number | 'full';
  };
}

export interface FormSection {
  kind: 'section';
  id: string;
  name: string;
  isRepeatable: boolean;
  items: (FormField | FormGroup)[];
  locked?: boolean;
  logic?: ConditionalLogic;
  layout?: {
    gridCols?: number;
    colSpan?: number | 'full';
  };
}

export type BuilderItem = FormField | FormSection | FormGroup;
