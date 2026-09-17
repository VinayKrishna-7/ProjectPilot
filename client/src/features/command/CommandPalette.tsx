import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useUIStore } from '@/stores/uiStore';
import { LayoutDashboard, Settings, Search } from 'lucide-react';

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const navigate = useNavigate();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if (e.key === 'Escape') setCommandPaletteOpen(false);
    },
    [setCommandPaletteOpen]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const runCommand = (fn: () => void) => {
    fn();
    setCommandPaletteOpen(false);
  };

  return (
    <Dialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <DialogContent className="p-0 overflow-hidden max-w-lg">
        <Command className="rounded-lg border shadow-md">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              placeholder="Type a command or navigate..."
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>
            <Command.Group heading="Navigation">
              <CommandItem
                onSelect={() => runCommand(() => navigate('/dashboard'))}
                icon={<LayoutDashboard className="h-4 w-4" />}
                label="Go to Dashboard"
              />
              <CommandItem
                onSelect={() => runCommand(() => navigate('/profile'))}
                icon={<Settings className="h-4 w-4" />}
                label="Go to Profile"
              />
              <CommandItem
                onSelect={() => runCommand(() => navigate('/settings'))}
                icon={<Settings className="h-4 w-4" />}
                label="Go to Settings"
              />
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function CommandItem({
  onSelect,
  icon,
  label,
}: {
  onSelect: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 gap-2"
    >
      <span className="h-4 w-4 text-muted-foreground">{icon}</span>
      {label}
    </Command.Item>
  );
}
