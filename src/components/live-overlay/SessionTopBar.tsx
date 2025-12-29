import React, { useState, useEffect } from 'react';
import { X, Clock, Circle, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SessionTopBarProps {
  sessionStartTime: Date | null;
  isRecording: boolean;
  minutesRemaining: number;
  minutesUsed: number;
  plan: string;
  onStop: () => void;
}

const SessionTopBar: React.FC<SessionTopBarProps> = ({
  sessionStartTime,
  isRecording,
  minutesRemaining,
  minutesUsed,
  plan,
  onStop,
}) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!sessionStartTime || !isRecording) return;

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - sessionStartTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime, isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-14 bg-card/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4">
      {/* Left: Recording indicator + Timer */}
      <div className="flex items-center gap-4">
        {isRecording && (
          <div className="flex items-center gap-2">
            <Circle className="w-3 h-3 fill-destructive text-destructive animate-pulse" />
            <span className="text-sm font-medium text-destructive">Recording</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-mono">{formatTime(elapsed)}</span>
        </div>
      </div>

      {/* Center: Status */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          Live Practice Overlay
        </Badge>
      </div>

      {/* Right: Credits + Stop */}
      <div className="flex items-center gap-4">
        {/* Credits Display */}
        <div className="flex items-center gap-2 text-sm">
          <CreditCard className="w-4 h-4 text-muted-foreground" />
          {plan === 'FREE_BYOK' ? (
            <span className="text-success">Unlimited</span>
          ) : plan === 'PRO' ? (
            <span className="text-muted-foreground">
              {minutesRemaining - Math.floor(elapsed / 60)} min left
            </span>
          ) : (
            <span className="text-destructive">No credits</span>
          )}
        </div>

        <Button
          variant="destructive"
          size="sm"
          onClick={onStop}
          className="gap-2"
        >
          <X className="w-4 h-4" />
          Stop Session
        </Button>
      </div>
    </div>
  );
};

export default SessionTopBar;
