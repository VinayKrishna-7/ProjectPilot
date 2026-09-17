import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ILabel } from '@taskflow/shared';
import { toast } from '@/components/ui/use-toast';

export function useLabels(projectId: string) {
  return useQuery({
    queryKey: ['labels', projectId],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}/labels`);
      return res.data.data as { labels: ILabel[] };
    },
    enabled: !!projectId,
  });
}

export function useCreateLabel(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      const res = await api.post(`/projects/${projectId}/labels`, data);
      return res.data.data as { label: ILabel };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels', projectId] });
      toast({ title: 'Label created' });
    },
  });
}

export function useDeleteLabel(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (labelId: string) => {
      await api.delete(`/projects/${projectId}/labels/${labelId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels', projectId] });
      toast({ title: 'Label deleted' });
    },
  });
}
