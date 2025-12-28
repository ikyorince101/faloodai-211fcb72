import React from 'react';
import { Key, Sparkles, Calendar, ArrowRight, X } from 'lucide-react';
import { useEntitlements } from '@/hooks/useEntitlements';
import { useBilling } from '@/hooks/useBilling';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

interface PaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'resume' | 'interview';
}

const PaywallModal: React.FC<PaywallModalProps> = ({ open, onOpenChange, type }) => {
  const { entitlements, isPro } = useEntitlements();
  const { openCustomerPortal, isLoading } = useBilling();

  if (!entitlements) return null;

  const typeLabel = type === 'resume' ? 'resume generation' : 'mock interviews';
  const subscription = entitlements.subscription;

  // Pro user out of credits
  if (isPro && subscription) {
    const resetDate = subscription.currentPeriodEnd 
      ? format(new Date(subscription.currentPeriodEnd), 'MMMM d, yyyy')
      : 'the next billing cycle';

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-warning" />
              Monthly Limit Reached
            </DialogTitle>
            <DialogDescription>
              You've used all your {typeLabel} credits for this billing period.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
              <p className="text-sm text-foreground">
                Your credits will reset on <span className="font-semibold">{resetDate}</span>.
              </p>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => openCustomerPortal()}
                disabled={isLoading}
                className="gap-2"
              >
                Manage Billing
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Free user without API keys
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            API Keys Required
          </DialogTitle>
          <DialogDescription>
            Connect your AI API keys to use {typeLabel}, or upgrade to Pro for included credits.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="grid gap-3">
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center gap-3 mb-2">
                <Key className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-foreground">Use Your Own Keys</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Connect OpenAI or Anthropic API keys. You pay the provider directly for usage.
              </p>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link to="/settings/api-keys" onClick={() => onOpenChange(false)}>
                  Connect API Keys
                </Link>
              </Button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-popover px-2 text-muted-foreground">or</span>
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">Upgrade to Pro</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Get 100 resume generations + 10 interview sessions monthly. No API keys needed!
              </p>
              <Button asChild size="sm" className="w-full bg-gradient-aurora text-background">
                <Link to="/pricing" onClick={() => onOpenChange(false)}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  View Pro Plans
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaywallModal;
