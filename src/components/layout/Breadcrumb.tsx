import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/jobs': 'Job Tracker',
  '/resume': 'Resume Workspace',
  '/interview': 'Interview Practice',
  '/stories': 'Story Bank',
  '/profile': 'Profile Hub',
  '/settings': 'Settings',
  '/auth': 'Authentication',
};

const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  const crumbs = [
    { path: '/', label: 'Home', icon: Home },
  ];

  if (location.pathname !== '/') {
    const label = routeLabels[location.pathname] || pathSegments[pathSegments.length - 1];
    crumbs.push({ path: location.pathname, label, icon: undefined });
  }

  return (
    <nav className="flex items-center gap-1 text-sm">
      {crumbs.map((crumb, index) => (
        <React.Fragment key={crumb.path}>
          {index > 0 && (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
          <Link
            to={crumb.path}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors",
              index === crumbs.length - 1
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            {crumb.icon && <crumb.icon className="w-4 h-4" />}
            <span>{crumb.label}</span>
          </Link>
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;
