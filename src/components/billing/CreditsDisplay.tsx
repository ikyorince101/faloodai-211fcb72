import React from 'react';
import { Sparkles, Key, AlertTriangle, Calendar } from 'lucide-react';
import { useEntitlements } from '@/hooks/useEntitlements';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

interface CreditsDisplayProps {
  type: 'resume' | 'interview';
  showUpgradePrompt?: boolean;
}

const CreditsDisplay: React.FC<CreditsDisplayProps> = ({ type, showUpgradePrompt = true }) => {
  const { entitlements, loading, isPro, canGenerateResume, canRunInterview } = useEntitlements();

  if (loading || !entitlements) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm animate-pulse">
        <div className="w-24 h-4 bg-muted rounded" />
      </div>
    );
  }

  const canProceed = type === 'resume' ? canGenerateResume : canRunInterview;
  const usage = entitlements.usage;
  const subscription = entitlements.subscription;

  // Pro user display
  if (isPro && usage) {
    const current = type === 'resume' ? usage.resumes.used : usage.interviews.used;
    const limit = type === 'resume' ? usage.resumes.limit : usage.interviews.limit;
    const remaining = limit - current;
    const label = type === 'resume' ? 'Resumes' : 'Interviews';
    const isLow = remaining <= (type === 'resume' ? 10 : 2);
    const isExhausted = remaining <= 0;

    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className={`text-sm font-medium ${isExhausted ? 'text-destructive' : isLow ? 'text-warning' : 'text-foreground'}`}>
            {label} left this month: {remaining}/{limit}
          </span>
          <Badge variant={isExhausted ? 'destructive' : 'secondary'} className="text-xs">
            PRO
          </Badge>
        </div>
        
        {isExhausted && subscription?.currentPeriodEnd && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>Resets {format(new Date(subscription.currentPeriodEnd), 'MMM d, yyyy')}</span>
          </div>
        )}
        
        {isExhausted && showUpgradePrompt && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg mt-1">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-destructive font-medium">Monthly quota exceeded</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Your credits will reset on {format(new Date(subscription.currentPeriodEnd), 'MMMM d')}.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Free BYOK user display
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Key className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Using your own API keys</span>
        <Badge variant="outline" className="text-xs">FREE</Badge>
      </div>
      
      {!canProceed && showUpgradePrompt && (
        <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg mt-1">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-warning font-medium">API keys required</p>
              <p className="text-muted-foreground text-xs mt-1">
                Connect your AI API keys to use this feature, or upgrade to Pro.
              </p>
              <div className="flex gap-2 mt-2">
                <Button asChild size="sm" variant="outline">
                  <Link to="/settings/api-keys">Connect Keys</Link>
                </Button>
                <Button asChild size="sm" className="bg-gradient-aurora text-background">
                  <Link to="/pricing">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Upgrade
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditsDisplay;
