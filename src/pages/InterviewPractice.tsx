import React, { useState, useMemo } from 'react';
import { Mic, Play, Clock, Target, Zap, Filter, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { usePracticeSessions, useWeeklyPracticeStats, useRecentRubricScores, useCreateSession, PracticeMode, PracticeDifficulty } from '@/hooks/usePractice';
import { useJobs } from '@/hooks/useJobs';
import { useStories } from '@/hooks/useStories';
import { useProfile } from '@/hooks/useProfile';
import { useMotion } from '@/contexts/MotionContext';
import { useEntitlements } from '@/hooks/useEntitlements';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import CreditsDisplay from '@/components/billing/CreditsDisplay';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface InterviewQuestion {
  id: number;
  question: string;
  competencies: string[];
  followUps: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

interface QuestionPlan {
  questions: InterviewQuestion[];
  estimatedDuration: number;
  mode: string;
}

const modeLabels: Record<string, string> = {
  behavioral: 'Behavioral',
  technical: 'Technical',
  system_design: 'System Design',
  executive: 'Executive Concise',
  mixed: 'Mixed',
};

const difficultyColors: Record<string, string> = {
  easy: 'text-success',
  medium: 'text-warning',
  hard: 'text-destructive',
};

const InterviewPractice: React.FC = () => {
  const navigate = useNavigate();
  const { data: sessions = [], isLoading } = usePracticeSessions();
  const { data: weeklyStats } = useWeeklyPracticeStats();
  const { data: rubricScores = [] } = useRecentRubricScores();
  const { data: jobs = [] } = useJobs();
  const { data: stories = [] } = useStories();
  const { data: profile } = useProfile();
  const createSession = useCreateSession();
  const { intensity } = useMotion();
  const { canRunInterview, incrementUsage, isPro } = useEntitlements();

  const [showNewSession, setShowNewSession] = useState(false);
  const [mode, setMode] = useState<PracticeMode>('behavioral');
  const [difficulty, setDifficulty] = useState<PracticeDifficulty>('medium');
  const [duration, setDuration] = useState(15);
  const [filterJobId, setFilterJobId] = useState<string>('all');
  const [selectedJobId, setSelectedJobId] = useState<string>('none');
  const [customJd, setCustomJd] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [questionPlan, setQuestionPlan] = useState<QuestionPlan | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Extract unique tags from stories
  const storyTags = useMemo(() => {
    const tags = new Set<string>();
    stories.forEach(story => {
      const storyTagList = story.tags as string[] | null;
      storyTagList?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [stories]);

  // Filter sessions by job
  const filteredSessions = useMemo(() => {
    if (filterJobId === 'all') return sessions;
    return sessions.filter(s => s.job_id === filterJobId);
  }, [sessions, filterJobId]);

  // Drill recommendations based on weak rubric areas
  const drillRecommendations = useMemo(() => {
    const weakAreas = rubricScores
      .filter(r => r.avgScore < 70)
      .sort((a, b) => a.avgScore - b.avgScore)
      .slice(0, 3);
    
    return weakAreas.map(area => ({
      dimension: area.dimension,
      score: area.avgScore,
      suggestion: `Practice ${area.dimension.toLowerCase()} scenarios to improve from ${area.avgScore}%`,
    }));
  }, [rubricScores]);

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    
    try {
      const selectedJob = jobs.find(j => j.id === selectedJobId);
      const jobDescription = customJd || selectedJob?.jd_text || '';

      const { data, error } = await supabase.functions.invoke('generate-interview-plan', {
        body: {
          mode,
          difficulty,
          duration,
          targetRole: profile?.target_roles?.[0] || '',
          seniority: profile?.seniority || 'mid',
          jobDescription,
          storyTags,
        }
      });

      if (error) throw error;
      
      setQuestionPlan(data as QuestionPlan);
      setCurrentQuestionIndex(0);
      toast.success(`Generated ${data.questions.length} interview questions!`);
    } catch (error) {
      console.error('Error generating plan:', error);
      toast.error('Failed to generate interview plan');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartSession = async () => {
    if (!canRunInterview) {
      toast.error('You need API keys or Pro subscription to run interviews');
      return;
    }

    try {
      const session = await createSession.mutateAsync({
        mode,
        difficulty,
        duration_minutes: duration,
        job_id: selectedJobId !== 'none' ? selectedJobId : null,
        status: 'in_progress',
      });

      // Increment usage for Pro users at session start
      if (isPro) {
        await incrementUsage('interview');
      }

      toast.success('Practice session started!');
      setShowNewSession(false);
      setQuestionPlan(null);
      // Navigate to live interview room
      navigate(`/interview/live?session=${session.id}`);
    } catch (error) {
      toast.error('Failed to start session');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Interview Practice</h1>
          <p className="text-muted-foreground">Mock voice sessions with AI coaching and rubric scoring.</p>
        </div>
        <Button onClick={() => setShowNewSession(true)} className="gap-2 bg-gradient-aurora text-background">
          <Play className="w-4 h-4" /> New Session
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className={`glass-card p-4 ${intensity === 'magical' ? 'animate-breathe' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{weeklyStats?.streak || 0}</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </div>
          </div>
        </div>
        <div className={`glass-card p-4 ${intensity === 'magical' ? 'animate-breathe' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{weeklyStats?.sessionsThisWeek || 0}</p>
              <p className="text-xs text-muted-foreground">Sessions This Week</p>
            </div>
          </div>
        </div>
        <div className={`glass-card p-4 ${intensity === 'magical' ? 'animate-breathe' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{sessions.length}</p>
              <p className="text-xs text-muted-foreground">Total Sessions</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        {/* Session History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Session History</h2>
            <Select value={filterJobId} onValueChange={setFilterJobId}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by job" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                {jobs.map(job => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.company} - {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="glass-card p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <Mic className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No sessions yet</h3>
              <p className="text-muted-foreground mb-4">Start your first practice session to build your interview skills.</p>
              <Button onClick={() => setShowNewSession(true)} variant="outline">
                Start Practicing
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSessions.map(session => {
                const job = jobs.find(j => j.id === session.job_id);
                return (
                  <div
                    key={session.id}
                    onClick={() => navigate(`/session/${session.id}/debrief`)}
                    className="glass-card p-4 flex items-center justify-between cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        session.status === 'completed' ? 'bg-success/20' : 'bg-warning/20'
                      }`}>
                        <Mic className={`w-5 h-5 ${
                          session.status === 'completed' ? 'text-success' : 'text-warning'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {modeLabels[session.mode]} Practice
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(session.created_at), 'MMM d, yyyy')} • {session.duration_minutes} min • {session.difficulty}
                        </p>
                        {job && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {job.company}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Drill Recommendations */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Recommended Drills</h2>
          
          {drillRecommendations.length === 0 ? (
            <div className="glass-card p-4 text-center">
              <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Complete more sessions to get personalized drill recommendations.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {drillRecommendations.map((drill, i) => (
                <div key={i} className="glass-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground capitalize">{drill.dimension}</span>
                    <span className={`text-sm font-medium ${
                      drill.score < 50 ? 'text-destructive' : 'text-warning'
                    }`}>
                      {drill.score}%
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{drill.suggestion}</p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-2 w-full"
                    onClick={() => {
                      setMode('behavioral');
                      setShowNewSession(true);
                    }}
                  >
                    Practice Now
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Session Dialog */}
      <Dialog open={showNewSession} onOpenChange={setShowNewSession}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {questionPlan ? 'Question Deck' : 'New Practice Session'}
            </DialogTitle>
          </DialogHeader>

          {!questionPlan ? (
            <div className="space-y-4">
              {/* Mode Selection */}
              <div>
                <Label>Interview Mode</Label>
                <RadioGroup 
                  value={mode} 
                  onValueChange={(v) => setMode(v as PracticeMode)}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2"
                >
                  {Object.entries(modeLabels).map(([value, label]) => (
                    <div key={value} className="flex items-center">
                      <RadioGroupItem value={value} id={value} className="peer sr-only" />
                      <Label
                        htmlFor={value}
                        className="flex-1 cursor-pointer rounded-lg border-2 border-muted bg-popover p-3 text-center hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10"
                      >
                        {label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Difficulty */}
              <div>
                <Label>Difficulty</Label>
                <RadioGroup 
                  value={difficulty} 
                  onValueChange={(v) => setDifficulty(v as PracticeDifficulty)}
                  className="flex gap-2 mt-2"
                >
                  {['easy', 'medium', 'hard'].map(d => (
                    <div key={d} className="flex items-center">
                      <RadioGroupItem value={d} id={d} className="peer sr-only" />
                      <Label
                        htmlFor={d}
                        className="cursor-pointer rounded-lg border-2 border-muted bg-popover px-4 py-2 capitalize hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10"
                      >
                        {d}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Duration */}
              <div>
                <Label>Duration (minutes)</Label>
                <RadioGroup 
                  value={String(duration)} 
                  onValueChange={(v) => setDuration(Number(v))}
                  className="flex gap-2 mt-2"
                >
                  {[10, 15, 20, 30].map(d => (
                    <div key={d} className="flex items-center">
                      <RadioGroupItem value={String(d)} id={`dur-${d}`} className="peer sr-only" />
                      <Label
                        htmlFor={`dur-${d}`}
                        className="cursor-pointer rounded-lg border-2 border-muted bg-popover px-4 py-2 hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10"
                      >
                        {d} min
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Link to Job */}
              <div>
                <Label>Link to Job (optional)</Label>
                <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="No job" />
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

              {/* Custom JD */}
              <div>
                <Label>Custom Job Description (optional)</Label>
                <Textarea
                  value={customJd}
                  onChange={(e) => setCustomJd(e.target.value)}
                  placeholder="Paste a job description for tailored questions..."
                  rows={3}
                  className="mt-2"
                />
              </div>

              {/* Story Tags Preview */}
              {storyTags.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Your Story Tags</Label>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {storyTags.slice(0, 8).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {storyTags.length > 8 && (
                      <Badge variant="outline" className="text-xs">
                        +{storyTags.length - 8} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Credits Display */}
              <div className="pt-4 border-t border-border">
                <CreditsDisplay type="interview" />
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowNewSession(false)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleGeneratePlan} 
                  disabled={isGenerating || !canRunInterview}
                  className="flex-1 gap-2"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isGenerating ? 'Generating...' : 'Generate Questions'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Question Deck */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Question {currentQuestionIndex + 1} of {questionPlan.questions.length}</span>
                <span>{questionPlan.mode} • {questionPlan.estimatedDuration} min</span>
              </div>

              {/* Progress Dots */}
              <div className="flex gap-1 justify-center">
                {questionPlan.questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentQuestionIndex(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === currentQuestionIndex 
                        ? 'bg-primary w-6' 
                        : 'bg-muted hover:bg-muted-foreground'
                    }`}
                  />
                ))}
              </div>

              {/* Current Question Card */}
              <div className="glass-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className={difficultyColors[questionPlan.questions[currentQuestionIndex].difficulty]}>
                    {questionPlan.questions[currentQuestionIndex].difficulty}
                  </Badge>
                  <div className="flex gap-1">
                    {questionPlan.questions[currentQuestionIndex].competencies.map(comp => (
                      <Badge key={comp} variant="outline" className="text-xs">
                        {comp}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <p className="text-lg font-medium text-foreground">
                  {questionPlan.questions[currentQuestionIndex].question}
                </p>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">Follow-up probes:</p>
                  <ul className="space-y-1">
                    {questionPlan.questions[currentQuestionIndex].followUps.map((fu, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary">→</span>
                        {fu}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="flex-1"
                >
                  Previous
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex(Math.min(questionPlan.questions.length - 1, currentQuestionIndex + 1))}
                  disabled={currentQuestionIndex === questionPlan.questions.length - 1}
                  className="flex-1"
                >
                  Next
                </Button>
              </div>

              <div className="flex gap-2 pt-2 border-t border-border">
                <Button variant="outline" onClick={() => setQuestionPlan(null)} className="flex-1">
                  Back to Setup
                </Button>
                <Button onClick={handleStartSession} disabled={!canRunInterview} className="flex-1 gap-2 bg-gradient-aurora text-background">
                  <Play className="w-4 h-4" />
                  Start Session
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InterviewPractice;
