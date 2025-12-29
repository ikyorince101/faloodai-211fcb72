import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, X, Clock, AlertCircle, Loader2, Video, Shield, Pin, Volume2, VolumeX, Save, Maximize2, Minimize2 } from 'lucide-react';
import { useMotion } from '@/contexts/MotionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useEntitlements } from '@/hooks/useEntitlements';
import { useCreateSession, useUpdateSession } from '@/hooks/usePractice';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import ConsentModal from '@/components/live-overlay/ConsentModal';
import CoachOverlayPanel from '@/components/live-overlay/CoachOverlayPanel';
import CallView from '@/components/live-overlay/CallView';
import SessionTopBar from '@/components/live-overlay/SessionTopBar';
import { useLiveOverlayCapture } from '@/hooks/useLiveOverlayCapture';
import { useLiveOverlayEntitlements } from '@/hooks/useLiveOverlayEntitlements';

const LiveOverlay: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { intensity } = useMotion();
  const createSession = useCreateSession();
  const updateSession = useUpdateSession();

  // Consent state
  const [showConsent, setShowConsent] = useState(true);
  const [consentChecks, setConsentChecks] = useState({
    participantConsent: false,
    practiceSession: false,
  });

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Overlay panel state
  const [isPinned, setIsPinned] = useState(false);
  const [opacity, setOpacity] = useState([85]);
  const [speakFeedback, setSpeakFeedback] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Stop confirmation
  const [showStopConfirm, setShowStopConfirm] = useState(false);

  // Check browser support
  const [browserSupported, setBrowserSupported] = useState(true);

  // Entitlements
  const { canUseLiveOverlay, minutesRemaining, minutesUsed, plan, loading: entitlementsLoading } = useLiveOverlayEntitlements();

  // Capture hook
  const {
    videoRef,
    isRecording,
    amplitude,
    transcripts,
    coachingSuggestions,
    rubricScores,
    answerDraft,
    currentSpeaker,
    startCapture,
    stopCapture,
    error: captureError,
  } = useLiveOverlayCapture(sessionId, speakFeedback);

  useEffect(() => {
    // Check browser support
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setBrowserSupported(false);
    }
  }, []);

  const handleConsentAccept = async () => {
    if (!consentChecks.participantConsent || !consentChecks.practiceSession) {
      toast.error('Please confirm both checkboxes to continue');
      return;
    }

    if (!canUseLiveOverlay) {
      toast.error('You have reached your live overlay quota or need to connect API keys');
      return;
    }

    try {
      // Create practice session
      const session = await createSession.mutateAsync({
        mode: 'behavioral', // Will show as live_overlay in practice_events
        difficulty: 'medium',
        duration_minutes: 0,
        status: 'in_progress',
      });

      setSessionId(session.id);
      setSessionStartTime(new Date());
      setShowConsent(false);
      toast.success('Session created. Click "Start Capture" to begin.');
    } catch (error) {
      toast.error('Failed to create session');
    }
  };

  const handleStartCapture = async () => {
    if (!sessionId) return;

    try {
      await startCapture();
      setIsCapturing(true);
    } catch (error) {
      console.error('Capture error:', error);
      toast.error('Failed to start screen capture. Please ensure you grant permission.');
    }
  };

  const handleStopSession = async () => {
    setShowStopConfirm(true);
  };

  const confirmStopSession = async () => {
    setShowStopConfirm(false);

    try {
      stopCapture();
      setIsCapturing(false);

      if (sessionId && sessionStartTime) {
        const durationMinutes = Math.ceil((Date.now() - sessionStartTime.getTime()) / 60000);

        await updateSession.mutateAsync({
          id: sessionId,
          status: 'completed',
          duration_minutes: durationMinutes,
        });

        // Navigate to debrief
        navigate(`/session/${sessionId}/debrief`);
      }
    } catch (error) {
      toast.error('Error ending session');
    }
  };

  // Handle browser close/navigate away
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isCapturing && sessionId) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isCapturing, sessionId]);

  if (!browserSupported) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="glass-card p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-warning mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Browser Not Supported</h1>
          <p className="text-muted-foreground mb-4">
            Live Practice Overlay requires a modern browser with screen capture support. 
            Please use the latest version of Chrome, Edge, or Firefox on desktop.
          </p>
          <Button onClick={() => navigate('/interview-practice')} variant="outline">
            Back to Practice
          </Button>
        </div>
      </div>
    );
  }

  if (entitlementsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background relative ${intensity === 'magical' ? 'animate-fade-in-up' : ''}`}>
      {/* Consent Modal */}
      <ConsentModal
        open={showConsent}
        consentChecks={consentChecks}
        setConsentChecks={setConsentChecks}
        onAccept={handleConsentAccept}
        onCancel={() => navigate('/interview-practice')}
        canUseLiveOverlay={canUseLiveOverlay}
        minutesRemaining={minutesRemaining}
        plan={plan}
      />

      {/* Stop Confirmation Dialog */}
      <Dialog open={showStopConfirm} onOpenChange={setShowStopConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Session?</DialogTitle>
            <DialogDescription>
              This will stop the recording and generate your practice debrief. 
              All transcripts and coaching suggestions will be saved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStopConfirm(false)}>
              Continue Session
            </Button>
            <Button onClick={confirmStopSession} className="bg-destructive text-destructive-foreground">
              Stop & Generate Debrief
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Layout */}
      {!showConsent && (
        <div className="h-screen flex flex-col">
          {/* Top Bar */}
          <SessionTopBar
            sessionStartTime={sessionStartTime}
            isRecording={isRecording}
            minutesRemaining={minutesRemaining}
            minutesUsed={minutesUsed}
            plan={plan}
            onStop={handleStopSession}
          />

          {/* Main Content Area */}
          <div className="flex-1 relative overflow-hidden">
            {/* Call View (Video Canvas) */}
            <CallView
              videoRef={videoRef}
              isCapturing={isCapturing}
              onStartCapture={handleStartCapture}
              amplitude={amplitude}
              currentSpeaker={currentSpeaker}
            />

            {/* Floating Overlay Panel */}
            {isCapturing && (
              <CoachOverlayPanel
                transcripts={transcripts}
                coachingSuggestions={coachingSuggestions}
                rubricScores={rubricScores}
                answerDraft={answerDraft}
                isPinned={isPinned}
                setIsPinned={setIsPinned}
                opacity={opacity[0]}
                setOpacity={(val) => setOpacity([val])}
                speakFeedback={speakFeedback}
                setSpeakFeedback={setSpeakFeedback}
                sessionId={sessionId}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveOverlay;
