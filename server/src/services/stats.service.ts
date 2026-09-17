import { Issue } from '../models/Issue';
import { Sprint } from '../models/Sprint';
import mongoose from 'mongoose';

export class StatsService {
  async getProjectStats(projectId: string) {
    const projectObjId = new mongoose.Types.ObjectId(projectId);
    const now = new Date();

    const [statusCounts, priorityCounts, typeCounts, activeSprint, overdue] = await Promise.all([
      Issue.aggregate([
        { $match: { project: projectObjId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Issue.aggregate([
        { $match: { project: projectObjId } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      Issue.aggregate([
        { $match: { project: projectObjId } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      Sprint.findOne({ project: projectId, status: 'active' }),
      Issue.countDocuments({
        project: projectId,
        dueDate: { $lt: now },
        status: { $ne: 'done' },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    statusCounts.forEach((s) => {
      statusMap[s._id] = s.count;
    });

    const total = Object.values(statusMap).reduce((a, b) => a + b, 0);
    const done = statusMap.done || 0;
    const open = total - done;

    let sprintProgress = null;
    if (activeSprint) {
      const [sprintTotal, sprintDone] = await Promise.all([
        Issue.countDocuments({ sprint: activeSprint._id }),
        Issue.countDocuments({ sprint: activeSprint._id, status: 'done' }),
      ]);
      sprintProgress = {
        sprint: activeSprint,
        total: sprintTotal,
        done: sprintDone,
        percentage: sprintTotal > 0 ? Math.round((sprintDone / sprintTotal) * 100) : 0,
      };
    }

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const completedOverTime = await Issue.aggregate([
      {
        $match: {
          project: projectObjId,
          status: 'done',
          updatedAt: { $gte: twoWeeksAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return {
      total,
      open,
      done,
      overdue,
      byStatus: statusCounts,
      byPriority: priorityCounts,
      byType: typeCounts,
      sprintProgress,
      completedOverTime,
    };
  }
}

export const statsService = new StatsService();
