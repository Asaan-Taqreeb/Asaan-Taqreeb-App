import { FAVORITE_ENDPOINTS } from '@/app/_constants/apiEndpoints'
import { apiFetchJson } from '@/app/_utils/apiClient'
import { mapServiceToUi, ServiceListItem } from '@/app/_utils/servicesApi'

export const toggleFavorite = async (serviceId: string) => {
  return apiFetchJson<{ message: string; isFavorite: boolean }>(
    FAVORITE_ENDPOINTS.toggle,
    {
      method: 'POST',
      auth: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceId }),
    },
    'Failed to toggle favorite status.'
  );
};

export const getMyFavorites = async (): Promise<ServiceListItem[]> => {
  try {
    const response = await apiFetchJson<{ services: any[] }>(
      FAVORITE_ENDPOINTS.myFavorites,
      { method: 'GET', auth: true },
      'Failed to fetch favorites.'
    );
    if (!response.services) return [];
    return response.services.map(mapServiceToUi);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return [];
  }
};

export const getMyFavoriteIds = async (): Promise<string[]> => {
  try {
    const response = await apiFetchJson<{ serviceIds: string[] }>(
      FAVORITE_ENDPOINTS.myFavoriteIds,
      { method: 'GET', auth: true },
      'Failed to fetch favorite IDs.'
    );
    return response.serviceIds || [];
  } catch (error) {
    console.error('Error fetching favorite IDs:', error);
    return [];
  }
};
