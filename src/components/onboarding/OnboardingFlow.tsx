import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMotion } from '@/contexts/MotionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  Upload, FileText, Sparkles, CheckCircle, ArrowRight, 
  Briefcase, Code, Loader2, AlertCircle, User, Wand2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ParsedResume {
  fullName?: string | null;
  email?: string | null;
  location?: string | null;
  workHistory?: Array<{
    company: string;
    title: string;
    startDate?: string;
    endDate?: string | null;
    description?: string;
    highlights?: string[];
  }>;
  skills?: Array<{ name: string; level: string; category?: string }>;
  projects?: Array<{
    name: string;
    description?: string;
    technologies?: string[];
    url?: string | null;
  }>;
  education?: Array<{
    institution: string;
    degree?: string;
    field?: string;
    graduationYear?: string | null;
  }>;
  targetRoles?: string[];
  seniority?: string;
}

const OnboardingFlow: React.FC = () => {
  const { intensity } = useMotion();
  const { session } = useAuth();
  const navigate = useNavigate();
  const updateProfile = useUpdateProfile();
  
  const [step, setStep] = useState<'upload' | 'parsing' | 'review' | 'complete'>('upload');
  const [resumeText, setResumeText] = useState('');
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For now, we only handle text-based files
    const validTypes = ['text/plain', 'application/pdf'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
      toast.error('Please upload a text or PDF file');
      return;
    }

    try {
      // Read as text for .txt files
      if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        const text = await file.text();
        setResumeText(text);
        toast.success('Resume loaded');
      } else {
        // For PDF, we'll ask user to paste text
        toast.info('For PDFs, please copy and paste the text content');
      }
    } catch {
      toast.error('Failed to read file');
    }
  }, []);

  const handleParse = async () => {
    if (!resumeText.trim() || resumeText.length < 50) {
      toast.error('Please provide more resume content');
      return;
    }

    setIsParsing(true);
    setError(null);
    setStep('parsing');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('parse-resume', {
        body: { resumeText },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setParsedData(data);
      setStep('review');
      toast.success('Resume parsed successfully!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse resume';
      setError(message);
      setStep('upload');
      toast.error(message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!parsedData) return;

    setIsSaving(true);
    try {
      await updateProfile.mutateAsync({
        full_name: parsedData.fullName || undefined,
        location: parsedData.location || undefined,
        seniority: parsedData.seniority || undefined,
        target_roles: parsedData.targetRoles || [],
        skills: (parsedData.skills || []) as any,
        work_history: (parsedData.workHistory || []) as any,
        projects: (parsedData.projects || []) as any,
      });

      setStep('complete');
      toast.success('Profile updated successfully!');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = () => {
    navigate('/profile');
  };

  const handleSkip = () => {
    navigate('/app');
  };

  return (
    <div className={cn(
      "min-h-screen bg-background flex items-center justify-center p-4",
      intensity !== 'off' && 'animate-fade-in'
    )}>
      <div className="max-w-2xl w-full">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {['upload', 'parsing', 'review', 'complete'].map((s, i) => (
            <React.Fragment key={s}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                step === s 
                  ? "bg-primary text-primary-foreground scale-110" 
                  : ['parsing', 'review', 'complete'].indexOf(step) > i - 1
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              )}>
                {i + 1}
              </div>
              {i < 3 && (
                <div className={cn(
                  "w-12 h-0.5 transition-colors",
                  ['parsing', 'review', 'complete'].indexOf(step) > i - 1
                    ? "bg-primary/50"
                    : "bg-muted"
                )} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className={cn("glass-card p-8 text-center", intensity !== 'off' && 'animate-fade-in-up')}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6">
              <Upload className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">
              Welcome! Let's set up your profile
            </h1>
            <p className="text-muted-foreground mb-8">
              Upload your resume and we'll automatically extract your work history, skills, and more.
            </p>

            {error && (
              <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-left">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <label className="block">
                <div className="border-2 border-dashed border-border rounded-xl p-8 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer group">
                  <FileText className="w-10 h-10 text-muted-foreground group-hover:text-primary mx-auto mb-3 transition-colors" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload a text file or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    TXT, MD supported
                  </p>
                </div>
                <input
                  type="file"
                  accept=".txt,.md,text/plain"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or paste your resume</span>
                </div>
              </div>

              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume content here..."
                className="w-full h-48 px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              />

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  className="flex-1"
                >
                  Skip for now
                </Button>
                <Button
                  onClick={handleParse}
                  disabled={!resumeText.trim() || resumeText.length < 50}
                  className="flex-1 gap-2"
                >
                  <Wand2 className="w-4 h-4" />
                  Parse Resume
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Parsing Step */}
        {step === 'parsing' && (
          <div className={cn("glass-card p-8 text-center", intensity !== 'off' && 'animate-fade-in-up')}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-white animate-pulse" />
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">
              Analyzing your resume...
            </h2>
            <p className="text-muted-foreground mb-8">
              Our AI is extracting your work history, skills, and projects.
            </p>
            <div className="flex items-center justify-center gap-2 text-primary">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">This usually takes 10-20 seconds</span>
            </div>
          </div>
        )}

        {/* Review Step */}
        {step === 'review' && parsedData && (
          <div className={cn("space-y-6", intensity !== 'off' && 'animate-fade-in-up')}>
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">
                    {parsedData.fullName || 'Your Profile'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {parsedData.location || 'Location not detected'}
                    {parsedData.seniority && ` • ${parsedData.seniority.charAt(0).toUpperCase() + parsedData.seniority.slice(1)} level`}
                  </p>
                </div>
              </div>

              {parsedData.targetRoles && parsedData.targetRoles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {parsedData.targetRoles.map((role, i) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                      {role}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Work History */}
            {parsedData.workHistory && parsedData.workHistory.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  Work History ({parsedData.workHistory.length} positions)
                </h3>
                <div className="space-y-4">
                  {parsedData.workHistory.slice(0, 3).map((job, i) => (
                    <div key={i} className="p-4 rounded-lg bg-secondary/50 border border-border">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-medium text-foreground">{job.title}</h4>
                        <span className="text-xs text-muted-foreground">
                          {job.startDate} - {job.endDate || 'Present'}
                        </span>
                      </div>
                      <p className="text-sm text-primary mb-2">{job.company}</p>
                      {job.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                      )}
                    </div>
                  ))}
                  {parsedData.workHistory.length > 3 && (
                    <p className="text-sm text-muted-foreground text-center">
                      +{parsedData.workHistory.length - 3} more positions
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Skills */}
            {parsedData.skills && parsedData.skills.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                  <Code className="w-5 h-5 text-primary" />
                  Skills ({parsedData.skills.length} found)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {parsedData.skills.slice(0, 15).map((skill, i) => (
                    <span 
                      key={i} 
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm",
                        skill.level === 'expert' || skill.level === 'advanced'
                          ? "bg-accent/20 text-accent"
                          : skill.level === 'intermediate'
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                      )}
                    >
                      {skill.name}
                    </span>
                  ))}
                  {parsedData.skills.length > 15 && (
                    <span className="px-3 py-1.5 text-sm text-muted-foreground">
                      +{parsedData.skills.length - 15} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Projects */}
            {parsedData.projects && parsedData.projects.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Projects ({parsedData.projects.length} found)
                </h3>
                <div className="space-y-3">
                  {parsedData.projects.slice(0, 3).map((project, i) => (
                    <div key={i} className="p-3 rounded-lg bg-secondary/50 border border-border">
                      <h4 className="font-medium text-foreground text-sm">{project.name}</h4>
                      {project.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                      )}
                      {project.technologies && project.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {project.technologies.map((tech, j) => (
                            <span key={j} className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-xs">
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep('upload')}
                className="flex-1"
              >
                Re-upload
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex-1 gap-2"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Save to Profile
              </Button>
            </div>
          </div>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <div className={cn("glass-card p-8 text-center", intensity !== 'off' && 'animate-fade-in-up')}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-success to-accent flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">
              You're all set!
            </h2>
            <p className="text-muted-foreground mb-8">
              Your profile has been updated with your work history, skills, and projects.
            </p>
            <Button onClick={handleComplete} className="gap-2">
              Go to Profile
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingFlow;
