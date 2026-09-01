import { apiFetchJson } from '@/app/_utils/apiClient';

export interface CommissionRecord {
  _id: string;
  booking: string | null;
  amount: number;
  baseAmount: number;
  rate: number;
  type: 'charged' | 'paid';
  dueDate: string;
  paidDate: string | null;
  status: 'pending' | 'partially_paid' | 'paid' | 'overdue';
  createdAt: string;
  updatedAt: string;
}

export interface CommissionSummary {
  totalOutstanding: number;
  totalPaid: number;
  pendingCount: number;
  paidCount: number;
  overdueCount: number;
  overdueAmount: number;
  lastPaymentDate: string | null;
}

export interface MonthlySummary {
  month: string;
  monthDate: string;
  charged: number;
  paid: number;
  pending: number;
}

export interface CommissionHistory {
  data: CommissionRecord[];
  total: number;
  limit: number;
  skip: number;
}

const API_BASE = 'https://asaantaqreeb.duckdns.org/api/v1/vendors';

export const getCommissionHistory = async (limit = 12, skip = 0): Promise<CommissionHistory> => {
  try {
    const response = await apiFetchJson<any>(
      `${API_BASE}/commission/history?limit=${limit}&skip=${skip}`,
      {
        method: 'GET',
        auth: true,
      }
    );
    if (!response) return { data: [], total: 0, limit, skip };
    if (response.data && Array.isArray(response.data)) {
      return response as CommissionHistory;
    }
    if (Array.isArray(response)) {
      return { data: response, total: response.length, limit, skip };
    }
    return response as CommissionHistory;
  } catch (error) {
    console.error('Error fetching commission history:', error);
    return { data: [], total: 0, limit, skip };
  }
};

export const getCommissionSummary = async (): Promise<CommissionSummary | null> => {
  try {
    const response = await apiFetchJson<any>(
      `${API_BASE}/commission/summary`,
      {
        method: 'GET',
        auth: true,
      }
    );
    if (!response) return null;
    if (response.data && typeof response.data === 'object') {
      return response.data as CommissionSummary;
    }
    return response as CommissionSummary;
  } catch (error) {
    console.error('Error fetching commission summary:', error);
    return null;
  }
};

export const getMonthlyCommissionSummary = async (months = 6): Promise<MonthlySummary[]> => {
  try {
    const response = await apiFetchJson<any>(
      `${API_BASE}/commission/summary/monthly?months=${months}`,
      {
        method: 'GET',
        auth: true,
      }
    );
    if (!response) return [];
    if (Array.isArray(response)) return response as MonthlySummary[];
    if (Array.isArray(response.data)) return response.data as MonthlySummary[];
    return [];
  } catch (error) {
    console.error('Error fetching monthly commission summary:', error);
    return [];
  }
};

export const getOverdueCommissions = async (): Promise<CommissionRecord[]> => {
  try {
    const response = await apiFetchJson<any>(
      `${API_BASE}/commission/overdue`,
      {
        method: 'GET',
        auth: true,
      }
    );
    if (!response) return [];
    if (Array.isArray(response)) return response as CommissionRecord[];
    if (Array.isArray(response.data)) return response.data as CommissionRecord[];
    return [];
  } catch (error) {
    console.error('Error fetching overdue commissions:', error);
    return [];
  }
};
