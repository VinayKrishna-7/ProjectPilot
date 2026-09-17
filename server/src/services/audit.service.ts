import mongoose from 'mongoose';
import { Request } from 'express';
import { AuditLog, IAuditLogDocument } from '../models/AuditLog';
import { AuditAction } from '@taskflow/shared';
import { isDbConnected } from '../config/database';

export interface RecordAuditParams {
  workspaceId: string | mongoose.Types.ObjectId;
  actorId: string | mongoose.Types.ObjectId;
  action: AuditAction;
  entityType: string;
  entityId: string | mongoose.Types.ObjectId;
  metadata?: Record<string, unknown>;
  req?: Request;
}

export interface AuditLogFilters {
  action?: string;
  actor?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export class AuditService {
  async record(params: RecordAuditParams): Promise<IAuditLogDocument | null> {
    const ipAddress = params.req
      ? params.req.ip || (params.req.socket?.remoteAddress as string) || '127.0.0.1'
      : '127.0.0.1';
    const userAgent = params.req ? (params.req.headers['user-agent'] as string) || 'Unknown' : 'System';

    if (!isDbConnected()) {
      return null;
    }

    try {
      const log = await AuditLog.create({
        workspace: params.workspaceId,
        actor: params.actorId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId.toString(),
        metadata: params.metadata || {},
        ipAddress,
        userAgent,
      });
      return log;
    } catch (err) {
      console.error('Failed to write audit log:', err);
      return null;
    }
  }

  async getWorkspaceLogs(
    workspaceId: string,
    filters: AuditLogFilters
  ): Promise<{ logs: any[]; total: number; page: number; totalPages: number }> {
    const query: mongoose.FilterQuery<IAuditLogDocument> = {
      workspace: workspaceId,
    };

    if (filters.action) {
      query.action = filters.action as AuditAction;
    }
    if (filters.actor) {
      query.actor = filters.actor;
    }
    if (filters.entityType) {
      query.entityType = filters.entityType;
    }
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('actor', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}

export const auditService = new AuditService();
