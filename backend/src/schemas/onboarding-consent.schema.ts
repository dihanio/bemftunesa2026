import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type OnboardingConsentDocument = HydratedDocument<OnboardingConsent>;

@Schema({ timestamps: true, collection: 'onboarding_consent' })
export class OnboardingConsent {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  studentId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, default: '1.0' })
  statementVersion: string;

  @Prop({ required: true })
  statementText: string;

  // Data URL gambar tanda tangan (PNG).
  @Prop({ required: true })
  signature: string;

  @Prop({ required: true })
  consentedAt: Date;

  @Prop({ required: true })
  completedAt: Date;
}

export const OnboardingConsentSchema =
  SchemaFactory.createForClass(OnboardingConsent);
