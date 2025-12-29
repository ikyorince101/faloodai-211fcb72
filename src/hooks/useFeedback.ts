import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface FeedbackSubmission {
  id: string;
  user_id: string | null;
  feedback_type: 'feature' | 'bug';
  title: string;
  description: string;
  email: string | null;
  status: 'pending' | 'in_review' | 'resolved' | 'closed';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useFeedback() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: submissions, isLoading, error } = useQuery({
    queryKey: ['feedback-submissions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback_submissions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as FeedbackSubmission[];
    },
    enabled: !!user,
  });

  const createSubmission = useMutation({
    mutationFn: async (submission: {
      feedback_type: 'feature' | 'bug';
      title: string;
      description: string;
      email?: string;
    }) => {
      if (!user) throw new Error('Must be logged in');
      
      const { data, error } = await supabase
        .from('feedback_submissions')
        .insert({
          user_id: user.id,
          feedback_type: submission.feedback_type,
          title: submission.title,
          description: submission.description,
          email: submission.email || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-submissions'] });
      toast.success('Feedback submitted successfully!');
    },
    onError: (error) => {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    },
  });

  const updateSubmission = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FeedbackSubmission> & { id: string }) => {
      const { data, error } = await supabase
        .from('feedback_submissions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-submissions'] });
      toast.success('Feedback updated');
    },
    onError: (error) => {
      console.error('Error updating feedback:', error);
      toast.error('Failed to update feedback');
    },
  });

  const deleteSubmission = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('feedback_submissions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-submissions'] });
      toast.success('Feedback deleted');
    },
    onError: (error) => {
      console.error('Error deleting feedback:', error);
      toast.error('Failed to delete feedback');
    },
  });

  return {
    submissions,
    isLoading,
    error,
    createSubmission,
    updateSubmission,
    deleteSubmission,
  };
}
