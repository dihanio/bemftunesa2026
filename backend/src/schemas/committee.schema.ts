import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type CommitteeDocument = HydratedDocument<Committee>;
export type CommitteeMemberDocument = HydratedDocument<CommitteeMember>;

/**
 * CommitteeMember — embedded subdoc inside Committee.
 * Jabatan kepanitiaan TIDAK mengubah jabatan organisasi (per dokumen BEM FT).
 */
@Schema({ _id: false })
export class CommitteeMember {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  role: string; // Jabatan kepanitiaan (free-text): "Ketua Pelaksana", "Koordinator Acara", dll

  @Prop({ default: () => new Date() })
  joinedAt: Date;
}

/**
 * Committee — Kepanitiaan yang dibentuk untuk satu Program Kerja.
 * Bersifat sementara (berakhir ketika Program Kerja selesai).
 * Satu Program Kerja dapat memiliki satu Kepanitiaan.
 */
@Schema({ timestamps: true, collection: 'committees' })
export class Committee {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Program', required: true, unique: true })
  programId: Types.ObjectId; // 1 proker = 1 kepanitiaan

  @Prop({ required: true, trim: true })
  name: string; // e.g. "Panitia Workshop AI 2026"

  @Prop({ trim: true })
  description: string;

  @Prop({ type: [CommitteeMember], default: [] })
  members: CommitteeMember[];

  @Prop({ default: true })
  isActive: boolean;
}

export const CommitteeSchema = SchemaFactory.createForClass(Committee);
CommitteeSchema.index({ programId: 1 }, { unique: true });
CommitteeSchema.index({ 'members.userId': 1 });
