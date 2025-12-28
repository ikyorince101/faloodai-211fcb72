import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useBilling = () => {
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = async (priceId?: string) => {
    if (!session?.access_token) {
      setError('Please sign in to continue');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-checkout', {
        body: priceId ? { priceId } : {},
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      // Open checkout in new tab
      if (data.url) {
        window.open(data.url, '_blank');
      }

      return data.url;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start checkout';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    if (!session?.access_token) {
      setError('Please sign in to continue');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      // Open portal in new tab
      if (data.url) {
        window.open(data.url, '_blank');
      }

      return data.url;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to open billing portal';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    startCheckout,
    openCustomerPortal,
    isLoading,
    error,
  };
};
