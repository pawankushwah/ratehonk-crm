import React, { createContext, useContext } from 'react';

interface ProductData {
  data: Record<string, any>;
  template: any;
  selectedVariant?: any;
}

const ProductDataContext = createContext<ProductData | null>(null);

export const ProductDataProvider: React.FC<{ value: ProductData; children: React.ReactNode }> = ({ value, children }) => (
  <ProductDataContext.Provider value={value}>
    {children}
  </ProductDataContext.Provider>
);

export const useProductDelta = () => {
  const context = useContext(ProductDataContext);
  return context;
};

/**
 * Hook to resolve a fieldId to its current value from the current product or variant
 */
export const useResolvedField = (fieldId?: string) => {
  const context = useProductDelta();
  if (!context || !fieldId) return null;

  const { data, selectedVariant } = context;
  
  // 1. Check variant first (if applicable)
  if (selectedVariant && selectedVariant[fieldId] !== undefined) {
    return selectedVariant[fieldId];
  }

  // 2. Fallback to main product data
  return data[fieldId];
};
