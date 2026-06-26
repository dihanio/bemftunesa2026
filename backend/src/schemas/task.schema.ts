import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type TaskDocument = HydratedDocument<Task>;

@Schema({ timestamps: true })
export class Task {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'CabinetPeriod', required: true })
  cabinetPeriod: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Department', required: true })
  department: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Program' })
  program: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], default: [] })
  assignees: MongooseSchema.Types.ObjectId[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  creator: MongooseSchema.Types.ObjectId;

  @Prop()
  deadline: Date;

  @Prop({
    enum: ['low', 'normal', 'high'],
    default: 'normal',
    required: true,
  })
  priority: string;

  @Prop({
    enum: ['todo', 'in_progress', 'review', 'completed', 'cancelled'],
    default: 'todo',
    required: true,
  })
  status: string;

  @Prop()
  deletedAt?: Date;
}

export const TaskSchema = SchemaFactory.createForClass(Task);

TaskSchema.index({ cabinetPeriod: 1, department: 1, status: 1, assignees: 1 });
