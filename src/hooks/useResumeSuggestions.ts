import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ResumeSuggestion, EditorSuggestionPayload } from '@/types/editor';
import { validateSuggestions } from '@/lib/editorValidation';

export const useResumeSuggestions = (resumeId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['resume-suggestions', user?.id, resumeId],
    enabled: !!user && !!resumeId,
    queryFn: async () => {
      if (!user || !resumeId) return [];
      const { data, error } = await supabase
        .from('resume_suggestions')
        .select('*')
        .eq('resume_id', resumeId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ResumeSuggestion[];
    },
  });
};

export const useUpsertSuggestions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ resumeId, suggestions }: { resumeId: string; suggestions: EditorSuggestionPayload[]; }) => {
      if (!user) throw new Error('Not authenticated');
      if (!suggestions.length) return [] as ResumeSuggestion[];

      const rows = suggestions.map((s) => ({
        suggestion_id: s.suggestionId,
        type: s.type,
        target_quote: s.targetQuote,
        replacement_text: s.replacementText ?? null,
        reason: s.reason,
        section_hint: s.sectionHint ?? null,
        confidence: s.confidence,
        resume_id: resumeId,
        user_id: user.id,
        status: 'pending',
      }));

      const { data, error } = await supabase
        .from('resume_suggestions')
        .upsert(rows, { onConflict: 'suggestion_id' })
        .select();

      if (error) throw error;
      return data as ResumeSuggestion[];
    },
    onSuccess: (data) => {
      if (!data.length) return;
      const resumeId = data[0].resume_id;
      queryClient.invalidateQueries({ queryKey: ['resume-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['resume-suggestions', data[0].user_id, resumeId] });
    },
  });
};

export const useUpdateSuggestionStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'accepted' | 'rejected' | 'pending'; }) => {
      const { data, error } = await supabase
        .from('resume_suggestions')
        .update({ status, decided_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as ResumeSuggestion;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['resume-suggestions', data.user_id, data.resume_id] });
    },
  });
};

export const useGenerateResumeSuggestions = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ resumeId, docText, jobDescription }: { resumeId: string; docText: string; jobDescription?: string; }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase.functions.invoke('generate-resume-suggestions', {
        body: { resumeId, docText, jobDescription },
      });
      if (error) throw error;
      return validateSuggestions(data) as EditorSuggestionPayload[];
    },
  });
};
