import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateIssue } from './hooks/useIssues';
import { useProjectMembers } from '@/features/project/hooks/useProjects';
import { useSprints } from '@/features/sprint/hooks/useSprints';
import { useLabels } from '@/features/label/hooks/useLabels';

const createIssueFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().optional(),
  type: z.enum(['task', 'bug', 'story', 'epic']).default('task'),
  priority: z.enum(['lowest', 'low', 'medium', 'high', 'highest']).default('medium'),
  assignee: z.string().optional(),
  sprint: z.string().optional(),
  boardColumn: z.string().optional(),
  storyPoints: z.coerce.number().min(0).max(100).optional(),
  dueDate: z.string().optional(),
  labels: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof createIssueFormSchema>;

interface CreateIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  defaultColumnId?: string;
  defaultSprintId?: string;
}

export function CreateIssueDialog({
  open,
  onOpenChange,
  projectId,
  defaultColumnId,
  defaultSprintId,
}: CreateIssueDialogProps) {
  const { mutate: createIssue, isPending } = useCreateIssue(projectId);
  const { data: membersData } = useProjectMembers(projectId);
  const { data: sprintsData } = useSprints(projectId);
  const { data: labelsData } = useLabels(projectId);

  const members = membersData?.members || [];
  const sprints = sprintsData?.sprints || [];
  const labels = labelsData?.labels || [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createIssueFormSchema),
    defaultValues: {
      type: 'task',
      priority: 'medium',
      boardColumn: defaultColumnId,
      sprint: defaultSprintId,
      labels: [],
    },
  });

  const onSubmit = (data: FormValues) => {
    createIssue(
      {
        ...data,
        boardColumn: defaultColumnId || data.boardColumn,
        sprint: defaultSprintId || data.sprint,
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Issue</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Issue Type & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Issue Type</Label>
              <Select
                defaultValue="task"
                onValueChange={(val) => setValue('type', val as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="task">✓ Task</SelectItem>
                  <SelectItem value="bug">🐛 Bug</SelectItem>
                  <SelectItem value="story">📖 Story</SelectItem>
                  <SelectItem value="epic">⚡ Epic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                defaultValue="medium"
                onValueChange={(val) => setValue('priority', val as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
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
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">
              Summary <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="What needs to be done?"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add details, acceptance criteria, steps to reproduce..."
              rows={4}
              {...register('description')}
            />
          </div>

          {/* Assignee & Sprint */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Assignee</Label>
              <Select onValueChange={(val) => setValue('assignee', val === 'unassigned' ? undefined : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
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

            <div className="space-y-1.5">
              <Label>Sprint</Label>
              <Select
                defaultValue={defaultSprintId || 'backlog'}
                onValueChange={(val) => setValue('sprint', val === 'backlog' ? undefined : val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Backlog" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  {sprints.map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.name} {s.status === 'active' ? '(Active)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Story Points & Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="storyPoints">Story Points</Label>
              <Input
                id="storyPoints"
                type="number"
                min="0"
                max="100"
                placeholder="e.g. 3, 5, 8"
                {...register('storyPoints')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input id="dueDate" type="date" {...register('dueDate')} />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Issue'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
