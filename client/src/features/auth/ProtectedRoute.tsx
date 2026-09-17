import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useCurrentUser } from './hooks/useAuth';
import { PageLoader } from '@/components/common/PageLoader';

export function ProtectedRoute() {
  const { isAuthenticated, setUser, logout } = useAuthStore();
  const location = useLocation();

  const { data, isLoading, isError } = useCurrentUser({
    enabled: true,
  });

  useEffect(() => {
    if (data?.user) {
      setUser(data.user);
    } else if (isError) {
      logout();
    }
  }, [data, isError, setUser, logout]);

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated || isError || !data?.user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}
