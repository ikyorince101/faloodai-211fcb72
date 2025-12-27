import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export const useProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<ProfileUpdate>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const calculateProfileCompleteness = (profile: Profile | null): { percentage: number; suggestions: string[] } => {
  if (!profile) return { percentage: 0, suggestions: ['Create your profile'] };
  
  const checks = [
    { field: 'full_name', label: 'Add your full name', weight: 10 },
    { field: 'target_roles', label: 'Add target roles', weight: 15 },
    { field: 'seniority', label: 'Set your seniority level', weight: 10 },
    { field: 'location', label: 'Add your location', weight: 10 },
    { field: 'skills', label: 'Add your skills', weight: 20 },
    { field: 'work_history', label: 'Add work history', weight: 20 },
    { field: 'projects', label: 'Add projects', weight: 10 },
    { field: 'links', label: 'Add profile links', weight: 5 },
  ];

  let score = 0;
  const suggestions: string[] = [];

  checks.forEach(check => {
    const value = profile[check.field as keyof Profile];
    const hasValue = Array.isArray(value) 
      ? value.length > 0 
      : typeof value === 'object' 
        ? Object.keys(value || {}).length > 0 
        : !!value;
    
    if (hasValue) {
      score += check.weight;
    } else {
      suggestions.push(check.label);
    }
  });

  return { percentage: Math.min(100, score), suggestions: suggestions.slice(0, 3) };
};

export type { Profile, ProfileUpdate };
