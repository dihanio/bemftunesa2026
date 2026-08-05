import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type PkkmbPublishConfigDocument = HydratedDocument<PkkmbPublishConfig>;

@Schema({ timestamps: true, collection: 'pkkmb_publish_config' })
export class PkkmbPublishConfig {
  @Prop({ default: false })
  isPublished: boolean;

  @Prop()
  publishedAt?: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  publishedBy?: Types.ObjectId;

  @Prop({ default: 'NOW' })
  publishType: 'NOW' | 'SCHEDULED';

  @Prop()
  scheduledAt?: Date;
}

export const PkkmbPublishConfigSchema =
  SchemaFactory.createForClass(PkkmbPublishConfig);
