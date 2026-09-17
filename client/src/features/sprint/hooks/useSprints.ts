import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import { ISprint, IIssue } from '@taskflow/shared';

export function useSprints(projectId: string) {
  return useQuery({
    queryKey: ['sprints', projectId],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}/sprints`);
      return res.data.data as { sprints: ISprint[] };
    },
    enabled: !!projectId,
  });
}

export function useBacklog(projectId: string) {
  return useQuery({
    queryKey: ['backlog', projectId],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}/sprints/backlog`);
      return res.data.data as { issues: IIssue[] };
    },
    enabled: !!projectId,
  });
}

export function useCreateSprint(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      goal?: string;
      startDate?: string;
      endDate?: string;
    }) => {
      const res = await api.post(`/projects/${projectId}/sprints`, data);
      return res.data.data as { sprint: ISprint };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
      toast({ title: 'Sprint created' });
    },
  });
}

export function useStartSprint(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sprintId: string) => {
      const res = await api.post(`/projects/${projectId}/sprints/${sprintId}/start`);
      return res.data.data as { sprint: ISprint };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
      toast({ title: 'Sprint started!' });
    },
    onError: (err: any) => {
      toast({
        title: 'Failed to start sprint',
        description: err.response?.data?.error?.message,
        variant: 'destructive',
      });
    },
  });
}

export function useCompleteSprint(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      sprintId: string;
      incompleteIssueAction: 'backlog' | 'next_sprint';
      targetSprintId?: string;
    }) => {
      const { sprintId, ...rest } = data;
      const res = await api.post(`/projects/${projectId}/sprints/${sprintId}/complete`, rest);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
      queryClient.invalidateQueries({ queryKey: ['backlog', projectId] });
      queryClient.invalidateQueries({ queryKey: ['issues', projectId] });
      toast({ title: 'Sprint completed!' });
    },
  });
}

export function useDeleteSprint(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sprintId: string) => {
      await api.delete(`/projects/${projectId}/sprints/${sprintId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
      toast({ title: 'Sprint deleted' });
    },
  });
}
