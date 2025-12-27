import React from 'react';
import { cn } from '@/lib/utils';
import { useMotion } from '@/contexts/MotionContext';
import { 
  Mic, 
  FileText, 
  BookOpen, 
  Plus,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const quickActions = [
  {
    title: 'Start Practice',
    description: 'Mock interview session',
    icon: Mic,
    href: '/interview',
    gradient: 'from-accent to-primary',
    glowClass: 'glow-accent'
  },
  {
    title: 'New Resume',
    description: 'Create tailored version',
    icon: FileText,
    href: '/resume',
    gradient: 'from-primary to-glow-primary',
    glowClass: 'glow-primary'
  },
  {
    title: 'Add Story',
    description: 'Save a STAR story',
    icon: BookOpen,
    href: '/stories',
    gradient: 'from-success to-accent',
    glowClass: 'glow-success'
  },
  {
    title: 'Track Job',
    description: 'Add application',
    icon: Plus,
    href: '/jobs',
    gradient: 'from-warning to-primary',
    glowClass: ''
  },
];

const QuickActions: React.FC = () => {
  const { intensity } = useMotion();

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((action, index) => (
          <Link
            key={action.title}
            to={action.href}
            className={cn(
              "glass-card p-4 group cursor-pointer",
              "hover-halo transition-all duration-300",
              intensity !== 'off' && 'animate-fade-in-scale'
            )}
            style={{ animationDelay: `${index * 75}ms` }}
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
              "bg-gradient-to-br",
              action.gradient,
              intensity === 'magical' && action.glowClass
            )}>
              <action.icon className="w-5 h-5 text-background" />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {action.title}
                </h4>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
