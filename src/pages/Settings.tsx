import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { useMotion, MotionIntensity } from '@/contexts/MotionContext';
import { cn } from '@/lib/utils';

const motionOptions: { value: MotionIntensity; label: string; description: string }[] = [
  { value: 'off', label: 'Off', description: 'No animations' },
  { value: 'subtle', label: 'Subtle', description: 'Minimal transitions' },
  { value: 'magical', label: 'Magical', description: 'Full experience' },
];

const SettingsPage: React.FC = () => {
  const { intensity, setIntensity, prefersReducedMotion } = useMotion();

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Customize your FaloodAI experience.</p>
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-medium text-foreground">Motion Intensity</h2>
        </div>
        {prefersReducedMotion && (
          <p className="text-sm text-warning mb-4">Your system prefers reduced motion. Animations are disabled.</p>
        )}
        <div className="grid grid-cols-3 gap-3">
          {motionOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setIntensity(option.value)}
              disabled={prefersReducedMotion}
              className={cn(
                "p-4 rounded-xl border transition-all text-left",
                intensity === option.value
                  ? "border-primary bg-primary/10"
                  : "border-border bg-secondary/50 hover:border-primary/50",
                prefersReducedMotion && "opacity-50 cursor-not-allowed"
              )}
            >
              <p className="font-medium text-foreground">{option.label}</p>
              <p className="text-xs text-muted-foreground">{option.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
