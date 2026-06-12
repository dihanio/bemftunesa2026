import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BEMDocumentDocument = HydratedDocument<BEMDocument>;

@Schema({ timestamps: true })
export class BEMDocument {
  @Prop({ required: true })
  title!: string;

  @Prop({
    type: String,
    enum: ['Surat Keluar', 'Surat Masuk', 'Proposal', 'LPJ', 'Lainnya'],
    required: true,
  })
  type!: string;

  @Prop()
  documentNumber?: string;

  @Prop()
  qrUuid?: string; // For public QR verification

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  creatorId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Department' })
  departmentId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Proker' })
  prokerId?: Types.ObjectId;

  @Prop()
  fileUrl?: string;

  @Prop()
  draftFileUrl?: string; // Surat awal (belum bernomor)

  @Prop()
  finalFileUrl?: string; // Surat final (sudah bernomor)

  @Prop()
  signedFileUrl?: string; // Surat yang sudah di TTD & Stempel

  @Prop({
    type: String,
    enum: [
      'Draft',
      'Pending',
      'Approved',
      'Rejected',
      'Menunggu Asistensi',
      'Revisi Nomor Surat',
      'Menunggu ACC Sekretaris',
      'Menunggu TTD Ketua',
      'Selesai',
      'Ditolak'
    ],
    default: 'Menunggu Asistensi',
  })
  status!: string;

  @Prop()
  signedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  signedById?: Types.ObjectId;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ default: null })
  deletedAt?: Date;
}

export const BEMDocumentSchema = SchemaFactory.createForClass(BEMDocument);
