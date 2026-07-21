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
  studyProgram: string; // Program Studi (e.g. "Teknik Informatika")

  @Prop()
  batch: string; // Angkatan (e.g. "2023")

  @Prop()
  position: string;

  @Prop({ sparse: true, unique: true })
  googleId?: string;

  @Prop()
  avatar: string; // Simple string URL from Google SSO

  @Prop()
  publicPhoto?: string; // Khusus halaman publik struktur, foto pop-up/no-bg (diatur oleh Super Admin)

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Role', required: true })
  role: import('mongoose').Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'PkkmbGroup' })
  pkkmbGroup?: import('mongoose').Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLoginAt: Date;

  @Prop()
  deletedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ cabinetPeriod: 1, department: 1, isActive: 1 });
UserSchema.index({ department: 1, isActive: 1 });
UserSchema.index({ pkkmbGroup: 1, deletedAt: 1 });
