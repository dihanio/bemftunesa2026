import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MailLogDocument = HydratedDocument<MailLog>;

@Schema({ timestamps: true, collection: 'mail_logs' })
export class MailLog {
  @Prop({ required: true, trim: true })
  recipient: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  template: string;

  @Prop({ required: true })
  provider: string;

  @Prop({ required: true, enum: ['success', 'failed'] })
  status: string;

  @Prop({ default: Date.now })
  sentAt: Date;

  @Prop({ default: null })
  errorMessage: string;
}

export const MailLogSchema = SchemaFactory.createForClass(MailLog);
