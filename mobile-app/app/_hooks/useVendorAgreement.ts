import { useEffect, useState, useCallback } from 'react';
import { getMyAgreement, acceptAgreement as acceptAgreementApi } from '@/app/_utils/vendorAgreementApi';

export interface UseAgreementReturn {
  showAgreement: boolean;
  agreementAccepted: boolean;
  loading: boolean;
  error: string | null;
  acceptAgreement: (paymentFrequency: 'per_booking' | 'monthly') => Promise<boolean>;
  rejectAgreement: () => void;
  checkAgreementStatus: () => Promise<void>;
}

export const useVendorAgreement = (): UseAgreementReturn => {
  const [showAgreement, setShowAgreement] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAgreementStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const agreement = await getMyAgreement();

      if (!agreement) {
        // No agreement found, show the modal
        setShowAgreement(true);
        setAgreementAccepted(false);
        return;
      }

      if (agreement.accepted && agreement.status === 'accepted') {
        setAgreementAccepted(true);
        setShowAgreement(false);
      } else if (agreement.status === 'pending') {
        setShowAgreement(true);
        setAgreementAccepted(false);
      } else if (agreement.status === 'rejected') {
        // Agreement was rejected, show it again
        setShowAgreement(true);
        setAgreementAccepted(false);
      }
    } catch (err) {
      console.error('Error checking agreement status:', err);
      setError('Failed to load agreement status');
      setShowAgreement(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const acceptAgreement = useCallback(
    async (paymentFrequency: 'per_booking' | 'monthly'): Promise<boolean> => {
      try {
        setLoading(true);
        const result = await acceptAgreementApi(paymentFrequency);

        if (result) {
          setAgreementAccepted(true);
          setShowAgreement(false);
          return true;
        } else {
          setError('Failed to accept agreement');
          return false;
        }
      } catch (err) {
        console.error('Error accepting agreement:', err);
        setError('Failed to accept agreement');
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const rejectAgreement = useCallback(() => {
    setShowAgreement(false);
    setAgreementAccepted(false);
  }, []);

  // Check agreement status on mount
  useEffect(() => {
    checkAgreementStatus();
  }, [checkAgreementStatus]);

  return {
    showAgreement,
    agreementAccepted,
    loading,
    error,
    acceptAgreement,
    rejectAgreement,
    checkAgreementStatus,
  };
};

export default useVendorAgreement;
