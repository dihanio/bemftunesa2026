import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Aspiration {
  @Prop({ required: true })
  name!: string;

  @Prop()
  email?: string;

  @Prop({ required: true })
  message!: string;

  @Prop({
    type: String,
    enum: ['Akademik', 'Fasilitas', 'Organisasi', 'Lainnya'],
    default: 'Lainnya',
  })
  category!: string;

  @Prop({
    type: String,
    enum: ['Pending', 'Reviewed', 'Done'],
    default: 'Pending',
  })
  status!: string;

  @Prop({ default: false })
  isAnonymous!: boolean;
}

export const AspirationSchema = SchemaFactory.createForClass(Aspiration);
