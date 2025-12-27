import React from 'react';
import { cn } from '@/lib/utils';
import { useMotion } from '@/contexts/MotionContext';
import { 
  Briefcase, 
  MessageSquare, 
  Calendar,
  ArrowRight,
  Clock
} from 'lucide-react';

interface PipelineStage {
  name: string;
  count: number;
  color: string;
}

const stages: PipelineStage[] = [
  { name: 'Applied', count: 12, color: 'bg-muted-foreground' },
  { name: 'Screening', count: 5, color: 'bg-accent' },
  { name: 'Interview', count: 3, color: 'bg-primary' },
  { name: 'Final', count: 1, color: 'bg-success' },
];

const upcomingItems = [
  { 
    type: 'interview',
    company: 'TechCorp',
    role: 'Senior Developer',
    time: 'Tomorrow, 2:00 PM',
    icon: MessageSquare
  },
  { 
    type: 'followup',
    company: 'StartupXYZ',
    role: 'Full Stack Engineer',
    time: 'In 3 days',
    icon: Clock
  },
];

const PipelineSnapshot: React.FC = () => {
  const { intensity } = useMotion();

  return (
    <div className="glass-card p-6 hover-halo">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Briefcase className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-display font-semibold text-foreground">Pipeline</h3>
            <p className="text-sm text-muted-foreground">21 active applications</p>
          </div>
        </div>
      </div>

      {/* Pipeline stages */}
      <div className="flex gap-2 mb-6">
        {stages.map((stage, index) => (
          <div 
            key={stage.name}
            className={cn(
              "flex-1 text-center p-3 rounded-xl transition-all duration-300",
              "bg-secondary/50 hover:bg-secondary/80",
              intensity !== 'off' && 'animate-fade-in-up'
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={cn(
              "w-3 h-3 rounded-full mx-auto mb-2",
              stage.color
            )} />
            <p className="text-xl font-display font-bold text-foreground">{stage.count}</p>
            <p className="text-xs text-muted-foreground">{stage.name}</p>
          </div>
        ))}
      </div>

      {/* Upcoming */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Coming Up
        </h4>
        {upcomingItems.map((item, index) => (
          <div 
            key={index}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl bg-secondary/30",
              "hover:bg-secondary/50 transition-all duration-300 cursor-pointer group"
            )}
          >
            <div className={cn(
              "p-2 rounded-lg",
              item.type === 'interview' ? 'bg-primary/20 text-primary' : 'bg-warning/20 text-warning'
            )}>
              <item.icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{item.company}</p>
              <p className="text-xs text-muted-foreground truncate">{item.role}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{item.time}</p>
              <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PipelineSnapshot;
