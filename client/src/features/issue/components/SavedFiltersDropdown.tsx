import React, { useState } from 'react';
import { Bookmark, Plus, Trash2, Check, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  useSavedFilters,
  useCreateSavedFilter,
  useDeleteSavedFilter,
} from '../hooks/useSavedFilters';
import { ISavedFilter } from '@taskflow/shared';

interface SavedFiltersDropdownProps {
  projectId: string;
  currentFilters?: Record<string, any>;
  onApplyFilter: (filter: ISavedFilter) => void;
}

export const SavedFiltersDropdown: React.FC<SavedFiltersDropdownProps> = ({
  projectId,
  currentFilters,
  onApplyFilter,
}) => {
  const { data: filters, isLoading } = useSavedFilters(projectId);
  const createMutation = useCreateSavedFilter(projectId);
  const deleteMutation = useDeleteSavedFilter(projectId);

  const [isOpen, setIsOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filterName.trim()) return;

    await createMutation.mutateAsync({
      name: filterName.trim(),
      filterConfig: currentFilters || {},
      isShared,
    });

    setFilterName('');
    setIsShared(false);
    setSaveModalOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bookmark className="h-3.5 w-3.5" />
        Views
        {filters && filters.length > 0 && (
          <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.2 text-[10px] font-semibold text-primary">
            {filters.length}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute left-0 mt-1 w-64 rounded-md border bg-popover text-popover-foreground shadow-lg z-50 p-1">
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center justify-between border-b">
            <span>Saved Views</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1 text-[11px] text-primary"
              onClick={() => {
                setIsOpen(false);
                setSaveModalOpen(true);
              }}
            >
              <Plus className="h-3 w-3 mr-0.5" /> Save Current
            </Button>
          </div>

          <div className="max-h-56 overflow-y-auto py-1">
            {isLoading && <div className="p-2 text-xs text-muted-foreground">Loading views...</div>}
            {!isLoading && (!filters || filters.length === 0) && (
              <div className="p-3 text-xs text-center text-muted-foreground">
                No saved views yet. Customize filters and click "Save Current".
              </div>
            )}
            {filters?.map((filter: ISavedFilter) => (
              <div
                key={filter._id}
                className="group flex items-center justify-between px-2 py-1.5 text-xs rounded hover:bg-accent cursor-pointer transition-colors"
                onClick={() => {
                  setActiveFilterId(filter._id);
                  onApplyFilter(filter);
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center gap-1.5 truncate">
                  {activeFilterId === filter._id && (
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                  )}
                  <span className="truncate font-medium">{filter.name}</span>
                  {filter.isShared && (
                    <span title="Shared with team">
                      <Share2 className="h-3 w-3 text-muted-foreground shrink-0" />
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMutation.mutate(filter._id);
                  }}
                  title="Delete view"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save View Modal */}
      <Dialog open={saveModalOpen} onOpenChange={setSaveModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Save Current View</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="view-name" className="text-xs">View Name</Label>
              <Input
                id="view-name"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="e.g. My Urgent Bugs, Frontend In Progress"
                required
                className="text-xs h-9"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="share-view"
                checked={isShared}
                onChange={(e) => setIsShared(e.target.checked)}
                className="rounded border-input text-primary focus:ring-primary h-4 w-4"
              />
              <Label htmlFor="share-view" className="text-xs font-normal cursor-pointer">
                Share this view with all project members
              </Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSaveModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving...' : 'Save View'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
