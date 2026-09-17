import mongoose from 'mongoose';
import { SavedFilter, ISavedFilterDocument } from '../models/SavedFilter';
import { AppError } from '../utils/AppError';

export interface CreateSavedFilterInput {
  name: string;
  description?: string;
  jql?: string;
  filterConfig?: {
    status?: string[];
    priority?: string[];
    type?: string[];
    assignee?: string[];
    search?: string;
  };
  isShared?: boolean;
}

export class SavedFilterService {
  async createFilter(
    projectId: string,
    userId: mongoose.Types.ObjectId,
    input: CreateSavedFilterInput
  ): Promise<ISavedFilterDocument> {
    return SavedFilter.create({
      ...input,
      project: projectId,
      user: userId,
    });
  }

  async getFilters(
    projectId: string,
    userId: mongoose.Types.ObjectId
  ): Promise<ISavedFilterDocument[]> {
    return SavedFilter.find({
      project: projectId,
      $or: [{ user: userId }, { isShared: true }],
    })
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 });
  }

  async deleteFilter(
    filterId: string,
    userId: mongoose.Types.ObjectId
  ): Promise<void> {
    const filter = await SavedFilter.findById(filterId);
    if (!filter) throw new AppError('Filter not found', 404, 'FILTER_NOT_FOUND');
    if (filter.user.toString() !== userId.toString()) {
      throw new AppError('Cannot delete a filter created by another user', 403, 'FORBIDDEN');
    }
    await SavedFilter.findByIdAndDelete(filterId);
  }
}

export const savedFilterService = new SavedFilterService();
