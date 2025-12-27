import React, { useState, useMemo } from 'react';
import { FileText, Plus, Wand2, RefreshCw, Check, AlertTriangle, ChevronDown } from 'lucide-react';
import { useResumeVersions, useCreateResume, useUpdateResume, ResumeVersion } from '@/hooks/useResumes';
import { useJobs } from '@/hooks/useJobs';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type Emphasis = 'skills' | 'leadership' | 'impact';

interface ATSIssue {
  type: 'error' | 'warning';
  message: string;
  fix?: string;
}

const ResumeWorkspace: React.FC = () => {
  const { data: resumes = [], isLoading } = useResumeVersions();
  const { data: jobs = [] } = useJobs();
  const { data: profile } = useProfile();
  const createResume = useCreateResume();
  const updateResume = useUpdateResume();

  const [selectedJobId, setSelectedJobId] = useState<string>('none');
  const [jdText, setJdText] = useState('');
  const [emphasis, setEmphasis] = useState<Emphasis>('skills');
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [resumeName, setResumeName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedResume = useMemo(() => {
    return resumes.find(r => r.id === selectedResumeId) || null;
  }, [resumes, selectedResumeId]);

  const selectedJob = useMemo(() => {
    return jobs.find(j => j.id === selectedJobId) || null;
  }, [jobs, selectedJobId]);

  // Mock ATS analysis based on resume content
  const atsAnalysis = useMemo(() => {
    if (!selectedResume) return null;
    
    const content = selectedResume.content as Record<string, unknown> | null;
    const issues: ATSIssue[] = [];
    let score = selectedResume.ats_score || 75;

    // Mock issues based on content structure
    if (!content || Object.keys(content).length === 0) {
      issues.push({ type: 'error', message: 'Resume content is empty', fix: 'Add your work experience and skills' });
      score = 30;
    }
    if (!jdText && !selectedJob?.jd_text) {
      issues.push({ type: 'warning', message: 'No job description provided', fix: 'Paste a JD to optimize keywords' });
    }
    if (score < 80) {
      issues.push({ type: 'warning', message: 'Consider adding more quantified achievements', fix: 'Include metrics like percentages, revenue, or time saved' });
    }

    return { score, issues };
  }, [selectedResume, jdText, selectedJob]);

  const handleGenerate = async () => {
    if (!resumeName.trim()) {
      toast.error('Please enter a resume name');
      return;
    }

    setIsGenerating(true);
    
    // Simulate generation delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const content = {
        name: profile?.full_name || 'Your Name',
        email: profile?.email || 'email@example.com',
        location: profile?.location || 'Location',
        summary: `Experienced professional with focus on ${emphasis}.`,
        experience: profile?.work_history || [],
        skills: profile?.skills || [],
        projects: profile?.projects || [],
        emphasis,
        generatedAt: new Date().toISOString(),
      };

      const result = await createResume.mutateAsync({
        name: resumeName,
        job_id: selectedJobId !== 'none' ? selectedJobId : null,
        content,
        ats_score: Math.floor(70 + Math.random() * 25),
        ats_report: { keywords: [], suggestions: [] },
      });

      setSelectedResumeId(result.id);
      setResumeName('');
      toast.success('Resume generated!');
    } catch (error) {
      toast.error('Failed to generate resume');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (!selectedResume) return;

    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      await updateResume.mutateAsync({
        id: selectedResume.id,
        ats_score: Math.min(100, (selectedResume.ats_score || 70) + 5),
        ats_report: { improved: true, keywords: [], suggestions: [] },
      });
      toast.success('Resume optimized!');
    } catch (error) {
      toast.error('Failed to optimize');
    } finally {
      setIsGenerating(false);
    }
  };

  const resumeContent = selectedResume?.content as Record<string, unknown> | null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Resume Workspace</h1>
          <p className="text-muted-foreground">Create ATS-optimized resume versions for each job.</p>
        </div>
        {resumes.length > 0 && (
          <Select value={selectedResumeId || ''} onValueChange={setSelectedResumeId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select version..." />
            </SelectTrigger>
            <SelectContent>
              {resumes.map(resume => (
                <SelectItem key={resume.id} value={resume.id}>
                  {resume.name} {resume.ats_score && `(${resume.ats_score}%)`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid lg:grid-cols-[300px_1fr_300px] gap-6">
        {/* Left Panel - Controls */}
        <div className="glass-card p-4 space-y-4 h-fit">
          <div>
            <Label>Link to Job (optional)</Label>
            <Select value={selectedJobId} onValueChange={setSelectedJobId}>
              <SelectTrigger>
                <SelectValue placeholder="No job selected" />
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

          <div>
            <Label>Job Description</Label>
            <Textarea
              value={jdText || selectedJob?.jd_text || ''}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste job description here..."
              rows={6}
              className="text-sm"
            />
          </div>

          <div>
            <Label>Emphasis</Label>
            <RadioGroup value={emphasis} onValueChange={(v) => setEmphasis(v as Emphasis)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="skills" id="skills" />
                <Label htmlFor="skills" className="font-normal">Technical Skills</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="leadership" id="leadership" />
                <Label htmlFor="leadership" className="font-normal">Leadership</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="impact" id="impact" />
                <Label htmlFor="impact" className="font-normal">Business Impact</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label>Resume Name</Label>
            <Input
              value={resumeName}
              onChange={(e) => setResumeName(e.target.value)}
              placeholder="e.g., Google PM v1"
            />
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className="w-full gap-2 bg-gradient-aurora text-background"
          >
            <Wand2 className="w-4 h-4" />
            {isGenerating ? 'Generating...' : 'Generate Resume'}
          </Button>
        </div>

        {/* Center Panel - Resume Preview */}
        <div className="glass-card p-6 min-h-[600px]">
          {selectedResume && resumeContent ? (
            <div className="space-y-6 font-serif">
              {/* Header */}
              <div className="text-center border-b border-border pb-4">
                <h2 className="text-2xl font-bold text-foreground">
                  {resumeContent.name as string || 'Your Name'}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {resumeContent.email as string} • {resumeContent.location as string}
                </p>
              </div>

              {/* Summary */}
              {resumeContent.summary && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-foreground border-b border-border pb-1 mb-2">
                    Summary
                  </h3>
                  <p className="text-sm text-muted-foreground">{resumeContent.summary as string}</p>
                </div>
              )}

              {/* Experience */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-foreground border-b border-border pb-1 mb-2">
                  Experience
                </h3>
                {Array.isArray(resumeContent.experience) && (resumeContent.experience as Array<Record<string, string>>).length > 0 ? (
                  (resumeContent.experience as Array<Record<string, string>>).map((exp, i) => (
                    <div key={i} className="mb-3">
                      <div className="flex justify-between">
                        <span className="font-semibold text-foreground">{exp.title || 'Position'}</span>
                        <span className="text-sm text-muted-foreground">{exp.period || ''}</span>
                      </div>
                      <p className="text-sm text-primary">{exp.company || 'Company'}</p>
                      {exp.description && (
                        <p className="text-sm text-muted-foreground mt-1">{exp.description}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">Add work history in Profile Hub</p>
                )}
              </div>

              {/* Skills */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-foreground border-b border-border pb-1 mb-2">
                  Skills
                </h3>
                {Array.isArray(resumeContent.skills) && (resumeContent.skills as Array<Record<string, string> | string>).length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {(resumeContent.skills as Array<Record<string, string> | string>).map((skill, i) => (
                      <span key={i} className="text-sm bg-accent/50 px-2 py-0.5 rounded">
                        {typeof skill === 'string' ? skill : skill.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Add skills in Profile Hub</p>
                )}
              </div>

              <p className="text-xs text-muted-foreground text-center pt-4">
                Generated with {resumeContent.emphasis as string} emphasis
              </p>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {resumes.length === 0 ? 'No resumes yet' : 'Select a resume version'}
                </h3>
                <p className="text-muted-foreground text-sm max-w-xs">
                  {resumes.length === 0 
                    ? 'Use the controls on the left to generate your first resume.'
                    : 'Choose from the dropdown above or generate a new version.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - ATS Validation */}
        <div className="glass-card p-4 space-y-4 h-fit">
          <h3 className="font-semibold text-foreground">ATS Validation</h3>
          
          {atsAnalysis && selectedResume ? (
            <>
              {/* ATS Score Ring */}
              <div className="flex justify-center py-4">
                <div className="relative w-32 h-32">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="hsl(var(--muted))"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={atsAnalysis.score >= 80 ? 'hsl(var(--primary))' : atsAnalysis.score >= 60 ? 'hsl(var(--warning, 45 93% 47%))' : 'hsl(var(--destructive))'}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${atsAnalysis.score * 2.51} 251`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-foreground">{atsAnalysis.score}</span>
                    <span className="text-xs text-muted-foreground">ATS Score</span>
                  </div>
                </div>
              </div>

              {/* Issues List */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Issues & Suggestions</h4>
                {atsAnalysis.issues.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-green-500">
                    <Check className="w-4 h-4" />
                    <span>No issues found!</span>
                  </div>
                ) : (
                  atsAnalysis.issues.map((issue, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg text-sm ${
                        issue.type === 'error' 
                          ? 'bg-destructive/10 border border-destructive/20' 
                          : 'bg-warning/10 border border-warning/20'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                          issue.type === 'error' ? 'text-destructive' : 'text-warning'
                        }`} />
                        <div>
                          <p className="text-foreground">{issue.message}</p>
                          {issue.fix && (
                            <p className="text-muted-foreground text-xs mt-1">
                              💡 {issue.fix}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Button 
                onClick={handleRegenerate}
                disabled={isGenerating}
                variant="outline"
                className="w-full gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                Regenerate with Fixes
              </Button>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Generate or select a resume to see ATS analysis
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeWorkspace;
