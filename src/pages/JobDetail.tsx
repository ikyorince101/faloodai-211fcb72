import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useJobWithArtifacts, useUpdateJob, useDeleteJob, JobStage } from '@/hooks/useJobs';
import { useCreateRound } from '@/hooks/useInterviews';
import { useCreateSession } from '@/hooks/usePractice';
import { useMotion } from '@/contexts/MotionContext';
import ATSAura from '@/components/dashboard/ATSAura';
import InterviewRoundCard from '@/components/job/InterviewRoundCard';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, Briefcase, FileText, MessageSquare, Mic, 
  Calendar, Clock, ExternalLink, Trash2, Plus,
  AlertCircle, Sparkles, Loader2
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

const stages: JobStage[] = ['saved', 'applied', 'screening', 'phone_screen', 'technical', 'onsite', 'final', 'offer', 'accepted', 'rejected', 'withdrawn'];

const JobDetail: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useJobWithArtifacts(jobId);
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();
  const createRound = useCreateRound();
  const createSession = useCreateSession();
  const { intensity } = useMotion();

  const [activeTab, setActiveTab] = useState<'overview' | 'jd' | 'resumes' | 'interviews' | 'practice'>('overview');
  const [editingJD, setEditingJD] = useState(false);
  const [jdText, setJdText] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  // Interview round creation
  const [showAddRound, setShowAddRound] = useState(false);
  const [newRoundName, setNewRoundName] = useState('');
  const [newRoundDate, setNewRoundDate] = useState('');

  // Prep plan generation
  const [generatingPrepPlan, setGeneratingPrepPlan] = useState(false);

  React.useEffect(() => {
    if (data?.job) {
      setJdText(data.job.jd_text || '');
      setNotes(data.job.notes || '');
      setFollowUpDate(data.job.follow_up_at ? format(new Date(data.job.follow_up_at), "yyyy-MM-dd'T'HH:mm") : '');
    }
  }, [data?.job]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!data?.job) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-medium text-foreground mb-2">Job not found</h2>
        <Link to="/jobs" className="text-primary hover:underline">Back to Job Tracker</Link>
      </div>
    );
  }

  const { job, resumes, rounds, sessions } = data;
  const primaryResume = resumes[0];

  const handleStageChange = async (stage: JobStage) => {
    await updateJob.mutateAsync({ 
      id: job.id, 
      stage,
      applied_at: stage !== 'saved' && !job.applied_at ? new Date().toISOString() : job.applied_at
    });
    toast.success(`Stage updated to ${stage}`);
  };

  const handleSaveJD = async () => {
    await updateJob.mutateAsync({ id: job.id, jd_text: jdText });
    setEditingJD(false);
    toast.success('Job description saved');
  };

  const handleSaveNotes = async () => {
    await updateJob.mutateAsync({ id: job.id, notes });
    setEditingNotes(false);
    toast.success('Notes saved');
  };

  const handleFollowUpChange = async () => {
    await updateJob.mutateAsync({ 
      id: job.id, 
      follow_up_at: followUpDate ? new Date(followUpDate).toISOString() : null 
    });
    toast.success('Follow-up reminder set');
  };

  const handleDelete = async () => {
    if (confirm('Delete this job and all related data?')) {
      await deleteJob.mutateAsync(job.id);
      toast.success('Job deleted');
      navigate('/jobs');
    }
  };

  const handleAddRound = async () => {
    if (!newRoundName.trim()) {
      toast.error('Please enter a round name');
      return;
    }
    await createRound.mutateAsync({ 
      job_id: job.id, 
      round_name: newRoundName,
      round_date: newRoundDate ? new Date(newRoundDate).toISOString() : null,
    });
    toast.success('Round added');
    setShowAddRound(false);
    setNewRoundName('');
    setNewRoundDate('');
  };

  const handleGeneratePrepPlan = async (roundId: string, roundName: string) => {
    setGeneratingPrepPlan(true);
    try {
      // Determine mode based on round name
      let mode = 'behavioral';
      const lowerName = roundName.toLowerCase();
      if (lowerName.includes('technical') || lowerName.includes('coding')) mode = 'technical';
      else if (lowerName.includes('system') || lowerName.includes('design')) mode = 'system_design';
      else if (lowerName.includes('final') || lowerName.includes('executive')) mode = 'executive';

      // Generate interview plan
      const { data: plan, error } = await supabase.functions.invoke('generate-interview-plan', {
        body: {
          mode,
          difficulty: 'medium',
          duration: 30,
          targetRole: job.title,
          seniority: 'mid',
          jobDescription: job.jd_text || '',
          storyTags: [],
        }
      });

      if (error) throw error;

      // Create a practice session linked to this job
      const session = await createSession.mutateAsync({
        job_id: job.id,
        mode: mode as any,
        difficulty: 'medium',
        duration_minutes: 30,
        status: 'in_progress',
      });

      toast.success(`Prep plan generated with ${plan.questions.length} questions!`);
      navigate(`/interview/live?session=${session.id}`);
    } catch (error) {
      console.error('Error generating prep plan:', error);
      toast.error('Failed to generate prep plan');
    } finally {
      setGeneratingPrepPlan(false);
    }
  };

  const handleStartPractice = async () => {
    const session = await createSession.mutateAsync({ job_id: job.id, mode: 'behavioral' });
    toast.success('Practice session started');
    navigate(`/interview/live?session=${session.id}`);
  };

  const handleViewDebrief = (sessionId: string) => {
    navigate(`/session-debrief?session=${sessionId}`);
  };

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'jd', label: 'Job Description' },
    { key: 'resumes', label: `Resumes (${resumes.length})` },
    { key: 'interviews', label: `Interviews (${rounds.length})` },
    { key: 'practice', label: `Practice (${sessions.length})` },
  ];

  // Count sessions linked to each round (would need round_id on session, using mock for now)
  const getSessionCountForRound = (roundId: string) => 0;

  return (
    <div className={cn("max-w-6xl mx-auto", intensity !== 'off' && 'animate-fade-in-up')}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link to="/jobs" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to Jobs
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/20">
              <Briefcase className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">{job.company}</h1>
              <p className="text-muted-foreground">{job.title}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {job.url && (
            <a href={job.url} target="_blank" rel="noopener" className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground">
              <ExternalLink className="w-5 h-5" />
            </a>
          )}
          <button onClick={handleDelete} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stage selector */}
      <div className="glass-card p-4 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {stages.slice(0, 8).map(stage => (
            <button
              key={stage}
              onClick={() => handleStageChange(stage)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                job.stage === stage
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {stage.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main content */}
        <div className="flex-1">
          {/* Tabs */}
          <div className="flex gap-1 border-b border-border mb-6">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
                  activeTab === tab.key
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-4">
                  <p className="text-sm text-muted-foreground mb-1">Saved</p>
                  <p className="font-medium text-foreground">
                    {format(new Date(job.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-sm text-muted-foreground mb-1">Applied</p>
                  <p className="font-medium text-foreground">
                    {job.applied_at ? format(new Date(job.applied_at), 'MMM d, yyyy') : '-'}
                  </p>
                </div>
              </div>

              <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-foreground">Notes</p>
                  <button onClick={() => setEditingNotes(!editingNotes)} className="text-primary text-sm">
                    {editingNotes ? 'Cancel' : 'Edit'}
                  </button>
                </div>
                {editingNotes ? (
                  <div>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full h-32 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <button onClick={handleSaveNotes} className="mt-2 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm">
                      Save
                    </button>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                    {job.notes || 'No notes yet'}
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'jd' && (
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="font-medium text-foreground">Job Description</p>
                <button onClick={() => setEditingJD(!editingJD)} className="text-primary text-sm">
                  {editingJD ? 'Cancel' : 'Edit'}
                </button>
              </div>
              {editingJD ? (
                <div>
                  <textarea
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    className="w-full h-64 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Paste job description here..."
                  />
                  <button onClick={handleSaveJD} className="mt-2 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm">
                    Save
                  </button>
                </div>
              ) : jdText ? (
                <p className="text-muted-foreground text-sm whitespace-pre-wrap">{jdText}</p>
              ) : (
                <p className="text-muted-foreground text-sm">No job description added. Click Edit to paste one.</p>
              )}
            </div>
          )}

          {activeTab === 'resumes' && (
            <div className="space-y-4">
              {resumes.length === 0 ? (
                <div className="glass-card p-8 text-center">
                  <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No resume versions attached</p>
                  <Link to="/resume" className="text-primary text-sm hover:underline">Create one →</Link>
                </div>
              ) : (
                resumes.map(resume => (
                  <div key={resume.id} className="glass-card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">{resume.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Created {format(new Date(resume.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <ATSAura score={resume.ats_score} size="sm" showLabel={false} />
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'interviews' && (
            <div className="space-y-4">
              <Button onClick={() => setShowAddRound(true)} variant="outline" className="gap-2">
                <Plus className="w-4 h-4" /> Add Interview Round
              </Button>
              {rounds.length === 0 ? (
                <div className="glass-card p-8 text-center">
                  <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No interview rounds scheduled</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rounds.map(round => (
                    <InterviewRoundCard
                      key={round.id}
                      round={round}
                      onGeneratePrepPlan={handleGeneratePrepPlan}
                      linkedSessionCount={getSessionCountForRound(round.id)}
                    />
                  ))}
                </div>
              )}

              {generatingPrepPlan && (
                <div className="glass-card p-4 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-muted-foreground">Generating prep plan...</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'practice' && (
            <div className="space-y-4">
              <Button onClick={handleStartPractice} className="gap-2 bg-gradient-aurora text-background">
                <Mic className="w-4 h-4" /> Start Practice for This Job
              </Button>
              {sessions.length === 0 ? (
                <div className="glass-card p-8 text-center">
                  <Mic className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No practice sessions yet</p>
                </div>
              ) : (
                sessions.map(session => (
                  <div 
                    key={session.id} 
                    className="glass-card p-4 flex items-center justify-between cursor-pointer hover-halo"
                    onClick={() => handleViewDebrief(session.id)}
                  >
                    <div>
                      <p className="font-medium text-foreground capitalize">{session.mode} Practice</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(session.created_at), 'MMM d, yyyy')} • {session.duration_minutes} min
                      </p>
                    </div>
                    <span className={cn(
                      "px-2 py-1 rounded text-xs font-medium",
                      session.status === 'completed' && "bg-success/20 text-success",
                      session.status === 'in_progress' && "bg-warning/20 text-warning",
                      session.status === 'abandoned' && "bg-muted text-muted-foreground"
                    )}>
                      {session.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right rail */}
        <div className="w-64 flex-shrink-0 space-y-4">
          {/* ATS Score */}
          <div className="glass-card p-4 text-center">
            <p className="text-sm font-medium text-foreground mb-3">Resume ATS Score</p>
            {primaryResume ? (
              <ATSAura score={primaryResume.ats_score} size="lg" showLabel={false} />
            ) : (
              <div className="py-4">
                <p className="text-sm text-muted-foreground">No resume attached</p>
              </div>
            )}
          </div>

          {/* Follow-up reminder */}
          <div className="glass-card p-4">
            <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Follow-up Reminder
            </p>
            <input
              type="datetime-local"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              onBlur={handleFollowUpChange}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {job.follow_up_at && (
              <p className="text-xs text-muted-foreground mt-2">
                {formatDistanceToNow(new Date(job.follow_up_at), { addSuffix: true })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Add Round Dialog */}
      <Dialog open={showAddRound} onOpenChange={setShowAddRound}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Interview Round</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Round Name</Label>
              <Input
                value={newRoundName}
                onChange={(e) => setNewRoundName(e.target.value)}
                placeholder="e.g., Phone Screen, Technical, Final"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Date & Time (optional)</Label>
              <Input
                type="datetime-local"
                value={newRoundDate}
                onChange={(e) => setNewRoundDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowAddRound(false)}>Cancel</Button>
            <Button onClick={handleAddRound}>Add Round</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobDetail;
