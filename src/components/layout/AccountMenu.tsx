import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const AccountMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
    navigate('/auth');
  };

  const initials = user?.email?.slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-secondary/50 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-sm font-medium text-foreground border border-border/50">
          {initials}
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 text-muted-foreground transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 top-full mt-2 w-56 z-50 glass-card p-2 animate-fade-in-scale">
            <div className="px-3 py-2 border-b border-border/50 mb-2">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.email}
              </p>
              <p className="text-xs text-muted-foreground">Free Plan</p>
            </div>

            <button
              onClick={() => { setIsOpen(false); navigate('/profile'); }}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors hover:bg-secondary/50"
            >
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground">Profile</span>
            </button>

            <button
              onClick={() => { setIsOpen(false); navigate('/settings'); }}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors hover:bg-secondary/50"
            >
              <Settings className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground">Settings</span>
            </button>

            <div className="border-t border-border/50 mt-2 pt-2">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors hover:bg-destructive/10 text-destructive"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Sign out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AccountMenu;
