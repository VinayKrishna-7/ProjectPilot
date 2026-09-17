import { useState, useEffect } from 'react';
import { useFilterStore } from '@/stores/filterStore';
import { useProjectMembers } from '@/features/project/hooks/useProjects';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { SavedFiltersDropdown } from './components/SavedFiltersDropdown';

interface IssueFilterBarProps {
  projectId: string;
}

export function IssueFilterBar({ projectId }: IssueFilterBarProps) {
  const { filters, setFilter, setFilters, clearFilters, hasActiveFilters } = useFilterStore();
  const { data: membersData } = useProjectMembers(projectId);
  const members = membersData?.members || [];

  const [searchInput, setSearchInput] = useState(filters.search || '');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilter('search', searchInput || undefined);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, setFilter]);

  return (
    <div className="flex flex-wrap items-center gap-2.5 py-2">
      {/* Search Input */}
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter by keyword..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-8 h-9 text-xs"
        />
        {searchInput && (
          <button
            onClick={() => setSearchInput('')}
            className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Assignee Filter */}
      <Select
        value={filters.assignee || 'all'}
        onValueChange={(val) => setFilter('assignee', val === 'all' ? undefined : val)}
      >
        <SelectTrigger className="h-9 w-36 text-xs">
          <SelectValue placeholder="Assignee" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Assignees</SelectItem>
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

      {/* Status Filter */}
      <Select
        value={filters.status || 'all'}
        onValueChange={(val) => setFilter('status', val === 'all' ? undefined : val)}
      >
        <SelectTrigger className="h-9 w-32 text-xs">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="todo">To Do</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="review">In Review</SelectItem>
          <SelectItem value="done">Done</SelectItem>
        </SelectContent>
      </Select>

      {/* Priority Filter */}
      <Select
        value={filters.priority || 'all'}
        onValueChange={(val) => setFilter('priority', val === 'all' ? undefined : val)}
      >
        <SelectTrigger className="h-9 w-32 text-xs">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          <SelectItem value="highest">🔴 Highest</SelectItem>
          <SelectItem value="high">🟠 High</SelectItem>
          <SelectItem value="medium">🟡 Medium</SelectItem>
          <SelectItem value="low">🔵 Low</SelectItem>
          <SelectItem value="lowest">⚪ Lowest</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear Filters button */}
      {hasActiveFilters() && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearchInput('');
            clearFilters();
          }}
          className="h-9 text-xs text-muted-foreground hover:text-foreground gap-1"
        >
          <X className="h-3.5 w-3.5" />
          Clear filters
        </Button>
      )}

      {/* Saved Views Dropdown */}
      <div className="ml-auto">
        <SavedFiltersDropdown
          projectId={projectId}
          currentFilters={filters}
          onApplyFilter={(saved) => {
            if (saved.filterConfig) {
              const cfg = saved.filterConfig;
              setFilters({
                status: Array.isArray(cfg.status) ? cfg.status[0] : (cfg.status as unknown as string | undefined),
                priority: Array.isArray(cfg.priority) ? cfg.priority[0] : (cfg.priority as unknown as string | undefined),
                type: Array.isArray(cfg.type) ? cfg.type[0] : (cfg.type as unknown as string | undefined),
                assignee: Array.isArray(cfg.assignee) ? cfg.assignee[0] : (cfg.assignee as unknown as string | undefined),
                search: cfg.search,
              });
            }
          }}
        />
      </div>
    </div>
  );
}
