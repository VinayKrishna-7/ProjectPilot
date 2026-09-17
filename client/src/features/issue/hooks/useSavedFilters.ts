import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ISavedFilter, ApiResponse } from '@taskflow/shared';

export function useSavedFilters(projectId: string) {
  return useQuery({
    queryKey: ['saved-filters', projectId],
    queryFn: async (): Promise<ISavedFilter[]> => {
      const res = await api.get<ApiResponse<{ filters: ISavedFilter[] }>>(
        `/projects/${projectId}/saved-filters`
      );
      return (res.data as any).data?.filters || [];
    },
    enabled: !!projectId,
  });
}

export function useCreateSavedFilter(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string;
      jql?: string;
      filterConfig?: any;
      isShared?: boolean;
    }) => {
      const res = await api.post(`/projects/${projectId}/saved-filters`, input);
      return (res.data as any).data?.filter;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-filters', projectId] });
    },
  });
}

export function useDeleteSavedFilter(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (filterId: string) => {
      await api.delete(`/saved-filters/${filterId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-filters', projectId] });
    },
  });
}
