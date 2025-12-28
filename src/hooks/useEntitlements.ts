import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Entitlements {
  plan: 'PRO' | 'FREE_BYOK';
  hasApiKeys: boolean;
  subscription: {
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
  usage: {
    resumes: { used: number; limit: number };
    interviews: { used: number; limit: number };
  } | null;
  canGenerateResume: boolean;
  canRunInterview: boolean;
}

export const useEntitlements = () => {
  const { user, session } = useAuth();
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntitlements = useCallback(async () => {
    if (!session?.access_token) {
      setEntitlements(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fnError } = await supabase.functions.invoke('check-entitlements', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (fnError) throw fnError;
      setEntitlements(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch entitlements');
      setEntitlements(null);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    fetchEntitlements();
  }, [fetchEntitlements]);

  // Refresh every 60 seconds
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchEntitlements, 60000);
    return () => clearInterval(interval);
  }, [user, fetchEntitlements]);

  const incrementUsage = useCallback(async (type: 'resume' | 'interview') => {
    if (!session?.access_token) return false;

    try {
      const { error: fnError } = await supabase.functions.invoke('increment-usage', {
        body: { type },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (fnError) throw fnError;
      
      // Refresh entitlements after increment
      await fetchEntitlements();
      return true;
    } catch {
      return false;
    }
  }, [session?.access_token, fetchEntitlements]);

  return {
    entitlements,
    loading,
    error,
    refresh: fetchEntitlements,
    incrementUsage,
    isPro: entitlements?.plan === 'PRO',
    canGenerateResume: entitlements?.canGenerateResume ?? false,
    canRunInterview: entitlements?.canRunInterview ?? false,
  };
};
