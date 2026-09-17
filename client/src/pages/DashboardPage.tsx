import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWorkspaces, useCreateWorkspace } from '@/features/workspace/hooks/useWorkspaces';
import { useProjects, useCreateProject } from '@/features/project/hooks/useProjects';
import { useUIStore } from '@/stores/uiStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  FolderOpen,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Briefcase,
} from 'lucide-react';
import { generateProjectKey, generateSlug } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { data: wsData, isLoading: isWsLoading } = useWorkspaces();
  const workspaces = wsData?.workspaces || [];

  const { activeWorkspaceId, setActiveWorkspace } = useUIStore();
  const currentWorkspace = workspaces.find((w) => w._id === activeWorkspaceId) || workspaces[0];
  const currentWorkspaceId = currentWorkspace?._id;

  const { data: projData, isLoading: isProjLoading } = useProjects(
    currentWorkspaceId || ''
  );
  const projects = projData?.projects || [];

  const [createWsOpen, setCreateWsOpen] = useState(false);
  const [wsName, setWsName] = useState('');
  const [createProjOpen, setCreateProjOpen] = useState(false);
  const [projName, setProjName] = useState('');
  const [projKey, setProjKey] = useState('');

  const createWsMutation = useCreateWorkspace();
  const createProjMutation = useCreateProject(currentWorkspaceId || '');

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsName.trim()) return;
    createWsMutation.mutate(
      { name: wsName, slug: generateSlug(wsName) },
      {
        onSuccess: (data) => {
          setActiveWorkspace(data.workspace._id);
          setWsName('');
          setCreateWsOpen(false);
        },
      }
    );
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim() || !projKey.trim()) return;
    createProjMutation.mutate(
      { name: projName, key: projKey.toUpperCase() },
      {
        onSuccess: () => {
          setProjName('');
          setProjKey('');
          setCreateProjOpen(false);
        },
      }
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner: Workspaces + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            {workspaces.length > 0
              ? 'Overview of your active workspace and projects'
              : 'Welcome to your workspace dashboard'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCreateWsOpen(true)}
            className="gap-1.5"
          >
            <Briefcase className="h-4 w-4" />
            New Workspace
          </Button>

          {currentWorkspaceId && (
            <Button
              size="sm"
              onClick={() => setCreateProjOpen(true)}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          )}
        </div>
      </div>

      {isWsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : workspaces.length === 0 ? (
        <div className="border border-dashed border-border rounded-2xl p-12 text-center max-w-xl mx-auto space-y-5 my-8 bg-card/50">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-sm">
            <Briefcase className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Welcome to ProjectPilot</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Your account is completely clean and ready. Create your first workspace to start organizing projects, managing sprints, and customizing your workflow.
            </p>
          </div>
          <Button
            size="default"
            onClick={() => setCreateWsOpen(true)}
            className="gap-2 shadow-sm font-semibold"
          >
            <Plus className="h-4 w-4" /> Create Workspace
          </Button>
        </div>
      ) : (
        <>
          {/* Workspace Selector Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b">
            <span className="text-xs font-semibold text-muted-foreground uppercase mr-2">
              Workspaces:
            </span>
            {workspaces.map((ws) => (
              <Button
                key={ws._id}
                variant={ws._id === currentWorkspaceId ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setActiveWorkspace(ws._id)}
                className="h-8 text-xs font-medium"
              >
                {ws.name}
              </Button>
            ))}
          </div>

          {/* Projects Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Projects
              </h2>
              {currentWorkspaceId && (
                <Link
                  to={`/workspaces/${currentWorkspaceId}`}
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                >
                  Manage Workspace <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>

            {isProjLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-xl" />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="border border-dashed rounded-xl p-12 text-center space-y-3">
                <FolderOpen className="h-10 w-10 text-muted-foreground mx-auto" />
                <h3 className="font-semibold text-base">No projects yet</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Create your first project to start creating issues, managing sprints,
                  and tracking progress on Kanban boards.
                </p>
                <Button
                  size="sm"
                  onClick={() => setCreateProjOpen(true)}
                  className="mt-2 gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Create Project
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <Card
                    key={project._id}
                    className="hover:border-primary/50 transition-all shadow-sm hover:shadow group"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                          {project.key}
                        </span>
                        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                          {project.status}
                        </span>
                      </div>
                      <CardTitle className="text-base font-semibold pt-1">
                        {project.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
                        {project.description || 'No description provided.'}
                      </p>

                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Button asChild size="sm" variant="default" className="flex-1 text-xs">
                          <Link to={`/projects/${project._id}/board`}>Kanban Board</Link>
                        </Button>
                        <Button asChild size="sm" variant="outline" className="flex-1 text-xs">
                          <Link to={`/projects/${project._id}/backlog`}>Backlog</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Create Workspace Modal */}
      <Dialog open={createWsOpen} onOpenChange={setCreateWsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Workspace</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateWorkspace} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="wsName">Workspace Name</Label>
              <Input
                id="wsName"
                placeholder="e.g. My Team or Engineering"
                value={wsName}
                onChange={(e) => setWsName(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateWsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createWsMutation.isPending}>
                {createWsMutation.isPending ? 'Creating...' : 'Create Workspace'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Project Modal */}
      <Dialog open={createProjOpen} onOpenChange={setCreateProjOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateProject} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="projName">Project Name</Label>
              <Input
                id="projName"
                placeholder="e.g. Mobile App or Web Platform"
                value={projName}
                onChange={(e) => {
                  setProjName(e.target.value);
                  if (!projKey) {
                    setProjKey(generateProjectKey(e.target.value));
                  }
                }}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="projKey">Project Key</Label>
              <Input
                id="projKey"
                placeholder="PP"
                value={projKey}
                onChange={(e) => setProjKey(e.target.value.toUpperCase())}
                maxLength={10}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Used as prefix for issues (e.g. {projKey || 'KEY'}-1)
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateProjOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createProjMutation.isPending}>
                {createProjMutation.isPending ? 'Creating...' : 'Create Project'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
