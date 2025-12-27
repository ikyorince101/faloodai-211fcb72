import React from 'react';
import { useMotion } from '@/contexts/MotionContext';
import { usePipelineCounts, useJobs } from '@/hooks/useJobs';
import { usePracticeSessions, useWeeklyPracticeStats, useRecentRubricScores } from '@/hooks/usePractice';
import { useResumeVersions } from '@/hooks/useResumes';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, BarChart2, Activity, Target, 
  Calendar, Zap, FileText, ArrowUp, ArrowDown, Minus
} from 'lucide-react';
import { format, subDays, startOfDay, isAfter } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';

const RUBRIC_DIMENSIONS = ['Structure', 'Specificity', 'Impact', 'Ownership', 'Reflection', 'Brevity'];

const Analytics: React.FC = () => {
  const { intensity } = useMotion();
  const { data: jobs = [] } = useJobs();
  const { data: sessions = [] } = usePracticeSessions();
  const { data: practiceStats } = useWeeklyPracticeStats();
  const { data: rubricScores = [] } = useRecentRubricScores();
  const { data: resumes = [] } = useResumeVersions();
  const { data: pipelineCounts = {} } = usePipelineCounts();

  // Pipeline conversion metrics
  const pipelineData = [
    { stage: 'Saved', count: pipelineCounts['saved'] || 0, color: 'hsl(var(--muted-foreground))' },
    { stage: 'Applied', count: pipelineCounts['applied'] || 0, color: 'hsl(var(--accent))' },
    { stage: 'Screen', count: (pipelineCounts['screening'] || 0) + (pipelineCounts['phone_screen'] || 0), color: 'hsl(var(--primary))' },
    { stage: 'Interview', count: (pipelineCounts['technical'] || 0) + (pipelineCounts['onsite'] || 0) + (pipelineCounts['final'] || 0), color: 'hsl(var(--primary))' },
    { stage: 'Offer', count: (pipelineCounts['offer'] || 0) + (pipelineCounts['accepted'] || 0), color: 'hsl(var(--success))' },
  ];

  // Practice volume over last 14 days
  const practiceVolumeData = React.useMemo(() => {
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const date = subDays(new Date(), 13 - i);
      const dayStart = startOfDay(date);
      const count = sessions.filter(s => {
        const sessionDate = startOfDay(new Date(s.created_at));
        return sessionDate.getTime() === dayStart.getTime();
      }).length;
      return {
        date: format(date, 'MMM d'),
        sessions: count,
      };
    });
    return last14Days;
  }, [sessions]);

  // ATS score distribution
  const atsDistribution = React.useMemo(() => {
    const buckets = [
      { range: '0-50', count: 0, color: 'hsl(var(--destructive))' },
      { range: '51-70', count: 0, color: 'hsl(var(--warning))' },
      { range: '71-85', count: 0, color: 'hsl(var(--primary))' },
      { range: '86-100', count: 0, color: 'hsl(var(--success))' },
    ];
    resumes.forEach(r => {
      const score = r.ats_score || 0;
      if (score <= 50) buckets[0].count++;
      else if (score <= 70) buckets[1].count++;
      else if (score <= 85) buckets[2].count++;
      else buckets[3].count++;
    });
    return buckets;
  }, [resumes]);

  // Rubric trends mock data (would need historical data in real implementation)
  const rubricTrendsData = rubricScores.map(score => ({
    dimension: score.dimension,
    current: score.avgScore,
    previous: Math.max(0, score.avgScore - score.trend),
    trend: score.trend,
  }));

  const TrendIndicator = ({ trend }: { trend: number }) => {
    if (trend > 0) return <ArrowUp className="w-4 h-4 text-success" />;
    if (trend < 0) return <ArrowDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className={cn("max-w-7xl mx-auto space-y-8", intensity !== 'off' && 'animate-fade-in-up')}>
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">Track your progress and identify areas for improvement.</p>
      </div>

      {/* Top Stats */}
      <div className="grid sm:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{practiceStats?.streak || 0}</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{sessions.length}</p>
              <p className="text-xs text-muted-foreground">Total Sessions</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{jobs.length}</p>
              <p className="text-xs text-muted-foreground">Jobs Tracked</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{resumes.length}</p>
              <p className="text-xs text-muted-foreground">Resume Versions</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Rubric Improvement Trends */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold text-foreground">Rubric Progress</h3>
          </div>
          {rubricTrendsData.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Complete practice sessions to see rubric trends</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rubricTrendsData.map(item => (
                <div key={item.dimension}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground capitalize">{item.dimension}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{item.current}%</span>
                      <TrendIndicator trend={item.trend} />
                    </div>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-aurora rounded-full transition-all duration-500"
                      style={{ width: `${item.current}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Practice Volume */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-5 h-5 text-accent" />
            <h3 className="font-display font-semibold text-foreground">Practice Volume (14 days)</h3>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={practiceVolumeData}>
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Bar dataKey="sessions" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline Conversion */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart2 className="w-5 h-5 text-success" />
            <h3 className="font-display font-semibold text-foreground">Pipeline Funnel</h3>
          </div>
          <div className="space-y-3">
            {pipelineData.map((stage, i) => {
              const maxCount = Math.max(...pipelineData.map(s => s.count), 1);
              const width = (stage.count / maxCount) * 100;
              return (
                <div key={stage.stage}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground">{stage.stage}</span>
                    <span className="text-sm font-medium text-foreground">{stage.count}</span>
                  </div>
                  <div className="h-6 bg-secondary rounded-lg overflow-hidden">
                    <div 
                      className="h-full rounded-lg transition-all duration-500"
                      style={{ width: `${width}%`, backgroundColor: stage.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ATS Score Distribution */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <FileText className="w-5 h-5 text-warning" />
            <h3 className="font-display font-semibold text-foreground">ATS Score Distribution</h3>
          </div>
          {resumes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Create resumes to see ATS distribution</p>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <div className="w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={atsDistribution.filter(b => b.count > 0)}
                      dataKey="count"
                      nameKey="range"
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                    >
                      {atsDistribution.filter(b => b.count > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {atsDistribution.map(bucket => (
                  <div key={bucket.range} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: bucket.color }} />
                    <span className="text-sm text-muted-foreground flex-1">{bucket.range}</span>
                    <span className="text-sm font-medium text-foreground">{bucket.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
