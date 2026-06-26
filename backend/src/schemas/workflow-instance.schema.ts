import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type WorkflowInstanceDocument = WorkflowInstance & Document;

export enum DocumentState {
  DRAFT = 'DRAFT',
  GENERATED = 'GENERATED',
  EDITED = 'EDITED',
  SUBMITTED = 'SUBMITTED',
  REVIEWED = 'REVIEWED',
  REVISION = 'REVISION',
  REJECTED = 'REJECTED',
  APPROVED = 'APPROVED',
  NUMBERED = 'NUMBERED',
  SIGNED = 'SIGNED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  CANCELLED = 'CANCELLED'
}

export enum WorkflowAction {
  SUBMIT = 'SUBMIT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  REQUEST_REVISION = 'REQUEST_REVISION',
  RETURN = 'RETURN',
  CANCEL = 'CANCEL',
  PUBLISH = 'PUBLISH',
  ARCHIVE = 'ARCHIVE'
}

@Schema({ _id: false })
export class WorkflowHistoryEntry {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  actor: Types.ObjectId;

  @Prop({ required: true })
  action: string; // The action name that triggered this transition

  @Prop()
  fromStageId: string;

  @Prop()
  toStageId: string;

  // Backward compatibility with previous simple workflow
  @Prop({ enum: DocumentState })
  fromState: DocumentState;

  @Prop({ enum: DocumentState })
  toState: DocumentState;

  @Prop()
  comment: string;

  @Prop({ default: Date.now })
  timestamp: Date;

  @Prop({ default: 0 })
  durationMinutes: number; // Duration spent in the fromStageId

  @Prop({ enum: ['on_time', 'late', 'escalated'] })
  slaStatus: string;
}

export const WorkflowHistoryEntrySchema = SchemaFactory.createForClass(WorkflowHistoryEntry);

@Schema({ timestamps: true })
export class WorkflowInstance {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  documentId: Types.ObjectId;

  @Prop({ required: true })
  documentType: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'WorkflowDefinition', required: true })
  workflowDefinition: Types.ObjectId;

  @Prop({ default: 'draft' })
  currentStageId: string; // Dynamic stage tracker

  @Prop({ required: true, enum: DocumentState, default: DocumentState.DRAFT })
  currentState: DocumentState; // Maintained for backward compatibility

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'User', default: [] })
  currentApprovers: Types.ObjectId[]; // Parallel workflow trackers

  @Prop({ type: [WorkflowHistoryEntrySchema], default: [] })
  history: WorkflowHistoryEntry[];
}

export const WorkflowInstanceSchema = SchemaFactory.createForClass(WorkflowInstance);
