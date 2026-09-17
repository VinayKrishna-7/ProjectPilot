import { useIssueActivities } from '@/features/issue/hooks/useIssues';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, formatRelativeTime, capitalize } from '@/lib/utils';
import { IActivity } from '@taskflow/shared';

interface ActivityTimelineProps {
  issueId: string;
}

export function ActivityTimeline({ issueId }: ActivityTimelineProps) {
  const { data, isLoading } = useIssueActivities(issueId);
  const activities = data?.activities || [];

  if (isLoading) {
    return <p className="text-xs text-muted-foreground">Loading history...</p>;
  }

  if (activities.length === 0) {
    return <p className="text-xs text-muted-foreground italic">No activity recorded yet.</p>;
  }

  const renderDescription = (activity: IActivity) => {
    const { type, metadata } = activity;
    switch (type) {
      case 'issue_created':
        return 'created this issue';
      case 'status_changed':
        return (
          <span>
            changed status from{' '}
            <span className="font-medium text-foreground">
              {capitalize(String(metadata.from || ''))}
            </span>{' '}
            to{' '}
            <span className="font-medium text-foreground">
              {capitalize(String(metadata.to || ''))}
            </span>
          </span>
        );
      case 'priority_changed':
        return (
          <span>
            changed priority from{' '}
            <span className="font-medium text-foreground">
              {capitalize(String(metadata.from || ''))}
            </span>{' '}
            to{' '}
            <span className="font-medium text-foreground">
              {capitalize(String(metadata.to || ''))}
            </span>
          </span>
        );
      case 'assignee_changed':
        return 'updated the assignee';
      case 'sprint_changed':
        return 'moved this issue to a different sprint or backlog';
      case 'comment_created':
        return 'added a comment';
      case 'attachment_added':
        return `attached file ${metadata.fileName || ''}`;
      default:
        return capitalize(type.replace(/_/g, ' '));
    }
  };

  return (
    <div className="space-y-4 pt-1">
      {activities.map((act) => {
        const actor = typeof act.actor === 'object' ? act.actor : null;
        return (
          <div key={act._id} className="flex gap-3 text-xs items-start">
            <Avatar className="h-6 w-6 mt-0.5 shrink-0">
              <AvatarImage src={actor?.avatar} />
              <AvatarFallback className="text-[10px]">
                {actor ? getInitials(actor.name) : 'A'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-foreground/90">
                <span className="font-semibold text-foreground">
                  {actor?.name || 'Someone'}
                </span>{' '}
                {renderDescription(act)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {formatRelativeTime(act.createdAt)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
