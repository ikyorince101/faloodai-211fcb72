import React from 'react';
import { Video, Mic, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMotion } from '@/contexts/MotionContext';

interface CallViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isCapturing: boolean;
  onStartCapture: () => void;
  amplitude: number;
  currentSpeaker: 'user' | 'interviewer' | null;
}

const CallView: React.FC<CallViewProps> = ({
  videoRef,
  isCapturing,
  onStartCapture,
  amplitude,
  currentSpeaker,
}) => {
  const { intensity } = useMotion();

  return (
    <div className="w-full h-full relative bg-gradient-to-b from-background via-card to-background">
      {/* Practice Mode Watermark - Always visible */}
      <div className="absolute top-4 right-4 z-20 pointer-events-none">
        <div className="bg-warning/20 backdrop-blur-sm border border-warning/30 rounded-lg px-4 py-2">
          <span className="text-warning font-bold text-sm tracking-wider">PRACTICE MODE</span>
        </div>
      </div>

      {/* Video Element */}
      {isCapturing ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center">
          {/* Constellation effect */}
          <div className="constellation absolute inset-0" />

          {/* Start Capture UI */}
          <div className="relative z-10 text-center space-y-6 max-w-md mx-auto px-4">
            <div 
              className={`w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto ${
                intensity === 'magical' ? 'pulse-orb' : ''
              }`}
            >
              <Video className="w-12 h-12 text-primary" />
            </div>

            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                Ready to Capture
              </h2>
              <p className="text-muted-foreground">
                Click the button below to select your browser tab with the video call 
                (Teams, Zoom, Google Meet, etc.)
              </p>
            </div>

            <Button
              onClick={onStartCapture}
              size="lg"
              className="gap-2 bg-gradient-aurora text-background"
            >
              <Play className="w-5 h-5" />
              Start Capture
            </Button>

            <p className="text-xs text-muted-foreground">
              You'll be prompted to select which tab to capture. Choose the one with your video call.
            </p>
          </div>
        </div>
      )}

      {/* Practice Pulse Indicator (when capturing) */}
      {isCapturing && (
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center transition-transform duration-100"
            style={{
              transform: `scale(${1 + amplitude * 0.3})`,
              boxShadow: amplitude > 0.1 
                ? `0 0 ${20 + amplitude * 30}px hsl(var(--destructive) / ${0.3 + amplitude * 0.4})`
                : undefined
            }}
          >
            <Mic className="w-5 h-5 text-destructive" />
          </div>
          {currentSpeaker && (
            <span className="text-sm font-medium text-foreground bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full">
              {currentSpeaker === 'user' ? 'You' : 'Interviewer'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default CallView;
