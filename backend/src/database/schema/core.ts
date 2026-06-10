import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Activity {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  @Prop({ required: true })
  action!: string; // e.g., 'CREATE_PROKER', 'LOGIN'

  @Prop()
  description?: string;

  @Prop()
  targetType?: string; // e.g., 'Proker', 'Document'

  @Prop({ type: Types.ObjectId })
  targetId?: Types.ObjectId;

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);

@Schema({ timestamps: true })
export class SiteSetting {
  @Prop({ required: true, unique: true })
  key!: string;

  @Prop({ required: true, type: MongooseSchema.Types.Mixed })
  value!: any;

  @Prop()
  description?: string;

  @Prop({
    type: String,
    enum: ['string', 'number', 'boolean', 'json', 'array'],
    default: 'string',
  })
  type!: string;
}

export const SiteSettingSchema = SchemaFactory.createForClass(SiteSetting);

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  recipientId!: Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  message!: string;

  @Prop({ default: false })
  isRead!: boolean;

  @Prop({
    type: String,
    enum: ['system', 'ims', 'shop', 'info'],
    default: 'info',
  })
  category!: string;

  @Prop({ type: Object })
  actionData?: Record<string, any>; // e.g., { link: '/ims/proker/123' }
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
