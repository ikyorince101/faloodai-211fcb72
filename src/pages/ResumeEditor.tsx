import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useListResumesForEditor, useResumeEditorDoc, useSaveEditorDoc } from '@/hooks/useResumeEditor';
import InteractiveEditor from '@/components/resume/InteractiveEditor';
import SuggestionsPanel from '@/components/resume/SuggestionsPanel';
import { useResumeSuggestions, useGenerateResumeSuggestions, useUpsertSuggestions, useUpdateSuggestionStatus } from '@/hooks/useResumeSuggestions';
import { ResumeSuggestion } from '@/types/editor';
import { applySuggestionToText, extractPlainTextFromDoc } from '@/lib/editorUtils';
import { toast } from 'sonner';
import { runEditorRuntimeChecks } from '@/utils/editorRuntimeChecks';
import { supabase } from '@/integrations/supabase/client';
import { resumeSampleText } from '@/fixtures/resumeSample';
import { Json } from '@/integrations/supabase/types';
import { useJobs } from '@/hooks/useJobs';
import { useCreateResume } from '@/hooks/useResumes';

const textToDocJson = (text: string) => ({
  type: 'doc',
  content: text.split('\n').map((line) => ({ type: 'paragraph', text: line })),
});

const mapParsedToContent = (parsed: Record<string, any>): Json => {
  const experience = Array.isArray(parsed?.workHistory)
    ? parsed.workHistory.map((w: any) => ({
        title: w.title || w.role || '',
        company: w.company || '',
        period: [w.startDate, w.endDate].filter(Boolean).join(' - '),
        description: w.description || (Array.isArray(w.highlights) ? w.highlights.join('; ') : ''),
      }))
    : [];

  const skills = Array.isArray(parsed?.skills)
    ? parsed.skills.map((s: any) => s.name || s)
    : [];

  const projects = Array.isArray(parsed?.projects)
    ? parsed.projects.map((p: any) => ({
        name: p.name || '',
        description: p.description || '',
      }))
    : [];

  return {
    name: parsed.fullName || 'Your Name',
    email: parsed.email || '',
    location: parsed.location || '',
    summary: parsed.summary || 'Add a professional summary.',
    experience,
    skills,
    projects,
    generatedAt: new Date().toISOString(),
  } as Json;
};

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface ATSIssue {
  category: 'formatting' | 'content' | 'keywords';
  type: 'error' | 'warning';
  message: string;
  fix: string;
}

interface ATSReport {
  score: number;
  issues: ATSIssue[];
  keywordCoverage?: {
    found: string[];
    missing: string[];
    coverage: number;
  };
  formattingPassed?: boolean;
  explanation?: string;
}

