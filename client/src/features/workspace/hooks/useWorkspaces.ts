import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import { IWorkspace, IWorkspaceMember } from '@taskflow/shared';

export function useWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const res = await api.get('/workspaces');
      return res.data.data as { workspaces: IWorkspace[] };
    },
  });
}

export function useWorkspace(id: string) {
  return useQuery({
    queryKey: ['workspaces', id],
    queryFn: async () => {
      const res = await api.get(`/workspaces/${id}`);
      return res.data.data as { workspace: IWorkspace };
    },
    enabled: !!id,
  });
}

export function useWorkspaceMembers(workspaceId: string) {
  return useQuery({
    queryKey: ['workspaces', workspaceId, 'members'],
    queryFn: async () => {
      const res = await api.get(`/workspaces/${workspaceId}/members`);
      return res.data.data as { members: IWorkspaceMember[] };
    },
    enabled: !!workspaceId,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; slug: string; description?: string }) => {
      const res = await api.post('/workspaces', data);
      return res.data.data as { workspace: IWorkspace };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast({ title: 'Workspace created successfully' });
    },
    onError: (err: any) => {
      toast({
        title: 'Failed to create workspace',
        description: err.response?.data?.error?.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateWorkspace(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name?: string; description?: string }) => {
      const res = await api.patch(`/workspaces/${workspaceId}`, data);
      return res.data.data as { workspace: IWorkspace };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast({ title: 'Workspace updated' });
    },
  });
}

export function useInviteWorkspaceMember(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { email: string; role: 'admin' | 'member' }) => {
      const res = await api.post(`/workspaces/${workspaceId}/members`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId, 'members'] });
      toast({ title: 'Member invited successfully' });
    },
    onError: (err: any) => {
      toast({
        title: 'Failed to invite member',
        description: err.response?.data?.error?.message,
        variant: 'destructive',
      });
    },
  });
}

export function useRemoveWorkspaceMember(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: string) => {
      await api.delete(`/workspaces/${workspaceId}/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId, 'members'] });
      toast({ title: 'Member removed' });
    },
  });
}
