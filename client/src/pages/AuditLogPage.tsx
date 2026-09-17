import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShieldAlert,
  Calendar,
  User,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { IAuditLog, ApiResponse } from '@taskflow/shared';

export default function AuditLogPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<IAuditLog | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', workspaceId, actionFilter, page],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ logs: IAuditLog[]; total: number; totalPages: number }>>(
        `/workspaces/${workspaceId}/audit-log`,
        {
          params: {
            action: actionFilter || undefined,
            page,
            limit: 15,
          },
        }
      );
      return (res.data as any).data;
    },
    enabled: !!workspaceId,
  });

  const getActionColor = (action: string) => {
    if (action.includes('delete') || action.includes('revoked')) {
      return 'border-destructive/30 text-destructive bg-destructive/10';
    }
    if (action.includes('created') || action.includes('accepted')) {
      return 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10';
    }
    if (action.includes('started')) {
      return 'border-primary/30 text-primary bg-primary/10';
    }
    return 'border-muted text-muted-foreground bg-muted/40';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to={`/workspaces/${workspaceId}`}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Workspace
            </Link>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            Security & Compliance Audit Trail
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Immutable activity record of sensitive administrative actions, member changes, and security events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs h-8 rounded-md border border-input bg-background px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Audit Actions</option>
            <option value="member_invited">Member Invited</option>
            <option value="invitation_accepted">Invitation Accepted</option>
            <option value="invitation_revoked">Invitation Revoked</option>
            <option value="workspace_created">Workspace Created</option>
            <option value="project_created">Project Created</option>
            <option value="project_deleted">Project Deleted</option>
            <option value="sprint_started">Sprint Started</option>
            <option value="sprint_completed">Sprint Completed</option>
          </select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 text-muted-foreground font-semibold">
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Actor</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Target Entity</th>
                  <th className="py-2.5 px-4">IP Address</th>
                  <th className="py-2.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      <div className="space-y-2 max-w-md mx-auto">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                      </div>
                    </td>
                  </tr>
                )}

                {!isLoading && (!data?.logs || data.logs.length === 0) && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      No audit events matching current filter.
                    </td>
                  </tr>
                )}

                {data?.logs?.map((log: any) => (
                  <tr key={log._id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{log.actor?.name || 'System / Service'}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <Badge variant="outline" className={`text-[10px] uppercase tracking-wider font-mono ${getActionColor(log.action)}`}>
                        {log.action?.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-muted-foreground whitespace-nowrap">
                      <span className="capitalize">{log.entityType}</span>:{' '}
                      <span className="font-mono text-[11px]">{log.entityId}</span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[11px] text-primary"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Info className="h-3.5 w-3.5 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between p-3 border-t text-xs text-muted-foreground">
              <span>
                Page {data.page} of {data.totalPages} ({data.total} total events)
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="h-7 px-2 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage(page + 1)}
                  className="h-7 px-2 text-xs"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail JSON Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Audit Event Payload</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-3 pt-2 text-xs">
              <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                <div>
                  <span className="font-semibold text-foreground">Action:</span> {selectedLog.action}
                </div>
                <div>
                  <span className="font-semibold text-foreground">Entity:</span> {selectedLog.entityType}
                </div>
                <div>
                  <span className="font-semibold text-foreground">IP:</span> {selectedLog.ipAddress}
                </div>
                <div>
                  <span className="font-semibold text-foreground">Time:</span>{' '}
                  {new Date(selectedLog.createdAt).toISOString()}
                </div>
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-foreground">Metadata Payload:</span>
                <pre className="p-3 bg-muted rounded-md font-mono text-[11px] overflow-x-auto text-foreground max-h-56">
                  {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
