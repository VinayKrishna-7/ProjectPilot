import mongoose from 'mongoose';
import { Issue, IIssueDocument } from '../models/Issue';
import { Activity } from '../models/Activity';
import { Notification } from '../models/Notification';
import { AppError } from '../utils/AppError';
import { emitToProject, emitToIssue } from '../sockets';
import { CreateIssueInput, UpdateIssueInput, MoveIssueInput } from '../validators/issue.validator';
import { projectService } from './project.service';

interface IssueFilter {
  status?: string;
  priority?: string;
  type?: string;
  assignee?: string;
  reporter?: string;
  sprint?: string;
  label?: string;
  search?: string;
  boardColumn?: string;
  backlog?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export class IssueService {
  async createIssue(
    projectId: string,
    reporterId: mongoose.Types.ObjectId,
    input: CreateIssueInput
  ): Promise<IIssueDocument> {
    const key = await projectService.generateIssueKey(projectId);

    // Get the max position in the target column or backlog
    const lastIssue = await Issue.findOne({
      project: projectId,
      boardColumn: input.boardColumn || null,
    }).sort({ position: -1 });
    const position = lastIssue ? lastIssue.position + 1000 : 1000;

    const issue = await Issue.create({
      ...input,
      project: projectId,
      key,
      reporter: reporterId,
      position,
      assignee: input.assignee || null,
      sprint: input.sprint || null,
      boardColumn: input.boardColumn || null,
      parentIssue: input.parentIssue || null,
    });

    await issue.populate([
      { path: 'reporter', select: 'name email avatar' },
      { path: 'assignee', select: 'name email avatar' },
      { path: 'labels', select: 'name color' },
    ]);

    // Log activity
    await Activity.create({
      project: projectId,
      issue: issue._id,
      actor: reporterId,
      type: 'issue_created',
      metadata: { key, title: input.title },
    });

    // Notify assignee
    if (input.assignee && input.assignee !== reporterId.toString()) {
      await Notification.create({
        recipient: input.assignee,
        actor: reporterId,
        type: 'issue_assigned',
        message: `You were assigned to ${key}: ${input.title}`,
        entityType: 'issue',
        entityId: issue._id.toString(),
      });
    }

    emitToProject(projectId, 'issue_created', issue);
    return issue;
  }

  async getIssues(
    projectId: string,
    filter: IssueFilter
  ): Promise<{ issues: IIssueDocument[]; total: number; page: number; totalPages: number }> {
    const query: mongoose.FilterQuery<IIssueDocument> = { project: projectId };

    if (filter.status) query.status = { $in: filter.status.split(',') };
    if (filter.priority) query.priority = { $in: filter.priority.split(',') };
    if (filter.type) query.type = { $in: filter.type.split(',') };
    if (filter.assignee === 'unassigned') {
      query.assignee = null;
    } else if (filter.assignee) {
      query.assignee = filter.assignee;
    }
    if (filter.reporter) query.reporter = filter.reporter;
    if (filter.sprint === 'backlog') {
      query.sprint = null;
    } else if (filter.sprint) {
      query.sprint = filter.sprint;
    }
    if (filter.label) query.labels = { $in: filter.label.split(',') };
    if (filter.boardColumn) query.boardColumn = filter.boardColumn;
    if (filter.backlog === 'true') query.sprint = null;

    if (filter.search) {
      query.$or = [
        { $text: { $search: filter.search } },
        { key: { $regex: filter.search, $options: 'i' } },
        { title: { $regex: filter.search, $options: 'i' } },
      ];
    }

    const page = filter.page || 1;
    const limit = Math.min(filter.limit || 50, 100);
    const skip = (page - 1) * limit;
    const sortField = filter.sort || 'position';
    const sortOrder = filter.order === 'desc' ? -1 : 1;

    const [issues, total] = await Promise.all([
      Issue.find(query)
        .populate('assignee', 'name email avatar')
        .populate('reporter', 'name email avatar')
        .populate('labels', 'name color')
        .populate('sprint', 'name status')
        .populate('boardColumn', 'name status color')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),
      Issue.countDocuments(query),
    ]);

    return { issues, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getIssueById(issueId: string): Promise<IIssueDocument> {
    const issue = await Issue.findById(issueId)
      .populate('reporter', 'name email avatar')
      .populate('assignee', 'name email avatar')
      .populate('labels', 'name color')
      .populate('sprint', 'name status startDate endDate')
      .populate('boardColumn', 'name status color')
      .populate('parentIssue', 'key title')
      .populate('attachments');
    if (!issue) throw new AppError('Issue not found', 404, 'ISSUE_NOT_FOUND');
    return issue;
  }

  async updateIssue(
    issueId: string,
    actorId: mongoose.Types.ObjectId,
    input: UpdateIssueInput
  ): Promise<IIssueDocument> {
    const existing = await Issue.findById(issueId);
    if (!existing) throw new AppError('Issue not found', 404, 'ISSUE_NOT_FOUND');

    // Track changes for activity
    const activities: Array<{ type: string; metadata: Record<string, unknown> }> = [];

    if (input.status && input.status !== existing.status) {
      activities.push({
        type: 'status_changed',
        metadata: { from: existing.status, to: input.status },
      });
    }
    if (input.priority && input.priority !== existing.priority) {
      activities.push({
        type: 'priority_changed',
        metadata: { from: existing.priority, to: input.priority },
      });
    }
    if ('assignee' in input && input.assignee !== existing.assignee?.toString()) {
      activities.push({
        type: 'assignee_changed',
        metadata: {
          from: existing.assignee?.toString() || null,
          to: input.assignee || null,
        },
      });
      // Notify new assignee
      if (input.assignee && input.assignee !== actorId.toString()) {
        await Notification.create({
          recipient: input.assignee,
          actor: actorId,
          type: 'issue_assigned',
          message: `You were assigned to ${existing.key}: ${existing.title}`,
          entityType: 'issue',
          entityId: issueId,
        });
      }
    }
    if ('sprint' in input && String(input.sprint || '') !== String(existing.sprint || '')) {
      activities.push({
        type: 'sprint_changed',
        metadata: { from: existing.sprint?.toString() || null, to: input.sprint || null },
      });
    }

    const { version, ...cleanInput } = input;
    if (version !== undefined && existing.version !== undefined && existing.version !== version) {
      throw new AppError(
        'This issue was modified by another user. Please reload the latest changes.',
        409,
        'CONFLICT',
        { currentVersion: existing.version, clientVersion: version, currentIssue: existing }
      );
    }

    const query: mongoose.FilterQuery<IIssueDocument> = { _id: issueId };
    if (version !== undefined) {
      query.version = version;
    }

    const updated = await Issue.findOneAndUpdate(
      query,
      { $set: cleanInput, $inc: { version: 1 } },
      { new: true, runValidators: true }
    )
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .populate('labels', 'name color')
      .populate('sprint', 'name status')
      .populate('boardColumn', 'name status color');

    if (!updated) {
      const current = await Issue.findById(issueId);
      if (current) {
        throw new AppError(
          'This issue was modified by another user. Please reload the latest changes.',
          409,
          'CONFLICT',
          { currentVersion: current.version, clientVersion: version, currentIssue: current }
        );
      }
      throw new AppError('Issue not found', 404, 'ISSUE_NOT_FOUND');
    }

    // Bulk create activities
    if (activities.length > 0) {
      await Activity.insertMany(
        activities.map((a) => ({
          project: existing.project,
          issue: issueId,
          actor: actorId,
          type: a.type,
          metadata: a.metadata,
        }))
      );
    }

    emitToProject(existing.project.toString(), 'issue_updated', updated);
    emitToIssue(issueId, 'issue_updated', updated);
    return updated;
  }

  async moveIssue(
    issueId: string,
    actorId: mongoose.Types.ObjectId,
    input: MoveIssueInput
  ): Promise<IIssueDocument> {
    const existing = await Issue.findById(issueId);
    if (!existing) throw new AppError('Issue not found', 404, 'ISSUE_NOT_FOUND');

    const { version, ...moveFields } = input;
    if (version !== undefined && existing.version !== undefined && existing.version !== version) {
      throw new AppError(
        'This issue was modified by another user. Please reload the latest changes.',
        409,
        'CONFLICT',
        { currentVersion: existing.version, clientVersion: version, currentIssue: existing }
      );
    }

    const updateData: Partial<{ boardColumn: string; position: number; status: string }> = {
      boardColumn: moveFields.boardColumn,
      position: moveFields.position,
    };
    if (moveFields.status) updateData.status = moveFields.status;

    const moveQuery: mongoose.FilterQuery<IIssueDocument> = { _id: issueId };
    if (version !== undefined) {
      moveQuery.version = version;
    }

    const updated = await Issue.findOneAndUpdate(
      moveQuery,
      { $set: updateData, $inc: { version: 1 } },
      { new: true }
    )
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .populate('labels', 'name color')
      .populate('boardColumn', 'name status color');

    if (!updated) {
      const current = await Issue.findById(issueId);
      if (current) {
        throw new AppError(
          'This issue was modified by another user. Please reload the latest changes.',
          409,
          'CONFLICT',
          { currentVersion: current.version, clientVersion: version, currentIssue: current }
        );
      }
      throw new AppError('Issue not found', 404, 'ISSUE_NOT_FOUND');
    }

    if (input.status && input.status !== existing.status) {
      await Activity.create({
        project: existing.project,
        issue: issueId,
        actor: actorId,
        type: 'status_changed',
        metadata: { from: existing.status, to: input.status },
      });
    }

    emitToProject(existing.project.toString(), 'issue_moved', {
      issueId,
      boardColumn: input.boardColumn,
      position: input.position,
      status: input.status,
    });
    return updated;
  }

  async deleteIssue(
    issueId: string,
    actorId: mongoose.Types.ObjectId
  ): Promise<void> {
    const issue = await Issue.findById(issueId);
    if (!issue) throw new AppError('Issue not found', 404, 'ISSUE_NOT_FOUND');
    await Issue.findByIdAndDelete(issueId);
    await Activity.create({
      project: issue.project,
      issue: issueId,
      actor: actorId,
      type: 'issue_deleted',
      metadata: { key: issue.key, title: issue.title },
    });
    emitToProject(issue.project.toString(), 'issue_deleted', { issueId });
  }

  async getIssueActivities(issueId: string) {
    return Activity.find({ issue: issueId })
      .populate('actor', 'name email avatar')
      .sort({ createdAt: 1 });
  }
}

export const issueService = new IssueService();
