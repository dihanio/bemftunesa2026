import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditLog, AuditLogDocument } from '../schemas/audit-log.schema';

export interface AuditLogPayload {
  actor: Types.ObjectId | string;
  actorRole: string;
  action: string; // LOGIN, LOGOUT, CREATE, UPDATE, DELETE, PUBLISH, APPROVE, REJECT, EXPORT
  resourceType: string;
  resourceId?: Types.ObjectId | string;
  resourceName?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  details?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async log(payload: AuditLogPayload) {
    try {
      const logEntry = new this.auditLogModel({
        ...payload,
        actor:
          typeof payload.actor === 'string'
            ? new Types.ObjectId(payload.actor)
            : payload.actor,
        resourceId:
          payload.resourceId && typeof payload.resourceId === 'string'
            ? new Types.ObjectId(payload.resourceId)
            : payload.resourceId,
      });
      await logEntry.save();
    } catch (error) {
      this.logger.error(
        `Gagal menyimpan audit log [${payload.action}] pada ${payload.resourceType}:`,
        error,
      );
    }
  }

  @OnEvent('audit.log', { async: true })
  async handleAuditLogEvent(payload: AuditLogPayload) {
    await this.log(payload);
  }

  async findAll(limit: number = 50, page: number = 1) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.auditLogModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('actor', 'name email nim role division')
        .lean()
        .exec(),
      this.auditLogModel.countDocuments(),
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
