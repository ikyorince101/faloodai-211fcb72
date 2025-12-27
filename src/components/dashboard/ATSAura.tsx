import React from 'react';
import { cn } from '@/lib/utils';
import { useMotion } from '@/contexts/MotionContext';

interface ATSAuraProps {
  score: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const ATSAura: React.FC<ATSAuraProps> = ({ score, size = 'md', showLabel = true }) => {
  const { intensity } = useMotion();
  
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const getScoreColor = () => {
    if (score >= 80) return 'from-success via-accent to-success';
    if (score >= 60) return 'from-accent via-primary to-accent';
    if (score >= 40) return 'from-primary via-warning to-primary';
    return 'from-warning via-destructive to-warning';
  };

  const getGlowColor = () => {
    if (score >= 80) return 'hsl(var(--success))';
    if (score >= 60) return 'hsl(var(--accent))';
    if (score >= 40) return 'hsl(var(--primary))';
    return 'hsl(var(--warning))';
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn("relative", sizeClasses[size])}>
        {/* Outer glow ring */}
        <div 
          className={cn(
            "absolute inset-0 rounded-full opacity-30 blur-md",
            intensity === 'magical' && 'animate-pulse-glow'
          )}
          style={{ 
            background: `conic-gradient(${getGlowColor()}, transparent, ${getGlowColor()})`,
          }}
        />
        
        {/* Rotating gradient ring */}
        <div 
          className={cn(
            "absolute inset-0 rounded-full",
            intensity === 'magical' && 'animate-rotate-slow'
          )}
          style={{
            background: `conic-gradient(from 0deg, ${getGlowColor()}, transparent 30%, ${getGlowColor()} 50%, transparent 80%, ${getGlowColor()})`,
            opacity: 0.6
          }}
        />
        
        {/* Inner circle */}
        <div className="absolute inset-2 rounded-full bg-card flex items-center justify-center border border-border/50">
          <div className="text-center">
            <span className={cn(
              "font-display font-bold text-glow",
              size === 'sm' && 'text-lg',
              size === 'md' && 'text-2xl',
              size === 'lg' && 'text-3xl'
            )} style={{ color: getGlowColor() }}>
              {score}
            </span>
            <span className="text-xs text-muted-foreground block">%</span>
          </div>
        </div>
      </div>
      
      {showLabel && (
        <span className="text-xs font-medium text-muted-foreground">ATS Readiness</span>
      )}
    </div>
  );
};

export default ATSAura;
