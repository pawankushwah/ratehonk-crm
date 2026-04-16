/**
 * Utility for dynamic field lookup and rendering in the CRM Retail app.
 * This helps decouple the UI from hardcoded field IDs.
 */

export type FieldRoleType = 
| 'text' 
| 'textarea' 
| 'number' 
| 'select' 
| 'checkbox' 
| 'radio' 
| 'addable-select'
| 'color' 
| 'date' 
| 'image' 
| 'sku' 
| 'barcode' 
| 'bundle-items'
| 'key-value'
// Product specific fields
| 'title'
| 'price'
| 'description'
| 'category'
| 'stock'
| 'badge'
| 'grid'
| 'table'
| 'colors'
| 'sizes'
| 'carousel';

export interface FieldRole {
  role: FieldRoleType;
  keywords: string[];
}

const ROLES: FieldRole[] = [
  { role: 'title', keywords: ['name', 'title', 'product', 'item'] },
  { role: 'price', keywords: ['price', 'cost', 'msrp', 'rate'] },
  { role: 'description', keywords: ['description', 'about', 'details', 'summary'] },
  { role: 'image', keywords: ['image', 'photo', 'picture', 'gallery', 'media', 'imageurl', 'thumbnail'] },
  { role: 'category', keywords: ['category', 'type', 'group', 'tag'] },
  { role: 'sku', keywords: ['sku', 'id', 'code', 'productid'] },
  { role: 'stock', keywords: ['stock', 'quantity', 'qty', 'count', 'inventory', 'available'] },
  { role: 'badge', keywords: ['badge', 'status', 'label', 'condition'] },
  { role: 'grid', keywords: ['grid', 'features', 'highlights', 'list'] },
  { role: 'table', keywords: ['table', 'specification', 'details', 'specs', 'properties'] },
  { role: 'colors', keywords: ['color', 'choice', 'shade', 'tint', 'variant', 'availablecolors'] },
  { role: 'sizes', keywords: ['size', 'dimension', 'fit', 'option', 'checkbox', 'availablesizes'] },
  { role: 'barcode', keywords: ['barcode', 'upc', 'ean', 'code'] },
  { role: 'carousel', keywords: ['carousel', 'gallery', 'slideshow', 'media'] },
];

/**
 * Finds the field ID for a specific role within a template schema.
 * 1. Checks the design mapping first.
 * 2. Falls back to fuzzy matching labels against keywords.
 */
export const findFieldByRole = (role: FieldRoleType, template: any, searchContainerId?: string): string | null => {
  if (!template) return null;

  // 1. Check explicit mapping in design if available
  // Support mode-specific mappings if they were pre-resolved or direct check
  const design = template.design || template;
  
  // Try mapping candidates in order of specificity
  const mapping = 
    design.viewMapping && Object.keys(design.viewMapping).length > 0 ? design.viewMapping :
    design.cardMapping && Object.keys(design.cardMapping).length > 0 ? design.cardMapping :
    design.mapping && Object.keys(design.mapping).length > 0 ? design.mapping :
    template.mapping && Object.keys(template.mapping).length > 0 ? template.mapping : 
    {};
  
  if (mapping[role]) return mapping[role];

  // 2. Resolve items array from various possible locations in the template
  let items: any[] = [];
  if (Array.isArray(template.schema)) {
    items = template.schema;
  } else if (template.schema?.items) {
    items = template.schema.items;
  } else if (template.schema?.sections) {
    items = template.schema.sections;
  } else if (template.form_schema?.items) {
    items = template.form_schema.items;
  } else if (template.form_schema?.sections) {
    items = template.form_schema.sections;
  } else if (template.items) {
    items = template.items;
  }

  const roleConfig = ROLES.find(r => r.role === role);
  if (!roleConfig) return null;

  let foundId: string | null = null;

  const traverse = (currentItems: any[]) => {
    if (!Array.isArray(currentItems)) return;
    
    for (const item of currentItems) {
      if (foundId) break;

      // If we are looking in a specific container, skip other containers
      if (searchContainerId && (item.kind === 'section' || item.kind === 'group') && item.id !== searchContainerId) {
        // But do traverse into it if the target might be deeper inside the requested container
        // Wait, if searchContainerId is provided, the parent of the traverse call should be that container
      }

      if (item.kind === 'field') {
        const label = (item.label || '').toLowerCase();
        // Strict match or contains logic
        if (roleConfig.keywords.some(k => label === k || label.includes(k))) {
          foundId = item.id;
        }
      } else if (item.kind === 'section' || item.kind === 'group') {
        traverse(item.items || item.fields || []);
      }
    }
  };

  // If searchContainerId is provided, find that container first
  if (searchContainerId) {
    let targetSection: any = null;
    const findContainer = (currentItems: any[]) => {
      if (!Array.isArray(currentItems)) return;
      for (const item of currentItems) {
        if (targetSection) break;
        if (item.id === searchContainerId) {
          targetSection = item;
          break;
        }
        if (item.items || item.fields) findContainer(item.items || item.fields);
      }
    };
    findContainer(items);
    if (targetSection) traverse(targetSection.items || targetSection.fields || []);
  } else {
    traverse(items);
  }
  
  return foundId;
};

