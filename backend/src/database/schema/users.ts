import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  name!: string;

  @Prop()
  nim?: string;

  @Prop()
  phone?: string;

  @Prop({
    type: String,
    enum: [
      'Super Admin',
      'Admin Sistem',
      'Admin',
      'KaBEM',
      'WaKaBEM',
      'Bendahara',
      'Sekretaris',
      'Kadep',
      'Wakadep',
      'Staff',
      'Panitia',
      'Guest',
    ],
    default: 'Guest',
  })
  role!: string;

  @Prop({ type: Types.ObjectId, ref: 'Department' })
  departmentId?: Types.ObjectId;

  @Prop()
  avatar?: string;

  @Prop({ default: 0 })
  points!: number;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop()
  lastLogin?: Date;

  @Prop({ default: null })
  deletedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

@Schema({ timestamps: true })
export class Department {
  @Prop({ required: true, unique: true })
  name!: string;

  @Prop({ required: true, unique: true })
  slug!: string;

  @Prop()
  code?: string; // e.g., 'DAGRI', 'LUGRI'

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  headId?: Types.ObjectId; // Kadep

  @Prop({ default: null })
  deletedAt?: Date;
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);
