import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import { IProject, IProjectMember } from '@taskflow/shared';

export function useProjects(workspaceId: string) {
  return useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: async () => {
      const res = await api.get(`/workspaces/${workspaceId}/projects`);
      return res.data.data as { projects: IProject[] };
    },
    enabled: !!workspaceId,
  });
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: ['projects', 'detail', projectId],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}`);
      return res.data.data as { project: IProject };
    },
    enabled: !!projectId,
  });
}

export function useProjectMembers(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'members'],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}/members`);
      return res.data.data as { members: IProjectMember[] };
    },
    enabled: !!projectId,
  });
}

export function useCreateProject(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; key: string; description?: string }) => {
      const res = await api.post(`/workspaces/${workspaceId}/projects`, data);
      return res.data.data as { project: IProject };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
      toast({ title: 'Project created successfully' });
    },
    onError: (err: any) => {
      toast({
        title: 'Failed to create project',
        description: err.response?.data?.error?.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name?: string; description?: string; status?: string }) => {
      const res = await api.patch(`/projects/${projectId}`, data);
      return res.data.data as { project: IProject };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', 'detail', projectId] });
      toast({ title: 'Project updated' });
    },
  });
}

export function useAddProjectMember(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { email: string; role: 'admin' | 'member' }) => {
      const res = await api.post(`/projects/${projectId}/members`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'members'] });
      toast({ title: 'Member added' });
    },
    onError: (err: any) => {
      toast({
        title: 'Failed to add member',
        description: err.response?.data?.error?.message,
        variant: 'destructive',
      });
    },
  });
}

export function useRemoveProjectMember(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: string) => {
      await api.delete(`/projects/${projectId}/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'members'] });
      toast({ title: 'Member removed' });
    },
  });
}
