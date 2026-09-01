import { apiFetchJson } from '@/app/_utils/apiClient';

export interface CommissionRecord {
  _id: string;
  booking: string | null;
  amount: number;
  baseAmount: number;
  rate: number;
  type: 'charged' | 'paid';
  paymentFrequency: 'per_booking' | 'monthly';
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
    const response = await apiFetchJson<{ success: boolean; data: CommissionHistory }>(
      `${API_BASE}/commission/history?limit=${limit}&skip=${skip}`,
      {
        method: 'GET',
        auth: true,
      }
    );
    return response.data || { data: [], total: 0, limit, skip };
  } catch (error) {
    console.error('Error fetching commission history:', error);
    return { data: [], total: 0, limit, skip };
  }
};

export const getCommissionSummary = async (): Promise<CommissionSummary | null> => {
  try {
    const response = await apiFetchJson<{ success: boolean; data: CommissionSummary }>(
      `${API_BASE}/commission/summary`,
      {
        method: 'GET',
        auth: true,
      }
    );
    return response.data || null;
  } catch (error) {
    console.error('Error fetching commission summary:', error);
    return null;
  }
};

export const getMonthlyCommissionSummary = async (months = 6): Promise<MonthlySummary[]> => {
  try {
    const response = await apiFetchJson<{ success: boolean; data: MonthlySummary[] }>(
      `${API_BASE}/commission/summary/monthly?months=${months}`,
      {
        method: 'GET',
        auth: true,
      }
    );
    return response.data || [];
  } catch (error) {
    console.error('Error fetching monthly commission summary:', error);
    return [];
  }
};

export const getOverdueCommissions = async (): Promise<CommissionRecord[]> => {
  try {
    const response = await apiFetchJson<{ success: boolean; data: CommissionRecord[] }>(
      `${API_BASE}/commission/overdue`,
      {
        method: 'GET',
        auth: true,
      }
    );
    return response.data || [];
  } catch (error) {
    console.error('Error fetching overdue commissions:', error);
    return [];
  }
};
