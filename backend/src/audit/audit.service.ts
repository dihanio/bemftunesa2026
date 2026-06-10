import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog } from '../database/schema/security';

export interface AuditLogInput {
  actorId?: string;
  category: string;
  action: string;
  targetType?: string;
  targetId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLog>,
  ) {}

  async record(input: AuditLogInput) {
    return this.auditLogModel.create({
      ...input,
      actorId: input.actorId ? new Types.ObjectId(input.actorId) : undefined,
    });
  }

  async list(query: any) {
    const page = Math.max(1, Number(query?.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query?.limit || 20)));
    const filter: Record<string, unknown> = {};

    if (query?.category) {
      filter.category = query.category;
    }

    if (query?.action) {
      filter.action = query.action;
    }

    if (query?.targetType) {
      filter.targetType = query.targetType;
    }

    const [logs, totalDocs] = await Promise.all([
      this.auditLogModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.auditLogModel.countDocuments(filter),
    ]);

    return {
      data: logs,
      meta: {
        page,
        limit,
        totalDocs,
        totalPages: Math.ceil(totalDocs / limit),
      },
    };
  }
}
