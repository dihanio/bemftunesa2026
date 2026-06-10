import { z } from 'zod';

export const CreateOrderSchema = z.object({
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  nim: z.string().optional(),
  customerWhatsapp: z.string().optional(),
  deliveryMethod: z.enum(['pickup', 'delivery']).default('pickup'),
  address: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        variantId: z.string().optional(),
        quantity: z.number().int().min(1),
      }),
    )
    .min(1),
});

export const CreateProductSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  price: z.number().min(0),
  stock: z.number().int().min(0).optional(),
  images: z.array(z.string()).optional(),
  category: z
    .enum(['Apparel', 'Accessories', 'Limited Edition', 'Other'])
    .default('Other'),
  status: z.enum(['active', 'draft']).default('draft'),
});

export type CreateOrderDto = z.infer<typeof CreateOrderSchema>;
export type CreateProductDto = z.infer<typeof CreateProductSchema>;
