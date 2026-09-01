import { useState, useEffect } from 'react';
import {
  CommissionSummary,
  MonthlySummary,
  CommissionRecord,
  getCommissionSummary,
  getMonthlyCommissionSummary,
  getOverdueCommissions,
} from '../_utils/commissionApi';

export interface UseCommissionReturn {
  summary: CommissionSummary | null;
  monthlySummary: MonthlySummary[];
  overdueCommissions: CommissionRecord[];
  loading: boolean;
  error: string | null;
  refreshCommissionData: () => Promise<void>;
}

export const useCommission = (): UseCommissionReturn => {
  const [summary, setSummary] = useState<CommissionSummary | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary[]>([]);
  const [overdueCommissions, setOverdueCommissions] = useState<CommissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshCommissionData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryData, monthlyData, overdueData] = await Promise.all([
        getCommissionSummary(),
        getMonthlyCommissionSummary(6),
        getOverdueCommissions(),
      ]);

      setSummary(summaryData);
      setMonthlySummary(monthlyData);
      setOverdueCommissions(overdueData);
    } catch (err) {
      console.error('Error refreshing commission data:', err);
      setError('Failed to load commission data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCommissionData();
  }, []);

  return {
    summary,
    monthlySummary,
    overdueCommissions,
    loading,
    error,
    refreshCommissionData,
  };
};
