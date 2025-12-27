import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Trophy, Target, TrendingUp, AlertCircle, ArrowRight, Lightbulb, CheckCircle2, Loader2, BookOpen, Briefcase } from 'lucide-react';
import { useMotion } from '@/contexts/MotionContext';
import { useJobs } from '@/hooks/useJobs';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface RubricDimension {
  dimension: string;
  avgScore: number;
  maxScore: number;
  feedback: string[];
}

interface QuestionBreakdown {
  questionId: number;
  questionText: string;
  overallScore: number;
  rubric: { dimension: string; score: number; feedback: string }[];
  strengths: string[];
  improvements: string[];
}

interface DebriefData {
  sessionId: string;
  mode: string;
  difficulty: string;
  duration: number;
  overallScore: number;
  totalQuestions: number;
  completedQuestions: number;
  rubricSummary: RubricDimension[];
  questionBreakdowns: QuestionBreakdown[];
  topStrengths: string[];
  topGaps: string[];
  drillPlan: string[];
  storyBankSuggestions: string[];
}

const SessionDebrief: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { intensity } = useMotion();
  const { data: jobs = [] } = useJobs();
  
  const sessionId = searchParams.get('session') || '';
  const [debrief, setDebrief] = useState<DebriefData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [linkedJobId, setLinkedJobId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      navigate('/interview-practice');
      return;
    }
    loadDebriefData();
  }, [sessionId]);

  const loadDebriefData = async () => {
    try {
      // Load session
      const { data: session, error: sessionError } = await supabase
        .from('practice_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      if (session.job_id) {
        setLinkedJobId(session.job_id);
      }

      // Load practice events for this session
      const { data: events, error: eventsError } = await supabase
        .from('practice_events')
        .select('*')
        .eq('session_id', sessionId)
        .eq('event_type', 'ai_feedback')
        .order('created_at', { ascending: true });

      if (eventsError) throw eventsError;

      // Aggregate rubric scores
      const rubricAgg: Record<string, { scores: number[]; feedback: string[] }> = {};
      const questionBreakdowns: QuestionBreakdown[] = [];
      const allStrengths: string[] = [];
      const allImprovements: string[] = [];

      events?.forEach((event, idx) => {
        const rubric = event.rubric as Record<string, number> | null;
        const feedback = event.feedback as { 
          overallFeedback?: string;
          strengths?: string[];
          improvements?: string[];
          rubric?: { dimension: string; score: number; feedback: string }[];
        } | null;

        if (rubric) {
          Object.entries(rubric).forEach(([dim, score]) => {
            if (!rubricAgg[dim]) {
              rubricAgg[dim] = { scores: [], feedback: [] };
            }
            rubricAgg[dim].scores.push(score);
          });
        }

        if (feedback?.strengths) {
          allStrengths.push(...feedback.strengths);
        }
        if (feedback?.improvements) {
          allImprovements.push(...feedback.improvements);
        }

        // Build question breakdown
        const rubricArray = feedback?.rubric || (rubric ? Object.entries(rubric).map(([dimension, score]) => ({
          dimension,
          score,
          feedback: ''
        })) : []);

        questionBreakdowns.push({
          questionId: idx + 1,
          questionText: event.question_text || `Question ${idx + 1}`,
          overallScore: rubricArray.length > 0 
            ? Math.round((rubricArray.reduce((sum, r) => sum + r.score, 0) / (rubricArray.length * 5)) * 100)
            : 0,
          rubric: rubricArray,
          strengths: feedback?.strengths || [],
          improvements: feedback?.improvements || [],
        });
      });

      // Calculate rubric summary
      const rubricSummary: RubricDimension[] = Object.entries(rubricAgg).map(([dimension, data]) => ({
        dimension,
        avgScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
        maxScore: 5,
        feedback: data.feedback,
      }));

      // Overall score
      const overallScore = rubricSummary.length > 0
        ? Math.round((rubricSummary.reduce((sum, r) => sum + r.avgScore, 0) / (rubricSummary.length * 5)) * 100)
        : 0;

      // Find top strengths and gaps
      const strengthCounts: Record<string, number> = {};
      const improvementCounts: Record<string, number> = {};
      
      allStrengths.forEach(s => {
        strengthCounts[s] = (strengthCounts[s] || 0) + 1;
      });
      allImprovements.forEach(i => {
        improvementCounts[i] = (improvementCounts[i] || 0) + 1;
      });

      const topStrengths = Object.entries(strengthCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([s]) => s);

      const topGaps = Object.entries(improvementCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([i]) => i);

      // Generate drill plan based on weak dimensions
      const weakDimensions = rubricSummary
        .filter(r => r.avgScore < 3)
        .sort((a, b) => a.avgScore - b.avgScore);

      const drillPlan = weakDimensions.map(d => 
        `Practice ${d.dimension.toLowerCase()} exercises (current avg: ${d.avgScore.toFixed(1)}/5)`
      );

      // Story bank suggestions
      const storyBankSuggestions = topGaps.slice(0, 2).map(gap => {
        if (gap.toLowerCase().includes('metric') || gap.toLowerCase().includes('number')) {
          return 'Add specific metrics to your Story Bank entries';
        }
        if (gap.toLowerCase().includes('result') || gap.toLowerCase().includes('outcome')) {
          return 'Strengthen the "Result" section of your stories';
        }
        if (gap.toLowerCase().includes('reflect')) {
          return 'Add reflection notes about lessons learned';
        }
        return `Focus on improving: ${gap}`;
      });

      setDebrief({
        sessionId,
        mode: session.mode,
        difficulty: session.difficulty,
        duration: session.duration_minutes || 0,
        overallScore,
        totalQuestions: questionBreakdowns.length,
        completedQuestions: questionBreakdowns.length,
        rubricSummary,
        questionBreakdowns,
        topStrengths,
        topGaps,
        drillPlan,
        storyBankSuggestions,
      });

      // Save debrief summary to session
      await supabase.from('practice_sessions').update({
        status: 'completed',
      }).eq('id', sessionId);

    } catch (error) {
      console.error('Error loading debrief:', error);
      toast.error('Failed to load session data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkToJob = async () => {
    if (!linkedJobId || linkedJobId === 'none') return;
    setIsSaving(true);
    try {
      await supabase.from('practice_sessions')
        .update({ job_id: linkedJobId })
        .eq('id', sessionId);
      toast.success('Session linked to job');
    } catch (error) {
      toast.error('Failed to link session');
    } finally {
      setIsSaving(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getDimensionColor = (score: number, max: number) => {
    const pct = (score / max) * 100;
    if (pct >= 80) return 'bg-success';
    if (pct >= 60) return 'bg-warning';
    return 'bg-destructive';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!debrief) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-medium text-foreground mb-2">Session Not Found</h2>
        <p className="text-muted-foreground mb-4">We couldn't find data for this session.</p>
        <Button onClick={() => navigate('/interview-practice')}>Back to Practice</Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">Session Debrief</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="capitalize">{debrief.mode}</Badge>
              <Badge variant="secondary" className="capitalize">{debrief.difficulty}</Badge>
              <span className="text-sm text-muted-foreground">
                {debrief.completedQuestions}/{debrief.totalQuestions} questions • {debrief.duration} min
              </span>
            </div>
          </div>
          <div className={`text-center ${intensity === 'magical' ? 'animate-breathe' : ''}`}>
            <div className={`text-5xl font-bold ${getScoreColor(debrief.overallScore)}`}>
              {debrief.overallScore}
            </div>
            <p className="text-sm text-muted-foreground">Overall Score</p>
          </div>
        </div>
      </div>

      {/* Strengths & Gaps */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-success" />
            <h3 className="font-semibold text-foreground">Top Strengths</h3>
          </div>
          {debrief.topStrengths.length > 0 ? (
            <ul className="space-y-2">
              {debrief.topStrengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Complete more questions to see patterns.</p>
          )}
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-warning" />
            <h3 className="font-semibold text-foreground">Areas to Improve</h3>
          </div>
          {debrief.topGaps.length > 0 ? (
            <ul className="space-y-2">
              {debrief.topGaps.map((g, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ArrowRight className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                  {g}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Complete more questions to see patterns.</p>
          )}
        </div>
      </div>

      {/* Rubric Summary */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Rubric Breakdown</h3>
        </div>
        {debrief.rubricSummary.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {debrief.rubricSummary.map((r, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{r.dimension}</span>
                  <span className={getScoreColor((r.avgScore / r.maxScore) * 100)}>
                    {r.avgScore.toFixed(1)}/{r.maxScore}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${getDimensionColor(r.avgScore, r.maxScore)}`}
                    style={{ width: `${(r.avgScore / r.maxScore) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No rubric data available.</p>
        )}
      </div>

      {/* Per-Question Breakdown */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-foreground mb-4">Question Breakdown</h3>
        <div className="space-y-4">
          {debrief.questionBreakdowns.map((q, i) => (
            <div key={i} className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <Badge variant="outline" className="mb-2">Q{q.questionId}</Badge>
                  <p className="text-sm text-foreground line-clamp-2">{q.questionText}</p>
                </div>
                <div className={`text-2xl font-bold ${getScoreColor(q.overallScore)}`}>
                  {q.overallScore}%
                </div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {q.rubric.map((r, ri) => (
                  <div key={ri} className="text-center">
                    <div className="text-xs text-muted-foreground mb-1 truncate">{r.dimension}</div>
                    <div className={`text-sm font-medium ${getScoreColor((r.score / 5) * 100)}`}>
                      {r.score}/5
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Drill Plan & Story Bank Suggestions */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-accent" />
            <h3 className="font-semibold text-foreground">Drill Plan</h3>
          </div>
          {debrief.drillPlan.length > 0 ? (
            <ul className="space-y-2">
              {debrief.drillPlan.map((d, i) => (
                <li key={i} className="flex items-center gap-2">
                  <input type="checkbox" className="rounded border-border" />
                  <span className="text-sm text-muted-foreground">{d}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Great job! No major weak areas detected.</p>
          )}
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Story Bank Upgrades</h3>
          </div>
          {debrief.storyBankSuggestions.length > 0 ? (
            <ul className="space-y-2">
              {debrief.storyBankSuggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ArrowRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Keep adding stories with strong metrics and reflections.</p>
          )}
          <Link to="/story-bank">
            <Button variant="outline" size="sm" className="mt-4 w-full gap-2">
              <BookOpen className="w-4 h-4" />
              Go to Story Bank
            </Button>
          </Link>
        </div>
      </div>

      {/* Link to Job */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-foreground">Link to Job & Interview Round</h3>
        </div>
        <div className="flex items-end gap-4 flex-wrap">
          <div className="flex-1 min-w-48">
            <Label className="text-sm text-muted-foreground">Link this session to a job</Label>
            <Select value={linkedJobId || 'none'} onValueChange={setLinkedJobId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select job" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No job</SelectItem>
                {jobs.map(job => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.company} - {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={handleLinkToJob} 
            disabled={!linkedJobId || linkedJobId === 'none' || isSaving}
          >
            {isSaving ? 'Saving...' : 'Link Session'}
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Button variant="outline" onClick={() => navigate('/interview-practice')}>
          Back to Practice Home
        </Button>
        <Button onClick={() => navigate('/interview-practice')} className="bg-gradient-aurora text-background gap-2">
          Start New Session
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default SessionDebrief;
