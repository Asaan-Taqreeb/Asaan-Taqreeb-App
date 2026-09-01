import { apiFetchJson } from '@/app/_utils/apiClient';

export interface VendorAgreement {
  _id: string;
  user: string;
  commissionRate: number;
  agreementText: string;
  accepted: boolean;
  acceptedAt?: string;
  status: 'pending' | 'accepted' | 'rejected';
  outstandingCommission: number;
  lastPaymentDate?: string;
}

const VENDOR_API = 'https://asaantaqreeb.duckdns.org/api/v1/vendors';

export const getAgreementText = async (): Promise<string> => {
  try {
    const response = await apiFetchJson<any>(
      `${VENDOR_API}/agreement/text`,
      {
        method: 'GET',
        auth: false,
      }
    );

    if (response.success && response.data?.text) {
      return response.data.text;
    }

    return '';
  } catch (error) {
    console.error('Error fetching agreement text:', error);
    return '';
  }
};

export const getMyAgreement = async (): Promise<VendorAgreement | null> => {
  try {
    const response = await apiFetchJson<{ success: boolean; data: VendorAgreement }>(
      `${VENDOR_API}/agreement`,
      {
        method: 'GET',
        auth: true,
      }
    );

    if (response.success && response.data) {
      return response.data;
    }

    return null;
  } catch (error) {
    console.error('Error fetching my agreement:', error);
    return null;
  }
};

export const acceptAgreement = async (): Promise<VendorAgreement | null> => {
  try {
    const response = await apiFetchJson<{ success: boolean; data: VendorAgreement }>(
      `${VENDOR_API}/agreement/accept`,
      {
        method: 'POST',
        auth: true,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    );

    if (response.success && response.data) {
      return response.data;
    }

    return null;
  } catch (error) {
    console.error('Error accepting agreement:', error);
    throw error;
  }
};

export const rejectAgreement = async (): Promise<boolean> => {
  try {
    const response = await apiFetchJson<{ success: boolean }>(
      `${VENDOR_API}/agreement/reject`,
      {
        method: 'POST',
        auth: true,
      }
    );

    return response.success;
  } catch (error) {
    console.error('Error rejecting agreement:', error);
    return false;
  }
};

export const getOutstandingCommission = async (): Promise<number> => {
  try {
    const response = await apiFetchJson<{
      success: boolean;
      data: { outstandingCommission: number };
    }>(
      `${VENDOR_API}/agreement/commission/outstanding`,
      {
        method: 'GET',
        auth: true,
      }
    );

    if (response.success && response.data) {
      return response.data.outstandingCommission;
    }

    return 0;
  } catch (error) {
    console.error('Error fetching outstanding commission:', error);
    return 0;
  }
};

export default {
  getAgreementText,
  getMyAgreement,
  acceptAgreement,
  rejectAgreement,
  getOutstandingCommission,
};
