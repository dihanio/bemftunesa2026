import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop()
  cabinetPeriod: string; // Stored as a simple string field

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Department' })
  department: import('mongoose').Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  nim: string;

  @Prop()
  password?: string; // Untuk MABA login

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop()
  phone: string;

  @Prop()
  studyProgram: string; // Program Studi (e.g. "S1 Teknik Informatika")

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'StudyProgram',
    index: true,
  })
  studyProgramId?: import('mongoose').Types.ObjectId;

  @Prop({ enum: ['L', 'P'], default: 'L' })
  gender?: 'L' | 'P';

  @Prop()
  batch: string; // Angkatan (e.g. "2026")

  @Prop()
  position: string;

  @Prop()
  division?: string; // Decoupled operational Sie/Division (e.g. Acara, Humas, Pendamping, Penilaian, etc.)

  @Prop({ sparse: true, unique: true })
  googleId?: string;

  @Prop()
  avatar: string; // Simple string URL from Google SSO

  @Prop()
  ktmUrl?: string; // KTM / KTMS URL for Maba

  @Prop()
  publicPhoto?: string; // Khusus halaman publik struktur, foto pop-up/no-bg (diatur oleh Super Admin)

  @Prop()
  emergencyContact?: string;

  @Prop()
  shirtSize?: string;

  @Prop({ default: false })
  isOnboarded?: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Role', required: true })
  role: import('mongoose').Types.ObjectId;

  @Prop()
  imsRole?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'PkkmbGroup' })
  pkkmbGroup?: import('mongoose').Types.ObjectId;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'PkkmbAnnouncement' }],
    default: [],
  })
  announcementsRead?: import('mongoose').Types.ObjectId[];

  @Prop({ default: false })
  isKetuaGugus?: boolean;

  @Prop({ type: String })
  pendampingName?: string;

  @Prop({ type: String })
  pendampingWhatsApp?: string;

  @Prop({ type: String })
  pendampingEmail?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLoginAt: Date;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop()
  emailVerificationCode?: string;

  @Prop()
  emailVerificationExpiry?: Date;

  @Prop({ default: 0 })
  emailVerifyAttempts: number;

  @Prop({ default: 0 })
  emailResendCount: number;

  @Prop()
  emailLastResendAt?: Date;

  @Prop()
  emailLockedUntil?: Date;

  @Prop()
  deletedAt?: Date;

  @Prop({
    enum: ['PENDING_VERIFICATION', 'VERIFIED', 'REJECTED'],
    default: 'PENDING_VERIFICATION',
  })
  verificationStatus?: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';

  @Prop()
  verificationRejectionReason?: string;

  @Prop()
  verifiedAt?: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  verifiedBy?: import('mongoose').Types.ObjectId;

  @Prop({
    enum: ['UNASSIGNED', 'ASSIGNED', 'PUBLISHED'],
    default: 'UNASSIGNED',
  })
  assignmentStatus?: 'UNASSIGNED' | 'ASSIGNED' | 'PUBLISHED';

  @Prop()
  assignmentAssignedAt?: Date;

  @Prop()
  assignmentPublishedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ cabinetPeriod: 1, department: 1, isActive: 1 });
UserSchema.index({ department: 1, isActive: 1 });
UserSchema.index({ pkkmbGroup: 1, deletedAt: 1 });
UserSchema.index({ nim: 1 }, { sparse: true });
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1, deletedAt: 1 });
UserSchema.index({ studyProgram: 1, deletedAt: 1 });
UserSchema.index({ isActive: 1, deletedAt: 1 });
