import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class AuditLog {
  @Prop({ required: true })
  entityName: string;

  @Prop({ required: true })
  entityId: string;

  @Prop({
    enum: ['CREATE', 'UPDATE', 'DELETE', 'RESTORE'],
    required: true,
  })
  action: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  summary: string;

  // Only populated for heavy entities (User, Program, Document)
  @Prop({ type: MongooseSchema.Types.Mixed })
  dataBefore: any;

  // Only populated for heavy entities (User, Program, Document)
  @Prop({ type: MongooseSchema.Types.Mixed })
  dataAfter: any;

  @Prop()
  ipAddress: string;

  @Prop()
  userAgent: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ entityName: 1, entityId: 1 });
AuditLogSchema.index({ user: 1 });
AuditLogSchema.index({ createdAt: -1 });
