import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type DepartmentQuotaDocument = HydratedDocument<DepartmentQuota>;

const FIVE_GB = 5 * 1024 * 1024 * 1024;

@Schema({ timestamps: true, collection: 'department_quotas' })
export class DepartmentQuota {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Department', required: true, unique: true })
  departmentId: Types.ObjectId;

  /** Max bytes allowed. Default 5GB */
  @Prop({ default: FIVE_GB })
  maxBytes: number;

  /** Current usage in bytes */
  @Prop({ default: 0 })
  usedBytes: number;
}

export const DepartmentQuotaSchema = SchemaFactory.createForClass(DepartmentQuota);
