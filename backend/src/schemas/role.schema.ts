import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type RoleDocument = HydratedDocument<Role>;

@Schema({ timestamps: true })
export class Role {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true })
  slug: string;

  @Prop()
  description: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Permission' }], default: [] })
  permissions: MongooseSchema.Types.ObjectId[];

  @Prop({ default: false })
  isSystem: boolean;

  @Prop({ type: String, enum: ['global', 'department', 'pkkmb_group'], default: 'department' })
  scope: 'global' | 'department' | 'pkkmb_group';
}

export const RoleSchema = SchemaFactory.createForClass(Role);
