import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type PartnerDocument = HydratedDocument<Partner>;

@Schema({ timestamps: true, collection: 'partners' })
export class Partner {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Media' })
  logo: MongooseSchema.Types.ObjectId;

  @Prop({ trim: true })
  website: string;

  @Prop({ trim: true })
  description: string;

  @Prop({
    type: String,
    enum: ['partner', 'sponsor', 'media_partner', 'supporter'],
    default: 'partner',
  })
  type: string;

  /**
   * sponsor tier: platinum / gold / silver / bronze (only for type=sponsor)
   */
  @Prop({ type: String, enum: ['platinum', 'gold', 'silver', 'bronze', null], default: null })
  tier: string;

  @Prop({ default: true })
  isActive: boolean;

  /** Period label, e.g. "2024/2025" */
  @Prop({ trim: true })
  period: string;

  @Prop({ type: Number, default: 0 })
  order: number;
}

export const PartnerSchema = SchemaFactory.createForClass(Partner);
PartnerSchema.index({ type: 1, isActive: 1 });
PartnerSchema.index({ period: 1 });
