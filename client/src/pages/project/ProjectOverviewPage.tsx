import { Link, useParams } from 'react-router-dom';
import { useProject } from '@/features/project/hooks/useProjects';
import { useProjectStats } from '@/features/stats/hooks/useStats';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  KanbanSquare,
  BookOpen,
  Zap,
  BarChart3,
  Users,
  Settings,
  ArrowRight,
} from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProjectOverviewPage() {
  const { projectId = '' } = useParams<{ projectId: string }>();
  const { data: projectData, isLoading: isProjLoading } = useProject(projectId);
  const { data: statsData, isLoading: isStatsLoading } = useProjectStats(projectId);

  const project = projectData?.project;
  const stats = statsData?.stats;
  const lead = typeof project?.lead === 'object' ? project.lead : null;

  if (isProjLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Project Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-card rounded-2xl border shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
              {project?.key}
            </span>
            <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
              {project?.status}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {project?.name}
          </h1>
          <p className="text-xs text-muted-foreground max-w-2xl">
            {project?.description || 'No description provided for this project.'}
          </p>
        </div>

        {lead && (
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border shrink-0">
            <Avatar className="h-9 w-9">
              <AvatarImage src={lead.avatar} />
              <AvatarFallback>{getInitials(lead.name)}</AvatarFallback>
            </Avatar>
            <div className="text-xs">
              <p className="text-muted-foreground font-medium">Project Lead</p>
              <p className="font-semibold text-foreground">{lead.name}</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to={`/projects/${projectId}/board`}>
          <Card className="hover:border-primary/50 transition-all cursor-pointer group">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="font-semibold text-sm group-hover:text-primary transition-colors flex items-center gap-1.5">
                  <KanbanSquare className="h-4 w-4" /> Kanban Board
                </span>
                <p className="text-xs text-muted-foreground">
                  Drag and drop task cards
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </CardContent>
          </Card>
        </Link>

        <Link to={`/projects/${projectId}/backlog`}>
          <Card className="hover:border-primary/50 transition-all cursor-pointer group">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="font-semibold text-sm group-hover:text-primary transition-colors flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" /> Backlog & Sprints
                </span>
                <p className="text-xs text-muted-foreground">
                  Sprint planning & estimation
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </CardContent>
          </Card>
        </Link>

        <Link to={`/projects/${projectId}/reports`}>
          <Card className="hover:border-primary/50 transition-all cursor-pointer group">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="font-semibold text-sm group-hover:text-primary transition-colors flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4" /> Reports & Stats
                </span>
                <p className="text-xs text-muted-foreground">
                  Velocity, breakdown & metrics
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </CardContent>
          </Card>
        </Link>

        <Link to={`/projects/${projectId}/members`}>
          <Card className="hover:border-primary/50 transition-all cursor-pointer group">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="font-semibold text-sm group-hover:text-primary transition-colors flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> Team Members
                </span>
                <p className="text-xs text-muted-foreground">
                  Manage access and roles
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Snapshot Metrics */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Total Issues</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{stats.open}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Open Work</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.done}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Resolved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-destructive">{stats.overdue}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Overdue</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
