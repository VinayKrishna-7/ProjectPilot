import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';

export interface AuthenticatedRequest extends Request {
  user?: {
    _id: Types.ObjectId;
    email: string;
    name: string;
  };
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface IssueFilterQuery extends PaginationQuery {
  status?: string;
  priority?: string;
  type?: string;
  assignee?: string;
  reporter?: string;
  sprint?: string;
  label?: string;
  search?: string;
  dueDate?: string;
  createdAt?: string;
  boardColumn?: string;
}

export type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;
