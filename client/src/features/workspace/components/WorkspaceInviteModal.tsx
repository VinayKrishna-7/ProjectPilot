import React, { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import {
  useWorkspaceInvitations,
  useCreateInvitation,
  useRevokeInvitation,
} from '../hooks/useInvitations';
import { UserPlus, Copy, Check, Mail, Trash2 } from 'lucide-react';
import { WorkspaceRole } from '@taskflow/shared';

interface WorkspaceInviteModalProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const WorkspaceInviteModal: React.FC<WorkspaceInviteModalProps> = ({
  workspaceId,
  isOpen,
  onClose,
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<WorkspaceRole>('member');
  const [copiedLink, setCopiedLink] = useState(false);
  const [lastGeneratedUrl, setLastGeneratedUrl] = useState<string | null>(null);

  const { data: invitations, isLoading } = useWorkspaceInvitations(workspaceId);
  const inviteMutation = useCreateInvitation(workspaceId);
  const revokeMutation = useRevokeInvitation(workspaceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      const res = await inviteMutation.mutateAsync({ email: email.trim(), role });
      if (res?.token) {
        const fullUrl = `${window.location.origin}/invitations/accept?token=${res.token}`;
        setLastGeneratedUrl(fullUrl);
      }
      setEmail('');
    } catch {}
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Invite Members to Workspace
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email" className="text-xs">Email Address</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              required
              className="text-xs h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="invite-role" className="text-xs">Role</Label>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value as WorkspaceRole)}
              className="w-full text-xs h-9 rounded-md border border-input bg-background px-3 py-1 text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="member">Member — Can view and edit projects & issues</option>
              <option value="admin">Admin — Can manage members, settings & projects</option>
            </select>
          </div>

          <Button type="submit" size="sm" className="w-full" disabled={inviteMutation.isPending}>
            <Mail className="h-3.5 w-3.5 mr-1.5" />
            {inviteMutation.isPending ? 'Sending Invitation...' : 'Send Invitation'}
          </Button>
        </form>

        {/* Link preview card if just created */}
        {lastGeneratedUrl && (
          <div className="rounded-lg border bg-muted/40 p-3 text-xs space-y-2">
            <div className="font-semibold text-foreground flex items-center justify-between">
              <span>Invitation Link Ready</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs gap-1 text-primary"
                onClick={() => copyToClipboard(lastGeneratedUrl)}
              >
                {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedLink ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <div className="font-mono text-[11px] break-all text-muted-foreground bg-background p-2 rounded border">
              {lastGeneratedUrl}
            </div>
          </div>
        )}

        {/* Pending Invitations list */}
        <div className="pt-2 border-t space-y-2">
          <div className="text-xs font-semibold text-muted-foreground">Pending Invitations</div>
          <div className="max-h-36 overflow-y-auto divide-y divide-border rounded border">
            {isLoading && <div className="p-3 text-xs text-muted-foreground">Loading invitations...</div>}
            {!isLoading && (!invitations || invitations.length === 0) && (
              <div className="p-3 text-xs text-center text-muted-foreground">
                No pending invitations.
              </div>
            )}
            {invitations?.map((inv: any) => (
              <div key={inv._id} className="flex items-center justify-between p-2.5 text-xs">
                <div>
                  <div className="font-medium text-foreground">{inv.email}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant="outline" className="text-[10px] h-4 capitalize">
                      {inv.role}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      Expires {new Date(inv.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => revokeMutation.mutate(inv._id)}
                  title="Revoke invitation"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
