import { z } from 'zod';
import { PaginationQuerySchema } from '../common/dto/pagination.dto';

export const CreateAspirationSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Format email tidak valid').optional(),
  message: z.string().min(10, 'Aspirasi minimal 10 karakter'),
  category: z
    .enum(['Akademik', 'Fasilitas', 'Organisasi', 'Lainnya'])
    .default('Lainnya'),
  isAnonymous: z.boolean().default(false),
});

export type CreateAspirationDto = z.infer<typeof CreateAspirationSchema>;

export const ListArticlesQuerySchema = PaginationQuerySchema.extend({
  category: z.string().optional(),
});
export type ListArticlesQueryDto = z.infer<typeof ListArticlesQuerySchema>;

export const ListProkerQuerySchema = PaginationQuerySchema.extend({
  departmentId: z.string().optional(),
});
export type ListProkerQueryDto = z.infer<typeof ListProkerQuerySchema>;

export const ListEventsQuerySchema = PaginationQuerySchema;
export type ListEventsQueryDto = z.infer<typeof ListEventsQuerySchema>;

export const ListGalleryQuerySchema = PaginationQuerySchema;
export type ListGalleryQueryDto = z.infer<typeof ListGalleryQuerySchema>;
