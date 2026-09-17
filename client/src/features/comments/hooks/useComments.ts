import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import { IComment } from '@taskflow/shared';

export function useComments(issueId: string) {
  return useQuery({
    queryKey: ['comments', issueId],
    queryFn: async () => {
      const res = await api.get(`/issues/${issueId}/comments`);
      return res.data.data as { comments: IComment[] };
    },
    enabled: !!issueId,
  });
}

export function useCreateComment(issueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      const res = await api.post(`/issues/${issueId}/comments`, { content });
      return res.data.data as { comment: IComment };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', issueId] }),
    onError: () => toast({ title: 'Failed to post comment', variant: 'destructive' }),
  });
}

export function useUpdateComment(issueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      const res = await api.patch(`/comments/${commentId}`, { content });
      return res.data.data as { comment: IComment };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', issueId] }),
  });
}

export function useDeleteComment(issueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(`/comments/${commentId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', issueId] }),
  });
}
