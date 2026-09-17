import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import { IIssue } from '@taskflow/shared';
import { PaginatedIssues } from '@/types/api.types';
import { IssueFilters } from '@/stores/filterStore';

interface CreateIssueData {
  title: string;
  description?: string;
  type?: string;
  status?: string;
  priority?: string;
  assignee?: string;
  labels?: string[];
  sprint?: string;
  boardColumn?: string;
  storyPoints?: number;
  dueDate?: string;
}

export function useIssues(
  projectId: string,
  filters?: IssueFilters & { page?: number; limit?: number }
) {
  return useQuery({
    queryKey: ['issues', projectId, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, val]) => {
          if (val !== undefined && val !== '') params.append(key, String(val));
        });
      }
      const res = await api.get(`/projects/${projectId}/issues?${params.toString()}`);
      return res.data.data as PaginatedIssues;
    },
    enabled: !!projectId,
  });
}

export function useIssue(issueId: string) {
  return useQuery({
    queryKey: ['issues', 'detail', issueId],
    queryFn: async () => {
      const res = await api.get(`/issues/${issueId}`);
      return res.data.data as { issue: IIssue };
    },
    enabled: !!issueId,
  });
}

export function useIssueActivities(issueId: string) {
  return useQuery({
    queryKey: ['issues', issueId, 'activities'],
    queryFn: async () => {
      const res = await api.get(`/issues/${issueId}/activities`);
      return res.data.data as { activities: import('@taskflow/shared').IActivity[] };
    },
    enabled: !!issueId,
  });
}

export function useCreateIssue(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateIssueData) => {
      const res = await api.post(`/projects/${projectId}/issues`, data);
      return res.data.data as { issue: IIssue };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues', projectId] });
      queryClient.invalidateQueries({ queryKey: ['board', projectId] });
      toast({ title: 'Issue created' });
    },
    onError: (err: any) => {
      toast({
        title: 'Failed to create issue',
        description: err.response?.data?.error?.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateIssue(issueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<CreateIssueData>) => {
      const res = await api.patch(`/issues/${issueId}`, data);
      return res.data.data as { issue: IIssue };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['issues', 'detail', issueId], data);
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['board'] });
    },
    onError: () => toast({ title: 'Failed to update issue', variant: 'destructive' }),
  });
}

export function useMoveIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      issueId: string;
      boardColumn: string;
      position: number;
      status?: string;
    }) => {
      const { issueId, ...rest } = data;
      const res = await api.patch(`/issues/${issueId}/move`, rest);
      return res.data.data as { issue: IIssue };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
    onError: () => toast({ title: 'Failed to move issue', variant: 'destructive' }),
  });
}

export function useDeleteIssue(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (issueId: string) => {
      await api.delete(`/issues/${issueId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues', projectId] });
      queryClient.invalidateQueries({ queryKey: ['board', projectId] });
      toast({ title: 'Issue deleted' });
    },
  });
}
