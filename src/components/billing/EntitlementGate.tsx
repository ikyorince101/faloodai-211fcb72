import React from 'react';
import { Sparkles, Key, Lock } from 'lucide-react';
import { useEntitlements } from '@/hooks/useEntitlements';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface EntitlementGateProps {
  type: 'resume' | 'interview';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const EntitlementGate: React.FC<EntitlementGateProps> = ({ type, children, fallback }) => {
  const { entitlements, loading, canGenerateResume, canRunInterview } = useEntitlements();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const canProceed = type === 'resume' ? canGenerateResume : canRunInterview;

  if (canProceed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const isPro = entitlements?.plan === 'PRO';
  const label = type === 'resume' ? 'resume generation' : 'mock interviews';

  return (
    <div className="glass-card p-8 text-center max-w-md mx-auto">
      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
        <Lock className="w-8 h-8 text-muted-foreground" />
      </div>
      
      {isPro ? (
        <>
          <h3 className="text-lg font-semibold text-foreground mb-2">Monthly Quota Reached</h3>
          <p className="text-muted-foreground mb-6">
            You've used all your {label} credits for this billing period. 
            Your quota will reset at the start of your next billing cycle.
          </p>
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-foreground mb-2">API Keys Required</h3>
          <p className="text-muted-foreground mb-6">
            To use {label}, either connect your own AI API keys or upgrade to Pro for included credits.
          </p>
        </>
      )}
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {!isPro && (
          <Button asChild variant="outline" className="gap-2">
            <Link to="/settings/api-keys">
              <Key className="w-4 h-4" />
              Connect Keys
            </Link>
          </Button>
        )}
        <Button asChild className="gap-2 bg-gradient-aurora text-background">
          <Link to="/pricing">
            <Sparkles className="w-4 h-4" />
            {isPro ? 'View Plans' : 'Upgrade to Pro'}
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default EntitlementGate;
