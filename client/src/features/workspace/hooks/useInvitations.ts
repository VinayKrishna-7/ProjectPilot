import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { IWorkspaceInvitation, ApiResponse, WorkspaceRole } from '@taskflow/shared';

export function useWorkspaceInvitations(workspaceId: string) {
  return useQuery({
    queryKey: ['invitations', workspaceId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ invitations: IWorkspaceInvitation[] }>>(
        `/workspaces/${workspaceId}/invitations`
      );
      return (res.data as any).data?.invitations || [];
    },
    enabled: !!workspaceId,
  });
}

export function useCreateInvitation(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { email: string; role: WorkspaceRole }) => {
      const res = await api.post(`/workspaces/${workspaceId}/invitations`, input);
      return (res.data as any).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations', workspaceId] });
    },
  });
}

export function useRevokeInvitation(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invitationId: string) => {
      await api.delete(`/workspaces/${workspaceId}/invitations/${invitationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations', workspaceId] });
    },
  });
}
