import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class PKKMBParticipant {
  @Prop({ required: true, unique: true })
  nim!: string;

  @Prop({ required: true })
  name!: string;

  @Prop()
  email?: string;

  @Prop()
  phone?: string;

  @Prop()
  group?: string; // e.g., 'Kelompok 1'

  @Prop({ type: Types.ObjectId })
  groupId?: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['Active', 'Absent', 'Resigned'],
    default: 'Active',
  })
  status!: string;
}

export const PKKMBParticipantSchema =
  SchemaFactory.createForClass(PKKMBParticipant);

@Schema({ timestamps: true })
export class PKKMBTask {
  @Prop({ required: true })
  title!: string;

  @Prop()
  description?: string;

  @Prop()
  deadline?: Date;

  @Prop({ type: String, enum: ['individu', 'kelompok'], default: 'individu' })
  type!: string;

  @Prop({ type: String, enum: ['File', 'Link', 'Text'], default: 'File' })
  submissionType!: string;

  @Prop({ type: [Object] })
  attachments?: Record<string, any>[];

  @Prop({ default: null })
  deletedAt?: Date;
}

export const PKKMBTaskSchema = SchemaFactory.createForClass(PKKMBTask);

@Schema({ timestamps: true })
export class PKKMBSubmission {
  @Prop({ type: Types.ObjectId, ref: 'PKKMBTask', required: true })
  taskId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'PKKMBParticipant', required: true })
  participantId!: Types.ObjectId;

  @Prop()
  contentUrl?: string;

  @Prop()
  textContent?: string;

  @Prop()
  score?: number;

  @Prop()
  feedback?: string;

  @Prop({ type: String, enum: ['Submitted', 'Graded'], default: 'Submitted' })
  status!: string;
}

export const PKKMBSubmissionSchema =
  SchemaFactory.createForClass(PKKMBSubmission);

@Schema({ timestamps: true })
export class PKKMBAnnouncement {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  content!: string;

  @Prop({
    type: String,
    enum: ['Umum', 'Urgent', 'Perubahan Jadwal'],
    default: 'Umum',
  })
  category!: string;

  @Prop({ default: false })
  isUrgent!: boolean;

  @Prop()
  author?: string;

  @Prop({ default: null })
  deletedAt?: Date;
}

export const PKKMBAnnouncementSchema =
  SchemaFactory.createForClass(PKKMBAnnouncement);

@Schema({ timestamps: true })
export class PKKMBSchedule {
  @Prop({ required: true })
  day!: number;

  @Prop({ required: true })
  title!: string;

  @Prop()
  startTime?: Date;

  @Prop()
  endTime?: Date;

  @Prop()
  location?: string;

  @Prop()
  speaker?: string;

  @Prop()
  description?: string;
}

export const PKKMBScheduleSchema = SchemaFactory.createForClass(PKKMBSchedule);

@Schema({ timestamps: true })
export class PKKMBGallery {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  url!: string;

  @Prop()
  category?: string; // e.g., 'Day 1', 'Closing'

  @Prop()
  videoUrl?: string;
}

export const PKKMBGallerySchema = SchemaFactory.createForClass(PKKMBGallery);

@Schema({ timestamps: true })
export class PKKMBConfig {
  @Prop({ required: true })
  year!: string; // e.g., '2026'

  @Prop({ default: false })
  isRegistrationOpen!: boolean;

  @Prop()
  guidebookUrl?: string;
}

export const PKKMBConfigSchema = SchemaFactory.createForClass(PKKMBConfig);
