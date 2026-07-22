import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditLog, AuditLogDocument } from '../schemas/audit-log.schema';
import { AuditAction } from '../common/enums/audit-action.enum';

export interface AuditEventPayload {
  actor: Types.ObjectId | string;
  resourceType: string;
  resourceId: Types.ObjectId | string;
  resourceName: string;
  action: AuditAction;
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

  @OnEvent('audit.log', { async: true })
  async handleAuditLogEvent(payload: AuditEventPayload) {
    try {
      const log = new this.auditLogModel({
        ...payload,
        actor:
          typeof payload.actor === 'string'
            ? new Types.ObjectId(payload.actor)
            : payload.actor,
        resourceId:
          typeof payload.resourceId === 'string'
            ? new Types.ObjectId(payload.resourceId)
            : payload.resourceId,
      });
      await log.save();
    } catch (error) {
      // We only log the error to console/logger to prevent audit failures from breaking the app
      this.logger.error(
        `Failed to save audit log for action ${payload.action} on ${payload.resourceType}`,
        error,
      );
    }
  }

  async findRecent(limit: number = 20) {
    return this.auditLogModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('actor', 'name email')
      .lean()
      .exec();
  }
}
