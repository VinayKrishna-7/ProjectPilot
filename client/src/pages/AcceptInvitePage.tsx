import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Users, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const user = useAuthStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Missing invitation token in link');
      setLoading(false);
      return;
    }

    const fetchDetails = async () => {
      try {
        const res = await api.get(`/invitations/${token}`);
        setInvitation((res.data as any).data?.invitation);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Invalid or expired invitation');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
    setError(null);

    try {
      const res = await api.post(`/invitations/${token}/accept`);
      setSuccess(true);
      const wsId = (res.data as any).data?.workspace?._id;
      setTimeout(() => {
        if (wsId) {
          navigate(`/workspaces/${wsId}`);
        } else {
          navigate('/dashboard');
        }
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to accept invitation');
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-sm text-muted-foreground animate-pulse">
          Validating invitation details...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md shadow-lg border">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
            <Users className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">Workspace Invitation</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-600">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Invitation accepted! Redirecting to workspace...</span>
            </div>
          )}

          {invitation && !success && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                You have been invited by{' '}
                <strong className="text-foreground">
                  {invitation.invitedBy?.name || 'A team member'}
                </strong>{' '}
                to collaborate on:
              </p>

              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="font-bold text-base text-foreground">
                  {invitation.workspace?.name}
                </div>
                {invitation.workspace?.description && (
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {invitation.workspace.description}
                  </div>
                )}
                <div className="mt-2.5">
                  <Badge variant="outline" className="capitalize text-xs">
                    Role: {invitation.role}
                  </Badge>
                </div>
              </div>

              {!user ? (
                <div className="space-y-2 pt-2">
                  <p className="text-xs text-muted-foreground">
                    Please log in or register to join this workspace.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Link to={`/login?returnTo=/invitations/accept?token=${token}`}>
                      <Button size="sm">Log In</Button>
                    </Link>
                    <Link to={`/register?returnTo=/invitations/accept?token=${token}`}>
                      <Button size="sm" variant="outline">
                        Register
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="w-full"
                  size="sm"
                >
                  {accepting ? 'Joining Workspace...' : 'Accept & Join Workspace'}
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="justify-center border-t py-3 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground underline">
            Return to ProjectPilot Home
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
