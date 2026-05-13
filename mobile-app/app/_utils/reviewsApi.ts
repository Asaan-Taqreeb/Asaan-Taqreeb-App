import { REVIEW_ENDPOINTS } from '@/app/_constants/apiEndpoints'
import { apiFetchJson } from '@/app/_utils/apiClient'

export type Review = {
  _id: string;
  vendor: string;
  client: {
    _id: string;
    name: string;
    profileImage?: string;
  };
  service: any;
  booking: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export const createReview = async (bookingId: string, rating: number, comment?: string) => {
  return apiFetchJson<any>(
    REVIEW_ENDPOINTS.createReview,
    {
      method: 'POST',
      auth: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, rating, comment }),
    },
    'Failed to submit review.'
  );
};

export const getVendorReviews = async (vendorId: string | number): Promise<Review[]> => {
  try {
    const response = await apiFetchJson<{ reviews: Review[] }>(
      REVIEW_ENDPOINTS.vendorReviews(vendorId),
      { method: 'GET', auth: false },
      'Failed to fetch vendor reviews.'
    );
    return response.reviews || [];
  } catch (error) {
    console.error('Error fetching vendor reviews:', error);
    return [];
  }
};
