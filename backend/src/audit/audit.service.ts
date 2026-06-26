import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from '../schemas/audit-log.schema';
import {
  PaginationQueryDto,
  buildPaginateQuery,
  buildPaginateResponse,
} from '../common/dto/pagination.dto';

interface CreateAuditLogDto {
  user: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  summary?: string;
  changes?: { before?: unknown; after?: unknown };
}

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name)
    private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async log(data: CreateAuditLogDto) {
    return this.auditLogModel.create({
      ...data,
      timestamp: new Date(),
    });
  }

  async findAll(
    query: PaginationQueryDto & {
      entity?: string;
      action?: string;
      user?: string;
    },
  ) {
    const { skip, limit, sortObj } = buildPaginateQuery(query);
    const filter: Record<string, unknown> = {};

    if (query.entity) filter.entity = query.entity;
    if (query.action) filter.action = query.action;
    if (query.user) filter.user = query.user;

    const [data, total] = await Promise.all([
      this.auditLogModel
        .find(filter)
        .populate('user', 'name email')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.auditLogModel.countDocuments(filter).exec(),
    ]);

    return buildPaginateResponse(data, total, query);
  }
}
