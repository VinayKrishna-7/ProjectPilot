import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useWorkspace,
  useWorkspaceMembers,
  useInviteWorkspaceMember,
  useRemoveWorkspaceMember,
  useUpdateWorkspace,
} from '@/features/workspace/hooks/useWorkspaces';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { WorkspaceInviteModal } from '@/features/workspace/components/WorkspaceInviteModal';
import { getInitials, formatDate } from '@/lib/utils';
import { UserPlus, Trash2, Building, ShieldCheck, ShieldAlert } from 'lucide-react';
import { WorkspaceRole } from '@taskflow/shared';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

export default function WorkspacePage() {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();

  const { data: wsData, isLoading: isWsLoading } = useWorkspace(workspaceId);
  const workspace = wsData?.workspace;

  const { data: membersData, isLoading: isMembersLoading } = useWorkspaceMembers(workspaceId);
  const members = membersData?.members || [];

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

  const [name, setName] = useState(workspace?.name || '');
  const [description, setDescription] = useState(workspace?.description || '');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const inviteMemberMutation = useInviteWorkspaceMember(workspaceId);
  const removeMemberMutation = useRemoveWorkspaceMember(workspaceId);
  const updateWorkspaceMutation = useUpdateWorkspace(workspaceId);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    inviteMemberMutation.mutate(
      { email: inviteEmail, role: inviteRole },
      {
        onSuccess: () => {
          setInviteEmail('');
          setInviteRole('member');
          setInviteModalOpen(false);
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

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    updateWorkspaceMutation.mutate({
      name: name || workspace?.name,
      description,
    });
  };

  const handleDeleteWorkspace = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/workspaces/${workspaceId}`);
      toast({ title: 'Workspace deleted' });
      navigate('/dashboard');
    } catch (err: any) {
      toast({
        title: 'Failed to delete workspace',
        description: err.response?.data?.error?.message,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  if (isWsLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            <span>{workspace?.name} Settings</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage workspace settings, members, and roles
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/workspaces/${workspaceId}/audit-log`}>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <ShieldAlert className="h-4 w-4 text-primary" />
              Audit Trail
            </Button>
          </Link>
        </div>
      </div>

      {/* Workspace Details Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">General Information</CardTitle>
        </CardHeader>
        <form onSubmit={handleSaveDetails}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="wsName">Workspace Name</Label>
                <Input
                  id="wsName"
                  defaultValue={workspace?.name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wsSlug">Workspace Slug</Label>
                <Input id="wsSlug" value={workspace?.slug} disabled />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wsDesc">Description</Label>
              <Textarea
                id="wsDesc"
                rows={3}
                defaultValue={workspace?.description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateWorkspaceMutation.isPending}>
                {updateWorkspaceMutation.isPending ? 'Saving...' : 'Save Details'}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>

      {/* Members Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Workspace Members</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              People with access to this workspace and its projects
            </p>
          </div>
          <Button
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => setInviteModalOpen(true)}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Invite Member
          </Button>
        </CardHeader>
        <CardContent className="divide-y p-0">
          {isMembersLoading ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Loading members...
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
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-secondary uppercase tracking-wider text-secondary-foreground flex items-center gap-1">
                      {member.role === 'owner' && <ShieldCheck className="h-3 w-3 text-primary" />}
                      {member.role}
                    </span>

                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      Joined {formatDate(member.joinedAt)}
                    </span>

                    {member.role !== 'owner' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => setMemberToRemove(member._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-destructive">
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm text-foreground">
                Delete this workspace
              </p>
              <p className="text-xs text-muted-foreground">
                Only the workspace owner can delete the workspace. This action cannot be undone.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteConfirmOpen(true)}
            >
              Delete Workspace
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invite Member Dialog */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Member to Workspace</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="email">User Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@projectpilot.dev"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role">Role</Label>
              <Select
                value={inviteRole}
                onValueChange={(val) => setInviteRole(val as 'admin' | 'member')}
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
                onClick={() => setInviteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={inviteMemberMutation.isPending}>
                {inviteMemberMutation.isPending ? 'Inviting...' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation */}
      <ConfirmDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
        title="Remove Workspace Member"
        description="Are you sure you want to remove this user from the workspace?"
        confirmLabel="Remove"
        onConfirm={handleRemoveMember}
        isLoading={removeMemberMutation.isPending}
      />

      {/* Delete Workspace Confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Workspace"
        description="Are you sure you want to delete this workspace and all associated projects?"
        confirmLabel="Delete Permanently"
        onConfirm={handleDeleteWorkspace}
        isLoading={isDeleting}
      />
    </div>
  );
}
