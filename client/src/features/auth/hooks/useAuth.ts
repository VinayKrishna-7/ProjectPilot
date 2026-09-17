import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { toast } from '@/components/ui/use-toast';
import { IUser } from '@taskflow/shared';

export function useCurrentUser(options?: {
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data.data as { user: IUser };
    },
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useLogin() {
  const { setUser } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await api.post('/auth/login', data);
      return res.data.data as { user: IUser; token: string };
    },
    onSuccess: (data, variables) => {
      queryClient.clear();
      useUIStore.getState().setActiveWorkspace(null);
      useUIStore.getState().setActiveProject(null);
      setUser(data.user);
      queryClient.setQueryData(['auth', 'me'], { user: data.user });
      try {
        localStorage.setItem('projectpilot_saved_email', variables.email.trim());
      } catch {}
      navigate('/dashboard');
    },
    onError: (error: any) => {
      let message = 'Unable to sign in. Please verify your credentials.';
      if (error.response?.data?.error?.message) {
        message = error.response.data.error.message;
      } else if (
        error.code === 'ECONNREFUSED' ||
        error.code === 'ERR_NETWORK' ||
        error.response?.status === 504 ||
        error.response?.status === 502
      ) {
        message = 'Cannot connect to backend server on port 5000. Please ensure the ProjectPilot backend is running.';
      } else if (error.message) {
        message = error.message;
      }
      toast({
        title: 'Sign In Failed',
        description: message,
        variant: 'destructive',
      });
    },
  });
}

export function useRegister() {
  const { setUser } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; email: string; password: string }) => {
      const res = await api.post('/auth/register', data);
      return res.data.data as { user: IUser; token: string };
    },
    onSuccess: (data, variables) => {
      queryClient.clear();
      useUIStore.getState().setActiveWorkspace(null);
      useUIStore.getState().setActiveProject(null);
      setUser(data.user);
      queryClient.setQueryData(['auth', 'me'], { user: data.user });
      try {
        localStorage.setItem('projectpilot_saved_email', variables.email.trim());
      } catch {}
      navigate('/dashboard');
    },
    onError: (error: any) => {
      toast({
        title: 'Registration failed',
        description: error.response?.data?.error?.message || 'Failed to register',
        variant: 'destructive',
      });
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        await api.post('/auth/logout');
      } catch {
        // Silently catch so local logout always completes
      }
    },
    onSettled: () => {
      logout();
      useUIStore.getState().setActiveWorkspace(null);
      useUIStore.getState().setActiveProject(null);
      queryClient.clear();
      navigate('/login');
    },
  });
}

export function useUpdateProfile() {
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name?: string;
      bio?: string;
      timezone?: string;
      avatar?: string;
    }) => {
      const res = await api.patch('/auth/profile', data);
      return res.data.data as { user: IUser };
    },
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.setQueryData(['auth', 'me'], { user: data.user });
      toast({ title: 'Profile updated successfully' });
    },
    onError: () => toast({ title: 'Failed to update profile', variant: 'destructive' }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      await api.patch('/auth/change-password', data);
    },
    onSuccess: () => toast({ title: 'Password changed successfully' }),
    onError: (error: any) => {
      toast({
        title: 'Failed to change password',
        description: error.response?.data?.error?.message,
        variant: 'destructive',
      });
    },
  });
}
