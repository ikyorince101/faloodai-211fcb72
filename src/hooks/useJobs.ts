import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';

type Job = Database['public']['Tables']['jobs']['Row'];
type JobInsert = Database['public']['Tables']['jobs']['Insert'];
type JobUpdate = Database['public']['Tables']['jobs']['Update'];
type JobStage = Database['public']['Enums']['job_stage'];

export const useJobs = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['jobs', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Job[];
    },
    enabled: !!user,
  });
};

export const useJob = (jobId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      if (!user || !jobId) return null;
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as Job | null;
    },
    enabled: !!user && !!jobId,
  });
};

export const useJobWithArtifacts = (jobId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['job-artifacts', jobId],
    queryFn: async () => {
      if (!user || !jobId) return null;
      
      const [jobRes, resumesRes, roundsRes, sessionsRes] = await Promise.all([
        supabase.from('jobs').select('*').eq('id', jobId).eq('user_id', user.id).maybeSingle(),
        supabase.from('resume_versions').select('*').eq('job_id', jobId),
        supabase.from('interview_rounds').select('*').eq('job_id', jobId).order('round_date', { ascending: true }),
        supabase.from('practice_sessions').select('*').eq('job_id', jobId).order('created_at', { ascending: false }),
      ]);

      if (jobRes.error) throw jobRes.error;

      return {
        job: jobRes.data as Job | null,
        resumes: (resumesRes.data || []) as Database['public']['Tables']['resume_versions']['Row'][],
        rounds: (roundsRes.data || []) as Database['public']['Tables']['interview_rounds']['Row'][],
        sessions: (sessionsRes.data || []) as Database['public']['Tables']['practice_sessions']['Row'][],
      };
    },
    enabled: !!user && !!jobId,
  });
};

export const useJobsWithCounts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['jobs-with-counts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (!jobs || jobs.length === 0) return [];

      const jobIds = jobs.map(j => j.id);
      
      const [resumesRes, roundsRes, sessionsRes] = await Promise.all([
        supabase.from('resume_versions').select('id, job_id').in('job_id', jobIds),
        supabase.from('interview_rounds').select('id, job_id').in('job_id', jobIds),
        supabase.from('practice_sessions').select('id, job_id').in('job_id', jobIds),
      ]);

      const resumeCounts: Record<string, number> = {};
      const roundCounts: Record<string, number> = {};
      const sessionCounts: Record<string, number> = {};

      (resumesRes.data || []).forEach(r => {
        if (r.job_id) resumeCounts[r.job_id] = (resumeCounts[r.job_id] || 0) + 1;
      });
      (roundsRes.data || []).forEach(r => {
        roundCounts[r.job_id] = (roundCounts[r.job_id] || 0) + 1;
      });
      (sessionsRes.data || []).forEach(s => {
        if (s.job_id) sessionCounts[s.job_id] = (sessionCounts[s.job_id] || 0) + 1;
      });

      return jobs.map(job => ({
        ...job,
        resumeCount: resumeCounts[job.id] || 0,
        roundCount: roundCounts[job.id] || 0,
        sessionCount: sessionCounts[job.id] || 0,
      }));
    },
    enabled: !!user,
  });
};

export const usePipelineCounts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pipeline-counts', user?.id],
    queryFn: async () => {
      if (!user) return {};
      const { data, error } = await supabase
        .from('jobs')
        .select('stage')
        .eq('user_id', user.id);
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      (data || []).forEach(job => {
        counts[job.stage] = (counts[job.stage] || 0) + 1;
      });
      return counts;
    },
    enabled: !!user,
  });
};

export const useUpcomingFollowUps = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['upcoming-followups', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .not('follow_up_at', 'is', null)
        .gte('follow_up_at', new Date().toISOString())
        .order('follow_up_at', { ascending: true })
        .limit(5);
      if (error) throw error;
      return data as Job[];
    },
    enabled: !!user,
  });
};

export const useCreateJob = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (job: Omit<JobInsert, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('jobs')
        .insert({ ...job, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs-with-counts'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-counts'] });
    },
  });
};

export const useUpdateJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: JobUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs-with-counts'] });
      queryClient.invalidateQueries({ queryKey: ['job', data.id] });
      queryClient.invalidateQueries({ queryKey: ['job-artifacts', data.id] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-counts'] });
    },
  });
};

export const useDeleteJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('jobs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs-with-counts'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-counts'] });
    },
  });
};

export type { Job, JobInsert, JobUpdate, JobStage };
