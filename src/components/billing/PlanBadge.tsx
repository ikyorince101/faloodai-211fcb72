import React from 'react';
import { Key, Sparkles, Calendar, CreditCard, Gift } from 'lucide-react';
import { useEntitlements } from '@/hooks/useEntitlements';
import { useMotion } from '@/contexts/MotionContext';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const PlanBadge: React.FC = () => {
  const { entitlements, loading, isPro, isTrial, freeResumesRemaining } = useEntitlements();
  const { intensity } = useMotion();

  if (loading || !entitlements) {
    return (
      <div className="w-16 h-6 bg-muted/50 rounded-full animate-pulse" />
    );
  }

  const subscription = entitlements.subscription;
  const usage = entitlements.usage;
  const freeUsage = entitlements.freeUsage;

  if (isPro && subscription) {
    const renewalDate = subscription.currentPeriodEnd 
      ? format(new Date(subscription.currentPeriodEnd), 'MMM d')
      : null;
    
    const resumesLeft = usage ? usage.resumes.limit - usage.resumes.used : 0;
    const interviewsLeft = usage ? usage.interviews.limit - usage.interviews.used : 0;
    const isLow = resumesLeft <= 10 || interviewsLeft <= 2;

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full cursor-default",
            "bg-gradient-aurora text-background text-xs font-medium",
            intensity === 'magical' && 'animate-shimmer-subtle'
          )}>
            <Sparkles className="w-3 h-3" />
            <span>PRO</span>
            {isLow && (
              <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <CreditCard className="w-4 h-4" />
              Pro Subscription
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Resumes:</span>{' '}
                <span className={resumesLeft <= 10 ? 'text-warning' : ''}>{resumesLeft} left</span>
              </div>
              <div>
                <span className="text-muted-foreground">Interviews:</span>{' '}
                <span className={interviewsLeft <= 2 ? 'text-warning' : ''}>{interviewsLeft} left</span>
              </div>
            </div>
            {renewalDate && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                Renews {renewalDate}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Free trial tier (user has free credits remaining)
  if (isTrial && freeUsage) {
    const isLow = freeResumesRemaining <= 1;

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium cursor-default border border-primary/20">
            <Gift className="w-3 h-3" />
            <span>TRIAL</span>
            {isLow && (
              <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <Gift className="w-4 h-4" />
              Free Trial
            </div>
            <div className="text-xs">
              <span className="text-muted-foreground">Free resumes:</span>{' '}
              <span className={isLow ? 'text-warning' : ''}>{freeResumesRemaining} left</span>
              <span className="text-muted-foreground"> / {freeUsage.resumes.limit}</span>
            </div>
            {freeUsage.resetsOn && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                Resets {format(new Date(freeUsage.resetsOn), 'MMM d')}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Interviews require API keys or Pro subscription
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Free BYOK tier
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-muted-foreground text-xs font-medium cursor-default">
          <Key className="w-3 h-3" />
          <span>FREE</span>
          {!entitlements.hasApiKeys && (
            <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2 font-medium">
            <Key className="w-4 h-4" />
            Free (BYOK)
          </div>
          <p className="text-xs text-muted-foreground">
            {entitlements.hasApiKeys 
              ? 'Using your own API keys'
              : 'Connect API keys to use AI features'}
          </p>
          {freeUsage && freeResumesRemaining <= 0 && (
            <p className="text-xs text-warning">
              Free resume credits exhausted
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default PlanBadge;