/**
 * Helper to determine if a value is empty.
 */
export const isEmptyValue = (val: any): boolean => {
  if (val === undefined || val === null || val === '—') return true;
  if (typeof val === 'string' && val.trim() === '') return true;
  if (Array.isArray(val) && val.length === 0) return true;
  return false;
};

/**
 * Gets the display value for a field role from a data object.
 * Supports nested fields and repeatable sections (e.g. Variants).
 */
export const getRoleValue = (role: FieldRoleType, product: any, template: any, variantData?: any): any => {
  const fieldId = findFieldByRole(role, template);
  const data = product?.data || product || {};

  // 0. Variant Override (Highest priority if variant is selected)
  if (variantData) {
    // A. Check if the globally mapped fieldId exists in this variant object
    if (fieldId && !isEmptyValue(variantData[fieldId])) return variantData[fieldId];
    
    // B. Check for the role name directly (e.g. variantData.price)
    if (!isEmptyValue(variantData[role])) return variantData[role];
    
    // C. Perform localized search if we can identify a parent container
    // This is useful if 'Price' in a variant is a different field ID than global 'Price'
    // but we can identify it by label/keyword within the variant's section.
    // However, findFieldByRole is an expensive traversal. We already did this in getNormalizedVariants.
    
    // Special image/price fallbacks for common naming patterns in variants
    if (role === 'image' && !isEmptyValue(variantData.imageUrl)) return variantData.imageUrl;
    if (role === 'image' && !isEmptyValue(variantData.image)) return variantData.image;
    if (role === 'price' && !isEmptyValue(variantData.price)) return variantData.price;
    if (role === 'stock' && !isEmptyValue(variantData.variant_stock)) return variantData.variant_stock;
  }
  
  if (!fieldId) {
    // Falls back to direct property access if role matches key in data
    // This is useful for templates using mock data without a full schema
    if (!isEmptyValue(data[role])) return data[role];
    
    // Check for common naming variations in mock data
    if (role === 'image' && !isEmptyValue(data.imageUrl)) return data.imageUrl;
    if (role === 'colors' && !isEmptyValue(data.availableColors)) return data.availableColors;
    if (role === 'sizes' && !isEmptyValue(data.availableSizes)) return data.availableSizes;
    
    return '—';
  }

  // 1. Try Top-Level Match (Skip if empty to allow deeper search)
  if (!isEmptyValue(data[fieldId])) {
    return data[fieldId];
  }

  // Fallback for previews: If fieldId is from a mapping but data[fieldId] is empty,
  // try the role name itself as a key (e.g. data['title']). 
  // This is essential for DesignTab previews where mock data uses role names.
  if (!isEmptyValue(data[role])) {
    return data[role];
  }

  // Check for common naming variations in mock data (even if fieldId exists)
  if (role === 'image' && !isEmptyValue(data.imageUrl)) return data.imageUrl;
  if (role === 'colors' && !isEmptyValue(data.availableColors)) return data.availableColors;
  if (role === 'sizes' && !isEmptyValue(data.availableSizes)) return data.availableSizes;

  // 2. Search deeper / collect from sections
  // For stock, we want all values to sum them up, not just UNIQUE ones
  const values = getRoleValues(role, product, template, role !== 'stock', variantData);
  
  // SPECIAL CASE: Stock Role (Aggregation across variants)
  if (role === 'stock' && values.length > 0) {
    const isNumeric = values.some(v => !isNaN(Number(v)));
    if (isNumeric) {
      return values.reduce((sum: number, v: any) => sum + (Number(v) || 0), 0);
    }
  }

  // DEFAULT: Take from first non-empty item found in deeper search
  return values.length > 0 ? values[0] : '—';
};

