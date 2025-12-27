import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  Mic, 
  BookOpen, 
  User,
  Sparkles,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMotion } from '@/contexts/MotionContext';

const navItems = [
  { 
    path: '/', 
    icon: LayoutDashboard, 
    label: 'Dashboard',
    description: 'Your command center'
  },
  { 
    path: '/jobs', 
    icon: Briefcase, 
    label: 'Job Tracker',
    description: 'Pipeline & interviews'
  },
  { 
    path: '/resume', 
    icon: FileText, 
    label: 'Resume Workspace',
    description: 'ATS-optimized versions'
  },
  { 
    path: '/interview', 
    icon: Mic, 
    label: 'Interview Practice',
    description: 'Mock voice sessions'
  },
  { 
    path: '/stories', 
    icon: BookOpen, 
    label: 'Story Bank',
    description: 'STAR stories'
  },
  { 
    path: '/profile', 
    icon: User, 
    label: 'Profile Hub',
    description: 'Your work history'
  },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { intensity } = useMotion();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-aurora flex items-center justify-center glow-primary">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          {intensity === 'magical' && (
            <div className="absolute inset-0 rounded-xl bg-gradient-aurora opacity-50 blur-lg animate-pulse-glow" />
          )}
        </div>
        <div>
          <h1 className="font-display font-bold text-xl text-foreground tracking-tight">
            FaloodAI
          </h1>
          <p className="text-xs text-muted-foreground">Career Performance</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300",
                "hover:bg-sidebar-accent/50",
                isActive && "nav-link-active"
              )}
              style={{
                animationDelay: intensity !== 'off' ? `${index * 50}ms` : '0ms'
              }}
            >
              <div className={cn(
                "p-2 rounded-lg transition-all duration-300",
                isActive 
                  ? "bg-primary/20 text-primary" 
                  : "bg-transparent text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium truncate transition-colors duration-300",
                  isActive ? "text-foreground" : "text-sidebar-foreground group-hover:text-foreground"
                )}>
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {item.description}
                </p>
              </div>
              {isActive && intensity === 'magical' && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Settings Link */}
      <div className="p-3 border-t border-sidebar-border">
        <NavLink
          to="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300",
            "hover:bg-sidebar-accent/50",
            location.pathname === '/settings' && "nav-link-active"
          )}
        >
          <div className={cn(
            "p-2 rounded-lg transition-all duration-300",
            location.pathname === '/settings'
              ? "bg-primary/20 text-primary"
              : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
          )}>
            <Settings className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium text-sidebar-foreground">Settings</span>
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