const ResumeEditor: React.FC = () => {
  const { data: resumes = [] } = useListResumesForEditor();
  const { data: jobs = [] } = useJobs();
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadResumeName, setUploadResumeName] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState<number | undefined>(undefined);
  const [atsReport, setAtsReport] = useState<ATSReport | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didInitRef = useRef(false);
  const createResume = useCreateResume();

  useEffect(() => {
    if (!selectedResumeId && resumes.length > 0) {
      setSelectedResumeId(resumes[0].id);
    }
  }, [resumes, selectedResumeId]);

  useEffect(() => {
    if (!selectedJobId && jobs.length > 0) {
      setSelectedJobId(jobs[0].id);
      setJobDescription(jobs[0].jd_text || '');
    }
  }, [jobs, selectedJobId]);

  const { data: editorDoc } = useResumeEditorDoc(selectedResumeId);
  const initialText = useMemo(() => extractPlainTextFromDoc(editorDoc?.doc_json as Record<string, unknown> | null), [editorDoc]);
  const [docText, setDocText] = useState(initialText);

  useEffect(() => {
    // dev-only quick checks
    if (import.meta.env.DEV) {
      runEditorRuntimeChecks();
    }
  }, []);

  useEffect(() => {
    setDocText(initialText || resumeSampleText);
    setCurrentVersion(editorDoc?.version);
  }, [initialText, editorDoc]);

  const { data: suggestions = [] } = useResumeSuggestions(selectedResumeId);
  const saveDoc = useSaveEditorDoc();
  const generate = useGenerateResumeSuggestions();
  const upsertSuggestions = useUpsertSuggestions();
  const updateStatus = useUpdateSuggestionStatus();

  const handleSave = async () => {
    if (!selectedResumeId) return;
    const docJson = textToDocJson(docText || '') as Json;
    setSaveState('saving');
    setSaveError(null);
    try {
      const saved = await saveDoc.mutateAsync({ resumeId: selectedResumeId, docJson, currentVersion });
      setCurrentVersion(saved.version);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    } catch (err: any) {
      if (err?.message === 'version_conflict') {
        toast.error('Version conflict detected. Please reload to get the latest changes.');
      } else {
        toast.error('Failed to save.');
      }
      setSaveError('Save failed');
      setSaveState('error');
    }
  };

  // Debounced autosave
  useEffect(() => {
    if (!didInitRef.current) {
      didInitRef.current = true;
      return;
    }
    if (!selectedResumeId) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      handleSave();
    }, 2200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [docText, selectedResumeId]);

  const handleGenerate = async () => {
    if (!selectedResumeId) return;
    const jd = jobDescription || jobs.find(j => j.id === selectedJobId)?.jd_text || '';
    const result = await generate.mutateAsync({ resumeId: selectedResumeId, docText: docText || '', jobDescription: jd });
    await upsertSuggestions.mutateAsync({ resumeId: selectedResumeId, suggestions: result });
    toast.success('Suggestions ready');
  };

  const handleAccept = async (suggestion: ResumeSuggestion) => {
    const updatedText = applySuggestionToText(docText, suggestion);
    setDocText(updatedText);
    if (selectedResumeId) {
      await saveDoc.mutateAsync({ resumeId: selectedResumeId, docJson: textToDocJson(updatedText) });
    }
    await updateStatus.mutateAsync({ id: suggestion.id, status: 'accepted' });
    toast.success('Suggestion applied');
  };

  const handleReject = async (suggestion: ResumeSuggestion) => {
    await updateStatus.mutateAsync({ id: suggestion.id, status: 'rejected' });
    toast.success('Suggestion rejected');
  };

  const handleValidateATS = async () => {
    setIsValidating(true);
    setAtsReport(null);
    try {
      const jd = jobDescription || jobs.find(j => j.id === selectedJobId)?.jd_text || '';
      const { data, error } = await supabase.functions.invoke('ats-validate', {
        body: { resumeContent: { text: docText }, jobDescription: jd },
      });
      if (error) throw error;
      setAtsReport(data as ATSReport);
      toast.success('ATS validation completed');
    } catch (err) {
      toast.error('ATS validation failed');
    } finally {
      setIsValidating(false);
    }
  };

  const handleUploadResume = async () => {
    if (!uploadFile) {
      toast.error('Choose a file to upload');
      return;
    }
    const resumeName = uploadResumeName.trim() || uploadFile.name;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);

      const { data: parsedDoc, error: docError } = await supabase.functions.invoke('parse-document', {
        body: formData,
      });
      if (docError || !parsedDoc?.success) {
        throw new Error(parsedDoc?.error || docError?.message || 'Failed to parse document');
      }

      const resumeText: string = parsedDoc.text;

      const { data: parsedResume, error: parseErr } = await supabase.functions.invoke('parse-resume', {
        body: { resumeText },
      });
      if (parseErr) throw parseErr;

      const content = mapParsedToContent(parsedResume as Record<string, any>);

      const created = await createResume.mutateAsync({
        name: resumeName,
        job_id: selectedJobId || null,
        content,
        ats_score: null,
        ats_report: null,
      });

      setSelectedResumeId(created.id);
      setDocText(resumeText);
      setUploadFile(null);
      setUploadResumeName('');
      toast.success('Resume uploaded and parsed');
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={selectedResumeId || ''} onValueChange={setSelectedResumeId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select resume" />
            </SelectTrigger>
            <SelectContent>
              {resumes.map((resume) => (
                <SelectItem key={resume.id} value={resume.id}>{resume.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedJobId || ''} onValueChange={(val) => {
            setSelectedJobId(val);
            const found = jobs.find((j) => j.id === val);
            setJobDescription(found?.jd_text || '');
          }}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select job (JD)" />
            </SelectTrigger>
            <SelectContent>
              {jobs.map((job) => (
                <SelectItem key={job.id} value={job.id}>{job.title || 'Job'}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">Pick resume + job before editing</p>
        </div>
        <div className="flex gap-2">
          {saveState === 'error' && (
            <Button variant="destructive" onClick={handleSave}>
              Retry Save
            </Button>
          )}
          <Button variant="outline" onClick={handleSave} disabled={saveState === 'saving'}> {saveState === 'saving' ? 'Saving...' : 'Save'} </Button>
          <Button onClick={handleGenerate} disabled={generate.isPending || !docText || !jobDescription}>
            {generate.isPending ? 'Generating...' : 'Generate Suggestions'}
          </Button>
          <Button variant="secondary" onClick={handleValidateATS} disabled={isValidating || !jobDescription}>
            {isValidating ? 'Validating...' : 'Validate current version'}
          </Button>
        </div>
      </div>

      <Card className="p-4 space-y-3">
        <p className="text-sm font-semibold text-foreground">Upload a resume (docx/txt/md)</p>
        <p className="text-xs text-muted-foreground">If you have no resume yet or want a new one, upload and we’ll parse it.</p>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Input type="file" accept=".docx,.txt,.md" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
            <Input
              placeholder="Resume name"
              value={uploadResumeName}
              onChange={(e) => setUploadResumeName(e.target.value)}
            />
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={handleUploadResume} disabled={uploading || !uploadFile} className="w-full md:w-auto">
              {uploading ? 'Uploading...' : 'Upload & Parse'}
            </Button>
            <p className="text-xs text-muted-foreground">Supported: docx, txt, md.</p>
          </div>
        </div>
      </Card>

      <div className="text-xs text-muted-foreground">
        {saveState === 'saving' && 'Saving...'}
        {saveState === 'saved' && 'Saved'}
        {saveState === 'error' && 'Save failed'}
      </div>

      <Card className="p-4 space-y-3">
        <p className="text-sm font-semibold text-foreground">Job Description</p>
        <p className="text-xs text-muted-foreground">Used for suggestions and ATS validation</p>
        <textarea
          className="w-full rounded-md border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          rows={5}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste or edit the job description here"
        />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card className="lg:col-span-8 p-4">
          <InteractiveEditor
            docText={docText || ''}
            suggestions={suggestions}
            onTextChange={setDocText}
            onAccept={handleAccept}
            onReject={handleReject}
            onGenerateSuggestions={handleGenerate}
            isGenerating={generate.isPending}
          />
        </Card>
        <div className="lg:col-span-4">
          <SuggestionsPanel
            suggestions={suggestions}
            onAccept={handleAccept}
            onReject={handleReject}
          />
          {atsReport && (
            <Card className="mt-4 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground">ATS Result</p>
                <span className="text-sm text-muted-foreground">Score: {atsReport.score}</span>
              </div>
              {atsReport.explanation && (
                <p className="text-sm text-muted-foreground">{atsReport.explanation}</p>
              )}
              {atsReport.issues?.length > 0 && (
                <div className="space-y-1">
                  {atsReport.issues.map((issue, i) => (
                    <div key={i} className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{issue.category}</span>: {issue.message} (fix: {issue.fix})
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeEditor;
