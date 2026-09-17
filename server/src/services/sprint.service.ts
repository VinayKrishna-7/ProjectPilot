import mongoose from 'mongoose';
import { Sprint, ISprintDocument } from '../models/Sprint';
import { Issue } from '../models/Issue';
import { Notification } from '../models/Notification';
import { AppError } from '../utils/AppError';
import { runInTransaction } from '../config/database';
import { emitToProject } from '../sockets';
import { CreateSprintInput, UpdateSprintInput, CompleteSprintInput } from '../validators/sprint.validator';

export class SprintService {
  async createSprint(projectId: string, input: CreateSprintInput): Promise<ISprintDocument> {
    return Sprint.create({ ...input, project: projectId });
  }

  async getSprints(projectId: string): Promise<ISprintDocument[]> {
    return Sprint.find({ project: projectId }).sort({ createdAt: -1 });
  }

  async getSprintById(sprintId: string): Promise<ISprintDocument> {
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) throw new AppError('Sprint not found', 404, 'SPRINT_NOT_FOUND');
    return sprint;
  }

  async updateSprint(sprintId: string, input: UpdateSprintInput): Promise<ISprintDocument> {
    const sprint = await Sprint.findByIdAndUpdate(sprintId, { $set: input }, { new: true });
    if (!sprint) throw new AppError('Sprint not found', 404, 'SPRINT_NOT_FOUND');
    return sprint;
  }

  async deleteSprint(sprintId: string): Promise<void> {
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) throw new AppError('Sprint not found', 404, 'SPRINT_NOT_FOUND');
    if (sprint.status === 'active') throw new AppError('Cannot delete an active sprint', 400, 'SPRINT_ACTIVE');
    // Move issues back to backlog
    await Issue.updateMany({ sprint: sprintId }, { $unset: { sprint: 1 } });
    await Sprint.findByIdAndDelete(sprintId);
  }

  async startSprint(
    sprintId: string,
    projectId: string,
    actorId: mongoose.Types.ObjectId
  ): Promise<ISprintDocument> {
    // Only one active sprint at a time
    const activeSprint = await Sprint.findOne({ project: projectId, status: 'active' });
    if (activeSprint) throw new AppError('A sprint is already active', 409, 'SPRINT_ALREADY_ACTIVE');

    const sprint = await Sprint.findByIdAndUpdate(
      sprintId,
      { $set: { status: 'active', startDate: new Date() } },
      { new: true }
    );
    if (!sprint) throw new AppError('Sprint not found', 404, 'SPRINT_NOT_FOUND');

    // Notify all assignees in the sprint
    const assigneeIds = await Issue.find({ sprint: sprintId }).distinct('assignee');
    if (assigneeIds.length > 0) {
      const notifications = assigneeIds
        .filter((id) => id && id.toString() !== actorId.toString())
        .map((assigneeId) => ({
          recipient: assigneeId,
          actor: actorId,
          type: 'sprint_started' as const,
          message: `Sprint "${sprint.name}" has started`,
          entityType: 'sprint',
          entityId: sprintId,
        }));
      if (notifications.length > 0) await Notification.insertMany(notifications);
    }

    emitToProject(projectId, 'sprint_started', sprint);
    return sprint;
  }

  async completeSprint(
    sprintId: string,
    projectId: string,
    actorId: mongoose.Types.ObjectId,
    input: CompleteSprintInput
  ): Promise<{ sprint: ISprintDocument; movedIssuesCount: number }> {
    return runInTransaction(async (session) => {
      const opts = session ? { session } : {};

      const sprint = await Sprint.findById(sprintId, null, opts);
      if (!sprint) throw new AppError('Sprint not found', 404, 'SPRINT_NOT_FOUND');
      if (sprint.status !== 'active') throw new AppError('Sprint is not active', 400, 'SPRINT_NOT_ACTIVE');

      // Find incomplete issues
      const incompleteIssues = await Issue.find({
        sprint: sprintId,
        status: { $ne: 'done' },
      }, null, opts);

      let movedIssuesCount = 0;
      if (incompleteIssues.length > 0) {
        if (input.incompleteIssueAction === 'backlog') {
          await Issue.updateMany(
            { sprint: sprintId, status: { $ne: 'done' } },
            { $unset: { sprint: 1 }, $set: { boardColumn: null } },
            opts
          );
        } else if (input.incompleteIssueAction === 'next_sprint' && input.targetSprintId) {
          const targetSprint = await Sprint.findById(input.targetSprintId, null, opts);
          if (!targetSprint) throw new AppError('Target sprint not found', 404, 'SPRINT_NOT_FOUND');
          await Issue.updateMany(
            { sprint: sprintId, status: { $ne: 'done' } },
            { $set: { sprint: input.targetSprintId } },
            opts
          );
        }
        movedIssuesCount = incompleteIssues.length;
      }

      const completed = await Sprint.findByIdAndUpdate(
        sprintId,
        { $set: { status: 'completed', endDate: new Date() } },
        { new: true, ...opts }
      );
      if (!completed) throw new AppError('Sprint not found', 404, 'SPRINT_NOT_FOUND');

      emitToProject(projectId, 'sprint_completed', { sprint: completed, movedIssuesCount });
      return { sprint: completed, movedIssuesCount };
    });
  }

  async getBacklog(projectId: string) {
    const issues = await Issue.find({ project: projectId, sprint: null })
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .populate('labels', 'name color')
      .sort({ position: 1 });
    return issues;
  }
}

export const sprintService = new SprintService();
