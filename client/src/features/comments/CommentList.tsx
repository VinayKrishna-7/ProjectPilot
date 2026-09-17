import { useState } from 'react';
import {
  useComments,
  useCreateComment,
  useDeleteComment,
  useUpdateComment,
} from './hooks/useComments';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, formatRelativeTime } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { Trash2, Edit2, Check, X } from 'lucide-react';

interface CommentListProps {
  issueId: string;
}

export function CommentList({ issueId }: CommentListProps) {
  const [content, setContent] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  const currentUser = useAuthStore((s) => s.user);
  const { data, isLoading } = useComments(issueId);
  const createCommentMutation = useCreateComment(issueId);
  const updateCommentMutation = useUpdateComment(issueId);
  const deleteCommentMutation = useDeleteComment(issueId);

  const comments = data?.comments || [];

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    createCommentMutation.mutate(content, {
      onSuccess: () => setContent(''),
    });
  };

  const handleSaveEdit = (commentId: string) => {
    if (!editingContent.trim()) return;
    updateCommentMutation.mutate(
      { commentId, content: editingContent },
      {
        onSuccess: () => {
          setEditingCommentId(null);
          setEditingContent('');
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* New comment input */}
      <form onSubmit={handleAddComment} className="space-y-2">
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={currentUser?.avatar} />
            <AvatarFallback className="text-xs">
              {currentUser ? getInitials(currentUser.name) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={2}
              className="resize-none"
            />
            {content.trim() && (
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setContent('')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createCommentMutation.isPending}
                >
                  {createCommentMutation.isPending ? 'Posting...' : 'Comment'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </form>

      {/* Comment list */}
      <div className="space-y-3 pt-2">
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No comments yet.</p>
        ) : (
          comments.map((comment) => {
            const author = typeof comment.author === 'object' ? comment.author : null;
            const isOwner = currentUser?._id === author?._id;
            const isEditing = editingCommentId === comment._id;

            return (
              <div key={comment._id} className="flex gap-3 text-sm group">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage src={author?.avatar} />
                  <AvatarFallback className="text-xs">
                    {author ? getInitials(author.name) : 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-foreground">
                        {author?.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                    </div>

                    {isOwner && !isEditing && (
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            setEditingCommentId(comment._id);
                            setEditingContent(comment.content);
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() => deleteCommentMutation.mutate(comment._id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2 pt-1">
                      <Textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="h-7 px-2 text-xs gap-1"
                          onClick={() => handleSaveEdit(comment._id)}
                        >
                          <Check className="h-3 w-3" /> Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => setEditingCommentId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                      {comment.content}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
