import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLogin } from '@/features/auth/hooks/useAuth';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { mutate: login, isPending, error, isError } = useLogin();
  const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('projectpilot_saved_email') || '' : '';
  const [rememberMe, setRememberMe] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: savedEmail,
      password: '',
    },
  });

  const onSubmit = (data: LoginFormData) => {
    if (rememberMe) {
      try {
        localStorage.setItem('projectpilot_saved_email', data.email.trim());
      } catch {}
    } else {
      try {
        localStorage.removeItem('projectpilot_saved_email');
      } catch {}
    }
    login({ email: data.email.trim(), password: data.password });
  };

  let errorMessage: string | null = null;
  let isUserNotFound = false;

  if (isError && error) {
    const err = error as any;
    if (err.response?.data?.error?.message) {
      errorMessage = err.response.data.error.message;
      if (err.response.data.error.code === 'USER_NOT_FOUND') {
        isUserNotFound = true;
      }
    } else if (
      err.code === 'ECONNREFUSED' ||
      err.code === 'ERR_NETWORK' ||
      err.response?.status === 504 ||
      err.response?.status === 502
    ) {
      errorMessage = 'Cannot connect to backend server (http://localhost:5000). Please ensure the ProjectPilot backend is running.';
    } else if (err.message) {
      errorMessage = err.message;
    } else {
      errorMessage = 'Unable to sign in. Please verify your credentials.';
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your ProjectPilot workspace
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errorMessage && (
          <div className="p-3.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-sm flex items-start gap-3 animate-in fade-in duration-200">
            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-destructive" />
            <div className="space-y-1 flex-1">
              <p className="font-semibold text-xs tracking-wide uppercase">Sign-in error</p>
              <p className="text-xs leading-relaxed text-foreground/90">{errorMessage}</p>
              {isUserNotFound && (
                <div className="pt-1">
                  <Link
                    to="/register"
                    className="inline-flex items-center text-xs font-semibold text-primary underline hover:opacity-80"
                  >
                    Click here to create an account →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-muted-foreground hover:text-foreground">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-input text-primary focus:ring-primary h-4 w-4"
            />
            <span>Remember my email</span>
          </label>
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-semibold text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
