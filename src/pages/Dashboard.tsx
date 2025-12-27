import React from 'react';
import { useMotion } from '@/contexts/MotionContext';
import ATSAura from '@/components/dashboard/ATSAura';
import PracticePulse from '@/components/dashboard/PracticePulse';
import PipelineSnapshot from '@/components/dashboard/PipelineSnapshot';
import QuickActions from '@/components/dashboard/QuickActions';
import ProgressRune from '@/components/dashboard/ProgressRune';

const Dashboard: React.FC = () => {
  const { intensity } = useMotion();

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className={intensity !== 'off' ? 'animate-fade-in-up' : ''}>
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">
          Welcome back
        </h1>
        <p className="text-muted-foreground">
          Your career command center. Let's land that dream role.
        </p>
      </div>

      {/* Top Row - Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ATS Aura */}
        <div className="glass-card p-6 flex flex-col items-center justify-center hover-halo">
          <ATSAura score={78} size="lg" />
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Your resume is almost ready. Fix 2 issues to hit 90%.
          </p>
        </div>

        {/* Practice Pulse */}
        <div className="glass-card p-6 flex flex-col items-center justify-center hover-halo">
          <PracticePulse streakDays={7} isActive={false} />
        </div>

        {/* Quick Actions */}
        <div>
          <QuickActions />
        </div>
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PipelineSnapshot />
        
        {/* Skills Progress */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Interview Rubric Progress
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ProgressRune category="Technical Depth" currentScore={72} previousScore={65} />
            <ProgressRune category="Communication" currentScore={85} previousScore={80} />
            <ProgressRune category="Problem Solving" currentScore={68} previousScore={68} />
            <ProgressRune category="Leadership" currentScore={55} previousScore={50} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
