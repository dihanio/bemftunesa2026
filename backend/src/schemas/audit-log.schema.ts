import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({ timestamps: true, collection: 'audit_logs' })
export class AuditLog {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  actor: Types.ObjectId;

  @Prop({ required: true, trim: true })
  actorRole: string;

  @Prop({ required: true, trim: true })
  resourceType: string;

  @Prop({ type: MongooseSchema.Types.ObjectId })
  resourceId?: Types.ObjectId;

  @Prop({ trim: true })
  resourceName?: string;

  @Prop({ required: true, trim: true })
  action: string; // e.g. LOGIN, LOGOUT, CREATE, UPDATE, DELETE, PUBLISH, APPROVE, REJECT, EXPORT

  @Prop({ type: Object })
  before?: Record<string, unknown>;

  @Prop({ type: Object })
  after?: Record<string, unknown>;

  @Prop({ trim: true })
  ipAddress?: string;

  @Prop({ trim: true })
  userAgent?: string;

  @Prop({ trim: true })
  requestId?: string;

  @Prop({ type: Object })
  details?: Record<string, unknown>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ resourceType: 1, resourceId: 1 });
AuditLogSchema.index({ actor: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ createdAt: -1 });
