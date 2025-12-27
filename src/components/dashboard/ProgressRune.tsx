import React from 'react';
import { cn } from '@/lib/utils';
import { useMotion } from '@/contexts/MotionContext';
import { TrendingUp, Check } from 'lucide-react';

interface ProgressRuneProps {
  category: string;
  currentScore: number;
  previousScore: number;
  maxScore?: number;
}

const ProgressRune: React.FC<ProgressRuneProps> = ({ 
  category, 
  currentScore, 
  previousScore, 
  maxScore = 100 
}) => {
  const { intensity } = useMotion();
  const improvement = currentScore - previousScore;
  const hasImproved = improvement > 0;
  const percentage = (currentScore / maxScore) * 100;

  return (
    <div className={cn(
      "glass-card p-4 hover-halo transition-all duration-300",
      hasImproved && intensity === 'magical' && 'animate-progress-rune'
    )}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-sm font-medium text-foreground">{category}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xl font-display font-bold text-foreground">{currentScore}</span>
            {hasImproved && (
              <span className="flex items-center gap-0.5 text-xs text-success">
                <TrendingUp className="w-3 h-3" />
                +{improvement}
              </span>
            )}
          </div>
        </div>
        {currentScore >= maxScore && (
          <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
            <Check className="w-4 h-4 text-success" />
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-500",
            percentage >= 80 ? "bg-gradient-to-r from-success to-accent" :
            percentage >= 60 ? "bg-gradient-to-r from-accent to-primary" :
            percentage >= 40 ? "bg-gradient-to-r from-primary to-warning" :
            "bg-gradient-to-r from-warning to-destructive"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressRune;
