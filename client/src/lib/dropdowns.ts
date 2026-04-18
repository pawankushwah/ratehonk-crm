import { apiRequest } from './queryClient';

export interface DropdownOption {
  id: string;
  value: string;
  label: string;
}

export interface Dropdown {
  id: string;
  name: string;
  options: DropdownOption[];
  options_count?: number;
}

export const getDropdowns = async (): Promise<Dropdown[]> => {
  const response = await apiRequest('GET', '/api/dropdowns');
  const json = await response.json();
  return json.data;
};

export const getDropdown = async (id: string): Promise<Dropdown | null> => {
  const response = await apiRequest('GET', `/api/dropdowns/${id}`);
  const json = await response.json();
  return json.data;
};

export const createDropdown = async (data: { name: string; options: string[] | { value: string; label: string }[] }): Promise<Dropdown> => {
  const response = await apiRequest('POST', '/api/dropdowns', data);
  const json = await response.json();
  return json.data;
};

export const updateDropdown = async (id: string, data: { name?: string; options?: string[] | { value: string; label: string }[] }): Promise<Dropdown> => {
  const response = await apiRequest('PUT', `/api/dropdowns/${id}`, data);
  const json = await response.json();
  return json.data;
};

export const deleteDropdown = async (id: string): Promise<void> => {
  await apiRequest('DELETE', `/api/dropdowns/${id}`);
};