/**
 * Gets ALL values for a field role from a data object.
 * Useful for collecting variants (e.g., all available colors, sizes).
 */
export const getRoleValues = (role: FieldRoleType, product: any, template: any, unique: boolean = true, variantData?: any): any[] => {
  const fieldId = findFieldByRole(role, template);
  const data = product?.data || product || {};
  
  const values: any[] = [];

  // Use a recursive search that flattens arrays
  const traverseData = (obj: any) => {
    if (obj === null || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
      obj.forEach(item => traverseData(item));
    } else {
      for (const key in obj) {
        if (key === fieldId) {
          const val = obj[key];
          if (Array.isArray(val)) {
            val.forEach(v => {
              if (!isEmptyValue(v)) values.push(v);
            });
          } else {
            if (!isEmptyValue(val)) values.push(val);
          }
        } else if (typeof obj[key] === 'object') {
          traverseData(obj[key]);
        }
      }
    }
  };

  // 1. Collect from top level if not fieldId, or if it matches fieldId
  if (!fieldId) {
    if (!isEmptyValue(data[role])) {
      if (Array.isArray(data[role])) {
        data[role].forEach((v: any) => values.push(v));
      } else {
        values.push(data[role]);
      }
    }
  } else {
    // Collect from everywhere
    traverseData(data);
  }

  // FALLBACK: If we found nothing for list-style roles (colors, sizes),
  // extract them from the normalized variants list.
  if (values.length === 0 && (role === 'colors' || role === 'sizes')) {
    const variants = getNormalizedVariants(product, template);
    variants.forEach(v => {
      const val = role === 'colors' ? v.color : v.size;
      if (!isEmptyValue(val)) {
        if (Array.isArray(val)) values.push(...val);
        else values.push(val);
      }
    });
  }
  
  return unique ? Array.from(new Set(values)) : values;
};

/**
 * Formats a value for display based on role and field configuration.
 */
export const formatDisplayValue = (value: any, role: FieldRoleType, field?: any): string => {
  if (value === undefined || value === null || value === '—') return '—';

  if (role === 'price') {
    const num = Number(value);
    if (isNaN(num)) return String(value);
    const prefix = field?.properties?.prefix || '$';
    return `${prefix}${num.toLocaleString()}`;
  }

  if (Array.isArray(value)) {
    return value.map(v => (typeof v === 'object' ? (v.label || v.value || JSON.stringify(v)) : v)).join(', ');
  }

  if (typeof value === 'object') {
     return value.label || value.value || 'Complex Object';
  }

  return String(value);
};

/**
 * Resolves an image URL from various possible formats.
 */
export const resolveImageUrl = (val: any): string | null => {
  if (!val) return null;

  // Handle puck-style image objects or simple strings
  let img = val;
  if (Array.isArray(val)) img = val[0];
  
  if (!img) return null;

  const url = typeof img === 'string' ? img : (img.url || img.src || img.thumb || img.path);
  
  if (!url) return null;

  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('/')) {
    return url;
  }

  // Check if it's a UUID/ID for our internal API
  const apiBase = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || 'http://localhost:5001';
  return `${apiBase}/api/images/${url}`;
};

/**
 * Advanced: Identifies and extracts product variants from repeatable sections.
 * Robustly searches the schema for a repeatable section containing mapped roles.
 */
