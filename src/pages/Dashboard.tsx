import React from 'react';
import { useMotion } from '@/contexts/MotionContext';
import { usePipelineCounts, useUpcomingFollowUps } from '@/hooks/useJobs';
import { useRecentResumes } from '@/hooks/useResumes';
import { useWeeklyPracticeStats, useRecentRubricScores } from '@/hooks/usePractice';
import ATSAura from '@/components/dashboard/ATSAura';
import PracticePulse from '@/components/dashboard/PracticePulse';
import QuickActions from '@/components/dashboard/QuickActions';
import ProgressRune from '@/components/dashboard/ProgressRune';
import { cn } from '@/lib/utils';
import { 
  Briefcase, Calendar, Clock, TrendingUp, 
  ArrowRight, Sparkles, Target
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';

const stageConfig: { key: string; label: string; color: string }[] = [
  { key: 'saved', label: 'Saved', color: 'bg-muted-foreground' },
  { key: 'applied', label: 'Applied', color: 'bg-accent' },
  { key: 'screening', label: 'Screen', color: 'bg-primary' },
  { key: 'phone_screen', label: 'Phone', color: 'bg-primary' },
  { key: 'technical', label: 'Technical', color: 'bg-primary' },
  { key: 'onsite', label: 'Onsite', color: 'bg-success' },
  { key: 'offer', label: 'Offer', color: 'bg-success' },
];

const suggestedDrills = [
  { title: 'Tell me about yourself', category: 'Behavioral', difficulty: 'Easy' },
  { title: 'Describe a challenging project', category: 'Technical', difficulty: 'Medium' },
  { title: 'Leadership experience', category: 'Behavioral', difficulty: 'Medium' },
];

const Dashboard: React.FC = () => {
  const { intensity } = useMotion();
  const { data: pipelineCounts = {}, isLoading: loadingPipeline } = usePipelineCounts();
  const { data: recentResumes = [], isLoading: loadingResumes } = useRecentResumes(3);
  const { data: practiceStats, isLoading: loadingPractice } = useWeeklyPracticeStats();
  const { data: rubricScores = [] } = useRecentRubricScores();
  const { data: upcomingFollowUps = [] } = useUpcomingFollowUps();

  const totalJobs = Object.values(pipelineCounts).reduce((a, b) => a + b, 0);

  const breathingClass = intensity === 'magical' ? 'animate-pulse' : '';

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
        {/* Pipeline Snapshot */}
        <div className={cn("glass-card p-6 hover-halo", breathingClass)}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/20">
              <Briefcase className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground">Pipeline</h3>
              <p className="text-sm text-muted-foreground">{totalJobs} active applications</p>
            </div>
          </div>
          
          {loadingPipeline ? (
            <div className="h-20 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : totalJobs === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">No jobs tracked yet</p>
              <Link to="/jobs" className="text-sm text-primary hover:underline">Add your first job →</Link>
            </div>
          ) : (
            <div className="flex gap-1.5 flex-wrap">
              {stageConfig.map(stage => {
                const count = pipelineCounts[stage.key] || 0;
                if (count === 0) return null;
                return (
                  <div 
                    key={stage.key}
                    className="flex-1 min-w-[60px] text-center p-2 rounded-lg bg-secondary/50"
                  >
                    <div className={cn("w-2 h-2 rounded-full mx-auto mb-1", stage.color)} />
                    <p className="text-lg font-display font-bold text-foreground">{count}</p>
                    <p className="text-xs text-muted-foreground">{stage.label}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ATS Readiness */}
        <div className={cn("glass-card p-6 hover-halo", breathingClass)}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-accent/20">
              <Target className="w-5 h-5 text-accent" />
            </div>
            <h3 className="font-display font-semibold text-foreground">ATS Readiness</h3>
          </div>
          
          {loadingResumes ? (
            <div className="h-20 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          ) : recentResumes.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">No resumes yet</p>
              <Link to="/resume" className="text-sm text-primary hover:underline">Create your first →</Link>
            </div>
          ) : (
            <div className="flex justify-center gap-4">
              {recentResumes.map(resume => (
                <ATSAura 
                  key={resume.id} 
                  score={resume.ats_score} 
                  size="sm" 
                  name={resume.name}
                />
              ))}
            </div>
          )}
        </div>

        {/* Practice Streak */}
        <div className={cn("glass-card p-6 hover-halo", breathingClass)}>
          <PracticePulse 
            streakDays={practiceStats?.streak || 0} 
            sessionsThisWeek={practiceStats?.sessionsThisWeek || 0}
            isActive={false} 
          />
        </div>
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <QuickActions />

        {/* Rubric Progress */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Interview Rubric Progress
          </h3>
          {rubricScores.length === 0 ? (
            <div className="glass-card p-6 text-center">
              <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Complete practice sessions to see your progress</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {rubricScores.slice(0, 4).map(score => (
                <ProgressRune 
                  key={score.dimension}
                  category={score.dimension} 
                  currentScore={score.avgScore} 
                  previousScore={score.avgScore - score.trend}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Suggested Drills */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Suggested Drills
          </h3>
          <div className="space-y-2">
            {suggestedDrills.map((drill, idx) => (
              <Link
                key={idx}
                to="/interview"
                className="glass-card p-4 flex items-center gap-4 hover-halo group cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-accent/20 text-accent">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {drill.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {drill.category} • {drill.difficulty}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>

        {/* Upcoming Follow-ups */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Upcoming Follow-ups
          </h3>
          {upcomingFollowUps.length === 0 ? (
            <div className="glass-card p-6 text-center">
              <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No follow-ups scheduled</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingFollowUps.map(job => (
                <Link
                  key={job.id}
                  to={`/jobs/${job.id}`}
                  className="glass-card p-4 flex items-center gap-4 hover-halo group"
                >
                  <div className="p-2 rounded-lg bg-warning/20 text-warning">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{job.company}</p>
                    <p className="text-xs text-muted-foreground">{job.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-warning">
                      {formatDistanceToNow(new Date(job.follow_up_at!), { addSuffix: true })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(job.follow_up_at!), 'MMM d')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
