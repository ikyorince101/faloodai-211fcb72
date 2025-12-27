import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useMotion } from '@/contexts/MotionContext';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { intensity } = useMotion();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className={cn(
      "min-h-screen bg-background",
      intensity === 'off' && 'motion-off',
      intensity === 'subtle' && 'motion-subtle',
      intensity === 'magical' && 'motion-magical'
    )}>
      <Sidebar 
        isMobileOpen={isMobileMenuOpen} 
        onMobileClose={() => setIsMobileMenuOpen(false)} 
      />
      
      <div className="lg:ml-64 min-h-screen flex flex-col">
        <TopBar onMenuClick={() => setIsMobileMenuOpen(true)} />
        
        <main className="flex-1">
          <div className="constellation min-h-full">
            <div className="p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
