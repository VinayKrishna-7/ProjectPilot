import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  useProjectMembers,
  useAddProjectMember,
  useRemoveProjectMember,
} from '@/features/project/hooks/useProjects';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { getInitials, formatDate } from '@/lib/utils';
import { UserPlus, Trash2 } from 'lucide-react';
import { ProjectRole } from '@taskflow/shared';

export default function ProjectMembersPage() {
  const { projectId = '' } = useParams<{ projectId: string }>();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ProjectRole>('member');
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

  const { data: membersData, isLoading } = useProjectMembers(projectId);
  const members = membersData?.members || [];

  const addMemberMutation = useAddProjectMember(projectId);
  const removeMemberMutation = useRemoveProjectMember(projectId);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    addMemberMutation.mutate(
      { email, role },
      {
        onSuccess: () => {
          setEmail('');
          setRole('member');
          setAddModalOpen(false);
        },
      }
    );
  };

  const handleRemoveMember = () => {
    if (!memberToRemove) return;
    removeMemberMutation.mutate(memberToRemove, {
      onSuccess: () => setMemberToRemove(null),
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Project Members
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage contributors, developers, and administrators for this project
          </p>
        </div>

        <Button
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => setAddModalOpen(true)}
        >
          <UserPlus className="h-3.5 w-3.5" />
          Add Member
        </Button>
      </div>

      <div className="bg-card rounded-xl border shadow-sm divide-y overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            Loading project members...
          </div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No project members found.
          </div>
        ) : (
          members.map((member) => {
            const u = typeof member.user === 'object' ? member.user : null;
            if (!u) return null;

            return (
              <div
                key={member._id}
                className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={u.avatar} />
                    <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {u.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary uppercase tracking-wider text-secondary-foreground">
                    {member.role}
                  </span>

                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    Joined {formatDate(member.joinedAt)}
                  </span>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => setMemberToRemove(member._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Member Dialog */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Project Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddMember} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="email">User Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@projectpilot.dev"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role">Role</Label>
              <Select
                value={role}
                onValueChange={(val) => setRole(val as ProjectRole)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addMemberMutation.isPending}>
                {addMemberMutation.isPending ? 'Adding...' : 'Add to Project'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation */}
      <ConfirmDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
        title="Remove Member"
        description="Are you sure you want to remove this member from the project?"
        confirmLabel="Remove"
        onConfirm={handleRemoveMember}
        isLoading={removeMemberMutation.isPending}
      />
    </div>
  );
}
