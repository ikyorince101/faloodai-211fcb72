import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';

type ResumeVersion = Database['public']['Tables']['resume_versions']['Row'];
type ResumeInsert = Database['public']['Tables']['resume_versions']['Insert'];

export const useResumeVersions = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['resume-versions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('resume_versions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ResumeVersion[];
    },
    enabled: !!user,
  });
};

export const useRecentResumes = (limit = 3) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recent-resumes', user?.id, limit],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('resume_versions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as ResumeVersion[];
    },
    enabled: !!user,
  });
};

export const useResumesByJob = (jobId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['resumes-by-job', jobId],
    queryFn: async () => {
      if (!user || !jobId) return [];
      const { data, error } = await supabase
        .from('resume_versions')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ResumeVersion[];
    },
    enabled: !!user && !!jobId,
  });
};

export const useCreateResume = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (resume: Omit<ResumeInsert, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('resume_versions')
        .insert({ ...resume, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resume-versions'] });
      queryClient.invalidateQueries({ queryKey: ['recent-resumes'] });
      queryClient.invalidateQueries({ queryKey: ['resumes-by-job'] });
    },
  });
};

export const useUpdateResume = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ResumeVersion> & { id: string }) => {
      const { data, error } = await supabase
        .from('resume_versions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resume-versions'] });
      queryClient.invalidateQueries({ queryKey: ['recent-resumes'] });
      queryClient.invalidateQueries({ queryKey: ['resumes-by-job'] });
    },
  });
};

export type { ResumeVersion };
