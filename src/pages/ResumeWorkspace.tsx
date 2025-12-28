import React, { useState, useMemo, useCallback } from 'react';
import { FileText, Wand2, RefreshCw, Check, AlertTriangle, Download, FileDown, Info, Sparkles } from 'lucide-react';
import { useResumeVersions, useCreateResume, useUpdateResume } from '@/hooks/useResumes';
import { useJobs } from '@/hooks/useJobs';
import { useProfile } from '@/hooks/useProfile';
import { useMotion } from '@/contexts/MotionContext';
import { useEntitlements } from '@/hooks/useEntitlements';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import CreditsDisplay from '@/components/billing/CreditsDisplay';
import EntitlementGate from '@/components/billing/EntitlementGate';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Emphasis = 'skills' | 'leadership' | 'impact';

interface ATSIssue {
  category: 'formatting' | 'content' | 'keywords';
  type: 'error' | 'warning';
  message: string;
  fix: string;
}

interface ATSReport {
  score: number;
  issues: ATSIssue[];
  keywordCoverage: {
    found: string[];
    missing: string[];
    coverage: number;
  };
  formattingPassed: boolean;
  explanation: string;
}

const ResumeWorkspace: React.FC = () => {
  const { data: resumes = [] } = useResumeVersions();
  const { data: jobs = [] } = useJobs();
  const { data: profile } = useProfile();
  const createResume = useCreateResume();
  const updateResume = useUpdateResume();
  const { intensity } = useMotion();
  const { canGenerateResume, incrementUsage, isPro } = useEntitlements();

  const [selectedJobId, setSelectedJobId] = useState<string>('none');
  const [jdText, setJdText] = useState('');
  const [emphasis, setEmphasis] = useState<Emphasis>('skills');
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [resumeName, setResumeName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [atsReport, setAtsReport] = useState<ATSReport | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showSealStamp, setShowSealStamp] = useState(false);

  const selectedResume = useMemo(() => {
    return resumes.find(r => r.id === selectedResumeId) || null;
  }, [resumes, selectedResumeId]);

  const selectedJob = useMemo(() => {
    return jobs.find(j => j.id === selectedJobId) || null;
  }, [jobs, selectedJobId]);

  const resumeContent = selectedResume?.content as Record<string, unknown> | null;

  const runATSValidation = useCallback(async () => {
    if (!selectedResume || !resumeContent) return;

    setIsValidating(true);
    try {
      const jobDesc = jdText || selectedJob?.jd_text || '';
      
      const { data, error } = await supabase.functions.invoke('ats-validate', {
        body: { resumeContent, jobDescription: jobDesc }
      });

      if (error) throw error;
      
      setAtsReport(data as ATSReport);
      
      // Update resume with new score
      await updateResume.mutateAsync({
        id: selectedResume.id,
        ats_score: data.score,
        ats_report: data,
      });
      
      toast.success(`ATS Score: ${data.score}/100`);
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Failed to validate resume');
    } finally {
      setIsValidating(false);
    }
  }, [selectedResume, resumeContent, jdText, selectedJob, updateResume]);

  const handleGenerate = async () => {
    if (!resumeName.trim()) {
      toast.error('Please enter a resume name');
      return;
    }

    if (!canGenerateResume) {
      toast.error('You need API keys or Pro subscription to generate resumes');
      return;
    }

    setIsGenerating(true);
    
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
        ats_score: null,
        ats_report: null,
      });

      // Increment usage for Pro users
      if (isPro) {
        await incrementUsage('resume');
      }

      setSelectedResumeId(result.id);
      setResumeName('');
      setAtsReport(null);
      toast.success('Resume generated! Run ATS validation to check compatibility.');
    } catch (error) {
      toast.error('Failed to generate resume');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async (format: 'docx' | 'txt') => {
    if (!selectedResume || !resumeContent) return;

    // Block PDF/DOCX if formatting fails
    if (format === 'docx' && atsReport && !atsReport.formattingPassed) {
      toast.error('Cannot export DOCX: Fix formatting issues first');
      return;
    }

    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-resume', {
        body: { 
          resumeContent, 
          format,
          resumeName: selectedResume.name 
        }
      });

      if (error) throw error;

      // Create download link
      const blob = new Blob([data], { 
        type: format === 'docx' ? 'application/xml' : 'text/plain' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedResume.name}.${format === 'docx' ? 'xml' : 'txt'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Show seal stamp animation in magical mode
      if (intensity === 'magical') {
        setShowSealStamp(true);
        setTimeout(() => setShowSealStamp(false), 2000);
      }

      toast.success(`Resume exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export resume');
    } finally {
      setIsExporting(false);
    }
  };

  const formattingIssues = atsReport?.issues.filter(i => i.category === 'formatting') || [];
  const contentIssues = atsReport?.issues.filter(i => i.category === 'content') || [];
  const keywordIssues = atsReport?.issues.filter(i => i.category === 'keywords') || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up relative">
      {/* Seal Stamp Animation Overlay */}
      {showSealStamp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="animate-seal-stamp">
            <div className="w-32 h-32 rounded-full bg-success/20 border-4 border-success flex items-center justify-center">
              <Check className="w-16 h-16 text-success" />
            </div>
            <p className="text-success text-center mt-2 font-bold text-lg">Exported!</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Resume Workspace</h1>
          <p className="text-muted-foreground">Create ATS-optimized resume versions for each job.</p>
        </div>
        {resumes.length > 0 && (
          <Select value={selectedResumeId || ''} onValueChange={(val) => { setSelectedResumeId(val); setAtsReport(null); }}>
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

      <div className="grid lg:grid-cols-[300px_1fr_320px] gap-6">
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
              placeholder="Paste job description here for keyword analysis..."
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

          {/* Credits Display */}
          <div className="pt-2 border-t border-border">
            <CreditsDisplay type="resume" />
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !canGenerateResume}
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
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">ATS Validation</h3>
            {selectedResume && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={runATSValidation}
                disabled={isValidating}
                className="gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isValidating ? 'animate-spin' : ''}`} />
                {isValidating ? 'Validating...' : 'Validate'}
              </Button>
            )}
          </div>
          
          {atsReport && selectedResume ? (
            <>
              {/* ATS Score Ring */}
              <div className="flex justify-center py-4">
                <div className="relative w-32 h-32">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="40" fill="none"
                      stroke={atsReport.score >= 80 ? 'hsl(var(--success))' : atsReport.score >= 60 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))'}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${atsReport.score * 2.51} 251`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-foreground">{atsReport.score}</span>
                    <span className="text-xs text-muted-foreground">ATS Score</span>
                  </div>
                </div>
              </div>

              {/* Explanation Panel */}
              <Collapsible open={showExplanation} onOpenChange={setShowExplanation}>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm text-primary hover:underline w-full">
                  <Info className="w-4 h-4" />
                  Why this score?
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                  {atsReport.explanation}
                </CollapsibleContent>
              </Collapsible>

              {/* Keyword Coverage */}
              {atsReport.keywordCoverage && (jdText || selectedJob?.jd_text) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Keyword Coverage</span>
                    <span className="font-medium text-foreground">{atsReport.keywordCoverage.coverage}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${atsReport.keywordCoverage.coverage}%` }}
                    />
                  </div>
                  {atsReport.keywordCoverage.found.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {atsReport.keywordCoverage.found.slice(0, 5).map((kw, i) => (
                        <Badge key={i} variant="secondary" className="text-xs bg-success/20 text-success">
                          ✓ {kw}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {atsReport.keywordCoverage.missing.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {atsReport.keywordCoverage.missing.slice(0, 5).map((kw, i) => (
                        <Badge key={i} variant="outline" className="text-xs text-destructive border-destructive/30">
                          ✗ {kw}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Issues by Category */}
              <div className="space-y-3">
                {formattingIssues.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-destructive" />
                      Formatting ({formattingIssues.length})
                    </h4>
                    {formattingIssues.map((issue, i) => (
                      <div key={i} className="p-2 rounded bg-destructive/10 text-xs mb-1">
                        <p className="text-foreground">{issue.message}</p>
                        <p className="text-muted-foreground mt-0.5">💡 {issue.fix}</p>
                      </div>
                    ))}
                  </div>
                )}

                {contentIssues.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-warning" />
                      Content ({contentIssues.length})
                    </h4>
                    {contentIssues.map((issue, i) => (
                      <div key={i} className="p-2 rounded bg-warning/10 text-xs mb-1">
                        <p className="text-foreground">{issue.message}</p>
                        <p className="text-muted-foreground mt-0.5">💡 {issue.fix}</p>
                      </div>
                    ))}
                  </div>
                )}

                {keywordIssues.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-primary" />
                      Keywords ({keywordIssues.length})
                    </h4>
                    {keywordIssues.map((issue, i) => (
                      <div key={i} className="p-2 rounded bg-primary/10 text-xs mb-1">
                        <p className="text-foreground">{issue.message}</p>
                        <p className="text-muted-foreground mt-0.5">💡 {issue.fix}</p>
                      </div>
                    ))}
                  </div>
                )}

                {atsReport.issues.length === 0 && (
                  <div className="flex items-center gap-2 text-sm text-success p-2 bg-success/10 rounded">
                    <Check className="w-4 h-4" />
                    <span>No issues found! Your resume is ATS-ready.</span>
                  </div>
                )}
              </div>

              {/* Export Buttons */}
              <div className="space-y-2 pt-2 border-t border-border">
                <h4 className="text-sm font-medium text-foreground">Export</h4>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExport('docx')}
                    disabled={isExporting || !atsReport.formattingPassed}
                    className="flex-1 gap-1"
                    title={!atsReport.formattingPassed ? 'Fix formatting issues first' : 'Export as DOCX'}
                  >
                    <FileDown className="w-4 h-4" />
                    DOCX
                    {!atsReport.formattingPassed && <span className="text-destructive">⚠</span>}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExport('txt')}
                    disabled={isExporting}
                    className="flex-1 gap-1"
                  >
                    <Download className="w-4 h-4" />
                    TXT
                  </Button>
                </div>
                {!atsReport.formattingPassed && (
                  <p className="text-xs text-destructive">
                    ⚠ DOCX export blocked: Fix formatting issues first
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedResume 
                  ? 'Click "Validate" to analyze ATS compatibility'
                  : 'Generate or select a resume to validate'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeWorkspace;
