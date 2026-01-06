import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ResumeEditorDoc } from '@/types/editor';
import { Json } from '@/integrations/supabase/types';

const defaultDocFromResume = (content: Record<string, unknown> | null): Json => {
  const summary = typeof content?.summary === 'string' ? content.summary : 'Add your professional summary here.';
  const experience = Array.isArray(content?.experience) ? content?.experience as Array<Record<string, string>> : [];
  const lines = [summary];
  experience.forEach((exp) => {
    const title = exp.title || 'Role';
    const company = exp.company ? ` at ${exp.company}` : '';
    const period = exp.period ? ` (${exp.period})` : '';
    const desc = exp.description ? ` - ${exp.description}` : '';
    lines.push(`${title}${company}${period}${desc}`);
  });
  return {
    type: 'doc',
    content: lines.map((line) => ({ type: 'paragraph', text: line })),
  } as Json;
};

export const useResumeEditorDoc = (resumeId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['resume-editor-doc', user?.id, resumeId],
    enabled: !!user && !!resumeId,
    queryFn: async () => {
      if (!user || !resumeId) return null;

      const { data: existing, error: docError } = await supabase
        .from('resume_editor_docs')
        .select('*')
        .eq('resume_id', resumeId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (docError && docError.code !== 'PGRST116') {
        throw docError;
      }

      if (existing) return existing as ResumeEditorDoc;

      const { data: resume, error: resumeError } = await supabase
        .from('resume_versions')
        .select('content')
        .eq('id', resumeId)
        .eq('user_id', user.id)
        .single();

      if (resumeError) throw resumeError;

      const doc_json = defaultDocFromResume(resume?.content as Record<string, unknown> | null);

      const { data: inserted, error: insertError } = await supabase
        .from('resume_editor_docs')
        .insert({ resume_id: resumeId, user_id: user.id, doc_json })
        .select()
        .single();

      if (insertError) throw insertError;
      return inserted as ResumeEditorDoc;
    },
  });
};

export const useSaveEditorDoc = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ resumeId, docJson, currentVersion }: { resumeId: string; docJson: Json; currentVersion?: number; }) => {
      if (!user) throw new Error('Not authenticated');

      // If doc exists, enforce optimistic locking on version
      if (typeof currentVersion === 'number') {
        const nextVersion = currentVersion + 1;
        const { data, error } = await supabase
          .from('resume_editor_docs')
          .update({
            doc_json: docJson,
            version: nextVersion,
            updated_at: new Date().toISOString(),
          })
          .eq('resume_id', resumeId)
          .eq('user_id', user.id)
          .eq('version', currentVersion)
          .select()
          .single();

        if (error && error.code === 'PGRST116') {
          // No rows updated implies version conflict
          throw new Error('version_conflict');
        }
        if (error) throw error;
        return data as ResumeEditorDoc;
      }

      // First-time insert
      const { data, error } = await supabase
        .from('resume_editor_docs')
        .insert({
          resume_id: resumeId,
          user_id: user.id,
          doc_json: docJson,
          version: 1,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data as ResumeEditorDoc;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['resume-editor-doc', data.user_id, data.resume_id] });
    },
  });
};

export const useListResumesForEditor = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['resume-editor-resumes', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('resume_versions')
        .select('id, name, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};
