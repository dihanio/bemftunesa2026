import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type PkkmbAnnouncementDocument = HydratedDocument<PkkmbAnnouncement>;

@Schema({ timestamps: true })
export class PkkmbAnnouncement {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: [String] })
  attachments: string[];

  @Prop({ required: true, enum: ['all', 'specific_groups'], default: 'all' })
  targetAudience: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'PkkmbGroup' }] })
  targetGroups?: Types.ObjectId[];

  @Prop({ default: false })
  isPriority: boolean;

  // Aksi deep-link opsional: memetakan notifikasi ke halaman terkait di
  // aplikasi MABA (quiz / task / attendance / schedule). Tanpa field ini,
  // frontend melakukan inferensi dari judul/isi pengumuman.
  @Prop({
    enum: ['quiz', 'task', 'attendance', 'schedule', 'general'],
    default: 'general',
  })
  actionType?: string;

  @Prop()
  actionId?: string;

  @Prop({
    required: true,
    enum: ['PUBLISHED', 'DRAFT', 'SCHEDULED'],
    default: 'PUBLISHED',
  })
  status: string;

  @Prop()
  scheduledAt?: Date;

  @Prop()
  deletedAt?: Date;
}

export const PkkmbAnnouncementSchema =
  SchemaFactory.createForClass(PkkmbAnnouncement);

PkkmbAnnouncementSchema.index({ status: 1, isPriority: -1, createdAt: -1 });
PkkmbAnnouncementSchema.index({ targetAudience: 1, deletedAt: 1 });
PkkmbAnnouncementSchema.index({ deletedAt: 1 });
