import React from 'react';
import { Shield, AlertTriangle, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ConsentModalProps {
  open: boolean;
  consentChecks: {
    participantConsent: boolean;
    practiceSession: boolean;
  };
  setConsentChecks: (checks: { participantConsent: boolean; practiceSession: boolean }) => void;
  onAccept: () => void;
  onCancel: () => void;
  canUseLiveOverlay: boolean;
  minutesRemaining: number;
  plan: string;
}

const ConsentModal: React.FC<ConsentModalProps> = ({
  open,
  consentChecks,
  setConsentChecks,
  onAccept,
  onCancel,
  canUseLiveOverlay,
  minutesRemaining,
  plan,
}) => {
  const canProceed = consentChecks.participantConsent && consentChecks.practiceSession && canUseLiveOverlay;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">Live Practice Call Overlay</DialogTitle>
              <Badge variant="outline" className="mt-1">Practice Mode Only</Badge>
            </div>
          </div>
          <DialogDescription className="text-left space-y-3 pt-2">
            <p>
              This feature lets you practice mock interviews with a friend while FaloodAI provides 
              real-time coaching on-screen. Your browser will capture the call tab for transcription.
            </p>
            
            <div className="glass-card p-3 border-warning/30 bg-warning/5">
              <div className="flex gap-2">
                <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-warning mb-1">Important Notice</p>
                  <p className="text-muted-foreground">
                    This is strictly for practice sessions with consenting participants. 
                    Do NOT use this during real job interviews.
                  </p>
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Quota Display */}
          <div className="glass-card p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Available Time</span>
            </div>
            <div className="text-right">
              {plan === 'FREE_BYOK' ? (
                <span className="font-medium text-success">Unlimited (BYOK)</span>
              ) : plan === 'PRO' ? (
                <span className="font-medium text-foreground">{minutesRemaining} min remaining</span>
              ) : (
                <span className="font-medium text-destructive">Not available</span>
              )}
            </div>
          </div>

          {/* Consent Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Checkbox
                id="consent-participants"
                checked={consentChecks.participantConsent}
                onCheckedChange={(checked) =>
                  setConsentChecks({ ...consentChecks, participantConsent: !!checked })
                }
              />
              <Label htmlFor="consent-participants" className="text-sm leading-relaxed cursor-pointer">
                I confirm that all participants in this call have consented to recording and 
                transcription for practice purposes.
              </Label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="consent-practice"
                checked={consentChecks.practiceSession}
                onCheckedChange={(checked) =>
                  setConsentChecks({ ...consentChecks, practiceSession: !!checked })
                }
              />
              <Label htmlFor="consent-practice" className="text-sm leading-relaxed cursor-pointer">
                I understand this is a mock interview/practice session, not a real job interview.
              </Label>
            </div>
          </div>

          {!canUseLiveOverlay && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              {plan === 'FREE_TRIAL' 
                ? 'Live Overlay is not available on free tier. Please upgrade to Pro or connect your own API keys.'
                : 'You have used all your live overlay minutes this month.'}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={onAccept}
            disabled={!canProceed}
            className="bg-gradient-aurora text-background"
          >
            Start Practice Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConsentModal;
