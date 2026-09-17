import { Request, Response } from 'express';
import { boardService } from '../services/board.service';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const getBoard = asyncHandler(async (req: Request, res: Response) => {
  const board = await boardService.getBoardWithIssues(req.params.projectId, req.query.sprint as string);
  sendSuccess(res, board);
});

export const createColumn = asyncHandler(async (req: Request, res: Response) => {
  const column = await boardService.createColumn(req.params.projectId, req.body);
  sendSuccess(res, { column }, 201);
});

export const updateColumn = asyncHandler(async (req: Request, res: Response) => {
  const column = await boardService.updateColumn(req.params.columnId, req.params.projectId, req.body);
  sendSuccess(res, { column });
});

export const deleteColumn = asyncHandler(async (req: Request, res: Response) => {
  await boardService.deleteColumn(req.params.columnId, req.params.projectId, req.body.moveToColumnId);
  sendSuccess(res, null, 200, 'Column deleted');
});

export const reorderColumns = asyncHandler(async (req: Request, res: Response) => {
  await boardService.reorderColumns(req.params.projectId, req.body.columns);
  sendSuccess(res, null, 200, 'Columns reordered');
});