export const getNormalizedVariants = (product: any, template: any): any[] => {
  const data = product?.data || product || {};
  const design = template?.design || template || {};
  const mapping = design.mapping || {};

  // Resolve mapping for variants section specifically
  const variantsSectionId = mapping.variantsSection;
  let rawVariants: any[] = [];
  let targetSectionId;
  if (variantsSectionId && data[variantsSectionId] && Array.isArray(data[variantsSectionId])) {
    rawVariants = data[variantsSectionId];
    targetSectionId = variantsSectionId;
  }

  // Resolve schema items for fallback search
  let schemaItems: any[] = [];
  if (Array.isArray(template.schema)) schemaItems = template.schema;
  else if (template.schema?.items) schemaItems = template.schema.items;
  else if (template.schema?.sections) schemaItems = template.schema.sections;
  else if (template.form_schema?.items) schemaItems = template.form_schema.items;
  else if (template.form_schema?.sections) schemaItems = template.form_schema.sections;
  else if (template.items) schemaItems = template.items;

  // Determine the raw variant data source and identified section
  targetSectionId = variantsSectionId;
  
  if (rawVariants.length === 0) {
    // Find all repeatable sections as fallback
    const repeatableSections: any[] = [];
    const traverseSchema = (items: any[]) => {
      if (!Array.isArray(items)) return;
      for (const item of items) {
        if ((item.kind === 'section' || item.kind === 'group') && item.isRepeatable) {
          repeatableSections.push(item);
        }
        if (item.items || item.fields) {
          traverseSchema(item.items || item.fields);
        }
      }
    };
    traverseSchema(schemaItems);

    if (repeatableSections.length > 0) {
      // Find a temporary mapping to pick the best section
      const tempRoleFieldIds: Record<string, string> = {};
      ['price', 'stock', 'colors', 'sizes', 'image'].forEach(r => {
        const id = findFieldByRole(r as any, template);
        if (id) tempRoleFieldIds[r] = id;
      });

      const sectionScores = repeatableSections.map(section => {
        const sectionFieldIds = (section.items || section.fields || []).map((f: any) => f.id);
        const score = Object.values(tempRoleFieldIds).filter(id => sectionFieldIds.includes(id)).length;
        return { section, score };
      });

      const bestSectionMatch = sectionScores.sort((a, b) => b.score - a.score)[0];
      if (bestSectionMatch && bestSectionMatch.score > 0) {
        targetSectionId = bestSectionMatch.section.id;
        rawVariants = data[targetSectionId] || [];
      } else if (repeatableSections.length === 1) {
        // Fallback: If only one repeatable section, assume it's variants
        targetSectionId = repeatableSections[0].id;
        rawVariants = data[targetSectionId] || [];
      }
    }
  }

  if (!Array.isArray(rawVariants) || rawVariants.length === 0) return [];

  // Identify roles specifically within the target section
  const roleFieldIds: Record<string, string> = {};
  const roles: FieldRoleType[] = ['price', 'stock', 'colors', 'sizes', 'image'];
  
  roles.forEach(r => {
    // Try explicit mapping first
    const globalId = findFieldByRole(r, template);
    // Try localized search within the target section
    const localId = findFieldByRole(r, template, targetSectionId);
    
    if (localId) roleFieldIds[r] = localId;
    else if (globalId) roleFieldIds[r] = globalId;
  });

  // Transform raw section items into standardized Variant objects
  return rawVariants.map((item, index) => ({
    id: item.id || `variant-${index}`,
    price: item[roleFieldIds.price] !== undefined ? item[roleFieldIds.price] : (item.price || null),
    stock: item[roleFieldIds.stock] !== undefined ? item[roleFieldIds.stock] : (item.stock || null),
    color: item[roleFieldIds.colors] || item.color || item.value || null,
    size: item[roleFieldIds.sizes] || item.size || null,
    images: Array.isArray(item[roleFieldIds.image]) 
      ? item[roleFieldIds.image].map(resolveImageUrl).filter(Boolean)
      : [resolveImageUrl(item[roleFieldIds.image] || item.image || item.imageUrl)].filter(Boolean),
    rawData: item
  }));
};
