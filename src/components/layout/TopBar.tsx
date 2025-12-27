import React from 'react';
import { Menu } from 'lucide-react';
import Breadcrumb from './Breadcrumb';
import CreateMenu from './CreateMenu';
import AccountMenu from './AccountMenu';
import { useAuth } from '@/contexts/AuthContext';

interface TopBarProps {
  onMenuClick: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-40">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left side - Menu button (mobile) + Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <Menu className="w-5 h-5 text-muted-foreground" />
          </button>
          <Breadcrumb />
        </div>

        {/* Right side - Actions */}
        {user && (
          <div className="flex items-center gap-3">
            <CreateMenu />
            <AccountMenu />
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar;
