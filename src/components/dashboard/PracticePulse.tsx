import React from 'react';
import { cn } from '@/lib/utils';
import { useMotion } from '@/contexts/MotionContext';
import { Mic } from 'lucide-react';

interface PracticePulseProps {
  isActive?: boolean;
  streakDays: number;
}

const PracticePulse: React.FC<PracticePulseProps> = ({ isActive = false, streakDays }) => {
  const { intensity } = useMotion();

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {/* Pulse rings */}
        {isActive && intensity === 'magical' && (
          <>
            <div className="absolute inset-0 rounded-full bg-accent/20 animate-ping" />
            <div 
              className="absolute inset-0 rounded-full bg-accent/10" 
              style={{ animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite', animationDelay: '0.5s' }}
            />
          </>
        )}
        
        {/* Main orb */}
        <div className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center relative",
          "bg-gradient-to-br from-accent/20 to-primary/20",
          "border border-accent/30",
          isActive && intensity !== 'off' && 'pulse-orb'
        )}>
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            "bg-gradient-to-br from-accent to-primary",
            isActive && "glow-accent"
          )}>
            <Mic className="w-6 h-6 text-accent-foreground" />
          </div>
        </div>
      </div>

      {/* Streak info */}
      <div className="text-center">
        <div className="flex items-center gap-1 justify-center">
          <span className="text-2xl font-display font-bold text-foreground">{streakDays}</span>
          <span className="text-sm text-muted-foreground">day streak</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {isActive ? 'Session in progress...' : 'Keep practicing!'}
        </p>
      </div>
    </div>
  );
};

export default PracticePulse;
