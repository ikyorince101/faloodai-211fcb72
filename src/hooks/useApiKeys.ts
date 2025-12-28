import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface ApiKeyInfo {
  provider: string;
  last_verified_at: string | null;
  created_at: string;
}

export const useApiKeys = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const { data: keys, isLoading, error, refetch } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      if (!session?.access_token) return [];
      
      const { data, error } = await supabase.functions.invoke('manage-api-keys', {
        body: { action: 'list' },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      return (data.keys || []) as ApiKeyInfo[];
    },
    enabled: !!session?.access_token,
  });

  const saveKeyMutation = useMutation({
    mutationFn: async ({ provider, apiKey }: { provider: string; apiKey: string }) => {
      if (!session?.access_token) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('manage-api-keys', {
        body: { action: 'save', provider, apiKey },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });

  const validateKeyMutation = useMutation({
    mutationFn: async (provider: string) => {
      if (!session?.access_token) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('manage-api-keys', {
        body: { action: 'validate', provider },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (provider: string) => {
      if (!session?.access_token) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('manage-api-keys', {
        body: { action: 'delete', provider },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });

  return {
    keys: keys || [],
    isLoading,
    error,
    refetch,
    saveKey: saveKeyMutation.mutateAsync,
    isSaving: saveKeyMutation.isPending,
    validateKey: validateKeyMutation.mutateAsync,
    isValidating: validateKeyMutation.isPending,
    deleteKey: deleteKeyMutation.mutateAsync,
    isDeleting: deleteKeyMutation.isPending,
    hasOpenAIKey: keys?.some(k => k.provider === 'openai') ?? false,
    hasDeepgramKey: keys?.some(k => k.provider === 'deepgram') ?? false,
  };
};
