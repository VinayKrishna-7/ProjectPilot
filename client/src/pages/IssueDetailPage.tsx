import { useParams, Link } from 'react-router-dom';
import { useIssue } from '@/features/issue/hooks/useIssues';
import { CommentList } from '@/features/comments/CommentList';
import { ActivityTimeline } from '@/features/activity/ActivityTimeline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  getInitials,
  getTypeIcon,
  getPriorityBg,
  formatDate,
} from '@/lib/utils';
import { ArrowLeft, Clock, User, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function IssueDetailPage() {
  const { issueId = '' } = useParams<{ issueId: string }>();
  const { data, isLoading } = useIssue(issueId);
  const issue = data?.issue;

  if (isLoading || !issue) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto p-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  const project = typeof issue.project === 'object' ? issue.project : null;
  const assignee = typeof issue.assignee === 'object' ? issue.assignee : null;
  const reporter = typeof issue.reporter === 'object' ? issue.reporter : null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          to={project ? `/projects/${project._id}/board` : '/dashboard'}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Project
        </Link>
      </div>

      {/* Main Issue Card */}
      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-muted-foreground">
              <span>{getTypeIcon(issue.type)}</span>
              <span>{issue.key}</span>
            </div>
            <h1 className="text-xl font-bold text-foreground">{issue.title}</h1>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded text-xs font-semibold uppercase ${getPriorityBg(
                issue.priority
              )}`}
            >
              {issue.priority}
            </span>
            <span className="px-2.5 py-1 rounded text-xs font-semibold uppercase bg-secondary text-secondary-foreground">
              {issue.status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
          <div className="md:col-span-2 p-6 space-y-6">
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Description
              </h3>
              <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {issue.description || 'No description provided.'}
              </p>
            </div>

            <Tabs defaultValue="comments" className="pt-4">
              <TabsList className="grid w-full grid-cols-2 max-w-[240px]">
                <TabsTrigger value="comments">Comments</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
              <TabsContent value="comments" className="pt-4">
                <CommentList issueId={issue._id} />
              </TabsContent>
              <TabsContent value="activity" className="pt-4">
                <ActivityTimeline issueId={issue._id} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="p-6 space-y-4 text-xs bg-muted/20">
            <div className="space-y-1">
              <span className="font-semibold text-muted-foreground">Assignee</span>
              <div className="flex items-center gap-2 pt-1">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={assignee?.avatar} />
                  <AvatarFallback className="text-[10px]">
                    {assignee ? getInitials(assignee.name) : '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground">
                  {assignee?.name || 'Unassigned'}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-semibold text-muted-foreground">Reporter</span>
              <div className="flex items-center gap-2 pt-1">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={reporter?.avatar} />
                  <AvatarFallback className="text-[10px]">
                    {reporter ? getInitials(reporter.name) : '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground">
                  {reporter?.name || 'Unknown'}
                </span>
              </div>
            </div>

            {issue.storyPoints !== undefined && issue.storyPoints !== null && (
              <div className="space-y-1">
                <span className="font-semibold text-muted-foreground">Story Points</span>
                <p className="font-bold text-foreground text-sm">
                  {issue.storyPoints}
                </p>
              </div>
            )}

            {issue.dueDate && (
              <div className="space-y-1">
                <span className="font-semibold text-muted-foreground">Due Date</span>
                <p className="font-medium text-foreground">
                  {formatDate(issue.dueDate)}
                </p>
              </div>
            )}

            <div className="pt-4 border-t space-y-1 text-muted-foreground text-[11px]">
              <p>Created {formatDate(issue.createdAt)}</p>
              <p>Updated {formatDate(issue.updatedAt)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
