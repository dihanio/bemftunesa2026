import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type WorkflowDefinitionDocument = WorkflowDefinition & Document;

@Schema({ _id: false })
export class WorkflowCondition {
  @Prop({ required: true })
  type: string;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  configuration: Record<string, any>;
}

export const WorkflowConditionSchema = SchemaFactory.createForClass(WorkflowCondition);

@Schema({ _id: false })
export class WorkflowTransition {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  action: string;

  @Prop()
  fromStage: string; // null/undefined if it's an initial transition

  @Prop({ required: true })
  toStage: string;

  @Prop({ default: 0 })
  priority: number;

  @Prop({ type: [WorkflowConditionSchema], default: [] })
  conditions: WorkflowCondition[];
}

export const WorkflowTransitionSchema = SchemaFactory.createForClass(WorkflowTransition);

@Schema({ _id: false })
export class WorkflowStage {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ default: 0 })
  order: number;

  @Prop({ type: [String], default: [] })
  assignedRole: string[];

  @Prop({ type: [String], default: [] })
  assignedPosition: string[];

  @Prop({ enum: ['single', 'parallel', 'majority', 'sequential'], default: 'single' })
  approvalMode: string;

  @Prop({ default: 0 })
  expectedDuration: number;

  @Prop({ default: 0 })
  reminderInterval: number;

  @Prop({ default: 0 })
  escalationDuration: number;

  @Prop({ type: [String], default: [] })
  allowedActions: string[];

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  metadata: Record<string, any>;
}

export const WorkflowStageSchema = SchemaFactory.createForClass(WorkflowStage);

@Schema({ timestamps: true })
export class WorkflowDefinition {
  @Prop({ required: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  documentType: string;

  @Prop({ required: true, default: 1 })
  version: number;

  @Prop({ enum: ['draft', 'published', 'deprecated'], default: 'draft' })
  status: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  publishedBy: Types.ObjectId;

  @Prop()
  publishedAt: Date;

  @Prop({ type: [WorkflowStageSchema], default: [] })
  stages: WorkflowStage[];

  @Prop({ type: [WorkflowTransitionSchema], default: [] })
  transitions: WorkflowTransition[];
}

export const WorkflowDefinitionSchema = SchemaFactory.createForClass(WorkflowDefinition);

// Ensure uniqueness of workflow versions
WorkflowDefinitionSchema.index({ code: 1, version: 1 }, { unique: true });
