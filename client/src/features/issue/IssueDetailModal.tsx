import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  useIssue,
  useUpdateIssue,
  useDeleteIssue,
} from './hooks/useIssues';
import { useProjectMembers } from '@/features/project/hooks/useProjects';
import { useSprints } from '@/features/sprint/hooks/useSprints';
import { CommentList } from '@/features/comments/CommentList';
import { ActivityTimeline } from '@/features/activity/ActivityTimeline';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  getInitials,
  getTypeIcon,
  getPriorityBg,
  formatDate,
} from '@/lib/utils';
import { Trash2, Calendar, User, Clock, CheckSquare } from 'lucide-react';
import { IssuePriority, IssueStatus, IssueType } from '@taskflow/shared';

interface IssueDetailModalProps {
  issueId: string | null;
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IssueDetailModal({
  issueId,
  projectId,
  open,
  onOpenChange,
}: IssueDetailModalProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);

  const { data, isLoading } = useIssue(issueId || '');
  const updateIssueMutation = useUpdateIssue(issueId || '');
  const deleteIssueMutation = useDeleteIssue(projectId);
  const { data: membersData } = useProjectMembers(projectId);
  const { data: sprintsData } = useSprints(projectId);

  const issue = data?.issue;
  const members = membersData?.members || [];
  const sprints = sprintsData?.sprints || [];

  const handleUpdate = (field: string, value: any) => {
    if (!issueId) return;
    updateIssueMutation.mutate({ [field]: value });
  };

  const handleSaveTitle = () => {
    if (titleInput.trim() && titleInput !== issue?.title) {
      handleUpdate('title', titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  const handleSaveDescription = () => {
    handleUpdate('description', descriptionInput);
    setIsEditingDesc(false);
  };

  const handleDelete = () => {
    if (!issueId) return;
    deleteIssueMutation.mutate(issueId, {
      onSuccess: () => {
        setDeleteConfirmOpen(false);
        onOpenChange(false);
      },
    });
  };

  const assignee = typeof issue?.assignee === 'object' ? issue.assignee : null;
  const reporter = typeof issue?.reporter === 'object' ? issue.reporter : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          {isLoading || !issue ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading issue details...
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Header bar */}
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground font-semibold">
                  <span>{getTypeIcon(issue.type)}</span>
                  <span>{issue.key}</span>
                </div>
                <div className="flex items-center gap-2 pr-6">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteConfirmOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Main content 2-column grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x flex-1">
                {/* Left Column: Title, Description, Tabs (2 cols wide) */}
                <div className="md:col-span-2 p-6 space-y-6">
                  {/* Title */}
                  <div>
                    {isEditingTitle ? (
                      <Input
                        value={titleInput}
                        onChange={(e) => setTitleInput(e.target.value)}
                        onBlur={handleSaveTitle}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                        autoFocus
                        className="text-lg font-bold"
                      />
                    ) : (
                      <h2
                        onClick={() => {
                          setTitleInput(issue.title);
                          setIsEditingTitle(true);
                        }}
                        className="text-xl font-bold hover:bg-muted/50 p-1.5 -m-1.5 rounded cursor-pointer transition-colors"
                      >
                        {issue.title}
                      </h2>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Description
                    </span>
                    {isEditingDesc ? (
                      <div className="space-y-2">
                        <Textarea
                          value={descriptionInput}
                          onChange={(e) => setDescriptionInput(e.target.value)}
                          rows={4}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveDescription}>
                            Save
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditingDesc(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          setDescriptionInput(issue.description || '');
                          setIsEditingDesc(true);
                        }}
                        className="min-h-[60px] p-2 -m-2 rounded hover:bg-muted/50 cursor-pointer text-sm text-foreground/90 whitespace-pre-wrap transition-colors"
                      >
                        {issue.description || (
                          <span className="text-muted-foreground italic">
                            Add a description...
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Tabs: Comments & Activity */}
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

                {/* Right Sidebar: Attributes (1 col wide) */}
                <div className="p-6 space-y-5 bg-muted/20 text-xs">
                  {/* Status dropdown */}
                  <div className="space-y-1.5">
                    <span className="font-semibold text-muted-foreground">Status</span>
                    <Select
                      value={issue.status}
                      onValueChange={(val) => handleUpdate('status', val)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="review">In Review</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Priority dropdown */}
                  <div className="space-y-1.5">
                    <span className="font-semibold text-muted-foreground">Priority</span>
                    <Select
                      value={issue.priority}
                      onValueChange={(val) => handleUpdate('priority', val)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="highest">🔴 Highest</SelectItem>
                        <SelectItem value="high">🟠 High</SelectItem>
                        <SelectItem value="medium">🟡 Medium</SelectItem>
                        <SelectItem value="low">🔵 Low</SelectItem>
                        <SelectItem value="lowest">⚪ Lowest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Assignee selector */}
                  <div className="space-y-1.5">
                    <span className="font-semibold text-muted-foreground">Assignee</span>
                    <Select
                      value={assignee?._id || 'unassigned'}
                      onValueChange={(val) =>
                        handleUpdate('assignee', val === 'unassigned' ? null : val)
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {members.map((m) => {
                          const u = typeof m.user === 'object' ? m.user : null;
                          if (!u) return null;
                          return (
                            <SelectItem key={u._id} value={u._id}>
                              {u.name}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sprint selector */}
                  <div className="space-y-1.5">
                    <span className="font-semibold text-muted-foreground">Sprint</span>
                    <Select
                      value={
                        typeof issue.sprint === 'object' && issue.sprint
                          ? issue.sprint._id
                          : 'backlog'
                      }
                      onValueChange={(val) =>
                        handleUpdate('sprint', val === 'backlog' ? null : val)
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="backlog">Backlog</SelectItem>
                        {sprints.map((s) => (
                          <SelectItem key={s._id} value={s._id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Story Points */}
                  <div className="space-y-1.5">
                    <span className="font-semibold text-muted-foreground">Story Points</span>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      className="h-8"
                      defaultValue={issue.storyPoints ?? ''}
                      onBlur={(e) =>
                        handleUpdate(
                          'storyPoints',
                          e.target.value ? parseInt(e.target.value, 10) : null
                        )
                      }
                    />
                  </div>

                  {/* Due Date */}
                  <div className="space-y-1.5">
                    <span className="font-semibold text-muted-foreground">Due Date</span>
                    <Input
                      type="date"
                      className="h-8"
                      defaultValue={
                        issue.dueDate ? issue.dueDate.split('T')[0] : ''
                      }
                      onChange={(e) =>
                        handleUpdate('dueDate', e.target.value || null)
                      }
                    />
                  </div>

                  {/* Reporter info */}
                  <div className="pt-2 border-t text-[11px] text-muted-foreground space-y-1">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3 w-3" />
                      <span>Reported by: </span>
                      <span className="font-medium text-foreground">
                        {reporter?.name || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      <span>Created {formatDate(issue.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Issue"
        description="Are you sure you want to delete this issue? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        isLoading={deleteIssueMutation.isPending}
      />
    </>
  );
}
