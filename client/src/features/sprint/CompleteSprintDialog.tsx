import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCompleteSprint, useSprints } from './hooks/useSprints';
import { ISprint } from '@taskflow/shared';

interface CompleteSprintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sprint: ISprint;
  projectId: string;
}

export function CompleteSprintDialog({
  open,
  onOpenChange,
  sprint,
  projectId,
}: CompleteSprintDialogProps) {
  const [action, setAction] = useState<'backlog' | 'next_sprint'>('backlog');
  const [targetSprintId, setTargetSprintId] = useState<string>('');

  const { data: sprintsData } = useSprints(projectId);
  const plannedSprints = (sprintsData?.sprints || []).filter(
    (s) => s.status === 'planned' && s._id !== sprint._id
  );

  const completeSprintMutation = useCompleteSprint(projectId);

  const handleComplete = () => {
    completeSprintMutation.mutate(
      {
        sprintId: sprint._id,
        incompleteIssueAction: action,
        targetSprintId: action === 'next_sprint' ? targetSprintId : undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Complete {sprint.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2 text-sm">
          <p className="text-muted-foreground">
            Completing this sprint will close all completed tasks and move any
            unfinished work according to your selection below.
          </p>

          <div className="space-y-2">
            <Label>Move incomplete issues to:</Label>
            <Select
              value={action === 'next_sprint' ? targetSprintId : 'backlog'}
              onValueChange={(val) => {
                if (val === 'backlog') {
                  setAction('backlog');
                  setTargetSprintId('');
                } else {
                  setAction('next_sprint');
                  setTargetSprintId(val);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="backlog">Backlog</SelectItem>
                {plannedSprints.map((s) => (
                  <SelectItem key={s._id} value={s._id}>
                    {s.name} (Planned)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleComplete}
            disabled={completeSprintMutation.isPending}
          >
            {completeSprintMutation.isPending
              ? 'Completing...'
              : 'Complete Sprint'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
