import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useProject } from '@/features/project/hooks/useProjects';
import {
  useSprints,
  useStartSprint,
  useDeleteSprint,
} from '@/features/sprint/hooks/useSprints';
import { useIssues, useUpdateIssue } from '@/features/issue/hooks/useIssues';
import { useUrlFilterSync } from '@/features/issue/hooks/useUrlFilterSync';
import { useFilterStore } from '@/stores/filterStore';
import { IssueFilterBar } from '@/features/issue/IssueFilterBar';
import { CreateIssueDialog } from '@/features/issue/CreateIssueDialog';
import { CreateSprintDialog } from '@/features/sprint/CreateSprintDialog';
import { CompleteSprintDialog } from '@/features/sprint/CompleteSprintDialog';
import { IssueDetailModal } from '@/features/issue/IssueDetailModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Plus,
  Zap,
  CheckCircle,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import {
  getInitials,
  getPriorityBg,
  getTypeIcon,
  formatDate,
} from '@/lib/utils';
import { IIssue, ISprint } from '@taskflow/shared';
import { Skeleton } from '@/components/ui/skeleton';

export default function BacklogPage() {
  const { projectId = '' } = useParams<{ projectId: string }>();

  // Synchronize URL search parameters with filter store
  useUrlFilterSync();
  const { filters } = useFilterStore();

  const [createIssueOpen, setCreateIssueOpen] = useState(false);
  const [createSprintOpen, setCreateSprintOpen] = useState(false);
  const [completeSprintTarget, setCompleteSprintTarget] = useState<ISprint | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [targetSprintForCreate, setTargetSprintForCreate] = useState<string | undefined>();

  const { data: projectData } = useProject(projectId);
  const project = projectData?.project;

  const { data: sprintsData, isLoading: isSprintsLoading } = useSprints(projectId);
  const sprints = sprintsData?.sprints || [];

  const { data: issuesData, isLoading: isIssuesLoading } = useIssues(projectId, {
    limit: 100,
  });
  const rawIssues = issuesData?.issues || [];

  const allIssues = useMemo(() => {
    return rawIssues.filter((issue) => {
      if (filters.search) {
        const s = filters.search.toLowerCase();
        if (!issue.title.toLowerCase().includes(s) && !issue.key.toLowerCase().includes(s)) return false;
      }
      if (filters.priority && issue.priority !== filters.priority) return false;
      if (filters.status && issue.status !== filters.status) return false;
      if (filters.assignee === 'unassigned' && issue.assignee) return false;
      if (filters.assignee && filters.assignee !== 'unassigned') {
        const aId = typeof issue.assignee === 'object' ? (issue.assignee as any)?._id : issue.assignee;
        if (aId !== filters.assignee) return false;
      }
      return true;
    });
  }, [rawIssues, filters]);

  const startSprintMutation = useStartSprint(projectId);
  const deleteSprintMutation = useDeleteSprint(projectId);
  const updateIssueMutation = useUpdateIssue('');

  const backlogIssues = allIssues.filter((i) => !i.sprint);

  const handleIssueClick = (issue: IIssue) => {
    setSelectedIssueId(issue._id);
    setDetailModalOpen(true);
  };

  const handleMoveIssueToSprint = (
    issueId: string,
    sprintId: string | null
  ) => {
    updateIssueMutation.mutate({ sprint: sprintId || undefined });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Backlog</span>
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-muted text-muted-foreground">
              {project?.key}
            </span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Plan sprints, estimate story points, and prioritize backlog items
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => setCreateSprintOpen(true)}
          >
            <Zap className="h-3.5 w-3.5" />
            Create Sprint
          </Button>
          <Button
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => {
              setTargetSprintForCreate(undefined);
              setCreateIssueOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Create Issue
          </Button>
        </div>
      </div>

      {/* Filter and Saved Views Bar */}
      <div className="shrink-0">
        <IssueFilterBar projectId={projectId} />
      </div>

      {/* Sprints Sections */}
      <div className="space-y-6">
        {isSprintsLoading || isIssuesLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : (
          sprints.map((sprint) => {
            const sprintIssues = allIssues.filter(
              (i) =>
                (typeof i.sprint === 'object' ? i.sprint?._id : i.sprint) ===
                sprint._id
            );
            const totalPoints = sprintIssues.reduce(
              (acc, curr) => acc + (curr.storyPoints || 0),
              0
            );

            return (
              <div
                key={sprint._id}
                className="bg-card rounded-xl border shadow-sm overflow-hidden"
              >
                {/* Sprint Header */}
                <div className="p-4 bg-muted/30 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">
                      {sprint.name}
                    </span>
                    <Badge
                      variant={
                        sprint.status === 'active'
                          ? 'default'
                          : sprint.status === 'completed'
                          ? 'outline'
                          : 'secondary'
                      }
                      className="text-[10px] capitalize"
                    >
                      {sprint.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {sprintIssues.length} issues • {totalPoints} story points
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {sprint.status === 'planned' && (
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 text-xs"
                        onClick={() => startSprintMutation.mutate(sprint._id)}
                        disabled={startSprintMutation.isPending}
                      >
                        Start Sprint
                      </Button>
                    )}

                    {sprint.status === 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-primary text-primary"
                        onClick={() => setCompleteSprintTarget(sprint)}
                      >
                        Complete Sprint
                      </Button>
                    )}

                    {sprint.status !== 'active' && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => deleteSprintMutation.mutate(sprint._id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Sprint Goal if any */}
                {sprint.goal && (
                  <div className="px-4 py-2 bg-muted/10 border-b text-xs text-muted-foreground italic">
                    Goal: {sprint.goal}
                  </div>
                )}

                {/* Issues in sprint */}
                <div className="divide-y">
                  {sprintIssues.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground italic">
                      Plan a sprint by dragging or moving issues here.
                    </div>
                  ) : (
                    sprintIssues.map((issue) => (
                      <IssueRow
                        key={issue._id}
                        issue={issue}
                        onClick={() => handleIssueClick(issue)}
                      />
                    ))
                  )}
                </div>

                <div className="p-2 border-t bg-muted/10">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-foreground h-7 gap-1"
                    onClick={() => {
                      setTargetSprintForCreate(sprint._id);
                      setCreateIssueOpen(true);
                    }}
                  >
                    <Plus className="h-3 w-3" /> Add issue to {sprint.name}
                  </Button>
                </div>
              </div>
            );
          })
        )}

        {/* Backlog Section (Issues without sprint) */}
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <div className="p-4 bg-muted/30 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-foreground">
                Backlog
              </span>
              <span className="text-xs text-muted-foreground">
                {backlogIssues.length} issues
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1"
              onClick={() => {
                setTargetSprintForCreate(undefined);
                setCreateIssueOpen(true);
              }}
            >
              <Plus className="h-3 w-3" /> Create issue
            </Button>
          </div>

          <div className="divide-y">
            {backlogIssues.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground italic">
                Your backlog is empty. Create issues to queue upcoming work.
              </div>
            ) : (
              backlogIssues.map((issue) => (
                <IssueRow
                  key={issue._id}
                  issue={issue}
                  onClick={() => handleIssueClick(issue)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Issue Dialog */}
      <CreateIssueDialog
        open={createIssueOpen}
        onOpenChange={setCreateIssueOpen}
        projectId={projectId}
        defaultSprintId={targetSprintForCreate}
      />

      {/* Create Sprint Dialog */}
      <CreateSprintDialog
        open={createSprintOpen}
        onOpenChange={setCreateSprintOpen}
        projectId={projectId}
      />

      {/* Complete Sprint Dialog */}
      {completeSprintTarget && (
        <CompleteSprintDialog
          open={!!completeSprintTarget}
          onOpenChange={(open) => !open && setCompleteSprintTarget(null)}
          sprint={completeSprintTarget}
          projectId={projectId}
        />
      )}

      {/* Issue Detail Modal */}
      <IssueDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        issueId={selectedIssueId}
        projectId={projectId}
      />
    </div>
  );
}

function IssueRow({
  issue,
  onClick,
}: {
  issue: IIssue;
  onClick: () => void;
}) {
  const assignee = typeof issue.assignee === 'object' ? issue.assignee : null;

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-3 hover:bg-muted/40 cursor-pointer transition-colors text-xs gap-3"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="shrink-0">{getTypeIcon(issue.type)}</span>
        <span className="font-mono text-muted-foreground font-semibold shrink-0">
          {issue.key}
        </span>
        <span className="font-medium text-foreground truncate">{issue.title}</span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${getPriorityBg(
            issue.priority
          )}`}
        >
          {issue.priority}
        </span>

        {issue.storyPoints !== undefined && issue.storyPoints !== null && (
          <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-secondary text-[11px] font-bold">
            {issue.storyPoints}
          </span>
        )}

        <Avatar className="h-6 w-6">
          <AvatarImage src={assignee?.avatar} />
          <AvatarFallback className="text-[10px]">
            {assignee ? getInitials(assignee.name) : '?'}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
