import { Link, useLocation, useParams } from 'react-router-dom';
import {
  LayoutDashboard,
  KanbanSquare,
  BookOpen,
  Zap,
  BarChart3,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUIStore } from '@/stores/uiStore';
import { useWorkspaces } from '@/features/workspace/hooks/useWorkspaces';
import { useProjects } from '@/features/project/hooks/useProjects';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

const projectNavItems = [
  { label: 'Overview', icon: LayoutDashboard, suffix: 'overview' },
  { label: 'Board', icon: KanbanSquare, suffix: 'board' },
  { label: 'Backlog', icon: BookOpen, suffix: 'backlog' },
  { label: 'Sprints', icon: Zap, suffix: 'sprints' },
  { label: 'Reports', icon: BarChart3, suffix: 'reports' },
  { label: 'Members', icon: Users, suffix: 'members' },
  { label: 'Settings', icon: Settings, suffix: 'settings' },
];

export function AppSidebar() {
  const location = useLocation();
  const { projectId } = useParams();
  const { sidebarCollapsed, setSidebarCollapsed, activeWorkspaceId } = useUIStore();
  const { data: workspacesData } = useWorkspaces();
  const workspaces = workspacesData?.workspaces || [];
  const currentWorkspace = workspaces.find((w) => w._id === activeWorkspaceId) || workspaces[0];
  const currentWorkspaceId = currentWorkspace?._id;
  const { data: projectsData } = useProjects(currentWorkspaceId || '');
  const projects = projectsData?.projects || [];

  const collapsed = sidebarCollapsed;

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-card transition-all duration-200 shrink-0',
        collapsed ? 'w-14' : 'w-60'
      )}
    >
      <div className={cn('flex items-center h-14 border-b px-3', collapsed ? 'justify-center' : 'justify-between')}>
        {!collapsed && (
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">PP</span>
            </div>
            <span className="font-semibold text-sm">ProjectPilot</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => setSidebarCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-0.5">
          <SidebarItem
            href="/dashboard"
            icon={<LayoutDashboard className="h-4 w-4" />}
            label="Dashboard"
            collapsed={collapsed}
            active={location.pathname === '/dashboard'}
          />

          {!collapsed && workspaces.length > 0 && (
            <div className="pt-4 pb-1 px-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Workspaces
              </span>
            </div>
          )}
          {workspaces.map((ws) => (
            <SidebarItem
              key={ws._id}
              href={`/workspaces/${ws._id}`}
              icon={
                <Avatar className="h-4 w-4">
                  <AvatarFallback className="text-[8px]">
                    {getInitials(ws.name)}
                  </AvatarFallback>
                </Avatar>
              }
              label={ws.name}
              collapsed={collapsed}
              active={location.pathname === `/workspaces/${ws._id}`}
            />
          ))}

          {projectId && (
            <>
              {!collapsed && (
                <div className="pt-4 pb-1 px-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Project
                  </span>
                </div>
              )}
              {projectNavItems.map((item) => (
                <SidebarItem
                  key={item.suffix}
                  href={`/projects/${projectId}/${item.suffix}`}
                  icon={<item.icon className="h-4 w-4" />}
                  label={item.label}
                  collapsed={collapsed}
                  active={location.pathname === `/projects/${projectId}/${item.suffix}`}
                />
              ))}
            </>
          )}

          {!collapsed && projects.length > 0 && !projectId && (
            <>
              <div className="pt-4 pb-1 px-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Projects
                </span>
              </div>
              {projects.slice(0, 5).map((project) => (
                <SidebarItem
                  key={project._id}
                  href={`/projects/${project._id}/board`}
                  icon={<FolderOpen className="h-4 w-4" />}
                  label={project.name}
                  collapsed={collapsed}
                  active={location.pathname.startsWith(`/projects/${project._id}`)}
                />
              ))}
            </>
          )}
        </nav>
      </ScrollArea>
    </aside>
  );
}

function SidebarItem({
  href,
  icon,
  label,
  collapsed,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  active: boolean;
}) {
  return (
    <Link to={href}>
      <div
        className={cn(
          'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors cursor-pointer',
          active
            ? 'bg-accent text-accent-foreground font-medium'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          collapsed && 'justify-center px-0'
        )}
        title={collapsed ? label : undefined}
      >
        {icon}
        {!collapsed && <span className="truncate">{label}</span>}
      </div>
    </Link>
  );
}
