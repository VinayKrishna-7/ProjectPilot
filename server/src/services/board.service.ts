import { Board } from '../models/Board';
import { BoardColumn, IBoardColumnDocument } from '../models/BoardColumn';
import { Issue } from '../models/Issue';
import { AppError } from '../utils/AppError';
import { emitToProject } from '../sockets';

export class BoardService {
  async getBoardWithColumns(projectId: string) {
    const board = await Board.findOne({ project: projectId });
    if (!board) throw new AppError('Board not found', 404, 'BOARD_NOT_FOUND');

    const columns = await BoardColumn.find({ board: board._id }).sort({ position: 1 });
    return { board, columns };
  }

  async getBoardWithIssues(projectId: string, sprintId?: string) {
    const board = await Board.findOne({ project: projectId });
    if (!board) throw new AppError('Board not found', 404, 'BOARD_NOT_FOUND');

    const columns = await BoardColumn.find({ board: board._id }).sort({ position: 1 });

    // Get issues for each column
    const issueQuery: Record<string, unknown> = { project: projectId };
    if (sprintId) issueQuery.sprint = sprintId;

    const issues = await Issue.find(issueQuery)
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .populate('labels', 'name color')
      .sort({ boardColumn: 1, position: 1 });

    // Group issues by column
    const columnsWithIssues = columns.map((col) => ({
      ...col.toObject(),
      issues: issues.filter(
        (issue) => issue.boardColumn?.toString() === col._id.toString()
      ),
    }));

    // Uncolumned issues (backlog items on board)
    const uncolumnedIssues = issues.filter((issue) => !issue.boardColumn);

    return { board, columns: columnsWithIssues, uncolumnedIssues };
  }

  async createColumn(
    projectId: string,
    input: { name: string; status: string; color?: string }
  ): Promise<IBoardColumnDocument> {
    const board = await Board.findOne({ project: projectId });
    if (!board) throw new AppError('Board not found', 404, 'BOARD_NOT_FOUND');

    // Get next position
    const lastCol = await BoardColumn.findOne({ board: board._id }).sort({ position: -1 });
    const position = lastCol ? lastCol.position + 1 : 0;

    const column = await BoardColumn.create({
      board: board._id,
      name: input.name,
      status: input.status,
      color: input.color || '#6B7280',
      position,
    });

    emitToProject(projectId, 'column_created', column);
    return column;
  }

  async updateColumn(
    columnId: string,
    projectId: string,
    input: { name?: string; color?: string; position?: number }
  ): Promise<IBoardColumnDocument> {
    const column = await BoardColumn.findByIdAndUpdate(
      columnId,
      { $set: input },
      { new: true }
    );
    if (!column) throw new AppError('Column not found', 404, 'COLUMN_NOT_FOUND');
    emitToProject(projectId, 'column_updated', column);
    return column;
  }

  async deleteColumn(
    columnId: string,
    projectId: string,
    moveToColumnId?: string
  ): Promise<void> {
    const column = await BoardColumn.findById(columnId);
    if (!column) throw new AppError('Column not found', 404, 'COLUMN_NOT_FOUND');

    const issueCount = await Issue.countDocuments({ boardColumn: columnId });
    if (issueCount > 0 && !moveToColumnId) {
      throw new AppError(
        'Column has issues. Provide moveToColumnId to move them first.',
        400,
        'COLUMN_HAS_ISSUES'
      );
    }

    if (moveToColumnId && issueCount > 0) {
      const targetColumn = await BoardColumn.findById(moveToColumnId);
      if (!targetColumn) throw new AppError('Target column not found', 404, 'COLUMN_NOT_FOUND');
      await Issue.updateMany(
        { boardColumn: columnId },
        { $set: { boardColumn: moveToColumnId, status: targetColumn.status } }
      );
    }

    await BoardColumn.findByIdAndDelete(columnId);
    emitToProject(projectId, 'column_deleted', { columnId, moveToColumnId });
  }

  async reorderColumns(
    projectId: string,
    columnOrders: Array<{ id: string; position: number }>
  ): Promise<void> {
    const updates = columnOrders.map(({ id, position }) =>
      BoardColumn.findByIdAndUpdate(id, { position })
    );
    await Promise.all(updates);
    emitToProject(projectId, 'column_updated', { reordered: true });
  }
}

export const boardService = new BoardService();
