import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useSprints,
  useStartSprint,
  useDeleteSprint,
} from '@/features/sprint/hooks/useSprints';
import { useProject } from '@/features/project/hooks/useProjects';
import { CreateSprintDialog } from '@/features/sprint/CreateSprintDialog';
import { CompleteSprintDialog } from '@/features/sprint/CompleteSprintDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Zap, CheckCircle2, Calendar, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { ISprint } from '@taskflow/shared';
import { Skeleton } from '@/components/ui/skeleton';

export default function SprintsPage() {
  const { projectId = '' } = useParams<{ projectId: string }>();

  const [createSprintOpen, setCreateSprintOpen] = useState(false);
  const [completeSprintTarget, setCompleteSprintTarget] = useState<ISprint | null>(null);

  const { data: projectData } = useProject(projectId);
  const project = projectData?.project;

  const { data: sprintsData, isLoading } = useSprints(projectId);
  const sprints = sprintsData?.sprints || [];

  const startSprintMutation = useStartSprint(projectId);
  const deleteSprintMutation = useDeleteSprint(projectId);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Sprints</span>
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-muted text-muted-foreground">
              {project?.key}
            </span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage release iterations, goals, and sprint lifecycles
          </p>
        </div>

        <Button
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => setCreateSprintOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Create Sprint
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : sprints.length === 0 ? (
        <div className="border border-dashed rounded-xl p-12 text-center space-y-3">
          <Zap className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="font-semibold text-base">No sprints created</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Create sprints to organize tasks into time-boxed iterations.
          </p>
          <Button
            size="sm"
            onClick={() => setCreateSprintOpen(true)}
            className="mt-2"
          >
            Create First Sprint
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sprints.map((sprint) => (
            <Card key={sprint._id} className="shadow-sm">
              <CardHeader className="pb-3 flex flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold">
                    {sprint.name}
                  </CardTitle>
                  <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {sprint.startDate ? formatDate(sprint.startDate) : 'Not started'}{' '}
                      — {sprint.endDate ? formatDate(sprint.endDate) : 'Open ended'}
                    </span>
                  </div>
                </div>

                <Badge
                  variant={
                    sprint.status === 'active'
                      ? 'default'
                      : sprint.status === 'completed'
                      ? 'outline'
                      : 'secondary'
                  }
                  className="capitalize text-[11px]"
                >
                  {sprint.status}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground italic min-h-[32px]">
                  {sprint.goal || 'No goal stated.'}
                </p>

                <div className="flex items-center justify-between pt-3 border-t">
                  <Button asChild variant="outline" size="sm" className="text-xs">
                    <Link to={`/projects/${projectId}/backlog`}>View Issues</Link>
                  </Button>

                  <div className="flex items-center gap-2">
                    {sprint.status === 'planned' && (
                      <Button
                        size="sm"
                        className="text-xs h-8"
                        onClick={() => startSprintMutation.mutate(sprint._id)}
                        disabled={startSprintMutation.isPending}
                      >
                        Start Sprint
                      </Button>
                    )}

                    {sprint.status === 'active' && (
                      <Button
                        size="sm"
                        variant="default"
                        className="text-xs h-8"
                        onClick={() => setCompleteSprintTarget(sprint)}
                      >
                        Complete Sprint
                      </Button>
                    )}

                    {sprint.status !== 'active' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteSprintMutation.mutate(sprint._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
    </div>
  );
}
