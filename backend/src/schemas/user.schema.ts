import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'CabinetPeriod', required: true })
  cabinetPeriod: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Department' })
  department: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  nim: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop()
  phone: string;

  @Prop()
  position: string;

  @Prop({ sparse: true, unique: true })
  googleId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Media' })
  avatar: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Role', required: true })
  role: MongooseSchema.Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLoginAt: Date;

  @Prop()
  deletedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ cabinetPeriod: 1, department: 1, isActive: 1 });
