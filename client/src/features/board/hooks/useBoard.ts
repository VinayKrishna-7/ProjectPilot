import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { BoardData } from '@/types/api.types';

export function useBoard(projectId: string, sprintId?: string) {
  return useQuery({
    queryKey: ['board', projectId, sprintId],
    queryFn: async () => {
      const params = sprintId ? `?sprint=${sprintId}` : '';
      const res = await api.get(`/projects/${projectId}/board${params}`);
      return res.data.data as BoardData;
    },
    enabled: !!projectId,
  });
}
