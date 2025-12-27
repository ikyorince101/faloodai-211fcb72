import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';

type PracticeSession = Database['public']['Tables']['practice_sessions']['Row'];
type PracticeEvent = Database['public']['Tables']['practice_events']['Row'];
type SessionInsert = Database['public']['Tables']['practice_sessions']['Insert'];

export const usePracticeSessions = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['practice-sessions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('practice_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PracticeSession[];
    },
    enabled: !!user,
  });
};

export const useWeeklyPracticeStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['weekly-practice', user?.id],
    queryFn: async () => {
      if (!user) return { sessionsThisWeek: 0, streak: 0 };
      
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { data, error } = await supabase
        .from('practice_sessions')
        .select('created_at, status')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('created_at', weekAgo.toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Calculate streak (consecutive days with practice)
      const sessionDates = new Set((data || []).map(s => 
        new Date(s.created_at).toDateString()
      ));
      
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        if (sessionDates.has(checkDate.toDateString())) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }

      return {
        sessionsThisWeek: data?.length || 0,
        streak,
      };
    },
    enabled: !!user,
  });
};

export const useRecentRubricScores = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recent-rubric', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data: sessions, error: sessionsError } = await supabase
        .from('practice_sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (sessionsError) throw sessionsError;
      if (!sessions || sessions.length === 0) return [];
      
      const { data: events, error: eventsError } = await supabase
        .from('practice_events')
        .select('rubric, session_id')
        .in('session_id', sessions.map(s => s.id))
        .eq('event_type', 'ai_feedback');
      
      if (eventsError) throw eventsError;
      
      // Aggregate rubric scores by dimension
      const dimensions: Record<string, number[]> = {};
      (events || []).forEach(event => {
        const rubric = event.rubric as Record<string, number> | null;
        if (rubric) {
          Object.entries(rubric).forEach(([dim, score]) => {
            if (!dimensions[dim]) dimensions[dim] = [];
            dimensions[dim].push(score);
          });
        }
      });

      return Object.entries(dimensions).map(([dimension, scores]) => ({
        dimension,
        avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        trend: scores.length >= 2 ? scores[0] - scores[scores.length - 1] : 0,
      }));
    },
    enabled: !!user,
  });
};

export const useCreateSession = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (session: Omit<SessionInsert, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('practice_sessions')
        .insert({ ...session, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-practice'] });
    },
  });
};

export type { PracticeSession, PracticeEvent };
