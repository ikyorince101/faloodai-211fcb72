import React from 'react';
import { cn } from '@/lib/utils';
import { useMotion } from '@/contexts/MotionContext';

interface ATSAuraProps {
  score: number | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  name?: string;
}

const ATSAura: React.FC<ATSAuraProps> = ({ score, size = 'md', showLabel = true, name }) => {
  const { intensity } = useMotion();
  const displayScore = score ?? 0;
  
  const sizeClasses = {
    sm: 'w-14 h-14',
    md: 'w-20 h-20',
    lg: 'w-28 h-28'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  const getScoreColor = () => {
    if (displayScore >= 80) return 'hsl(var(--success))';
    if (displayScore >= 60) return 'hsl(var(--accent))';
    if (displayScore >= 40) return 'hsl(var(--primary))';
    return 'hsl(var(--warning))';
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={cn("relative", sizeClasses[size])}>
        {/* Outer glow - static, no blinking */}
        <div 
          className="absolute inset-0 rounded-full opacity-20 blur-md"
          style={{ background: getScoreColor() }}
        />
        
        {/* Ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="4"
          />
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            fill="none"
            stroke={getScoreColor()}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${(displayScore / 100) * 283} 283`}
            className="transition-all duration-700"
          />
        </svg>
        
        {/* Center */}
        <div className="absolute inset-2 rounded-full bg-card flex items-center justify-center">
          <span className={cn("font-display font-bold", textSizes[size])} style={{ color: getScoreColor() }}>
            {displayScore}
          </span>
        </div>
      </div>
      
      {showLabel && (
        <div className="text-center">
          {name && <p className="text-xs font-medium text-foreground truncate max-w-[100px]">{name}</p>}
          <span className="text-xs text-muted-foreground">ATS Score</span>
        </div>
      )}
    </div>
  );
};

export default ATSAura;
