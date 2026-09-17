import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { IBoardColumn, IIssue } from '@taskflow/shared';
import { IssueCard } from './IssueCard';
import { Button } from '@/components/ui/button';
import { Plus, MoreHorizontal } from 'lucide-react';

interface BoardColumnProps {
  column: IBoardColumn & { issues: IIssue[] };
  onIssueClick: (issue: IIssue) => void;
  onAddIssueClick: (columnId: string) => void;
}

export function BoardColumnComponent({
  column,
  onIssueClick,
  onAddIssueClick,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column._id,
    data: {
      type: 'Column',
      column,
    },
  });

  const issueIds = column.issues.map((i) => i._id);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col flex-shrink-0 w-80 bg-muted/40 rounded-xl border p-3 max-h-full transition-colors ${
        isOver ? 'bg-accent/40 ring-2 ring-primary/40' : ''
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: column.color || '#6B7280' }}
          />
          <h3 className="font-semibold text-sm text-foreground">{column.name}</h3>
          <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold text-muted-foreground bg-muted rounded-full">
            {column.issues.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={() => onAddIssueClick(column._id)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Issues list (droppable & sortable) */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[150px]">
        <SortableContext items={issueIds} strategy={verticalListSortingStrategy}>
          {column.issues.map((issue) => (
            <IssueCard key={issue._id} issue={issue} onClick={onIssueClick} />
          ))}
        </SortableContext>

        {column.issues.length === 0 && (
          <div className="flex items-center justify-center h-24 border-2 border-dashed border-border/60 rounded-lg text-xs text-muted-foreground/60">
            Drop issues here
          </div>
        )}
      </div>

      {/* Column footer: Quick create */}
      <div className="pt-2 mt-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-xs text-muted-foreground hover:text-foreground h-8 gap-1.5"
          onClick={() => onAddIssueClick(column._id)}
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Create issue</span>
        </Button>
      </div>
    </div>
  );
}
