import mongoose from 'mongoose';
import { Comment, ICommentDocument } from '../models/Comment';
import { Activity } from '../models/Activity';
import { Issue } from '../models/Issue';
import { AppError } from '../utils/AppError';
import { emitToIssue } from '../sockets';

export class CommentService {
  async getComments(issueId: string): Promise<ICommentDocument[]> {
    return Comment.find({ issue: issueId })
      .populate('author', 'name email avatar')
      .sort({ createdAt: 1 });
  }

  async createComment(
    issueId: string,
    authorId: mongoose.Types.ObjectId,
    content: string
  ): Promise<ICommentDocument> {
    const issue = await Issue.findById(issueId);
    if (!issue) throw new AppError('Issue not found', 404, 'ISSUE_NOT_FOUND');

    const comment = await Comment.create({ issue: issueId, author: authorId, content });
    await comment.populate('author', 'name email avatar');

    await Activity.create({
      project: issue.project,
      issue: issueId,
      actor: authorId,
      type: 'comment_created',
      metadata: { commentId: comment._id.toString() },
    });

    emitToIssue(issueId, 'comment_created', comment);
    return comment;
  }

  async updateComment(
    commentId: string,
    authorId: mongoose.Types.ObjectId,
    content: string
  ): Promise<ICommentDocument> {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
    if (comment.author.toString() !== authorId.toString()) {
      throw new AppError('You can only edit your own comments', 403, 'FORBIDDEN');
    }
    comment.content = content;
    await comment.save();
    await comment.populate('author', 'name email avatar');
    emitToIssue(comment.issue.toString(), 'comment_updated', comment);
    return comment;
  }

  async deleteComment(
    commentId: string,
    authorId: mongoose.Types.ObjectId
  ): Promise<void> {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
    if (comment.author.toString() !== authorId.toString()) {
      throw new AppError('You can only delete your own comments', 403, 'FORBIDDEN');
    }
    await Comment.findByIdAndDelete(commentId);
    emitToIssue(comment.issue.toString(), 'comment_deleted', { commentId });
  }
}

export const commentService = new CommentService();
