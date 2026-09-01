import { apiFetchJson } from '@/app/_utils/apiClient';
import { APP_ENDPOINTS } from '@/app/_constants/apiEndpoints';

export interface Category {
  _id: string;
  key: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  backgroundColor: string;
  active: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

let cachedCategories: Category[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export const getAllCategories = async (forceRefresh = false): Promise<Category[]> => {
  try {
    // Check cache validity
    if (!forceRefresh && cachedCategories && Date.now() - cacheTimestamp < CACHE_DURATION) {
      return cachedCategories;
    }

    const url = APP_ENDPOINTS.categories;
    const response = await apiFetchJson<any>(url, {
      method: 'GET',
      auth: false,
    });

    let list: Category[] = [];
    if (Array.isArray(response)) {
      list = response;
    } else if (Array.isArray(response?.data)) {
      list = response.data;
    }

    if (list.length > 0) {
      cachedCategories = list;
      cacheTimestamp = Date.now();
      return list;
    }

    return cachedCategories || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    // Return cached data if available, otherwise empty array
    return cachedCategories || [];
  }
};

export const getCategoryByKey = async (key: string): Promise<Category | null> => {
  try {
    const url = APP_ENDPOINTS.categoryByKey(key);
    const response = await apiFetchJson<any>(url, {
      method: 'GET',
      auth: false,
    });

    if (response?.key) {
      return response as Category;
    }
    if (response?.data?.key) {
      return response.data as Category;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching category ${key}:`, error);
    return null;
  }
};
