import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { ThemeToggle } from './ThemeToggle';

export function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-md">
              <span className="text-primary-foreground font-bold text-sm">PP</span>
            </div>
            <span className="text-2xl font-bold text-foreground">ProjectPilot</span>
          </div>
          <p className="text-muted-foreground text-sm">Project Management Made Simple</p>
        </div>
        <div className="bg-card rounded-2xl shadow-xl border p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
