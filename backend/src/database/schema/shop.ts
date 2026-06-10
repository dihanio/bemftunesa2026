import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true })
  slug!: string;

  @Prop()
  description?: string;

  @Prop()
  price?: number;

  @Prop()
  stock?: number;

  @Prop([String])
  images?: string[];

  @Prop({ type: String, enum: ['active', 'draft'], default: 'draft' })
  status!: string;

  @Prop({ default: true })
  isAvailable!: boolean;

  @Prop({
    type: String,
    enum: ['Apparel', 'Accessories', 'Limited Edition', 'Other'],
    default: 'Other',
  })
  category!: string;

  @Prop({ default: null })
  deletedAt?: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

@Schema({ timestamps: true })
export class ProductVariant {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId!: Types.ObjectId;

  @Prop({ required: true })
  name!: string; // e.g., 'Size L', 'Warna Merah'

  @Prop()
  size?: string;

  @Prop()
  color?: string;

  @Prop()
  additionalPrice?: number;

  @Prop()
  stock?: number;

  @Prop({ default: false })
  isPreorder!: boolean;
}

export const ProductVariantSchema =
  SchemaFactory.createForClass(ProductVariant);

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, unique: true })
  orderCode!: string;

  @Prop({ required: true })
  customerName!: string;

  @Prop()
  nim?: string;

  @Prop({ required: true })
  customerEmail!: string;

  @Prop()
  customerWhatsapp?: string;

  @Prop({ type: String, enum: ['pickup', 'delivery'], default: 'pickup' })
  deliveryMethod!: string;

  @Prop()
  address?: string;

  @Prop({ required: true })
  totalAmount!: number;

  @Prop({
    type: String,
    enum: [
      'Pending',
      'Paid',
      'Processing',
      'Shipped',
      'Completed',
      'Cancelled',
    ],
    default: 'Pending',
  })
  status!: string;

  @Prop()
  paymentProofUrl?: string;

  @Prop({ default: null })
  deletedAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

@Schema({ timestamps: true })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ProductVariant' })
  variantId?: Types.ObjectId;

  @Prop({ required: true })
  quantity!: number;

  @Prop({ required: true })
  priceAtOrder!: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ timestamps: true })
export class ShopConfig {
  @Prop({ default: true })
  isMaintenance!: boolean;

  @Prop()
  announcement?: string;

  @Prop()
  whatsappAdmin?: string;
}

export const ShopConfigSchema = SchemaFactory.createForClass(ShopConfig);
