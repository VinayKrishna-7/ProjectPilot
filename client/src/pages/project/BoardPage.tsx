import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useProject } from '@/features/project/hooks/useProjects';
import { useBoard } from '@/features/board/hooks/useBoard';
import { useSprints } from '@/features/sprint/hooks/useSprints';
import { useFilterStore } from '@/stores/filterStore';
import { useUrlFilterSync } from '@/features/issue/hooks/useUrlFilterSync';
import { KanbanBoard } from '@/features/board/KanbanBoard';
import { IssueFilterBar } from '@/features/issue/IssueFilterBar';
import { JqlSearchBar } from '@/features/issue/components/JqlSearchBar';
import { ConflictDialog } from '@/features/issue/components/ConflictDialog';
import { CreateIssueDialog } from '@/features/issue/CreateIssueDialog';
import { IssueDetailModal } from '@/features/issue/IssueDetailModal';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Zap } from 'lucide-react';
import { IIssue } from '@taskflow/shared';
import { Skeleton } from '@/components/ui/skeleton';

export default function BoardPage() {
  const { projectId = '' } = useParams<{ projectId: string }>();

  // Bidirectionally sync URL search parameters with filter state
  useUrlFilterSync();

  const [selectedSprintId, setSelectedSprintId] = useState<string>('active');
  const [createIssueOpen, setCreateIssueOpen] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<string | undefined>();
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [jqlFilteredIssues, setJqlFilteredIssues] = useState<IIssue[] | null>(null);
  const [conflictIssue, setConflictIssue] = useState<IIssue | null>(null);

  const { data: projectData } = useProject(projectId);
  const project = projectData?.project;

  const { data: sprintsData } = useSprints(projectId);
  const sprints = sprintsData?.sprints || [];
  const activeSprint = sprints.find((s) => s.status === 'active');

  // Determine sprintId for query
  const querySprintId =
    selectedSprintId === 'active'
      ? activeSprint?._id
      : selectedSprintId === 'all'
      ? undefined
      : selectedSprintId;

  const { data: boardData, isLoading: isBoardLoading, refetch: refetchBoard } = useBoard(
    projectId,
    querySprintId
  );

  const { filters } = useFilterStore();

  // Filter issues based on client filters or JQL results
  const filteredColumns = useMemo(() => {
    if (!boardData?.columns) return [];

    return boardData.columns.map((column) => {
      const issues = column.issues.filter((issue) => {
        // If JQL search is active, match against JQL results
        if (jqlFilteredIssues !== null) {
          return jqlFilteredIssues.some((j) => j._id === issue._id);
        }
        // Search filter
        if (filters.search) {
          const s = filters.search.toLowerCase();
          const matchTitle = issue.title.toLowerCase().includes(s);
          const matchKey = issue.key.toLowerCase().includes(s);
          if (!matchTitle && !matchKey) return false;
        }

        // Priority filter
        if (filters.priority && issue.priority !== filters.priority) {
          return false;
        }

        // Assignee filter
        if (filters.assignee === 'unassigned' && issue.assignee) {
          return false;
        } else if (
          filters.assignee &&
          filters.assignee !== 'unassigned' &&
          (typeof issue.assignee === 'object'
            ? issue.assignee?._id
            : issue.assignee) !== filters.assignee
        ) {
          return false;
        }

        // Status filter
        if (filters.status && issue.status !== filters.status) {
          return false;
        }

        return true;
      });

      return { ...column, issues };
    });
  }, [boardData?.columns, filters]);

  const handleIssueClick = (issue: IIssue) => {
    setSelectedIssueId(issue._id);
    setDetailModalOpen(true);
  };

  const handleAddIssueClick = (columnId: string) => {
    setSelectedColumnId(columnId);
    setCreateIssueOpen(true);
  };

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto flex flex-col h-full">
      {/* Board Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>{project?.name || 'Project'}</span>
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-muted text-muted-foreground">
              {project?.key}
            </span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Kanban Board • Drag issues between columns to update status
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sprint Filter */}
          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <Select
              value={selectedSprintId}
              onValueChange={setSelectedSprintId}
            >
              <SelectTrigger className="h-8 text-xs w-44">
                <SelectValue placeholder="Sprint" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">
                  {activeSprint ? `Active: ${activeSprint.name}` : 'Active Sprint (None)'}
                </SelectItem>
                <SelectItem value="all">All Issues (Across Sprints)</SelectItem>
                {sprints.map((s) => (
                  <SelectItem key={s._id} value={s._id}>
                    {s.name} ({s.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => {
              setSelectedColumnId(undefined);
              setCreateIssueOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Create Issue
          </Button>
        </div>
      </div>

      {/* JQL Query Bar & Filter Controls */}
      <div className="shrink-0 space-y-2">
        <JqlSearchBar
          projectId={projectId}
          onJqlResults={(issues, isActive) => {
            setJqlFilteredIssues(isActive ? issues : null);
          }}
        />
        <IssueFilterBar projectId={projectId} />
      </div>

      {/* Board Columns (dnd-kit) */}
      <div className="flex-1 min-h-0">
        {isBoardLoading ? (
          <div className="flex gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-80 space-y-3">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-28 w-full rounded-lg" />
                <Skeleton className="h-28 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : filteredColumns.length === 0 ? (
          <div className="flex items-center justify-center h-64 border rounded-xl">
            <p className="text-sm text-muted-foreground">
              No board columns found.
            </p>
          </div>
        ) : (
          <KanbanBoard
            projectId={projectId}
            columns={filteredColumns}
            onIssueClick={handleIssueClick}
            onAddIssueClick={handleAddIssueClick}
          />
        )}
      </div>

      {/* Create Issue Dialog */}
      <CreateIssueDialog
        open={createIssueOpen}
        onOpenChange={setCreateIssueOpen}
        projectId={projectId}
        defaultColumnId={selectedColumnId}
        defaultSprintId={activeSprint?._id}
      />

      {/* Issue Detail Modal */}
      <IssueDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        issueId={selectedIssueId}
        projectId={projectId}
      />

      {/* Concurrency Conflict Dialog */}
      <ConflictDialog
        isOpen={!!conflictIssue}
        onClose={() => setConflictIssue(null)}
        currentIssue={conflictIssue}
        onReload={() => {
          refetchBoard();
        }}
      />
    </div>
  );
}
