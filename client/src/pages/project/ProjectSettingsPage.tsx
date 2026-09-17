import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject, useUpdateProject } from '@/features/project/hooks/useProjects';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
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
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';

export default function ProjectSettingsPage() {
  const { projectId = '' } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const { data: projectData } = useProject(projectId);
  const project = projectData?.project;

  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [status, setStatus] = useState(project?.status || 'active');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const updateMutation = useUpdateProject(projectId);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      name: name || project?.name,
      description,
      status,
    });
  };

  const handleDeleteProject = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/projects/${projectId}`);
      toast({ title: 'Project deleted successfully' });
      navigate('/dashboard');
    } catch (err: any) {
      toast({
        title: 'Failed to delete project',
        description: err.response?.data?.error?.message,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Project Settings
        </h1>
        <p className="text-xs text-muted-foreground">
          Configure project details, status, and preferences
        </p>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">General Details</CardTitle>
        </CardHeader>
        <form onSubmit={handleSaveGeneral}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  defaultValue={project?.name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="key">Project Key</Label>
                <Input id="key" value={project?.key || ''} disabled />
                <p className="text-[11px] text-muted-foreground">
                  The key prefix cannot be changed after creation.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                defaultValue={project?.description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Project Status</Label>
              <Select
                defaultValue={project?.status || 'active'}
                onValueChange={(val) => setStatus(val as any)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4 flex justify-end">
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-destructive">
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm text-foreground">
                Delete this project
              </p>
              <p className="text-xs text-muted-foreground">
                Once deleted, all issues, comments, boards, and sprints will be permanently removed.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteConfirmOpen(true)}
            >
              Delete Project
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Project"
        description="Are you absolutely sure you want to delete this project? This operation cannot be reversed."
        confirmLabel="Delete Permanently"
        onConfirm={handleDeleteProject}
        isLoading={isDeleting}
      />
    </div>
  );
}
