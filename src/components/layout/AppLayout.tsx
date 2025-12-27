import React from 'react';
import Sidebar from './Sidebar';
import { useMotion } from '@/contexts/MotionContext';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { intensity } = useMotion();

  return (
    <div className={cn(
      "min-h-screen bg-background",
      intensity === 'off' && 'motion-off',
      intensity === 'subtle' && 'motion-subtle',
      intensity === 'magical' && 'motion-magical'
    )}>
      <Sidebar />
      <main className="ml-64 min-h-screen">
        <div className="constellation min-h-screen">
          <div className="p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
