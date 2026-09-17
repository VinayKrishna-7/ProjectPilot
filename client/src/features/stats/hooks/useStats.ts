import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ProjectStats } from '@/types/api.types';

export function useProjectStats(projectId: string) {
  return useQuery({
    queryKey: ['stats', projectId],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}/stats`);
      return res.data.data as { stats: ProjectStats };
    },
    enabled: !!projectId,
  });
}
