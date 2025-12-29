import { useMemo } from 'react';
import { useEntitlements } from './useEntitlements';

// Pro users get 3 hours (180 minutes) per month
const PRO_LIVE_OVERLAY_LIMIT_MINUTES = 180;

export const useLiveOverlayEntitlements = () => {
  const { entitlements, loading, error, isPro, isTrial } = useEntitlements();

  const result = useMemo(() => {
    if (!entitlements) {
      return {
        canUseLiveOverlay: false,
        minutesRemaining: 0,
        minutesUsed: 0,
        plan: 'FREE_TRIAL' as const,
        loading: true,
      };
    }

    const plan = entitlements.plan;
    const hasApiKeys = entitlements.hasApiKeys;

    // Free trial users cannot use live overlay
    if (plan === 'FREE_TRIAL' && !hasApiKeys) {
      return {
        canUseLiveOverlay: false,
        minutesRemaining: 0,
        minutesUsed: 0,
        plan,
        loading: false,
      };
    }

    // BYOK users have unlimited access
    if (plan === 'FREE_BYOK' || hasApiKeys) {
      return {
        canUseLiveOverlay: true,
        minutesRemaining: Infinity,
        minutesUsed: 0,
        plan: 'FREE_BYOK' as const,
        loading: false,
      };
    }

    // Pro users have 180 minutes/month
    if (plan === 'PRO') {
      // For now, we'll track this client-side via usage. 
      // In production, this would come from the check-entitlements response
      const minutesUsed = 0; // TODO: Get from entitlements.usage?.liveOverlay?.used
      const minutesRemaining = PRO_LIVE_OVERLAY_LIMIT_MINUTES - minutesUsed;

      return {
        canUseLiveOverlay: minutesRemaining > 0,
        minutesRemaining: Math.max(0, minutesRemaining),
        minutesUsed,
        plan,
        loading: false,
      };
    }

    return {
      canUseLiveOverlay: false,
      minutesRemaining: 0,
      minutesUsed: 0,
      plan: plan || 'FREE_TRIAL',
      loading: false,
    };
  }, [entitlements]);

  return {
    ...result,
    loading: loading || result.loading,
    error,
  };
};
