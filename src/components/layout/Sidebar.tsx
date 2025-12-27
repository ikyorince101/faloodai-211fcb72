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
  Settings,
  X,
  BarChart2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMotion } from '@/contexts/MotionContext';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', description: 'Your command center' },
  { path: '/jobs', icon: Briefcase, label: 'Job Tracker', description: 'Pipeline & interviews' },
  { path: '/resume', icon: FileText, label: 'Resume Workspace', description: 'ATS-optimized versions' },
  { path: '/interview', icon: Mic, label: 'Interview Practice', description: 'Mock voice sessions' },
  { path: '/stories', icon: BookOpen, label: 'Story Bank', description: 'STAR stories' },
  { path: '/profile', icon: User, label: 'Profile Hub', description: 'Your work history' },
  { path: '/analytics', icon: BarChart2, label: 'Analytics', description: 'Progress & trends' },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onMobileClose }) => {
  const location = useLocation();
  const { intensity } = useMotion();

  const sidebarContent = (
    <div className="h-full flex flex-col bg-sidebar">
      {/* Logo */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            {intensity === 'magical' && (
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary to-accent opacity-50 blur-lg animate-pulse" />
            )}
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-foreground tracking-tight">
              FaloodAI
            </h1>
            <p className="text-xs text-muted-foreground">Career Performance</p>
          </div>
        </div>
        
        {/* Mobile close button */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="lg:hidden p-2 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
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
              onClick={onMobileClose}
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
          onClick={onMobileClose}
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
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 h-screen w-64 border-r border-sidebar-border z-50">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <>
          <div 
            className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={onMobileClose}
          />
          <aside className="lg:hidden fixed left-0 top-0 h-screen w-72 z-50 animate-slide-in-left border-r border-sidebar-border">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
};

export default Sidebar;
