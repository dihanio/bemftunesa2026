import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type ProgramDocument = HydratedDocument<Program>;

@Schema({ timestamps: true })
export class Program {
  @Prop({ default: '2026' })
  cabinetPeriod: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Department',
    required: true,
  })
  department: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  category: string;

  @Prop()
  description: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  pic: MongooseSchema.Types.ObjectId;

  @Prop({
    enum: ['planned', 'ongoing', 'completed', 'cancelled'],
    default: 'planned',
    required: true,
  })
  status: string;

  @Prop({ default: 0, min: 0, max: 100 })
  progress: number;

  @Prop()
  targetOutput: string;

  @Prop()
  startDate: Date;

  @Prop()
  endDate: Date;

  @Prop({ default: 0 })
  estimatedBudget: number;

  @Prop()
  fundingStatus: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Document' })
  tor: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Document' })
  proposal: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Document' })
  lpj: MongooseSchema.Types.ObjectId;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Document' }],
    default: [],
  })
  documentation: MongooseSchema.Types.ObjectId[];

  @Prop()
  evaluationNotes: string;

  @Prop()
  deletedAt?: Date;
}

export const ProgramSchema = SchemaFactory.createForClass(Program);

ProgramSchema.index({ cabinetPeriod: 1, department: 1, status: 1 });
