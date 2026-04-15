import { apiRequest } from './queryClient';

export interface FormTemplateData {
  name: string;
  // resource_type: 'product' | 'order' | 'customer';
  schema: any;
  design?: any;
  mappedTo?: string; // UUID of FrontendForm
}

export interface FrontendForm {
  id: string;
  name: string;
  formKey: string;
}


export const getTemplates = async (params: any = {}) => {
  const filteredParams = Object.fromEntries(
    Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(([k, v]) => [k, String(v)])
  );
  const searchParams = new URLSearchParams(filteredParams).toString();
  const url = `/api/form-templates${searchParams ? `?${searchParams}` : ''}`;
  const response = await apiRequest('GET', url);
  const res = await response.json();
  return res.data;
};

export const getPublicTemplates = async (params: any = {}) => {
  const filteredParams = Object.fromEntries(
    Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(([k, v]) => [k, String(v)])
  );
  const searchParams = new URLSearchParams(filteredParams).toString();
  const url = `/api/form-templates/public/list${searchParams ? `?${searchParams}` : ''}`;
  const response = await apiRequest('GET', url);
  const res = await response.json();
  return res.data;
};

export const getTemplate = async (id: string) => {
  const response = await apiRequest('GET', `/api/form-templates/${id}`);
  const res = await response.json();
  return res.data;
};

export const createTemplate = async (data: FormTemplateData) => {
  const response = await apiRequest('POST', '/api/form-templates', data);
  const res = await response.json();
  return res.data;
};

export const updateTemplate = async (id: string, data: Partial<FormTemplateData>) => {
  const response = await apiRequest('PATCH', `/api/form-templates/${id}`, data);
  const res = await response.json();
  return res.data;
};

export const uploadImage = async (base64Data: string, name: string, mimeType: string, originalData?: string) => {
  const response = await apiRequest('POST', '/api/images/upload', {
    data: base64Data,
    original_data: originalData,
    name,
    mime_type: mimeType
  });
  const res = await response.json();
  return res.data;
};

export const uploadImageFile = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await apiRequest('POST', '/api/images/upload', formData);
  const json = await response.json();
  return json.uuid; // Assuming the backend returns { uuid: '...' }
};

export const generateSku = async (prefix: string) => {
  const response = await apiRequest('POST', '/api/sku/next', { prefix });
  const json = await response.json();
  return json.data.sku;
};

export const addDropdownOption = async (dropdownId: string, value: string) => {
  const response = await apiRequest('POST', `/api/dropdowns/${dropdownId}/options`, { value });
  const res = await response.json();
  return res.data;
};

export const submitFormData = async (resourceId: string, templateId: string, data: any) => {
  const response = await apiRequest('POST', `/api/resources/data/${resourceId}`, {
    template_id: templateId,
    data
  });
  const res = await response.json();
  return res.data;
};

export const getDynamicItemData = async (resourceId: string) => {
  const response = await apiRequest('GET', `/api/resources/data/${resourceId}`);
  const res = await response.json();
  return res;
};

export const getDynamicItemDataPublic = async (resourceId: string, userId: string) => {
  const response = await apiRequest('GET', `/api/resources/data/${resourceId}/public?user=${userId}`);
  const res = await response.json();
  return res.data;
};

export const getAllDynamicData = async (options: { 
  templateId?: string, 
  page?: number, 
  limit?: number, 
  search?: string,
  [key: string]: any 
}) => {
  const { templateId, page, limit, search, ...rest } = options;
  const params: any = { template_id: templateId, page, limit, search, ...rest };
  const filteredParams = Object.fromEntries(
    Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(([k, v]) => [k, String(v)])
  );
  const searchParams = new URLSearchParams(filteredParams).toString();
  const url = `/api/resources/data/all${searchParams ? `?${searchParams}` : ''}`;
  const response = await apiRequest('GET', url);
  const res = await response.json();
  return res;
};

export const getInventoryData = async (options: { 
  page?: number, 
  limit?: number, 
  search?: string,
  [key: string]: any 
} = {}) => {
  const { page, limit, search, ...rest } = options;
  const params: any = { page, limit, search, ...rest };
  const filteredParams = Object.fromEntries(
    Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(([k, v]) => [k, String(v)])
  );
  const searchParams = new URLSearchParams(filteredParams).toString();
  const url = `/api/resources/inventory/all${searchParams ? `?${searchParams}` : ''}`;
  const response = await apiRequest('GET', url);
  const res = await response.json();
  return res;
};

export const getAllDynamicDataPublic = async (options: { 
  templateId?: string, 
  page?: number, 
  limit?: number, 
  search?: string,
  [key: string]: any 
}) => {
  const { templateId, page, limit, search, ...rest } = options;
  const params: any = { template_id: templateId, page, limit, search, ...rest };
  const filteredParams = Object.fromEntries(
    Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(([k, v]) => [k, String(v)])
  );
  const searchParams = new URLSearchParams(filteredParams).toString();
  const url = `/api/resources/data/all/public${searchParams ? `?${searchParams}` : ''}`;
  const response = await apiRequest('GET', url);
  const res = await response.json();
  return res;
};

// Frontend Forms CRUD (Development)
export const getFrontendForms = async () => {
  const response = await apiRequest('GET', '/api/frontend-forms');
  const res = await response.json();
  return res.data;
};

export const createFrontendForm = async (data: { name: string; formKey: string }) => {
  const response = await apiRequest('POST', '/api/frontend-forms', data);
  const res = await response.json();
  return res.data;
};

export const updateFrontendForm = async (id: string, data: { name: string; formKey: string }) => {
  const response = await apiRequest('PATCH', `/api/frontend-forms/${id}`, data);
  const res = await response.json();
  return res.data;
};

export const deleteFrontendForm = async (id: string) => {
  const response = await apiRequest('DELETE', `/api/frontend-forms/${id}`);
  const res = await response.json();
  return res.data;
};

// Dynamic Data CRUD (Standardized)
export const updateDynamicData = async (id: string, data: any) => {
  const response = await apiRequest('PUT', `/api/resources/data/${id}`, { data });
  const res = await response.json();
  return res.data;
};

export const deleteDynamicData = async (id: string) => {
  const response = await apiRequest('DELETE', `/api/resources/data/${id}`);
  const res = await response.json();
  return res.data;
};

export const checkSkuUniqueness = async (sku: string, excludeId?: string) => {
  // Using getAllDynamicData to search for the specific SKU
  // We specify limit 1 and the search term.
  const response = await getAllDynamicData({ search: sku, limit: 5 });
  const items = response.data?.data || response.data || [];
  
  // Verify if any item exactly matches the SKU in its data object
  const exists = items.some((item: any) => {
    if (excludeId && item.id === excludeId) return false;
    return item.data?.sku === sku;
  });
  
  return !exists;
};
