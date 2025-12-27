import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';

type InterviewRound = Database['public']['Tables']['interview_rounds']['Row'];
type RoundInsert = Database['public']['Tables']['interview_rounds']['Insert'];
type RoundUpdate = Database['public']['Tables']['interview_rounds']['Update'];

export const useInterviewRounds = (jobId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['interview-rounds', jobId],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from('interview_rounds')
        .select('*')
        .eq('user_id', user.id)
        .order('round_date', { ascending: true });
      
      if (jobId) {
        query = query.eq('job_id', jobId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as InterviewRound[];
    },
    enabled: !!user,
  });
};

export const useCreateRound = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (round: Omit<RoundInsert, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('interview_rounds')
        .insert({ ...round, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-rounds'] });
      queryClient.invalidateQueries({ queryKey: ['job-artifacts'] });
    },
  });
};

export const useUpdateRound = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: RoundUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('interview_rounds')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-rounds'] });
      queryClient.invalidateQueries({ queryKey: ['job-artifacts'] });
    },
  });
};

export const useDeleteRound = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('interview_rounds').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-rounds'] });
      queryClient.invalidateQueries({ queryKey: ['job-artifacts'] });
    },
  });
};

export type { InterviewRound };
