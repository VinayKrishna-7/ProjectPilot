import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IIssue } from '@taskflow/shared';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  getInitials,
  getPriorityBg,
  getPriorityColor,
  getTypeIcon,
  formatDate,
} from '@/lib/utils';
import { Calendar, AlertCircle } from 'lucide-react';

interface IssueCardProps {
  issue: IIssue;
  onClick: (issue: IIssue) => void;
  isOverlay?: boolean;
}

export function IssueCard({ issue, onClick, isOverlay = false }: IssueCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: issue._id,
    data: {
      type: 'Issue',
      issue,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const isOverdue =
    issue.dueDate &&
    new Date(issue.dueDate) < new Date() &&
    issue.status !== 'done';

  const assignee = typeof issue.assignee === 'object' ? issue.assignee : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(issue)}
      className={`cursor-grab active:cursor-grabbing select-none transition-shadow ${
        isDragging ? 'opacity-30' : 'opacity-100'
      } ${isOverlay ? 'shadow-2xl ring-2 ring-primary rotate-1' : ''}`}
    >
      <Card className="p-3 bg-card hover:border-primary/50 transition-colors shadow-sm space-y-2.5">
        {/* Top bar: Type + Key + Priority */}
        <div className="flex items-center justify-between gap-1 text-xs">
          <div className="flex items-center gap-1.5 font-mono text-muted-foreground font-medium">
            <span>{getTypeIcon(issue.type)}</span>
            <span className="hover:underline">{issue.key}</span>
          </div>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${getPriorityBg(
              issue.priority
            )}`}
          >
            {issue.priority}
          </span>
        </div>

        {/* Title */}
        <p className="text-sm font-medium leading-snug line-clamp-2 text-foreground">
          {issue.title}
        </p>

        {/* Labels */}
        {issue.labels && issue.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {issue.labels.map((lbl) => {
              if (typeof lbl !== 'object') return null;
              return (
                <span
                  key={lbl._id}
                  className="inline-block px-1.5 py-0.2 rounded text-[10px] font-medium border"
                  style={{
                    backgroundColor: `${lbl.color}15`,
                    borderColor: `${lbl.color}40`,
                    color: lbl.color,
                  }}
                >
                  {lbl.name}
                </span>
              );
            })}
          </div>
        )}

        {/* Footer: Due date + Story points + Assignee */}
        <div className="flex items-center justify-between pt-1 border-t border-border/50 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {issue.dueDate && (
              <span
                className={`flex items-center gap-1 text-[11px] ${
                  isOverdue ? 'text-destructive font-medium' : ''
                }`}
              >
                {isOverdue ? (
                  <AlertCircle className="h-3 w-3 text-destructive" />
                ) : (
                  <Calendar className="h-3 w-3" />
                )}
                {formatDate(issue.dueDate, 'MMM d')}
              </span>
            )}
            {issue.storyPoints !== undefined && issue.storyPoints !== null && (
              <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-secondary text-[10px] font-semibold text-secondary-foreground">
                {issue.storyPoints}
              </span>
            )}
          </div>

          <Avatar className="h-5 w-5">
            <AvatarImage src={assignee?.avatar} />
            <AvatarFallback className="text-[9px]">
              {assignee ? getInitials(assignee.name) : '?'}
            </AvatarFallback>
          </Avatar>
        </div>
      </Card>
    </div>
  );
}
