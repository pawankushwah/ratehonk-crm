
/**
 * Merges a base static template with its database-stored customizations.
 * The database structure drives the layout (positions/sections), while the 
 * static template provides core field properties and locking logic.
 */
export function mergeTemplate(staticTemplate: any, dbTemplate: any) {
  if (!staticTemplate) return dbTemplate;
  if (!dbTemplate) return staticTemplate;

  const staticSchema = Array.isArray(staticTemplate.schema) ? staticTemplate.schema : [];
  const dbSchema = Array.isArray(dbTemplate.schema) ? dbTemplate.schema : [];

  // Create lookup maps for all static elements (fields and sections)
  const staticItems = new Map();
  const traverseStatic = (items: any[]) => {
    (items || []).forEach(item => {
      staticItems.set(item.id, item);
      if (item.items) traverseStatic(item.items);
      if (item.fields) traverseStatic(item.fields);
    });
  };
  traverseStatic(staticSchema);

  const mergeItemList = (dbItems: any[]): any[] => {
    return (dbItems || []).map(dbItem => {
      const staticItem = staticItems.get(dbItem.id);
      if (staticItem) {
        // Force core properties for locked fields
        const mergedProperties = { ...staticItem.properties, ...dbItem.properties };
        
        // Re-enforce disabled properties from static
        if (staticItem.disabledProperties) {
          staticItem.disabledProperties.forEach((propKey: string) => {
            if (staticItem.properties && staticItem.properties[propKey] !== undefined) {
              mergedProperties[propKey] = staticItem.properties[propKey];
            }
          });
        }

        const mergedItem = {
          ...staticItem,
          ...dbItem, // id, kind, layout, logic from DB
          label: staticItem.disabledProperties?.includes('label') ? staticItem.label : (dbItem.label || staticItem.label),
          name: staticItem.disabledProperties?.includes('label') ? staticItem.name : (dbItem.name || staticItem.name),
          type: staticItem.disabledProperties?.includes('type') ? staticItem.type : (dbItem.type || staticItem.type),
          properties: mergedProperties,
          locked: staticItem.locked || false,
          disabledProperties: staticItem.disabledProperties || [],
          isStatic: true,
          isCustom: false
        };

        // Recursively merge sub-items if it's a section or group
        if (dbItem.items) {
          mergedItem.items = mergeItemList(dbItem.items);
        } else if (staticItem.items) {
          mergedItem.items = mergeItemList(staticItem.items);
        }

        if (dbItem.fields) {
          mergedItem.fields = mergeItemList(dbItem.fields);
        } else if (staticItem.fields) {
          mergedItem.fields = mergeItemList(staticItem.fields);
        }

        return mergedItem;
      }
      
      // Dynamic item. If it has sub-items, traverse them too
      if (dbItem.items || dbItem.fields) {
        const listKey = dbItem.items ? 'items' : 'fields';
        return {
          ...dbItem,
          isCustom: true,
          isStatic: false,
          [listKey]: mergeItemList(dbItem[listKey])
        };
      }

      return {
        ...dbItem,
        isCustom: true,
        isStatic: false
      };
    });
  };

  // 1. Build the merged schema using the DB version as the layout skeleton
  const mergedSchema = mergeItemList(dbSchema);

  // 2. Safety: Re-inject any static fields that were deleted but are 'locked'
  // and ensure they are placed in their original or logical section.
  // For simplicity, we just check if they exist anywhere in the merged schema.
  staticItems.forEach((staticItem, id) => {
    if (staticItem.locked) {
      const exists = (items: any[]): boolean => {
        return items.some(i => i.id === id || (i.items && exists(i.items)) || (i.fields && exists(i.fields)));
      };
      if (!exists(mergedSchema)) {
        // If it's a top-level field in static, put it at top-level in merged
        // Or find its static parent and try to insert it there.
        mergedSchema.unshift(staticItem); 
      }
    }
  });

  // 3. Merge Design, Mapping, etc.
  const mergedDesign = {
    ...(staticTemplate.design || {}),
    ...(dbTemplate.design || {}),
    styles: {
      ...(staticTemplate.design?.styles || {}),
      ...(dbTemplate.design?.styles || {}),
    },
    cardMapping: {
      ...(staticTemplate.design?.cardMapping || {}),
      ...(dbTemplate.design?.cardMapping || {}),
    },
    viewMapping: {
      ...(staticTemplate.design?.viewMapping || {}),
      ...(dbTemplate.design?.viewMapping || {}),
    }
  };

  return {
    ...staticTemplate,
    ...dbTemplate,
    schema: mergedSchema,
    design: mergedDesign,
    id: dbTemplate.id,
    formKey: staticTemplate.formKey || dbTemplate.formKey
  };
}
