import React from 'react';
import { cn } from '@/lib/utils';
import { useMotion } from '@/contexts/MotionContext';
import { Mic, Flame } from 'lucide-react';

interface PracticePulseProps {
  isActive?: boolean;
  streakDays: number;
  sessionsThisWeek?: number;
}

const PracticePulse: React.FC<PracticePulseProps> = ({ 
  isActive = false, 
  streakDays,
  sessionsThisWeek = 0 
}) => {
  const { intensity } = useMotion();

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {/* Subtle glow ring - no blinking */}
        {isActive && (
          <div className="absolute inset-0 rounded-full bg-accent/10 scale-110" />
        )}
        
        {/* Main orb */}
        <div className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center relative",
          "bg-gradient-to-br from-accent/20 to-primary/20",
          "border border-accent/30"
        )}>
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            "bg-gradient-to-br from-accent to-primary",
            isActive && "glow-accent"
          )}>
            <Mic className="w-5 h-5 text-accent-foreground" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="text-center w-full">
        <div className="flex items-center justify-center gap-1">
          <Flame className={cn(
            "w-4 h-4",
            streakDays > 0 ? "text-warning" : "text-muted-foreground"
          )} />
          <span className="text-xl font-display font-bold text-foreground">{streakDays}</span>
          <span className="text-sm text-muted-foreground">day streak</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {sessionsThisWeek} sessions this week
        </p>
      </div>
    </div>
  );
};

export default PracticePulse;
