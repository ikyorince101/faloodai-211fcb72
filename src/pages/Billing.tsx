import React from 'react';
import { CreditCard, Sparkles, Key, Calendar, BarChart3, ExternalLink, Loader2 } from 'lucide-react';
import { useEntitlements } from '@/hooks/useEntitlements';
import { useBilling } from '@/hooks/useBilling';
import { useMotion } from '@/contexts/MotionContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const BillingPage: React.FC = () => {
  const { entitlements, loading, isPro, refresh } = useEntitlements();
  const { startCheckout, openCustomerPortal, isLoading } = useBilling();
  const { intensity } = useMotion();

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Billing</h1>
          <p className="text-muted-foreground">Manage your subscription and usage.</p>
        </div>
        <div className="glass-card p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const subscription = entitlements?.subscription;
  const usage = entitlements?.usage;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and usage.</p>
      </div>

      {/* Current Plan */}
      <div className={cn(
        "glass-card p-6",
        isPro && "border-primary/30"
      )}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {isPro ? (
              <div className={cn(
                "w-12 h-12 rounded-xl bg-gradient-aurora flex items-center justify-center",
                intensity === 'magical' && 'animate-shimmer-subtle'
              )}>
                <Sparkles className="w-6 h-6 text-background" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <Key className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-foreground">
                  {isPro ? 'Pro Plan' : 'Free Plan'}
                </h2>
                <Badge variant={isPro ? 'default' : 'secondary'}>
                  {isPro ? 'ACTIVE' : 'BYOK'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {isPro 
                  ? 'Full access with included AI credits'
                  : 'Bring your own API keys'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">
              {isPro ? '$20' : '$0'}
            </p>
            <p className="text-sm text-muted-foreground">/month</p>
          </div>
        </div>

        {/* Subscription Details for Pro */}
        {isPro && subscription && (
          <div className="p-4 rounded-lg bg-secondary/50 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Renewal Date:</span>
                <span className="text-foreground font-medium">
                  {subscription.currentPeriodEnd 
                    ? format(new Date(subscription.currentPeriodEnd), 'MMM d, yyyy')
                    : 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Status:</span>
                <span className={cn(
                  "font-medium capitalize",
                  subscription.status === 'active' ? 'text-success' : 'text-warning'
                )}>
                  {subscription.status}
                </span>
              </div>
            </div>
            {subscription.cancelAtPeriodEnd && (
              <p className="mt-3 text-sm text-warning">
                ⚠️ Your subscription will cancel at the end of the current period.
              </p>
            )}
          </div>
        )}

        {/* Usage for Pro */}
        {isPro && usage && (
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-medium text-foreground">Monthly Usage</h3>
            </div>
            
            <div className="grid gap-4">
              {/* Resume Usage */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ATS Resumes</span>
                  <span className={cn(
                    "font-medium",
                    usage.resumes.used >= usage.resumes.limit ? 'text-destructive' :
                    usage.resumes.limit - usage.resumes.used <= 10 ? 'text-warning' : 'text-foreground'
                  )}>
                    {usage.resumes.used} / {usage.resumes.limit}
                  </span>
                </div>
                <Progress 
                  value={(usage.resumes.used / usage.resumes.limit) * 100} 
                  className="h-2"
                />
              </div>

              {/* Interview Usage */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mock Interviews</span>
                  <span className={cn(
                    "font-medium",
                    usage.interviews.used >= usage.interviews.limit ? 'text-destructive' :
                    usage.interviews.limit - usage.interviews.used <= 2 ? 'text-warning' : 'text-foreground'
                  )}>
                    {usage.interviews.used} / {usage.interviews.limit}
                  </span>
                </div>
                <Progress 
                  value={(usage.interviews.used / usage.interviews.limit) * 100} 
                  className="h-2"
                />
              </div>
            </div>

            {subscription?.currentPeriodEnd && (
              <p className="text-xs text-muted-foreground">
                Usage resets on {format(new Date(subscription.currentPeriodEnd), 'MMMM d, yyyy')}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {isPro ? (
            <Button 
              onClick={() => openCustomerPortal()} 
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
              Manage Billing
            </Button>
          ) : (
            <Button 
              onClick={() => startCheckout()}
              disabled={isLoading}
              className="gap-2 bg-gradient-aurora text-background"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Upgrade to Pro
            </Button>
          )}
          
          <Button variant="outline" onClick={() => refresh()} className="gap-2">
            Refresh Status
          </Button>
        </div>
      </div>

      {/* Free Tier Info */}
      {!isPro && (
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Key className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-medium text-foreground">API Keys Status</h3>
          </div>
          
          {entitlements?.hasApiKeys ? (
            <div className="p-4 rounded-lg bg-success/10 border border-success/20">
              <p className="text-success font-medium">✓ API keys connected</p>
              <p className="text-sm text-muted-foreground mt-1">
                You can use all AI features with your own API keys.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
              <p className="text-warning font-medium">No API keys connected</p>
              <p className="text-sm text-muted-foreground mt-1">
                Connect your API keys to use resume generation and mock interviews.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link to="/settings/api-keys">Connect API Keys</Link>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Pro Benefits (for Free users) */}
      {!isPro && (
        <div className="glass-card p-6 border-primary/20">
          <h3 className="font-medium text-foreground mb-4">Why Upgrade to Pro?</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              100 ATS resume generations per month
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              10 mock interview sessions per month
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              No API keys needed - we handle everything
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Priority support
            </li>
          </ul>
          <Button 
            onClick={() => startCheckout()}
            disabled={isLoading}
            className="mt-4 gap-2 bg-gradient-aurora text-background w-full"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Start Pro - $20/month
          </Button>
        </div>
      )}
    </div>
  );
};

export default BillingPage;
