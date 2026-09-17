import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, ArrowRight } from 'lucide-react';
import { IIssue } from '@taskflow/shared';

interface ConflictDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentIssue?: IIssue | null;
  draftChanges?: Partial<IIssue>;
  onReload: () => void;
  onOverwrite?: () => void;
}

export const ConflictDialog: React.FC<ConflictDialogProps> = ({
  isOpen,
  onClose,
  currentIssue,
  draftChanges,
  onReload,
  onOverwrite,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-500 mb-1">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle className="text-foreground text-lg">
              Concurrent Edit Conflict Detected
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Another team member has updated this issue since you opened it. Saving now would overwrite their recent changes.
          </DialogDescription>
        </DialogHeader>

        {currentIssue && (
          <div className="my-3 space-y-3 rounded-lg border bg-muted/30 p-3 text-xs">
            <div className="font-semibold text-foreground">Recent changes on server:</div>
            <div className="grid grid-cols-2 gap-2 text-muted-foreground">
              <div>
                <span className="font-medium text-foreground">Server Status:</span>{' '}
                <span className="capitalize">{currentIssue.status?.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="font-medium text-foreground">Server Priority:</span>{' '}
                <span className="capitalize">{currentIssue.priority}</span>
              </div>
              {currentIssue.assignee && (
                <div className="col-span-2">
                  <span className="font-medium text-foreground">Server Assignee:</span>{' '}
                  {(currentIssue.assignee as any).name || 'Assigned'}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={onClose}>
            Review Manually
          </Button>
          <Button
            variant="default"
            size="sm"
            className="bg-primary hover:bg-primary/90"
            onClick={() => {
              onReload();
              onClose();
            }}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Reload Latest Changes
          </Button>
          {onOverwrite && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                onOverwrite();
                onClose();
              }}
            >
              Overwrite
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
