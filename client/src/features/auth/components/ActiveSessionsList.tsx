import React from 'react';
import { useSessions, useRevokeSession, useRevokeOtherSessions } from '../hooks/useSessions';
import { Laptop, Smartphone, ShieldAlert, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ISession } from '@taskflow/shared';

export const ActiveSessionsList: React.FC = () => {
  const { data: sessions, isLoading, error } = useSessions();
  const revokeMutation = useRevokeSession();
  const revokeOthersMutation = useRevokeOtherSessions();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load active sessions.
      </div>
    );
  }

  const otherSessionsCount = (sessions || []).filter((s: ISession & { isCurrent?: boolean }) => !s.isCurrent).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-medium text-foreground">Active Device Sessions</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your logged-in browsers and devices. You can remotely sign out any unfamiliar session.
          </p>
        </div>
        {otherSessionsCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive/10 border-destructive/30"
            onClick={() => revokeOthersMutation.mutate()}
            disabled={revokeOthersMutation.isPending}
          >
            <ShieldAlert className="h-4 w-4 mr-2" />
            Sign Out Other Devices
          </Button>
        )}
      </div>

      <div className="divide-y divide-border rounded-lg border bg-card">
        {(sessions || []).map((sess: ISession & { isCurrent?: boolean }) => {
          const isMobile = /mobile|iphone|android/i.test(sess.userAgent);
          return (
            <div
              key={sess._id}
              className="flex items-center justify-between p-4 transition-colors hover:bg-muted/40"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {isMobile ? <Smartphone className="h-5 w-5" /> : <Laptop className="h-5 w-5" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground truncate max-w-[280px] sm:max-w-md">
                      {sess.userAgent}
                    </span>
                    {sess.isCurrent && (
                      <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-[10px] h-5">
                        Current Session
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>IP: {sess.ipAddress}</span>
                    <span>•</span>
                    <span>Last active: {new Date(sess.lastActiveAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {!sess.isCurrent && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => revokeMutation.mutate(sess._id)}
                  disabled={revokeMutation.isPending}
                  title="Revoke session"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
